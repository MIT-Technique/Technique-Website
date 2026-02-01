import { NextResponse } from "next/server";
import { clearSession } from "../../../../lib/auth/session";
import { getSession as getOriginalSession } from "../../../../lib/lib";

export async function GET() {
  try {
    const originalSession = await getOriginalSession();
    originalSession.isLoggedIn = false;
    originalSession.access_token = undefined;
    originalSession.userInfo = undefined;

    await Promise.all([
      clearSession(),
      originalSession.save(),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: true });
  }
}

export async function POST() {
  return GET();
}
