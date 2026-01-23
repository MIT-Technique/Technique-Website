import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get current user's club memberships
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get all memberships with club details
    const { data: memberships, error } = await supabase
      .from('club_memberships')
      .select(`
        id,
        club_id,
        role,
        joined_at,
        club:clubs (
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error("Get memberships error:", error);
      return NextResponse.json(
        { error: "Failed to get memberships" },
        { status: 500 }
      );
    }

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error("Get memberships error:", error);
    return NextResponse.json(
      { error: "Failed to get memberships" },
      { status: 500 }
    );
  }
}
