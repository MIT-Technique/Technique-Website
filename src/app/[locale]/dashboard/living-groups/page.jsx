'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

export default function LivingGroupsPage() {
  const t = useTranslations('dashboard.livingGroups');
  const [livingGroups, setLivingGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLivingGroups();
  }, []);

  async function fetchLivingGroups() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/living-groups');
      const data = await res.json();
      setLivingGroups(data.livingGroups || []);
    } catch (error) {
      console.error('Error fetching living groups:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search) return livingGroups;
    const q = search.toLowerCase();
    return livingGroups.filter(lg =>
      lg.name?.toLowerCase().includes(q) ||
      lg.user?.email?.toLowerCase().includes(q)
    );
  }, [livingGroups, search]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg w-full max-w-sm text-sm"
        />
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-text-secondary">{t('noLivingGroups')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map((lg) => (
            <div
              key={lg.id}
              className="p-3 border border-border rounded-lg bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lg.name}</span>
                  {lg.living_group_type && (
                    <span className="text-xs px-2 py-0.5 bg-bg-secondary text-text-muted rounded leading-none">
                      {lg.living_group_type === 'fsilg' ? 'FSILG' : 'Dorm'}
                    </span>
                  )}
                </div>
                <span className="text-sm text-text-muted">{lg.user?.email}</span>
              </div>
              {lg.dorm_sections && lg.dorm_sections.length > 0 && (
                <p className="text-xs text-text-muted mt-1">
                  {lg.dorm_sections.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
