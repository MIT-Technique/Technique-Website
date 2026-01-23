'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function UsersPage() {
  const t = useTranslations('dashboard.users');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchRequests();
    }
  }, [search, roleFilter, activeTab]);

  async function fetchUsers() {
    try {
      setLoading(true);
      let url = '/api/admin/users';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRequests() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/promotion-requests?status=pending');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  async function handleRequestAction(requestId, action) {
    try {
      const notes = action === 'denied' ? prompt(t('denyReason')) : '';
      if (action === 'denied' && notes === null) return;

      const res = await fetch('/api/admin/promotion-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, notes }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-6">{t('title')}</h2>

      {/* Sub-tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`text-sm font-medium pb-2 border-b-2 ${
            activeTab === 'users'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('allUsers')}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`text-sm font-medium pb-2 border-b-2 ${
            activeTab === 'requests'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {t('promotionRequests')} {requests.length > 0 && `(${requests.length})`}
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="border border-border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-border rounded px-3 py-2 text-sm"
            >
              <option value="all">{t('filters.allRoles')}</option>
              <option value="student">{t('filters.student')}</option>
              <option value="club">{t('filters.club')}</option>
              <option value="living_group_leader">{t('filters.lgl')}</option>
              <option value="admin">{t('filters.admin')}</option>
            </select>
          </div>

          {/* Users List */}
          {loading ? (
            <p className="text-text-secondary">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-text-secondary">{t('noUsers')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">{t('table.email')}</th>
                    <th className="text-left py-2 px-2">{t('table.name')}</th>
                    <th className="text-left py-2 px-2">{t('table.role')}</th>
                    <th className="text-left py-2 px-2">{t('table.status')}</th>
                    <th className="text-left py-2 px-2">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{user.email}</td>
                      <td className="py-2 px-2">{user.first_name} {user.last_name}</td>
                      <td className="py-2 px-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="border border-border rounded px-2 py-1 text-xs"
                        >
                          <option value="student">Student</option>
                          <option value="club">Club</option>
                          <option value="living_group_leader">Living Group Leader</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs text-text-muted">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Promotion Requests */}
          {loading ? (
            <p className="text-text-secondary">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-text-secondary">{t('noRequests')}</p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {request.user?.email} ({request.user?.first_name || 'No name'})
                      </p>
                      <p className="text-sm text-text-secondary mt-1">
                        {t('requestType')}: {request.request_type === 'club_promotion' ? t('clubPromotion') : t('lglPromotion')}
                      </p>
                      {request.living_group_name && (
                        <p className="text-sm text-text-secondary">
                          {t('livingGroupName')}: {request.living_group_name}
                        </p>
                      )}
                      {request.request_reason && (
                        <p className="text-sm text-text-muted mt-2">
                          {t('reason')}: {request.request_reason}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-2">
                        {t('submitted')}: {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestAction(request.id, 'approved')}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        {t('approve')}
                      </button>
                      <button
                        onClick={() => handleRequestAction(request.id, 'denied')}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        {t('deny')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
