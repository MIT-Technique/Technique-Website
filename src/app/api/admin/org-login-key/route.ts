import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth/session";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { getCryptr } from "../../../../lib/lib";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mittnq@gmail.com",
    pass: process.env.GOOGLE_PASSWORD,
  },
});

const ORG_ROLES = ["club", "living_group", "sports"];

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, action } = await request.json();

    if (!userId || !["reset", "send"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Look up user
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role, supabase_auth_id")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!ORG_ROLES.includes(targetUser.role)) {
      return NextResponse.json(
        { error: "Only organization accounts can have login keys" },
        { status: 400 }
      );
    }

    if (!targetUser.supabase_auth_id) {
      return NextResponse.json(
        { error: "User has no auth account" },
        { status: 400 }
      );
    }

    const cryptr = getCryptr();

    if (action === "reset") {
      // Generate new password matching existing script pattern: TNQ- + 12 hex chars
      const newPassword = "TNQ-" + crypto.randomBytes(6).toString("hex");

      // Update Supabase Auth password
      const { error: authError } =
        await supabase.auth.admin.updateUserById(targetUser.supabase_auth_id, {
          password: newPassword,
        });

      if (authError) {
        console.error("Error updating auth password:", authError);
        return NextResponse.json(
          { error: "Failed to update password" },
          { status: 500 }
        );
      }

      // Encrypt and store
      const encrypted = cryptr.encrypt(newPassword);
      const { error: updateError } = await supabase
        .from("users")
        .update({ login_key_encrypted: encrypted })
        .eq("id", userId);

      if (updateError) {
        console.error("Error storing encrypted key:", updateError);
        return NextResponse.json(
          { error: "Password updated but failed to store encrypted key" },
          { status: 500 }
        );
      }

      // Log the action
      const { createLog } = await import("../../../../lib/admin-logs");
      await createLog(user.id, "reset_org_login_key", "user", userId, {
        orgEmail: targetUser.email,
        orgName: targetUser.name,
      });

      return NextResponse.json({
        success: true,
        loginKey: newPassword,
      });
    }

    if (action === "send") {
      // Check for stored key
      const { data: fullUser } = await supabase
        .from("users")
        .select("login_key_encrypted")
        .eq("id", userId)
        .single();

      if (!fullUser?.login_key_encrypted) {
        return NextResponse.json(
          { error: "No stored key. Reset the password first." },
          { status: 400 }
        );
      }

      const loginKey = cryptr.decrypt(fullUser.login_key_encrypted);

      // Resolve org contact email
      let contactEmail = targetUser.email;

      if (targetUser.role === "club") {
        const { data: club } = await supabase
          .from("clubs")
          .select("id")
          .eq("user_id", userId)
          .single();
        if (club) {
          const { data: clubEmail } = await supabase
            .from("clubs")
            .select("contact_email:email")
            .eq("user_id", userId)
            .single();
          // clubs table doesn't have an email column directly, use the lookup approach
        }
      }
      // For all org types, we send to the user's own email (which is the org login email)
      // This is the email they use to log in

      // Send email
      try {
        await transporter.sendMail({
          from: "mittnq@gmail.com",
          to: contactEmail,
          subject: "MIT Technique - Your Organization Login Credentials",
          html: `
            <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F5; color: #1A1A1A; font-weight: 300;">
              <div style="background: #750014; padding: 32px 32px 28px; text-align: center;">
                <h1 style="color: #ffffff; font-weight: 700; font-size: 22px; margin: 0 0 6px; letter-spacing: 0.5px;">MIT TECHNIQUE</h1>
                <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; font-weight: 400; letter-spacing: 0.3px;">Organization Login Credentials</p>
              </div>
              <div style="padding: 28px 32px 32px;">
                <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">Hi ${targetUser.name || "there"}, here are your Technique portal login credentials.</p>
                <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                  <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Your Credentials</p>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 4px 0; font-size: 13px; color: #888; width: 120px;">Organization</td><td style="padding: 4px 0; font-size: 15px;">${targetUser.name || ""}</td></tr>
                    <tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Email</td><td style="padding: 4px 0; font-size: 15px;">${contactEmail}</td></tr>
                    <tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Password</td><td style="padding: 4px 0; font-size: 15px; font-family: monospace;">${loginKey}</td></tr>
                  </table>
                </div>
                <div style="text-align: center; margin: 0 0 28px;">
                  <a href="https://technique.mit.edu/en/login" style="display: inline-block; background: #750014; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 24px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Sign In</a>
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
        console.error("Failed to send org login email:", emailError);
        return NextResponse.json(
          { error: "Failed to send email" },
          { status: 500 }
        );
      }

      // Log the action
      const { createLog } = await import("../../../../lib/admin-logs");
      await createLog(user.id, "send_org_login_key", "user", userId, {
        orgEmail: targetUser.email,
        orgName: targetUser.name,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in org-login-key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
