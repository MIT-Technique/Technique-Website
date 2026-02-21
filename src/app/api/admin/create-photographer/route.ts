import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mittnq@gmail.com",
    pass: process.env.GOOGLE_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kerb, name } = await request.json();

    if (!kerb || !kerb.trim()) {
      return NextResponse.json({ error: "Kerberos username is required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const email = kerb.trim().toLowerCase().replace(/@mit\.edu$/, "") + "@mit.edu";

    const supabase = createAdminClient();

    // Check for existing user
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // Create user record (no Supabase auth — photographers don't need to log in)
    const { error: userError } = await supabase.from("users").insert({
      email,
      role: "photographer",
      name: name.trim(),
      is_staph: false,
      access: [],
      is_active: true,
    });

    if (userError) {
      console.error("Error creating user record:", userError);
      return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
    }

    // Also upsert into authorized_photographers for hire system backward compat
    const { error: photoError } = await supabase
      .from("authorized_photographers")
      .upsert(
        {
          email,
          name: name.trim(),
          added_by: user.id,
          is_active: true,
        },
        { onConflict: "email" }
      );

    if (photoError) {
      console.error("Error upserting authorized_photographers:", photoError);
    }

    // Log the action
    const { createLog } = await import("../../../../lib/admin-logs");
    await createLog(user.id, "create_photographer", "user", null, {
      email,
      name: name.trim(),
    });

    // Send notification email (non-blocking)
    try {
      await transporter.sendMail({
        from: "mittnq@gmail.com",
        to: email,
        subject: "You've Been Added as an MIT Technique Photographer",
        html: `
          <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F5; color: #1A1A1A; font-weight: 300;">
            <div style="background: #750014; padding: 32px 32px 28px; text-align: center;">
              <h1 style="color: #ffffff; font-weight: 700; font-size: 22px; margin: 0 0 6px; letter-spacing: 0.5px;">MIT TECHNIQUE</h1>
              <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; font-weight: 400; letter-spacing: 0.3px;">Photographer Added</p>
            </div>
            <div style="padding: 28px 32px 32px;">
              <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">Hi ${name.trim()}, you've been added as an authorized photographer for MIT Technique.</p>
              <p style="margin: 0 0 24px; line-height: 1.6; font-size: 14px; color: #666;">You can now sign in on the hire page using your email to claim photography jobs. If you have any questions, reach out to us at technique@mit.edu.</p>
              <div style="border-top: 1px solid #E0D6D6; padding-top: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0 0 4px;">MIT Technique &middot; Walker Memorial, Room 50-320</p>
                <p style="color: #999; font-size: 12px; margin: 0;"><a href="mailto:technique@mit.edu" style="color: #999; text-decoration: none;">technique@mit.edu</a></p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send photographer notification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      email,
    });
  } catch (error) {
    console.error("Error creating photographer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
