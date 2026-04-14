"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Plus, Trash2 } from "lucide-react";

type HireLine = {
  id: string;
  description: string;
  amount: string;
  sortOrder: number;
};

export function HireLines({
  bookingId,
  lines,
  onUpdate,
}: {
  bookingId: string;
  lines: HireLine[];
  onUpdate: () => void;
}) {
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [adding, setAdding] = useState(false);

  const total = lines.reduce((sum, l) => sum + Number(l.amount), 0);

  async function handleAdd() {
    if (!newDesc || !newAmount) return;
    setAdding(true);

    await fetch(`/api/bookings/${bookingId}/hire-lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDesc, amount: newAmount }),
    });

    setAdding(false);
    setNewDesc("");
    setNewAmount("");
    onUpdate();
  }

  async function handleDelete(lineId: string) {
    await fetch(`/api/bookings/${bookingId}/hire-lines/${lineId}`, {
      method: "DELETE",
    });
    onUpdate();
  }

  function handleExport() {
    window.open(`/api/bookings/${bookingId}/hire-lines/export`, "_blank");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hire Line Items</CardTitle>
        {lines.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {lines.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium text-right">Amount (£)</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b">
                  <td className="py-2">{line.description}</td>
                  <td className="py-2 text-right">
                    {Number(line.amount).toFixed(2)}
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(line.id)}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="pt-2">Total</td>
                <td className="pt-2 text-right">£{total.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            No hire line items yet.
          </p>
        )}

        {/* Add new line */}
        <div className="flex items-end gap-3 border-t pt-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium">Description</label>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. Venue hire, Equipment hire"
            />
          </div>
          <div className="w-32 space-y-1">
            <label className="text-xs font-medium">Amount (£)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <Button onClick={handleAdd} disabled={adding || !newDesc || !newAmount}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
