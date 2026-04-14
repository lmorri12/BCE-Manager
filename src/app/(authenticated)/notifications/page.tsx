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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read ({unreadCount})
          </Button>
        )}
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
