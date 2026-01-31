"use client";
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames } from '../../i18n/config';
import LanguageIcon from '@mui/icons-material/Language';

export default function LanguageSwitcher({ isHomePage = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const t = useTranslations('languageSwitcher');
  const [isOpen, setIsOpen] = useState(false);

  const switchLocale = (newLocale) => {
    // Remove current locale prefix and add new one
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '');
    const newPath = `/${newLocale}${pathWithoutLocale}`;

    // Set cookie and navigate
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
          isHomePage ? "text-white/70 hover:text-white" : "hover:text-accent"
        }`}
        aria-label={t('selectLanguage')}
      >
        <LanguageIcon sx={{ fontSize: 18 }} />
        <span className="uppercase">{currentLocale}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 mt-2 w-48 bg-white border border-border rounded shadow-lg z-50">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors ${
                  locale === currentLocale ? 'bg-bg-secondary font-medium' : ''
                }`}
              >
                {localeNames[locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
