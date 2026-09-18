import Link from "next/link";
import { ProjectForm } from "@/components/ProjectForm";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <div className="lab-grid min-h-screen">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              إضافة مشروع
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              إنشاء مشروع جديد في لوحة EasyLab
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            رجوع
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-8">
          <ProjectForm mode="create" />
        </div>
      </main>
    </div>
  );
}
