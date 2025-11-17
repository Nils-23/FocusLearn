"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { watchAuthState } from "@/lib/auth";
import { addUserTask } from "@/lib/tasks";

export default function AddTaskPage() {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // 🔐 Watch authentication
  useEffect(() => {
    const unsub = watchAuthState((u) => {
      if (!u) router.push("/login");
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  const handleAddTask = async () => {
    if (!title.trim() || !user) return;

    await addUserTask(user.uid, {
      title,
      dueDate: dueDate || null,
      completed: false,
      createdAt: Date.now(),
    });

    setTitle("");
    setDueDate("");

    router.push("/");
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Add New Task</h1>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 w-full max-w-md">
        <label className="block mb-3">
          <span className="text-gray-700 dark:text-gray-200">Task Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded px-3 py-2"
            placeholder="Enter task title"
          />
        </label>

        <label className="block mb-3">
          <span className="text-gray-700 dark:text-gray-200">Due Date (optional)</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded px-3 py-2"
          />
        </label>

        <button
          onClick={handleAddTask}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition"
        >
          Add Task
        </button>
      </div>
    </div>
  );
}