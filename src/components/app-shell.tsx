"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { Role } from "@prisma/client";

export function AppShell({
  children,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  userName: string;
  userRole: Role;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[var(--muted)]">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar
          role={userRole}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <Topbar
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="lg:ml-64 pt-16">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
