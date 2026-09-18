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

/** Load all projects with their links from D1, ordered by sort_order. */
export async function listProjects(): Promise<Project[]> {
  const db = await getDB();

  const { results: projectRows } = await db
    .prepare(
      `SELECT id, name, description, icon, image_url, github_url, sort_order
       FROM projects
       ORDER BY sort_order ASC, id ASC`,
    )
    .all<ProjectRow>();

  const { results: linkRows } = await db
    .prepare(
      `SELECT project_id, label, url, sort_order
       FROM project_links
       ORDER BY sort_order ASC, id ASC`,
    )
    .all<LinkRow>();

  const linksByProject = new Map<string, ProjectLink[]>();
  for (const link of linkRows ?? []) {
    const list = linksByProject.get(link.project_id) ?? [];
    list.push({ label: link.label, url: link.url });
    linksByProject.set(link.project_id, list);
  }

  return (projectRows ?? []).map((row) => {
    const project: Project = {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      githubUrl: row.github_url,
      links: linksByProject.get(row.id) ?? [],
    };
    if (row.image_url) {
      project.imageUrl = row.image_url;
    }
    return project;
  });
}
