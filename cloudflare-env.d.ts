/**
 * Cloudflare Worker bindings for EasyLab Projects.
 * Keep in sync with wrangler.jsonc (cf-typegen: npm run cf-typegen).
 */
interface CloudflareEnv {
  ASSETS?: Fetcher;
  NEXTJS_ENV?: string;
  WORKER_SELF_REFERENCE?: Service;
  /** Cloudflare D1 — auth users + projects */
  DB: D1Database;
}

export {};
