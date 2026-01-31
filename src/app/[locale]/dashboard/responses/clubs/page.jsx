'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { downloadImagesAsZip } from '../../../../../lib/utils/downloadImages';

const PAGE_SIZE = 10;

export default function ResponsesClubsPage() {
  const t = useTranslations('dashboard.responses');
  const tc = useTranslations('dashboard.responses.common');
  const [clubs, setClubs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [bucketImageCount, setBucketImageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchPage = useCallback(async (p, s) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (s) params.set('search', s);
      const res = await fetch(`/api/admin/responses/clubs?${params}`);
      const json = await res.json();
      setClubs(json.clubs || []);
      setTotalCount(json.totalCount || 0);
      if (json.stats) {
        setStats(json.stats);
        setBucketImageCount(json.bucketImageCount || 0);
      }
    } catch (error) {
      console.error('Error fetching club responses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchPage(0, ''); }, [fetchPage]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Fetch on page or debounced search change (skip initial)
  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) { isInitial.current = false; return; }
    fetchPage(page, debouncedSearch);
  }, [page, debouncedSearch, fetchPage]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/responses/export/club-members');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'club-members.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadImages = async () => {
    setDownloading(true);
    try {
      await downloadImagesAsZip('club-images', 'club-images.zip');
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t('clubs.title')}</h2>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: t('clubs.totalClubs'), value: stats.total },
            { label: t('clubs.withDescriptions'), value: stats.withDescriptions },
            { label: t('clubs.withMembers'), value: stats.withMembers },
            { label: t('clubs.totalMembers'), value: stats.totalMembers },
          ].map((card) => (
            <div key={card.label} className="p-4 rounded-lg border border-border bg-bg-secondary">
              <p className="text-sm text-text-secondary">{card.label}</p>
              <p className="text-2xl font-medium">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Pagination */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search clubs..."
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

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto mb-6" style={{ minHeight: 41 * 11 + 41 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-3 font-medium">{t('clubs.clubName')}</th>
              <th className="text-center p-3 font-medium">{t('clubs.description')}</th>
              <th className="text-center p-3 font-medium">{t('clubs.images')}</th>
              <th className="text-center p-3 font-medium">{t('clubs.members')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-3 text-center text-text-secondary">{tc('loading')}</td></tr>
            ) : clubs.length === 0 ? (
              <tr><td colSpan={4} className="p-3 text-center text-text-secondary">{tc('noData')}</td></tr>
            ) : clubs.map((club) => (
              <tr key={club.id} className="border-b border-border last:border-0">
                <td className="p-3">{club.name || 'Unnamed'}</td>
                <td className="p-3 text-center">{club.hasDescription ? tc('yes') : tc('no')}</td>
                <td className="p-3 text-center">{club.imageCount}</td>
                <td className="p-3 text-center">{club.memberCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Section */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {exporting ? tc('exporting') : t('clubs.exportMembers')}
        </button>
        <button
          onClick={handleDownloadImages}
          disabled={downloading}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {downloading ? tc('downloading') : t('clubs.downloadImages')}
        </button>
        <span className="text-sm text-text-secondary">
          {tc('imageCount', { count: bucketImageCount })}
        </span>
      </div>
    </div>
  );
}
