/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker bindings for EasyLab Projects.
 * Keep in sync with wrangler.jsonc (`npm run cf-typegen`).
 */
declare global {
  interface CloudflareEnv {
    ASSETS?: Fetcher;
    NEXTJS_ENV?: string;
    WORKER_SELF_REFERENCE?: Fetcher;
    /** Cloudflare D1 — auth users + projects */
    DB: D1Database;
  }
}

export {};
