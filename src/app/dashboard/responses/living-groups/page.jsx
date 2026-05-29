'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { downloadImagesAsZip } from '@/lib/utils/downloadImages';

const PAGE_SIZE = 10;

export default function ResponsesLivingGroupsPage() {


  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expandedLGs, setExpandedLGs] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

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

  useEffect(() => {
    fetchData();
  }, []);

  async function handleToggleBook(lgId, book) {
    try {
      await fetch('/api/admin/responses/living-groups/book', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livingGroupId: lgId, manuallyBooked: book }),
      });
      await fetchData();
    } catch (error) {
      console.error('Error toggling booking:', error);
    }
  }

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

  if (loading) return <p className="text-text-secondary">{"Loading..."}</p>;
  if (!data) return <p className="text-text-secondary">{"No data found"}</p>;

  const { stats, bucketImageCount } = data;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">{"Living Group Responses"}</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { label: "Total Living Groups", value: stats.total },
          { label: "With Photoshoot Bookings", value: stats.withBookings },
          { label: "Total Members", value: stats.totalMembers },
        ].map((card) => (
          <div key={card.label} className="px-3 py-2 rounded-lg border border-border bg-bg-secondary">
            <p className="text-xs text-text-secondary">{card.label}</p>
            <p className="text-lg font-medium">{card.value}</p>
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
              <th className="text-left p-3 font-medium">{"LG Name"}</th>
              <th className="text-center p-3 font-medium">{"Type"}</th>
              <th className="text-center p-3 font-medium">{"Candids"}</th>
              <th className="text-center p-3 font-medium">{"Booked"}</th>
              <th className="text-center p-3 font-medium">{"Members"}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((lg) => (
              <React.Fragment key={lg.id}>
                <tr className={`border-b border-border ${lg.type !== 'fsilg' && lg.sections?.length > 0 ? 'cursor-pointer hover:bg-bg-secondary/50' : ''}`} onClick={() => lg.type !== 'fsilg' && lg.sections?.length > 0 && toggleExpand(lg.id)}>
                  <td className="p-3">
                    {lg.type !== 'fsilg' && lg.sections?.length > 0 && <span className="mr-2">{expandedLGs.includes(lg.id) ? '▼' : '▶'}</span>}
                    {lg.name}
                  </td>
                  <td className="p-3 text-center">{lg.type}</td>
                  <td className="p-3 text-center">{lg.candidCount || 0}</td>
                  <td className="p-3 text-center">
                    {lg.sections?.some(s => s.hasTimeAssignment) ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">{"Auto"}</span>
                    ) : lg.manuallyBooked ? (
                      <button onClick={(e) => { e.stopPropagation(); handleToggleBook(lg.id, false); }}
                        className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 inline-flex items-center gap-1"
                        title={lg.manuallyBookedByName || ''}>
                        &#10003; {lg.manuallyBookedByName || "Manual"}
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); handleToggleBook(lg.id, true); }}
                        className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 hover:bg-red-200">
                        {"✗"}
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {lg.type === 'fsilg'
                      ? `${lg.totalMembers} members`
                      : `${lg.sections?.length || 0} sections · ${lg.totalMembers} members`}
                  </td>
                </tr>
                {lg.type !== 'fsilg' && expandedLGs.includes(lg.id) && (lg.sections || []).map((section) => (
                  <tr key={`${lg.id}-${section.name}`} className="border-b border-border bg-bg-secondary/30">
                    <td className="p-3 pl-10">{section.name}</td>
                    <td className="p-3 text-center">{section.hasImage ? "✓" : "✗"}</td>
                    <td className="p-3 text-center">{section.hasImage ? '1' : '0'}</td>
                    <td className="p-3 text-center">
                      {section.hasTimeAssignment ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">{"✓"}</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">{"✗"}</span>
                      )}
                    </td>
                    <td className="p-3 text-center">{section.memberCount}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={5} className="p-3 text-center text-text-secondary">{"No data found"}</td></tr>
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
          {exporting ? "Exporting..." : "Export LG Members CSV"}
        </button>
        <button
          onClick={handleDownloadImages}
          disabled={downloading}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
        >
          {downloading ? "Downloading..." : "Download LG Images"}
        </button>
        <span className="text-sm text-text-secondary">
          {`${bucketImageCount} images`}
        </span>
      </div>
    </div>
  );
}
