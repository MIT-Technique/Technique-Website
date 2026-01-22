"use client";
import Footer from "../../../components/Footer/Footer";
import { useState, useEffect } from "react";
import * as React from "react";
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

const selectSx = {
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E5E5" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D0D0" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#750014" },
};

export default function BioPage() {
  const t = useTranslations('pages.bio');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [major, setMajor] = useState("");
  const [secondMajor, setSecondMajor] = useState("");
  const [quote, setQuote] = useState("");
  const [extracurriculars, setExtracurriculars] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const vertical = "top";
  const horizontal = "center";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/getUserData", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const json = await res.json();
        setFirstName(json.data.firstName);
        setLastName(json.data.lastName);
        setMajor(json.data.major);
        if (json.data.second_major.length === 0) {
          setSecondMajor("None");
        } else {
          setSecondMajor(json.data.second_major);
        }
        setQuote(json.data.quote);
        setExtracurriculars(json.data.achievements);
      } catch (err) {
        // setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  function handleClose() {
    setOpen(false);
    setError(false);
  }

  async function updateBio() {
    try {
      const response = await fetch("/api/updateBio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          major: major,
          second_major: secondMajor === "None" ? "" : secondMajor,
          quote: quote,
          achievements: extracurriculars,
        }),
      });

      if (!response.ok) {
        setOpen(true);
        setError(true);
      } else {
        setOpen(true);
      }
    } catch (err) {
      // console.error(err);
      setError(true);
      setOpen(true);
    }
  }

  const majors = [
    "1",
    "1-12",
    "1-ENG",
    "2",
    "2A",
    "2-OE",
    "3",
    "3-A",
    "3-C",
    "4",
    "4-B",
    "5",
    "5-7",
    "6-1",
    "6-2",
    "6-3",
    "6-3A",
    "6-4",
    "6-5",
    "6-7",
    "6-9",
    "6-14",
    "6-P",
    "7",
    "8",
    "9",
    "10",
    "10-B",
    "10-C",
    "10-ENG",
    "11",
    "11-6",
    "12",
    "14-1",
    "14-2",
    "15-1",
    "15-2",
    "15-3",
    "16",
    "16-ENG",
    "17",
    "17-M",
    "18",
    "18-C",
    "21",
    "21A",
    "21-CMS",
    "21E",
    "21G",
    "21L",
    "21H",
    "21M",
    "21T",
    "21S",
    "21W",
    "20",
    "22",
    "22-ENG",
    "24",
    "24-1",
    "24-2",
    "STS",
  ];
  const second_majors = [
    "None",
    "1",
    "1-12",
    "1-ENG",
    "2",
    "2A",
    "2-OE",
    "3",
    "3-A",
    "3-C",
    "4",
    "4-B",
    "5",
    "5-7",
    "6-1",
    "6-2",
    "6-3",
    "6-3A",
    "6-4",
    "6-5",
    "6-7",
    "6-9",
    "6-14",
    "6-P",
    "7",
    "8",
    "9",
    "10",
    "10-B",
    "10-C",
    "10-ENG",
    "11",
    "11-6",
    "12",
    "14-1",
    "14-2",
    "15-1",
    "15-2",
    "15-3",
    "16",
    "16-ENG",
    "17",
    "17-M",
    "18",
    "18-C",
    "21",
    "21A",
    "21-CMS",
    "21E",
    "21G",
    "21L",
    "21H",
    "21M",
    "21T",
    "21S",
    "21W",
    "20",
    "22",
    "22-ENG",
    "24",
    "24-1",
    "24-2",
    "STS",
  ];

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
              await updateBio();
            }}
          >
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
