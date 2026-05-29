"use client";
import Footer from "@/components/Footer/Footer";
import { useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
// Shared MUI text field styling

const INQUIRY_EMAIL = "tnq-exec@mit.edu";

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

// Generate year options for old pictures (1861 to current year)
const currentYear = new Date().getFullYear();
const allYearOptions = [];
for (let y = currentYear; y >= 1861; y--) {
  allYearOptions.push(y);
}

export default function AlumniInquiryPage() {
  const [category, setCategory] = useState("");

  const categoryOptions = [
    { value: "oldYearbooks", subject: "Old Yearbooks" },
    { value: "oldPictures", subject: "Old Pictures" },
    { value: "other", subject: "Other Inquiries" },
  ];

  function mailtoHref(subject) {
    const params = new URLSearchParams({ subject });
    return `mailto:${INQUIRY_EMAIL}?${params.toString()}`;
  }
  const selected = categoryOptions.find((t) => t.value === category);

  function handleSendMessage() {
    if (!selected) return;
    window.location.href = mailtoHref(selected.subject);
  }
  function handleCategoryChange(value) {
    setCategory(value);
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{"Alumni Inquiry"}</h1>
            <p className="text-text-secondary">
              {"Submit your inquiry and we'll get back to you."}
            </p>
          </div>

          <Box
            component="form"
            className="card-elevated"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
            onSubmit={async (event) => {
              event.preventDefault();
              await sendInquiry();
            }}
          >
            <TextField
              required
              select
              label={"Inquiry Type"}
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
              name="category"
              sx={textFieldSx}
              fullWidth
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.subject}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              variant="contained"
              disabled={!category}
              onClick={handleSendMessage}
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
        </section>
      </main>

      <Footer />
    </>
  );
}
