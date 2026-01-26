'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutPage() {
  const t = useTranslations('pages.logout');
  const locale = useLocale();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleSignOut() {
    setIsLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push(`/${locale}/`);
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white border border-border rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-normal text-text-primary mb-2">
              {t('title')}
            </h1>
            <p className="text-text-secondary leading-relaxed">
              {t('message')}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="w-full bg-accent text-white py-3 px-6 rounded text-sm font-medium uppercase tracking-wide transition-all duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? t('signingOut') : t('signOut')}
          </button>

          <p className="mt-4 text-sm text-text-muted">
            {t('studentNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
