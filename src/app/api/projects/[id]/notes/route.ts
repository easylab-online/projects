import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createNote, listNotes } from "@/lib/notes";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type NoteBody = {
  title?: string;
  body?: string;
};

function validateNoteBody(body: NoteBody): string | null {
  const title = (body.title ?? "").trim();
  const noteBody = (body.body ?? "").trim();
  if (!title && !noteBody) {
    return "يجب إدخال عنوان أو محتوى الملاحظة على الأقل.";
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
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
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    const notes = await listNotes(id);
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("listNotes failed", err);
    return NextResponse.json(
      { error: "تعذر تحميل الملاحظات. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
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

  let body: NoteBody;
  try {
    body = (await request.json()) as NoteBody;
  } catch {
    return NextResponse.json(
      { error: "بيانات الطلب غير صالحة." },
      { status: 400 },
    );
  }

  const validationError = validateNoteBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    const note = await createNote(id, {
      title: body.title,
      body: body.body,
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    console.error("createNote failed", err);
    return NextResponse.json(
      { error: "تعذر إنشاء الملاحظة. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
