import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, clubName } = body;

    if (!email || !clubName) {
      return NextResponse.json(
        { error: "Email and club name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Warn about MIT student emails (but don't block)
    const isMitStudentEmail = email.endsWith('@mit.edu') && !email.includes('-');

    const supabase = createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Send magic link for email verification
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?type=club&clubName=${encodeURIComponent(clubName)}`,
      },
    });

    if (authError) {
      console.error("Club signup auth error:", authError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Check your email for the verification link",
      warning: isMitStudentEmail
        ? "Warning: You appear to be using a personal MIT email. Please use your club's official email address."
        : undefined,
    });
  } catch (error) {
    console.error("Club signup error:", error);
    return NextResponse.json(
      { error: "Failed to process club signup" },
      { status: 500 }
    );
  }
}
