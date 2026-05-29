import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/lib";

// Routes that require auth
const protectedRoutes = ["/bio", "/api/updateBio"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Get session once
  const session = await getSession();

  // Protect authenticated routes
  if (protectedRoutes.includes(path)) {
    if (!session?.isLoggedIn) {
      // API routes -> return JSON 401
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          {
            success: false,
            message: "Authentication required",
          },
          { status: 401 },
        );
      }

      // Pages -> redirect to login
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Prevent logged-in users from visiting login page
  if (path.includes("/login")) {
    if (session?.isLoggedIn) {
      return NextResponse.redirect(new URL("/bio", req.url));
    }
  }

  // Allow request through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Match all routes except:
      - /api (unless explicitly matched below)
      - /_next
      - /_vercel
      - static files
    */
    "/bio",
    "/login",
    "/api/updateBio",
  ],
};
