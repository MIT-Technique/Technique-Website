import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
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
    const filePath = path.join(
      process.cwd(),
      "public",
      "pdfs",
      "Gig_Invoice_Template.pdf",
    );

    const existingPdfBytes = await fs.promises.readFile(filePath);
    //  Read the raw binary PDF file from disk

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const pdfForm = pdfDoc.getForm();
    const photographerNameField = pdfForm.getTextField("photographerName");
    const invoiceDateField = pdfForm.getTextField("invoiceDate");
    const hourlyRateField = pdfForm.getTextField("hourlyRate");
    const totalField0 = pdfForm.getTextField("total.0");
    const totalField1 = pdfForm.getTextField("total.1");
    const totalHoursField = pdfForm.getTextField("totalHours");
    const eventNameField = pdfForm.getTextField("eventName");
    const clientField = pdfForm.getTextField("client");
    const eventDateField = pdfForm.getTextField("eventDate");

    const { anvilData, emailData, pdfData } = await request.json();
    const {
      photographerName,
      invoiceDate,
      hourlyRate,
      totalCost,
      totalHours,
      eventName,
      orgName,
      eventDate,
    } = pdfData;
    photographerNameField.setText(`${photographerName}`);
    invoiceDateField.setText(`${invoiceDate}`);
    hourlyRateField.setText(`${hourlyRate}`);
    totalField0.setText(`${totalCost}`);
    totalField1.setText(`${totalCost}`);
    totalHoursField.setText(`${totalHours}`);
    eventNameField.setText(`${eventName}`);
    clientField.setText(`${orgName}`);
    eventDateField.setText(`${eventDate}`);
    pdfForm.flatten();
    const pdfBytes = await pdfDoc.save();

    const pdfBase64 = Buffer.from(pdfBytes);

    await transporter.sendMail({
      from: `${FROM_EMAIL}`,
      to: `${RECIPIENT_EMAIL}`,
      subject: `New Invoice for Photography Job Technique did for ${orgName} that happened on ${eventDate}`,
      text: "Please find the invoice attached.",
      attachments: [
        { filename: `invoice_${eventName}.pdf`, content: pdfBase64 },
      ],
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
