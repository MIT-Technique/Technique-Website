import { NextResponse } from "next/server";
import { clearSession } from "../../../../lib/auth/session";
import { getSession as getOriginalSession } from "../../../../lib/lib";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function GET() {
  try {
    // Clear new session (for admin/club users)
    await clearSession();

    // Clear original MIT SSO session
    const originalSession = await getOriginalSession();
    originalSession.isLoggedIn = false;
    originalSession.access_token = undefined;
    originalSession.userInfo = undefined;
    await originalSession.save();

    // Sign out from Supabase Auth (for admin/club users)
    const supabase = createAdminClient();
    await supabase.auth.signOut();

    // Redirect to home page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en`
    );
  } catch (error) {
    console.error("Logout error:", error);
    // Still redirect even on error
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/en`
    );
  }
}

export async function POST() {
  return GET();
}
