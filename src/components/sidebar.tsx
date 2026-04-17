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
  BarChart3,
  Database,
  HelpCircle,
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
  BarChart3,
  ScrollText,
  Database,
  HelpCircle,
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
      <div className="relative flex h-14 items-center justify-center bg-white/95 backdrop-blur-sm mx-3 mt-3 mb-2 rounded-xl px-3 shadow-sm">
        <Link href="/" onClick={onClose} className="block">
          <img
            src="/images/logo-text.png"
            alt="Biggar Corn Exchange"
            className="h-5"
          />
        </Link>
        <button onClick={onClose} className="absolute right-2 lg:hidden text-[var(--bce-grey)] hover:text-[var(--bce-grey)]">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="mt-3 space-y-0.5 px-3">
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                isActive
                  ? "bg-white/12 text-white font-medium shadow-sm border-l-[3px] border-[var(--accent)] pl-[9px]"
                  : "text-[var(--sidebar-text)]/80 hover:bg-white/8 hover:text-white border-l-[3px] border-transparent pl-[9px]"
              )}
            >
              {Icon && <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-[var(--accent)]" : "")} />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
