// src/components/TaskList.tsx
"use client";
import { useEffect, useState } from "react";
import type { Task } from "../../lib/types";

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const data: Task[] = await res.json();
      setTasks(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Loading tasks...</p>;
  if (tasks.length === 0) return <p>No tasks yet — try adding one!</p>;

  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="p-3 border rounded flex justify-between items-start">
          <div>
          </div>
          <div>
            <input type="checkbox" checked={t.completed} readOnly />
          </div>
        </li>
      ))}
    </ul>
  );
}
