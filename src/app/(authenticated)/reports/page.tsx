"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Building2, TrendingUp, Calendar, Repeat } from "lucide-react";

type ReportData = {
  totalBookings: number;
  byStatus: Record<string, number>;
  byChargeModel: Record<string, number>;
  totalHireRevenue: number;
  byMonth: [string, { total: number; internal: number; external: number }][];
  byDayOfWeek: Record<string, number>;
  topBookers: { name: string; count: number }[];
  recurringCount: number;
  oneOffCount: number;
  staffWorkload: { name: string; count: number; roles: string[] }[];
  utilisationPct: number;
  daysUsed: number;
  totalDays: number;
};

const CHARGE_LABELS: Record<string, string> = {
  STRAIGHT_HIRE: "Straight Hire",
  BOX_OFFICE_SPLIT: "Box Office Split",
  INTERNAL: "Internal",
};

const STATUS_LABELS: Record<string, string> = {
  ENQUIRY: "Enquiry",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  READY: "Ready",
  POST_EVENT: "Post Event",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

const ROLE_LABELS: Record<string, string> = {
  TECHNICIAN: "Tech",
  BAR_VOLUNTEER: "Bar",
  FOH_VOLUNTEER: "FoH",
  DUTY_MANAGER: "DM",
  STAIR_CLIMBER_OPERATOR: "Stair",
  SETUP_VOLUNTEER: "Setup",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-5 w-full rounded-full bg-[var(--muted)] overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [from, setFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/reports?from=${from}&to=${to}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load reports (${r.status})`);
        }
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e); setLoading(false); });
  }, [from, to]);

  if (error) throw error;

  if (loading || !data) return <div className="p-6 text-[var(--muted-foreground)]">Loading reports...</div>;

  const maxMonthly = Math.max(...data.byMonth.map(([, v]) => v.total), 1);
  const maxDay = Math.max(...Object.values(data.byDayOfWeek), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-[var(--bce-blue)]" />
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--muted-foreground)]">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--muted-foreground)]">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--muted-foreground)]">Total Bookings</p>
            <p className="text-3xl font-bold">{data.totalBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--muted-foreground)]">Venue Utilisation</p>
            <p className="text-3xl font-bold">{data.utilisationPct}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">{data.daysUsed} of {data.totalDays} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--muted-foreground)]">Hire Revenue</p>
            <p className="text-3xl font-bold">£{data.totalHireRevenue.toFixed(0)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">from hire line items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--muted-foreground)]">Recurring vs One-off</p>
            <p className="text-3xl font-bold">{data.recurringCount} <span className="text-base font-normal text-[var(--muted-foreground)]">/ {data.oneOffCount}</span></p>
            <p className="text-xs text-[var(--muted-foreground)]">recurring / one-off</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" /> Bookings by Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byMonth.map(([month, counts]) => {
              const [y, m] = month.split("-");
              return (
                <div key={month} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-[var(--muted-foreground)]">{MONTH_NAMES[parseInt(m) - 1]} {y.slice(2)}</span>
                  <div className="flex-1 flex gap-0.5">
                    <div className="h-5 rounded-l bg-[var(--bce-blue)]" style={{ width: `${(counts.external / maxMonthly) * 100}%` }} />
                    <div className="h-5 rounded-r bg-[var(--bce-green)]" style={{ width: `${(counts.internal / maxMonthly) * 100}%` }} />
                  </div>
                  <span className="w-8 text-xs text-right font-medium">{counts.total}</span>
                </div>
              );
            })}
            <div className="flex gap-4 text-xs text-[var(--muted-foreground)] pt-2">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[var(--bce-blue)]" /> External</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[var(--bce-green)]" /> Internal</span>
            </div>
          </CardContent>
        </Card>

        {/* Busiest Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Busiest Days
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-8 text-xs text-[var(--muted-foreground)]">{day}</span>
                <div className="flex-1">
                  <Bar value={data.byDayOfWeek[day]} max={maxDay} color="bg-[var(--bce-gold)]" />
                </div>
                <span className="w-8 text-xs text-right font-medium">{data.byDayOfWeek[day]}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By Charge Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> By Charge Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.byChargeModel).map(([model, count]) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-sm">{CHARGE_LABELS[model] || model}</span>
                  <div className="flex items-center gap-2">
                    <Bar value={count} max={data.totalBookings} color="bg-[var(--bce-blue)]" />
                    <span className="w-10 text-sm font-medium text-right">{count}</span>
                    <span className="w-10 text-xs text-[var(--muted-foreground)] text-right">
                      {data.totalBookings > 0 ? Math.round((count / data.totalBookings) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" /> By Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm">{STATUS_LABELS[status] || status}</span>
                  <div className="flex items-center gap-2">
                    <Bar value={count} max={data.totalBookings} color="bg-[var(--bce-purple)]" />
                    <span className="w-10 text-sm font-medium text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Bookers / Regular Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Regular Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topBookers.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No bookings in this period.</p>
            ) : (
              <div className="space-y-2">
                {data.topBookers.map((b, i) => (
                  <div key={b.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] w-5">{i + 1}.</span>
                      <span className="font-medium">{b.name}</span>
                    </div>
                    <Badge variant={b.count >= 10 ? "success" : b.count >= 5 ? "default" : "outline"}>
                      {b.count} booking{b.count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Workload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Repeat className="h-4 w-4" /> Staff Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.staffWorkload.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No staff assignments in this period.</p>
            ) : (
              <div className="space-y-2">
                {data.staffWorkload.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex gap-1">
                        {s.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px] px-1 py-0">
                            {ROLE_LABELS[r] || r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-[var(--muted-foreground)]">{s.count} event{s.count !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
