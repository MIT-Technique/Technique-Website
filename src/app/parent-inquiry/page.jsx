"use client";

import { useState } from "react";
import Footer from "@/components/Footer/Footer";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { Button } from "@mui/material";

const INQUIRY_EMAIL = "tnq-exec@mit.edu";

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

const inquiryTypes = [
  { value: "parent-ad", subject: "Parent Ad" },
  { value: "purchase-old-yearbook", subject: "Purchase Older Yearbook" },
  { value: "yearbook-inquiry", subject: "Yearbook Inquiry" },
  { value: "other", subject: "Parent Inquiry" },
];

function mailtoHref(subject) {
  const params = new URLSearchParams({ subject });
  return `mailto:${INQUIRY_EMAIL}?${params.toString()}`;
}

export default function ParentInquiryPage() {
  const [inquiryType, setInquiryType] = useState("");

  const selected = inquiryTypes.find((t) => t.value === inquiryType);

  function handleSendMessage() {
    if (!selected) return;
    window.location.href = mailtoHref(selected.subject);
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">Parent Inquiry</h1>
            <p className="text-text-secondary">
              Select an inquiry type, then send a message. Your email app will
              open with the subject filled in—add your details and send.
            </p>
          </div>

          <Box
            className="card-elevated"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              p: 3,
            }}
          >
            <TextField
              required
              select
              label="Inquiry Type"
              value={inquiryType}
              onChange={(event) => setInquiryType(event.target.value)}
              name="inquiryType"
              sx={textFieldSx}
              fullWidth
              // SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled></MenuItem>
              {inquiryTypes.map(({ value, subject }) => (
                <MenuItem key={value} value={value}>
                  {subject}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="button"
              variant="contained"
              onClick={handleSendMessage}
              disabled={!selected}
              sx={{
                mt: 2,
                backgroundColor: "#750014",
                "&:hover": {
                  backgroundColor: "#5C0010",
                },
                "&:active": {
                  backgroundColor: "#5C0010",
                  transform: "translateY(1px)",
                },
                "&:disabled": {
                  backgroundColor: "#ccc",
                },
                transition: "all 0.2s ease",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
                py: 1.5,
                boxShadow: "none",
              }}
              fullWidth
            >
              Send Message
            </Button>
          </Box>

          <p className="text-center text-sm text-text-muted mt-6">
            Messages are sent to{" "}
            <a
              href={`mailto:${INQUIRY_EMAIL}`}
              className="text-accent hover:text-accent-hover"
            >
              {INQUIRY_EMAIL}
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
