import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

/** Return the D1 database binding from the Cloudflare Worker env. */
export const getDB = cache(async (): Promise<D1Database> => {
  let env: CloudflareEnv | undefined;

  try {
    env = getCloudflareContext().env as CloudflareEnv;
  } catch {
    // Outside a sync request context — try async mode (ISR/static).
  }

  if (!env?.DB) {
    const ctx = await getCloudflareContext({ async: true });
    env = ctx.env as CloudflareEnv;
  }

  if (!env?.DB) {
    throw new Error("D1 binding DB is not configured on this Worker");
  }

  return env.DB;
});
