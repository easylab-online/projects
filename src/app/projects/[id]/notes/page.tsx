import Link from "next/link";
import { notFound } from "next/navigation";
import { NotesPanel } from "@/components/NotesPanel";
import { listNotes } from "@/lib/notes";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectNotesPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const notes = await listNotes(id);

  return (
    <div className="lab-grid min-h-screen">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              ملاحظات
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {project.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${encodeURIComponent(project.id)}/tasks`}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
            >
              المهام
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              رجوع
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <NotesPanel projectId={project.id} initialNotes={notes} />
      </main>
    </div>
  );
}
