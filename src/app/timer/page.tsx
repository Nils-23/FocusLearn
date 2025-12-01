"use client";
import { useMemo } from "react";
import { useLockdown } from "@/context/LockdownContext";

export default function TimerPage() {
  const { timer, toggleTimer, setMode, getTotalTime, sessions } = useLockdown();
  const { timeLeft, isRunning, mode } = timer;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Calculate fill percentage (starts at 100%, decreases to 0%)
  const fillPercentage = useMemo(() => {
    return (timeLeft / getTotalTime(mode)) * 100;
  }, [timeLeft, mode, getTotalTime]);

  // Theme colors based on mode
  const theme = useMemo(() => {
    const nearlyDone = timeLeft <= 60 && isRunning;
    if (nearlyDone) return {
      tomato: "#DC2626",
      tomatoLight: "#FCA5A5",
      stem: "#16A34A",
      glow: "shadow-red-400/50",
      bg: "bg-red-50"
    };
    if (mode === "shortBreak" || mode === "longBreak") return {
      tomato: "#3B82F6",
      tomatoLight: "#93C5FD",
      stem: "#10B981",
      glow: "shadow-blue-400/50",
      bg: "bg-blue-50"
    };
    return {
      tomato: "#EF4444",
      tomatoLight: "#FCA5A5",
      stem: "#22C55E",
      glow: "shadow-red-300/50",
      bg: "bg-red-50"
    };
  }, [mode, timeLeft, isRunning]);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-8 ${theme.bg} transition-colors duration-500`}>
      {/* Header with tomato emoji */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center justify-center gap-3">
          <span className="text-5xl">🍅</span>
          <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            Pomodoro Timer
          </span>
        </h1>
        <p className="text-slate-600 text-sm md:text-base">Stay focused, one tomato at a time</p>
      </div>

      {/* Mode selector */}
      <div className="mb-8 bg-white rounded-2xl shadow-lg border-2 border-white/50 p-1.5 flex overflow-hidden backdrop-blur-sm">
        {[
          { k: "pomodoro", label: "🍅 Focus", icon: "🍅" },
          { k: "shortBreak", label: "☕ Short Break", icon: "☕" },
          { k: "longBreak", label: "🌿 Long Break", icon: "🌿" },
        ].map((b) => (
          <button
            key={b.k}
            onClick={() => setMode(b.k as any)}
            className={`px-5 py-2.5 rounded-xl transition-all text-sm md:text-base font-medium ${mode === b.k
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md scale-105"
                : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Tomato Timer */}
      <div className={`relative mb-8 ${theme.glow} transition-all duration-500`}>
        <div className="relative w-80 h-80 md:w-96 md:h-96">
          <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
            {/* Tomato outline/shape */}
            <defs>
              <linearGradient id="tomatoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme.tomato} stopOpacity="1" />
                <stop offset="100%" stopColor={theme.tomatoLight} stopOpacity="1" />
              </linearGradient>
              <clipPath id="tomatoClip">
                {/* Tomato shape - wider at top, narrower at bottom */}
                <path d="M 100 40 Q 140 40 160 80 Q 180 120 170 180 Q 160 220 100 220 Q 40 220 30 180 Q 20 120 40 80 Q 60 40 100 40 Z" />
              </clipPath>
            </defs>

            {/* Background tomato shape (empty) */}
            <path
              d="M 100 40 Q 140 40 160 80 Q 180 120 170 180 Q 160 220 100 220 Q 40 220 30 180 Q 20 120 40 80 Q 60 40 100 40 Z"
              fill="#FEE2E2"
              stroke="#FCA5A5"
              strokeWidth="2"
              opacity="0.3"
            />

            {/* Filled tomato (clipped to show fill level) */}
            <g clipPath="url(#tomatoClip)">
              <rect
                x="0"
                y={40 + (220 - 40) * (1 - fillPercentage / 100)}
                width="200"
                height={220 - 40}
                fill="url(#tomatoGradient)"
                style={{
                  transition: "y 1s linear, height 1s linear",
                }}
              />
              {/* Highlight effect */}
              <ellipse
                cx="100"
                cy="100"
                rx="50"
                ry="60"
                fill="white"
                opacity="0.2"
              />
            </g>

            {/* Tomato stem and leaves */}
            <g>
              {/* Stem */}
              <rect
                x="95"
                y="20"
                width="10"
                height="25"
                fill={theme.stem}
                rx="5"
              />
              {/* Leaves */}
              <ellipse
                cx="85"
                cy="25"
                rx="12"
                ry="8"
                fill="#22C55E"
                transform="rotate(-30 85 25)"
              />
              <ellipse
                cx="115"
                cy="25"
                rx="12"
                ry="8"
                fill="#22C55E"
                transform="rotate(30 115 25)"
              />
              <ellipse
                cx="100"
                cy="18"
                rx="10"
                ry="6"
                fill="#16A34A"
              />
            </g>

            {/* Tomato shine/reflection */}
            <ellipse
              cx="90"
              cy="80"
              rx="25"
              ry="35"
              fill="white"
              opacity="0.3"
            />
          </svg>

          {/* Time display overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              className="text-6xl md:text-7xl font-mono font-bold drop-shadow-lg"
              style={{
                color: fillPercentage > 50 ? "#FFFFFF" : "#DC2626",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
              }}
            >
              {formatTime(timeLeft)}
            </div>
            <div
              className="text-lg md:text-xl mt-2 font-semibold"
              style={{
                color: fillPercentage > 50 ? "#FFFFFF" : "#DC2626",
                textShadow: "1px 1px 2px rgba(0,0,0,0.2)"
              }}
            >
              {isRunning ? "⏱️ Running" : "⏸️ Paused"}
            </div>
          </div>
        </div>

        {/* Progress indicator dots */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${fillPercentage > (10 - i) * 10
                  ? "bg-red-500 scale-125"
                  : "bg-gray-300"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-4 mb-8">
        {!isRunning ? (
          <button
            onClick={toggleTimer}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl shadow-lg transition-all hover:brightness-110 hover:scale-105 active:scale-95 font-semibold text-lg flex items-center gap-2"
          >
            <span>▶️</span>
            <span>Start</span>
          </button>
        ) : (
          <button
            onClick={toggleTimer}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-2xl shadow-lg transition-all hover:brightness-110 hover:scale-105 active:scale-95 font-semibold text-lg flex items-center gap-2"
          >
            <span>⏸️</span>
            <span>Pause</span>
          </button>
        )}
      </div>

      {/* Stats card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-white/50">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🍅</div>
          <div>
            <p className="text-slate-600 text-sm">Sessions Completed Today</p>
            <p className="text-3xl font-bold text-red-600">{sessions}</p>
          </div>
        </div>
        {sessions > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              {sessions === 1
                ? "Great start! Keep the momentum going! 🎉"
                : sessions < 4
                  ? `Amazing! ${sessions} tomatoes harvested today! 🌱`
                  : `Incredible! ${sessions} tomatoes! You're on fire! 🔥`}
            </p>
          </div>
        )}
      </div>

      {/* Decorative tomatoes */}
      <div className="absolute top-20 left-10 text-4xl opacity-20 hidden md:block animate-bounce" style={{ animationDuration: "3s" }}>
        🍅
      </div>
      <div className="absolute bottom-20 right-10 text-4xl opacity-20 hidden md:block animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
        🍅
      </div>
    </div>
  );
}