'use client';

import { useEffect, useState } from 'react';
const PAGE_SIZE = 10;

export default function SportsPage() {


  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Login key management state
  const [keyActionLoading, setKeyActionLoading] = useState(null);
  const [keyResult, setKeyResult] = useState(null);
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
    fetchSports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchSports();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function fetchSports() {
    try {
      setLoading(true);
      let url = '/api/admin/sports';
      if (search) url += `?search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      setSports(data.sports || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(sports.length / PAGE_SIZE);
  const paginatedSports = sports.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Search + Pagination Arrows */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder={"Search sports..."}
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

      {/* Sports List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : sports.length === 0 ? (
        <p className="text-text-secondary">{"No sports found"}</p>
      ) : (
        <div className="space-y-2">
          {paginatedSports.map((sport) => (
            <div
              key={sport.id}
              className="px-4 py-3 border border-border rounded-lg bg-white"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{sport.name}</span>
                {sport.has_gender_teams && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {"Men's & Women's Teams"}
                  </span>
                )}
                <span className="text-text-muted">
                  ({sport.memberCount || 0})
                </span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={() => handleSendKey(sport.user_id)}
                    disabled={keyActionLoading === sport.user_id}
                    className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {keyActionLoading === sport.user_id ? "Sending..." : "Send Key"}
                  </button>
                  <button
                    onClick={() => handleResetKey(sport.user_id)}
                    disabled={keyActionLoading === sport.user_id}
                    className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                  >
                    {keyActionLoading === sport.user_id ? "Resetting..." : "Reset Key"}
                  </button>
                  {sport.user?.email && (
                    <span className="text-text-secondary">{sport.user.email}</span>
                  )}
                </div>
              </div>

              {/* Key result / error */}
              {keyResult?.userId === sport.user_id && keyResult.loginKey && (
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
              {keyResult?.userId === sport.user_id && keyResult.sent && (
                <p className="mt-1 text-xs text-green-700">{"Login credentials sent via email."}</p>
              )}
              {keyError && keyActionLoading === null && (
                <p className="mt-1 text-xs text-red-600">{keyError}</p>
              )}

              {/* Images */}
              {[
                sport.candid_image_1, sport.candid_image_2, sport.candid_image_3,
                sport.mens_candid_image_1, sport.mens_candid_image_2, sport.mens_candid_image_3,
                sport.womens_candid_image_1, sport.womens_candid_image_2, sport.womens_candid_image_3,
              ].filter(Boolean).length > 0 && (
                <div className="flex gap-2 mt-2">
                  {[
                    sport.candid_image_1, sport.candid_image_2, sport.candid_image_3,
                    sport.mens_candid_image_1, sport.mens_candid_image_2, sport.mens_candid_image_3,
                    sport.womens_candid_image_1, sport.womens_candid_image_2, sport.womens_candid_image_3,
                  ]
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((img, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={i}
                        src={img}
                        alt={`Sport image ${i + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
