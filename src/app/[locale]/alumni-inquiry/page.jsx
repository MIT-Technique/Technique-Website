"use client";
import Footer from "../../../components/Footer/Footer";
import { useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import { useTranslations } from 'next-intl';

// Shared MUI text field styling
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

export default function AlumniInquiryPage() {
  const t = useTranslations('pages.alumniInquiry');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const vertical = "top";
  const horizontal = "center";

  const categoryOptions = [
    { value: "oldYearbooks", label: t('fields.categoryOptions.oldYearbooks') },
    { value: "oldPictures", label: t('fields.categoryOptions.oldPictures') },
    { value: "other", label: t('fields.categoryOptions.other') },
  ];

  function handleClose() {
    setOpen(false);
    setError(false);
  }

  const sendInquiry = async () => {
    try {
      const response = await fetch("/api/sendContactForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "alumni",
          data: {
            name,
            email,
            graduationYear,
            category: categoryOptions.find(opt => opt.value === category)?.label || category,
            message,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to send inquiry");
      console.log("Inquiry sent successfully");
      setName("");
      setEmail("");
      setGraduationYear("");
      setCategory("");
      setMessage("");
      setOpen(true);
    } catch (error) {
      console.error(error);
      setError(true);
      setOpen(true);
    }
  };

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('title')}</h1>
            <p className="text-text-secondary">
              {t('description')}
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
              label={t('fields.name')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={name}
              onChange={(event) => setName(event.target.value)}
              name="name"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              required
              label={t('fields.email')}
              variant="outlined"
              type="email"
              InputLabelProps={{ shrink: true }}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              name="email"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              label={t('fields.graduationYear')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={graduationYear}
              onChange={(event) => setGraduationYear(event.target.value)}
              name="graduationYear"
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              required
              select
              label={t('fields.category')}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              name="category"
              sx={textFieldSx}
              fullWidth
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              required
              label={t('fields.message')}
              variant="outlined"
              multiline
              rows={4}
              InputLabelProps={{ shrink: true }}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              name="message"
              sx={textFieldSx}
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
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
                transition: "all 0.2s ease",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
                py: 1.5,
                boxShadow: "none",
              }}
              fullWidth
            >
              {t('submitButton')}
            </Button>
          </Box>
        </section>
      </main>

      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        onClose={handleClose}
        autoHideDuration={4000}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            sx={{ p: 0.5 }}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
        }
      >
        <Alert
          onClose={handleClose}
          severity={error ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error ? t('error') : t('success')}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
