"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [major, setMajor] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const db = getFirestore();

  // Load dark mode and user profile
  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored === "true") setDarkMode(true);

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

  // Apply dark mode class
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) html.classList.add("dark");
    else html.classList.remove("dark");

    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

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
    } catch (err: any) {
      setMessage("Error updating password: " + err.message);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Dark Mode */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-lg">Dark Mode</span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`px-4 py-2 rounded ${
            darkMode ? "bg-gray-700 text-white" : "bg-gray-300 text-black"
          }`}
        >
          {darkMode ? "On" : "Off"}
        </button>
      </div>

      {/* Profile Info */}
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold">Profile</h2>
        <input type="text" placeholder="Full Name" className="p-2 rounded border w-full dark:bg-slate-700 dark:text-gray-100" value={fullName} onChange={e => setFullName(e.target.value)} />
        <input type="text" placeholder="Age / Year" className="p-2 rounded border w-full dark:bg-slate-700 dark:text-gray-100" value={age} onChange={e => setAge(e.target.value)} />
        <input type="text" placeholder="Major" className="p-2 rounded border w-full dark:bg-slate-700 dark:text-gray-100" value={major} onChange={e => setMajor(e.target.value)} />
        <input type="text" placeholder="Primary Goal" className="p-2 rounded border w-full dark:bg-slate-700 dark:text-gray-100" value={primaryGoal} onChange={e => setPrimaryGoal(e.target.value)} />
        <input type="number" placeholder="Daily Study Goal" className="p-2 rounded border w-full dark:bg-slate-700 dark:text-gray-100" value={dailyGoal} onChange={e => setDailyGoal(e.target.value)} />
        <button onClick={saveProfile} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Profile</button>
      </div>

      {/* Security & Privacy */}
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold">Security & Privacy</h2>
        <input type="password" placeholder="Current Password" className="p-2 rounded border w-full dark:bg-slate-700 dark:text-gray-100" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        <input type="password" placeholder="New Password" className="p-2 rounded border w-full dark:bg-slate-700 dark:text-gray-100" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <button onClick={changePassword} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Change Password</button>
      </div>

      {/* About */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">About</h2>
        <p className="text-gray-700 dark:text-gray-300">ADHD Companion helps students manage tasks, stay focused, and track their progress efficiently. Version 1.0</p>
      </div>

      {message && <div className="text-green-600 mt-4">{message}</div>}
    </div>
  );
}