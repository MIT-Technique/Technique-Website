'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

/**
 * LivingGroupDashboardInline - Inline living group management dashboard for LG leaders
 *
 * This component is used in the profile page to allow living group leaders to manage
 * their living group without navigating away from the profile.
 *
 * @param {string} livingGroupId - The ID of the living group to manage
 * @param {function} onBack - Callback to return to profile view
 */
export default function LivingGroupDashboardInline({ livingGroupId, onBack }) {
  const locale = useLocale();
  const t = useTranslations('livingGroupPage');

  // Living group data state
  const [livingGroup, setLivingGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('book');

  // Sections state
  const [sections, setSections] = useState([]);

  // Booking state
  const [availableTimes, setAvailableTimes] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [bookingTime, setBookingTime] = useState(null);
  const [requestingCancel, setRequestingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFrozen, setIsFrozen] = useState(false);

  // Time proposals state
  const [proposals, setProposals] = useState([]);
  const [proposalForm, setProposalForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [cancellingProposalId, setCancellingProposalId] = useState(null);

  // Members state
  const [membersData, setMembersData] = useState(null);
  const [membersLoading, setMembersLoading] = useState(true);

  // Leaders state
  const [leaders, setLeaders] = useState({ activeLeaders: [], pendingInvitations: [] });
  const [inviteLeaderEmail, setInviteLeaderEmail] = useState('');
  const [invitingLeader, setInvitingLeader] = useState(false);
  const [removingLeaderId, setRemovingLeaderId] = useState(null);
  const [leadersMessage, setLeadersMessage] = useState({ type: '', text: '' });

  // Fetch data on mount
  useEffect(() => {
    if (livingGroupId) {
      fetchLivingGroupData();
      fetchSections();
      fetchAvailableTimes();
      fetchCurrentBooking();
      fetchProposals();
      fetchMembers();
      fetchLeaders();
      checkFrozen();
    }
  }, [livingGroupId]);

  async function fetchLivingGroupData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/living-groups/by-id?id=${livingGroupId}`);
      const data = await res.json();

      if (res.ok) {
        setLivingGroup(data.livingGroup);
      } else {
        setError(data.error || 'Failed to load living group data');
      }
    } catch (err) {
      setError('Failed to load living group data');
    } finally {
      setLoading(false);
    }
  }

  async function checkFrozen() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      const frozen = data.frozenForms?.some(f => f.form_name === 'living_group_form' && f.is_frozen);
      setIsFrozen(frozen || false);
    } catch (error) {
      console.error('Error checking frozen status:', error);
    }
  }

  async function fetchSections() {
    try {
      const res = await fetch(`/api/living-groups/sections?livingGroupId=${livingGroupId}`);
      const data = await res.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }

  async function fetchAvailableTimes() {
    try {
      const res = await fetch('/api/living-groups/times?status=available');
      const data = await res.json();
      setAvailableTimes(data.times || []);
    } catch (error) {
      console.error('Error fetching available times:', error);
    }
  }

  async function fetchCurrentBooking() {
    try {
      const res = await fetch(`/api/living-groups/times?livingGroupId=${livingGroupId}&status=booked`);
      const data = await res.json();
      if (data.times && data.times.length > 0) {
        setCurrentBooking(data.times[0]);
      }
    } catch (error) {
      console.error('Error fetching current booking:', error);
    }
  }

  async function fetchProposals() {
    try {
      const res = await fetch(`/api/living-groups/propose-time?livingGroupId=${livingGroupId}`);
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  }

  async function fetchMembers() {
    try {
      setMembersLoading(true);
      const res = await fetch(`/api/living-groups/members?livingGroupId=${livingGroupId}`);
      const data = await res.json();
      setMembersData(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }
  }

  async function fetchLeaders() {
    try {
      const res = await fetch(`/api/living-groups/leaders?livingGroupId=${livingGroupId}`);
      const data = await res.json();
      setLeaders({
        activeLeaders: data.activeLeaders || [],
        pendingInvitations: data.pendingInvitations || [],
      });
    } catch (error) {
      console.error('Error fetching leaders:', error);
    }
  }

  async function handleBookTime(timeId) {
    setBookingTime(timeId);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/times', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_id: timeId, living_group_id: livingGroupId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('bookSuccess') });
        fetchAvailableTimes();
        fetchCurrentBooking();
      } else {
        setMessage({ type: 'error', text: data.error || t('bookError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('bookError') });
    } finally {
      setBookingTime(null);
    }
  }

  async function handleRequestCancel() {
    setRequestingCancel(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_id: currentBooking.id,
          reason: cancelReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('cancelRequestSuccess') });
        setShowCancelModal(false);
        setCancelReason('');
        fetchCurrentBooking();
      } else {
        setMessage({ type: 'error', text: data.error || t('cancelRequestError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('cancelRequestError') });
    } finally {
      setRequestingCancel(false);
    }
  }

  async function handleSubmitProposal(e) {
    e.preventDefault();
    if (!proposalForm.date || !proposalForm.startTime || !proposalForm.endTime) {
      setMessage({ type: 'error', text: t('proposeTime.fieldsRequired') });
      return;
    }

    setSubmittingProposal(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/propose-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          living_group_id: livingGroupId,
          ...proposalForm,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('proposeTime.submitSuccess') });
        setProposalForm({ date: '', startTime: '', endTime: '', location: '', notes: '' });
        fetchProposals();
      } else {
        setMessage({ type: 'error', text: data.error || t('proposeTime.submitError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('proposeTime.submitError') });
    } finally {
      setSubmittingProposal(false);
    }
  }

  async function handleCancelProposal(proposalId) {
    setCancellingProposalId(proposalId);

    try {
      const res = await fetch(`/api/living-groups/propose-time?id=${proposalId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('proposeTime.cancelSuccess') });
        fetchProposals();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t('proposeTime.cancelError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('proposeTime.cancelError') });
    } finally {
      setCancellingProposalId(null);
    }
  }

  async function handleInviteLeader(e) {
    e.preventDefault();
    if (!inviteLeaderEmail.trim()) {
      setLeadersMessage({ type: 'error', text: t('groupLeaders.emailRequired') });
      return;
    }

    setInvitingLeader(true);
    setLeadersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/leaders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          livingGroupId,
          email: inviteLeaderEmail.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setLeadersMessage({ type: 'success', text: t('groupLeaders.inviteSent') });
        setInviteLeaderEmail('');
        fetchLeaders();
      } else {
        setLeadersMessage({ type: 'error', text: data.error || t('groupLeaders.inviteError') });
      }
    } catch (error) {
      setLeadersMessage({ type: 'error', text: t('groupLeaders.inviteError') });
    } finally {
      setInvitingLeader(false);
    }
  }

  async function handleRemoveLeader(leaderId) {
    if (!confirm(t('groupLeaders.confirmRemove', { name: 'this leader' }))) {
      return;
    }

    setRemovingLeaderId(leaderId);
    setLeadersMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/living-groups/leaders?id=${leaderId}&livingGroupId=${livingGroupId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setLeadersMessage({ type: 'success', text: t('groupLeaders.removed') });
        fetchLeaders();
      } else {
        const data = await res.json();
        setLeadersMessage({ type: 'error', text: data.error || t('groupLeaders.removeError') });
      }
    } catch (error) {
      setLeadersMessage({ type: 'error', text: t('groupLeaders.removeError') });
    } finally {
      setRemovingLeaderId(null);
    }
  }

  async function handleCancelLeaderInvitation(invitationId) {
    setRemovingLeaderId(invitationId);
    setLeadersMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/living-groups/leaders?id=${invitationId}&livingGroupId=${livingGroupId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setLeadersMessage({ type: 'success', text: t('groupLeaders.invitationCancelled') });
        fetchLeaders();
      } else {
        const data = await res.json();
        setLeadersMessage({ type: 'error', text: data.error || t('groupLeaders.cancelError') });
      }
    } catch (error) {
      setLeadersMessage({ type: 'error', text: t('groupLeaders.cancelError') });
    } finally {
      setRemovingLeaderId(null);
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
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
          &larr; Back to Profile
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Build tabs based on living group type and sections
  const tabs = [
    { id: 'book', label: t('tabs.book') },
  ];

  // Only show Assign tab for dorms with multiple sections
  if (livingGroup?.living_group_type === 'dorm' && sections.length > 1) {
    tabs.push({ id: 'assign', label: t('tabs.assign') });
  }

  tabs.push(
    { id: 'members', label: t('tabs.members') },
    { id: 'groupLeaders', label: t('tabs.groupLeaders') }
  );

  // Add join requests tab for FSILGs
  if (livingGroup?.living_group_type === 'fsilg') {
    tabs.push({ id: 'joinRequests', label: t('tabs.joinRequests') });
  }

  return (
    <div className="py-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-accent hover:underline mb-6 flex items-center gap-2"
      >
        &larr; Back to Profile
      </button>

      <h2 className="text-xl font-medium mb-2">{livingGroup?.name || 'Living Group Dashboard'}</h2>
      <p className="text-text-secondary mb-6">Managing as living group leader</p>

      {/* Frozen notice */}
      {isFrozen && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{t('frozen')}</p>
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
          </button>
        ))}
      </div>

      {/* Book Tab */}
      {activeTab === 'book' && (
        <div>
          {message.text && (
            <div className={`mb-6 p-4 rounded ${
              message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

          {/* Current Booking */}
          {currentBooking && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">{t('currentBooking')}</h3>
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                <p className="font-medium">
                  {formatDate(currentBooking.date)}
                </p>
                <p className="text-text-secondary">
                  {formatTime(currentBooking.start_time)} - {formatTime(currentBooking.end_time)}
                </p>
                {currentBooking.location && (
                  <p className="text-text-secondary">{t('locationLabel')}: {currentBooking.location}</p>
                )}

                {currentBooking.cancellation_requested ? (
                  <p className="mt-2 text-yellow-600">{t('cancellationPending')}</p>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700"
                    disabled={isFrozen}
                  >
                    {t('requestCancel')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cancel Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium mb-4">{t('requestCancel')}</h3>
                <p className="text-text-secondary mb-4">{t('cancelReason')}</p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-border rounded px-4 py-2 mb-4"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestCancel}
                    disabled={requestingCancel}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    {requestingCancel ? t('requesting') : t('requestCancel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Available Times */}
          {!currentBooking && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">{t('availableTimes')}</h3>
              {availableTimes.length === 0 ? (
                <p className="text-text-secondary">{t('noTimes')}</p>
              ) : (
                <div className="space-y-2">
                  {availableTimes.map((time) => (
                    <div
                      key={time.id}
                      className="p-4 border border-border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{formatDate(time.date)}</p>
                        <p className="text-text-secondary">
                          {formatTime(time.start_time)} - {formatTime(time.end_time)}
                        </p>
                        {time.location && (
                          <p className="text-text-secondary text-sm">{time.location}</p>
                        )}
                        <p className="text-text-muted text-xs">
                          {t('postedBy', { name: time.created_by_name || t('unknownCreator') })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBookTime(time.id)}
                        disabled={bookingTime === time.id || isFrozen}
                        className="btn-primary"
                      >
                        {bookingTime === time.id ? t('booking') : t('book')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Time Proposals */}
          <div>
            <h3 className="text-lg font-medium mb-4">{t('proposeTime.title')}</h3>
            <p className="text-text-secondary mb-4">{t('proposeTime.description')}</p>

            <form onSubmit={handleSubmitProposal} className="space-y-4 mb-8 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">{t('proposeTime.date')}</label>
                <input
                  type="date"
                  value={proposalForm.date}
                  onChange={(e) => setProposalForm({ ...proposalForm, date: e.target.value })}
                  className="w-full border border-border rounded px-4 py-2"
                  disabled={isFrozen}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">{t('proposeTime.startTime')}</label>
                  <input
                    type="time"
                    value={proposalForm.startTime}
                    onChange={(e) => setProposalForm({ ...proposalForm, startTime: e.target.value })}
                    className="w-full border border-border rounded px-4 py-2"
                    disabled={isFrozen}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">{t('proposeTime.endTime')}</label>
                  <input
                    type="time"
                    value={proposalForm.endTime}
                    onChange={(e) => setProposalForm({ ...proposalForm, endTime: e.target.value })}
                    className="w-full border border-border rounded px-4 py-2"
                    disabled={isFrozen}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('proposeTime.location')}</label>
                <input
                  type="text"
                  value={proposalForm.location}
                  onChange={(e) => setProposalForm({ ...proposalForm, location: e.target.value })}
                  className="w-full border border-border rounded px-4 py-2"
                  disabled={isFrozen}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('proposeTime.notes')}</label>
                <textarea
                  value={proposalForm.notes}
                  onChange={(e) => setProposalForm({ ...proposalForm, notes: e.target.value })}
                  className="w-full border border-border rounded px-4 py-2"
                  rows={2}
                  disabled={isFrozen}
                />
              </div>
              <button
                type="submit"
                disabled={submittingProposal || isFrozen}
                className="btn-primary"
              >
                {submittingProposal ? t('proposeTime.submitting') : t('proposeTime.submit')}
              </button>
            </form>

            {/* Existing Proposals */}
            <h4 className="text-md font-medium mb-3">{t('proposeTime.yourProposals')}</h4>
            {proposals.length === 0 ? (
              <p className="text-text-secondary">{t('proposeTime.noProposals')}</p>
            ) : (
              <div className="space-y-2">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className={`p-4 border rounded-lg ${
                      proposal.status === 'accepted'
                        ? 'border-green-200 bg-green-50'
                        : proposal.status === 'declined'
                        ? 'border-red-200 bg-red-50'
                        : proposal.status === 'cancelled'
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{formatDate(proposal.date)}</p>
                        <p className="text-text-secondary">
                          {formatTime(proposal.start_time)} - {formatTime(proposal.end_time)}
                        </p>
                        {proposal.location && (
                          <p className="text-text-secondary text-sm">{proposal.location}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        proposal.status === 'accepted'
                          ? 'bg-green-600 text-white'
                          : proposal.status === 'declined'
                          ? 'bg-red-600 text-white'
                          : proposal.status === 'cancelled'
                          ? 'bg-gray-600 text-white'
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {t(`proposeTime.status.${proposal.status}`)}
                      </span>
                    </div>
                    {proposal.status === 'pending' && (
                      <button
                        onClick={() => handleCancelProposal(proposal.id)}
                        disabled={cancellingProposalId === proposal.id}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        {cancellingProposalId === proposal.id ? '...' : t('proposeTime.cancel')}
                      </button>
                    )}
                    {proposal.status === 'accepted' && proposal.accepted_by_name && (
                      <p className="mt-2 text-sm text-green-600">
                        {t('proposeTime.acceptedBy', { name: proposal.accepted_by_name })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Tab */}
      {activeTab === 'assign' && (
        <div>
          <h3 className="text-lg font-medium mb-4">{t('assign.title')}</h3>
          <p className="text-text-secondary mb-4">{t('assign.description')}</p>

          {/* Placeholder for now - full implementation would show time slots */}
          <div className="p-4 border border-border rounded-lg bg-gray-50">
            <p className="text-text-secondary">{t('assign.comingSoon')}</p>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          <h3 className="text-lg font-medium mb-4">{t('members.title')}</h3>

          {membersLoading ? (
            <p className="text-text-secondary">Loading...</p>
          ) : membersData?.membersBySection ? (
            // Dorm view - grouped by section
            <div>
              <p className="text-text-secondary mb-4">
                {t('members.totalMembers', { count: membersData.totalMembers || 0 })}
              </p>
              <div className="space-y-6">
                {membersData.membersBySection.map((sectionData) => (
                  <div key={sectionData.section.name} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-bg-secondary px-4 py-3">
                      <h4 className="font-medium">{sectionData.section.name}</h4>
                      <p className="text-sm text-text-secondary">
                        {t('members.memberCount', { count: sectionData.memberCount })}
                      </p>
                    </div>
                    {sectionData.members.length > 0 ? (
                      <ul className="divide-y divide-border">
                        {sectionData.members.map((member) => (
                          <li key={member.id} className="px-4 py-2 text-sm">
                            {member.user?.first_name} {member.user?.last_name}
                            <span className="text-text-muted ml-2">({member.user?.email})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-4 py-3 text-sm text-text-muted">{t('members.noMembers')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : membersData?.members ? (
            // FSILG view - flat list
            <div>
              <p className="text-text-secondary mb-4">
                {t('members.totalMembers', { count: membersData.totalMembers || 0 })}
              </p>
              {membersData.members.length > 0 ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <ul className="divide-y divide-border">
                    {membersData.members.map((member) => (
                      <li key={member.id} className="px-4 py-3 text-sm">
                        {member.user?.first_name} {member.user?.last_name}
                        <span className="text-text-muted ml-2">({member.user?.email})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-text-secondary">{t('members.noMembers')}</p>
              )}
            </div>
          ) : (
            <p className="text-text-secondary">{t('members.noMembers')}</p>
          )}
        </div>
      )}

      {/* Group Leaders Tab */}
      {activeTab === 'groupLeaders' && (
        <div>
          <h3 className="text-lg font-medium mb-2">{t('groupLeaders.title')}</h3>
          <p className="text-text-secondary mb-6">{t('groupLeaders.description')}</p>

          {leadersMessage.text && (
            <div className={`mb-6 p-4 rounded ${
              leadersMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {leadersMessage.text}
            </div>
          )}

          {/* Invite Form */}
          <div className="mb-8">
            <h4 className="text-md font-medium mb-3">{t('groupLeaders.inviteLeader')}</h4>
            <form onSubmit={handleInviteLeader} className="flex gap-2 max-w-md">
              <input
                type="email"
                value={inviteLeaderEmail}
                onChange={(e) => setInviteLeaderEmail(e.target.value)}
                placeholder={t('groupLeaders.searchPlaceholder')}
                className="flex-1 border border-border rounded px-4 py-2"
              />
              <button
                type="submit"
                disabled={invitingLeader}
                className="btn-primary"
              >
                {invitingLeader ? t('groupLeaders.inviting') : t('groupLeaders.invite')}
              </button>
            </form>
          </div>

          {/* Current Leaders */}
          <div className="mb-8">
            <h4 className="text-md font-medium mb-3">{t('groupLeaders.currentLeaders')}</h4>
            {leaders.activeLeaders.length === 0 ? (
              <p className="text-text-secondary">{t('groupLeaders.noLeaders')}</p>
            ) : (
              <div className="space-y-2">
                {leaders.activeLeaders.map((leader) => (
                  <div
                    key={leader.id}
                    className="p-4 border border-green-200 bg-green-50 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {leader.user?.first_name} {leader.user?.last_name}
                      </p>
                      <p className="text-text-secondary text-sm">{leader.user?.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveLeader(leader.id)}
                      disabled={removingLeaderId === leader.id}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      {removingLeaderId === leader.id ? t('groupLeaders.removing') : t('groupLeaders.remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {leaders.pendingInvitations.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-3">{t('groupLeaders.pendingInvitations')}</h4>
              <div className="space-y-2">
                {leaders.pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {invitation.user?.first_name} {invitation.user?.last_name}
                      </p>
                      <p className="text-text-secondary text-sm">{invitation.user?.email}</p>
                    </div>
                    <button
                      onClick={() => handleCancelLeaderInvitation(invitation.id)}
                      disabled={removingLeaderId === invitation.id}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      {removingLeaderId === invitation.id ? t('groupLeaders.cancelling') : t('groupLeaders.cancel')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Join Requests Tab (FSILGs only) */}
      {activeTab === 'joinRequests' && (
        <div>
          <h3 className="text-lg font-medium mb-4">{t('joinRequests.title')}</h3>
          <p className="text-text-secondary">{t('joinRequests.noRequests')}</p>
          {/* Join requests functionality would be added here */}
        </div>
      )}
    </div>
  );
}
