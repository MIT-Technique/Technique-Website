import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/lib";

// Define the protected routes
const protectedRoutes = ["/bio", "/api/updateBio"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Only protect /bio and /api/updateBio
  const session = await getSession();
  if (protectedRoutes.includes(path)) {
    // Read the session cookie

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
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  } else if (path.includes("/login")) {
    if (session?.isLoggedIn) {
      return NextResponse.redirect(new URL("/bio", req.nextUrl));
    } else {
      return NextResponse.next();
    }
  }

  // Allow all other requests through
  return NextResponse.next();
}

// Only run middleware on /bio and /api/updateBio
export const config = {
  matcher: ["/bio", "/api/updateBio", "/login"],
};
