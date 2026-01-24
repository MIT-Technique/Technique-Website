"use client";
import Footer from "../../../../components/Footer/Footer";
import { useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import { Button, TextField } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import { useTranslations } from 'next-intl';

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

export default function AdminLoginPage() {
  const t = useTranslations('pages.login');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminSending, setAdminSending] = useState(false);
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const vertical = "top";
  const horizontal = "center";

  function handleSnackbarClose() {
    setSnackbarOpen(false);
  }

  async function handleAdminLogin(e) {
    e.preventDefault();

    // Validate email is technique@mit.edu
    if (adminEmail.toLowerCase() !== 'technique@mit.edu') {
      setAdminMessage({ type: 'error', text: t('admin.invalidEmail') });
      return;
    }

    setAdminSending(true);
    setAdminMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setAdminMessage({ type: 'success', text: t('admin.success') });
        setSnackbarSeverity('success');
        setSnackbarMessage(t('admin.success'));
        setSnackbarOpen(true);
      } else {
        setAdminMessage({ type: 'error', text: data.error || t('admin.error') });
      }
    } catch (error) {
      setAdminMessage({ type: 'error', text: t('admin.error') });
    } finally {
      setAdminSending(false);
    }
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('admin.title')}</h1>
            <p className="text-text-secondary">
              {t('admin.description')}
            </p>
          </div>

          {/* Admin Login Form */}
          <Box
            component="form"
            className="card-elevated"
            sx={{
              display: "flex",
              flexDirection: "column",
              py: 4,
              px: 4,
            }}
            onSubmit={handleAdminLogin}
          >
            <TextField
              type="email"
              label={t('admin.emailLabel')}
              variant="outlined"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder={t('admin.emailPlaceholder')}
              sx={{ ...textFieldSx, mb: 2 }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            {adminMessage.text && (
              <div className={`mb-4 p-3 rounded text-sm ${
                adminMessage.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}>
                {adminMessage.text}
              </div>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={adminSending || !adminEmail}
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
              {adminSending ? t('admin.sending') : t('admin.sendLinkButton')}
            </Button>
          </Box>
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
