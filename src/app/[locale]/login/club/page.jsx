"use client";
import Footer from "../../../../components/Footer/Footer";
import { useState } from "react";
import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import { Button, TextField } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import { useLocale, useTranslations } from 'next-intl';

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

export default function ClubLoginPage() {
  const locale = useLocale();
  const t = useTranslations('pages.login');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const vertical = "top";
  const horizontal = "center";

  function handleSnackbarClose() {
    setSnackbarOpen(false);
  }

  async function handleClubLogin(e) {
    e.preventDefault();

    setSending(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/club-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('club.success') });
        setSnackbarSeverity('success');
        setSnackbarMessage(t('club.success'));
        setSnackbarOpen(true);
      } else {
        setMessage({ type: 'error', text: data.error || t('club.error') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('club.error') });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('club.title')}</h1>
            <p className="text-text-secondary">
              {t('club.description')}
            </p>
          </div>

          {/* Club Login Form */}
          <Box
            component="form"
            className="card-elevated"
            sx={{
              display: "flex",
              flexDirection: "column",
              py: 4,
              px: 4,
            }}
            onSubmit={handleClubLogin}
          >
            <TextField
              type="email"
              label={t('club.emailLabel')}
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('club.emailPlaceholder')}
              sx={{ ...textFieldSx, mb: 2 }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            {message.text && (
              <div className={`mb-4 p-3 rounded text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={sending || !email}
              sx={{
                backgroundColor: "#750014",
                "&:hover": {
                  backgroundColor: "#5C0010",
                },
                "&:disabled": {
                  backgroundColor: "#ccc",
                },
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 500,
                py: 1.5,
                boxShadow: "none",
              }}
            >
              {sending ? t('club.sending') : t('club.sendLinkButton')}
            </Button>
          </Box>

          {/* Back to regular login */}
          <div className="text-center mt-6">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-text-secondary hover:text-accent"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </section>
      </main>

      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={4000}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            sx={{ p: 0.5 }}
            onClick={handleSnackbarClose}
          >
            <CloseIcon />
          </IconButton>
        }
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Footer />
    </>
  );
}
