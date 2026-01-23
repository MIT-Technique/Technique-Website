import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface ForgotPasswordRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required", code: "MISSING_EMAIL" },
        { status: 400 }
      );
    }

    // Validate email ends with @mit.edu
    if (!email.toLowerCase().endsWith("@mit.edu")) {
      return NextResponse.json(
        { error: "Email must be an @mit.edu address", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Send password reset email
    // We don't check if the email exists to prevent email enumeration
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/en/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      // Still return success to prevent email enumeration
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists, a password reset link has been sent.",
    });
  }
}
