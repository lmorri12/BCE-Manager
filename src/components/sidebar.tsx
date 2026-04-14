"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { NAV_ITEMS, canAccess } from "@/lib/roles";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Repeat,
  ClipboardList,
  Users,
  Shield,
  ScrollText,
  X,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Repeat,
  ClipboardList,
  Users,
  Shield,
  ScrollText,
};

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => canAccess(role, item.roles));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] transition-transform duration-200",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link href="/" onClick={onClose} className="block">
          <img
            src="/images/logo-text.png"
            alt="Biggar Corn Exchange"
            className="h-7"
          />
        </Link>
        <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="mt-4 space-y-1 px-3">
        {visibleItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[var(--sidebar-hover)] text-white font-medium"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)]"
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
