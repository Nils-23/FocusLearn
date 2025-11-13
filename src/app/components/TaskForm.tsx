// src/components/TaskForm.tsx
"use client";
import { useState } from "react";
import type { Task } from "../lib/types";

type Props = {
  onCreate: (task: Task) => void;
};

export default function TaskForm({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { title, notes };
    // call backend to create task
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // handle error (basic)
      alert("Failed to create task");
      return;
    }
    const created: Task = await res.json();
    onCreate(created);
    setTitle("");
    setNotes("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you want to do?"
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes"
        className="w-full p-2 border rounded"
        rows={3}
      />
      <div>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
          Add Task
        </button>
      </div>
    </form>
  );
}
