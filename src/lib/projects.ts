import { getDB } from "@/lib/db";
import type { Project, ProjectLink } from "@/data/projects";

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  image_url: string | null;
  github_url: string;
  sort_order: number;
};

type LinkRow = {
  project_id: string;
  label: string;
  url: string;
  sort_order: number;
};

export type ProjectWithSort = Project & { sortOrder: number };

export type ProjectInput = {
  id?: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string | null;
  githubUrl: string;
  links: ProjectLink[];
  sortOrder?: number;
};

function isMissingTableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("no such table") ||
    message.includes("D1_ERROR") ||
    message.includes("SQLITE_ERROR")
  );
}

function mapProject(row: ProjectRow, links: ProjectLink[]): Project {
  const project: Project = {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    githubUrl: row.github_url,
    links,
  };
  if (row.image_url) {
    project.imageUrl = row.image_url;
  }
  return project;
}

/** ASCII kebab slug from name, or a short random id when name is non-ASCII. */
export function slugifyProjectId(name: string): string {
  const ascii = name
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  if (ascii.length >= 2) return ascii;

  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `p-${rand}`;
}

async function ensureUniqueId(db: D1Database, baseId: string): Promise<string> {
  let candidate = baseId;
  let suffix = 2;
  for (;;) {
    const existing = await db
      .prepare(`SELECT id FROM projects WHERE id = ? LIMIT 1`)
      .bind(candidate)
      .first<{ id: string }>();
    if (!existing) return candidate;
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
    if (suffix > 100) {
      candidate = `${baseId}-${crypto.randomUUID().replace(/-/g, "").slice(0, 6)}`;
      return candidate;
    }
  }
}

/** Load all projects with their links from D1, ordered by sort_order. */
export async function listProjects(): Promise<Project[]> {
  try {
    const db = await getDB();

    const projectsResult = await db
      .prepare(
        `SELECT id, name, description, icon, image_url, github_url, sort_order
         FROM projects
         ORDER BY sort_order ASC, id ASC`,
      )
      .all<ProjectRow>();

    const linksResult = await db
      .prepare(
        `SELECT project_id, label, url, sort_order
         FROM project_links
         ORDER BY sort_order ASC, id ASC`,
      )
      .all<LinkRow>();

    const projectRows: ProjectRow[] = projectsResult.results ?? [];
    const linkRows: LinkRow[] = linksResult.results ?? [];

    const linksByProject = new Map<string, ProjectLink[]>();
    for (const link of linkRows) {
      const list = linksByProject.get(link.project_id) ?? [];
      list.push({ label: link.label, url: link.url });
      linksByProject.set(link.project_id, list);
    }

    return projectRows.map((row: ProjectRow): Project =>
      mapProject(row, linksByProject.get(row.id) ?? []),
    );
  } catch (err) {
    // Local/CI D1 may be empty before migrations; never fail the Next.js build.
    if (isMissingTableError(err)) {
      console.warn("listProjects: D1 schema missing, returning []", err);
      return [];
    }
    throw err;
  }
}

/** Load a single project by id, or null if missing. */
export async function getProject(id: string): Promise<ProjectWithSort | null> {
  try {
    const db = await getDB();

    const row = await db
      .prepare(
        `SELECT id, name, description, icon, image_url, github_url, sort_order
         FROM projects
         WHERE id = ?
         LIMIT 1`,
      )
      .bind(id)
      .first<ProjectRow>();

    if (!row) return null;

    const linksResult = await db
      .prepare(
        `SELECT project_id, label, url, sort_order
         FROM project_links
         WHERE project_id = ?
         ORDER BY sort_order ASC, id ASC`,
      )
      .bind(id)
      .all<LinkRow>();

    const linkRows: LinkRow[] = linksResult.results ?? [];
    const links: ProjectLink[] = linkRows.map((l) => ({
      label: l.label,
      url: l.url,
    }));

    return {
      ...mapProject(row, links),
      sortOrder: row.sort_order,
    };
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn("getProject: D1 schema missing, returning null", err);
      return null;
    }
    throw err;
  }
}

/** Insert a project and its links. Generates a unique slug id when omitted. */
export async function createProject(input: ProjectInput): Promise<ProjectWithSort> {
  const db = await getDB();
  const baseId = (input.id?.trim() || slugifyProjectId(input.name)).slice(0, 64);
  const id = await ensureUniqueId(db, baseId);
  const sortOrder = input.sortOrder ?? 0;
  const imageUrl = input.imageUrl?.trim() || null;
  const icon = input.icon?.trim() || "📦";
  const links = input.links ?? [];

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO projects (id, name, description, icon, image_url, github_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        input.name.trim(),
        input.description.trim(),
        icon,
        imageUrl,
        input.githubUrl.trim(),
        sortOrder,
      ),
  ];

  links.forEach((link, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO project_links (project_id, label, url, sort_order)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(id, link.label.trim(), link.url.trim(), index + 1),
    );
  });

  await db.batch(statements);

  const created = await getProject(id);
  if (!created) {
    throw new Error("createProject: row missing after insert");
  }
  return created;
}

/** Update project fields and replace all project_links in one batch. */
export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ProjectWithSort | null> {
  const db = await getDB();

  const existing = await db
    .prepare(`SELECT id FROM projects WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string }>();
  if (!existing) return null;

  const sortOrder = input.sortOrder ?? 0;
  const imageUrl = input.imageUrl?.trim() || null;
  const icon = input.icon?.trim() || "📦";
  const links = input.links ?? [];

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE projects
         SET name = ?, description = ?, icon = ?, image_url = ?, github_url = ?, sort_order = ?
         WHERE id = ?`,
      )
      .bind(
        input.name.trim(),
        input.description.trim(),
        icon,
        imageUrl,
        input.githubUrl.trim(),
        sortOrder,
        id,
      ),
    db.prepare(`DELETE FROM project_links WHERE project_id = ?`).bind(id),
  ];

  links.forEach((link, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO project_links (project_id, label, url, sort_order)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(id, link.label.trim(), link.url.trim(), index + 1),
    );
  });

  await db.batch(statements);

  return getProject(id);
}

/** Delete project links then the project. */
export async function deleteProject(id: string): Promise<boolean> {
  const db = await getDB();

  const existing = await db
    .prepare(`SELECT id FROM projects WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string }>();
  if (!existing) return false;

  await db.batch([
    db.prepare(`DELETE FROM project_links WHERE project_id = ?`).bind(id),
    db.prepare(`DELETE FROM projects WHERE id = ?`).bind(id),
  ]);

  return true;
}
