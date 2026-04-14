import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/api/auth"];

const ROLE_ROUTES: Record<string, string[]> = {
  "/admin": ["SUPER_USER"],
  "/recurring": ["SUPER_USER", "BOOKINGS_ADMIN"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow cron endpoint with secret
  if (pathname.startsWith("/api/cron")) {
    const secret = req.nextUrl.searchParams.get("secret");
    if (secret === process.env.CRON_SECRET) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect unauthenticated users to login
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  const userRole = req.auth.user.role;
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
