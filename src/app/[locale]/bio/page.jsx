"use client";
import Footer from "../../../components/Footer/Footer";
import ImageUpload from "../../../components/ImageUpload/ImageUpload";
import { useState, useCallback } from "react";
import * as React from "react";
import { useTranslations } from "next-intl";
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
import CircularProgress from "@mui/material/CircularProgress";

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
  const t = useTranslations("pages.bio");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [major, setMajor] = useState("");
  const [minor, setMinor] = useState("");
  const [secondMajor, setSecondMajor] = useState("");
  const [quote, setQuote] = useState("");
  const [extracurriculars, setExtracurriculars] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [disableEmail, setDisabledEmail] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  const vertical = "top";
  const horizontal = "center";

  // Fetch existing bio when email is entered, with fallback to users table
  const fetchBioByEmail = useCallback(
    async (emailValue) => {
      setFirstName("");
      setLastName("");
      setMajor("");
      setMinor("");
      setSecondMajor("");
      setQuote("");
      setExtracurriculars("");
      setPhotoUrl(null);
      const trimmed = emailValue.trim().toLowerCase();
      if (!trimmed) return;
      // Normalize: if no @, append @mit.edu
      const normalized = trimmed.includes("@") ? trimmed : `${trimmed}@mit.edu`;
      if (!normalized.endsWith("@mit.edu")) return;

      try {
        // First try senior_bios
        const res = await fetch(
          `/api/bio?email=${encodeURIComponent(normalized)}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data.firstName) setFirstName(json.data.firstName);
          if (json.data.lastName) setLastName(json.data.lastName);
          if (json.data.major) setMajor(json.data.major);
          if (json.data.minor) setMinor(json.data.minor);
          if (json.data.second_major) setSecondMajor(json.data.second_major);
          if (json.data.quote) setQuote(json.data.quote);
          if (json.data.achievements)
            setExtracurriculars(json.data.achievements);
          // If we got name/major from senior_bios, we're done
          if (json.data.firstName && json.data.lastName && json.data.major) {
            setDataLoaded(true);
            setDisabledEmail(true);
          }
        }

        // Fetch existing photo
        try {
          const photoRes = await fetch(
            `/api/senior-photos?email=${encodeURIComponent(normalized)}`,
            { cache: "no-store" },
          );
          if (photoRes.ok) {
            const photoJson = await photoRes.json();
            if (photoJson.data?.imageUrl) {
              setPhotoUrl(photoJson.data.imageUrl);
            }
          }
        } catch {
          // Ignore photo fetch errors
        }

        // Always show form after fetching (even if no existing data)
        setDataLoaded(true);
        setDisabledEmail(true);
      } catch {
        // Ignore fetch errors
      }
    },
    [email],
  );

  function handleClose() {
    setOpen(false);
    setError(false);
  }

  function normalizeEmail(value) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return "";
    // If no @ symbol, assume it's just the kerb and append @mit.edu
    if (!trimmed.includes("@")) {
      return `${trimmed}@mit.edu`;
    }
    return trimmed;
  }

  function validateEmail(value) {
    const normalized = normalizeEmail(value);
    if (!normalized) {
      setEmailError(t("emailRequired"));
      return false;
    }
    if (!normalized.endsWith("@mit.edu")) {
      setEmailError(t("emailMitOnly"));
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handlePhotoUpload(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", normalizeEmail(email));
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);

    const res = await fetch("/api/senior-photos", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || t("photo.uploadError"));
    }

    const { url } = await res.json();
    setPhotoUrl(url);
    return url;
  }

  async function handlePhotoDelete() {
    const res = await fetch(
      `/api/senior-photos?email=${encodeURIComponent(normalizeEmail(email))}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || t("photo.deleteError"));
    }

    setPhotoUrl(null);
  }

  async function updateBio() {
    if (!validateEmail(email)) return;

    if (!firstName.trim() || !lastName.trim() || !major) {
      setSnackMessage("First name, last name, and major are required");
      setOpen(true);
      setError(true);
      return;
    }

    try {
      const response = await fetch("/api/bio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizeEmail(email),
          firstName,
          lastName,
          major: major || null,
          minor: minor || null,
          second_major: secondMajor || null,
          quote,
          achievements: extracurriculars,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSnackMessage(data.error || t("error"));
        setOpen(true);
        setError(true);
      } else {
        setSnackMessage(t("success"));
        setOpen(true);
        setError(false);
      }
    } catch {
      setSnackMessage(t("error"));
      setError(true);
      setOpen(true);
    }
  }

  const majors = [
    { name: "Civil and Environmental Engineering", course: "1-ENG" },
    { name: "Climate System Science and Engineering", course: "1-12" },
    { name: "Mechanical Engineering", course: "2" },
    { name: "Mechanical Engineering", course: "2-A" },
    { name: "Mechanical and Ocean Engineering", course: "2-OE" },
    { name: "Materials Science and Engineering", course: "3" },
    { name: "Materials Science and Engineering", course: "3-A" },
    { name: "Archaeology and Materials", course: "3-C" },
    { name: "Architecture", course: "4" },
    { name: "Art and Design", course: "4-B" },
    { name: "Chemistry", course: "5" },
    { name: "Chemistry and Biology", course: "5-7" },
    { name: "Electrical Science and Engineering", course: "6-1" },
    { name: "Electrical Engineering and Computer Science", course: "6-P" },
    { name: "Electrical Engineering and Computer Science", course: "6-2" },
    { name: "Electrical Engineering and Computer Science", course: "6-2A" },
    { name: "Computer Science and Engineering", course: "6-3" },
    { name: "Artificial Intelligence and Decision Making", course: "6-4" },
    { name: "Electrical Engineering and Computing", course: "6-5" },
    { name: "Computer Science and Molecular Biology", course: "6-7" },
    { name: "Computation and Cognition", course: "6-9" },
    { name: "Computer Science, Economics and Data Science", course: "6-14" },
    { name: "Biology", course: "7" },
    { name: "Physics", course: "8" },
    { name: "Brain and Cognitive Sciences", course: "9" },
    { name: "Chemical Engineering", course: "10" },
    { name: "Chemical Engineering", course: "10-C" },
    { name: "Chemical Engineering", course: "10-ENG" },
    { name: "Chemical-Biological Engineering", course: "10-B" },
    { name: "Planning", course: "11" },
    { name: "Urban Science and Planning with CS", course: "11-6" },
    { name: "Earth, Atmospheric, and Planetary Sciences", course: "12" },
    { name: "Economics", course: "14-1" },
    { name: "Mathematical Economics", course: "14-2" },
    { name: "Management", course: "15-1" },
    { name: "Business Analytics", course: "15-2" },
    { name: "Finance", course: "15-3" },
    { name: "Aerospace Engineering", course: "16" },
    { name: "Aerospace Engineering", course: "16-ENG" },
    { name: "Political Science", course: "17" },
    { name: "Mathematics", course: "18" },
    { name: "Mathematics with Computer Science", course: "18-C" },
    { name: "Biological Engineering", course: "20" },
    { name: "African and African Diaspora Studies", course: "21" },
    { name: "Ancient and Medieval Studies", course: "21" },
    { name: "Asian and Asian Diaspora Studies", course: "21" },
    { name: "Latin American and Latino/a Studies", course: "21" },
    { name: "Russian and Eurasian Studies", course: "21" },
    { name: "Women's and Gender Studies", course: "21" },
    { name: "Anthropology", course: "21A" },
    { name: "Humanities and Engineering", course: "21E" },
    { name: "French", course: "21G" },
    { name: "German", course: "21G" },
    { name: "Spanish", course: "21G" },
    { name: "History", course: "21H" },
    { name: "Literature", course: "21L" },
    { name: "Music", course: "21M" },
    { name: "Theater Arts", course: "21T" },
    { name: "Humanities and Science", course: "21S" },
    { name: "Writing", course: "21W" },
    { name: "Nuclear Science and Engineering", course: "22" },
    { name: "Flexible Nuclear Science", course: "22-ENG" },
    { name: "Philosophy", course: "24-1" },
    { name: "Linguistics", course: "24-2" },
    { name: "Comparative Media Studies", course: "21CMS" },
    { name: "Science, Technology and Society", course: "STS" },
  ];

  const minors = [
    { name: "Civil and Environmental Systems", course: "1" },
    { name: "Civil Engineering", course: "1" },
    { name: "Environmental Engineering Science", course: "1" },
    { name: "Mechanical Engineering", course: "2" },
    { name: "Mechanical Engineering", course: "2-A" },
    { name: "Materials Science and Engineering", course: "3" },
    { name: "Materials Science and Engineering", course: "3-A" },
    { name: "Archaeology and Materials", course: "3-C" },
    { name: "Architecture", course: "4" },
    { name: "Art, Culture and Technology", course: "4" },
    { name: "Design", course: "4" },
    { name: "History of Architecture, Art and Design", course: "4" },
    { name: "Chemistry", course: "5" },
    { name: "Electrical Science and Engineering", course: "6-1" },
    { name: "Electrical Engineering and Computer Science", course: "6-P" },
    { name: "Electrical Engineering and Computer Science", course: "6-2" },
    { name: "Electrical Engineering and Computer Science", course: "6-2A" },
    { name: "Computer Science and Engineering", course: "6-3" },
    { name: "Computer Science, Economics and Data Science", course: "6-14" },
    { name: "Biology", course: "7" },
    { name: "Astronomy", course: "8" },
    { name: "Physics", course: "8" },
    { name: "Brain and Cognitive Sciences", course: "9" },
    { name: "International Development", course: "11" },
    { name: "Urban Studies and Planning", course: "11" },
    { name: "Astronomy", course: "12" },
    { name: "Atmospheric Chemistry", course: "12" },
    { name: "Earth, Atmospheric, and Planetary Sciences", course: "12" },
    { name: "Energy Studies", course: "12" },
    { name: "Economics", course: "14-1" },
    { name: "Management", course: "15-1" },
    { name: "Business Analytics", course: "15-2" },
    { name: "Finance", course: "15-3" },
    { name: "Applied International Studies", course: "17" },
    { name: "Political Science", course: "17" },
    { name: "Public Policy", course: "17" },
    { name: "Mathematics", course: "18" },
    { name: "Biomedical Engineering", course: "20" },
    { name: "Toxicology and Environmental Health", course: "20" },
    { name: "African and African Diaspora Studies", course: "21" },
    { name: "Ancient and Medieval Studies", course: "21" },
    { name: "Asian and Asian Diaspora Studies", course: "21" },
    { name: "Latin American and Latino/a Studies", course: "21" },
    { name: "Middle Eastern Studies", course: "21" },
    { name: "Russian and Eurasian Studies", course: "21" },
    { name: "Women's and Gender Studies", course: "21" },
    { name: "Anthropology", course: "21A" },
    { name: "Chinese", course: "21G" },
    { name: "French", course: "21G" },
    { name: "German", course: "21G" },
    { name: "Japanese", course: "21G" },
    { name: "Spanish", course: "21G" },
    { name: "History", course: "21H" },
    { name: "Literature", course: "21L" },
    { name: "Music", course: "21M" },
    { name: "Theater Arts", course: "21T" },
    { name: "Writing", course: "21W" },
    { name: "Nuclear Science and Engineering", course: "22" },
    { name: "Philosophy", course: "24-1" },
    { name: "Linguistics", course: "24-2" },
    { name: "Comparative Media Studies", course: "21CMS" },
    { name: "Entrepreneurship & Innovation", course: "E&I" },
    { name: "Statistics and Data Science", course: "IDSS" },
    { name: "Environment and Sustainability", course: "Inter-school" },
    { name: "Polymers and Soft Matter", course: "Inter-school" },
    { name: "Science, Technology and Society", course: "STS" },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t("title")}</h1>
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
            {/* <TextField
              required
              label={t("fields.email")}
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
              placeholder="kerb"
              error={!!emailError}
              helperText={emailError || t("fields.emailAutofillHint")}
              sx={textFieldSx}
              fullWidth
              InputProps={{
                endAdornment: (
                  <span style={{ color: "#666", marginLeft: 4 }}>@mit.edu</span>
                ),
              }}
              disabled={disableEmail}
            />*/}
            {dataLoaded ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    required
                    label={t("fields.firstName")}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    name="firstName"
                    sx={textFieldSx}
                  />
                  <TextField
                    required
                    label={t("fields.lastName")}
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
                    {t("fields.major")} *
                  </InputLabel>
                  <Select
                    labelId="major-label"
                    id="major-select"
                    value={major}
                    label={`${t("fields.major")} *`}
                    notched
                    required
                    displayEmpty
                    onChange={(event) => setMajor(event.target.value)}
                    sx={selectSx}
                  >
                    <MenuItem value="" disabled>
                      Select...
                    </MenuItem>
                    {majors.map((m) => (
                      <MenuItem
                        key={`${m.course}-${m.name}`}
                        value={`${m.course}, ${m.name}`}
                      >
                        {m.course}, {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <div className="grid grid-cols-2 gap-4">
                  <FormControl fullWidth>
                    <InputLabel
                      id="minor-label"
                      shrink
                      sx={{
                        "&.Mui-focused": { color: "#750014" },
                      }}
                    >
                      {t("fields.minor")}
                    </InputLabel>
                    <Select
                      labelId="minor-label"
                      id="minor-select"
                      value={minor}
                      label={t("fields.minor")}
                      notched
                      displayEmpty
                      onChange={(event) => setMinor(event.target.value)}
                      sx={selectSx}
                    >
                      <MenuItem value="">Select...</MenuItem>
                      {minors.map((m) => (
                        <MenuItem
                          key={`${m.course}-${m.name}`}
                          value={`${m.course}, ${m.name}`}
                        >
                          {m.course}, {m.name}
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
                      {t("fields.secondMajor")}
                    </InputLabel>
                    <Select
                      labelId="second-major-label"
                      id="second-major-select"
                      value={secondMajor}
                      label={t("fields.secondMajor")}
                      notched
                      displayEmpty
                      onChange={(event) => setSecondMajor(event.target.value)}
                      sx={selectSx}
                    >
                      <MenuItem value="">Select...</MenuItem>
                      {majors.map((m) => (
                        <MenuItem
                          key={`second-${m.course}-${m.name}`}
                          value={`${m.course}, ${m.name}`}
                        >
                          {m.course}, {m.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <TextField
                  label={t("fields.quote")}
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
                  placeholder={t("fields.quotePlaceholder")}
                />

                <TextField
                  label="Extracurriculars"
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
                  placeholder="Extracurriculars you would like to highlight"
                />

                {/* Photo Upload Section */}
                <div className="mt-4 mb-2">
                  <p className="text-sm font-medium text-text-secondary mb-2">
                    {t("photo.label")}
                  </p>

                  <p className="text-xs text-text-muted mb-3">
                    {t("photo.guideline")}{" "}
                    <a href="/seniors" className="text-primary hover:underline">
                      {t("photo.learnMore")}
                    </a>
                  </p>

                  <ImageUpload
                    imageUrl={photoUrl}
                    onUpload={handlePhotoUpload}
                    onDelete={handlePhotoDelete}
                    disabled={!dataLoaded}
                    label={t("photo.uploadLabel")}
                    size="md"
                  />
                </div>

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
                  {t("submitButton")}
                </Button>
              </>
            ) : (
              <></>
            )}
            {/* <>
            </> */}
            {/* Contact mailto */}
            <p className="text-xs text-text-muted text-center mt-4">
              The form has now closed
              {/* {t("contactText")}{" "} */}
              {/* <a
                href="mailto:technique@mit.edu"
                className="text-primary hover:underline"
              >
                technique@mit.edu
              </a> */}
            </p>
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
          {snackMessage || (error ? t("error") : t("success"))}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
