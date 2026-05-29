'use client';

import { useEffect, useState, useRef } from 'react';
const PAGE_SIZE = 10;

export default function ClubsPage() {


  const locale = 'en-US';
const [clubs, setClubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const fetchIdRef = useRef(0);

  // Leader requests state
  const [leaderRequests, setLeaderRequests] = useState([]);
  const [leaderRequestsLoading, setLeaderRequestsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Login key management state
  const [keyActionLoading, setKeyActionLoading] = useState(null); // userId being processed
  const [keyResult, setKeyResult] = useState(null); // { userId, loginKey } or { userId, sent: true }
  const [keyError, setKeyError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleResetKey(userId) {
    if (!confirm("Generate a new login password for this organization? The old password will stop working.")) return;
    setKeyActionLoading(userId);
    setKeyResult(null);
    setKeyError(null);
    try {
      const res = await fetch('/api/admin/org-login-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reset' }),
      });
      const data = await res.json();
      if (res.ok) {
        setKeyResult({ userId, loginKey: data.loginKey });
      } else {
        setKeyError(data.error);
      }
    } catch {
      setKeyError('Failed to reset key');
    } finally {
      setKeyActionLoading(null);
    }
  }

  async function handleSendKey(userId) {
    setKeyActionLoading(userId);
    setKeyError(null);
    try {
      const res = await fetch('/api/admin/org-login-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'send' }),
      });
      const data = await res.json();
      if (res.ok) {
        setKeyResult({ userId, sent: true });
        setTimeout(() => setKeyResult(r => r?.userId === userId && r?.sent ? null : r), 4000);
      } else {
        setKeyError(data.error);
        setTimeout(() => setKeyError(null), 4000);
      }
    } catch {
      setKeyError('Failed to send key');
    } finally {
      setKeyActionLoading(null);
    }
  }

  useEffect(() => {
    fetchLeaderRequests();
  }, []);

  async function fetchLeaderRequests() {
    try {
      setLeaderRequestsLoading(true);
      const res = await fetch('/api/admin/club-leader-requests');
      const data = await res.json();
      setLeaderRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching leader requests:', error);
    } finally {
      setLeaderRequestsLoading(false);
    }
  }

  async function handleLeaderAction(requestId, action) {
    setProcessingRequestId(requestId);
    try {
      const res = await fetch('/api/admin/club-leader-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action }),
      });

      if (res.ok) {
        fetchLeaderRequests();
      } else {
        const data = await res.json();
        console.error('Error processing leader request:', data.error);
      }
    } catch (error) {
      console.error('Error processing leader request:', error);
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function fetchClubs() {
    const id = ++fetchIdRef.current;
    try {
      setLoading(true);
      setClubs([]);
      setTotal(0);

      // Fetch first page quickly
      let url = `/api/admin/clubs?limit=${PAGE_SIZE}&offset=0`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (id !== fetchIdRef.current) return;

      setClubs(data.clubs || []);
      setTotal(data.total || 0);
      setLoading(false);

      // Fetch remaining in background
      const remaining = (data.total || 0) - PAGE_SIZE;
      if (remaining > 0) {
        setLoadingMore(true);
        let restUrl = `/api/admin/clubs?limit=${remaining}&offset=${PAGE_SIZE}`;
        if (search) restUrl += `&search=${encodeURIComponent(search)}`;

        const restRes = await fetch(restUrl);
        const restData = await restRes.json();
        if (id !== fetchIdRef.current) return;

        setClubs(prev => [...prev, ...(restData.clubs || [])]);
        setLoadingMore(false);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      if (id === fetchIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchClubs();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Initial fetch
  useEffect(() => {
    fetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(clubs.length / PAGE_SIZE);
  const totalPagesEstimate = Math.ceil(total / PAGE_SIZE);
  const displayTotalPages = loadingMore ? totalPagesEstimate : totalPages;
  const paginatedClubs = clubs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Leader Requests Section */}
      {leaderRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">{"Leader Promotion Requests"}</h2>
          <div className="space-y-3">
            {leaderRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {request.user?.name}
                    <span className="text-text-muted font-normal"> → {"leader of"} </span>
                    {request.club?.name || "Unnamed Club"}
                  </p>
                  <p className="text-text-secondary text-sm">{request.user?.email}</p>
                  <p className="text-text-muted text-xs">
                    {"Requested by"}: {request.requester?.name}
                    {' • '}
                    {new Date(request.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLeaderAction(request.id, 'approve')}
                    disabled={processingRequestId === request.id}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    {processingRequestId === request.id ? '...' : "Approve"}
                  </button>
                  <button
                    onClick={() => handleLeaderAction(request.id, 'deny')}
                    disabled={processingRequestId === request.id}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    {processingRequestId === request.id ? '...' : "Deny"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Pagination Arrows */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder={"Search clubs..." || 'Search clubs...'}
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
            {page + 1} / {displayTotalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(displayTotalPages - 1, p + 1))}
            disabled={page >= displayTotalPages - 1 || (loadingMore && page >= totalPages - 1)}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            →
          </button>
        </div>
      </div>

      {/* Clubs List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : clubs.length === 0 ? (
        <p className="text-text-secondary">{"No clubs found"}</p>
      ) : (
        <div className="space-y-2">
          {paginatedClubs.map((club) => (
            <div
              key={club.id}
              className="px-4 py-3 border border-border rounded-lg bg-white"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{club.name || "Unnamed Club"}</span>
                <span className="text-text-muted">
                  ({club.manual_member_count || 0})
                </span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => handleSendKey(club.user_id)}
                    disabled={keyActionLoading === club.user_id}
                    className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {keyActionLoading === club.user_id ? "Sending..." : "Send Key"}
                  </button>
                  <button
                    onClick={() => handleResetKey(club.user_id)}
                    disabled={keyActionLoading === club.user_id}
                    className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                  >
                    {keyActionLoading === club.user_id ? "Resetting..." : "Reset Key"}
                  </button>
                  {club.email && (
                    <span className="text-text-secondary">{club.email}</span>
                  )}
                </div>
              </div>

              {/* Key result / error */}
              {keyResult?.userId === club.user_id && keyResult.loginKey && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                  <span className="text-xs text-green-800 font-medium">{"New Login Password"}:</span>
                  <code className="text-sm bg-white px-2 py-0.5 rounded border border-green-300 select-all">{keyResult.loginKey}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(keyResult.loginKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
              {keyResult?.userId === club.user_id && keyResult.sent && (
                <p className="mt-1 text-xs text-green-700">{"Login credentials sent via email."}</p>
              )}
              {keyError && keyActionLoading === null && (
                <p className="mt-1 text-xs text-red-600">{keyError}</p>
              )}

              {/* Images */}
              {[club.candid_image_1, club.candid_image_2, club.candid_image_3].filter(Boolean).length > 0 && (
                <div className="flex gap-2 mt-2">
                  {[club.candid_image_1, club.candid_image_2, club.candid_image_3]
                    .filter(Boolean)
                    .map((img, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={i}
                        src={img}
                        alt={`Club image ${i + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ))}
                </div>
              )}
            </div>
          ))}
          {loadingMore && page >= totalPages - 1 && (
            <p className="text-text-muted text-sm text-center py-2">Loading more...</p>
          )}
        </div>
      )}
    </div>
  );
}
