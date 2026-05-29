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

function buildCredentialsEmail(
  name: string,
  email: string,
  password: string,
  isOrg: boolean,
  isReset: boolean
) {
  const subtitle = isOrg
    ? isReset ? "Password Reset" : "Organization Login Credentials"
    : "Password Reset";
  const greeting = isReset
    ? `Hi ${name || "there"}, your login password has been reset.`
    : `Hi ${name || "there"}, here are your Technique portal login credentials.`;
  const signInUrl = isOrg
    ? "https://technique.mit.edu/login"
    : "https://technique.mit.edu/login/admin";
  const orgRow = isOrg
    ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #888; width: 120px;">Organization</td><td style="padding: 4px 0; font-size: 15px;">${name || ""}</td></tr>`
    : "";

  return `
    <div style="font-family: Raleway, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F9F5F5; color: #1A1A1A; font-weight: 300;">
      <div style="background: #750014; padding: 32px 32px 28px; text-align: center;">
        <h1 style="color: #ffffff; font-weight: 700; font-size: 22px; margin: 0 0 6px; letter-spacing: 0.5px;">MIT TECHNIQUE</h1>
        <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; font-weight: 400; letter-spacing: 0.3px;">${subtitle}</p>
      </div>
      <div style="padding: 28px 32px 32px;">
        <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px;">${greeting}</p>
        <div style="background: #ffffff; border-left: 3px solid #750014; border-radius: 4px; padding: 20px 24px; margin: 0 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #750014; margin: 0 0 12px; font-weight: 600;">Your Credentials</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${orgRow}
            <tr><td style="padding: 4px 0; font-size: 13px; color: #888; width: 120px;">Email</td><td style="padding: 4px 0; font-size: 15px;">${email}</td></tr>
            <tr><td style="padding: 4px 0; font-size: 13px; color: #888;">Password</td><td style="padding: 4px 0; font-size: 15px; font-family: monospace;">${password}</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin: 0 0 28px;">
          <a href="${signInUrl}" style="display: inline-block; background: #750014; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 24px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Sign In</a>
        </div>
        <div style="border-top: 1px solid #E0D6D6; padding-top: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0 0 4px;">MIT Technique &middot; Walker Memorial, Room 50-320</p>
          <p style="color: #999; font-size: 12px; margin: 0;"><a href="mailto:technique@mit.edu" style="color: #999; text-decoration: none;">technique@mit.edu</a></p>
        </div>
      </div>
    </div>
  `;
}

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
      .select("id, email, name, role, supabase_auth_id, login_key_encrypted")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!targetUser.supabase_auth_id) {
      return NextResponse.json(
        { error: "User has no auth account" },
        { status: 400 }
      );
    }

    const isOrg = ORG_ROLES.includes(targetUser.role);
    const cryptr = getCryptr();

    if (action === "reset") {
      // Generate new password: TNQ- + 12 hex chars for orgs, base64url for staph/admin
      const newPassword = isOrg
        ? "TNQ-" + crypto.randomBytes(6).toString("hex")
        : crypto.randomBytes(12).toString("base64url");

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
        // Password was still updated in Auth, so continue
      }

      // Send email with new credentials
      let emailSent = false;
      try {
        await transporter.sendMail({
          from: "mittnq@gmail.com",
          to: targetUser.email,
          subject: "MIT Technique - Your Password Has Been Reset",
          html: buildCredentialsEmail(
            targetUser.name,
            targetUser.email,
            newPassword,
            isOrg,
            true
          ),
        });
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
      }

      // Log the action
      const { createLog } = await import("../../../../lib/admin-logs");
      await createLog(user.id, "reset_login_key", "user", userId, {
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      });

      return NextResponse.json({
        success: true,
        loginKey: newPassword,
        emailSent,
      });
    }

    if (action === "send") {
      // Check for stored key
      if (!targetUser.login_key_encrypted) {
        return NextResponse.json(
          { error: "No stored key. Reset the password first." },
          { status: 400 }
        );
      }

      const loginKey = cryptr.decrypt(targetUser.login_key_encrypted);

      // Send email
      try {
        await transporter.sendMail({
          from: "mittnq@gmail.com",
          to: targetUser.email,
          subject: "MIT Technique - Your Login Credentials",
          html: buildCredentialsEmail(
            targetUser.name,
            targetUser.email,
            loginKey,
            isOrg,
            false
          ),
        });
      } catch (emailError) {
        console.error("Failed to send login email:", emailError);
        return NextResponse.json(
          { error: "Failed to send email" },
          { status: 500 }
        );
      }

      // Log the action
      const { createLog } = await import("../../../../lib/admin-logs");
      await createLog(user.id, "send_login_key", "user", userId, {
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
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
