"use client";
import Footer from "../../../components/Footer/Footer";
import { useState, useCallback } from "react";
import * as React from "react";
import { useTranslations } from 'next-intl';
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Button } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";

// Shared MUI text field styling
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

const selectSx = {
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E5E5" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D0D0" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#750014" },
};

export default function BioPage() {
  const t = useTranslations('pages.bio');

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [major, setMajor] = useState("");
  const [secondMajor, setSecondMajor] = useState("");
  const [quote, setQuote] = useState("");
  const [extracurriculars, setExtracurriculars] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  const vertical = "top";
  const horizontal = "center";

  // Fetch existing bio when email is entered
  const fetchBioByEmail = useCallback(async (emailValue) => {
    const trimmed = emailValue.trim().toLowerCase();
    if (!trimmed || !trimmed.endsWith('@mit.edu')) return;

    try {
      const res = await fetch(`/api/bio?email=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.data.firstName) setFirstName(json.data.firstName);
      if (json.data.lastName) setLastName(json.data.lastName);
      if (json.data.major) setMajor(json.data.major);
      if (json.data.second_major) {
        setSecondMajor(json.data.second_major.length === 0 ? "None" : json.data.second_major);
      }
      if (json.data.quote) setQuote(json.data.quote);
      if (json.data.achievements) setExtracurriculars(json.data.achievements);
      setDataLoaded(true);
    } catch {
      // Ignore fetch errors
    }
  }, []);

  function handleClose() {
    setOpen(false);
    setError(false);
  }

  function validateEmail(value) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      setEmailError(t('emailRequired'));
      return false;
    }
    if (!trimmed.endsWith('@mit.edu')) {
      setEmailError(t('emailMitOnly'));
      return false;
    }
    setEmailError("");
    return true;
  }

  async function updateBio() {
    if (!validateEmail(email)) return;

    try {
      const response = await fetch("/api/bio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName,
          lastName,
          major,
          second_major: secondMajor === "None" ? "" : secondMajor,
          quote,
          achievements: extracurriculars,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSnackMessage(data.error || t('error'));
        setOpen(true);
        setError(true);
      } else {
        setSnackMessage(t('success'));
        setOpen(true);
        setError(false);
      }
    } catch {
      setSnackMessage(t('error'));
      setError(true);
      setOpen(true);
    }
  }

  const majors = [
    "1", "1-12", "1-ENG", "2", "2A", "2-OE", "3", "3-A", "3-C",
    "4", "4-B", "5", "5-7", "6-1", "6-2", "6-3", "6-3A", "6-4",
    "6-5", "6-7", "6-9", "6-14", "6-P", "7", "8", "9", "10",
    "10-B", "10-C", "10-ENG", "11", "11-6", "12", "14-1", "14-2",
    "15-1", "15-2", "15-3", "16", "16-ENG", "17", "17-M", "18",
    "18-C", "21", "21A", "21-CMS", "21E", "21G", "21L", "21H",
    "21M", "21T", "21S", "21W", "20", "22", "22-ENG", "24",
    "24-1", "24-2", "STS",
  ];
  const second_majors = ["None", ...majors];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('title')}</h1>
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
              await updateBio();
            }}
          >
            {/* Email Field */}
            <TextField
              required
              label={t('fields.email')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) validateEmail(event.target.value);
              }}
              onBlur={(event) => {
                validateEmail(event.target.value);
                if (!dataLoaded) fetchBioByEmail(event.target.value);
              }}
              name="email"
              type="email"
              placeholder="kerb@mit.edu"
              error={!!emailError}
              helperText={emailError || t('fields.emailHelper')}
              sx={textFieldSx}
              fullWidth
            />

            <div className="grid grid-cols-2 gap-4">
              <TextField
                required
                label={t('fields.firstName')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                name="firstName"
                sx={textFieldSx}
              />
              <TextField
                required
                label={t('fields.lastName')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                name="lastName"
                sx={textFieldSx}
              />
            </div>

            <FormControl fullWidth>
              <InputLabel
                id="major-label"
                shrink
                sx={{
                  "&.Mui-focused": { color: "#750014" },
                }}
              >
                {t('fields.major')} *
              </InputLabel>
              <Select
                labelId="major-label"
                id="major-select"
                value={major}
                label={`${t('fields.major')} *`}
                notched
                required
                onChange={(event) => setMajor(event.target.value)}
                sx={selectSx}
              >
                {majors.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel
                id="second-major-label"
                shrink
                sx={{
                  "&.Mui-focused": { color: "#750014" },
                }}
              >
                Second Major *
              </InputLabel>
              <Select
                labelId="second-major-label"
                id="second-major-select"
                value={secondMajor}
                label="Second Major"
                notched
                required
                onChange={(event) => setSecondMajor(event.target.value)}
                sx={selectSx}
              >
                {second_majors.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={t('fields.quote')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              name="quote"
              multiline
              minRows={3}
              maxRows={8}
              sx={textFieldSx}
              fullWidth
              placeholder={t('fields.quotePlaceholder')}
            />

            <TextField
              label="Achievements"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={extracurriculars}
              onChange={(event) => setExtracurriculars(event.target.value)}
              name="extracurriculars"
              multiline
              minRows={3}
              maxRows={8}
              sx={textFieldSx}
              fullWidth
              placeholder="Achievements you would like to highlight"
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
          {snackMessage || (error ? t('error') : t('success'))}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
