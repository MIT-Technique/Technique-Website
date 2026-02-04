'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

const ITEMS_PER_PAGE = 5;

export default function LivingGroupsPage() {
  const t = useTranslations('dashboard.livingGroups');
  const [livingGroups, setLivingGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dormSearch, setDormSearch] = useState('');
  const [fsilgSearch, setFsilgSearch] = useState('');
  const [dormPage, setDormPage] = useState(1);
  const [fsilgPage, setFsilgPage] = useState(1);

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

  const allDorms = useMemo(() => livingGroups.filter(lg => lg.living_group_type !== 'fsilg'), [livingGroups]);
  const allFsilgs = useMemo(() => livingGroups.filter(lg => lg.living_group_type === 'fsilg'), [livingGroups]);

  const filteredDorms = useMemo(() => {
    if (!dormSearch) return allDorms;
    const q = dormSearch.toLowerCase();
    return allDorms.filter(lg =>
      lg.name?.toLowerCase().includes(q) ||
      lg.user?.email?.toLowerCase().includes(q)
    );
  }, [allDorms, dormSearch]);

  const filteredFsilgs = useMemo(() => {
    if (!fsilgSearch) return allFsilgs;
    const q = fsilgSearch.toLowerCase();
    return allFsilgs.filter(lg =>
      lg.name?.toLowerCase().includes(q) ||
      lg.user?.email?.toLowerCase().includes(q)
    );
  }, [allFsilgs, fsilgSearch]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setDormPage(1);
  }, [dormSearch]);

  useEffect(() => {
    setFsilgPage(1);
  }, [fsilgSearch]);

  const dormTotalPages = Math.ceil(filteredDorms.length / ITEMS_PER_PAGE);
  const fsilgTotalPages = Math.ceil(filteredFsilgs.length / ITEMS_PER_PAGE);

  const paginatedDorms = useMemo(() => {
    const start = (dormPage - 1) * ITEMS_PER_PAGE;
    return filteredDorms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDorms, dormPage]);

  const paginatedFsilgs = useMemo(() => {
    const start = (fsilgPage - 1) * ITEMS_PER_PAGE;
    return filteredFsilgs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFsilgs, fsilgPage]);

  const renderCard = (lg) => (
    <div
      key={lg.id}
      className="p-3 border border-border rounded-lg bg-white"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{lg.name}</span>
        <span className="text-sm text-text-muted">{lg.user?.email}</span>
      </div>
      {lg.dorm_sections && lg.dorm_sections.length > 0 && (
        <p className="text-xs text-text-muted mt-1">
          {lg.dorm_sections.join(', ')}
        </p>
      )}
    </div>
  );

  const renderColumn = (title, paginatedItems, search, setSearch, currentPage, totalPages, setPage, placeholder) => (
    <div className="flex-1 min-w-0">
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg flex-1 min-w-0 text-sm"
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            ←
          </button>
          <span className="text-sm text-text-muted px-2 whitespace-nowrap">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            →
          </button>
        </div>
      </div>
      {paginatedItems.length === 0 ? (
        <p className="text-text-secondary text-sm">{t('noResults')}</p>
      ) : (
        <div className="space-y-2">
          {paginatedItems.map(renderCard)}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <p className="text-text-secondary">Loading...</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {renderColumn(
        t('dorms'),
        paginatedDorms,
        dormSearch,
        setDormSearch,
        dormPage,
        dormTotalPages,
        setDormPage,
        t('searchDormsPlaceholder')
      )}
      {renderColumn(
        t('fsilgs'),
        paginatedFsilgs,
        fsilgSearch,
        setFsilgSearch,
        fsilgPage,
        fsilgTotalPages,
        setFsilgPage,
        t('searchFsilgsPlaceholder')
      )}
    </div>
  );
}
