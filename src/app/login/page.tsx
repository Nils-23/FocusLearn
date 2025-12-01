"use client";
import { useState, useEffect } from "react";
import { registerUser, loginUser, watchAuthState, resetPassword } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { FiUser, FiMail, FiLock, FiBook, FiTarget, FiCalendar, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import Image from "next/image";

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
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = watchAuthState((user) => {
      if (user) router.push("/");
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      toast.success("Password reset link sent! Check your email.");
      setShowForgotModal(false);
      setResetEmail("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5] relative overflow-hidden">
      {/* Decorative Blobs */}
      {/* Decorative Background Shapes */}
      {/* Top Left - Pastel Blue Wave */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none -translate-x-[20%] -translate-y-[20%]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#E1F5FE] fill-current opacity-80">
          <path d="M0 0 L150 0 C 150 50 120 120 0 150 Z" />
        </svg>
      </div>

      {/* Top Right - Mint Green Wave */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none translate-x-[20%] -translate-y-[20%]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#E8F5E9] fill-current opacity-80">
          <path d="M50 0 L200 0 L200 150 C 120 120 50 50 50 0 Z" />
        </svg>
      </div>

      {/* Bottom Right - Layered Ripples */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none translate-x-[20%] translate-y-[20%]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M100 200 L200 200 L200 100 C 150 120 120 150 100 200 Z" fill="#E1F5FE" className="opacity-80" />
          <path d="M140 200 L200 200 L200 140 C 170 160 160 170 140 200 Z" fill="#E8F5E9" className="opacity-80" />
        </svg>
      </div>

      <div className="w-full max-w-md z-10 p-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-50 h-50 mb-2">
            <Image
              src="/Focus-learn-logo.png"
              alt="FocusLearn Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-[#5C8BC0] mb-2">Let's Focus & Learn!</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8CD4B0] bg-white text-gray-700"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="number"
                  placeholder="Age / Year in College"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8CD4B0] bg-white text-gray-700"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Major / Field of Study"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8CD4B0] bg-white text-gray-700"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Primary Goal"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8CD4B0] bg-white text-gray-700"
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="number"
                  placeholder="Daily Study Goal (sessions)"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8CD4B0] bg-white text-gray-700"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="relative">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="email"
              placeholder="Username or Email"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8CD4B0] bg-white text-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8CD4B0] bg-white text-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div className="flex justify-between items-center text-sm pt-2">
            <button
              type="button"
              className="text-[#78909C] hover:text-[#5C8BC0]"
              onClick={() => {
                setResetEmail(email); // Pre-fill if they typed it in login
                setShowForgotModal(true);
              }}
            >
              Forget Password?
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#78909C] hover:text-[#5C8BC0]"
            >
              {isRegister ? "Log In" : "Sign Up"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8CD4B0] text-white py-3.5 rounded-full font-bold tracking-wide hover:bg-[#7BC29E] transition-colors shadow-md mt-6 disabled:opacity-50"
          >
            {loading ? "PROCESSING..." : isRegister ? "SIGN UP" : "LOGIN"}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiLock className="text-blue-500 text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
              <p className="text-gray-500 mt-2">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8CD4B0] bg-white text-gray-700"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-[#8CD4B0] text-white py-3 rounded-xl font-bold hover:bg-[#7BC29E] transition-colors disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}