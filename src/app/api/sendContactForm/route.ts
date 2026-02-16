import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "../../../lib/supabase/admin";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mittnq@gmail.com",
    pass: process.env.GOOGLE_PASSWORD,
  },
});
const RECIPIENT_EMAIL: string = "tnq-exec@mit.edu";
const FROM_EMAIL: string = "mittnq@gmail.com";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { formType, data } = await request.json();

    let subject: string;
    let htmlContent: string;

    if (formType === "parent") {
      subject = `Parent Inquiry: ${data.category}`;
      htmlContent = `
        <h2>New Parent Inquiry</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.studentName ? `<p><strong>Student Name:</strong> ${data.studentName}</p>` : ""}
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, "<br>")}</p>
      `;
    } else if (formType === "alumni") {
      subject = `Alumni Inquiry: ${data.category}`;
      htmlContent = `
        <h2>New Alumni Inquiry</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.graduationYear ? `<p><strong>Graduation Year:</strong> ${data.graduationYear}</p>` : ""}
        <p><strong>Category:</strong> ${data.category}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, "<br>")}</p>
      `;
    } else {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 });
    }

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: RECIPIENT_EMAIL,
      subject: subject,
      html: htmlContent,
    });

    // Save yearbook purchase requests to database
    const isYearbookRequest =
      (formType === "parent" && data.category === "Purchase Old Yearbook") ||
      (formType === "alumni" && data.category === "Old Yearbooks");

    if (isYearbookRequest) {
      try {
        const supabase = createAdminClient();
        await supabase.from("yearbook_requests").insert({
          source: formType,
          name: data.name,
          email: data.email,
          student_name: data.studentName || null,
          graduation_year: data.graduationYear || null,
          year_requested: parseInt(data.yearRequested) || null,
          shipping_address: data.shippingAddress || null,
          shipping_city: data.shippingCity || null,
          shipping_state: data.shippingState || null,
          shipping_zip: data.shippingZip || null,
          message: data.message || null,
        });
      } catch (dbError) {
        console.error("Failed to save yearbook request to database:", dbError);
        // Don't fail the email — DB save is best-effort
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
