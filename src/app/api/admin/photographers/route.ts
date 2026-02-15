import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createLog } from "../../../../lib/admin-logs";

// GET - List all active photographers (both photographer_permissions and authorized_photographers)
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

    // Get photographer_permissions (existing photoshoot system)
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

    // Get authorized_photographers (hire system)
    const { data: authorizedPhotographers, error: authError } = await supabase
      .from("authorized_photographers")
      .select("*")
      .eq("is_active", true)
      .order("added_at", { ascending: false });

    if (authError) {
      console.error("Error fetching authorized photographers:", authError);
    }

    return NextResponse.json({
      photographers: photographerList,
      authorizedPhotographers: authorizedPhotographers || [],
    });
  } catch (error) {
    console.error("Error fetching photographers:", error);
    return NextResponse.json(
      { error: "Failed to fetch photographers" },
      { status: 500 }
    );
  }
}

// POST - Add an authorized photographer for the hire system
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { email, name } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("authorized_photographers")
      .upsert(
        {
          email: normalizedEmail,
          name: name?.trim() || null,
          added_by: user.id,
          is_active: true,
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error adding photographer:", error);
      return NextResponse.json({ error: "Failed to add photographer" }, { status: 500 });
    }

    await createLog(user.id, "add_photographer", "authorized_photographers", data.id, {
      email: normalizedEmail,
      name: name?.trim() || null,
    });

    return NextResponse.json({ success: true, photographer: data });
  } catch (error) {
    console.error("Error adding photographer:", error);
    return NextResponse.json({ error: "Failed to add photographer" }, { status: 500 });
  }
}

// DELETE - Deactivate an authorized photographer
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Photographer ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("authorized_photographers")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deactivating photographer:", error);
      return NextResponse.json({ error: "Failed to remove photographer" }, { status: 500 });
    }

    await createLog(user.id, "remove_photographer", "authorized_photographers", id, {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing photographer:", error);
    return NextResponse.json({ error: "Failed to remove photographer" }, { status: 500 });
  }
}
