"use client";
import Footer from '@/components/Footer/Footer';
import { useState, useEffect } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import { Button, TextField } from "@mui/material";
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

export default function AdminLoginPage() {

  const router = useRouter();
  const { isLoggedIn, user, loading: userLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!userLoading && isLoggedIn) {
      const role = user?.role;
      if (role === 'admin' || role === 'staph') {
        router.replace(`/dashboard`);
      } else if (role === 'club') {
        router.replace(`/club`);
      } else if (role === 'living_group') {
        router.replace(`/living-group`);
      } else if (role === 'sports') {
        router.replace(`/sports`);
      } else {
        router.replace('/');
      }
    }
  }, [userLoading, isLoggedIn, user, router]);

  if (userLoading || isLoggedIn) {
    return null;
  }

  async function handleAdminLogin(e) {
    e.preventDefault();

    if (!password) {
      setMessage({ type: 'error', text: "Password is required" });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: "Login successful! Redirecting..." });
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 500);
      } else {
        setMessage({ type: 'error', text: data.error || "Invalid credentials. Please try again." });
      }
    } catch (error) {
      setMessage({ type: 'error', text: "Invalid credentials. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{"Staph Login"}</h1>
            <p className="text-text-secondary">
              {"For Technique staph and administrators."}
            </p>
          </div>

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
              label={"Email"}
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={"Leave blank for admin login"}
              sx={{ ...textFieldSx, mb: 2 }}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="password"
              label={"Password"}
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={"Enter password"}
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
              disabled={loading || !password}
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
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>
        </section>
      </main>
      <Footer />
    </>
  );
}
