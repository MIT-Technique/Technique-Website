'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 15;
const ACCESS_OPTIONS = [
  { key: 'clubs', label: 'Clubs' },
  { key: 'living_groups', label: 'Living Groups' },
  { key: 'sports', label: 'Sports' },
  { key: 'activities', label: 'Activities' },
  { key: 'seniors', label: 'Seniors' },
];

export default function UsersPage() {
  const t = useTranslations('dashboard.users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const searchParams = useSearchParams();
  const userTypeFilter = searchParams.get('type') || 'all';

  // Reset page when user type filter changes
  useEffect(() => {
    setPage(0);
  }, [userTypeFilter]);

  // Admin designation state
  const [adminCount, setAdminCount] = useState(0);
  const [maxAdmins, setMaxAdmins] = useState(2);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [designatingUserId, setDesignatingUserId] = useState(null);

  // Staph toggle state
  const [togglingStaphUserId, setTogglingStaphUserId] = useState(null);

  // Access popover state
  const [accessPopoverUserId, setAccessPopoverUserId] = useState(null);
  const [accessPopoverPos, setAccessPopoverPos] = useState({ top: 0, left: 0 });
  const [accessDraft, setAccessDraft] = useState([]);
  const [savingAccess, setSavingAccess] = useState(false);

  // Create staph state
  const [showCreateStaph, setShowCreateStaph] = useState(false);
  const [newStaphKerb, setNewStaphKerb] = useState('');
  const [newStaphName, setNewStaphName] = useState('');
  const [newStaphAccess, setNewStaphAccess] = useState([]);
  const [creatingStaph, setCreatingStaph] = useState(false);
  const [createdPassword, setCreatedPassword] = useState(null);

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

  function openAccessPopover(user, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeight = 220;
    setAccessPopoverPos({
      top: spaceBelow > popoverHeight ? rect.bottom + 4 : rect.top - popoverHeight - 4,
      left: rect.left,
    });
    setAccessPopoverUserId(user.id);
    setAccessDraft(user.access || []);
  }

  function toggleAccessDraft(key) {
    setAccessDraft(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  async function saveAccess(userId) {
    setSavingAccess(true);
    try {
      const res = await fetch('/api/admin/update-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, access: accessDraft }),
      });
      if (res.ok) {
        setAccessPopoverUserId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update access');
      }
    } catch (error) {
      console.error('Error updating access:', error);
    } finally {
      setSavingAccess(false);
    }
  }

  async function handleCreateStaph() {
    if (!newStaphKerb.trim() || !newStaphName.trim()) return;
    setCreatingStaph(true);
    setCreatedPassword(null);
    try {
      const res = await fetch('/api/admin/create-staph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kerb: newStaphKerb.trim(),
          name: newStaphName.trim(),
          access: newStaphAccess,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedPassword(data.password);
        fetchUsers();
      } else {
        alert(data.error || 'Failed to create staph account');
      }
    } catch (error) {
      console.error('Error creating staph:', error);
    } finally {
      setCreatingStaph(false);
    }
  }

  function resetCreateStaph() {
    setShowCreateStaph(false);
    setNewStaphKerb('');
    setNewStaphName('');
    setNewStaphAccess([]);
    setCreatedPassword(null);
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
                <th className="text-left py-2 px-2">{t('table.access')}</th>
                <th className="text-left py-2 px-2">{t('table.status')}</th>
                <th className="text-left py-2 px-2">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b border-border/50">
                  <td className="py-2 px-2 max-w-[200px] truncate" title={user.email}>{user.email}</td>
                  <td className="py-2 px-2 max-w-[150px] truncate" title={user.name}>{user.name}</td>
                  <td className="py-2 px-2">
                    {ORG_ROLES.includes(user.role) ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="border border-border rounded px-2 py-1 text-xs"
                      >
                        <option value="club">Club</option>
                        <option value="living_group">Living Group</option>
                        <option value="sports">Sports</option>
                      </select>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="border border-border rounded px-2 py-1 text-xs"
                      >
                        <option value="staph">Staph</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="py-2 px-2 relative">
                    {!['club', 'living_group', 'sports'].includes(user.role) ? (
                      <>
                        <button
                          onClick={(e) => accessPopoverUserId === user.id ? setAccessPopoverUserId(null) : openAccessPopover(user, e)}
                          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          {t('table.permissions')}
                          {user.access?.length > 0 && ` (${user.access.length})`}
                        </button>
                        {accessPopoverUserId === user.id && (
                          <div style={{ position: 'fixed', top: accessPopoverPos.top, left: accessPopoverPos.left, zIndex: 50 }} className="bg-white border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
                            <p className="text-xs font-medium mb-2">{t('accessPermissions')}</p>
                            {ACCESS_OPTIONS.map(opt => (
                              <label key={opt.key} className="flex items-center gap-2 py-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={accessDraft.includes(opt.key)}
                                  onChange={() => toggleAccessDraft(opt.key)}
                                  className="rounded"
                                />
                                {opt.label}
                              </label>
                            ))}
                            <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                              <button
                                onClick={() => saveAccess(user.id)}
                                disabled={savingAccess}
                                className="text-xs px-2 py-1 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                              >
                                {savingAccess ? '...' : t('save')}
                              </button>
                              <button
                                onClick={() => setAccessPopoverUserId(null)}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              >
                                {t('cancel')}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
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
                    {isSuperAdmin && user.role === 'staph' && user.is_staph && adminCount < maxAdmins && (
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

      {/* Create Staph Section - only on Individual tab */}
      {userTypeFilter === 'individual' && (
        <div className="mt-8 border-t border-border pt-6">
          {!showCreateStaph ? (
            <button
              onClick={() => setShowCreateStaph(true)}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm"
            >
              {t('createStaph')}
            </button>
          ) : (
            <div className="max-w-md space-y-4">
              <h3 className="text-sm font-medium">{t('createStaph')}</h3>
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t('createStaphKerb')}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newStaphKerb}
                    onChange={(e) => setNewStaphKerb(e.target.value)}
                    placeholder="kerb"
                    className="border border-border rounded px-3 py-2 text-sm flex-1"
                    disabled={!!createdPassword}
                  />
                  <span className="text-sm text-text-muted">@mit.edu</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t('table.name')}</label>
                <input
                  type="text"
                  value={newStaphName}
                  onChange={(e) => setNewStaphName(e.target.value)}
                  placeholder="Full Name"
                  className="border border-border rounded px-3 py-2 text-sm w-full"
                  disabled={!!createdPassword}
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">{t('table.permissions')}</label>
                <div className="flex flex-wrap gap-3">
                  {ACCESS_OPTIONS.map(opt => (
                    <label key={opt.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaphAccess.includes(opt.key)}
                        onChange={() => setNewStaphAccess(prev =>
                          prev.includes(opt.key) ? prev.filter(k => k !== opt.key) : [...prev, opt.key]
                        )}
                        className="rounded"
                        disabled={!!createdPassword}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {createdPassword && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800 font-medium mb-1">{t('createStaphSuccess')}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white px-2 py-1 rounded border border-green-300 select-all">{createdPassword}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(createdPassword)}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      {t('copy')}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {!createdPassword ? (
                  <>
                    <button
                      onClick={handleCreateStaph}
                      disabled={creatingStaph || !newStaphKerb.trim() || !newStaphName.trim()}
                      className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
                    >
                      {creatingStaph ? '...' : t('createStaphSubmit')}
                    </button>
                    <button
                      onClick={resetCreateStaph}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      {t('cancel')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={resetCreateStaph}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    {t('createStaphDone')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
