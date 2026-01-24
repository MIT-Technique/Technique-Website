import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

interface OrgSignupRequest {
  email: string;
  password: string;
  organizationType: "club" | "living_group";
  clubName?: string;
  livingGroupType?: "dorm" | "fsilg";
  dormName?: string;
  fsilgName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrgSignupRequest = await request.json();
    const { email, password, organizationType, clubName, livingGroupType, dormName, fsilgName } = body;

    // Validate email ends with @mit.edu
    if (!email || !email.toLowerCase().endsWith("@mit.edu")) {
      return NextResponse.json(
        { error: "Email must be an @mit.edu address", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    // Validate password (at least 8 characters and contains a number or symbol)
    const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password || "");
    if (!password || password.length < 8 || !hasNumberOrSymbol) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and contain a number or symbol", code: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }

    // Validate organization type and required fields
    if (organizationType === "club") {
      if (!clubName || !clubName.trim()) {
        return NextResponse.json(
          { error: "Club name is required", code: "MISSING_CLUB_NAME" },
          { status: 400 }
        );
      }
    } else if (organizationType === "living_group") {
      if (!livingGroupType) {
        return NextResponse.json(
          { error: "Living group type is required", code: "MISSING_LG_TYPE" },
          { status: 400 }
        );
      }
      if (livingGroupType === "dorm" && !dormName) {
        return NextResponse.json(
          { error: "Dorm name is required", code: "MISSING_DORM" },
          { status: 400 }
        );
      }
      if (livingGroupType === "fsilg" && !fsilgName?.trim()) {
        return NextResponse.json(
          { error: "FSILG name is required", code: "MISSING_FSILG" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid organization type", code: "INVALID_ORG_TYPE" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check for existing club with the same name (case-insensitive)
    if (organizationType === "club") {
      const { data: existingClub } = await supabase
        .from("clubs")
        .select("id")
        .ilike("name", clubName!.trim())
        .single();

      if (existingClub) {
        return NextResponse.json(
          { error: "A club with this name already exists", code: "CLUB_NAME_EXISTS" },
          { status: 409 }
        );
      }
    }

    // Check for existing user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    // Create Supabase Auth user (this will send verification email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: false, // Require email verification
    });

    if (authError || !authData.user) {
      console.error("Error creating Supabase Auth user:", authError);
      return NextResponse.json(
        { error: "Failed to create account", code: "AUTH_ERROR" },
        { status: 500 }
      );
    }

    // Send verification email
    const { error: emailError } = await supabase.auth.resend({
      type: "signup",
      email: email.toLowerCase(),
    });

    if (emailError) {
      console.error("Error sending verification email:", emailError);
      // Continue anyway - user was created
    }

    // Determine role and organization name
    const role = organizationType === "club" ? "club" : "living_group_leader";
    const orgName = organizationType === "club"
      ? clubName!.trim()
      : livingGroupType === "dorm"
        ? dormName!
        : fsilgName!.trim();

    // Create user record
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        role,
        first_name: orgName,
        auth_provider: "supabase_auth",
        supabase_auth_id: authData.user.id,
        is_active: true,
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error("Error creating user record:", userError);
      // Attempt to clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user record", code: "USER_ERROR" },
        { status: 500 }
      );
    }

    // Create organization record
    if (organizationType === "club") {
      const { error: clubError } = await supabase.from("clubs").insert({
        user_id: newUser.id,
        club_id: `CLUB-${Date.now()}`,
        name: clubName!.trim(),
        approval_status: "pending",
      });

      if (clubError) {
        console.error("Error creating club record:", clubError);
        // Clean up user and auth
        await supabase.from("users").delete().eq("id", newUser.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create club record", code: "CLUB_ERROR" },
          { status: 500 }
        );
      }
    } else {
      const livingGroupName = livingGroupType === "dorm" ? dormName! : fsilgName!.trim();
      const { error: lgError } = await supabase.from("living_groups").insert({
        user_id: newUser.id,
        name: livingGroupName,
        status: "pending",
      });

      if (lgError) {
        console.error("Error creating living group record:", lgError);
        // Clean up user and auth
        await supabase.from("users").delete().eq("id", newUser.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Failed to create living group record", code: "LG_ERROR" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to verify.",
    });
  } catch (error) {
    console.error("Org signup error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
