import { NextResponse } from "next/server";
import { projects } from "@/data/projects";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "غير مصرح. يرجى تسجيل الدخول." },
      { status: 401 },
    );
  }

  return NextResponse.json({ projects });
}
