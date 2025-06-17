import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { AxiosResponse } from "axios";
import sgMail from "@sendgrid/mail";
import { PDFDocument, rgb, drawTextField } from "pdf-lib";
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("HELLLOOOOO");
  //Grabbing API Key from environment variables. See all the keys on the tnq drive if you don't have this
  const ANVIL_API_KEY: string = process.env.ANVIL_API_KEY;
  //DO NOT COMMIT THE API KEYS TO GITHUB!!!!!!!!!!!!!!

  const RECIPIENT_EMAIL: string = "tnq-exec@mit.edu";
  const FROM_EMAIL: string = "mittnq@gmail.com";

  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "pdfs",
      "Gig_Invoice_Template.pdf"
    );

    const existingPdfBytes = await fs.promises.readFile(filePath);
    //  Read the raw binary PDF file from disk
    const arialFontBytes = fs.readFileSync(
      path.join(process.cwd(), "public", "fonts", "arial.ttf")
    );
    console.log(existingPdfBytes);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    pdfDoc.registerFontkit(fontkit);
    const arialFont = await pdfDoc.embedFont(arialFontBytes);
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
    // const outputPath = path.join(
    //   process.cwd(),
    //   "public",
    //   "modified_sample.pdf"
    // );

    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    //message containing invoice to send to tnq-exec
    const msg = {
      to: RECIPIENT_EMAIL,
      from: FROM_EMAIL,
      subject: `New Invoice for Photography Job Technique did for ${emailData.orgName} that happened on ${emailData.eventDate}`,
      text: "Please find the invoice attached.",
      html: `<p>Cost Object: ${emailData.costObject}</p>`,
      attachments: [
        {
          content: pdfBase64,
          filename: "invoice.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error.response?.body || error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
