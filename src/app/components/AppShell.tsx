"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

const PUBLIC_PATHS = ["/login", "/approval"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    setHasToken(!!localStorage.getItem("token"));
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
  }, [pathname]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === "/";
  const showSidebar = mounted && hasToken && !isPublic;

  if (!mounted) return <>{children}</>;

  if (showSidebar) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopHeader theme={theme} onToggleTheme={toggleTheme} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
