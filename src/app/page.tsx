import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { ProjectGrid } from "@/components/ProjectGrid";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  let loadError: string | null = null;

  try {
    projects = await listProjects();
  } catch (err) {
    console.error("listProjects failed on home page", err);
    loadError =
      err instanceof Error
        ? err.message
        : "تعذر الاتصال بقاعدة البيانات.";
  }

  return (
    <div className="lab-grid min-h-screen">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-md shadow-emerald-600/30">
              🧪
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-50">
                مشاريع EasyLab
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {projects.length} مشاريع · projects.easylab.online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/projects/new"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition hover:bg-emerald-500"
            >
              إضافة مشروع
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            جميع المشاريع
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            اختر مشروعاً لفتح روابطه أو مستودع GitHub
          </p>
        </div>

        {loadError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            <p className="font-semibold">تعذر تحميل المشاريع من قاعدة البيانات</p>
            <p className="mt-2 break-words opacity-90" dir="ltr">
              {loadError}
            </p>
          </div>
        ) : (
          <ProjectGrid projects={projects} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-center text-xs text-zinc-400 sm:px-6">
        EasyLab © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
