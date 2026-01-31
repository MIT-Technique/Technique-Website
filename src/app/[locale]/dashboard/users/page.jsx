'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 15;

export default function UsersPage() {
  const t = useTranslations('dashboard.users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const searchParams = useSearchParams();
  const userTypeFilter = searchParams.get('type') || 'all';

  // Admin designation state
  const [adminCount, setAdminCount] = useState(0);
  const [maxAdmins, setMaxAdmins] = useState(2);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [designatingUserId, setDesignatingUserId] = useState(null);

  // Staph toggle state
  const [togglingStaphUserId, setTogglingStaphUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  // Fetch admin designation info
  useEffect(() => {
    fetchAdminInfo();
  }, []);

  async function fetchAdminInfo() {
    try {
      const res = await fetch('/api/admin/designate-admin');
      const data = await res.json();
      setAdminCount(data.count || 0);
      setMaxAdmins(data.max || 2);
      setIsSuperAdmin(data.isSuperAdmin || false);
    } catch (error) {
      console.error('Error fetching admin info:', error);
    }
  }

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
      setPage(0);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  async function handleDesignateAdmin(userId) {
    if (!confirm(t('designateConfirm'))) return;

    setDesignatingUserId(userId);
    try {
      const res = await fetch('/api/admin/designate-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        fetchUsers();
        fetchAdminInfo();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to designate admin');
      }
    } catch (error) {
      console.error('Error designating admin:', error);
    } finally {
      setDesignatingUserId(null);
    }
  }

  async function handleToggleStaph(userId, currentIsStaph) {
    const confirmMsg = currentIsStaph ? t('revokeStaphConfirm') : t('grantStaphConfirm');
    if (!confirm(confirmMsg)) return;

    setTogglingStaphUserId(userId);
    try {
      const res = await fetch('/api/admin/toggle-staph', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to toggle staph status');
      }
    } catch (error) {
      console.error('Error toggling staph:', error);
    } finally {
      setTogglingStaphUserId(null);
    }
  }

  const ORG_ROLES = ['club', 'living_group', 'sports'];
  const filteredUsers = userTypeFilter === 'individual'
    ? users.filter(u => !ORG_ROLES.includes(u.role))
    : userTypeFilter === 'orgs'
    ? users.filter(u => ORG_ROLES.includes(u.role))
    : users;
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Search, Pagination, and Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="border border-border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-bg-secondary"
          >
            ←
          </button>
          <span className="text-sm text-text-muted px-2">
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
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-border rounded px-3 py-2 text-sm"
        >
          <option value="all">{t('filters.allRoles')}</option>
          <option value="student">{t('filters.student')}</option>
          <option value="club">{t('filters.club')}</option>
          <option value="living_group">{t('filters.livingGroup')}</option>
          <option value="sports">{t('filters.sports')}</option>
          <option value="admin">{t('filters.admin')}</option>
        </select>
      </div>

      {/* Users List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-text-secondary">{t('noUsers')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">{t('table.email')}</th>
                <th className="text-left py-2 px-2">{t('table.name')}</th>
                <th className="text-left py-2 px-2">{t('table.role')}</th>
                <th className="text-left py-2 px-2">{t('table.staph')}</th>
                <th className="text-left py-2 px-2">{t('table.status')}</th>
                <th className="text-left py-2 px-2">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
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
                      <option value="living_group">Living Group</option>
                      <option value="sports">Sports</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    {user.role === 'student' ? (
                      <button
                        onClick={() => handleToggleStaph(user.id, user.is_staph)}
                        disabled={togglingStaphUserId === user.id}
                        className={`text-xs px-2 py-1 rounded ${
                          user.is_staph
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {togglingStaphUserId === user.id ? '...' : (user.is_staph ? t('staphYes') : t('staphNo'))}
                      </button>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
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
                  <td className="py-2 px-2 flex items-center gap-2">
                    <span className="text-xs text-text-muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                    {/* Designate Admin button - only for staph users, only visible to super admin */}
                    {isSuperAdmin && user.role === 'student' && user.is_staph && adminCount < maxAdmins && (
                      <button
                        onClick={() => handleDesignateAdmin(user.id)}
                        disabled={designatingUserId === user.id}
                        className="text-xs px-2 py-1 bg-accent text-white rounded hover:bg-accent-dark"
                      >
                        {designatingUserId === user.id ? '...' : t('designateAdmin')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
