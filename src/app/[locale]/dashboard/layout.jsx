'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useUser } from '../../../hooks/useUser';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const { isLoggedIn, user, loading } = useUser();

  useEffect(() => {
    if (!loading && (!isLoggedIn || user?.role !== 'admin' && user?.role !== 'staph')) {
      router.push(`/${locale}/login`);
    }
    // Redirect staph users from overview to photoshoots (their default tab)
    if (!loading && isLoggedIn && user?.role === 'staph' && pathname === `/${locale}/dashboard`) {
      router.replace(`/${locale}/dashboard/photoshoots`);
    }
  }, [isLoggedIn, user, loading, router, locale, pathname]);

  if (loading) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32">
        <div className="container-text text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn || user?.role !== 'admin' && user?.role !== 'staph') {
    return null;
  }

  const isAdmin = user?.role === 'admin';

  const allTabs = [
    { id: 'overview', label: t('tabs.overview'), href: `/${locale}/dashboard`, adminOnly: true },
    { id: 'photoshoots', label: t('tabs.photoshoots'), href: `/${locale}/dashboard/photoshoots`, adminOnly: false },
    { id: 'clubs', label: t('tabs.clubs'), href: `/${locale}/dashboard/clubs`, adminOnly: true },
    { id: 'living-groups', label: t('tabs.livingGroups'), href: `/${locale}/dashboard/living-groups`, adminOnly: false },
    { id: 'sports', label: t('tabs.sports'), href: `/${locale}/dashboard/sports`, adminOnly: true },
    { id: 'users', label: t('tabs.users'), href: `/${locale}/dashboard/users`, adminOnly: true },
    { id: 'logs', label: t('tabs.logs'), href: `/${locale}/dashboard/logs`, adminOnly: true },
    { id: 'settings', label: t('tabs.settings'), href: `/${locale}/dashboard/settings`, adminOnly: true },
  ];

  const tabs = isAdmin ? allTabs : allTabs.filter(tab => !tab.adminOnly);

  return (
    <main className="min-h-screen pt-24 lg:pt-32 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium mb-2">{isAdmin ? t('title') : t('staphTitle')}</h1>
          <p className="text-text-secondary text-sm">
            {t('welcome', { name: user?.first_name || user?.email })}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-8">
          <nav className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  pathname === tab.href
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Content */}
        {children}
      </div>
    </main>
  );
}
