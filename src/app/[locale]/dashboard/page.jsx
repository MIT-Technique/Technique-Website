'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/overview-stats');
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const orgCards = stats ? [
    {
      title: t('stats.clubs'),
      value: stats.clubs.total,
      subtitle: t('stats.descriptionsCompleted', { count: stats.clubs.descriptionsCompleted, total: stats.clubs.total }),
      href: `/${locale}/dashboard/clubs`,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: t('stats.livingGroups'),
      value: stats.livingGroups.total,
      subtitle: t('stats.lgCandidsSubmitted', { count: stats.livingGroups.candidsSubmitted, total: stats.livingGroups.total }),
      href: `/${locale}/dashboard/living-groups`,
      color: 'bg-green-50 border-green-200',
    },
    {
      title: t('stats.sports'),
      value: stats.sports.total,
      subtitle: t('stats.descriptionsCompleted', { count: stats.sports.descriptionsCompleted, total: stats.sports.total }),
      href: `/${locale}/dashboard/sports`,
      color: 'bg-purple-50 border-purple-200',
    },
  ] : [];

  const detailCards = stats ? [
    {
      title: t('stats.totalImages'),
      value: stats.totalImages,
      href: null,
      color: 'bg-orange-50 border-orange-200',
    },
    {
      title: t('stats.bookedPhotoshoots'),
      value: stats.photoshoots.booked,
      href: `/${locale}/dashboard/photoshoots`,
      color: 'bg-teal-50 border-teal-200',
    },
    {
      title: t('stats.cancellationRequests'),
      value: stats.photoshoots.cancellationRequests,
      href: `/${locale}/dashboard/photoshoots?filter=cancellation`,
      color: 'bg-red-50 border-red-200',
    },
  ] : [];

  return (
    <div>
      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-bg-secondary animate-pulse h-24" />
            ))}
          </>
        ) : (
          orgCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`p-4 rounded-lg border ${card.color} hover:shadow-md transition-shadow`}
            >
              <p className="text-sm text-text-secondary mb-1">{card.title}</p>
              <p className="text-2xl font-medium">{card.value}</p>
              <p className="text-xs text-text-muted mt-1">{card.subtitle}</p>
            </Link>
          ))
        )}
      </div>

      {/* Detail Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {!loading && detailCards.map((card) => {
          const Wrapper = card.href ? Link : 'div';
          const wrapperProps = card.href ? { href: card.href } : {};
          return (
            <Wrapper
              key={card.title}
              {...wrapperProps}
              className={`p-4 rounded-lg border ${card.color} ${card.href ? 'hover:shadow-md transition-shadow' : ''}`}
            >
              <p className="text-sm text-text-secondary mb-1">{card.title}</p>
              <p className="text-2xl font-medium">{card.value}</p>
            </Wrapper>
          );
        })}
      </div>

      {/* Quick Actions */}
      <h3 className="text-md font-medium mb-4">{t('overview.quickActions')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/${locale}/dashboard/photoshoots`}
          className="p-4 border border-border rounded-lg hover:border-accent transition-colors"
        >
          <h4 className="font-medium mb-1">{t('actions.managePhotoshoots')}</h4>
          <p className="text-sm text-text-secondary">{t('actions.managePhotoshootsDesc')}</p>
        </Link>
        <Link
          href={`/${locale}/dashboard/users`}
          className="p-4 border border-border rounded-lg hover:border-accent transition-colors"
        >
          <h4 className="font-medium mb-1">{t('actions.manageUsers')}</h4>
          <p className="text-sm text-text-secondary">{t('actions.manageUsersDesc')}</p>
        </Link>
        <Link
          href={`/${locale}/dashboard/settings`}
          className="p-4 border border-border rounded-lg hover:border-accent transition-colors"
        >
          <h4 className="font-medium mb-1">{t('actions.formSettings')}</h4>
          <p className="text-sm text-text-secondary">{t('actions.formSettingsDesc')}</p>
        </Link>
      </div>
    </div>
  );
}
