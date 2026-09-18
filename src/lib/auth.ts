import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const SESSION_COOKIE = "easylab_projects_session";
export const SESSION_VALUE = "authenticated";

/** ~7 days in seconds */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  password_salt: string;
};

/**
 * Look up user by email in D1 and verify the password hash.
 * Returns the user email on success, or null on failure.
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ email: string } | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return null;

  const db = await getDB();
  const row = await db
    .prepare(
      `SELECT id, email, password_hash, password_salt
       FROM users
       WHERE email = ? COLLATE NOCASE
       LIMIT 1`,
    )
    .bind(normalized)
    .first<UserRow>();

  if (!row) return null;

  const ok = await verifyPassword(
    password,
    row.password_salt,
    row.password_hash,
  );
  if (!ok) return null;

  return { email: row.email };
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE);
  return session?.value === SESSION_VALUE;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
