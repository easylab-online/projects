import { getDB } from "@/lib/db";

export type ProjectTask = {
  id: number;
  projectId: string;
  title: string;
  done: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type TaskRow = {
  id: number;
  project_id: string;
  title: string;
  done: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapTask(row: TaskRow): ProjectTask {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title ?? "",
    done: row.done === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type TaskInput = {
  title?: string;
  done?: boolean;
};

export async function listTasks(projectId: string): Promise<ProjectTask[]> {
  const db = await getDB();

  // Incomplete: sort_order DESC; completed: updated_at DESC
  const result = await db
    .prepare(
      `SELECT id, project_id, title, done, sort_order, created_at, updated_at
       FROM project_tasks
       WHERE project_id = ?
       ORDER BY
         done ASC,
         CASE WHEN done = 0 THEN sort_order ELSE NULL END DESC,
         CASE WHEN done = 1 THEN updated_at ELSE NULL END DESC,
         id DESC`,
    )
    .bind(projectId)
    .all<TaskRow>();

  return (result.results ?? []).map(mapTask);
}

export async function getTask(
  projectId: string,
  taskId: number,
): Promise<ProjectTask | null> {
  const db = await getDB();
  const row = await db
    .prepare(
      `SELECT id, project_id, title, done, sort_order, created_at, updated_at
       FROM project_tasks
       WHERE project_id = ? AND id = ?
       LIMIT 1`,
    )
    .bind(projectId, taskId)
    .first<TaskRow>();

  return row ? mapTask(row) : null;
}

async function nextTaskSortOrder(
  db: D1Database,
  projectId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(MAX(sort_order), 0) AS max_sort
       FROM project_tasks
       WHERE project_id = ?`,
    )
    .bind(projectId)
    .first<{ max_sort: number }>();
  return (row?.max_sort ?? 0) + 1;
}

export async function createTask(
  projectId: string,
  title: string,
): Promise<ProjectTask> {
  const db = await getDB();
  const trimmed = title.trim();
  const sortOrder = await nextTaskSortOrder(db, projectId);

  const result = await db
    .prepare(
      `INSERT INTO project_tasks (project_id, title, done, sort_order)
       VALUES (?, ?, 0, ?)
       RETURNING id, project_id, title, done, sort_order, created_at, updated_at`,
    )
    .bind(projectId, trimmed, sortOrder)
    .first<TaskRow>();

  if (!result) {
    throw new Error("createTask: row missing after insert");
  }
  return mapTask(result);
}

export async function updateTask(
  projectId: string,
  taskId: number,
  input: TaskInput,
): Promise<ProjectTask | null> {
  const db = await getDB();

  const existing = await getTask(projectId, taskId);
  if (!existing) return null;

  const title =
    input.title !== undefined ? input.title.trim() : existing.title;
  const done = input.done !== undefined ? (input.done ? 1 : 0) : existing.done ? 1 : 0;

  const result = await db
    .prepare(
      `UPDATE project_tasks
       SET title = ?, done = ?, updated_at = datetime('now')
       WHERE project_id = ? AND id = ?
       RETURNING id, project_id, title, done, sort_order, created_at, updated_at`,
    )
    .bind(title, done, projectId, taskId)
    .first<TaskRow>();

  return result ? mapTask(result) : null;
}

export async function deleteTask(
  projectId: string,
  taskId: number,
): Promise<boolean> {
  const db = await getDB();

  const existing = await db
    .prepare(
      `SELECT id FROM project_tasks WHERE project_id = ? AND id = ? LIMIT 1`,
    )
    .bind(projectId, taskId)
    .first<{ id: number }>();
  if (!existing) return false;

  await db
    .prepare(`DELETE FROM project_tasks WHERE project_id = ? AND id = ?`)
    .bind(projectId, taskId)
    .run();

  return true;
}
