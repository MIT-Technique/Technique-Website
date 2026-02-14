'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useUser } from '../../../hooks/useUser';

function DashboardLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const { isLoggedIn, user, loading } = useUser();

  useEffect(() => {
    if (!loading && (!isLoggedIn || user?.role !== 'admin' && user?.role !== 'staph')) {
      router.push(`/${locale}/login`);
    }
    // Redirect staph users from overview to first available tab
    if (!loading && isLoggedIn && user?.role === 'staph' && pathname === `/${locale}/dashboard`) {
      const hasAccess = user?.access?.length > 0;
      if (hasAccess) {
        router.replace(`/${locale}/dashboard/photoshoots`);
      }
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

  const ACCESS_TO_TAB = {
    clubs: { id: 'resp-clubs', label: t('tabs.respClubs'), href: `/${locale}/dashboard/responses/clubs` },
    living_groups: { id: 'resp-living-groups', label: t('tabs.respLivingGroups'), href: `/${locale}/dashboard/responses/living-groups` },
    sports: { id: 'resp-sports', label: t('tabs.respSports'), href: `/${locale}/dashboard/responses/sports` },
    activities: { id: 'resp-activities', label: t('tabs.respActivities'), href: `/${locale}/dashboard/responses/activities` },
    seniors: { id: 'resp-seniors', label: t('tabs.respSeniors'), href: `/${locale}/dashboard/responses/seniors` },
  };

  const allResponsesSubTabs = Object.values(ACCESS_TO_TAB);
  const responsesSubTabs = isAdmin
    ? allResponsesSubTabs
    : allResponsesSubTabs.filter(tab => {
        const entry = Object.entries(ACCESS_TO_TAB).find(([, v]) => v.id === tab.id);
        return entry && user?.access?.includes(entry[0]);
      });

  const settingsSubTabs = [
    { id: 'users', label: t('tabs.users'), href: `/${locale}/dashboard/users` },
    { id: 'logs', label: t('tabs.logs'), href: `/${locale}/dashboard/logs` },
    { id: 'forms', label: t('tabs.forms'), href: `/${locale}/dashboard/settings` },
    { id: 'yearbook-inventory', label: t('tabs.yearbookInventory'), href: `/${locale}/dashboard/settings/yearbook-inventory` },
    { id: 'reset', label: t('tabs.reset'), href: `/${locale}/dashboard/settings/reset` },
  ];

  const isResponsesPage = responsesSubTabs.some(tab => pathname === tab.href) || pathname === `/${locale}/dashboard/responses`;
  const isSettingsPage = settingsSubTabs.some(tab => pathname === tab.href);
  const isUsersPage = pathname === `/${locale}/dashboard/users`;
  const userTypeFilter = searchParams.get('type') || 'all';

  const allTabs = [
    { id: 'overview', label: t('tabs.overview'), href: `/${locale}/dashboard`, adminOnly: true },
    { id: 'photoshoots', label: t('tabs.photoshoots'), href: `/${locale}/dashboard/photoshoots`, adminOnly: false },
    { id: 'responses', label: t('tabs.responses'), href: responsesSubTabs[0]?.href || `/${locale}/dashboard/responses/clubs`, adminOnly: false, requiresAccess: true },
    { id: 'settings', label: t('tabs.settings'), href: `/${locale}/dashboard/users`, adminOnly: true },
  ];

  const tabs = isAdmin
    ? allTabs
    : allTabs.filter(tab => {
        if (tab.adminOnly) return false;
        if (tab.requiresAccess) return responsesSubTabs.length > 0;
        return true;
      });

  return (
    <main className="min-h-screen pt-24 lg:pt-32 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium mb-2">{isAdmin ? t('title') : t('staphTitle')}</h1>
          <p className="text-text-secondary text-sm">
            {t('welcome', { name: user?.name || user?.email })}
          </p>
        </div>

        {isAdmin || (user?.access?.length > 0) ? (
          <>
            {/* Tabs */}
            <div className="border-b border-border mb-8">
              <nav className="flex gap-8 overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = tab.id === 'responses'
                    ? isResponsesPage
                    : tab.id === 'settings'
                    ? isSettingsPage
                    : pathname === tab.href;
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        isActive
                          ? 'border-accent text-accent'
                          : 'border-transparent text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sub-tabs */}
            {(isResponsesPage || isSettingsPage) && (
              <div className="flex items-center gap-4 mb-6 overflow-x-auto">
                {(isResponsesPage ? responsesSubTabs : settingsSubTabs).map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      pathname === tab.href
                        ? 'bg-accent text-white'
                        : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
                {isUsersPage && (
                  <>
                    <span className="border-l border-border h-4" />
                    {['all', 'individual', 'orgs'].map((key) => (
                      <Link
                        key={key}
                        href={key === 'all' ? `/${locale}/dashboard/users` : `/${locale}/dashboard/users?type=${key}`}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          userTypeFilter === key
                            ? 'bg-accent text-white'
                            : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {t(`users.filters.${key === 'all' ? 'allUsers' : key === 'individual' ? 'individual' : 'orgsOnly'}`)}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Content */}
            {children}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-secondary">{t('noPermissions')}</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-24 lg:pt-32">
        <div className="container-text text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    }>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
