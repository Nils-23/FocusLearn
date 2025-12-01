"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { watchAuthState } from "@/lib/auth";
import { getUserPomodoro } from "@/lib/pomodoro";
import { getUserTasks, toggleTaskCompleted, deleteUserTask, updateUserTask } from "@/lib/tasks";
import { useLockdown } from "@/context/LockdownContext";

export default function HomePage() {
  const { isLocked, startLockdown, timer } = useLockdown();
  const [user, setUser] = useState<any>(null);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const [showStartModal, setShowStartModal] = useState(false);

  // Watch auth state
  useEffect(() => {
    const unsub = watchAuthState((u) => {
      setUser(u);
      setAuthChecked(true);
      if (!u) router.push("/login");
      else {
        // Check if we should show start modal
        // Show if not locked and timer not running
        if (!isLocked && !timer.isRunning) {
          setShowStartModal(true);
        }
      }
    });
    return () => unsub();
  }, [router, isLocked, timer.isRunning]);

  // Load data
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const t = await getUserTasks(user.uid);
        setTasks(t);
        const p = await getUserPomodoro(user.uid);
        setPomodoroSessions(p);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load tasks.");
      }
    };
    loadData();
  }, [user]);

  // Compute progress
  useEffect(() => {
    if (tasks.length === 0) {
      setProgress(0);
      return;
    }
    const completedCount = tasks.filter((t) => t.completed).length;
    const percent = Math.round((completedCount / tasks.length) * 100);
    setProgress(percent);
  }, [tasks]);

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

  const dueTasks = tasks.filter(
    (t) => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()
  );

  // Progress ring math
  const ring = useMemo(() => {
    const size = 120;
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (progress / 100) * circumference;
    return { size, stroke, radius, circumference, dashOffset };
  }, [progress]);

  const handleStartSession = async () => {
    await startLockdown();
    setShowStartModal(false);
    toast.success("Focus Mode Activated! 🚀");
  };

  if (!authChecked) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-50 relative">
      {/* Start Session Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-2">Ready to Focus?</h2>
            <p className="text-slate-600 mb-8">
              Let's block out distractions and get things done.
              We'll start a timer and enter fullscreen mode.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartSession}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:brightness-110 transition-all active:scale-95"
              >
                Start Focus Session
              </button>
              <button
                onClick={() => setShowStartModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium py-2"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* ... existing content ... */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-600 text-sm md:text-base">Small steps, big progress ✨</p>
        </div>

        {/* Stat cards */}
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-[5px_5px_10px_#ebebeb,-5px_-5px_10px_#ffffff] p-6 hover:shadow-[inset_5px_5px_10px_#ebebeb,inset_-5px_-5px_10px_#ffffff] transition-all duration-300">
            <p className="text-slate-400 text-sm font-medium">Total Tasks</p>
            <p className="text-5xl font-bold mt-2 text-[#90CAF9]">{tasks.length}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-[5px_5px_10px_#ebebeb,-5px_-5px_10px_#ffffff] p-6 hover:shadow-[inset_5px_5px_10px_#ebebeb,inset_-5px_-5px_10px_#ffffff] transition-all duration-300">
            <p className="text-slate-400 text-sm font-medium">Due Tasks</p>
            <p className="text-5xl font-bold mt-2 text-[#FFB74D]">{dueTasks.length}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-[5px_5px_10px_#ebebeb,-5px_-5px_10px_#ffffff] p-4 hover:shadow-[inset_5px_5px_10px_#ebebeb,inset_-5px_-5px_10px_#ffffff] transition-all duration-300 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-600">{progress}%</span>
            </div>
            <svg width={ring.size} height={ring.size} className="shrink-0 rotate-[-90deg]">
              <circle
                cx={ring.size / 2}
                cy={ring.size / 2}
                r={ring.radius}
                stroke="#f1f5f9"
                strokeWidth={12}
                fill="transparent"
              />
              <circle
                cx={ring.size / 2}
                cy={ring.size / 2}
                r={ring.radius}
                stroke="#81C784"
                strokeWidth={12}
                fill="transparent"
                strokeDasharray={ring.circumference}
                strokeDashoffset={ring.dashOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 600ms ease" }}
              />
            </svg>
          </div>

          <div className="bg-white rounded-3xl shadow-[5px_5px_10px_#ebebeb,-5px_-5px_10px_#ffffff] p-6 hover:shadow-[inset_5px_5px_10px_#ebebeb,inset_-5px_-5px_10px_#ffffff] transition-all duration-300">
            <p className="text-slate-400 text-sm font-medium">Pomodoro Today</p>
            <p className="text-5xl font-bold mt-2 text-[#90CAF9]">{pomodoroSessions}</p>
          </div>
        </div>

        {/* Recent tasks */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-slate-500 pl-2">Recent Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-slate-400 pl-2">No tasks yet. Add one from the "+" tab.</p>
          ) : (
            <ul className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
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

          {tasks.length > 5 && (
            <Link href="/tasks" className="block text-[#90CAF9] mt-6 text-sm font-medium text-center cursor-pointer hover:underline">
              View all tasks →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}