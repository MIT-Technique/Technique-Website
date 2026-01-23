import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get current user's pending join requests
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

    // Get all pending join requests with club details
    const { data: requests, error } = await supabase
      .from('club_join_requests')
      .select(`
        id,
        club_id,
        status,
        created_at,
        club:clubs (
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Get join requests error:", error);
      return NextResponse.json(
        { error: "Failed to get join requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get join requests error:", error);
    return NextResponse.json(
      { error: "Failed to get join requests" },
      { status: 500 }
    );
  }
}
