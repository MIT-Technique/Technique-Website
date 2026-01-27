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

  // Time assignment state (for dorms with multiple sections)
  const [timeAssignments, setTimeAssignments] = useState({}); // { photoshootTimeId: { 'HH:mm-HH:mm': sectionName } }
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [savingSlot, setSavingSlot] = useState(null); // 'photoshootTimeId-slotKey' being saved
  const [bookedTimes, setBookedTimes] = useState([]);

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

  async function fetchBookedTimes() {
    try {
      const res = await fetch(`/api/living-groups/times?livingGroupId=${livingGroupId}&status=booked`);
      const data = await res.json();
      setBookedTimes(data.times || []);
    } catch (error) {
      console.error('Error fetching booked times:', error);
    }
  }

  async function fetchTimeAssignments() {
    if (!livingGroupId) return;
    try {
      setAssignmentsLoading(true);
      const res = await fetch(`/api/living-groups/time-assignments?livingGroupId=${livingGroupId}`);
      const data = await res.json();

      // Convert array to map: { photoshootTimeId: { 'slotStart-slotEnd': sectionName } }
      const assignmentsMap = {};
      (data.assignments || []).forEach(a => {
        if (!assignmentsMap[a.photoshootTimeId]) {
          assignmentsMap[a.photoshootTimeId] = {};
        }
        const slotKey = `${a.slotStart}-${a.slotEnd}`;
        assignmentsMap[a.photoshootTimeId][slotKey] = a.sectionName || '';
      });
      setTimeAssignments(assignmentsMap);
    } catch (error) {
      console.error('Error fetching time assignments:', error);
    } finally {
      setAssignmentsLoading(false);
    }
  }

  // Generate 30-minute slots for a time range
  function generateSlots(startTime, endTime) {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let h = startH;
    let m = startM;

    // Round to nearest 30-min boundary
    if (m !== 0 && m !== 30) {
      m = m < 30 ? 30 : 0;
      if (m === 0) h++;
    }

    while (h < endH || (h === endH && m < endM)) {
      const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      m += 30;
      if (m >= 60) { m = 0; h++; }
      const slotEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ start: slotStart, end: slotEnd });
    }
    return slots;
  }

  async function handleAssignSection(photoshootTimeId, slotStart, slotEnd, sectionName) {
    const slotKey = `${slotStart}-${slotEnd}`;
    setSavingSlot(`${photoshootTimeId}-${slotKey}`);

    try {
      const res = await fetch('/api/living-groups/time-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoshootTimeId,
          livingGroupId,
          sectionName: sectionName || null,
          slotStart,
          slotEnd,
        }),
      });

      if (res.ok) {
        // Update local state
        setTimeAssignments(prev => ({
          ...prev,
          [photoshootTimeId]: {
            ...(prev[photoshootTimeId] || {}),
            [slotKey]: sectionName || '',
          },
        }));
        setMessage({ type: 'success', text: t('assign.saved') });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t('assign.saveError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('assign.saveError') });
    } finally {
      setSavingSlot(null);
    }
  }

  // Fetch booked times and assignments when Assign tab is active
  useEffect(() => {
    if (activeTab === 'assign' && livingGroupId && livingGroup?.living_group_type === 'dorm' && sections.length > 1) {
      fetchBookedTimes();
      fetchTimeAssignments();
    }
  }, [activeTab, livingGroupId, sections.length, livingGroup?.living_group_type]);

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
    { id: 'members', label: t('tabs.members') }
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
      {activeTab === 'assign' && livingGroup?.living_group_type === 'dorm' && sections.length > 1 && (
        <div>
          <h3 className="text-lg font-medium mb-4">{t('assign.title')}</h3>
          <p className="text-text-secondary mb-4">{t('assign.description')}</p>

          {/* Sections waiting to be assigned */}
          {bookedTimes.length > 0 && !assignmentsLoading && (() => {
            // Get all sections that haven't been assigned to any slot in any booked time
            const allAssignedSections = new Set();
            bookedTimes.forEach(bt => {
              const assignments = timeAssignments[bt.id] || {};
              Object.values(assignments).forEach(sectionName => {
                if (sectionName) allAssignedSections.add(sectionName);
              });
            });
            const unassigned = sections.filter(s => !allAssignedSections.has(s.name));

            if (unassigned.length > 0) {
              return (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800 pb-0">
                    <span className="font-medium">{t('assign.unassignedSections')}</span>{' '}
                    {unassigned.map(s => s.name).join(', ')}
                  </p>
                </div>
              );
            }
            return (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-medium text-green-800">{t('assign.allAssigned')}</p>
              </div>
            );
          })()}

          {bookedTimes.length === 0 ? (
            <p className="text-text-secondary">{t('assign.noBooking')}</p>
          ) : (
            <div className="space-y-4">
              {bookedTimes.map((bookedTime) => (
                <div key={bookedTime.id} className="bg-white border border-border rounded-lg p-6">
                  <div className="mb-4">
                    <p className="font-medium">{formatDate(bookedTime.date)}</p>
                    <p className="text-text-secondary text-sm">
                      {formatTime(bookedTime.start_time)} - {formatTime(bookedTime.end_time)} EST
                    </p>
                  </div>

                  {assignmentsLoading ? (
                    <p className="text-text-muted text-sm">Loading...</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[100px_1fr] gap-2 text-xs font-medium text-text-muted uppercase mb-2">
                        <span>{t('assign.slot')}</span>
                        <span>{t('assign.section')}</span>
                      </div>
                      {generateSlots(bookedTime.start_time, bookedTime.end_time).map((slot) => {
                        const slotKey = `${slot.start}-${slot.end}`;
                        const currentAssignment = timeAssignments[bookedTime.id]?.[slotKey] || '';
                        const isSaving = savingSlot === `${bookedTime.id}-${slotKey}`;

                        return (
                          <div key={slotKey} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                            <span className="text-sm font-medium">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </span>
                            <div className="flex items-center gap-2">
                              <select
                                value={currentAssignment}
                                onChange={(e) => handleAssignSection(bookedTime.id, slot.start, slot.end, e.target.value)}
                                disabled={isSaving || isFrozen}
                                className="flex-1 px-3 py-1.5 border border-border rounded text-sm disabled:opacity-50"
                              >
                                <option value="">{t('assign.notAssigned')}</option>
                                {sections.map((section) => (
                                  <option key={section.name} value={section.name}>{section.name}</option>
                                ))}
                              </select>
                              {isSaving && <span className="text-xs text-text-muted">{t('assign.saving')}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
