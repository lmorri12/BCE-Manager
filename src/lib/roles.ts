import type { Role } from "@prisma/client";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
    roles: ["SUPER_USER", "BOOKINGS_ADMIN", "TECH_ADMIN", "BAR_ADMIN", "TRUSTEE"],
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: "Calendar",
    roles: ["SUPER_USER", "BOOKINGS_ADMIN", "TECH_ADMIN", "BAR_ADMIN", "TRUSTEE"],
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: "CalendarDays",
    roles: ["SUPER_USER", "BOOKINGS_ADMIN", "TECH_ADMIN", "BAR_ADMIN"],
  },
  {
    label: "Recurring",
    href: "/recurring",
    icon: "Repeat",
    roles: ["SUPER_USER", "BOOKINGS_ADMIN"],
  },
  {
    label: "Rota",
    href: "/rota",
    icon: "ClipboardList",
    roles: ["SUPER_USER", "BOOKINGS_ADMIN", "TECH_ADMIN", "BAR_ADMIN", "TRUSTEE"],
  },
  {
    label: "Staff",
    href: "/staff",
    icon: "Users",
    roles: ["SUPER_USER", "BOOKINGS_ADMIN", "TECH_ADMIN", "BAR_ADMIN"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "BarChart3",
    roles: ["SUPER_USER", "BOOKINGS_ADMIN"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: "Shield",
    roles: ["SUPER_USER"],
  },
  {
    label: "Audit Log",
    href: "/admin/audit",
    icon: "ScrollText",
    roles: ["SUPER_USER"],
  },
  {
    label: "Data",
    href: "/admin/data",
    icon: "Database",
    roles: ["SUPER_USER"],
  },
  {
    label: "Help",
    href: "/help",
    icon: "HelpCircle",
    roles: ["SUPER_USER", "BOOKINGS_ADMIN", "TECH_ADMIN", "BAR_ADMIN", "TRUSTEE"],
  },
];

export function canAccess(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    SUPER_USER: "Super User",
    BOOKINGS_ADMIN: "Bookings Admin",
    TECH_ADMIN: "Tech Admin",
    BAR_ADMIN: "Bar Admin",
    TRUSTEE: "Trustee",
  };
  return labels[role];
}
