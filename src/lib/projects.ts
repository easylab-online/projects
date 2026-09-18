import { getDB } from "@/lib/db";
import type { Project, ProjectLink, ProjectRepo } from "@/data/projects";

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

type LinkRow = {
  project_id: string;
  label: string;
  url: string;
  sort_order: number;
};

type RepoRow = {
  project_id: string;
  name: string;
  url: string;
  sort_order: number;
};

export type ProjectWithSort = Project & { sortOrder: number; createdAt: string };

export type ProjectInput = {
  id?: string;
  name: string;
  description?: string;
  icon: string;
  imageUrl?: string | null;
  sortOrder?: number;
  repos?: ProjectRepo[];
  links: ProjectLink[];
};

function isMissingTableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /no such table/i.test(message);
}

function mapProject(
  row: ProjectRow,
  links: ProjectLink[],
  repos: ProjectRepo[],
): Project {
  const project: Project = {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    icon: row.icon,
    links,
    repos,
  };
  if (row.image_url) {
    project.imageUrl = row.image_url;
  }
  return project;
}

function normalizeRepos(input: ProjectInput): ProjectRepo[] {
  if (!input.repos?.length) return [];
  return input.repos.map((r) => ({
    name: r.name.trim(),
    url: r.url.trim(),
  }));
}

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

async function queryNextSortOrder(db: D1Database): Promise<number> {
  const row = await db
    .prepare(`SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM projects`)
    .first<{ max_sort: number }>();
  return (row?.max_sort ?? 0) + 1;
}

export async function nextSortOrder(): Promise<number> {
  return queryNextSortOrder(await getDB());
}

async function loadReposForProjects(
  db: D1Database,
  projectIds?: string[],
): Promise<Map<string, ProjectRepo[]>> {
  const map = new Map<string, ProjectRepo[]>();
  let result;
  if (projectIds && projectIds.length === 1) {
    result = await db
      .prepare(
        `SELECT project_id, name, url, sort_order
         FROM project_repos
         WHERE project_id = ?
         ORDER BY sort_order ASC, id ASC`,
      )
      .bind(projectIds[0])
      .all<RepoRow>();
  } else {
    result = await db
      .prepare(
        `SELECT project_id, name, url, sort_order
         FROM project_repos
         ORDER BY sort_order ASC, id ASC`,
      )
      .all<RepoRow>();
  }
  for (const row of result.results ?? []) {
    const list = map.get(row.project_id) ?? [];
    list.push({ name: row.name, url: row.url });
    map.set(row.project_id, list);
  }
  return map;
}

/** Highest sort order first, then newest projects and id for stable ties. */
export async function listProjects(): Promise<Project[]> {
  try {
    const db = await getDB();

    const projectsResult = await db
      .prepare(
        `SELECT id, name, description, icon, image_url, sort_order, created_at
         FROM projects
         ORDER BY sort_order DESC, created_at DESC, id DESC`,
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

    let reposByProject = new Map<string, ProjectRepo[]>();
    try {
      reposByProject = await loadReposForProjects(db);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }

    const linksByProject = new Map<string, ProjectLink[]>();
    for (const link of linkRows) {
      const list = linksByProject.get(link.project_id) ?? [];
      list.push({ label: link.label, url: link.url });
      linksByProject.set(link.project_id, list);
    }

    return projectRows.map((row: ProjectRow): Project =>
      mapProject(
        row,
        linksByProject.get(row.id) ?? [],
        reposByProject.get(row.id) ?? [],
      ),
    );
  } catch (err) {
    if (isMissingTableError(err)) {
      console.warn("listProjects: D1 schema missing, returning []", err);
      return [];
    }
    throw err;
  }
}

export async function getProject(id: string): Promise<ProjectWithSort | null> {
  const db = await getDB();

  const row = await db
    .prepare(
      `SELECT id, name, description, icon, image_url, sort_order, created_at
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

  const links: ProjectLink[] = (linksResult.results ?? []).map((l) => ({
    label: l.label,
    url: l.url,
  }));

  let repos: ProjectRepo[] = [];
  try {
    const reposByProject = await loadReposForProjects(db, [id]);
    repos = reposByProject.get(id) ?? [];
  } catch (err) {
    if (!isMissingTableError(err)) throw err;
  }

  return {
    ...mapProject(row, links, repos),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function createProject(input: ProjectInput): Promise<ProjectWithSort> {
  const db = await getDB();
  const baseId = (input.id?.trim() || slugifyProjectId(input.name)).slice(0, 64);
  const id = await ensureUniqueId(db, baseId);
  const sortOrder = input.sortOrder ?? (await queryNextSortOrder(db));
  const imageUrl = input.imageUrl?.trim() || null;
  const icon = input.icon?.trim() || "📦";
  const description = (input.description ?? "").trim();
  const links = input.links ?? [];
  const repos = normalizeRepos(input);

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO projects (id, name, description, icon, image_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, input.name.trim(), description, icon, imageUrl, sortOrder),
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

  repos.forEach((repo, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO project_repos (project_id, name, url, sort_order)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(id, repo.name, repo.url, index + 1),
    );
  });

  await db.batch(statements);

  const created = await getProject(id);
  if (!created) {
    throw new Error("createProject: row missing after insert");
  }
  return created;
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ProjectWithSort | null> {
  const db = await getDB();

  const existing = await db
    .prepare(`SELECT id, sort_order FROM projects WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string; sort_order: number }>();
  if (!existing) return null;

  const imageUrl = input.imageUrl?.trim() || null;
  const icon = input.icon?.trim() || "📦";
  const description = (input.description ?? "").trim();
  const sortOrder = input.sortOrder ?? existing.sort_order;
  const links = input.links ?? [];
  const repos = normalizeRepos(input);

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE projects
         SET name = ?, description = ?, icon = ?, image_url = ?, sort_order = ?
         WHERE id = ?`,
      )
      .bind(input.name.trim(), description, icon, imageUrl, sortOrder, id),
    db.prepare(`DELETE FROM project_links WHERE project_id = ?`).bind(id),
    db.prepare(`DELETE FROM project_repos WHERE project_id = ?`).bind(id),
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

  repos.forEach((repo, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO project_repos (project_id, name, url, sort_order)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(id, repo.name, repo.url, index + 1),
    );
  });

  await db.batch(statements);

  return getProject(id);
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await getDB();

  const existing = await db
    .prepare(`SELECT id FROM projects WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<{ id: string }>();
  if (!existing) return false;

  await db.batch([
    db.prepare(`DELETE FROM project_links WHERE project_id = ?`).bind(id),
    db.prepare(`DELETE FROM project_repos WHERE project_id = ?`).bind(id),
    db.prepare(`DELETE FROM projects WHERE id = ?`).bind(id),
  ]);

  return true;
}
