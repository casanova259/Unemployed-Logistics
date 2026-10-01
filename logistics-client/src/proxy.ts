import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";

export function getRoleHomeRoute(role?: Role): string {
  switch (role) {
    case Role.CUSTOMER:
      return "/customer/shipments";
    case Role.STAFF:
      return "/staff/dashboard";
    case Role.DRIVER:
      return "/driver/assignments";
    case Role.ADMIN:
      return "/staff/dashboard";
    default:
      return "/login";
  }
}

/**
 * Next 16 proxy implementation for route protection and role redirects
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let static assets and auth API pass through without redirection
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let token = null;
  try {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
    });
  } catch (err) {
    // If token parsing fails, treat as unauthenticated
  }

  const isLoggedIn = !!token?.id;
  const userRole = token?.role as Role | undefined;

  // 1. Logged-in users visiting /, /login, or /register get redirected to their role home
  if (isLoggedIn && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    const homeUrl = new URL(getRoleHomeRoute(userRole), req.url);
    return NextResponse.redirect(homeUrl);
  }

  // 2. Unauthenticated user accessing protected routes -> redirect to /login
  const isProtectedRoute =
    pathname.startsWith("/customer") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/admin");

  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-based restrictions
  if (isLoggedIn) {
    // Admin has access to everything
    if (userRole === Role.ADMIN) {
      return NextResponse.next();
    }

    // Customer routes: restricted to CUSTOMER
    if (pathname.startsWith("/customer") && userRole !== Role.CUSTOMER) {
      return NextResponse.redirect(new URL(getRoleHomeRoute(userRole), req.url));
    }

    // Staff routes: restricted to STAFF
    if (pathname.startsWith("/staff") && userRole !== Role.STAFF) {
      return NextResponse.redirect(new URL(getRoleHomeRoute(userRole), req.url));
    }

    // Driver routes: restricted to DRIVER
    if (pathname.startsWith("/driver") && userRole !== Role.DRIVER) {
      return NextResponse.redirect(new URL(getRoleHomeRoute(userRole), req.url));
    }

    // Admin routes: only accessible by ADMIN (earlier check passed ADMIN through)
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL(getRoleHomeRoute(userRole), req.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
