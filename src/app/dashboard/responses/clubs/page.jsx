'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { downloadImagesAsZip } from '@/lib/utils/downloadImages';

const PAGE_SIZE = 10;

export default function ResponsesClubsPage() {


  const [clubs, setClubs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [bucketImageCount, setBucketImageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const [expandedClubs, setExpandedClubs] = useState([]);
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchPage = useCallback(async (p, s, f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (s) params.set('search', s);
      if (f && f !== 'all') params.set('filter', f);
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
  useEffect(() => { fetchPage(0, '', 'all'); }, [fetchPage]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Fetch on page, debounced search, or filter change (skip initial)
  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) { isInitial.current = false; return; }
    fetchPage(page, debouncedSearch, filter);
  }, [page, debouncedSearch, filter, fetchPage]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
    setExpandedClubs([]);
  }, [filter]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const toggleExpand = (id) => {
    setExpandedClubs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

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
      <h2 className="text-lg font-medium mb-4">{"Club Responses"}</h2>

      {/* Summary Cards */}
      {stats && (
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { label: "Total Clubs", value: stats.total },
            { label: "With Descriptions", value: stats.withDescriptions },
            { label: "Added Members", value: stats.withMembers },
            { label: "Total Members", value: stats.totalMembers },
          ].map((card) => (
            <div key={card.label} className="px-3 py-2 rounded-lg border border-border bg-bg-secondary">
              <p className="text-xs text-text-secondary">{card.label}</p>
              <p className="text-lg font-medium">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter + Pagination */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg w-full max-w-sm text-sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-white"
        >
          <option value="all">{"All Clubs"}</option>
          <option value="filled">{"Complete"}</option>
          <option value="not_filled">{"Incomplete"}</option>
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

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto mb-6" style={{ minHeight: 41 * 11 + 41 }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-3 font-medium">{"Club Name"}</th>
              <th className="text-center p-3 font-medium">{"Description?"}</th>
              <th className="text-center p-3 font-medium">{"Images"}</th>
              <th className="text-center p-3 font-medium">{"Members"}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-3 text-center text-text-secondary">{"Loading..."}</td></tr>
            ) : clubs.length === 0 ? (
              <tr><td colSpan={4} className="p-3 text-center text-text-secondary">{"No data found"}</td></tr>
            ) : clubs.map((club) => (
              <React.Fragment key={club.id}>
                <tr
                  className="border-b border-border cursor-pointer hover:bg-bg-secondary/50"
                  onClick={() => toggleExpand(club.id)}
                >
                  <td className="p-3">
                    <span className="mr-2 text-text-muted">{expandedClubs.includes(club.id) ? '▼' : '▶'}</span>
                    {club.name || 'Unnamed'}
                  </td>
                  <td className="p-3 text-center">{club.hasDescription ? "✓" : "✗"}</td>
                  <td className="p-3 text-center">{club.imageCount}</td>
                  <td className="p-3 text-center">{club.memberCount}</td>
                </tr>
                {expandedClubs.includes(club.id) && (
                  <tr className="border-b border-border bg-bg-secondary/30">
                    <td colSpan={4} className="p-4 pl-10">
                      <div className="space-y-3">
                        {/* Email */}
                        <div>
                          <span className="text-text-secondary text-sm">{"Email"}: </span>
                          <span className="text-sm">{club.email || "No email set"}</span>
                        </div>
                        {/* Image previews */}
                        {club.imageUrls && club.imageUrls.length > 0 && (
                          <div>
                            <span className="text-text-secondary text-sm block mb-2">{"Image Preview"}:</span>
                            <div className="flex gap-2">
                              {club.imageUrls.map((url, i) => (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  key={i}
                                  src={url}
                                  alt={`Club image ${i + 1}`}
                                  className="w-16 h-16 object-cover rounded border border-border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
          {exporting ? "Exporting..." : "Export Club Members CSV"}
        </button>
        <button
          onClick={handleDownloadImages}
          disabled={downloading}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {downloading ? "Downloading..." : "Download Club Images"}
        </button>
        <span className="text-sm text-text-secondary">
          {`${bucketImageCount} images`}
        </span>
      </div>
    </div>
  );
}
