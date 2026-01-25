'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';
import TextField from "@mui/material/TextField";

// Strip seconds from time string (HH:MM:SS -> HH:MM)
function formatTime(time) {
  if (!time) return '';
  return time.slice(0, 5);
}

// MUI styling to match other forms
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

export default function LivingGroupPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('livingGroupPage');
  const { isLoggedIn, user, livingGroup, loading: userLoading, refetch } = useUser();

  // Tab state
  const [activeTab, setActiveTab] = useState('scheduling');

  // Scheduling state
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTime, setBookedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFrozen, setIsFrozen] = useState(false);

  // Members state
  const [membersData, setMembersData] = useState(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [expectedCountInputs, setExpectedCountInputs] = useState({});
  const [updatingExpected, setUpdatingExpected] = useState(null);

  // Join requests state (FSILGs only)
  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Time proposal state
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [proposalForm, setProposalForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [cancellingProposalId, setCancellingProposalId] = useState(null);

  // FSILG onboarding state (for adding first leader)
  const [leaderEmail, setLeaderEmail] = useState('');
  const [addingLeader, setAddingLeader] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 8;

  // Expanded time slots (to show location/notes)
  const [expandedTimeIds, setExpandedTimeIds] = useState(new Set());

  // Toggle expansion for a time slot
  function toggleTimeExpanded(timeId) {
    setExpandedTimeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(timeId)) {
        newSet.delete(timeId);
      } else {
        newSet.add(timeId);
      }
      return newSet;
    });
  }

  // Helper to get creator display name for time slots
  function getCreatorLabel(time) {
    if (!time?.creator) return t('unknownCreator');
    if (time.creator.role === 'admin') return 'TNQ Photo';
    const name = `${time.creator.first_name || ''} ${time.creator.last_name || ''}`.trim();
    return name || time.creator.email || t('unknownCreator');
  }

  useEffect(() => {
    if (!userLoading && (!isLoggedIn || user?.role !== 'living_group_leader')) {
      router.push(`/${locale}/login`);
    }
  }, [isLoggedIn, user, userLoading, router, locale]);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'living_group_leader') {
      fetchTimes();
      checkFrozen();
      fetchMembers();
      fetchProposals();
      if (livingGroup?.living_group_type === 'fsilg') {
        fetchJoinRequests();
      }
    }
  }, [isLoggedIn, user, livingGroup]);

  async function fetchTimes() {
    try {
      setLoading(true);
      const res = await fetch('/api/living-groups/times');
      const data = await res.json();
      setAvailableTimes(data.availableTimes || []);
      setBookedTime(data.bookedTime || null);
    } catch (error) {
      console.error('Error fetching times:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkFrozen() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      const frozen = data.frozenForms?.some(f => f.form_name === 'living_group_booking' && f.is_frozen);
      setIsFrozen(frozen || false);
    } catch (error) {
      console.error('Error checking frozen status:', error);
    }
  }

  async function handleBook(timeId) {
    if (isFrozen) return;

    setBooking(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('bookSuccess') });
        fetchTimes();
        refetch();
      } else {
        setMessage({ type: 'error', text: data.error || t('bookError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('bookError') });
    } finally {
      setBooking(false);
    }
  }

  async function handleCancelRequest() {
    if (isFrozen) return;

    const reason = prompt(t('cancelReason'));
    if (reason === null) return;

    setCancelling(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('cancelRequestSuccess') });
        fetchTimes();
      } else {
        setMessage({ type: 'error', text: data.error || t('cancelRequestError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('cancelRequestError') });
    } finally {
      setCancelling(false);
    }
  }

  async function fetchMembers() {
    try {
      setMembersLoading(true);
      const res = await fetch('/api/living-groups/members');
      const data = await res.json();
      setMembersData(data);

      // Initialize expected count inputs from data
      if (data.membersBySection) {
        const inputs = {};
        data.membersBySection.forEach((section) => {
          inputs[section.section.id] = section.expectedCount || 0;
        });
        setExpectedCountInputs(inputs);
      } else if (data.expectedCount !== undefined) {
        setExpectedCountInputs({ total: data.expectedCount });
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }
  }

  async function fetchJoinRequests() {
    try {
      setRequestsLoading(true);
      const res = await fetch('/api/living-groups/join-requests');
      const data = await res.json();
      setJoinRequests(data.joinRequests || []);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  }

  async function fetchProposals() {
    try {
      setProposalsLoading(true);
      const res = await fetch('/api/living-groups/propose-time');
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setProposalsLoading(false);
    }
  }

  async function handleSubmitProposal(e) {
    e.preventDefault();
    if (!proposalForm.date || !proposalForm.start_time || !proposalForm.end_time) {
      setMessage({ type: 'error', text: t('proposeTime.fieldsRequired') });
      return;
    }

    setSubmittingProposal(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/propose-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalForm),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('proposeTime.submitSuccess') });
        setProposalForm({
          date: '',
          start_time: '',
          end_time: '',
          location: '',
          notes: '',
        });
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
    setMessage({ type: '', text: '' });

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

  async function handleUpdateExpectedCount(sectionId) {
    setUpdatingExpected(sectionId);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/expected-counts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: sectionId === 'total' ? null : sectionId,
          expectedCount: parseInt(expectedCountInputs[sectionId]) || 0,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('members.updateSuccess') });
        fetchMembers();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t('members.updateError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('members.updateError') });
    } finally {
      setUpdatingExpected(null);
    }
  }

  async function handleJoinRequestAction(requestId, action) {
    setProcessingRequestId(requestId);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/approve-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId: requestId, action }),
      });

      if (res.ok) {
        setMessage({
          type: 'success',
          text: action === 'approve' ? t('joinRequests.approveSuccess') : t('joinRequests.denySuccess'),
        });
        fetchJoinRequests();
        fetchMembers();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t('joinRequests.actionError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('joinRequests.actionError') });
    } finally {
      setProcessingRequestId(null);
    }
  }

  // Handle adding first leader for FSILG onboarding
  async function handleAddFirstLeader() {
    if (!leaderEmail.trim()) {
      setMessage({ type: 'error', text: t('onboarding.emailRequired') });
      return;
    }

    setAddingLeader(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/add-first-leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentEmail: leaderEmail.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('onboarding.leaderAdded') });
        setLeaderEmail('');
        // Refetch user data to update livingGroup.has_leader
        refetch();
      } else {
        setMessage({ type: 'error', text: data.error || t('onboarding.addLeaderError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('onboarding.addLeaderError') });
    } finally {
      setAddingLeader(false);
    }
  }

  // Get available tabs based on living group type
  function getTabs() {
    const tabs = [{ id: 'scheduling', label: t('tabs.scheduling') }];
    tabs.push({ id: 'members', label: t('tabs.members') });
    if (livingGroup?.living_group_type === 'fsilg') {
      tabs.push({ id: 'joinRequests', label: t('tabs.joinRequests') });
    }
    return tabs;
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

  if (!isLoggedIn || user?.role !== 'living_group_leader') {
    return null;
  }

  // Check if disabled
  const isDisabled = livingGroup?.status === 'disabled';
  const tabs = getTabs();

  // Check if FSILG needs onboarding (no leader yet)
  const needsOnboarding = livingGroup?.living_group_type === 'fsilg' && !livingGroup?.has_leader;

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32 pb-12">
        <section className="container-text">
          <h1 className="mb-2">{t('title')}</h1>
          <p className="text-text-secondary mb-8">
            {t('welcome', { name: livingGroup?.name || user?.email })}
          </p>

          {/* Disabled Notice */}
          {isDisabled && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">{t('disabled')}</p>
              <p className="text-sm text-red-500 mt-1">{t('disabledHint')}</p>
            </div>
          )}

          {/* FSILG Onboarding - Add First Leader */}
          {needsOnboarding && !isDisabled && (
            <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800">
                {t('onboarding.title')}
              </h3>
              <p className="text-yellow-700 mt-2">
                {t('onboarding.description')}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <TextField
                  type="email"
                  placeholder={t('onboarding.studentEmailPlaceholder')}
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{
                    ...textFieldSx,
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      ...textFieldSx["& .MuiOutlinedInput-root"],
                      backgroundColor: "white",
                    },
                  }}
                />
                <button
                  onClick={handleAddFirstLeader}
                  disabled={addingLeader}
                  className="px-4 py-2 bg-[#750014] text-white rounded hover:bg-[#5C0010] disabled:opacity-50 whitespace-nowrap"
                >
                  {addingLeader ? t('onboarding.addingLeader') : t('onboarding.addLeader')}
                </button>
              </div>
            </div>
          )}

          {/* Frozen Notice */}
          {isFrozen && !isDisabled && !needsOnboarding && activeTab === 'scheduling' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">{t('frozen')}</p>
            </div>
          )}

          {message.text && (
            <div className={`mb-6 p-4 rounded ${
              message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

          {/* Tabs - Hidden during onboarding */}
          {!needsOnboarding && (
            <div className="flex gap-4 mb-8 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content - Hidden during onboarding */}
          {!needsOnboarding && (
            <>
          {/* Scheduling Tab */}
          {activeTab === 'scheduling' && (
            <>
              {/* Current Booking */}
              {bookedTime && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">{t('currentBooking')}</h2>
                  <div className={`p-4 border rounded-lg ${
                    bookedTime.cancellation_requested
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-green-200 bg-green-50'
                  }`}>
                    <p className="font-medium">
                      {new Date(bookedTime.date).toLocaleDateString(locale, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-text-secondary">
                      {formatTime(bookedTime.start_time)} - {formatTime(bookedTime.end_time)} EST
                    </p>
                    {bookedTime.cancellation_requested && (
                      <p className="text-yellow-600 text-sm mt-2">{t('cancellationPending')}</p>
                    )}
                    {!bookedTime.cancellation_requested && !isDisabled && !isFrozen && (
                      <button
                        onClick={handleCancelRequest}
                        disabled={cancelling}
                        className="mt-4 px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        {cancelling ? t('requesting') : t('requestCancel')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Available Times */}
              {!bookedTime && !isDisabled && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">{t('availableTimes')}</h3>
                    {availableTimes.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          className="p-1 text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Previous page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-sm text-text-secondary">
                          {currentPage + 1} / {Math.ceil(availableTimes.length / ITEMS_PER_PAGE)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(availableTimes.length / ITEMS_PER_PAGE) - 1, p + 1))}
                          disabled={currentPage >= Math.ceil(availableTimes.length / ITEMS_PER_PAGE) - 1}
                          className="p-1 text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Next page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {loading ? (
                    <p className="text-text-secondary text-sm">Loading...</p>
                  ) : availableTimes.length === 0 ? (
                    <p className="text-text-secondary text-sm">{t('noTimes')}</p>
                  ) : (
                    <div className="space-y-2">
                      {availableTimes.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((time) => {
                        const hasDetails = time.location || time.notes;
                        const isExpanded = expandedTimeIds.has(time.id);
                        return (
                          <div
                            key={time.id}
                            className={`px-3 py-2 border border-border rounded-lg ${hasDetails ? 'cursor-pointer' : ''}`}
                            onClick={hasDetails ? () => toggleTimeExpanded(time.id) : undefined}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {hasDetails && (
                                    <svg
                                      className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                  <span className="font-medium text-sm">
                                    {new Date(time.date).toLocaleDateString(locale, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  <span className="text-text-secondary text-sm">
                                    {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                                  </span>
                                </div>
                                <span className="text-text-muted text-xs">
                                  {t('postedBy', { name: getCreatorLabel(time) })}
                                </span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleBook(time.id); }}
                                disabled={booking || isFrozen}
                                className="btn-primary text-sm flex-shrink-0"
                              >
                                {booking ? t('booking') : t('book')}
                              </button>
                            </div>
                            {/* Expandable details */}
                            {isExpanded && hasDetails && (
                              <div className="mt-2 pt-2 border-t border-border/50 text-xs text-text-muted space-y-0.5">
                                {time.location && <p><span className="font-medium">{t('locationLabel')}:</span> {time.location}</p>}
                                {time.notes && <p><span className="font-medium">{t('notesLabel')}:</span> {time.notes}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Propose Time Section */}
              {!bookedTime && !isDisabled && (
                <div className="mt-8">
                  <div className="bg-white border border-border rounded-lg p-6">
                    <h3 className="font-medium mb-2">{t('proposeTime.title')}</h3>
                    <p className="text-text-secondary text-sm mb-2">{t('proposeTime.description')}</p>
                    <p className="text-text-muted text-xs mb-4">{t('proposeTime.timezoneNote')}</p>

                    <form onSubmit={handleSubmitProposal} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextField
                          type="date"
                          label={t('proposeTime.date')}
                          value={proposalForm.date}
                          onChange={(e) => setProposalForm({ ...proposalForm, date: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          required
                          size="small"
                          fullWidth
                          sx={textFieldSx}
                        />
                        <TextField
                          type="time"
                          label={t('proposeTime.startTime')}
                          value={proposalForm.start_time}
                          onChange={(e) => setProposalForm({ ...proposalForm, start_time: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          required
                          size="small"
                          fullWidth
                          sx={textFieldSx}
                        />
                        <TextField
                          type="time"
                          label={t('proposeTime.endTime')}
                          value={proposalForm.end_time}
                          onChange={(e) => setProposalForm({ ...proposalForm, end_time: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          required
                          size="small"
                          fullWidth
                          sx={textFieldSx}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                          label={t('proposeTime.location')}
                          value={proposalForm.location}
                          onChange={(e) => setProposalForm({ ...proposalForm, location: e.target.value })}
                          size="small"
                          fullWidth
                          sx={textFieldSx}
                        />
                        <TextField
                          label={t('proposeTime.notes')}
                          value={proposalForm.notes}
                          onChange={(e) => setProposalForm({ ...proposalForm, notes: e.target.value })}
                          size="small"
                          fullWidth
                          sx={textFieldSx}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingProposal || isFrozen}
                        className="btn-primary text-sm"
                      >
                        {submittingProposal ? t('proposeTime.submitting') : t('proposeTime.submit')}
                      </button>
                    </form>
                  </div>

                  {/* Your Proposals */}
                  <div className="bg-white border border-border rounded-lg p-6 mt-6">
                    <h3 className="font-medium mb-4">{t('proposeTime.yourProposals')}</h3>
                    {proposalsLoading ? (
                      <p className="text-text-secondary text-sm">Loading...</p>
                    ) : proposals.length === 0 ? (
                      <p className="text-text-secondary text-sm">{t('proposeTime.noProposals')}</p>
                    ) : (
                      <div className="space-y-3">
                        {proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className={`p-4 border rounded-lg ${
                              proposal.status === 'pending'
                                ? 'border-yellow-200 bg-yellow-50'
                                : proposal.status === 'accepted'
                                ? 'border-green-200 bg-green-50'
                                : proposal.status === 'declined'
                                ? 'border-red-200 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {new Date(proposal.date).toLocaleDateString(locale, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                                <p className="text-text-secondary text-sm">
                                  {formatTime(proposal.start_time)} - {formatTime(proposal.end_time)} EST
                                </p>
                                {proposal.location && (
                                  <p className="text-text-muted text-xs mt-1">{proposal.location}</p>
                                )}
                                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                                  proposal.status === 'pending'
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : proposal.status === 'accepted'
                                    ? 'bg-green-200 text-green-800'
                                    : proposal.status === 'declined'
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-gray-200 text-gray-800'
                                }`}>
                                  {t(`proposeTime.status.${proposal.status}`)}
                                </span>
                                {proposal.status === 'declined' && proposal.decline_reason && (
                                  <p className="text-red-600 text-xs mt-1">{proposal.decline_reason}</p>
                                )}
                                {proposal.status === 'accepted' && proposal.accepter && (
                                  <p className="text-green-600 text-xs mt-1">
                                    {t('proposeTime.acceptedBy', {
                                      name: `${proposal.accepter.first_name || ''} ${proposal.accepter.last_name || ''}`.trim() || proposal.accepter.email,
                                    })}
                                  </p>
                                )}
                              </div>
                              {proposal.status === 'pending' && !isFrozen && (
                                <button
                                  onClick={() => handleCancelProposal(proposal.id)}
                                  disabled={cancellingProposalId === proposal.id}
                                  className="text-sm text-red-600 hover:text-red-700"
                                >
                                  {cancellingProposalId === proposal.id ? '...' : t('proposeTime.cancel')}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <h2 className="text-lg font-medium mb-4">{t('members.title')}</h2>

              {membersLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : membersData?.membersBySection ? (
                // Dorm view - grouped by section
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm text-text-secondary mb-4">
                    <span>{t('members.totalMembers', { count: membersData.totalMembers || 0 })}</span>
                    <span>{t('members.totalExpected', { count: membersData.totalExpected || 0 })}</span>
                  </div>

                  {membersData.membersBySection.map((sectionData) => (
                    <div key={sectionData.section.id} className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-bg-secondary px-4 py-3 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{sectionData.section.section_name}</h3>
                          <p className="text-sm text-text-secondary">
                            {t('members.memberCount', { count: sectionData.memberCount })} •{' '}
                            {t('members.expectedCount', { count: sectionData.expectedCount || 0 })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <TextField
                            size="small"
                            type="number"
                            value={expectedCountInputs[sectionData.section.id] || 0}
                            onChange={(e) => setExpectedCountInputs({
                              ...expectedCountInputs,
                              [sectionData.section.id]: e.target.value,
                            })}
                            sx={{ width: 80 }}
                            inputProps={{ min: 0 }}
                          />
                          <button
                            onClick={() => handleUpdateExpectedCount(sectionData.section.id)}
                            disabled={updatingExpected === sectionData.section.id}
                            className="text-sm px-3 py-1 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                          >
                            {updatingExpected === sectionData.section.id ? '...' : t('members.updateExpected')}
                          </button>
                        </div>
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
              ) : membersData?.members ? (
                // FSILG view - flat list
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-text-secondary">
                      {t('members.totalMembers', { count: membersData.totalMembers || 0 })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-secondary">{t('members.setExpected')}:</span>
                      <TextField
                        size="small"
                        type="number"
                        value={expectedCountInputs['total'] || 0}
                        onChange={(e) => setExpectedCountInputs({
                          ...expectedCountInputs,
                          total: e.target.value,
                        })}
                        sx={{ width: 80 }}
                        inputProps={{ min: 0 }}
                      />
                      <button
                        onClick={() => handleUpdateExpectedCount('total')}
                        disabled={updatingExpected === 'total'}
                        className="text-sm px-3 py-1 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                      >
                        {updatingExpected === 'total' ? '...' : t('members.updateExpected')}
                      </button>
                    </div>
                  </div>

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
          {activeTab === 'joinRequests' && livingGroup?.living_group_type === 'fsilg' && (
            <div>
              <h2 className="text-lg font-medium mb-4">{t('joinRequests.title')}</h2>

              {requestsLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : joinRequests.length === 0 ? (
                <p className="text-text-secondary">{t('joinRequests.noRequests')}</p>
              ) : (
                <div className="space-y-3">
                  {joinRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {request.user?.first_name} {request.user?.last_name}
                        </p>
                        <p className="text-text-secondary text-sm">{request.user?.email}</p>
                        <p className="text-text-muted text-xs mt-1">
                          {new Date(request.joined_at).toLocaleDateString(locale)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinRequestAction(request.id, 'approve')}
                          disabled={processingRequestId === request.id}
                          className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {processingRequestId === request.id ? t('joinRequests.approving') : t('joinRequests.approve')}
                        </button>
                        <button
                          onClick={() => handleJoinRequestAction(request.id, 'deny')}
                          disabled={processingRequestId === request.id}
                          className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processingRequestId === request.id ? t('joinRequests.denying') : t('joinRequests.deny')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
