"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import useSession from '../../hooks/useSession';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function UserMenu({ isHomePage = false, inSidebar = false }) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');
  const { session, loading } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render anything while loading to prevent layout shift
  if (loading) {
    return (
      <div className="w-20 h-8 animate-pulse rounded bg-gray-200/20" />
    );
  }

  // Not logged in - show LOGIN button
  if (!session?.isLoggedIn) {
    return (
      <Link
        href="/api/login"
        className={`${inSidebar ? '' : 'nav-item font-bold'} text-xs uppercase tracking-widest transition-colors ${
          isHomePage
            ? "text-white/70 hover:text-white"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        {t('login')}
      </Link>
    );
  }

  // Logged in - show user dropdown
  const userName = session.userInfo?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
          isHomePage
            ? "text-white/70 hover:text-white"
            : "text-text-secondary hover:text-text-primary"
        }`}
        aria-label={t('myAccount')}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
          isHomePage
            ? "bg-white/20 text-white"
            : "bg-accent/10 text-accent"
        }`}>
          {userInitial}
        </div>
        <span className="hidden sm:inline text-xs uppercase tracking-wider">
          {userName}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className={`absolute right-0 mt-2 w-56 rounded shadow-lg z-50 ${
            isHomePage
              ? "bg-black/90 backdrop-blur-sm border border-white/10"
              : "bg-white border border-border"
          }`}>
            {/* User info header */}
            <div className={`px-4 py-3 border-b ${
              isHomePage ? "border-white/10" : "border-border"
            }`}>
              <p className={`text-sm font-medium ${
                isHomePage ? "text-white" : "text-text-primary"
              }`}>
                {userName}
              </p>
              <p className={`text-xs ${
                isHomePage ? "text-white/60" : "text-text-muted"
              }`}>
                {session.userInfo?.email}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href={`/${locale}/dashboard`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isHomePage
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                }`}
              >
                <DashboardIcon sx={{ fontSize: 18 }} />
                {t('dashboard')}
              </Link>

              <a
                href="/api/logout"
                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isHomePage
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                }`}
              >
                <LogoutIcon sx={{ fontSize: 18 }} />
                {t('logout')}
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
