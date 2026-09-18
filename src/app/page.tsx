import { LogoutButton } from "@/components/LogoutButton";
import { ProjectGrid } from "@/components/ProjectGrid";
import { listProjects } from "@/lib/projects";

export default async function HomePage() {
  const projects = await listProjects();

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
          <LogoutButton />
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
        <ProjectGrid projects={projects} />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-center text-xs text-zinc-400 sm:px-6">
        EasyLab © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
