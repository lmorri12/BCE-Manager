"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { Bell, LogOut, User, ChevronDown, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoleLabel } from "@/lib/roles";
import type { Role } from "@prisma/client";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function Topbar({
  userName,
  userRole,
  onMenuToggle,
}: {
  userName: string;
  userRole: Role;
  onMenuToggle: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications?unread=true");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch {
        // Silently fail — notifications are non-critical
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <header className="fixed left-0 lg:left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--destructive)] text-xs text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border border-[var(--border)] bg-white shadow-lg">
              <div className="flex items-center justify-between border-b p-3">
                <span className="font-medium">Notifications</span>
                <Link
                  href="/notifications"
                  className="text-xs text-[var(--primary)] hover:underline"
                  onClick={() => setShowNotifications(false)}
                >
                  View all
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                    No new notifications
                  </p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`cursor-pointer border-b p-3 text-sm hover:bg-[var(--muted)] ${
                        !n.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) window.location.href = n.link;
                      }}
                    >
                      <p className="font-medium">{n.title}</p>
                      <p className="text-[var(--muted-foreground)]">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-[var(--muted)]"
          >
            <User className="h-5 w-5" />
            <span className="text-sm">{userName}</span>
            <Badge variant="secondary" className="text-xs">
              {getRoleLabel(userRole)}
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 rounded-lg border border-[var(--border)] bg-white shadow-lg">
              <Link
                href="/change-password"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--muted)]"
                onClick={() => setShowUserMenu(false)}
              >
                Change Password
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-[var(--muted)]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
