import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { listProjects } from "@/lib/projects";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "غير مصرح. يرجى تسجيل الدخول." },
      { status: 401 },
    );
  }

  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("listProjects failed", err);
    return NextResponse.json(
      { error: "تعذر تحميل المشاريع. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
