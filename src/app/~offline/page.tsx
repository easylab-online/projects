export const metadata = {
  title: "غير متصل",
};

export default function OfflinePage() {
  return (
    <div className="lab-grid flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 text-4xl" aria-hidden>
          📡
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          أنت غير متصل بالإنترنت
        </h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          تحقق من اتصالك ثم أعد تحميل الصفحة للوصول إلى مشاريع EasyLab.
        </p>
      </div>
    </div>
  );
}
