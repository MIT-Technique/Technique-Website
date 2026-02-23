'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { downloadImagesAsZip } from '../../../../../lib/utils/downloadImages';

const PAGE_SIZE = 10;

export default function ResponsesSportsPage() {
  const t = useTranslations('dashboard.responses');
  const tc = useTranslations('dashboard.responses.common');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const [expandedSports, setExpandedSports] = useState([]);

  const fetchData = async (filterValue) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterValue && filterValue !== 'all') params.set('filter', filterValue);
      const res = await fetch(`/api/admin/responses/sports?${params}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching sports responses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(filter);
  }, [filter]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
    setExpandedSports([]);
  }, [filter]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data.sports;
    const q = search.toLowerCase();
    return data.sports.filter(s => s.name?.toLowerCase().includes(q));
  }, [data, search]);

  useEffect(() => { setPage(0); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleExpand = (id) => {
    setExpandedSports(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/responses/export/sport-members');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sport-members.csv';
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
      await downloadImagesAsZip('sports-images', 'sports-images.zip');
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <p className="text-text-secondary">{tc('loading')}</p>;
  if (!data) return <p className="text-text-secondary">{tc('noData')}</p>;

  const { stats, bucketImageCount } = data;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{t('sports.title')}</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { label: t('sports.totalTeams'), value: stats.total },
          { label: t('sports.withAchievements'), value: stats.withAchievements },
          { label: t('sports.withMembers'), value: stats.withMembers },
          { label: t('sports.totalMembers'), value: stats.totalMembers },
          { label: t('sports.totalCoaches'), value: stats.totalCoaches },
        ].map((card) => (
          <div key={card.label} className="px-3 py-2 rounded-lg border border-border bg-bg-secondary">
            <p className="text-xs text-text-secondary">{card.label}</p>
            <p className="text-lg font-medium">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter + Pagination */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search sports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg w-full max-w-sm text-sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-white"
        >
          <option value="all">{t('sports.filterAll')}</option>
          <option value="filled">{t('sports.filterFilled')}</option>
          <option value="not_filled">{t('sports.filterNotFilled')}</option>
        </select>
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
              <th className="text-left p-3 font-medium">{t('sports.teamName')}</th>
              <th className="text-center p-3 font-medium">{t('sports.description')}</th>
              <th className="text-center p-3 font-medium">{t('sports.achievement')}</th>
              <th className="text-center p-3 font-medium">{t('clubs.images')}</th>
              <th className="text-center p-3 font-medium">{t('clubs.members')}</th>
              <th className="text-center p-3 font-medium">{t('sports.coaches')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((sport) => (
              <React.Fragment key={sport.id}>
                <tr
                  className="border-b border-border cursor-pointer hover:bg-bg-secondary/50"
                  onClick={() => toggleExpand(sport.id)}
                >
                  <td className="p-3">
                    <span className="mr-2 text-text-muted">{expandedSports.includes(sport.id) ? '▼' : '▶'}</span>
                    {sport.name}
                  </td>
                  <td className="p-3 text-center">{sport.hasDescription ? tc('yes') : tc('no')}</td>
                  {sport.hasGenderTeams ? (
                    <>
                      <td className="p-3 text-center text-xs">
                        M: {sport.mensHasAchievement ? tc('yes') : tc('no')} / W: {sport.womensHasAchievement ? tc('yes') : tc('no')}
                      </td>
                      <td className="p-3 text-center text-xs">
                        M: {sport.mensImageCount} / W: {sport.womensImageCount}
                      </td>
                      <td className="p-3 text-center text-xs">
                        M: {sport.mensMembers} / W: {sport.womensMembers}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-center">{sport.hasAchievement ? tc('yes') : tc('no')}</td>
                      <td className="p-3 text-center">{sport.imageCount}</td>
                      <td className="p-3 text-center">{sport.memberCount}</td>
                    </>
                  )}
                  <td className="p-3 text-center">{sport.coachCount}</td>
                </tr>
                {expandedSports.includes(sport.id) && (
                  <tr className="border-b border-border bg-bg-secondary/30">
                    <td colSpan={6} className="p-4 pl-10">
                      <div className="space-y-3">
                        {/* Email */}
                        <div>
                          <span className="text-text-secondary text-sm">{t('sports.email')}: </span>
                          <span className="text-sm">{sport.email || t('sports.noEmail')}</span>
                        </div>
                        {/* Image previews */}
                        {sport.hasGenderTeams ? (
                          <>
                            {sport.mensImageUrls && sport.mensImageUrls.length > 0 && (
                              <div>
                                <span className="text-text-secondary text-sm block mb-2">{t('sports.mensImages')}:</span>
                                <div className="flex gap-2">
                                  {sport.mensImageUrls.map((url, i) => (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      key={i}
                                      src={url}
                                      alt={`Men's image ${i + 1}`}
                                      className="w-16 h-16 object-cover rounded border border-border"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {sport.womensImageUrls && sport.womensImageUrls.length > 0 && (
                              <div>
                                <span className="text-text-secondary text-sm block mb-2">{t('sports.womensImages')}:</span>
                                <div className="flex gap-2">
                                  {sport.womensImageUrls.map((url, i) => (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      key={i}
                                      src={url}
                                      alt={`Women's image ${i + 1}`}
                                      className="w-16 h-16 object-cover rounded border border-border"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          sport.imageUrls && sport.imageUrls.length > 0 && (
                            <div>
                              <span className="text-text-secondary text-sm block mb-2">{t('sports.imagePreview')}:</span>
                              <div className="flex gap-2">
                                {sport.imageUrls.map((url, i) => (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    key={i}
                                    src={url}
                                    alt={`Sport image ${i + 1}`}
                                    className="w-16 h-16 object-cover rounded border border-border"
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={6} className="p-3 text-center text-text-secondary">{tc('noData')}</td></tr>
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
          {exporting ? tc('exporting') : t('sports.exportMembers')}
        </button>
        <button
          onClick={handleDownloadImages}
          disabled={downloading}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {downloading ? tc('downloading') : t('sports.downloadImages')}
        </button>
        <span className="text-sm text-text-secondary">
          {tc('imageCount', { count: bucketImageCount })}
        </span>
      </div>
    </div>
  );
}
