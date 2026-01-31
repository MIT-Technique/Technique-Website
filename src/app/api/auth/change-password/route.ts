import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getCurrentUser } from "../../../../lib/auth/session";

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  orgType: "club" | "living_group";
  livingGroupId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body: ChangePasswordRequest = await request.json();
    const { oldPassword, newPassword, orgType } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both old and new passwords are required", code: "MISSING_PASSWORDS" },
        { status: 400 }
      );
    }

    // Validate new password requirements
    const passwordErrors: string[] = [];
    if (newPassword.length < 8) passwordErrors.push("Password must be at least 8 characters");
    if (!/[A-Z]/.test(newPassword)) passwordErrors.push("Password must contain an uppercase letter");
    if (!/[a-z]/.test(newPassword)) passwordErrors.push("Password must contain a lowercase letter");
    if (!/[0-9]/.test(newPassword)) passwordErrors.push("Password must contain a number");
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(newPassword)) {
      passwordErrors.push("Password must contain a symbol");
    }

    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: passwordErrors.join(", "), code: "INVALID_PASSWORD", errors: passwordErrors },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // For clubs, use the user's email directly
    // For living groups, we need to get the user associated with the living group
    let authEmail = user.email;

    if (orgType === "living_group" && body.livingGroupId) {
      // Get the living group's user_id to find the correct auth email
      const { data: livingGroup, error: lgError } = await supabaseAdmin
        .from("living_groups")
        .select("user_id")
        .eq("id", body.livingGroupId)
        .single();

      if (lgError || !livingGroup) {
        return NextResponse.json(
          { error: "Living group not found", code: "LG_NOT_FOUND" },
          { status: 404 }
        );
      }

      // Get the user record to find the system email
      const { data: lgUser, error: userError } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", livingGroup.user_id)
        .single();

      if (userError || !lgUser) {
        return NextResponse.json(
          { error: "Living group account not found", code: "LG_ACCOUNT_NOT_FOUND" },
          { status: 404 }
        );
      }

      authEmail = lgUser.email;
    }

    // Create a client-side Supabase client for auth
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First, verify the old password by attempting to sign in
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: authEmail,
      password: oldPassword,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Current password is incorrect", code: "INVALID_OLD_PASSWORD" },
        { status: 401 }
      );
    }

    // Now update the password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update password", code: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
