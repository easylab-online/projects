import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "easylab_projects_session";
const SESSION_VALUE = "authenticated";

function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/api/auth/login" ||
    pathname === "/~offline" ||
    pathname.startsWith("/~offline/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/serwist/") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webmanifest")
  ) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      const session = request.cookies.get(SESSION_COOKIE);
      if (session?.value === SESSION_VALUE) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (session?.value !== SESSION_VALUE) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "غير مصرح. يرجى تسجيل الدخول." },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
