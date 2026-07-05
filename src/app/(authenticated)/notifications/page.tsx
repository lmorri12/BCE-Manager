"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<"read" | "all" | null>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      });
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    await Promise.all(
      notifications.filter((n) => !n.read).map((n) =>
        fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" })
      )
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function clearNotifications(scope: "read" | "all") {
    const message =
      scope === "read"
        ? "Clear all read notifications?"
        : "Clear all notifications?";

    if (!confirm(message)) {
      return;
    }

    setClearing(scope);

    const res = await fetch(`/api/notifications?scope=${scope}`, {
      method: "DELETE",
    });

    setClearing(null);

    if (!res.ok) {
      return;
    }

    setNotifications((prev) =>
      scope === "read" ? prev.filter((n) => !n.read) : []
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readCount = notifications.length - unreadCount;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex items-center gap-2">
          {readCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearNotifications("read")}
              disabled={clearing !== null}
            >
              {clearing === "read" ? "Clearing..." : `Clear read (${readCount})`}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearNotifications("all")}
              disabled={clearing !== null}
            >
              {clearing === "all" ? "Clearing..." : `Clear all (${notifications.length})`}
            </Button>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={clearing !== null}>
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">
              No notifications.
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between border-b p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors ${
                    !n.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.link) router.push(n.link);
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      {!n.read && <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>}
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                      {n.message}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap ml-4">
                    {new Date(n.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
