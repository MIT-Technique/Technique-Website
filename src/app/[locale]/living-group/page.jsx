'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';
import TextField from "@mui/material/TextField";

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

          {/* Frozen Notice */}
          {isFrozen && !isDisabled && activeTab === 'scheduling' && (
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

          {/* Tabs */}
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
                      {bookedTime.start_time} - {bookedTime.end_time}
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
                <div>
                  <h2 className="text-lg font-medium mb-4">{t('availableTimes')}</h2>
                  {loading ? (
                    <p className="text-text-secondary">Loading...</p>
                  ) : availableTimes.length === 0 ? (
                    <p className="text-text-secondary">{t('noTimes')}</p>
                  ) : (
                    <div className="space-y-3">
                      {availableTimes.map((time) => (
                        <div
                          key={time.id}
                          className="p-4 border border-border rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {new Date(time.date).toLocaleDateString(locale, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-text-secondary text-sm">
                              {time.start_time} - {time.end_time}
                            </p>
                          </div>
                          <button
                            onClick={() => handleBook(time.id)}
                            disabled={booking || isFrozen}
                            className="btn-primary text-sm"
                          >
                            {booking ? t('booking') : t('book')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
        </section>
      </main>
      <Footer />
    </>
  );
}
