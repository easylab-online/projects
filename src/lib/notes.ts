import { getDB } from "@/lib/db";

export type ProjectNote = {
  id: number;
  projectId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: number;
  project_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

function mapNote(row: NoteRow): ProjectNote {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title ?? "",
    body: row.body ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type NoteInput = {
  title?: string;
  body?: string;
};

export async function listNotes(projectId: string): Promise<ProjectNote[]> {
  const db = await getDB();
  const result = await db
    .prepare(
      `SELECT id, project_id, title, body, created_at, updated_at
       FROM project_notes
       WHERE project_id = ?
       ORDER BY updated_at DESC, id DESC`,
    )
    .bind(projectId)
    .all<NoteRow>();

  return (result.results ?? []).map(mapNote);
}

export async function getNote(
  projectId: string,
  noteId: number,
): Promise<ProjectNote | null> {
  const db = await getDB();
  const row = await db
    .prepare(
      `SELECT id, project_id, title, body, created_at, updated_at
       FROM project_notes
       WHERE project_id = ? AND id = ?
       LIMIT 1`,
    )
    .bind(projectId, noteId)
    .first<NoteRow>();

  return row ? mapNote(row) : null;
}

export async function createNote(
  projectId: string,
  input: NoteInput,
): Promise<ProjectNote> {
  const db = await getDB();
  const title = (input.title ?? "").trim();
  const body = (input.body ?? "").trim();

  const result = await db
    .prepare(
      `INSERT INTO project_notes (project_id, title, body)
       VALUES (?, ?, ?)
       RETURNING id, project_id, title, body, created_at, updated_at`,
    )
    .bind(projectId, title, body)
    .first<NoteRow>();

  if (!result) {
    throw new Error("createNote: row missing after insert");
  }
  return mapNote(result);
}

export async function updateNote(
  projectId: string,
  noteId: number,
  input: NoteInput,
): Promise<ProjectNote | null> {
  const db = await getDB();

  const existing = await getNote(projectId, noteId);
  if (!existing) return null;

  const title =
    input.title !== undefined ? input.title.trim() : existing.title;
  const body = input.body !== undefined ? input.body.trim() : existing.body;

  const result = await db
    .prepare(
      `UPDATE project_notes
       SET title = ?, body = ?, updated_at = datetime('now')
       WHERE project_id = ? AND id = ?
       RETURNING id, project_id, title, body, created_at, updated_at`,
    )
    .bind(title, body, projectId, noteId)
    .first<NoteRow>();

  return result ? mapNote(result) : null;
}

export async function deleteNote(
  projectId: string,
  noteId: number,
): Promise<boolean> {
  const db = await getDB();

  const existing = await db
    .prepare(
      `SELECT id FROM project_notes WHERE project_id = ? AND id = ? LIMIT 1`,
    )
    .bind(projectId, noteId)
    .first<{ id: number }>();
  if (!existing) return false;

  await db
    .prepare(`DELETE FROM project_notes WHERE project_id = ? AND id = ?`)
    .bind(projectId, noteId)
    .run();

  return true;
}
