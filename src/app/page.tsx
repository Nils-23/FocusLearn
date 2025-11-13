"use client";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

type Task = {
  id: number;
  title: string;
  dueDate?: string;
  completed: boolean;
};

export default function HomePage() {
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState(0);

  // ✅ Load saved sessions and tasks when the page loads
  useEffect(() => {
    const storedSessions = localStorage.getItem("pomodoroSessions");
    if (storedSessions) setPomodoroSessions(parseInt(storedSessions));

    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) setTasks(JSON.parse(storedTasks));
  }, []);

  // ✅ Compute progress when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      const completed = tasks.filter((t) => t.completed).length;
      setProgress(Math.round((completed / tasks.length) * 100));
    } else {
      setProgress(0);
    }
  }, [tasks]);

  // ✅ Mark a task as done
  const toggleTaskDone = (id: number) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    localStorage.setItem("tasks", JSON.stringify(updated));
    const now = updated.find((t) => t.id === id);
    if (now && now.completed) {
      toast.success("Nice work! Task completed 🎉");
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
    }
  };

  const dueTasks = tasks.filter(
    (t) => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()
  );

  const ring = useMemo(() => {
    const size = 120;
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (progress / 100) * circumference;
    return { size, stroke, radius, circumference, dashOffset };
  }, [progress]);

  return (
    <div className="p-6 md:p-10 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-600 text-sm md:text-base">Small steps, big progress ✨</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-5 md:p-6 hover:shadow-lg transition-all">
            <p className="text-slate-500">Total Tasks</p>
            <p className="text-4xl font-semibold mt-2">{tasks.length}</p>
          </div>
          <div className="bg-[#FFF7ED] rounded-2xl shadow-md p-5 md:p-6 hover:shadow-lg transition-all">
            <p className="text-slate-600">Due Tasks</p>
            <p className="text-4xl font-semibold mt-2 text-[#F97316]">{dueTasks.length}</p>
          </div>
          <div className="bg-[#E0E7FF] rounded-2xl shadow-md p-5 md:p-6 hover:shadow-lg transition-all flex items-center gap-5">
            <svg width={ring.size} height={ring.size} className="shrink-0">
              <circle
                cx={ring.size / 2}
                cy={ring.size / 2}
                r={ring.radius}
                stroke="#CBD5E1"
                strokeWidth={ring.stroke}
                fill="transparent"
              />
              <circle
                cx={ring.size / 2}
                cy={ring.size / 2}
                r={ring.radius}
                stroke="#22C55E"
                strokeWidth={ring.stroke}
                fill="transparent"
                strokeDasharray={ring.circumference}
                strokeDashoffset={ring.dashOffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 600ms ease" }}
              />
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                className="fill-slate-700 text-xl font-semibold"
              >
                {progress}%
              </text>
            </svg>
            <div>
              <p className="text-slate-600">Progress</p>
              <p className="text-sm text-slate-500 leading-relaxed">Keep going — you’re doing great!</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5 md:p-6 hover:shadow-lg transition-all">
            <p className="text-slate-500">Pomodoro Today</p>
            <p className="text-4xl font-semibold mt-2 text-[#4F46E5]">{pomodoroSessions}</p>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-md p-5 md:p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-slate-500">No tasks yet. Add one from the "+" tab.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <li
                  key={task.id}
                  className={`flex justify-between items-center border-b last:border-b-0 pb-3 ${
                    task.completed ? "opacity-60 line-through" : ""
                  }`}
                >
                  <span className="text-lg">{task.title}</span>
                  <button
                    onClick={() => toggleTaskDone(task.id)}
                    className={`text-sm px-3 py-1 rounded-lg transition-all shadow-sm ${
                      task.completed
                        ? "bg-slate-300 text-white"
                        : "bg-[#22C55E] text-white hover:brightness-110"
                    }`}
                  >
                    {task.completed ? "Undo" : "Done"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tasks.length > 5 && (
            <p className="text-[#4F46E5] mt-4 text-sm">View more in the Tasks tab →</p>
          )}
        </div>
      </div>
    </div>
  );
}
