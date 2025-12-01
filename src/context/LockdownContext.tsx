"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { watchAuthState } from "@/lib/auth";
import { getUserPomodoro, incrementPomodoro } from "@/lib/pomodoro";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

interface TimerState {
    timeLeft: number;
    isRunning: boolean;
    mode: TimerMode;
    endTime: number | null;
}

interface LockdownContextType {
    isLocked: boolean;
    timer: TimerState;
    sessions: number;
    startLockdown: () => Promise<void>;
    endLockdown: () => void;
    toggleTimer: () => Promise<void>;
    setMode: (mode: TimerMode) => Promise<void>;
    getTotalTime: (mode: TimerMode) => number;
}

const LockdownContext = createContext<LockdownContextType | null>(null);

export function useLockdown() {
    const context = useContext(LockdownContext);
    if (!context) {
        throw new Error("useLockdown must be used within a LockdownProvider");
    }
    return context;
}

export function LockdownProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [sessions, setSessions] = useState(0);
    const [timer, setTimer] = useState<TimerState>({
        timeLeft: POMODORO_TIME,
        isRunning: false,
        mode: "pomodoro",
        endTime: null,
    });

    const timerDocRef = user ? doc(db, "timer", user.uid) : null;
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const getTotalTime = (m: TimerMode) =>
        m === "pomodoro" ? POMODORO_TIME : m === "shortBreak" ? SHORT_BREAK_TIME : LONG_BREAK_TIME;

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio("/notification.mp3");
    }, []);

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
    };

    // Auth & Initial Data Load
    useEffect(() => {
        const unsub = watchAuthState(async (u) => {
            setUser(u);
            if (!u) {
                setSessions(0);
                setTimer({ timeLeft: POMODORO_TIME, isRunning: false, mode: "pomodoro", endTime: null });
                return;
            }

            // Load sessions
            const s = await getUserPomodoro(u.uid);
            setSessions(s);

            // Listen to timer updates from Firestore (for multi-tab sync)
            const unsubTimer = onSnapshot(doc(db, "timer", u.uid), (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    const { mode, endTime, isRunning, timeLeft: savedTimeLeft } = data;

                    // Calculate remaining time
                    let remaining;
                    if (isRunning && endTime) {
                        remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                    } else {
                        remaining = savedTimeLeft !== undefined ? savedTimeLeft : getTotalTime(mode || "pomodoro");
                    }

                    setTimer(prev => ({
                        ...prev,
                        mode: mode || "pomodoro",
                        endTime: endTime || null,
                        isRunning: isRunning || false,
                        timeLeft: remaining
                    }));
                }
            });

            return () => unsubTimer();
        });
        return () => unsub();
    }, []);

    // Timer Interval Logic
    useEffect(() => {
        if (!timer.isRunning || !timer.endTime) return;

        const interval = setInterval(async () => {
            const remaining = Math.max(0, Math.floor((timer.endTime! - Date.now()) / 1000));

            setTimer(prev => ({ ...prev, timeLeft: remaining }));

            if (remaining <= 0) {
                // Timer Finished
                clearInterval(interval);
                playSound();
                toast.success("Session complete!", { icon: "🍅" });

                if (timer.mode === "pomodoro" && user) {
                    const newSessions = await incrementPomodoro(user.uid);
                    setSessions(newSessions);
                }

                // Stop timer in Firestore
                if (timerDocRef) {
                    const resetTime = getTotalTime(timer.mode);
                    await updateDoc(timerDocRef, {
                        isRunning: false,
                        endTime: null,
                        timeLeft: resetTime
                    });
                    // Update local state immediately to avoid flicker
                    setTimer(prev => ({ ...prev, timeLeft: resetTime, isRunning: false, endTime: null }));
                }

                // Auto-unlock if in lockdown
                if (isLocked) {
                    endLockdown();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timer.isRunning, timer.endTime, user, isLocked]);

    // Prevent tab closing when locked
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isLocked) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isLocked]);

    // Sync isLocked with actual fullscreen state
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsLocked(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const startLockdown = async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
            setIsLocked(true);

            // Start timer if not running
            if (!timer.isRunning) {
                await toggleTimer();
            }
        } catch (err) {
            console.error("Fullscreen denied:", err);
            toast.error("Could not enter fullscreen mode");
        }
    };

    const endLockdown = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error);
        }
        setIsLocked(false);
    };

    const toggleTimer = async () => {
        if (!user || !timerDocRef) return;

        const newIsRunning = !timer.isRunning;
        let newEndTime = null;

        if (newIsRunning) {
            // Starting: Calculate new end time based on current timeLeft
            newEndTime = Date.now() + timer.timeLeft * 1000;
        }

        await setDoc(timerDocRef, {
            mode: timer.mode,
            endTime: newEndTime,
            isRunning: newIsRunning,
            timeLeft: timer.timeLeft
        }, { merge: true });
    };

    const setMode = async (newMode: TimerMode) => {
        const newTime = getTotalTime(newMode);
        setTimer(prev => ({ ...prev, mode: newMode, timeLeft: newTime, isRunning: false }));

        if (user && timerDocRef) {
            await setDoc(timerDocRef, {
                mode: newMode,
                endTime: null,
                isRunning: false,
                timeLeft: newTime
            }, { merge: true });
        }
    };

    return (
        <LockdownContext.Provider value={{
            isLocked,
            timer,
            sessions,
            startLockdown,
            endLockdown,
            toggleTimer,
            setMode,
            getTotalTime
        }}>
            {children}
        </LockdownContext.Provider>
    );
}
