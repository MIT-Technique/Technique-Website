'use client';

import { useEffect, useState, useMemo } from 'react';
const ITEMS_PER_PAGE = 5;

export default function LivingGroupsPage() {


  const [livingGroups, setLivingGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dormSearch, setDormSearch] = useState('');
  const [fsilgSearch, setFsilgSearch] = useState('');
  const [dormPage, setDormPage] = useState(1);
  const [fsilgPage, setFsilgPage] = useState(1);

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
    fetchLivingGroups();
  }, []);

  async function fetchLivingGroups() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/living-groups');
      const data = await res.json();
      setLivingGroups(data.livingGroups || []);
    } catch (error) {
      console.error('Error fetching living groups:', error);
    } finally {
      setLoading(false);
    }
  }

  const allDorms = useMemo(() => livingGroups.filter(lg => lg.living_group_type !== 'fsilg'), [livingGroups]);
  const allFsilgs = useMemo(() => livingGroups.filter(lg => lg.living_group_type === 'fsilg'), [livingGroups]);

  const filteredDorms = useMemo(() => {
    if (!dormSearch) return allDorms;
    const q = dormSearch.toLowerCase();
    return allDorms.filter(lg =>
      lg.name?.toLowerCase().includes(q) ||
      lg.user?.email?.toLowerCase().includes(q)
    );
  }, [allDorms, dormSearch]);

  const filteredFsilgs = useMemo(() => {
    if (!fsilgSearch) return allFsilgs;
    const q = fsilgSearch.toLowerCase();
    return allFsilgs.filter(lg =>
      lg.name?.toLowerCase().includes(q) ||
      lg.user?.email?.toLowerCase().includes(q)
    );
  }, [allFsilgs, fsilgSearch]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setDormPage(1);
  }, [dormSearch]);

  useEffect(() => {
    setFsilgPage(1);
  }, [fsilgSearch]);

  const dormTotalPages = Math.ceil(filteredDorms.length / ITEMS_PER_PAGE);
  const fsilgTotalPages = Math.ceil(filteredFsilgs.length / ITEMS_PER_PAGE);

  const paginatedDorms = useMemo(() => {
    const start = (dormPage - 1) * ITEMS_PER_PAGE;
    return filteredDorms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDorms, dormPage]);

  const paginatedFsilgs = useMemo(() => {
    const start = (fsilgPage - 1) * ITEMS_PER_PAGE;
    return filteredFsilgs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFsilgs, fsilgPage]);

  const renderCard = (lg) => (
    <div
      key={lg.id}
      className="p-3 border border-border rounded-lg bg-white"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{lg.name}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSendKey(lg.user_id)}
            disabled={keyActionLoading === lg.user_id}
            className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            {keyActionLoading === lg.user_id ? "Sending..." : "Send Key"}
          </button>
          <button
            onClick={() => handleResetKey(lg.user_id)}
            disabled={keyActionLoading === lg.user_id}
            className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            {keyActionLoading === lg.user_id ? "Resetting..." : "Reset Key"}
          </button>
          <span className="text-sm text-text-muted">{lg.user?.email}</span>
        </div>
      </div>
      {keyResult?.userId === lg.user_id && keyResult.loginKey && (
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
      {keyResult?.userId === lg.user_id && keyResult.sent && (
        <p className="mt-1 text-xs text-green-700">{"Login credentials sent via email."}</p>
      )}
      {lg.dorm_sections && lg.dorm_sections.length > 0 && (
        <p className="text-xs text-text-muted mt-1">
          {lg.dorm_sections.join(', ')}
        </p>
      )}
    </div>
  );

  const renderColumn = (title, paginatedItems, search, setSearch, currentPage, totalPages, setPage, placeholder) => (
    <div className="flex-1 min-w-0">
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg flex-1 min-w-0 text-sm"
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            ←
          </button>
          <span className="text-sm text-text-muted px-2 whitespace-nowrap">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            →
          </button>
        </div>
      </div>
      {paginatedItems.length === 0 ? (
        <p className="text-text-secondary text-sm">{"No results found"}</p>
      ) : (
        <div className="space-y-2">
          {paginatedItems.map(renderCard)}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <p className="text-text-secondary">Loading...</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {renderColumn(
        "Dorms",
        paginatedDorms,
        dormSearch,
        setDormSearch,
        dormPage,
        dormTotalPages,
        setDormPage,
        "Search dorms..."
      )}
      {renderColumn(
        "FSILGs",
        paginatedFsilgs,
        fsilgSearch,
        setFsilgSearch,
        fsilgPage,
        fsilgTotalPages,
        setFsilgPage,
        "Search FSILGs..."
      )}
    </div>
  );
}
