"use client";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { watchAuthState } from "@/lib/auth";
import { getUserPomodoro, incrementPomodoro } from "@/lib/pomodoro";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

export default function TimerPage() {
  const [user, setUser] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"pomodoro" | "shortBreak" | "longBreak">("pomodoro");
  const [sessions, setSessions] = useState(0);
  const [focusMode, setFocusMode] = useState(false);

  const timerDocRef = user ? doc(db, "timer", user.uid) : null;

  const getTotalTime = (m: typeof mode) =>
    m === "pomodoro" ? POMODORO_TIME : m === "shortBreak" ? SHORT_BREAK_TIME : LONG_BREAK_TIME;

  const playSound = () => new Audio("/notification.mp3").play();

  // Load auth, sessions, timer state, focus mode
  useEffect(() => {
    const unsub = watchAuthState(async (u) => {
      setUser(u);
      if (!u) return;

      const userSessions = await getUserPomodoro(u.uid);
      setSessions(userSessions);

      const timerSnap = await getDoc(doc(db, "timer", u.uid));
      if (timerSnap.exists()) {
        const { mode: savedMode, endTime, isRunning: savedRunning, focusMode: savedFocus } = timerSnap.data() as any;
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setMode(savedMode);
        setTimeLeft(remaining > 0 ? remaining : getTotalTime(savedMode));
        setIsRunning(savedRunning && remaining > 0);
        setFocusMode(savedFocus || false);
      }
    });
    return () => unsub();
  }, []);

  // Timer logic
  useEffect(() => {
    if (!isRunning || !user) return;

    const interval = setInterval(async () => {
      const timerSnap = await getDoc(doc(db, "timer", user.uid));
      let remaining = timeLeft;

      if (timerSnap.exists()) {
        const { endTime } = timerSnap.data() as any;
        remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      }

      setTimeLeft(remaining);

      if (remaining <= 0) {
        playSound();
        toast.success("Session complete! ✨ Take a breather.");
        const newSessions = await incrementPomodoro(user.uid);
        setSessions(newSessions);
        setIsRunning(false);

        if (timerDocRef) {
          await updateDoc(timerDocRef, { isRunning: false, endTime: Date.now() });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, user]);

  const startTimer = async () => {
    if (!user) return;
    const endTime = Date.now() + timeLeft * 1000;

    if (timerDocRef) {
      await setDoc(timerDocRef, { mode, endTime, isRunning: true, focusMode }, { merge: true });
    }

    setIsRunning(true);
  };

  const pauseTimer = async () => {
    if (!user || !timerDocRef) return;
    const endTime = Date.now() + timeLeft * 1000;
    await setDoc(timerDocRef, { mode, endTime, isRunning: false, focusMode }, { merge: true });
    setIsRunning(false);
  };

  const handleModeChange = async (newMode: typeof mode) => {
    setMode(newMode);
    const newTime = getTotalTime(newMode);
    setTimeLeft(newTime);
    setIsRunning(false);

    if (!user) return;
    const endTime = Date.now() + newTime * 1000;
    if (timerDocRef) {
      await setDoc(timerDocRef, { mode: newMode, endTime, isRunning: false, focusMode }, { merge: true });
    }
  };

  const toggleFocusMode = async () => {
    const newFocus = !focusMode;
    setFocusMode(newFocus);
    if (!user || !timerDocRef) return;
    await updateDoc(timerDocRef, { focusMode: newFocus });
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

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Pomodoro Timer</h1>

      {/* Focus Mode Toggle */}
      <div className="mb-6 flex items-center justify-between w-64">
        <span className="text-lg font-medium text-gray-900 dark:text-gray-100">Focus Mode</span>
        <button
          onClick={toggleFocusMode}
          className={`px-4 py-2 rounded ${focusMode ? "bg-green-600 text-white" : "bg-gray-300 text-black"}`}
        >
          {focusMode ? "On" : "Off"}
        </button>
      </div>

      {/* Timer & Mode Buttons */}
      <div className={`pointer-events-${focusMode ? "none" : "auto"} opacity-${focusMode ? "50" : "100"}`}>
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-1 flex overflow-hidden">
          {[
            { k: "pomodoro", label: "Focus" },
            { k: "shortBreak", label: "Short Break" },
            { k: "longBreak", label: "Long Break" },
          ].map((b) => (
            <button
              key={b.k}
              onClick={() => handleModeChange(b.k as any)}
              className={`px-4 py-2 rounded-lg transition-all text-sm md:text-base ${
                mode === b.k
                  ? "bg-[#E0E7FF] dark:bg-[#4338CA] text-[#4F46E5] dark:text-white shadow"
                  : "text-slate-600 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-gray-700"
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
                strokeDashoffset={(1 - timeLeft / getTotalTime(mode)) * (2 * Math.PI * 45)}
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

        {/* Start/Pause Buttons */}
        <div className="space-x-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="bg-[#4F46E5] text-white px-6 py-2 rounded-2xl shadow-md transition-all hover:brightness-110"
            >
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="bg-[#F97316] text-white px-6 py-2 rounded-2xl shadow-md transition-all hover:brightness-110"
            >
              Pause
            </button>
          )}
        </div>

        <p className="mt-6 text-slate-600 dark:text-gray-300">Sessions Completed Today: {sessions}</p>
      </div>

      {/* Lockdown Overlay */}
      {focusMode && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
          <span className="text-2xl font-bold text-gray-700 dark:text-gray-900">Focus Mode Active 🔒</span>
        </div>
      )}
    </div>
  );
}
