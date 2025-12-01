"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { watchAuthState } from "@/lib/auth";
import { addUserTask } from "@/lib/tasks";

export default function AddTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🔐 Watch authentication
  useEffect(() => {
    const unsub = watchAuthState((u) => {
      if (!u) router.push("/login");
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setLoading(true);
    try {
      await addUserTask(user.uid, {
        title,
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        // completed and createdAt are handled by the function/backend if not in type
      });
    } catch (e) {
      console.error("Error adding task:", e);
    }

    setTitle("");
    setDescription("");
    setDueDate("");
    setLoading(false);

    router.push("/");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 z-0">
        {/* Soft light blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-200/30 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "12s", animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add New Task
          </h1>

          <form onSubmit={handleAddTask} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 dark:border-slate-700/50 space-y-6">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all resize-none"
                placeholder="Add a small description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Due Date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Task"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}