import { NextResponse } from "next/server";
import {
  authenticateUser,
  SESSION_COOKIE,
  SESSION_VALUE,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  let email = "";
  let password = "";
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        email?: string;
        password?: string;
      };
      email = body.email ?? "";
      password = body.password ?? "";
    } else {
      const form = await request.formData();
      email = String(form.get("email") ?? "");
      password = String(form.get("password") ?? "");
    }
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  if (!email.trim() || !password) {
    return NextResponse.json(
      { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور." },
      { status: 400 },
    );
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    return NextResponse.json(
      {
        error:
          "بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور.",
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, sessionCookieOptions());
  return response;
}
