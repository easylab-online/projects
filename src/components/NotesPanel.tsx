"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectNote } from "@/lib/notes";

type NotesPanelProps = {
  projectId: string;
  initialNotes: ProjectNote[];
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none ring-emerald-500/40 transition focus:border-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export function NotesPanel({ projectId, initialNotes }: NotesPanelProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<ProjectNote[]>(initialNotes);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const base = `/api/projects/${encodeURIComponent(projectId)}/notes`;

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() && !body.trim()) {
      setError("يجب إدخال عنوان أو محتوى الملاحظة على الأقل.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = (await res.json()) as { note?: ProjectNote; error?: string };
      if (!res.ok || !data.note) {
        setError(data.error || "تعذر إنشاء الملاحظة. حاول مرة أخرى.");
        setAdding(false);
        return;
      }
      setNotes((prev) => [data.note!, ...prev]);
      setTitle("");
      setBody("");
      setAdding(false);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setAdding(false);
    }
  }

  function startEdit(note: ProjectNote) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  }

  async function saveEdit(noteId: number) {
    setError(null);
    if (!editTitle.trim() && !editBody.trim()) {
      setError("يجب إدخال عنوان أو محتوى الملاحظة على الأقل.");
      return;
    }
    setSavingId(noteId);
    try {
      const res = await fetch(`${base}/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      });
      const data = (await res.json()) as { note?: ProjectNote; error?: string };
      if (!res.ok || !data.note) {
        setError(data.error || "تعذر تحديث الملاحظة. حاول مرة أخرى.");
        setSavingId(null);
        return;
      }
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === noteId ? data.note! : n));
        return next.sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt),
        );
      });
      cancelEdit();
      setSavingId(null);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setSavingId(null);
    }
  }

  async function onDelete(note: ProjectNote) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الملاحظة${note.title ? ` «${note.title}»` : ""}؟`,
    );
    if (!confirmed) return;

    setDeletingId(note.id);
    setError(null);
    try {
      const res = await fetch(`${base}/${note.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "تعذر حذف الملاحظة. حاول مرة أخرى.");
        setDeletingId(null);
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      if (editingId === note.id) cancelEdit();
      setDeletingId(null);
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <form
        onSubmit={onAdd}
        className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          إضافة ملاحظة
        </h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="العنوان (اختياري)"
          disabled={adding}
        />
        <textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={inputClass}
          placeholder="المحتوى..."
          disabled={adding}
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {adding ? "جاري الإضافة..." : "إضافة ملاحظة"}
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

      {notes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          لا توجد ملاحظات بعد.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {editingId === note.id ? (
                <div className="space-y-3">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={inputClass}
                    placeholder="العنوان (اختياري)"
                    disabled={savingId === note.id}
                  />
                  <textarea
                    rows={4}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className={inputClass}
                    placeholder="المحتوى..."
                    disabled={savingId === note.id}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(note.id)}
                      disabled={savingId === note.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                    >
                      {savingId === note.id ? "جاري الحفظ..." : "حفظ"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={savingId === note.id}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {note.title.trim() ? (
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                          {note.title}
                        </h3>
                      ) : null}
                      {note.body.trim() ? (
                        <p
                          className={`whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 ${
                            note.title.trim() ? "mt-2" : ""
                          }`}
                        >
                          {note.body}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-zinc-400" dir="ltr">
                        {note.updatedAt}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(note)}
                        disabled={deletingId === note.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                      >
                        {deletingId === note.id ? "جاري الحذف..." : "حذف"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
