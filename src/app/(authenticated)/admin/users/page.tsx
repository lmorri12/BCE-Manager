"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCog } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_USER: "Super User",
  BOOKINGS_ADMIN: "Bookings Admin",
  TECH_ADMIN: "Tech Admin",
  BAR_ADMIN: "Bar Admin",
  TRUSTEE: "Trustee",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3 font-medium">{user.name}</td>
                    <td className="py-3 text-[var(--muted-foreground)]">
                      {user.email}
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary">
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant={user.active ? "success" : "destructive"}>
                        {user.active ? "Active" : "Inactive"}
                      </Badge>
                      {user.mustChangePassword && (
                        <Badge variant="warning" className="ml-2">
                          Password reset required
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm">
                          <UserCog className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
