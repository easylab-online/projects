"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectLink, ProjectRepo } from "@/data/projects";

export type ProjectFormValues = {
  name: string;
  description: string;
  icon: string;
  imageUrl: string;
  sortOrder: string;
  repos: ProjectRepo[];
  links: ProjectLink[];
};

type ProjectFormInitial = Partial<Omit<ProjectFormValues, "sortOrder">> & {
  sortOrder?: string | number;
  githubUrl?: string;
};

type ProjectFormProps = {
  mode: "create" | "edit";
  projectId?: string;
  initial?: ProjectFormInitial;
};

const emptyValues: ProjectFormValues = {
  name: "",
  description: "",
  icon: "📦",
  imageUrl: "",
  sortOrder: "",
  repos: [],
  links: [],
};

function initialRepos(initial?: ProjectFormInitial): ProjectRepo[] {
  if (initial?.repos?.length) return initial.repos;
  if (initial?.githubUrl?.trim()) {
    return [{ name: "المستودع الرئيسي", url: initial.githubUrl.trim() }];
  }
  return [];
}

export function ProjectForm({ mode, projectId, initial }: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>({
    ...emptyValues,
    ...initial,
    sortOrder: initial?.sortOrder == null ? "" : String(initial.sortOrder),
    links: initial?.links?.length ? initial.links : [],
    repos: initialRepos(initial),
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateLink(index: number, field: keyof ProjectLink, value: string) {
    setValues((prev) => {
      const links = prev.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      );
      return { ...prev, links };
    });
  }

  function updateRepo(index: number, field: keyof ProjectRepo, value: string) {
    setValues((prev) => {
      const repos = prev.repos.map((repo, i) =>
        i === index ? { ...repo, [field]: value } : repo,
      );
      return { ...prev, repos };
    });
  }

  function addLink() {
    setValues((prev) => ({
      ...prev,
      links: [...prev.links, { label: "", url: "" }],
    }));
  }

  function removeLink(index: number) {
    setValues((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  }

  function addRepo() {
    setValues((prev) => ({
      ...prev,
      repos: [...prev.repos, { name: "", url: "" }],
    }));
  }

  function removeRepo(index: number) {
    setValues((prev) => ({
      ...prev,
      repos: prev.repos.filter((_, i) => i !== index),
    }));
  }

  function clientValidate(): string | null {
    if (!values.name.trim()) return "الاسم مطلوب.";
    if (values.sortOrder.trim()) {
      const sortOrder = Number(values.sortOrder);
      if (!Number.isInteger(sortOrder) || sortOrder < 0) {
        return "الترتيب يجب أن يكون رقماً صحيحاً غير سالب.";
      }
    }
    for (const link of values.links) {
      const hasLabel = Boolean(link.label.trim());
      const hasUrl = Boolean(link.url.trim());
      if (hasLabel !== hasUrl) {
        return "كل رابط يحتاج تسمية وعنوان URL.";
      }
    }
    for (const repo of values.repos) {
      const hasName = Boolean(repo.name.trim());
      const hasUrl = Boolean(repo.url.trim());
      if (hasName !== hasUrl) {
        return "كل مستودع يحتاج اسماً ورابطاً.";
      }
    }
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = clientValidate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      icon: values.icon.trim() || "📦",
      imageUrl: values.imageUrl.trim() || null,
      sortOrder: values.sortOrder.trim() ? Number(values.sortOrder) : undefined,
      repos: values.repos
        .filter((r) => r.name.trim() && r.url.trim())
        .map((r) => ({ name: r.name.trim(), url: r.url.trim() })),
      links: values.links
        .filter((l) => l.label.trim() && l.url.trim())
        .map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
    };

    try {
      const url =
        mode === "create" ? "/api/projects" : `/api/projects/${projectId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error || "تعذر حفظ المشروع. حاول مرة أخرى.");
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none ring-emerald-500/40 transition focus:border-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";
  const labelClass =
    "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5" dir="rtl">
      <div className="space-y-2">
        <label htmlFor="name" className={labelClass}>
          الاسم <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          required
          value={values.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={inputClass}
          placeholder="مثال: DonePlan"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="sortOrder" className={labelClass}>
          الترتيب
        </label>
        <input
          id="sortOrder"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={values.sortOrder}
          onChange={(e) => updateField("sortOrder", e.target.value)}
          className={inputClass}
          placeholder="مثال: 1"
          dir="ltr"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className={labelClass}>
          الوصف (اختياري)
        </label>
        <textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => updateField("description", e.target.value)}
          className={inputClass}
          placeholder="وصف مختصر للمشروع"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="icon" className={labelClass}>
          الأيقونة (emoji)
        </label>
        <input
          id="icon"
          value={values.icon}
          onChange={(e) => updateField("icon", e.target.value)}
          className={inputClass}
          placeholder="📦"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="imageUrl" className={labelClass}>
          صورة اختيارية (رابط)
        </label>
        <input
          id="imageUrl"
          type="url"
          value={values.imageUrl}
          onChange={(e) => updateField("imageUrl", e.target.value)}
          className={inputClass}
          placeholder="https://..."
          dir="ltr"
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            مستودعات GitHub
          </h3>
          <button
            type="button"
            onClick={addRepo}
            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
          >
            إضافة مستودع
          </button>
        </div>

        {values.repos.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            يمكنك إضافة أكثر من مستودع: اسم المشروع الفرعي + رابط GitHub.
          </p>
        ) : (
          <ul className="space-y-3">
            {values.repos.map((repo, index) => (
              <li
                key={index}
                className="grid gap-2 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[1fr_1.4fr_auto] dark:border-zinc-800"
              >
                <input
                  value={repo.name}
                  onChange={(e) => updateRepo(index, "name", e.target.value)}
                  className={inputClass}
                  placeholder="اسم المشروع الفرعي"
                  aria-label={`اسم المستودع ${index + 1}`}
                />
                <input
                  value={repo.url}
                  onChange={(e) => updateRepo(index, "url", e.target.value)}
                  className={inputClass}
                  placeholder="https://github.com/..."
                  dir="ltr"
                  aria-label={`رابط المستودع ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeRepo(index)}
                  className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            الروابط
          </h3>
          <button
            type="button"
            onClick={addLink}
            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
          >
            إضافة رابط
          </button>
        </div>

        {values.links.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            لا توجد روابط. يمكنك إضافة تسمية + رابط اختيارياً.
          </p>
        ) : (
          <ul className="space-y-3">
            {values.links.map((link, index) => (
              <li
                key={index}
                className="grid gap-2 rounded-xl border border-zinc-100 p-3 sm:grid-cols-[1fr_1.4fr_auto] dark:border-zinc-800"
              >
                <input
                  value={link.label}
                  onChange={(e) => updateLink(index, "label", e.target.value)}
                  className={inputClass}
                  placeholder="التسمية"
                  aria-label={`تسمية الرابط ${index + 1}`}
                />
                <input
                  value={link.url}
                  onChange={(e) => updateLink(index, "url", e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                  dir="ltr"
                  aria-label={`عنوان الرابط ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "جاري الحفظ..."
            : mode === "create"
              ? "إنشاء المشروع"
              : "حفظ التعديلات"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => router.push("/")}
          className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
