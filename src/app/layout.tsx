import "./globals.css";
import NavShell from "./components/NavShell";

export const metadata = {
  title: "ADHD Companion",
  description: "Stay focused, one task at a time",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-slate-800 min-h-screen">
        <NavShell>
          {children}
        </NavShell>
      </body>
    </html>
  );
}
