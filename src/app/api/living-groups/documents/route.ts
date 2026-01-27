import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get living group documents
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'living_group') {
      return NextResponse.json(
        { error: "Only living group accounts can access documents" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const { data: livingGroup, error } = await supabase
      .from('living_groups')
      .select('document_links, document_notes')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Get documents error:", error);
      return NextResponse.json(
        { error: "Failed to get documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: {
        links: livingGroup?.document_links || '',
        notes: livingGroup?.document_notes || '',
      }
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "Failed to get documents" },
      { status: 500 }
    );
  }
}

// PUT - Update living group documents
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== 'living_group') {
      return NextResponse.json(
        { error: "Only living group accounts can update documents" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { links, notes } = body;

    // Validate character limits
    if (links && links.length > 2000) {
      return NextResponse.json(
        { error: "Links exceed maximum length of 2000 characters" },
        { status: 400 }
      );
    }

    if (notes && notes.length > 5000) {
      return NextResponse.json(
        { error: "Notes exceed maximum length of 5000 characters" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('living_groups')
      .update({
        document_links: links || '',
        document_notes: notes || '',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select('document_links, document_notes')
      .single();

    if (error) {
      console.error("Update documents error:", error);
      return NextResponse.json(
        { error: "Failed to update documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: {
        links: data?.document_links || '',
        notes: data?.document_notes || '',
      }
    });
  } catch (error) {
    console.error("Update documents error:", error);
    return NextResponse.json(
      { error: "Failed to update documents" },
      { status: 500 }
    );
  }
}
