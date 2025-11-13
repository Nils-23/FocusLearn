"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";

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
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

export default function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Toaster position="top-center" toastOptions={{
        success: { style: { background: "#EFFFF5", color: "#065F46" } },
        duration: 2500,
      }} />

      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-white border-r shadow-sm px-3 py-6">
        <div className="w-full flex flex-col gap-2">
          <Link href="/" className="px-4 py-2 mb-2 text-xl font-semibold text-[#4F46E5]">ADHD Companion</Link>
          <NavItem href="/" icon="🏠" label="Home" />
          <NavItem href="/add" icon="➕" label="Add" />
          <NavItem href="/timer" icon="⏱" label="Timer" />
          <NavItem href="/settings" icon="⚙" label="Settings" />
          <NavItem href="/upload" icon="📤" label="Upload" />
        </div>
      </div>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur border shadow-lg rounded-2xl px-3 py-2 flex items-center gap-2">
        <NavItem href="/" icon="🏠" label="Home" />
        <NavItem href="/add" icon="➕" label="Add" />
        <NavItem href="/timer" icon="⏱" label="Timer" />
        <NavItem href="/settings" icon="⚙" label="Settings" />
        <NavItem href="/upload" icon="📤" label="Upload" />
      </nav>

      <main className="transition-all md:pl-60 pb-24 md:pb-0">
        <div className="animate-[fadeIn_300ms_ease]">{children}</div>
      </main>
    </div>
  );
}


