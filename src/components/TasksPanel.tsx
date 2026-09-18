"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectTask } from "@/lib/tasks";

type TasksPanelProps = {
  projectId: string;
  initialTasks: ProjectTask[];
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none ring-emerald-500/40 transition focus:border-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

function sortTasks(list: ProjectTask[]): ProjectTask[] {
  const incomplete = list
    .filter((t) => !t.done)
    .sort((a, b) => b.sortOrder - a.sortOrder || b.id - a.id);
  const complete = list
    .filter((t) => t.done)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);
  return [...incomplete, ...complete];
}

export function TasksPanel({ projectId, initialTasks }: TasksPanelProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<ProjectTask[]>(() =>
    sortTasks(initialTasks),
  );
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const base = `/api/projects/${encodeURIComponent(projectId)}/tasks`;

  const incomplete = useMemo(() => tasks.filter((t) => !t.done), [tasks]);
  const complete = useMemo(() => tasks.filter((t) => t.done), [tasks]);

  function replaceTask(updated: ProjectTask) {
    setTasks((prev) =>
      sortTasks(prev.map((t) => (t.id === updated.id ? updated : t))),
    );
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("عنوان المهمة مطلوب.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = (await res.json()) as { task?: ProjectTask; error?: string };
      if (!res.ok || !data.task) {
        setError(data.error || "تعذر إنشاء المهمة. حاول مرة أخرى.");
        setAdding(false);
        return;
      }
      setTasks((prev) => sortTasks([data.task!, ...prev]));
      setTitle("");
      setAdding(false);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setAdding(false);
    }
  }

  async function toggleDone(task: ProjectTask) {
    setBusyId(task.id);
    setError(null);
    try {
      const res = await fetch(`${base}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });
      const data = (await res.json()) as { task?: ProjectTask; error?: string };
      if (!res.ok || !data.task) {
        setError(data.error || "تعذر تحديث المهمة. حاول مرة أخرى.");
        setBusyId(null);
        return;
      }
      replaceTask(data.task);
      setBusyId(null);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setBusyId(null);
    }
  }

  function startEdit(task: ProjectTask) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function saveEdit(taskId: number) {
    setError(null);
    if (!editTitle.trim()) {
      setError("عنوان المهمة مطلوب.");
      return;
    }
    setBusyId(taskId);
    try {
      const res = await fetch(`${base}/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      const data = (await res.json()) as { task?: ProjectTask; error?: string };
      if (!res.ok || !data.task) {
        setError(data.error || "تعذر تحديث المهمة. حاول مرة أخرى.");
        setBusyId(null);
        return;
      }
      replaceTask(data.task);
      cancelEdit();
      setBusyId(null);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setBusyId(null);
    }
  }

  async function onDelete(task: ProjectTask) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المهمة «${task.title}»؟`,
    );
    if (!confirmed) return;

    setBusyId(task.id);
    setError(null);
    try {
      const res = await fetch(`${base}/${task.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "تعذر حذف المهمة. حاول مرة أخرى.");
        setBusyId(null);
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (editingId === task.id) cancelEdit();
      setBusyId(null);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setBusyId(null);
    }
  }

  function renderTask(task: ProjectTask, muted: boolean) {
    const busy = busyId === task.id;
    return (
      <li
        key={task.id}
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
          muted
            ? "border-zinc-100 bg-zinc-50/80 opacity-75 dark:border-zinc-800/80 dark:bg-zinc-900/40"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        }`}
      >
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => toggleDone(task)}
          disabled={busy}
          className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          aria-label={task.done ? "إلغاء الإنجاز" : "تحديد كمنجزة"}
        />
        <div className="min-w-0 flex-1">
          {editingId === task.id ? (
            <div className="space-y-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={inputClass}
                disabled={busy}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveEdit(task.id)}
                  disabled={busy}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={busy}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <p
              className={`text-sm leading-relaxed ${
                task.done
                  ? "text-zinc-500 line-through dark:text-zinc-400"
                  : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {task.title}
            </p>
          )}
        </div>
        {editingId !== task.id && (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => startEdit(task)}
              disabled={busy}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              تعديل
            </button>
            <button
              type="button"
              onClick={() => onDelete(task)}
              disabled={busy}
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
            >
              حذف
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <form
        onSubmit={onAdd}
        className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="مهمة جديدة..."
          disabled={adding}
        />
        <button
          type="submit"
          disabled={adding}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {adding ? "..." : "إضافة"}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          غير منجزة{" "}
          <span className="font-normal text-zinc-400">({incomplete.length})</span>
        </h2>
        {incomplete.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            لا توجد مهام غير منجزة.
          </p>
        ) : (
          <ul className="space-y-2">
            {incomplete.map((t) => renderTask(t, false))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          منجزة{" "}
          <span className="font-normal">({complete.length})</span>
        </h2>
        {complete.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800">
            لا توجد مهام منجزة بعد.
          </p>
        ) : (
          <ul className="space-y-2">
            {complete.map((t) => renderTask(t, true))}
          </ul>
        )}
      </section>
    </div>
  );
}
