import { NextResponse } from "next/server";
import { clearSession } from "../../../../lib/auth/session";

export async function GET() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: true });
  }
}

export async function POST() {
  return GET();
}
