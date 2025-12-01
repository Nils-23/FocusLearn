"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { watchAuthState } from "@/lib/auth";
import { getUserTasks, toggleTaskCompleted, deleteUserTask, updateUserTask } from "@/lib/tasks";

export default function TasksPage() {
    const [user, setUser] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Watch auth state
    useEffect(() => {
        const unsub = watchAuthState((u) => {
            setUser(u);
            if (!u) router.push("/login");
        });
        return () => unsub();
    }, [router]);

    // Load data
    useEffect(() => {
        if (!user) return;
        const loadData = async () => {
            try {
                setLoading(true);
                const t = await getUserTasks(user.uid);
                setTasks(t);
            } catch (error) {
                console.error("Error loading tasks:", error);
                toast.error("Failed to load tasks.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    // Toggle task completion
    const toggleTaskDone = async (task: any) => {
        await toggleTaskCompleted(task.id, !task.completed);
        setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
        );
        if (!task.completed) {
            toast.success("Nice work! Task completed 🎉");
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
        }
    };

    // Delete task
    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        await deleteUserTask(taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success("Task deleted.");
    };

    // Edit task
    const handleEditTask = async (task: any) => {
        const newTitle = prompt("Edit task title:", task.title);
        if (!newTitle) return;
        await updateUserTask(task.id, { title: newTitle });
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title: newTitle } : t)));
        toast.success("Task updated!");
    };

    if (loading && !user) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 md:p-10 min-h-screen bg-gray-50 relative">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/" className="text-sm text-slate-500 hover:text-blue-600 mb-2 inline-block">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">All Tasks</h1>
                        <p className="text-slate-600 text-sm md:text-base">Manage all your tasks here ✨</p>
                    </div>
                    <Link
                        href="/add"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + New Task
                    </Link>
                </div>

                {tasks.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-lg">No tasks found.</p>
                        <Link href="/add" className="text-blue-500 hover:underline mt-2 inline-block">
                            Create your first task
                        </Link>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {tasks.map((task) => (
                            <li
                                key={task.id}
                                className="group flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => toggleTaskDone(task)}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${task.completed
                                            ? "bg-[#81C784] border-[#81C784]"
                                            : "border-slate-300 hover:border-[#81C784]"
                                            }`}
                                    >
                                        {task.completed && (
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                    <div className="flex flex-col">
                                        <span className={`text-lg font-medium transition-all duration-200 ${task.completed ? "text-slate-400 line-through" : "text-slate-700"
                                            }`}>
                                            {task.title}
                                        </span>
                                        {task.description && (
                                            <span className={`text-sm transition-all duration-200 ${task.completed ? "text-slate-300" : "text-slate-500"}`}>
                                                {task.description}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="group/menu relative">
                                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                            </svg>
                                        </button>
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 hidden group-hover/menu:block z-10">
                                            <button
                                                onClick={() => handleEditTask(task)}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-500"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-red-500"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
