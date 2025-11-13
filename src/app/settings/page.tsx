"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);

  // Load user preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored === "true") setDarkMode(true);
  }, []);

  // Apply class to <html> and save preference
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) html.classList.add("dark");
    else html.classList.remove("dark");

    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="flex items-center justify-between mb-4">
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
    </div>
  );
}