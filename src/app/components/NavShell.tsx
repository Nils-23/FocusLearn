"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { watchAuthState, logoutUser } from "@/lib/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      title={label}
      className={`flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl transition-all text-lg md:text-base select-none ${
        isActive
          ? "bg-[#E0E7FF] text-[#4F46E5] shadow-md ring-1 ring-[#E0E7FF]"
          : "text-slate-600 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-slate-700"
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

export default function NavShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = watchAuthState(async (u) => {
      if (u) {
        setUser(u);
        const db = getFirestore();
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFullName(docSnap.data().fullName || u.email);
        } else {
          setFullName(u.email);
        }
      } else {
        setUser(null);
        setFullName(null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  if (!user) {
    // No sidebar if user is not logged in
    return <div>{children}</div>;
  }

  return (
    <div>
      <Toaster
        position="top-center"
        toastOptions={{
          success: { style: { background: "#EFFFF5", color: "#065F46" } },
          duration: 2500,
        }}
      />

      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-slate-800 border-r shadow-sm px-3 py-6">
        <div className="w-full flex flex-col gap-2">
          <div className="px-4 py-2 mb-2 text-xl font-semibold text-[#4F46E5] dark:text-white">
            ADHD Companion
          </div>
          <div className="px-4 py-2 mb-4 text-slate-700 dark:text-gray-200">
            Welcome, {fullName}
          </div>
          <NavItem href="/" icon="🏠" label="Home" />
          <NavItem href="/add" icon="➕" label="Add" />
          <NavItem href="/timer" icon="⏱" label="Timer" />
          <NavItem href="/settings" icon="⚙" label="Settings" />
          <NavItem href="/upload" icon="📤" label="Upload" />
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 text-left rounded-xl hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-400"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 dark:bg-slate-800 backdrop-blur border shadow-lg rounded-2xl px-3 py-2 flex items-center gap-2">
        <NavItem href="/" icon="🏠" label="Home" />
        <NavItem href="/add" icon="➕" label="Add" />
        <NavItem href="/timer" icon="⏱" label="Timer" />
        <NavItem href="/settings" icon="⚙" label="Settings" />
        <NavItem href="/upload" icon="📤" label="Upload" />
        <button
          onClick={handleLogout}
          className="px-2 py-1 text-red-600 dark:text-red-400"
        >
          Log Out
        </button>
      </nav>

      <main className="transition-all md:pl-60 pb-24 md:pb-0">
        <div className="animate-[fadeIn_300ms_ease]">{children}</div>
      </main>
    </div>
  );
}