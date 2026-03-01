"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

const PUBLIC_PATHS = ["/login", "/approval"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasToken(!!localStorage.getItem("token"));
  }, [pathname]);

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === "/";
  const showSidebar = mounted && hasToken && !isPublic;

  if (!mounted) return <>{children}</>;

  if (showSidebar) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  return <>{children}</>;
}
