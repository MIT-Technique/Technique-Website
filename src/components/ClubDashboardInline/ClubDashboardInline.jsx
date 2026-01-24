'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

/**
 * ClubDashboardInline - Inline club management dashboard for club leaders
 *
 * This component is used in the profile page to allow club leaders to manage
 * their club without navigating away from the profile.
 *
 * @param {string} clubId - The ID of the club to manage
 * @param {function} onBack - Callback to return to profile view
 */
export default function ClubDashboardInline({ clubId, onBack }) {
  const locale = useLocale();
  const t = useTranslations('clubPage');

  // Club data state
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFrozen, setIsFrozen] = useState(false);

  // Members state
  const [activeMembers, setActiveMembers] = useState([]);
  const [manualMembers, setManualMembers] = useState([]);
  const [leaderCount, setLeaderCount] = useState(0);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersMessage, setMembersMessage] = useState({ type: '', text: '' });
  const [newManualMember, setNewManualMember] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [promotingMemberId, setPromotingMemberId] = useState(null);
  const [demotingMemberId, setDemotingMemberId] = useState(null);

  // Join requests state
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Leader requests state
  const [pendingLeaderRequests, setPendingLeaderRequests] = useState([]);
  const [cancellingLeaderRequestId, setCancellingLeaderRequestId] = useState(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Invitation state
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState([]);
  const [inviteSearchLoading, setInviteSearchLoading] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [cancellingInvitationId, setCancellingInvitationId] = useState(null);

  // Fetch club data on mount
  useEffect(() => {
    if (clubId) {
      fetchClubData();
      fetchMembers();
      fetchJoinRequests();
      fetchLeaderRequests();
      fetchPendingInvitations();
      checkFrozen();
    }
  }, [clubId]);

  // Update form when club data loads
  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        description: club.description || '',
      });
    }
  }, [club]);

  // Debounced search for invitations
  useEffect(() => {
    if (!club) return;
    const timer = setTimeout(() => {
      searchStudentsForInvite(inviteSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [inviteSearch, club]);

  async function fetchClubData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/clubs/leader-access?clubId=${clubId}`);
      const data = await res.json();

      if (res.ok) {
        setClub(data.club);
      } else {
        setError(data.error || 'Failed to load club data');
      }
    } catch (err) {
      setError('Failed to load club data');
    } finally {
      setLoading(false);
    }
  }

  async function checkFrozen() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      const frozen = data.frozenForms?.some(f => f.form_name === 'club_form' && f.is_frozen);
      setIsFrozen(frozen || false);
    } catch (error) {
      console.error('Error checking frozen status:', error);
    }
  }

  async function fetchMembers() {
    try {
      setMembersLoading(true);
      const res = await fetch(`/api/clubs/members?clubId=${clubId}`);
      const data = await res.json();
      setActiveMembers(data.activeMembers || []);
      setManualMembers(data.manualMembers || []);
      setLeaderCount(data.leaderCount || 0);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }
  }

  async function fetchJoinRequests() {
    try {
      setRequestsLoading(true);
      const res = await fetch(`/api/clubs/join-requests?clubId=${clubId}`);
      const data = await res.json();
      setJoinRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  }

  async function fetchLeaderRequests() {
    try {
      const res = await fetch(`/api/clubs/leader-request?clubId=${clubId}`);
      const data = await res.json();
      setPendingLeaderRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching leader requests:', error);
    }
  }

  async function fetchPendingInvitations() {
    try {
      const res = await fetch(`/api/clubs/invite?clubId=${clubId}`);
      const data = await res.json();
      setPendingInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  }

  async function searchStudentsForInvite(query) {
    if (!query || query.length < 2) {
      setInviteSearchResults([]);
      return;
    }
    try {
      setInviteSearchLoading(true);
      const res = await fetch(`/api/clubs/search-students?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setInviteSearchResults(data.students || []);
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setInviteSearchLoading(false);
    }
  }

  async function handleInviteStudent(userId) {
    setInvitingUserId(userId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, club_id: clubId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMembersMessage({ type: 'success', text: t('invitations.inviteSent') });
        setInviteSearch('');
        setInviteSearchResults([]);
        fetchPendingInvitations();
      } else {
        setMembersMessage({ type: 'error', text: data.error || t('invitations.inviteError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('invitations.inviteError') });
    } finally {
      setInvitingUserId(null);
    }
  }

  async function handleCancelInvitation(invitationId) {
    setCancellingInvitationId(invitationId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/clubs/invite?id=${invitationId}&clubId=${clubId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPendingInvitations();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('invitations.cancelError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('invitations.cancelError') });
    } finally {
      setCancellingInvitationId(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isFrozen) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, club_id: clubId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('success') });
        fetchClubData();
      } else {
        setMessage({ type: 'error', text: data.error || t('error') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('error') });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddManualMember(e) {
    e.preventDefault();
    if (!newManualMember.trim()) return;

    setAddingMember(true);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newManualMember.trim(), club_id: clubId }),
      });

      if (res.ok) {
        setNewManualMember('');
        setMembersMessage({ type: 'success', text: t('members.addSuccess') });
        fetchMembers();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.addError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.addError') });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveManualMember(memberId) {
    setRemovingMemberId(memberId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/clubs/manual-members?id=${memberId}&clubId=${clubId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembersMessage({ type: 'success', text: t('members.removeSuccess') });
        fetchMembers();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.removeError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.removeError') });
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleRemoveActiveMember(membershipId) {
    setRemovingMemberId(membershipId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/clubs/members?id=${membershipId}&clubId=${clubId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembersMessage({ type: 'success', text: t('members.removeSuccess') });
        fetchMembers();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.removeError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.removeError') });
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleRequestPromotion(userId) {
    setPromotingMemberId(userId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/leader-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, club_id: clubId }),
      });

      if (res.ok) {
        setMembersMessage({ type: 'success', text: t('members.promotionRequested') });
        fetchLeaderRequests();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.promotionError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.promotionError') });
    } finally {
      setPromotingMemberId(null);
    }
  }

  async function handleCancelLeaderRequest(requestId) {
    setCancellingLeaderRequestId(requestId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/clubs/leader-request?id=${requestId}&clubId=${clubId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembersMessage({ type: 'success', text: t('members.requestCancelled') });
        fetchLeaderRequests();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.cancelError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.cancelError') });
    } finally {
      setCancellingLeaderRequestId(null);
    }
  }

  async function handleDemoteLeader(membershipId) {
    setDemotingMemberId(membershipId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/demote-leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membership_id: membershipId, club_id: clubId }),
      });

      if (res.ok) {
        setMembersMessage({ type: 'success', text: t('members.demoteSuccess') });
        fetchMembers();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.demoteError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.demoteError') });
    } finally {
      setDemotingMemberId(null);
    }
  }

  async function handleProcessJoinRequest(requestId, action) {
    setProcessingRequestId(requestId);

    try {
      const res = await fetch('/api/clubs/join-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action, club_id: clubId }),
      });

      if (res.ok) {
        fetchJoinRequests();
        if (action === 'approve') {
          fetchMembers();
        }
      } else {
        const data = await res.json();
        console.error('Error processing request:', data.error);
      }
    } catch (error) {
      console.error('Error processing request:', error);
    } finally {
      setProcessingRequestId(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/clubs/export-members?clubId=${clubId}`);
      const data = await res.json();
      if (res.ok) {
        await navigator.clipboard.writeText(data.members);
        setMembersMessage({ type: 'success', text: t('members.exportSuccess', { count: data.memberCount }) });
      } else {
        setMembersMessage({ type: 'error', text: data.error || t('members.exportError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.exportError') });
    } finally {
      setExporting(false);
    }
  }

  function hasPendingLeaderRequest(userId) {
    return pendingLeaderRequests.some(r => r.user_id === userId);
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <button
          onClick={onBack}
          className="text-accent hover:underline mb-4 flex items-center gap-2"
        >
          &larr; {t('backToProfile') || 'Back to Profile'}
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('tabs.profile') },
    { id: 'members', label: t('tabs.members') },
    { id: 'requests', label: t('tabs.requests') },
    { id: 'management', label: t('tabs.management') },
  ];

  return (
    <div className="py-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-accent hover:underline mb-6 flex items-center gap-2"
      >
        &larr; {t('backToProfile') || 'Back to Profile'}
      </button>

      <h2 className="text-xl font-medium mb-2">{club?.name || 'Club Dashboard'}</h2>
      <p className="text-text-secondary mb-6">{t('managingAsLeader') || 'Managing as club leader'}</p>

      {/* Status */}
      {club && (
        <div className={`mb-6 p-4 rounded-lg ${
          club.approval_status === 'pending'
            ? 'bg-yellow-50 border border-yellow-200'
            : club.approval_status === 'approved'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className="font-medium">
            {t('status')}: {t(`statusValues.${club.approval_status}`)}
          </p>
          <p className="text-sm text-text-secondary">
            {t('clubId')}: {club.club_id}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {tab.id === 'requests' && joinRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-accent text-white rounded-full">
                {joinRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          {isFrozen && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">{t('frozen')}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t('form.name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-border rounded px-4 py-2"
                disabled={isFrozen}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('form.description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-border rounded px-4 py-2 min-h-[100px]"
                disabled={isFrozen}
              />
            </div>

            {message.text && (
              <div className={`p-4 rounded ${
                message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || isFrozen}
              className="btn-primary"
            >
              {saving ? t('saving') : t('save')}
            </button>
          </form>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {membersMessage.text && (
            <div className={`mb-6 p-4 rounded ${
              membersMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {membersMessage.text}
            </div>
          )}

          {/* Export button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="text-sm text-accent hover:underline"
            >
              {exporting ? t('members.exporting') : t('members.export')}
            </button>
          </div>

          {/* Invite Students */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">{t('invitations.title')}</h3>
            <div className="max-w-md mb-4">
              <input
                type="text"
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder={t('invitations.searchPlaceholder')}
                className="w-full border border-border rounded px-4 py-2"
              />

              {inviteSearchLoading && (
                <p className="text-text-secondary text-sm mt-2">Loading...</p>
              )}

              {inviteSearchResults.length > 0 && (
                <div className="mt-2 border border-border rounded max-h-48 overflow-y-auto">
                  {inviteSearchResults.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 border-b last:border-b-0 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{student.first_name} {student.last_name}</p>
                        <p className="text-text-secondary text-sm">{student.email}</p>
                      </div>
                      <button
                        onClick={() => handleInviteStudent(student.id)}
                        disabled={invitingUserId === student.id}
                        className="text-sm px-3 py-1 bg-accent text-white rounded hover:bg-accent/90"
                      >
                        {invitingUserId === student.id ? t('invitations.inviting') : t('invitations.invite')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-2">{t('invitations.pendingInvitations')}</h4>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {invitation.user?.first_name} {invitation.user?.last_name}
                        </p>
                        <p className="text-text-secondary text-sm">{invitation.user?.email}</p>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        disabled={cancellingInvitationId === invitation.id}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        {cancellingInvitationId === invitation.id ? '...' : t('management.cancelRequest')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Members */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">{t('members.activeMembers')}</h3>
            {membersLoading ? (
              <p className="text-text-secondary">Loading...</p>
            ) : activeMembers.length === 0 ? (
              <p className="text-text-secondary">{t('members.noActiveMembers')}</p>
            ) : (
              <div className="space-y-2">
                {activeMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border border-border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {member.user?.first_name} {member.user?.last_name}
                      </p>
                      <p className="text-text-secondary text-sm">{member.user?.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      member.role === 'leader'
                        ? 'bg-accent text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {member.role === 'leader' ? t('members.leader') : t('members.member')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Members */}
          <div>
            <h3 className="text-lg font-medium mb-4">{t('members.manualMembers')}</h3>

            <form onSubmit={handleAddManualMember} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newManualMember}
                onChange={(e) => setNewManualMember(e.target.value)}
                placeholder={t('members.addPlaceholder')}
                className="flex-1 border border-border rounded px-4 py-2"
              />
              <button
                type="submit"
                disabled={addingMember || !newManualMember.trim()}
                className="btn-primary"
              >
                {addingMember ? t('members.adding') : t('members.add')}
              </button>
            </form>

            {manualMembers.length === 0 ? (
              <p className="text-text-secondary">{t('members.noManualMembers')}</p>
            ) : (
              <div className="space-y-2">
                {manualMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border border-border rounded-lg flex justify-between items-center"
                  >
                    <p>{member.name}</p>
                    <button
                      onClick={() => handleRemoveManualMember(member.id)}
                      disabled={removingMemberId === member.id}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      {removingMemberId === member.id ? t('members.removing') : t('members.remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          <h3 className="text-lg font-medium mb-4">{t('requests.title')}</h3>
          {requestsLoading ? (
            <p className="text-text-secondary">Loading...</p>
          ) : joinRequests.length === 0 ? (
            <p className="text-text-secondary">{t('requests.noRequests')}</p>
          ) : (
            <div className="space-y-2">
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border border-border rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {request.user?.first_name} {request.user?.last_name}
                    </p>
                    <p className="text-text-secondary text-sm">{request.user?.email}</p>
                    <p className="text-text-muted text-xs">
                      {new Date(request.created_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcessJoinRequest(request.id, 'approve')}
                      disabled={processingRequestId === request.id}
                      className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      {processingRequestId === request.id ? '...' : t('requests.approve')}
                    </button>
                    <button
                      onClick={() => handleProcessJoinRequest(request.id, 'deny')}
                      disabled={processingRequestId === request.id}
                      className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      {processingRequestId === request.id ? '...' : t('requests.deny')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'management' && (
        <div>
          {membersMessage.text && (
            <div className={`mb-6 p-4 rounded ${
              membersMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {membersMessage.text}
            </div>
          )}

          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-text-secondary">
              {t('management.leaderInfo', { count: leaderCount, max: 2 })}
            </p>
          </div>

          {/* Pending Leader Requests */}
          {pendingLeaderRequests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">{t('management.pendingPromotions')}</h3>
              <div className="space-y-2">
                {pendingLeaderRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {request.user?.first_name} {request.user?.last_name}
                      </p>
                      <p className="text-text-secondary text-sm">{t('management.awaitingApproval')}</p>
                    </div>
                    <button
                      onClick={() => handleCancelLeaderRequest(request.id)}
                      disabled={cancellingLeaderRequestId === request.id}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      {cancellingLeaderRequestId === request.id ? t('management.cancelling') : t('management.cancelRequest')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-lg font-medium mb-4">{t('management.title')}</h3>
          {membersLoading ? (
            <p className="text-text-secondary">Loading...</p>
          ) : activeMembers.length === 0 ? (
            <p className="text-text-secondary">{t('members.noActiveMembers')}</p>
          ) : (
            <div className="space-y-2">
              {activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {member.user?.first_name} {member.user?.last_name}
                      </p>
                      <p className="text-text-secondary text-sm">{member.user?.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      member.role === 'leader'
                        ? 'bg-accent text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {member.role === 'leader' ? t('members.leader') : t('members.member')}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2 flex-wrap">
                    {member.role === 'member' && !hasPendingLeaderRequest(member.user?.id) && leaderCount < 2 && (
                      <button
                        onClick={() => handleRequestPromotion(member.user?.id)}
                        disabled={promotingMemberId === member.user?.id}
                        className="text-sm px-3 py-1 bg-accent text-white rounded hover:bg-accent/90"
                      >
                        {promotingMemberId === member.user?.id ? '...' : t('management.promoteToLeader')}
                      </button>
                    )}
                    {member.role === 'member' && hasPendingLeaderRequest(member.user?.id) && (
                      <span className="text-sm text-yellow-600">{t('management.promotionPending')}</span>
                    )}
                    {member.role === 'leader' && (
                      <button
                        onClick={() => handleDemoteLeader(member.id)}
                        disabled={demotingMemberId === member.id}
                        className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        {demotingMemberId === member.id ? '...' : t('management.demoteToMember')}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveActiveMember(member.id)}
                      disabled={removingMemberId === member.id}
                      className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      {removingMemberId === member.id ? '...' : t('management.removeMember')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
