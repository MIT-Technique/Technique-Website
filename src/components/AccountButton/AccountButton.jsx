'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../hooks/useUser';
import OrganizationAuthModal from '../OrganizationAuthModal/OrganizationAuthModal';

function AccountButton({ isHomePage = false }) {
  const locale = useLocale();
  const t = useTranslations('account');
  const { isLoggedIn, user, loading, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const loginDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div
        className={`px-4 py-2 text-xs uppercase tracking-widest font-medium border rounded transition-colors ${
          isHomePage
            ? 'border-white/30 text-white/50'
            : 'border-border text-text-muted'
        }`}
      >
        ...
      </div>
    );
  }

  function handleOrganizationLogin() {
    setLoginDropdownOpen(false);
    setOrgModalOpen(true);
  }

  function handleStaphLogin() {
    setLoginDropdownOpen(false);
    window.location.href = `/${locale}/login/admin`;
  }

  if (!isLoggedIn) {
    return (
      <>
        <div
          className="relative"
          ref={loginDropdownRef}
          onMouseEnter={() => setLoginDropdownOpen(true)}
          onMouseLeave={() => setLoginDropdownOpen(false)}
        >
          <button
            className={`px-4 py-2 text-xs uppercase tracking-widest font-medium border rounded transition-colors ${
              isHomePage
                ? 'border-white/50 text-white/70 hover:border-white hover:text-white'
                : 'border-border text-text-secondary hover:border-accent hover:text-accent'
            }`}
          >
            {t('login')}
          </button>

          {/* Login Dropdown Menu */}
          <div
            className={`absolute top-full right-0 mt-2 transition-all duration-200 z-50 ${
              loginDropdownOpen
                ? 'opacity-100 visible translate-y-0'
                : 'opacity-0 invisible -translate-y-2'
            }`}
          >
            <div
              className={`min-w-[160px] py-2 rounded shadow-lg ${
                isHomePage
                  ? 'bg-black/90 backdrop-blur-sm'
                  : 'bg-white border border-border'
              }`}
            >
              <button
                onClick={handleOrganizationLogin}
                className={`block w-full text-left px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                  isHomePage
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                {t('organization')}
              </button>
              <button
                onClick={handleStaphLogin}
                className={`block w-full text-left px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                  isHomePage
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                {t('staph')}
              </button>
            </div>
          </div>
        </div>

        <OrganizationAuthModal
          open={orgModalOpen}
          onClose={() => setOrgModalOpen(false)}
        />
      </>
    );
  }

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (user?.role === 'admin' || user?.role === 'staph') {
      return `/${locale}/dashboard`;
    }
    if (user?.role === 'club') return `/${locale}/club`;
    if (user?.role === 'living_group') return `/${locale}/living-group`;
    if (user?.role === 'sports') return `/${locale}/sports`;
    return `/${locale}/profile`;
  };

  // Get display name
  const displayName = user?.name || user?.email?.split('@')[0] || 'Account';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 text-xs uppercase tracking-widest font-medium border rounded transition-colors flex items-center gap-2 ${
          isHomePage
            ? 'border-white/50 text-white/70 hover:border-white hover:text-white'
            : 'border-border text-text-secondary hover:border-accent hover:text-accent'
        }`}
      >
        {displayName}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full right-0 mt-2 transition-all duration-200 z-50 ${
          isOpen
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-2'
        }`}
      >
        <div
          className={`min-w-[160px] py-2 rounded shadow-lg ${
            isHomePage
              ? 'bg-black/90 backdrop-blur-sm'
              : 'bg-white border border-border'
          }`}
        >
          <Link
            href={getDashboardLink()}
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
              isHomePage
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            {(user?.role === 'admin' || user?.role === 'staph') ? t('dashboard') : t('profile')}
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className={`block w-full text-left px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
              isHomePage
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            {t('signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountButton;
