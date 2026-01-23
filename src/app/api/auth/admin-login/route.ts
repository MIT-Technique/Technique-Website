import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

const ADMIN_EMAIL = "technique@mit.edu";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Only allow technique@mit.edu for admin login
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Unauthorized email address" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: ADMIN_EMAIL,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?type=admin`,
      },
    });

    if (error) {
      console.error("Magic link error:", error);
      return NextResponse.json(
        { error: "Failed to send magic link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Check your email for the login link",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Failed to process admin login" },
      { status: 500 }
    );
  }
}
