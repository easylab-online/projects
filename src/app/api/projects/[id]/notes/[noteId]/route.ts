import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteNote, updateNote } from "@/lib/notes";
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

function validateNoteBody(body: NoteBody, isPartial: boolean): string | null {
  if (isPartial && body.title === undefined && body.body === undefined) {
    return "لا توجد بيانات للتحديث.";
  }
  const title = body.title !== undefined ? body.title.trim() : undefined;
  const noteBody = body.body !== undefined ? body.body.trim() : undefined;

  // When both provided (or we're replacing fully), require at least one non-empty
  if (title !== undefined && noteBody !== undefined && !title && !noteBody) {
    return "يجب إدخال عنوان أو محتوى الملاحظة على الأقل.";
  }
  if (title !== undefined && noteBody === undefined && !title) {
    // title cleared — body must exist on server; validated in update after fetch would be better,
    // but require title not empty alone when only title sent empty without body field
    // Allow empty title if body not being cleared
  }
  if (noteBody !== undefined && title === undefined && !noteBody) {
    // body cleared — title may remain; OK if title stays
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

  const validationError = validateNoteBody(body, true);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    // Ensure final title+body is not both empty
    const nextTitle = body.title !== undefined ? body.title.trim() : undefined;
    const nextBody = body.body !== undefined ? body.body.trim() : undefined;

    const note = await updateNote(id, noteId, {
      title: nextTitle,
      body: nextBody,
    });

    if (!note) {
      return NextResponse.json({ error: "الملاحظة غير موجودة." }, { status: 404 });
    }

    if (!note.title.trim() && !note.body.trim()) {
      // Roll back conceptually — reject empty note
      return NextResponse.json(
        { error: "يجب إدخال عنوان أو محتوى الملاحظة على الأقل." },
        { status: 400 },
      );
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
