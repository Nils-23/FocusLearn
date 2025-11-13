"use client";
import { useState, useEffect } from "react";
import { registerUser, loginUser, watchAuthState } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { doc, setDoc, getFirestore } from "firebase/firestore";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [major, setMajor] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = watchAuthState((user) => {
      if (user) router.push("/upload");
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const userCred = await registerUser(email, password);
        const db = getFirestore();
        await setDoc(doc(db, "users", userCred.user.uid), {
          fullName,
          email,
          age,
          major,
          primaryGoal,
          dailyGoal,
          createdAt: new Date(),
        });
      } else {
        await loginUser(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-4 text-slate-800 dark:text-gray-100">
          {isRegister ? "Create Account" : "Welcome Back"}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                className="p-2 rounded border dark:bg-slate-700 dark:text-gray-100"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Age / Year in College"
                className="p-2 rounded border dark:bg-slate-700 dark:text-gray-100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Major / Field of Study"
                className="p-2 rounded border dark:bg-slate-700 dark:text-gray-100"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Primary Goal"
                className="p-2 rounded border dark:bg-slate-700 dark:text-gray-100"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Daily Study Goal (sessions per day)"
                className="p-2 rounded border dark:bg-slate-700 dark:text-gray-100"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            className="p-2 rounded border dark:bg-slate-700 dark:text-gray-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="p-2 rounded border dark:bg-slate-700 dark:text-gray-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : isRegister ? "Sign Up" : "Log In"}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-600 dark:text-gray-400">
          {isRegister ? "Already have an account?" : "Don’t have an account?"}{" "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 hover:underline"
          >
            {isRegister ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}