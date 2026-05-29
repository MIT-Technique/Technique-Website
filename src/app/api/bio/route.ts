import { getSession } from "../../../lib/lib";
import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  createAdminClientForSeniors,
} from "../../../lib/supabase/admin";
import { isFormEffectivelyClosed } from "../../../lib/utils/formStatus";

// GET - Fetch senior bio by email
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getSession();
    if (!session?.userInfo?.sub) {
      console.log(`Unauthorized!!\n${JSON.stringify(session, null, 2)}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const email = session?.userInfo.sub;

    if (!email) {
      console.log(`No email ${session}\n${session?.userInfo}`);
      return NextResponse.json(
        {
          data: {
            email: "",
            firstName: "",
            lastName: "",
            major: "",
            minor: "",
            second_major: "",
            quote: "",
            achievements: "",
          },
        },
        { status: 400 },
      );
    }

    const supabase = createAdminClientForSeniors();

    const { data: bio } = await supabase
      .from("senior_bios")
      .select(
        "first_name, last_name, major, minor, second_major, quote, achievements, photo_preference",
      )
      .eq("email", email)
      .single();

    return NextResponse.json(
      {
        data: {
          email: email,
          firstName: bio?.first_name || "",
          lastName: bio?.last_name || "",
          major: bio?.major || "",
          minor: bio?.minor || "",
          second_major: bio?.second_major || "",
          quote: bio?.quote || "",
          achievements: bio?.achievements || "",
          photo_preference: bio?.photo_preference || "",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching bio:", error);
    return NextResponse.json(
      { error: "There was an error retrieving bio info" },
      { status: 500 },
    );
  }
}

// PUT - Create or update senior bio (upsert by email)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      major,
      minor,
      second_major,
      quote,
      achievements,
      photo_preference,
    } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "MIT email is required" },
        { status: 400 },
      );
    }

    // Check if form is frozen
    const adminSupabase = createAdminClient();
    const { data: setting } = await adminSupabase
      .from("form_settings")
      .select("is_frozen, closes_at, reopens_at, unfrozen_at")
      .eq("form_name", "senior_bio")
      .single();

    const bioFormClosed = isFormEffectivelyClosed(setting);
    console.log(
      `[bio] freeze check: setting=${JSON.stringify(setting)} closed=${bioFormClosed}`,
    );

    if (bioFormClosed) {
      return NextResponse.json(
        {
          error: "This form is currently closed and not accepting submissions.",
        },
        { status: 403 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@mit.edu")) {
      return NextResponse.json(
        { error: "Must be a valid @mit.edu email address" },
        { status: 400 },
      );
    }

    // Validate required fields
    if (!firstName || !lastName || !major) {
      return NextResponse.json(
        { error: "First name, last name, and major are required" },
        { status: 400 },
      );
    }

    // Validate quote length
    if (quote && quote.length > 300) {
      return NextResponse.json(
        { error: "Quote must be 300 characters or less" },
        { status: 400 },
      );
    }

    const supabase = createAdminClientForSeniors();

    // Upsert senior bio by email
    const { error: bioError } = await supabase.from("senior_bios").upsert(
      {
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        major: major || null,
        minor: minor || null,
        second_major: second_major || null,
        quote: quote || null,
        achievements: achievements || null,
        photo_preference: photo_preference || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    if (bioError) {
      console.error("Error saving senior bio:", bioError);
      return NextResponse.json(
        { error: "Failed to save bio data" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating bio:", error);
    return NextResponse.json(
      { error: "There was an error saving bio data" },
      { status: 500 },
    );
  }
}
