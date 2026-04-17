"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { Bell, LogOut, User, ChevronDown, Menu, Moon, Sun } from "lucide-react";
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
    <header className="fixed left-0 lg:left-64 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg"
          onClick={() => {
            const html = document.documentElement;
            const isDark = html.getAttribute("data-theme") === "dark";
            html.setAttribute("data-theme", isDark ? "light" : "dark");
            localStorage.setItem("theme", isDark ? "light" : "dark");
          }}
        >
          <Sun className="h-[18px] w-[18px] hidden [html[data-theme=dark]_&]:block" />
          <Moon className="h-[18px] w-[18px] block [html[data-theme=dark]_&]:hidden" />
        </Button>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--destructive)] text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
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
                  <p className="p-6 text-center text-sm text-[var(--muted-foreground)]">
                    No new notifications
                  </p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`cursor-pointer border-b border-[var(--border)] px-4 py-3 text-sm transition-colors hover:bg-[var(--muted)] ${
                        !n.read ? "bg-[var(--primary)]/5" : ""
                      }`}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) window.location.href = n.link;
                      }}
                    >
                      <p className="font-medium text-[var(--foreground)]">{n.title}</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5 leading-snug">
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
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--muted)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">{userName}</span>
            <Badge variant="secondary" className="hidden md:inline-flex">
              {getRoleLabel(userRole)}
            </Badge>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 w-48 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)] overflow-hidden">
              <Link
                href="/change-password"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--muted)]"
                onClick={() => setShowUserMenu(false)}
              >
                Change Password
              </Link>
              <div className="border-t border-[var(--border)]">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[var(--destructive)] transition-colors hover:bg-[var(--muted)]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
