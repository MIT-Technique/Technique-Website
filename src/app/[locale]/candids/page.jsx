"use client";
import Footer from "../../../components/Footer/Footer";
import { useState, useEffect, useRef, useCallback } from "react";
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

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function CandidsPage() {
  const t = useTranslations('pages.candids');
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventNameError, setEventNameError] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [files, setFiles] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const [existingImageUrls, setExistingImageUrls] = useState([null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackError, setSnackError] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);
  const [formNote, setFormNote] = useState(null);
  const fileInputRefs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    fetch('/api/form-status?form=candids_form')
      .then(res => res.json())
      .then(data => {
        setIsFrozen(data.isFrozen || false);
        setFormNote(data.note || null);
      })
      .catch(() => {});
  }, []);

  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch existing candid submission when email is entered
  const fetchCandidsByEmail = useCallback(async (emailValue) => {
    const trimmed = emailValue.trim().toLowerCase();
    if (!trimmed) return;
    const normalized = trimmed.includes('@') ? trimmed : `${trimmed}@mit.edu`;
    if (!normalized.endsWith('@mit.edu')) return;

    try {
      const res = await fetch(`/api/candids/upload?email=${encodeURIComponent(normalized)}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        if (json.data.eventName && !eventName.trim()) setEventName(json.data.eventName);
        if (json.data.eventDescription && !eventDescription.trim()) setEventDescription(json.data.eventDescription);
        if (json.data.imageUrls?.length) {
          const newPreviews = [null, null, null];
          const newExisting = [null, null, null];
          json.data.imageUrls.forEach((url, i) => {
            if (i < 3) {
              newPreviews[i] = url;
              newExisting[i] = url;
            }
          });
          setPreviews(newPreviews);
          setExistingImageUrls(newExisting);
        }
      }
      setDataLoaded(true);
    } catch {
      // Ignore fetch errors
    }
  }, [eventName, eventDescription]);

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

  function validateEventName(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      setEventNameError(t('eventNameRequired'));
      return false;
    }
    setEventNameError("");
    return true;
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
    if (newPreviews[index] && newPreviews[index].startsWith('blob:')) URL.revokeObjectURL(newPreviews[index]);
    newPreviews[index] = URL.createObjectURL(file);
    setPreviews(newPreviews);

    const newExisting = [...existingImageUrls];
    newExisting[index] = null;
    setExistingImageUrls(newExisting);
  }

  function removeFile(index) {
    const newFiles = [...files];
    newFiles[index] = null;
    setFiles(newFiles);

    const newPreviews = [...previews];
    // Only revoke if it's a blob URL (not a remote existing image URL)
    if (newPreviews[index] && newPreviews[index].startsWith('blob:')) URL.revokeObjectURL(newPreviews[index]);
    newPreviews[index] = null;
    setPreviews(newPreviews);

    const newExisting = [...existingImageUrls];
    newExisting[index] = null;
    setExistingImageUrls(newExisting);

    if (fileInputRefs[index].current) fileInputRefs[index].current.value = '';
  }

  function handleDescriptionChange(e) {
    const value = e.target.value;
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 75 || value.length < eventDescription.length) {
      setEventDescription(value);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const emailValid = validateEmail(email);
    const nameValid = validateEventName(eventName);

    if (!emailValid || !nameValid) return;

    const activeFiles = files.filter(Boolean);
    const hasExistingImages = existingImageUrls.some(Boolean);
    if (activeFiles.length === 0 && !hasExistingImages) {
      setSnackMessage(t('noFiles'));
      setSnackError(true);
      setSnackOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      const uploadedPaths = [];

      // Upload each file using presigned URLs
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        // Get presigned URL
        const presignRes = await fetch('/api/candids/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            fileName: file.name,
            fileType: file.type,
            slot: String(i + 1),
            eventName: eventName.trim(),
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error || 'Failed to get upload URL');
        }

        const { signedUrl, path } = await presignRes.json();

        // Upload file directly to Supabase storage
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            'x-upsert': 'true',
          },
          body: file,
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text().catch(() => '');
          console.error('Upload failed:', uploadRes.status, errorText);
          throw new Error(`Failed to upload image ${i + 1}`);
        }

        uploadedPaths.push(path);
      }

      // Confirm upload and save to database
      const keepUrls = existingImageUrls.filter(Boolean);
      const confirmRes = await fetch('/api/candids/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          paths: uploadedPaths,
          eventName: eventName.trim(),
          eventDescription: eventDescription.trim(),
          keepImageUrls: keepUrls,
        }),
      });

      if (confirmRes.ok) {
        setSnackMessage(t('success'));
        setSnackError(false);
        setSnackOpen(true);
        // Reset form
        setFiles([null, null, null]);
        setPreviews([null, null, null]);
        setExistingImageUrls([null, null, null]);
        setEventName("");
        setEventDescription("");
        fileInputRefs.forEach(ref => { if (ref.current) ref.current.value = ''; });
      } else {
        const data = await confirmRes.json();
        setSnackMessage(data.error || t('error'));
        setSnackError(true);
        setSnackOpen(true);
      }
    } catch (err) {
      setSnackMessage(err.message || t('error'));
      setSnackError(true);
      setSnackOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  const descriptionWordCount = eventDescription.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('title')}</h1>
          </div>

          {isFrozen && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-700 font-medium">{t('frozen')}</p>
              {formNote && <p className="text-sm text-gray-600 mt-1">{formNote}</p>}
            </div>
          )}

          {!isFrozen && formNote && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">{formNote}</p>
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
            {/* Email Field */}
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
              onBlur={(e) => {
                validateEmail(e.target.value);
                if (!dataLoaded) fetchCandidsByEmail(e.target.value);
              }}
              name="email"
              placeholder="kerb"
              error={!!emailError}
              helperText={emailError || t('emailAutofillHint')}
              sx={textFieldSx}
              fullWidth
              InputProps={{
                endAdornment: <span style={{ color: '#666', marginLeft: 4 }}>@mit.edu</span>,
              }}
            />

            {/* Event Name */}
            <TextField
              required
              label={t('eventNameLabel')}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={eventName}
              onChange={(e) => {
                setEventName(e.target.value);
                if (eventNameError) validateEventName(e.target.value);
              }}
              onBlur={(e) => validateEventName(e.target.value)}
              placeholder={t('eventNamePlaceholder')}
              error={!!eventNameError}
              helperText={eventNameError || t('eventNameHint')}
              sx={textFieldSx}
              fullWidth
            />

            {/* Event Description (optional) */}
            <div>
              <TextField
                label={t('eventDescriptionLabel')}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={eventDescription}
                onChange={handleDescriptionChange}
                placeholder={t('eventDescriptionPlaceholder')}
                multiline
                minRows={2}
                maxRows={4}
                sx={textFieldSx}
                fullWidth
              />
              <p className="text-xs text-text-muted mt-1">
                {descriptionWordCount} / 75
              </p>
            </div>

            {/* Image Upload Slots */}
            <div>
              <p className="text-sm text-text-secondary mb-3">{t('imagesLabel')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center relative"
                  >
                    {previews[index] ? (
                      <div className="relative">
                        <img
                          src={previews[index]}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-6">
                        <input
                          ref={fileInputRefs[index]}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => handleFileChange(index, e.target.files?.[0])}
                        />
                        <div className="text-gray-400 text-sm">
                          <div className="text-2xl mb-1">+</div>
                          {t('uploadSlot', { n: index + 1 })}
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
              disabled={submitting || (!files.some(Boolean) && !existingImageUrls.some(Boolean)) || isFrozen}
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
            <p className="text-xs text-text-muted text-center">
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
