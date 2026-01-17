"use client";
import React, { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import "./Navbar.css";

function Navbar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const isHomePage = pathname === `/${locale}`;
  const [openDropdown, setOpenDropdown] = useState(null);

  // Check if any item in a dropdown is active
  const isDropdownActive = (items) => {
    return items.some(item => {
      if (item.href === `/${locale}/login`) return pathname === `/${locale}/login` || pathname === `/${locale}/bio`;
      return pathname === item.href || pathname.startsWith(item.href + "/");
    });
  };

  const isActive = (href) => {
    if (href === `/${locale}`) return pathname === `/${locale}`;
    if (href === `/${locale}/login`) return pathname === `/${locale}/login` || pathname === `/${locale}/bio`;
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Navigation structure with dropdowns
  const navStructure = [
    {
      label: t('about'),
      dropdown: [
        { href: `/${locale}/about`, label: t('dropdown.ourHistory') },
        { href: `/${locale}/portfolio`, label: t('dropdown.portfolio') },
        { href: `/${locale}/contact`, label: t('dropdown.contact') },
      ],
    },
    { href: `/${locale}/archives`, label: t('archive') },
    { href: `/${locale}/yearbook`, label: t('yearbook') },
    { href: `/${locale}/invoice`, label: t('invoice') },
    {
      label: t('seniors'),
      dropdown: [
        { href: `/${locale}/seniors`, label: t('dropdown.portraits') },
        { href: `/${locale}/login`, label: t('dropdown.seniorBio') },
      ],
    },
    { href: `/${locale}/hire`, label: t('hireUs'), special: true },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <div
        className={`hidden lg:flex flex-col z-50 ${
          isHomePage
            ? "absolute top-0 left-0 right-0 bg-transparent"
            : "relative bg-[#FFFAFA] border-b border-border"
        }`}
      >
        <nav className="h-16 top-0 w-full flex items-center justify-between px-8 lg:px-12">
          {/* Logo */}
          <Link
            className={`text-lg font-medium tracking-wide transition-colors ${
              isHomePage
                ? "text-white hover:text-white/80"
                : "text-text-primary hover:text-accent"
            }`}
            href={`/${locale}`}
          >
            {tCommon('siteName')}
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-8">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {navStructure.map((item, index) => (
              item.dropdown ? (
                // Dropdown item
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className={`nav-item nav-dropdown text-xs uppercase tracking-widest font-medium transition-colors flex items-center gap-1 ${
                      isHomePage
                        ? isDropdownActive(item.dropdown)
                          ? "text-white active-home"
                          : "text-white/70 hover:text-white"
                        : isDropdownActive(item.dropdown)
                          ? "text-accent active"
                          : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-3 h-3 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ${
                      openDropdown === item.label
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-2"
                    }`}
                  >
                    <div
                      className={`min-w-[160px] py-2 rounded shadow-lg ${
                        isHomePage
                          ? "bg-black/90 backdrop-blur-sm"
                          : "bg-white border border-border"
                      }`}
                    >
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                            isHomePage
                              ? isActive(subItem.href)
                                ? "text-white bg-white/10"
                                : "text-white/70 hover:text-white hover:bg-white/10"
                              : isActive(subItem.href)
                                ? "text-accent bg-accent/5"
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Regular item or special (Hire Us)
                <Link
                  key={item.href}
                  className={`nav-item text-xs uppercase tracking-widest font-medium transition-colors ${
                    item.special ? 'nav-item-hire group' : ''
                  } ${
                    isHomePage
                      ? isActive(item.href)
                        ? "text-white active-home"
                        : "text-white/70 hover:text-white"
                      : isActive(item.href)
                        ? "text-accent active"
                        : "text-text-secondary hover:text-text-primary"
                  }`}
                  href={item.href}
                >
                  {item.label}
                  {item.special && (
                    <span className="inline-block ml-1 transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </Link>
              )
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <Sidebar pathname={pathname} />
    </>
  );
}

export default Navbar;
