'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 10;

export default function SportsPage() {
  const t = useTranslations('dashboard.sports');
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchSports();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
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

  const totalPages = Math.ceil(sports.length / PAGE_SIZE);
  const paginatedSports = sports.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Search + Pagination Arrows */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg w-full max-w-sm text-sm"
        />
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            ←
          </button>
          <span className="text-sm text-text-muted px-2">
            {page + 1} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            →
          </button>
        </div>
      </div>

      {/* Sports List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : sports.length === 0 ? (
        <p className="text-text-secondary">{t('noSports')}</p>
      ) : (
        <div className="space-y-2">
          {paginatedSports.map((sport) => (
            <div
              key={sport.id}
              className="px-4 py-3 border border-border rounded-lg bg-white"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{sport.name}</span>
                {sport.has_gender_teams && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {t('genderTeams')}
                  </span>
                )}
                <span className="text-text-muted">
                  ({sport.memberCount || 0})
                </span>
                {sport.user?.email && (
                  <span className="text-text-secondary ml-auto">{sport.user.email}</span>
                )}
              </div>

              {/* Images */}
              {[
                sport.candid_image_1, sport.candid_image_2, sport.candid_image_3,
                sport.mens_candid_image_1, sport.mens_candid_image_2, sport.mens_candid_image_3,
                sport.womens_candid_image_1, sport.womens_candid_image_2, sport.womens_candid_image_3,
              ].filter(Boolean).length > 0 && (
                <div className="flex gap-2 mt-2">
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
                        className="w-16 h-16 object-cover rounded"
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
