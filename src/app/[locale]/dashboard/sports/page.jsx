'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function SportsPage() {
  const t = useTranslations('dashboard.sports');
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSports();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSports();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function fetchSports() {
    try {
      setLoading(true);
      let url = '/api/admin/sports';
      if (search) url += `?search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      setSports(data.sports || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg w-full max-w-sm text-sm"
        />
      </div>

      {/* Sports List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : sports.length === 0 ? (
        <p className="text-text-secondary">{t('noSports')}</p>
      ) : (
        <div className="space-y-4">
          {sports.map((sport) => (
            <div
              key={sport.id}
              className="p-4 border border-border rounded-lg bg-white"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sport.name}</span>
                  {sport.has_gender_teams && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {t('genderTeams')}
                    </span>
                  )}
                </div>
                <span className="text-sm text-text-muted">
                  {t('memberCount', { count: sport.memberCount || 0 })}
                </span>
              </div>
              {sport.description && (
                <p className="text-sm text-text-secondary mt-2">{sport.description}</p>
              )}
              <p className="text-sm text-text-muted mt-1">
                {sport.user?.email}
              </p>

              {/* Images */}
              {[
                sport.candid_image_1, sport.candid_image_2, sport.candid_image_3,
                sport.mens_candid_image_1, sport.mens_candid_image_2, sport.mens_candid_image_3,
                sport.womens_candid_image_1, sport.womens_candid_image_2, sport.womens_candid_image_3,
              ].filter(Boolean).length > 0 && (
                <div className="flex gap-2 mt-3">
                  {[
                    sport.candid_image_1, sport.candid_image_2, sport.candid_image_3,
                    sport.mens_candid_image_1, sport.mens_candid_image_2, sport.mens_candid_image_3,
                    sport.womens_candid_image_1, sport.womens_candid_image_2, sport.womens_candid_image_3,
                  ]
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Sport image ${i + 1}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
