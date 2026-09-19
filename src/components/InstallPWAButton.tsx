"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const DISMISS_KEY = "easylab-pwa-install-dismissed";

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    let wasDismissed = false;
    try {
      wasDismissed = window.sessionStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }

    setIsStandalone(standalone);
    setDismissed(wasDismissed);
    setMounted(true);

    if (standalone) {
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  function dismissForSession() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Keep the dismissal local when storage is unavailable.
    }
    setDismissed(true);
  }

  async function installApp() {
    if (!deferredPrompt) {
      setHelpOpen(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setDismissed(true);
      }
    } catch {
      setDeferredPrompt(null);
    }
  }

  if (!mounted || isStandalone || dismissed) {
    return null;
  }

  return (
    <>
      <aside className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-2xl shadow-emerald-950/15 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900 dark:bg-zinc-900/95">
          <div className="text-right">
            <p className="font-bold text-emerald-900 dark:text-emerald-100">
              ثبّت EasyLab على جهازك
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              وصول أسرع وتجربة أفضل حتى دون اتصال.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={installApp}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                تثبيت التطبيق
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="rounded-xl border border-emerald-600 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-emerald-300 dark:hover:bg-emerald-950"
            >
              كيفية التثبيت
            </button>
            <button
              type="button"
              onClick={dismissForSession}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </aside>

      {helpOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/50 p-4 sm:items-center"
          role="presentation"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="pwa-help-title"
                  className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
                >
                  كيفية تثبيت التطبيق
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  اتبع الخطوات التالية من متصفح هاتفك:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded-lg px-2 py-1 text-xl leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  ١
                </span>
                <span>اضغط على زر المشاركة في المتصفح.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  ٢
                </span>
                <span>اختر «إضافة إلى الشاشة الرئيسية».</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  ٣
                </span>
                <span>اضغط «إضافة» لتثبيت EasyLab.</span>
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}
