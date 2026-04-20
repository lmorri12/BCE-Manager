"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLES = [
  { value: "BOOKINGS_ADMIN", label: "Bookings Admin" },
  { value: "TECH_ADMIN", label: "Tech Admin" },
  { value: "BAR_ADMIN", label: "Bar Admin" },
  { value: "TRUSTEE", label: "Trustee (view-only)" },
  { value: "SUPER_USER", label: "Super User" },
];

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((res) => res.json())
      .then(setUser);
  }, [params.id]);

  if (!user) return <div className="p-6">Loading...</div>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const body: Record<string, unknown> = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      active: formData.get("active") === "on",
    };

    if (resetPassword) {
      body.resetPassword = resetPassword;
    }

    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update user");
    } else {
      router.push("/admin/users");
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Edit User</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="text"
                required
                defaultValue={user.email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                required
                defaultValue={user.role}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                name="active"
                defaultChecked={user.active}
                className="h-4 w-4"
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="resetPassword">Reset Password (optional)</Label>
              <Input
                id="resetPassword"
                type="text"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                minLength={8}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                If set, the user will be required to change it on next login.
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
