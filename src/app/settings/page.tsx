"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [major, setMajor] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const db = getFirestore();

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFullName(data.fullName || "");
          setAge(data.age || "");
          setMajor(data.major || "");
          setPrimaryGoal(data.primaryGoal || "");
          setDailyGoal(data.dailyGoal || "");
        }
      }
    };

    loadUserProfile();
  }, []);

  const saveProfile = async () => {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        age,
        major,
        primaryGoal,
        dailyGoal,
      }, { merge: true });
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const changePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage("Error updating password: " + err.message);
    }
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

      <div className="relative z-10 min-h-screen p-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>

        <div className="w-full max-w-2xl space-y-6">
          {/* Dark Mode */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌙</span>
              <span className="text-lg font-medium text-slate-800 dark:text-white">Dark Mode</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${darkMode
                  ? "bg-slate-700 text-white shadow-inner"
                  : "bg-white text-slate-800 shadow-md hover:shadow-lg"
                }`}
            >
              {darkMode ? "On" : "Off"}
            </button>
          </div>

          {/* Profile Info */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50 dark:border-slate-700/50 space-y-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <span>👤</span> Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all w-full"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Age / Year"
                className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all w-full"
                value={age}
                onChange={e => setAge(e.target.value)}
              />
              <input
                type="text"
                placeholder="Major"
                className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all w-full"
                value={major}
                onChange={e => setMajor(e.target.value)}
              />
              <input
                type="text"
                placeholder="Primary Goal"
                className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all w-full"
                value={primaryGoal}
                onChange={e => setPrimaryGoal(e.target.value)}
              />
              <input
                type="number"
                placeholder="Daily Study Goal (mins)"
                className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-400 outline-none transition-all w-full md:col-span-2"
                value={dailyGoal}
                onChange={e => setDailyGoal(e.target.value)}
              />
            </div>
            <button
              onClick={saveProfile}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Save Profile
            </button>
          </div>

          {/* Security & Privacy */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/50 dark:border-slate-700/50 space-y-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <span>🔒</span> Security
            </h2>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-400 outline-none transition-all w-full"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="New Password"
                className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-400 outline-none transition-all w-full"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <button
              onClick={changePassword}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Change Password
            </button>
          </div>

          {/* About */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-white/30 dark:border-slate-700/30 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              ADHD Companion v1.0 • Built with ❤️ for focus
            </p>
          </div>

          {message && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-emerald-500 text-white rounded-full shadow-lg animate-[fadeIn_300ms_ease-out]">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}