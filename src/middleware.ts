import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/lib";

// Define the protected routes (pages and API routes that require authentication)
const protectedRoutes = ["/bio", "/dashboard", "/api/updateBio", "/api/getUserData"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if path matches any protected route (handles locale prefixes)
  const isProtectedRoute = protectedRoutes.some(route =>
    path === route ||
    path.endsWith(route) ||
    path.includes(`${route}/`) ||
    // Handle locale prefixed routes like /en/bio, /es/dashboard
    /^\/[a-z]{2}\//.test(path) && protectedRoutes.some(r => path.endsWith(r))
  );

  const isLoginRoute = path.includes("/login");

  // Get session
  const session = await getSession();

  if (isProtectedRoute) {
    // If not logged in, redirect or block
    if (!session?.isLoggedIn) {
      // For API route, return 401 JSON
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Authentication required" },
          { status: 401 }
        );
      }
      // For page route, redirect to login
      // Extract locale from path if present
      const localeMatch = path.match(/^\/([a-z]{2})\//);
      const locale = localeMatch ? localeMatch[1] : 'en';
      return NextResponse.redirect(new URL(`/${locale}/login`, req.nextUrl));
    }
  } else if (isLoginRoute) {
    if (session?.isLoggedIn) {
      // Redirect logged-in users to dashboard
      const localeMatch = path.match(/^\/([a-z]{2})\//);
      const locale = localeMatch ? localeMatch[1] : 'en';
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.nextUrl));
    } else {
      return NextResponse.next();
    }
  }

  // Allow all other requests through
  return NextResponse.next();
}

// Run middleware on protected routes and login (including locale-prefixed versions)
export const config = {
  matcher: [
    "/bio",
    "/dashboard",
    "/api/updateBio",
    "/api/getUserData",
    "/login",
    "/:locale/bio",
    "/:locale/dashboard",
    "/:locale/login",
  ],
};
