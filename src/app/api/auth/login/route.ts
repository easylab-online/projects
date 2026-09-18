import { NextResponse } from "next/server";
import {
  isValidPassword,
  SESSION_COOKIE,
  SESSION_VALUE,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  let password = "";
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { password?: string };
      password = body.password ?? "";
    } else {
      const form = await request.formData();
      password = String(form.get("password") ?? "");
    }
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "كلمة المرور غير صحيحة. حاول مرة أخرى." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, sessionCookieOptions());
  return response;
}
