// src/app/api/tasks/stats/route.ts
import { NextResponse } from "next/server";
import { tasks } from "../../../../lib/data";

export async function GET() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const due = tasks.filter((t) => !t.completed).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return NextResponse.json({
    total,
    completed,
    due,
    progress,
  });
}
