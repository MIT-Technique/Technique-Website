import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";

// GET - Get all form settings
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const { data: formSettings, error } = await supabase
      .from('form_settings')
      .select('*')
      .order('form_name', { ascending: true });

    if (error) {
      console.error("Error fetching form settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch form settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ formSettings });
  } catch (error) {
    console.error("Error fetching form settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch form settings" },
      { status: 500 }
    );
  }
}

// PUT - Freeze or unfreeze a form
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { formName, freeze } = body;

    if (!formName) {
      return NextResponse.json(
        { error: "Form name is required" },
        { status: 400 }
      );
    }

    if (typeof freeze !== 'boolean') {
      return NextResponse.json(
        { error: "Freeze must be a boolean" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if form setting exists
    const { data: existingSetting } = await supabase
      .from('form_settings')
      .select('id')
      .eq('form_name', formName)
      .single();

    if (existingSetting) {
      // Update existing setting
      const updateData: Record<string, unknown> = {
        is_frozen: freeze,
        updated_at: new Date().toISOString(),
      };

      if (freeze) {
        updateData.frozen_by = user.id;
        updateData.frozen_at = new Date().toISOString();
        updateData.unfrozen_by = null;
        updateData.unfrozen_at = null;
      } else {
        updateData.unfrozen_by = user.id;
        updateData.unfrozen_at = new Date().toISOString();
      }

      const { data: updatedSetting, error } = await supabase
        .from('form_settings')
        .update(updateData)
        .eq('id', existingSetting.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating form setting:", error);
        return NextResponse.json(
          { error: "Failed to update form setting" },
          { status: 500 }
        );
      }

      return NextResponse.json({ formSetting: updatedSetting });
    } else {
      // Create new setting
      const insertData: Record<string, unknown> = {
        form_name: formName,
        is_frozen: freeze,
      };

      if (freeze) {
        insertData.frozen_by = user.id;
        insertData.frozen_at = new Date().toISOString();
      }

      const { data: newSetting, error } = await supabase
        .from('form_settings')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error creating form setting:", error);
        return NextResponse.json(
          { error: "Failed to create form setting" },
          { status: 500 }
        );
      }

      return NextResponse.json({ formSetting: newSetting });
    }
  } catch (error) {
    console.error("Error updating form setting:", error);
    return NextResponse.json(
      { error: "Failed to update form setting" },
      { status: 500 }
    );
  }
}
