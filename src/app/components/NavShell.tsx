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
      className={`flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl transition-all text-lg md:text-base select-none relative ${isActive
        ? "text-[#90CAF9] font-medium"
        : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#90CAF9] rounded-r-full" />
      )}
      <span aria-hidden className={isActive ? "text-[#90CAF9]" : "text-slate-400"}>{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

export default function NavShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = watchAuthState(async (u) => {
      setAuthChecked(true);
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

  // Show children without sidebar if not logged in or auth not checked yet
  if (!authChecked || !user) {
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
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-[#F8F9F4] dark:bg-slate-900 border-r border-transparent dark:border-slate-800 px-3 py-6 z-50 transition-colors">
        <div className="w-full flex flex-col gap-2">
          <div className="px-4 py-2 mb-2 text-xl font-semibold text-[#4A5568] dark:text-indigo-400">
            ADHD Companion
          </div>
          <div className="px-4 py-2 mb-4 text-[#4A5568] dark:text-slate-300">
            Welcome, {fullName}
          </div>
          <NavItem href="/" icon="🏠" label="Home" />
          <NavItem href="/add" icon="➕" label="Add" />
          <NavItem href="/timer" icon="⏱" label="Timer" />
          <NavItem href="/settings" icon="⚙" label="Settings" />
          <NavItem href="/upload" icon="📤" label="Upload" />
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 text-left rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl px-3 py-2 flex items-center gap-2 transition-colors">
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