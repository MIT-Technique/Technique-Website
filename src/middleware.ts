import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/lib";

const protectedRoutes = ["/bio", "/api/updateBio", "/api/getUserData"];

const intlMiddleware = createMiddleware({
  locales: ["en", "es", "zh"],
  defaultLocale: "en",
});

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log(`pathname=${pathname}`);
  // Exclude /login and /api/login from next-intl AND auth check
  if (pathname === "/login" || pathname === "/api/login") {
    const session = await getSession();
    if (session?.isLoggedIn && pathname === "/login") {
      const locale = req.cookies.get("NEXT_LOCALE")?.value || "en";
      return NextResponse.redirect(new URL(`/${locale}/bio`, req.url));
    }
    // Let these routes through without any processing
    return NextResponse.next();
  }

  // Check if it's a protected route (with locale prefix removed)
  const pathWithoutLocale = pathname.replace(/^\/(en|es|zh)/, "");
  const isProtected = protectedRoutes.includes(pathWithoutLocale);

  if (isProtected) {
    const session = await getSession();
    if (!session?.isLoggedIn) {
      if (pathWithoutLocale.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Authentication required" },
          { status: 401 }
        );
      }
      // Redirect to locale-aware login page with returnUrl
      const locale = req.cookies.get("NEXT_LOCALE")?.value || pathname.match(/^\/(en|es|zh)/)?.[1] || "en";
      const returnUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/${locale}/login/student?returnUrl=${returnUrl}`, req.url));
    }
  }

  // console.log(`pathname=${pathname}`);
  // console.log(`returned value= `, intlMiddleware(req));
  // Let next-intl handle everything else
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/login",
    "/api/login", 
    "/api/updateBio", 
    "/api/getUserData", 
  ],
};
