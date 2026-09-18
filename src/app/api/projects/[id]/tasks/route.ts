import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import { createTask, listTasks } from "@/lib/tasks";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type TaskBody = {
  title?: string;
};

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

    const tasks = await listTasks(id);
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("listTasks failed", err);
    return NextResponse.json(
      { error: "تعذر تحميل المهام. حاول مرة أخرى." },
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

  let body: TaskBody;
  try {
    body = (await request.json()) as TaskBody;
  } catch {
    return NextResponse.json(
      { error: "بيانات الطلب غير صالحة." },
      { status: 400 },
    );
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "عنوان المهمة مطلوب." }, { status: 400 });
  }

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "المشروع غير موجود." }, { status: 404 });
    }

    const task = await createTask(id, body.title);
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("createTask failed", err);
    return NextResponse.json(
      { error: "تعذر إنشاء المهمة. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
