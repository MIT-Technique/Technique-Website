import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - List all active photographers (users with photographer permissions)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || (user.role !== 'admin' && !user.is_staph)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get all active photographers
    const { data: photographers, error } = await supabase
      .from('photographer_permissions')
      .select(`
        id,
        user_id,
        is_active,
        user:users!photographer_permissions_user_id_fkey(id, email, name)
      `)
      .eq('is_active', true)
      .order('user_id');

    if (error) {
      console.error("Error fetching photographers:", error);
      return NextResponse.json(
        { error: "Failed to fetch photographers" },
        { status: 500 }
      );
    }

    // Flatten the response to just user info
    const photographerList = photographers
      .filter(p => p.user)
      .map(p => {
        const userData = Array.isArray(p.user) ? p.user[0] : p.user;
        return {
          id: userData?.id,
          email: userData?.email,
          name: userData?.name,
        };
      });

    return NextResponse.json({ photographers: photographerList });
  } catch (error) {
    console.error("Error fetching photographers:", error);
    return NextResponse.json(
      { error: "Failed to fetch photographers" },
      { status: 500 }
    );
  }
}
