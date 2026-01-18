"use client";
import React from "react";
import Link from "next/link";
import Footer from "../../../components/Footer/Footer";
import { useTranslations, useLocale } from 'next-intl';
import useSession from "../../../hooks/useSession";
import PersonIcon from '@mui/icons-material/Person';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import GroupsIcon from '@mui/icons-material/Groups';

function DashboardPage() {
  const t = useTranslations('pages.dashboard');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const { session, loading } = useSession();

  if (loading) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32 flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </main>
    );
  }

  if (!session?.isLoggedIn) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32">
        <section className="section-tight container-text text-center">
          <h1 className="mb-4">{t('notLoggedIn')}</h1>
          <p className="text-text-secondary mb-8">{t('pleaseLogin')}</p>
          <Link href="/api/login" className="btn-primary">
            {tNav('login')}
          </Link>
        </section>
      </main>
    );
  }

  const userName = session.userInfo?.name || 'User';
  const userEmail = session.userInfo?.email || '';

  const dashboardLinks = [
    {
      href: `/${locale}/bio`,
      icon: <EditNoteIcon sx={{ fontSize: 32 }} />,
      title: t('seniorBio.title'),
      description: t('seniorBio.description'),
    },
    {
      href: `/${locale}/invoice`,
      icon: <ReceiptLongIcon sx={{ fontSize: 32 }} />,
      title: t('invoice.title'),
      description: t('invoice.description'),
    },
    {
      href: `/${locale}/clubs`,
      icon: <GroupsIcon sx={{ fontSize: 32 }} />,
      title: t('clubs.title'),
      description: t('clubs.description'),
    },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32">
        {/* Header Section */}
        <section className="section-tight container-text">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <PersonIcon sx={{ fontSize: 32, color: '#750014' }} />
            </div>
            <div>
              <h1 className="mb-0">{t('welcome', { name: userName })}</h1>
              <p className="text-text-muted text-sm">{userEmail}</p>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="section container-narrow">
          <h2 className="text-lg font-medium mb-6 text-text-secondary uppercase tracking-wider">
            {t('quickLinks')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="group p-6 border border-border rounded-lg hover:border-accent/30 hover:shadow-md transition-all"
              >
                <div className="text-accent mb-4 group-hover:scale-110 transition-transform">
                  {link.icon}
                </div>
                <h3 className="font-medium mb-2 group-hover:text-accent transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-text-muted">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Placeholder Section */}
        <section className="section container-text text-center">
          <div className="p-8 border-2 border-dashed border-border rounded-lg">
            <p className="text-text-muted italic">
              {t('placeholder')}
            </p>
          </div>
        </section>

        {/* Logout Section */}
        <section className="section-tight container-text text-center">
          <a
            href="/api/logout"
            className="text-sm text-text-muted hover:text-accent transition-colors"
          >
            {tNav('logout')} →
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default DashboardPage;
