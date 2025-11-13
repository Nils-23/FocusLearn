// src/app/api/tasks/route.ts
import { NextResponse } from "next/server";
import type { Task } from "../../../lib/types";
import { tasks } from "../../../lib/data";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newTask: Task = {
    id: uuidv4(),
    title: String(body.title || ""),
    completed: false,
    dueDate: body.dueDate ? String(body.dueDate) : undefined,
  };
  tasks.push(newTask);
  return NextResponse.json(newTask, { status: 201 });
}
