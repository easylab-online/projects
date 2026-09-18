import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteProject, updateProject } from "@/lib/projects";
import type { ProjectLink } from "@/data/projects";

export const dynamic = "force-dynamic";

type UpdateBody = {
  name?: string;
  description?: string;
  icon?: string;
  imageUrl?: string | null;
  githubUrl?: string;
  links?: ProjectLink[];
  sortOrder?: number;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function validateProjectBody(body: UpdateBody): string | null {
  if (!body.name?.trim()) return "الاسم مطلوب.";
  if (!body.description?.trim()) return "الوصف مطلوب.";
  if (!body.githubUrl?.trim()) return "رابط GitHub مطلوب.";

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

  return null;
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "غير مصرح. يرجى تسجيل الدخول." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "معرّف المشروع مطلوب." }, { status: 400 });
  }

  let body: UpdateBody;
  try {
    body = (await request.json()) as UpdateBody;
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
    const project = await updateProject(id, {
      name: body.name!,
      description: body.description!,
      icon: body.icon?.trim() || "📦",
      imageUrl: body.imageUrl,
      githubUrl: body.githubUrl!,
      links: body.links ?? [],
      sortOrder: body.sortOrder,
    });

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود." },
        { status: 404 },
      );
    }

    return NextResponse.json({ project });
  } catch (err) {
    console.error("updateProject failed", err);
    return NextResponse.json(
      { error: "تعذر تحديث المشروع. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "غير مصرح. يرجى تسجيل الدخول." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "معرّف المشروع مطلوب." }, { status: 400 });
  }

  try {
    const deleted = await deleteProject(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "المشروع غير موجود." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("deleteProject failed", err);
    return NextResponse.json(
      { error: "تعذر حذف المشروع. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
