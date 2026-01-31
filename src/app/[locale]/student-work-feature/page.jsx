"use client";
import Footer from "../../../components/Footer/Footer";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function StudentWorkFeaturePage() {
  const t = useTranslations('pages.studentWorkFeature');
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [members, setMembers] = useState([""]);
  const [additionalCredits, setAdditionalCredits] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState([null, null, null, null, null]);
  const [previews, setPreviews] = useState([null, null, null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackError, setSnackError] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);
  const fileInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    fetch('/api/form-status?form=student_work_form')
      .then(res => res.json())
      .then(data => setIsFrozen(data.isFrozen || false))
      .catch(() => {});
  }, []);

  function normalizeEmail(value) {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return '';
    // If no @ symbol, assume it's just the kerb and append @mit.edu
    if (!trimmed.includes('@')) {
      return `${trimmed}@mit.edu`;
    }
    return trimmed;
  }

  function validateEmail(value) {
    const normalized = normalizeEmail(value);
    if (!normalized) {
      setEmailError(t('emailRequired'));
      return false;
    }
    if (!normalized.endsWith('@mit.edu')) {
      setEmailError(t('emailMitOnly'));
      return false;
    }
    setEmailError("");
    return true;
  }

  function updateMember(index, value) {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  }

  function addMember() {
    setMembers([...members, ""]);
  }

  function removeMember(index) {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
  }

  function handleFileChange(index, file) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setSnackMessage(t('invalidType'));
      setSnackError(true);
      setSnackOpen(true);
      return;
    }
    if (file.size > MAX_SIZE) {
      setSnackMessage(t('tooLarge'));
      setSnackError(true);
      setSnackOpen(true);
      return;
    }
    const newFiles = [...files];
    newFiles[index] = file;
    setFiles(newFiles);

    const newPreviews = [...previews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newPreviews[index] = URL.createObjectURL(file);
    setPreviews(newPreviews);
  }

  function removeFile(index) {
    const newFiles = [...files];
    newFiles[index] = null;
    setFiles(newFiles);

    const newPreviews = [...previews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newPreviews[index] = null;
    setPreviews(newPreviews);

    if (fileInputRefs[index].current) fileInputRefs[index].current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateEmail(email)) return;

    if (!members[0]?.trim()) {
      setSnackMessage(t('member1Required'));
      setSnackError(true);
      setSnackOpen(true);
      return;
    }
    if (!projectTitle.trim()) {
      setSnackMessage(t('titleRequired'));
      setSnackError(true);
      setSnackOpen(true);
      return;
    }
    if (!projectDescription.trim()) {
      setSnackMessage(t('descriptionRequired'));
      setSnackError(true);
      setSnackOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('email', normalizeEmail(email));
      const filteredMembers = members.map(m => m.trim()).filter(Boolean);
      formData.append('members', JSON.stringify(filteredMembers));
      if (additionalCredits.trim()) formData.append('additionalCredits', additionalCredits.trim());
      formData.append('projectTitle', projectTitle.trim());
      formData.append('projectDescription', projectDescription.trim());
      if (links.trim()) formData.append('links', links.trim());

      let fileIndex = 1;
      for (const file of files) {
        if (file) {
          formData.append(`file${fileIndex}`, file);
          fileIndex++;
        }
      }

      const res = await fetch('/api/student-work-feature/submit', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSnackMessage(t('success'));
        setSnackError(false);
        setSnackOpen(true);
        setMembers([""]);
        setAdditionalCredits("");
        setProjectTitle(""); setProjectDescription("");
        setLinks("");
        setFiles([null, null, null, null, null]);
        setPreviews([null, null, null, null, null]);
        fileInputRefs.forEach(ref => { if (ref.current) ref.current.value = ''; });
      } else {
        const data = await res.json();
        setSnackMessage(data.error || t('error'));
        setSnackError(true);
        setSnackOpen(true);
      }
    } catch {
      setSnackMessage(t('error'));
      setSnackError(true);
      setSnackOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('title')}</h1>
          </div>

          {isFrozen && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">{t('frozen')}</p>
            </div>
          )}

          <Box
            component="form"
            className="card-elevated"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
            onSubmit={handleSubmit}
          >
            {/* Email */}
            <TextField
              required
              label={t('emailLabel')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              name="email"
              placeholder="kerb"
              error={!!emailError}
              helperText={emailError}
              sx={textFieldSx}
              fullWidth
              InputProps={{
                endAdornment: <span style={{ color: '#666', marginLeft: 4 }}>@mit.edu</span>,
              }}
            />

            {/* Members */}
            <div>
              <p className="text-sm text-text-secondary mb-2">{t('membersLabel')}</p>
              <div className="flex flex-col gap-2">
                {members.map((member, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <TextField
                      required={index === 0}
                      label={t('memberLabel', { n: index + 1 })}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      value={member}
                      onChange={(e) => updateMember(index, e.target.value)}
                      sx={textFieldSx}
                      fullWidth
                      size="small"
                    />
                    {index > 0 && (
                      <IconButton
                        onClick={() => removeMember(index)}
                        size="small"
                        sx={{ color: "#999", "&:hover": { color: "#750014" } }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                onClick={addMember}
                size="small"
                sx={{
                  mt: 1,
                  color: "#750014",
                  textTransform: "none",
                  fontWeight: 400,
                }}
              >
                + {t('addMember')}
              </Button>
            </div>

            <TextField
              label={t('additionalCreditsLabel')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={additionalCredits}
              onChange={(e) => setAdditionalCredits(e.target.value)}
              sx={textFieldSx}
              fullWidth
            />

            {/* Project Details */}
            <p className="text-sm text-text-secondary !pb-0">{t('projectSubtitle')}</p>
            <TextField
              required
              label={t('projectTitleLabel')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              sx={textFieldSx}
              fullWidth
            />
            <TextField
              required
              label={t('projectDescriptionLabel')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              helperText={t('projectDescriptionHint')}
              multiline
              minRows={3}
              sx={textFieldSx}
              fullWidth
            />

            {/* Links */}
            <TextField
              label={t('linksLabel')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              helperText={t('linksHint')}
              sx={textFieldSx}
              fullWidth
            />

            {/* Image Upload Slots */}
            <div>
              <p className="text-sm text-text-secondary mb-3">{t('imagesLabel')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center relative"
                  >
                    {previews[index] ? (
                      <div className="relative">
                        <img
                          src={previews[index]}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-4">
                        <input
                          ref={fileInputRefs[index]}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => handleFileChange(index, e.target.files?.[0])}
                        />
                        <div className="text-gray-400 text-sm">
                          <div className="text-xl mb-1">+</div>
                          {index + 1}
                        </div>
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-2">{t('imageHint')}</p>
            </div>

            <Button
              type="submit"
              variant="contained"
              disabled={submitting || isFrozen}
              sx={{
                mt: 1,
                backgroundColor: "#750014",
                "&:hover": { backgroundColor: "#5C0010" },
                "&:disabled": { backgroundColor: "#ccc" },
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
                py: 1.5,
                boxShadow: "none",
              }}
              fullWidth
            >
              {submitting ? t('submitting') : t('submit')}
            </Button>

            {/* Contact mailto */}
            <p className="text-xs text-text-muted text-center mt-4">
              {t('contactText')}{' '}
              <a href="mailto:technique@mit.edu" className="text-primary hover:underline">
                technique@mit.edu
              </a>
            </p>
          </Box>
        </section>
      </main>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={snackOpen}
        onClose={() => setSnackOpen(false)}
        autoHideDuration={4000}
        action={
          <IconButton aria-label="close" color="inherit" sx={{ p: 0.5 }} onClick={() => setSnackOpen(false)}>
            <CloseIcon />
          </IconButton>
        }
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackError ? "error" : "success"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
