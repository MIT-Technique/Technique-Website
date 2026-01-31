import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if this email is associated with a club account
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single();

    if (!user || user.role !== 'club') {
      return NextResponse.json(
        { error: "No club account found with this email. Please contact technique@mit.edu if you believe this is an error." },
        { status: 404 }
      );
    }

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?type=club`,
      },
    });

    if (error) {
      console.error("Club magic link error:", error);
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
    console.error("Club login error:", error);
    return NextResponse.json(
      { error: "Failed to process club login" },
      { status: 500 }
    );
  }
}
