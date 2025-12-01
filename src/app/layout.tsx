import "./globals.css";
import NavShell from "./components/NavShell";
import { LockdownProvider } from "@/context/LockdownContext";
import { UploadProvider } from "@/context/UploadContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${quicksand.variable} bg-[#F8FAFC] text-slate-800 min-h-screen`}>
        <ThemeProvider>
          <UploadProvider>
            <LockdownProvider>
              <NavShell>
                {children}
              </NavShell>
            </LockdownProvider>
          </UploadProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
