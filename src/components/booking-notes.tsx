"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";

type Note = {
  id: string;
  userName: string;
  message: string;
  createdAt: string;
};

export function BookingNotes({ bookingId, readOnly = false }: { bookingId: string; readOnly?: boolean }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/notes`)
      .then((r) => r.json())
      .then(setNotes);
  }, [bookingId]);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);

    const res = await fetch(`/api/bookings/${bookingId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (res.ok) {
      const note = await res.json();
      setNotes([note, ...notes]);
      setMessage("");
    }
    setSending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add note */}
        {!readOnly && (
          <div className="flex gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              size="icon"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Notes list */}
        {notes.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="rounded-md border bg-gray-50 p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{note.userName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{note.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
