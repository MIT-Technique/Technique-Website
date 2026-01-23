'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function LivingGroupsPage() {
  const t = useTranslations('dashboard.livingGroups');
  const [livingGroups, setLivingGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showPromoteForm, setShowPromoteForm] = useState(false);
  const [promoteData, setPromoteData] = useState({ email: '', livingGroupName: '' });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchLivingGroups();
  }, [filter]);

  async function fetchLivingGroups() {
    try {
      setLoading(true);
      let url = '/api/admin/living-groups';
      if (filter !== 'all') url += `?status=${filter}`;

      const res = await fetch(url);
      const data = await res.json();
      setLivingGroups(data.livingGroups || []);
    } catch (error) {
      console.error('Error fetching living groups:', error);
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers(search) {
    if (search.length < 3) {
      setUsers([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&role=student`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }

  async function handlePromote(userId) {
    if (!promoteData.livingGroupName) {
      alert(t('enterLivingGroupName'));
      return;
    }

    try {
      const res = await fetch('/api/admin/living-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          livingGroupName: promoteData.livingGroupName,
        }),
      });

      if (res.ok) {
        setShowPromoteForm(false);
        setPromoteData({ email: '', livingGroupName: '' });
        setUsers([]);
        fetchLivingGroups();
      } else {
        const data = await res.json();
        alert(data.error || t('promoteError'));
      }
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  }

  async function handleAction(livingGroupId, action) {
    try {
      const res = await fetch('/api/admin/living-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livingGroupId, action }),
      });

      if (res.ok) {
        fetchLivingGroups();
      }
    } catch (error) {
      console.error('Error updating living group:', error);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">{t('title')}</h2>
        <button
          onClick={() => setShowPromoteForm(!showPromoteForm)}
          className="btn-primary text-sm"
        >
          {showPromoteForm ? t('cancel') : t('promoteUser')}
        </button>
      </div>

      {/* Promote User Form */}
      {showPromoteForm && (
        <div className="mb-6 p-4 border border-border rounded-lg">
          <h3 className="font-medium mb-4">{t('promoteTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.searchUser')}</label>
              <input
                type="text"
                value={promoteData.email}
                onChange={(e) => {
                  setPromoteData({ ...promoteData, email: e.target.value });
                  searchUsers(e.target.value);
                }}
                className="w-full border border-border rounded px-3 py-2 text-sm"
                placeholder={t('form.searchPlaceholder')}
              />
              {users.length > 0 && (
                <div className="mt-2 border border-border rounded max-h-40 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handlePromote(user.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary border-b border-border last:border-b-0"
                    >
                      {user.email} ({user.first_name || 'No name'})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.livingGroupName')}</label>
              <input
                type="text"
                value={promoteData.livingGroupName}
                onChange={(e) => setPromoteData({ ...promoteData, livingGroupName: e.target.value })}
                className="w-full border border-border rounded px-3 py-2 text-sm"
                placeholder={t('form.namePlaceholder')}
              />
            </div>
          </div>
          <p className="text-sm text-text-muted">{t('form.instructions')}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'active', 'disabled'].map((f) => (
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

      {/* Living Groups List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : livingGroups.length === 0 ? (
        <p className="text-text-secondary">{t('noLivingGroups')}</p>
      ) : (
        <div className="space-y-4">
          {livingGroups.map((lg) => (
            <div
              key={lg.id}
              className={`p-4 border rounded-lg ${
                lg.status === 'active'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{lg.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      lg.status === 'active'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {t(`status.${lg.status}`)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {t('leader')}: {lg.user?.email} ({lg.user?.first_name || 'No name'})
                  </p>
                  {lg.photoshoot_time && lg.photoshoot_time.length > 0 && (
                    <p className="text-sm text-text-muted mt-1">
                      {t('bookedTime')}: {new Date(lg.photoshoot_time[0].date).toLocaleDateString()} {lg.photoshoot_time[0].start_time}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {lg.status === 'active' ? (
                    <button
                      onClick={() => handleAction(lg.id, 'disable')}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      {t('disable')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(lg.id, 'enable')}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      {t('enable')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
