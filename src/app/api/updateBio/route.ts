import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/lib";
import { studentSchema } from "../../../lib/studentSchema";
import z from "zod/v4";

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session?.userInfo?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { email } = session.userInfo;
    const body = await request.json();
    body.email = email;

    // Note: No encryption needed - Supabase encrypts at rest
    const parsed = studentSchema.safeParse(body);
    console.log("Parsed");
    if (!parsed.success) {
      return new NextResponse(
        JSON.stringify({ error: z.treeifyError(parsed.error) }),
        {
          status: 400,
        }
      );
    }
    console.log("Validation passed");

    // Create Supabase client with service role (bypasses RLS)
    const supabase = await createServiceSupabaseClient();
    console.log("Successfully Connected to Supabase");

    // Map camelCase to snake_case for database
    const updateFields = {
      email: parsed.data.email,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      major: parsed.data.major,
      quote: parsed.data.quote || '',
    };

    // Use upsert to insert if not exists, update if exists
    const { error } = await supabase
      .from('bios')
      .upsert(updateFields, {
        onConflict: 'email',
      });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    console.log("Bio updated successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "There was an error updating the bio" },
      { status: 500 }
    );
  }
}
