'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 10;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  claimed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function InquiriesHireRequestsPage() {
  const t = useTranslations('dashboard.inquiries.hireRequests');
  const tc = useTranslations('dashboard.inquiries.common');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/inquiries/hire-requests');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching hire requests:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!data?.requests) return [];
    if (!search) return data.requests;
    const q = search.toLowerCase();
    return data.requests.filter(r =>
      r.event_name?.toLowerCase().includes(q) ||
      r.requester_name?.toLowerCase().includes(q) ||
      r.requester_email?.toLowerCase().includes(q)
    );
  }, [data, search]);

  useEffect(() => { setPage(0); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
    }) + ' EST';
  };

  if (loading) return <p className="text-text-secondary">{tc('loading')}</p>;
  if (!data) return <p className="text-text-secondary">{tc('noData')}</p>;

  const { stats } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-medium">{t('title')}</h2>
        <span className="text-sm text-text-secondary">({stats.total} total)</span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-4">
        {['pending', 'claimed', 'completed', 'cancelled'].map((s) => (
          <div key={s} className="px-3 py-1.5 rounded-lg border border-border bg-bg-secondary flex items-center gap-2">
            <span className="text-xs text-text-secondary">{t(`status${s.charAt(0).toUpperCase() + s.slice(1)}`)}</span>
            <span className="text-sm font-medium">{stats[s]}</span>
          </div>
        ))}
      </div>

      {/* Search + Pagination */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by event or requester..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg w-full max-w-sm text-sm"
        />
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary">←</button>
          <span className="text-sm text-text-muted px-2 whitespace-nowrap">{page + 1} / {totalPages || 1}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary">→</button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left p-2 pl-3 font-medium w-8"></th>
              <th className="text-left p-2 font-medium">{t('eventName')}</th>
              <th className="text-left p-2 font-medium">{t('requester')}</th>
              <th className="text-left p-2 font-medium">{t('date')}</th>
              <th className="text-left p-2 font-medium">{t('time')}</th>
              <th className="text-left p-2 font-medium">{t('status')}</th>
              <th className="text-left p-2 pr-3 font-medium">{t('cost')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => {
              const isExpanded = expandedId === r.id;
              return (
                <tr key={r.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-bg-secondary/50"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                  <td className="p-2 pl-3 text-text-secondary text-xs select-none">{isExpanded ? '▼' : '▶'}</td>
                  <td className="p-2">{r.event_name || '—'}</td>
                  <td className="p-2 whitespace-nowrap">{r.requester_name}</td>
                  <td className="p-2 whitespace-nowrap">{formatDate(r.event_date)}</td>
                  <td className="p-2 whitespace-nowrap">{formatTime(r.start_time)} – {formatTime(r.end_time)}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>
                      {t(`status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`)}
                    </span>
                  </td>
                  <td className="p-2 pr-3">${r.total_cost?.toFixed(2) || '—'}</td>
                </tr>
              );
            })}
            {paginated.map((r) => {
              const isExpanded = expandedId === r.id;
              if (!isExpanded) return null;
              return (
                <tr key={`${r.id}-details`} className="border-b border-border last:border-0 bg-bg-secondary/30">
                  <td></td>
                  <td colSpan={6} className="p-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-lg">
                      <div><span className="text-text-secondary">{t('type')}:</span> <span className="capitalize">{r.event_type}</span></div>
                      <div><span className="text-text-secondary">{t('confirmationCode')}:</span> {r.confirmation_code}</div>
                      {r.location && <div className="col-span-2"><span className="text-text-secondary">{t('location')}:</span> {r.location}</div>}
                      {r.description && <div className="col-span-2"><span className="text-text-secondary">{t('description')}:</span> {r.description}</div>}
                      {r.claimed_by && <div><span className="text-text-secondary">{t('claimedBy')}:</span> {r.claimed_by}</div>}
                      {r.claimed_at && <div><span className="text-text-secondary">Claimed:</span> {formatDateTime(r.claimed_at)}</div>}
                      <div><span className="text-text-secondary">Requested:</span> {formatDateTime(r.created_at)}</div>
                      <div><span className="text-text-secondary">Rate:</span> ${r.hourly_rate}/hr</div>
                      <div><span className="text-text-secondary">Duration:</span> {r.duration_hours}h</div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-center text-text-secondary">{t('noRequests')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
