import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import crypto from "crypto";
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

    const { kerb, name, access } = await request.json();

    if (!kerb || !kerb.trim()) {
      return NextResponse.json({ error: "Kerberos username is required" }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const validAccess = ["clubs", "living_groups", "sports", "activities", "seniors"];
    const filteredAccess = (access || []).filter((a: string) => validAccess.includes(a));

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

    // Generate password
    const password = crypto.randomBytes(12).toString("base64url");

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json({ error: "Failed to create auth account" }, { status: 500 });
    }

    // Create user record
    const { error: userError } = await supabase.from("users").insert({
      email,
      role: "staph",
      name: name.trim(),
      is_staph: true,
      access: filteredAccess,
      supabase_auth_id: authData.user.id,
      is_active: true,
    });

    if (userError) {
      console.error("Error creating user record:", userError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Failed to create user record" }, { status: 500 });
    }

    // Log the action
    const { createLog } = await import("../../../../lib/admin-logs");
    await createLog(user.id, "create_staph", "user", null, {
      email,
      name: name.trim(),
      access: filteredAccess,
    });

    // Send welcome email with credentials (non-blocking)
    try {
      const accessLabels = filteredAccess.map((a: string) =>
        a.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
      ).join(", ");

      await transporter.sendMail({
        from: "mittnq@gmail.com",
        to: email,
        subject: "Your MIT Technique Staph Account",
        html: `
          <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F5; color: #1A1A1A; font-weight: 300;">
            <div style="background: #750014; padding: 32px 32px 28px; text-align: center;">
              <h1 style="color: #ffffff; font-weight: 700; font-size: 22px; margin: 0 0 6px; letter-spacing: 0.5px;">MIT TECHNIQUE</h1>
              <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; font-weight: 400; letter-spacing: 0.3px;">Staph Account Created</p>
            </div>
            <div style="padding: 28px 32px 32px;">
              <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">Hi ${name.trim()}, your Technique staph account has been created.</p>
              <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Your Credentials</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 4px 0; font-size: 13px; color: #888; width: 90px;">Email</td><td style="padding: 4px 0; font-size: 15px;">${email}</td></tr>
                  <tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Password</td><td style="padding: 4px 0; font-size: 15px; font-family: monospace;">${password}</td></tr>
                  ${accessLabels ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Access</td><td style="padding: 4px 0; font-size: 15px;">${accessLabels}</td></tr>` : ""}
                </table>
              </div>
              <p style="margin: 0 0 24px; line-height: 1.6; font-size: 14px; color: #666;">Please change your password after your first login.</p>
              <div style="text-align: center; margin: 0 0 28px;">
                <a href="https://technique.mit.edu/en/login/admin" style="display: inline-block; background: #750014; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 24px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Sign In</a>
              </div>
              <div style="border-top: 1px solid #E0D6D6; padding-top: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0 0 4px;">MIT Technique &middot; Walker Memorial, Room 50-320</p>
                <p style="color: #999; font-size: 12px; margin: 0;"><a href="mailto:technique@mit.edu" style="color: #999; text-decoration: none;">technique@mit.edu</a></p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send staph welcome email:", emailError);
    }

    return NextResponse.json({
      success: true,
      email,
      password,
    });
  } catch (error) {
    console.error("Error creating staph:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
