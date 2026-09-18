import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import { deleteTask, getTask, updateTask } from "@/lib/tasks";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; taskId: string }>;
};

type TaskBody = {
  title?: string;
  done?: boolean;
};

function parseTaskId(raw: string): number | null {
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

  const { id, taskId: taskIdRaw } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "معرّف المشروع مطلوب." }, { status: 400 });
  }
  const taskId = parseTaskId(taskIdRaw);
  if (taskId == null) {
    return NextResponse.json({ error: "معرّف المهمة غير صالح." }, { status: 400 });
  }

  let body: TaskBody;
  try {
    body = (await request.json()) as TaskBody;
  } catch {
    return NextResponse.json(
      { error: "بيانات الطلب غير صالحة." },
      { status: 400 },
    );
  }

  if (body.title === undefined && body.done === undefined) {
    return NextResponse.json({ error: "لا توجد بيانات للتحديث." }, { status: 400 });
  }

  if (body.title !== undefined && !body.title.trim()) {
    return NextResponse.json({ error: "عنوان المهمة مطلوب." }, { status: 400 });
  }

  if (body.done !== undefined && typeof body.done !== "boolean") {
    return NextResponse.json(
      { error: "قيمة الإنجاز غير صالحة." },
      { status: 400 },
    );
  }

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    // Ensure task belongs to project
    const existing = await getTask(id, taskId);
    if (!existing) {
      return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });
    }

    const task = await updateTask(id, taskId, {
      title: body.title,
      done: body.done,
    });

    if (!task) {
      return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error("updateTask failed", err);
    return NextResponse.json(
      { error: "تعذر تحديث المهمة. حاول مرة أخرى." },
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

  const { id, taskId: taskIdRaw } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "معرّف المشروع مطلوب." }, { status: 400 });
  }
  const taskId = parseTaskId(taskIdRaw);
  if (taskId == null) {
    return NextResponse.json({ error: "معرّف المهمة غير صالح." }, { status: 400 });
  }

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    const deleted = await deleteTask(id, taskId);
    if (!deleted) {
      return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("deleteTask failed", err);
    return NextResponse.json(
      { error: "تعذر حذف المهمة. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
