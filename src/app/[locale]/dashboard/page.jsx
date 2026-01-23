'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const [stats, setStats] = useState({
    pendingClubs: 0,
    pendingRequests: 0,
    upcomingPhotoshoots: 0,
    cancellationRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch pending clubs
        const clubsRes = await fetch('/api/admin/clubs?status=pending');
        const clubsData = await clubsRes.json();

        // Fetch pending promotion requests
        const requestsRes = await fetch('/api/admin/promotion-requests?status=pending');
        const requestsData = await requestsRes.json();

        // Fetch photoshoot times
        const timesRes = await fetch('/api/admin/photoshoot-times');
        const timesData = await timesRes.json();

        // Fetch cancellation requests
        const cancelRes = await fetch('/api/admin/photoshoot-times?cancellation_requested=true');
        const cancelData = await cancelRes.json();

        setStats({
          pendingClubs: clubsData.clubs?.length || 0,
          pendingRequests: requestsData.requests?.length || 0,
          upcomingPhotoshoots: timesData.times?.filter(t => t.living_group_id)?.length || 0,
          cancellationRequests: cancelData.times?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: t('stats.pendingClubs'),
      value: stats.pendingClubs,
      href: `/${locale}/dashboard/clubs?status=pending`,
      color: 'bg-yellow-50 border-yellow-200',
    },
    {
      title: t('stats.pendingRequests'),
      value: stats.pendingRequests,
      href: `/${locale}/dashboard/users`,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: t('stats.upcomingPhotoshoots'),
      value: stats.upcomingPhotoshoots,
      href: `/${locale}/dashboard/photoshoots`,
      color: 'bg-green-50 border-green-200',
    },
    {
      title: t('stats.cancellationRequests'),
      value: stats.cancellationRequests,
      href: `/${locale}/dashboard/photoshoots?filter=cancellation`,
      color: 'bg-red-50 border-red-200',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-medium mb-6">{t('overview.title')}</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`p-4 rounded-lg border ${card.color} hover:shadow-md transition-shadow`}
          >
            <p className="text-sm text-text-secondary mb-1">{card.title}</p>
            <p className="text-2xl font-medium">
              {loading ? '...' : card.value}
            </p>
          </Link>
        ))}
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
          href={`/${locale}/dashboard/clubs`}
          className="p-4 border border-border rounded-lg hover:border-accent transition-colors"
        >
          <h4 className="font-medium mb-1">{t('actions.reviewClubs')}</h4>
          <p className="text-sm text-text-secondary">{t('actions.reviewClubsDesc')}</p>
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
