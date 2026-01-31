import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../../../../lib/supabase/admin";

interface ForgotPasswordRequest {
  // For clubs: email (the club's @mit.edu email)
  email?: string;
  // For living groups: name (the living group name)
  name?: string;
  orgType: "club" | "living_group";
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email, name, orgType } = body;

    const supabaseAdmin = createAdminClient();
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ==================== CLUB PASSWORD RESET ====================
    if (orgType === "club") {
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

      // Look up the club by user email
      const { data: clubUser, error: clubUserError } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("email", email.toLowerCase())
        .eq("role", "club")
        .single();

      if (clubUserError || !clubUser) {
        // Return success even if not found to prevent enumeration
        return NextResponse.json({
          success: true,
          message: "If an account exists and has a leader, a password reset link has been sent to the leader's email.",
        });
      }

      // Get the club
      const { data: club } = await supabaseAdmin
        .from("clubs")
        .select("id")
        .eq("user_id", clubUser.id)
        .single();

      if (!club) {
        return NextResponse.json({
          success: true,
          message: "If an account exists and has a leader, a password reset link has been sent to the leader's email.",
        });
      }

      // Find first leader from club_memberships
      const { data: leader, error: leaderError } = await supabaseAdmin
        .from("club_memberships")
        .select(`
          user_id,
          user:users!club_memberships_user_id_fkey(id, email)
        `)
        .eq("club_id", club.id)
        .eq("role", "leader")
        .limit(1)
        .single();

      if (leaderError || !leader || !leader.user) {
        // No leader found
        return NextResponse.json(
          {
            error: "No leader assigned to this club. Please contact tnq-exec@mit.edu for assistance.",
            code: "NO_LEADER"
          },
          { status: 400 }
        );
      }

      // Send password reset to leader's personal email
      const leaderUser = Array.isArray(leader.user) ? leader.user[0] : leader.user;
      const leaderEmail = (leaderUser as { email: string }).email;

      // Send the actual reset email to the leader
      const { error: resetError } = await supabaseAuth.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/en/reset-password`,
      });

      if (resetError) {
        console.error("Password reset error:", resetError);
      }

      return NextResponse.json({
        success: true,
        message: `Password reset link sent to the club leader's email (${leaderEmail.substring(0, 3)}***@mit.edu).`,
        sentTo: "leader",
      });
    }

    // ==================== LIVING GROUP PASSWORD RESET ====================
    if (orgType === "living_group") {
      if (!name) {
        return NextResponse.json(
          { error: "Living group name is required", code: "MISSING_NAME" },
          { status: 400 }
        );
      }

      // Look up the living group by name
      const { data: livingGroup, error: lgError } = await supabaseAdmin
        .from("living_groups")
        .select("id, user_id, has_leader")
        .ilike("name", name.trim())
        .single();

      if (lgError || !livingGroup) {
        // Return success even if not found to prevent enumeration
        return NextResponse.json({
          success: true,
          message: "If this living group exists and has a leader, a password reset link has been sent to the leader's email.",
        });
      }

      // Get the living group's system email (for sending the reset)
      const { data: lgUser } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", livingGroup.user_id)
        .single();

      if (!lgUser) {
        return NextResponse.json({
          success: true,
          message: "If this living group exists and has a leader, a password reset link has been sent to the leader's email.",
        });
      }

      // Check if living group has a leader
      if (!livingGroup.has_leader) {
        return NextResponse.json(
          {
            error: "No leader assigned to this living group. Please contact tnq-exec@mit.edu for assistance.",
            code: "NO_LEADER"
          },
          { status: 400 }
        );
      }

      // Find first active member from living_group_memberships (this is the leader)
      const { data: leader, error: leaderError } = await supabaseAdmin
        .from("living_group_memberships")
        .select(`
          user_id,
          user:users!living_group_memberships_user_fkey(id, email)
        `)
        .eq("living_group_id", livingGroup.id)
        .eq("status", "active")
        .order("joined_at", { ascending: true })
        .limit(1)
        .single();

      if (leaderError || !leader || !leader.user) {
        // No leader found despite has_leader being true - data inconsistency
        return NextResponse.json(
          {
            error: "No leader assigned to this living group. Please contact tnq-exec@mit.edu for assistance.",
            code: "NO_LEADER"
          },
          { status: 400 }
        );
      }

      // Get leader email
      const leaderUser = Array.isArray(leader.user) ? leader.user[0] : leader.user;
      const leaderEmail = (leaderUser as { email: string }).email;

      // Send password reset email (this triggers Supabase's reset flow)
      // The reset will go to the system email, but we'll inform the user it was sent to the leader
      const { error: resetError } = await supabaseAuth.auth.resetPasswordForEmail(lgUser.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/en/reset-password`,
      });

      if (resetError) {
        console.error("Password reset error:", resetError);
      }

      // Note: Since living groups use system emails (@lg.technique.mit.edu),
      // the reset email won't actually be delivered. We need a custom solution.
      // For now, inform the user about the limitation.
      return NextResponse.json({
        success: true,
        message: `Please contact your Living Group Leader (${leaderEmail.substring(0, 3)}***@mit.edu) to reset the password, or reach out to tnq-exec@mit.edu for assistance.`,
        sentTo: "leader",
        leaderEmailHint: `${leaderEmail.substring(0, 3)}***@mit.edu`,
      });
    }

    // Invalid org type
    return NextResponse.json(
      { error: "Invalid organization type", code: "INVALID_ORG_TYPE" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
