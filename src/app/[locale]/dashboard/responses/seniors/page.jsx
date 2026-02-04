'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 10;

export default function ResponsesSeniorsPage() {
  const t = useTranslations('dashboard.responses');
  const tc = useTranslations('dashboard.responses.common');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/responses/seniors');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching senior responses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data.seniors;
    const q = search.toLowerCase();
    return data.seniors.filter(bio => {
      const name = [bio.first_name, bio.last_name].filter(Boolean).join(' ').toLowerCase();
      return name.includes(q) || bio.email?.toLowerCase().includes(q) || bio.major?.toLowerCase().includes(q);
    });
  }, [data, search]);

  useEffect(() => { setPage(0); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/responses/export/senior-bios');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'senior-bios.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <p className="text-text-secondary">{tc('loading')}</p>;
  if (!data) return <p className="text-text-secondary">{tc('noData')}</p>;

  const { stats } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-medium">{t('seniors.title')}</h2>
        <span className="text-sm text-text-secondary">({stats.total} {t('seniors.totalBios').toLowerCase()})</span>
      </div>

      {/* Search + Pagination */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or major..."
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
          <span className="text-sm text-text-muted px-2 whitespace-nowrap">
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

      <div className="border border-border rounded-lg overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-2 pl-3 font-medium w-8"></th>
              <th className="text-left p-2 font-medium">{t('seniors.name')}</th>
              <th className="text-left p-2 font-medium">{t('seniors.major')}</th>
              <th className="text-left p-2 font-medium">{t('seniors.minor')}</th>
              <th className="text-left p-2 font-medium">{t('seniors.secondMajor')}</th>
              <th className="text-left p-2 font-medium">{t('seniors.quote')}</th>
              <th className="text-left p-2 pr-3 font-medium">{t('seniors.achievements')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((bio) => {
              const isExpanded = expandedId === bio.id;
              return (
                <tr
                  key={bio.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-bg-secondary/50"
                  onClick={() => setExpandedId(isExpanded ? null : bio.id)}
                >
                  <td className="p-2 pl-3 text-text-secondary text-xs select-none">{isExpanded ? '▼' : '▶'}</td>
                  <td className="p-2 whitespace-nowrap">{[bio.first_name, bio.last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td className="p-2">{bio.major || '—'}</td>
                  <td className="p-2">{bio.minor || '—'}</td>
                  <td className="p-2">{bio.second_major || '—'}</td>
                  <td className={`p-2 ${isExpanded ? '' : 'max-w-[200px] truncate'}`}>{bio.quote || '—'}</td>
                  <td className={`p-2 pr-3 ${isExpanded ? '' : 'max-w-[200px] truncate'}`}>{bio.achievements || '—'}</td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-center text-text-secondary">{tc('noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {exporting ? tc('exporting') : t('seniors.exportBios')}
        </button>
      </div>
    </div>
  );
}
