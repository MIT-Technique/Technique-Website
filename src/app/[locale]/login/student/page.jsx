"use client";
import Footer from "../../../../components/Footer/Footer";
import * as React from "react";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { useTranslations } from 'next-intl';
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const t = useTranslations('pages.login');
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-narrow">
          {/* MIT SSO Login Section Only */}
          <Box
            component="form"
            className="card-elevated"
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 6,
            }}
            method="GET"
            action={returnUrl ? `/api/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/api/login"}
          >
            <p className="text-sm text-text-secondary text-center mb-6 pb-0">
              Sign in to access the senior bio form
            </p>
            <Button
              type="submit"
              variant="contained"
              sx={{
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
                px: 6,
                boxShadow: "none",
              }}
            >
              {t('signInButton')}
            </Button>
          </Box>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-narrow">
          <div className="text-center">
            <p className="text-text-secondary">Loading...</p>
          </div>
        </section>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
