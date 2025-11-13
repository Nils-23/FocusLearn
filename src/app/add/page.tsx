"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Task = {
  id: number;
  title: string;
  dueDate?: string;
  completed: boolean;
};

export default function AddTaskPage() {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const router = useRouter();

  const handleAddTask = () => {
    if (!title.trim()) return;

    // ✅ Get existing tasks from localStorage
    const storedTasks = localStorage.getItem("tasks");
    const tasks: Task[] = storedTasks ? JSON.parse(storedTasks) : [];

    // ✅ Create new task
    const newTask: Task = {
      id: Date.now(),
      title,
      dueDate,
      completed: false,
    };

    // ✅ Append and save
    const updatedTasks = [...tasks, newTask];
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));

    // ✅ Redirect or clear
    setTitle("");
    setDueDate("");
    router.push("/"); // go back to home dashboard
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Add New Task</h1>

      <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
        <label className="block mb-3">
          <span className="text-gray-700">Task Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Enter task title"
          />
        </label>

        <label className="block mb-3">
          <span className="text-gray-700">Due Date (optional)</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
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
