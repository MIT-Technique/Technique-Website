'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

function getTimeBucket(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1 && now.getDate() === date.getDate()) return 'Today';
  if (diffDays < 2 && now.getDate() - date.getDate() === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last 7 Days';
  if (diffDays <= 30) return 'Last 30 Days';
  return 'Last 90 Days';
}

function groupLogsByBucket(logs) {
  const bucketOrder = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'];
  const groups = {};

  for (const log of logs) {
    const bucket = getTimeBucket(log.created_at);
    if (!groups[bucket]) groups[bucket] = [];
    groups[bucket].push(log);
  }

  return bucketOrder
    .filter((b) => groups[b]?.length > 0)
    .map((b) => ({ label: b, logs: groups[b] }));
}

export default function LogsPage() {
  const t = useTranslations('dashboard.users');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/logs?page=${page}&limit=50&days=90`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatLogAction(log) {
    const actorName = log.actor
      ? (log.actor.first_name && log.actor.last_name
          ? `${log.actor.first_name} ${log.actor.last_name}`
          : log.actor.email)
      : 'Unknown';

    const details = log.details || {};

    switch (log.action_type) {
      case 'role_change':
        return `${actorName} changed role from "${details.old_role}" to "${details.new_role}" for ${details.target_email || 'a user'}`;
      case 'staph_toggle':
        return `${actorName} ${details.new_value ? 'granted' : 'revoked'} staph access for ${details.target_email || 'a user'}`;
      case 'time_created':
        return `${actorName} created time slot for ${details.date || 'unknown date'}`;
      case 'time_deleted':
        return `${actorName} deleted time slot for ${details.date || 'unknown date'}`;
      case 'admin_time_created':
        return `${actorName} (admin) created time slot for ${details.date || 'unknown date'}`;
      case 'admin_time_deleted':
        return `${actorName} (admin) deleted time slot for ${details.date || 'unknown date'}`;
      case 'time_booked':
        return `${details.living_group_name || 'A living group'} booked time slot for ${details.date || 'unknown date'}`;
      case 'cancellation_requested':
        return `${details.living_group_name || 'A living group'} requested cancellation for ${details.date || 'unknown date'}`;
      case 'cancellation_approved':
        return `${actorName} approved cancellation for ${details.living_group_name || 'a living group'} (${details.date || 'unknown date'})`;
      case 'cancellation_denied':
        return `${actorName} denied cancellation for ${details.living_group_name || 'a living group'} (${details.date || 'unknown date'})`;
      case 'booking_cancelled':
        return `${actorName} cancelled booking for ${details.living_group_name || 'a living group'}`;
      case 'proposal_accepted':
        return `${actorName} accepted time proposal from ${details.living_group_name || 'a living group'}`;
      case 'proposal_declined':
        return `${actorName} declined time proposal from ${details.living_group_name || 'a living group'}`;
      case 'admin_designated':
        return `${actorName} designated ${details.target_email || 'a user'} as admin`;
      default:
        return `${actorName} performed ${log.action_type}`;
    }
  }

  const grouped = groupLogsByBucket(logs);

  return (
    <div>
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-text-secondary">{t('logs.noLogs')}</p>
      ) : (
        <div>
          {grouped.map((group) => (
            <div key={group.label} className="mb-6">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {group.label}
              </h4>
              <div className="space-y-2">
                {group.logs.map((log) => (
                  <div
                    key={log.id}
                    className="px-3 py-2 border border-border rounded-lg bg-white"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm pb-0">{formatLogAction(log)}</p>
                      <span className="text-xs text-text-muted flex-shrink-0 ml-4">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
              >
                ←
              </button>
              <span className="text-sm text-text-muted">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
