import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
