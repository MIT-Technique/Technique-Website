"use client";
import React from "react";
import Link from "next/link";
import MailIcon from "@mui/icons-material/Mail";
import InstagramIcon from "@mui/icons-material/Instagram";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';

export default function Footer() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('footer');
  const isHomePage = pathname === `/${locale}`;

  return (
    <footer
      className={`${
        isHomePage ? "bg-black text-white" : "bg-white text-text-primary border-t border-border"
      } w-full z-50 relative`}
    >
      <div className="container-content py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          {/* Left: Copyright & Privacy */}
          <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4">
            <p
              className={`text-xs pb-0 ${
                isHomePage ? "text-white/60" : "text-text-muted"
              }`}
            >
              {t('copyright')}
            </p>
            <Link
              href={`/${locale}/privacy`}
              className={`text-xs ${
                isHomePage
                  ? "text-white/60 hover:text-white"
                  : "text-text-muted hover:text-accent"
              } transition-colors underline`}
            >
              {t('privacyPolicy')}
            </Link>
          </div>

          {/* Right: Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="mailto:technique@mit.edu"
              className={`${
                isHomePage
                  ? "text-white/60 hover:text-white"
                  : "text-text-muted hover:text-accent"
              } transition-colors`}
              aria-label={t('emailLabel')}
            >
              <MailIcon sx={{ fontSize: 18 }} />
            </a>
            <a
              href="https://www.instagram.com/mit.tnq/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                isHomePage
                  ? "text-white/60 hover:text-white"
                  : "text-text-muted hover:text-accent"
              } transition-colors`}
              aria-label={t('instagramLabel')}
            >
              <InstagramIcon sx={{ fontSize: 18 }} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
