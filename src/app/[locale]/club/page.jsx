'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';

export default function ClubPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('clubPage');
  const { isLoggedIn, user, club, loading: userLoading, refetch } = useUser();

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

  // Onboarding state (for adding first leader)
  const [leaderSearch, setLeaderSearch] = useState('');
  const [leaderSearchResults, setLeaderSearchResults] = useState([]);
  const [leaderSearchLoading, setLeaderSearchLoading] = useState(false);
  const [addingLeader, setAddingLeader] = useState(false);
  const [onboardingMessage, setOnboardingMessage] = useState({ type: '', text: '' });

  // Invitation state
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState([]);
  const [inviteSearchLoading, setInviteSearchLoading] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [cancellingInvitationId, setCancellingInvitationId] = useState(null);

  useEffect(() => {
    if (!userLoading && (!isLoggedIn || user?.role !== 'club')) {
      router.push(`/${locale}/login`);
    }
  }, [isLoggedIn, user, userLoading, router, locale]);

  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        description: club.description || '',
      });
    }
  }, [club]);

  useEffect(() => {
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
    checkFrozen();
  }, []);

  // Fetch members data
  useEffect(() => {
    if (isLoggedIn && user?.role === 'club') {
      fetchMembers();
      fetchJoinRequests();
      fetchLeaderRequests();
      fetchPendingInvitations();
    }
  }, [isLoggedIn, user]);

  // Debounced search for leader onboarding
  useEffect(() => {
    if (!club || club.has_leader) return;
    const timer = setTimeout(() => {
      searchStudentsForLeader(leaderSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [leaderSearch, club]);

  // Debounced search for invitations
  useEffect(() => {
    if (!club?.has_leader) return;
    const timer = setTimeout(() => {
      searchStudentsForInvite(inviteSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [inviteSearch, club]);

  async function fetchMembers() {
    try {
      setMembersLoading(true);
      const res = await fetch('/api/clubs/members');
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
      const res = await fetch('/api/clubs/join-requests');
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
      const res = await fetch('/api/clubs/leader-request');
      const data = await res.json();
      setPendingLeaderRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching leader requests:', error);
    }
  }

  async function fetchPendingInvitations() {
    try {
      const res = await fetch('/api/clubs/invite');
      const data = await res.json();
      setPendingInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  }

  async function searchStudentsForLeader(query) {
    if (!query || query.length < 2) {
      setLeaderSearchResults([]);
      return;
    }
    try {
      setLeaderSearchLoading(true);
      const res = await fetch(`/api/clubs/search-students?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setLeaderSearchResults(data.students || []);
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setLeaderSearchLoading(false);
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

  async function handleAddFirstLeader(userId) {
    setAddingLeader(true);
    setOnboardingMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/add-first-leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();

      if (res.ok) {
        setOnboardingMessage({ type: 'success', text: t('onboarding.leaderAdded') });
        setLeaderSearch('');
        setLeaderSearchResults([]);
        refetch(); // Refresh club data to update has_leader
        fetchMembers();
      } else {
        setOnboardingMessage({ type: 'error', text: data.error || t('onboarding.leaderError') });
      }
    } catch (error) {
      setOnboardingMessage({ type: 'error', text: t('onboarding.leaderError') });
    } finally {
      setAddingLeader(false);
    }
  }

  async function handleInviteStudent(userId) {
    setInvitingUserId(userId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
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
      const res = await fetch(`/api/clubs/invite?id=${invitationId}`, {
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
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('success') });
        refetch();
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
        body: JSON.stringify({ name: newManualMember.trim() }),
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
      const res = await fetch(`/api/clubs/manual-members?id=${memberId}`, {
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
      const res = await fetch(`/api/clubs/members?id=${membershipId}`, {
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
        body: JSON.stringify({ user_id: userId }),
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
      const res = await fetch(`/api/clubs/leader-request?id=${requestId}`, {
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
        body: JSON.stringify({ membership_id: membershipId }),
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
        body: JSON.stringify({ request_id: requestId, action }),
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
      const res = await fetch('/api/clubs/export-members');
      const data = await res.json();
      if (res.ok) {
        // Copy to clipboard
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

  // Check if a member has a pending leader request
  function hasPendingLeaderRequest(userId) {
    return pendingLeaderRequests.some(r => r.user_id === userId);
  }

  if (userLoading) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32">
        <div className="container-text text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn || user?.role !== 'club') {
    return null;
  }

  // Tabs are disabled until club has a leader (except profile)
  const hasLeader = club?.has_leader;
  const tabs = [
    { id: 'profile', label: t('tabs.profile'), disabled: false },
    { id: 'members', label: t('tabs.members'), disabled: !hasLeader },
    { id: 'requests', label: t('tabs.requests'), disabled: !hasLeader },
    { id: 'management', label: t('tabs.management'), disabled: !hasLeader },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32 pb-12">
        <section className="container-text">
          <h1 className="mb-4">{t('title')}</h1>
          <p className="text-text-secondary mb-8">
            {t('welcome', { email: user?.email })}
          </p>

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
              {club.approval_notes && (
                <p className="text-sm text-text-secondary mt-2">
                  {t('notes')}: {club.approval_notes}
                </p>
              )}
            </div>
          )}

          {/* Leader Onboarding Gate */}
          {club && !club.has_leader && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-medium mb-2">{t('onboarding.addLeaderRequired')}</h2>
              <p className="text-text-secondary mb-4">{t('onboarding.addLeaderDescription')}</p>

              {onboardingMessage.text && (
                <div className={`mb-4 p-3 rounded ${
                  onboardingMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {onboardingMessage.text}
                </div>
              )}

              <div className="max-w-md">
                <input
                  type="text"
                  value={leaderSearch}
                  onChange={(e) => setLeaderSearch(e.target.value)}
                  placeholder={t('onboarding.searchStudent')}
                  className="w-full border border-border rounded px-4 py-2 mb-2"
                />

                {leaderSearchLoading && (
                  <p className="text-text-secondary text-sm">Loading...</p>
                )}

                {leaderSearchResults.length > 0 && (
                  <div className="border border-border rounded max-h-48 overflow-y-auto">
                    {leaderSearchResults.map((student) => (
                      <div
                        key={student.id}
                        className="p-3 border-b last:border-b-0 flex justify-between items-center hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{student.first_name} {student.last_name}</p>
                          <p className="text-text-secondary text-sm">{student.email}</p>
                        </div>
                        <button
                          onClick={() => handleAddFirstLeader(student.id)}
                          disabled={addingLeader}
                          className="text-sm px-3 py-1 bg-accent text-white rounded hover:bg-accent/90"
                        >
                          {addingLeader ? t('onboarding.adding') : t('onboarding.addAsLeader')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {leaderSearch.length >= 2 && !leaderSearchLoading && leaderSearchResults.length === 0 && (
                  <p className="text-text-secondary text-sm">{t('myClubs.noResults')}</p>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab.disabled
                    ? 'border-transparent text-text-muted cursor-not-allowed'
                    : activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
                {tab.id === 'requests' && joinRequests.length > 0 && !tab.disabled && (
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

                {/* Images Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('form.images')}</label>
                  <p className="text-sm text-text-muted mb-4">{t('form.imagesHint')}</p>
                  <div className="flex gap-4">
                    {[club?.candid_image_1, club?.candid_image_2, club?.candid_image_3]
                      .filter(Boolean)
                      .map((img, i) => (
                        <div key={i} className="relative">
                          <img
                            src={img}
                            alt={`Club image ${i + 1}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                        </div>
                      ))}
                  </div>
                  <p className="text-sm text-text-muted mt-2">{t('form.uploadNote')}</p>
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
                <h2 className="text-lg font-medium mb-4">{t('invitations.title')}</h2>
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

                  {inviteSearch.length >= 2 && !inviteSearchLoading && inviteSearchResults.length === 0 && (
                    <p className="text-text-secondary text-sm mt-2">{t('myClubs.noResults')}</p>
                  )}
                </div>

                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-2">{t('invitations.pendingInvitations')}</h3>
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
                <h2 className="text-lg font-medium mb-4">{t('members.activeMembers')}</h2>
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
                <h2 className="text-lg font-medium mb-4">{t('members.manualMembers')}</h2>

                {/* Add manual member form */}
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
              <h2 className="text-lg font-medium mb-4">{t('requests.title')}</h2>
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
                  <h2 className="text-lg font-medium mb-4">{t('management.pendingPromotions')}</h2>
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

              <h2 className="text-lg font-medium mb-4">{t('management.title')}</h2>
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
        </section>
      </main>
      <Footer />
    </>
  );
}
