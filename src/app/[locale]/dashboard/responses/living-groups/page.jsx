'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { downloadImagesAsZip } from '../../../../../lib/utils/downloadImages';

const PAGE_SIZE = 10;

export default function ResponsesLivingGroupsPage() {
  const t = useTranslations('dashboard.responses');
  const tc = useTranslations('dashboard.responses.common');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedLGs, setExpandedLGs] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/responses/living-groups');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching LG responses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data.livingGroups;
    const q = search.toLowerCase();
    return data.livingGroups.filter(lg => lg.name?.toLowerCase().includes(q));
  }, [data, search]);

  useEffect(() => { setPage(0); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/responses/export/lg-members');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lg-members.csv';
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
      await downloadImagesAsZip('living-group-images', 'living-group-images.zip');
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedLGs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) return <p className="text-text-secondary">{tc('loading')}</p>;
  if (!data) return <p className="text-text-secondary">{tc('noData')}</p>;

  const { stats, bucketImageCount } = data;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t('livingGroups.title')}</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: t('livingGroups.totalLGs'), value: stats.total },
          { label: t('livingGroups.withBookings'), value: stats.withBookings },
          { label: t('livingGroups.totalMembers'), value: stats.totalMembers },
        ].map((card) => (
          <div key={card.label} className="p-4 rounded-lg border border-border bg-bg-secondary">
            <p className="text-sm text-text-secondary">{card.label}</p>
            <p className="text-2xl font-medium">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Pagination */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search living groups..."
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

      <div className="border border-border rounded-lg overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-3 font-medium">{t('livingGroups.lgName')}</th>
              <th className="text-center p-3 font-medium">{t('livingGroups.type')}</th>
              <th className="text-center p-3 font-medium">{t('livingGroups.sections')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((lg) => (
              <React.Fragment key={lg.id}>
                <tr className={`border-b border-border ${lg.sections.length > 0 ? 'cursor-pointer hover:bg-bg-secondary/50' : ''}`} onClick={() => lg.sections.length > 0 && toggleExpand(lg.id)}>
                  <td className="p-3">
                    {lg.sections.length > 0 && <span className="mr-2">{expandedLGs.includes(lg.id) ? '▼' : '▶'}</span>}
                    {lg.name}
                  </td>
                  <td className="p-3 text-center">{lg.type}</td>
                  <td className="p-3 text-center">{lg.sections.length} sections · {lg.totalMembers} members</td>
                </tr>
                {expandedLGs.includes(lg.id) && lg.sections.map((section) => (
                  <tr key={`${lg.id}-${section.name}`} className="border-b border-border bg-bg-secondary/30">
                    <td className="p-3 pl-10">{section.name}</td>
                    <td className="p-3 text-center">{section.hasImage ? tc('yes') : tc('no')}</td>
                    <td className="p-3 text-center">{section.memberCount}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={3} className="p-3 text-center text-text-secondary">{tc('noData')}</td></tr>
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
          {exporting ? tc('exporting') : t('livingGroups.exportMembers')}
        </button>
        <button
          onClick={handleDownloadImages}
          disabled={downloading}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {downloading ? tc('downloading') : t('livingGroups.downloadImages')}
        </button>
        <span className="text-sm text-text-secondary">
          {tc('imageCount', { count: bucketImageCount })}
        </span>
      </div>
    </div>
  );
}
