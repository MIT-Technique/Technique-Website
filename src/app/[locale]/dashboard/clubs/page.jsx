'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export default function ClubsPage() {
  const t = useTranslations('dashboard.clubs');
  const locale = useLocale();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Leader requests state
  const [leaderRequests, setLeaderRequests] = useState([]);
  const [leaderRequestsLoading, setLeaderRequestsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    fetchClubs();
  }, [filter]);

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
    try {
      setLoading(true);
      let url = '/api/admin/clubs';
      if (filter !== 'all') url += `?status=${filter}`;

      const res = await fetch(url);
      const data = await res.json();
      setClubs(data.clubs || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(clubId, action, notes = '') {
    try {
      const res = await fetch('/api/admin/clubs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, action, notes }),
      });

      if (res.ok) {
        fetchClubs();
      }
    } catch (error) {
      console.error('Error updating club:', error);
    }
  }

  return (
    <div>
      {/* Leader Requests Section */}
      {leaderRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">{t('leaderRequests.title')}</h2>
          <div className="space-y-3">
            {leaderRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {request.user?.first_name} {request.user?.last_name}
                    <span className="text-text-muted font-normal"> → {t('leaderRequests.leaderOf')} </span>
                    {request.club?.name || t('unnamed')}
                  </p>
                  <p className="text-text-secondary text-sm">{request.user?.email}</p>
                  <p className="text-text-muted text-xs">
                    {t('leaderRequests.requestedBy')}: {request.requester?.first_name} {request.requester?.last_name}
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
                    {processingRequestId === request.id ? '...' : t('leaderRequests.approve')}
                  </button>
                  <button
                    onClick={() => handleLeaderAction(request.id, 'deny')}
                    disabled={processingRequestId === request.id}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    {processingRequestId === request.id ? '...' : t('leaderRequests.deny')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-medium mb-6">{t('title')}</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'approved', 'denied'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded ${
              filter === f
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
            }`}
          >
            {t(`filters.${f}`)}
          </button>
        ))}
      </div>

      {/* Clubs List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : clubs.length === 0 ? (
        <p className="text-text-secondary">{t('noClubs')}</p>
      ) : (
        <div className="space-y-4">
          {clubs.map((club) => (
            <div
              key={club.id}
              className={`p-4 border rounded-lg ${
                club.approval_status === 'pending'
                  ? 'border-yellow-200 bg-yellow-50'
                  : club.approval_status === 'approved'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{club.name || t('unnamed')}</h3>
                    <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                      ID: {club.club_id}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      club.approval_status === 'pending'
                        ? 'bg-yellow-200 text-yellow-800'
                        : club.approval_status === 'approved'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {t(`status.${club.approval_status}`)}
                    </span>
                  </div>
                  {club.description && (
                    <p className="text-sm text-text-secondary mb-2">{club.description}</p>
                  )}
                  {club.member_list && (
                    <p className="text-sm text-text-muted">
                      {t('members')}: {club.member_list.substring(0, 100)}
                      {club.member_list.length > 100 && '...'}
                    </p>
                  )}
                  {club.approval_notes && (
                    <p className="text-sm text-text-muted mt-2 italic">
                      {t('notes')}: {club.approval_notes}
                    </p>
                  )}
                  {/* Images */}
                  <div className="flex gap-2 mt-3">
                    {[club.candid_image_1, club.candid_image_2, club.candid_image_3]
                      .filter(Boolean)
                      .map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Club image ${i + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ))}
                  </div>
                </div>
                {club.approval_status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAction(club.id, 'approved')}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      {t('approve')}
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt(t('denyReason'));
                        if (notes !== null) {
                          handleAction(club.id, 'denied', notes);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      {t('deny')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
