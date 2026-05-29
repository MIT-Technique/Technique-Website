'use client';

import { useEffect, useState, useMemo } from 'react';
const PAGE_SIZE = 10;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function InquiriesYearbookRequestsPage() {


  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/inquiries/yearbook-requests');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching yearbook requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!data?.requests) return [];
    if (!search) return data.requests;
    const q = search.toLowerCase();
    return data.requests.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q)
    );
  }, [data, search]);

  useEffect(() => { setPage(0); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/inquiries/yearbook-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Status update error:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
    });
  };

  if (loading) return <p className="text-text-secondary">{"Loading..."}</p>;
  if (!data) return <p className="text-text-secondary">{"No data found"}</p>;

  const { stats } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-medium">{"Yearbook Requests"}</h2>
        <span className="text-sm text-text-secondary">({stats.total} total)</span>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { key: 'pending', label: "Pending", count: stats.pending },
          { key: 'fulfilled', label: "Fulfilled", count: stats.fulfilled },
        ].map(({ key, label, count }) => (
          <div key={key} className="px-3 py-1.5 rounded-lg border border-border bg-bg-secondary flex items-center gap-2">
            <span className="text-xs text-text-secondary">{label}</span>
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>

      {/* Search + Pagination */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
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
              <th className="text-left p-2 font-medium">{"Name"}</th>
              <th className="text-left p-2 font-medium">{"Email"}</th>
              <th className="text-left p-2 font-medium">{"Source"}</th>
              <th className="text-left p-2 font-medium">{"Year"}</th>
              <th className="text-left p-2 font-medium">{"Status"}</th>
              <th className="text-left p-2 pr-3 font-medium">{"Submitted"}</th>
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
                  <td className="p-2 whitespace-nowrap">{r.name}</td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.source === 'parent' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {r.source === 'parent' ? "Parent" : "Alumni"}
                    </span>
                  </td>
                  <td className="p-2">{r.year_requested}</td>
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={r.status}
                      disabled={updatingId === r.id}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[r.status] || ''} ${updatingId === r.id ? 'opacity-50' : ''}`}
                    >
                      <option value="pending">{"Pending"}</option>
                      <option value="fulfilled">{"Fulfilled"}</option>
                      <option value="cancelled">{"Cancelled"}</option>
                    </select>
                  </td>
                  <td className="p-2 pr-3 whitespace-nowrap">{formatDate(r.created_at)}</td>
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
                      {r.student_name && <div><span className="text-text-secondary">{"Student Name"}:</span> {r.student_name}</div>}
                      {r.graduation_year && <div><span className="text-text-secondary">{"Graduation Year"}:</span> {r.graduation_year}</div>}
                      {r.shipping_address && (
                        <div className="col-span-2">
                          <span className="text-text-secondary">{"Shipping Address"}:</span>{' '}
                          {[r.shipping_address, r.shipping_city, r.shipping_state, r.shipping_zip].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {r.message && <div className="col-span-2"><span className="text-text-secondary">{"Message"}:</span> {r.message}</div>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-center text-text-secondary">{"No yearbook requests found"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
