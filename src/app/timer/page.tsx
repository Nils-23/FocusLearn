"use client";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

export default function TimerPage() {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"pomodoro" | "shortBreak" | "longBreak">("pomodoro");
  const [sessions, setSessions] = useState(0);

  // 🔄 Restore previous state on load
  useEffect(() => {
    const savedState = localStorage.getItem("pomodoroState");
    if (savedState) {
      const { mode, endTime, isRunning, sessions } = JSON.parse(savedState);
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setMode(mode);
      setSessions(sessions);
      setIsRunning(isRunning && remaining > 0);
      setTimeLeft(remaining > 0 ? remaining : getTotalTime(mode));
    }
  }, []);

  // ⚙️ Helper to get total seconds for current mode
  const getTotalTime = (m: typeof mode) =>
    m === "pomodoro" ? POMODORO_TIME : m === "shortBreak" ? SHORT_BREAK_TIME : LONG_BREAK_TIME;

  // 🎵 Play sound on completion
  const playSound = () => new Audio("/notification.mp3").play();

  // 🧠 Timer logic — runs every second, calculates based on actual clock time
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const saved = localStorage.getItem("pomodoroState");
      if (!saved) return;

      const { mode, endTime, isRunning, sessions } = JSON.parse(saved);
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

      setMode(mode);
      setSessions(sessions);
      setIsRunning(isRunning && remaining > 0);
      setTimeLeft(remaining);

      // ✅ Automatically handle session completion
      if (remaining === 0 && isRunning) {
        playSound();
        toast.success("Session complete! ✨ Take a breather.");
        const newSessions = sessions + 1;
        setSessions(newSessions);
        setIsRunning(false);
        localStorage.setItem(
          "pomodoroState",
          JSON.stringify({
            mode,
            endTime,
            isRunning: false,
            sessions: newSessions,
          })
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // ▶️ Start
  const handleStart = () => {
    const endTime = Date.now() + timeLeft * 1000;
    localStorage.setItem(
      "pomodoroState",
      JSON.stringify({ mode, endTime, isRunning: true, sessions })
    );
    setIsRunning(true);
  };

  // ⏸ Pause
  const handlePause = () => {
    const endTime = Date.now() + timeLeft * 1000;
    localStorage.setItem(
      "pomodoroState",
      JSON.stringify({ mode, endTime, isRunning: false, sessions })
    );
    setIsRunning(false);
  };

  // 🔁 Mode change
  const handleModeChange = (newMode: typeof mode) => {
    const newTime = getTotalTime(newMode);
    const endTime = Date.now() + newTime * 1000;
    setMode(newMode);
    setTimeLeft(newTime);
    setIsRunning(false);
    localStorage.setItem(
      "pomodoroState",
      JSON.stringify({
        mode: newMode,
        endTime,
        isRunning: false,
        sessions,
      })
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const theme = useMemo(() => {
    const nearlyDone = timeLeft <= 15 && isRunning;
    if (nearlyDone) return { ring: "#ef4444", glow: "shadow-red-200" };
    if (mode === "shortBreak" || mode === "longBreak") return { ring: "#3b82f6", glow: "shadow-blue-200" };
    return { ring: "#22C55E", glow: "shadow-green-200" };
  }, [mode, timeLeft, isRunning]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Pomodoro Timer</h1>

      {/* Mode Selector */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border p-1 flex overflow-hidden">
        {[
          { k: "pomodoro", label: "Focus" },
          { k: "shortBreak", label: "Short Break" },
          { k: "longBreak", label: "Long Break" },
        ].map((b) => (
          <button
            key={b.k}
            onClick={() => handleModeChange(b.k as any)}
            className={`px-4 py-2 rounded-lg transition-all text-sm md:text-base ${
              mode === b.k ? "bg-[#E0E7FF] text-[#4F46E5] shadow" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className={`rounded-full p-6 shadow-md ${theme.glow} transition-colors mb-6`}>
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" stroke="#E5E7EB" strokeWidth="10" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={theme.ring}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={
                (1 - timeLeft / getTotalTime(mode)) * (2 * Math.PI * 45)
              }
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl md:text-6xl font-mono" style={{ color: theme.ring }}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-x-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="bg-[#4F46E5] text-white px-6 py-2 rounded-2xl shadow-md transition-all hover:brightness-110"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="bg-[#F97316] text-white px-6 py-2 rounded-2xl shadow-md transition-all hover:brightness-110"
          >
            Pause
          </button>
        )}
      </div>

      <p className="mt-6 text-slate-600">Sessions Completed Today: {sessions}</p>
    </div>
  );
}
