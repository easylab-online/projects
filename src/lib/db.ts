import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Return the D1 database binding from the Cloudflare Worker env. */
export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured");
  }
  return env.DB;
}
