import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Lightweight DB connectivity check (auth not required). */
export async function GET() {
  try {
    const db = await getDB();
    const row = await db
      .prepare(`SELECT COUNT(*) AS count FROM projects`)
      .first<{ count: number }>();

    return NextResponse.json({
      ok: true,
      binding: "DB",
      database: "projects-db",
      projects: row?.count ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
