import { cookies } from "next/headers";

/** App gate password — intentionally hardcoded for this internal tool. */
export const APP_PASSWORD = "wajih";

export const SESSION_COOKIE = "easylab_projects_session";
export const SESSION_VALUE = "authenticated";

/** ~7 days in seconds */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function isValidPassword(password: string): boolean {
  return password === APP_PASSWORD;
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
