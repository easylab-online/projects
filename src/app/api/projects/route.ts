import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/projects";
import type { ProjectLink, ProjectRepo } from "@/data/projects";

export const dynamic = "force-dynamic";

type CreateBody = {
  id?: string;
  name?: string;
  description?: string;
  icon?: string;
  imageUrl?: string | null;
  githubUrl?: string;
  repos?: ProjectRepo[];
  links?: ProjectLink[];
};

function validateProjectBody(body: CreateBody): string | null {
  if (!body.name?.trim()) return "الاسم مطلوب.";

  if (body.links != null) {
    if (!Array.isArray(body.links)) return "قائمة الروابط غير صالحة.";
    for (const link of body.links) {
      if (!link || typeof link !== "object") {
        return "كل رابط يحتاج تسمية وعنوان URL.";
      }
      if (!String(link.label ?? "").trim() || !String(link.url ?? "").trim()) {
        return "كل رابط يحتاج تسمية وعنوان URL.";
      }
    }
  }

  if (body.repos != null) {
    if (!Array.isArray(body.repos)) return "قائمة مستودعات GitHub غير صالحة.";
    for (const repo of body.repos) {
      if (!repo || typeof repo !== "object") {
        return "كل مستودع يحتاج اسماً ورابطاً.";
      }
      if (!String(repo.name ?? "").trim() || !String(repo.url ?? "").trim()) {
        return "كل مستودع يحتاج اسماً ورابطاً.";
      }
    }
  }

  return null;
}

function resolveRepos(body: CreateBody): ProjectRepo[] {
  if (Array.isArray(body.repos)) {
    return body.repos.map((r) => ({
      name: String(r.name).trim(),
      url: String(r.url).trim(),
    }));
  }
  if (body.githubUrl?.trim()) {
    return [{ name: "المستودع الرئيسي", url: body.githubUrl.trim() }];
  }
  return [];
}

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

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "غير مصرح. يرجى تسجيل الدخول." },
      { status: 401 },
    );
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: "بيانات الطلب غير صالحة." },
      { status: 400 },
    );
  }

  const validationError = validateProjectBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const project = await createProject({
      id: body.id,
      name: body.name!,
      description: body.description ?? "",
      icon: body.icon?.trim() || "📦",
      imageUrl: body.imageUrl,
      repos: resolveRepos(body),
      links: body.links ?? [],
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error("createProject failed", err);
    return NextResponse.json(
      { error: "تعذر إنشاء المشروع. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
