"use client";
import Footer from "../../../components/Footer/Footer";
import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { useLocale, useTranslations } from 'next-intl';

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations('pages.login');

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section container-narrow">
          <div className="text-center mb-8">
            <h1 className="mb-2">{t('title')}</h1>
            <p className="text-text-secondary">
              {t('description')}
            </p>
          </div>

          {/* MIT SSO Login Section */}
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
            action="/api/login"
          >
            <p className="text-sm text-text-secondary text-center mb-6 pb-0">
              {t('instructionText')}
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

          {/* Admin Login Link */}
          <div className="text-center mt-6">
            <span className="text-sm text-text-muted">{t('adminLinkPrefix')} </span>
            <Link
              href={`/${locale}/login/admin`}
              className="text-sm text-accent hover:underline"
            >
              {t('adminLink')}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
