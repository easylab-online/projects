import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteNote, getNote, updateNote } from "@/lib/notes";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; noteId: string }>;
};

type NoteBody = {
  title?: string;
  body?: string;
};

function parseNoteId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "غير مصرح. يرجى تسجيل الدخول." },
      { status: 401 },
    );
  }

  const { id, noteId: noteIdRaw } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "معرّف المشروع مطلوب." }, { status: 400 });
  }
  const noteId = parseNoteId(noteIdRaw);
  if (noteId == null) {
    return NextResponse.json({ error: "معرّف الملاحظة غير صالح." }, { status: 400 });
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

  if (body.title === undefined && body.body === undefined) {
    return NextResponse.json({ error: "لا توجد بيانات للتحديث." }, { status: 400 });
  }

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    const existing = await getNote(id, noteId);
    if (!existing) {
      return NextResponse.json({ error: "الملاحظة غير موجودة." }, { status: 404 });
    }

    const nextTitle =
      body.title !== undefined ? body.title.trim() : existing.title;
    const nextBody =
      body.body !== undefined ? body.body.trim() : existing.body;

    if (!nextTitle && !nextBody) {
      return NextResponse.json(
        { error: "يجب إدخال عنوان أو محتوى الملاحظة على الأقل." },
        { status: 400 },
      );
    }

    const note = await updateNote(id, noteId, {
      title: nextTitle,
      body: nextBody,
    });

    if (!note) {
      return NextResponse.json({ error: "الملاحظة غير موجودة." }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (err) {
    console.error("updateNote failed", err);
    return NextResponse.json(
      { error: "تعذر تحديث الملاحظة. حاول مرة أخرى." },
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

  const { id, noteId: noteIdRaw } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "معرّف المشروع مطلوب." }, { status: 400 });
  }
  const noteId = parseNoteId(noteIdRaw);
  if (noteId == null) {
    return NextResponse.json({ error: "معرّف الملاحظة غير صالح." }, { status: 400 });
  }

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    const deleted = await deleteNote(id, noteId);
    if (!deleted) {
      return NextResponse.json({ error: "الملاحظة غير موجودة." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("deleteNote failed", err);
    return NextResponse.json(
      { error: "تعذر حذف الملاحظة. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
