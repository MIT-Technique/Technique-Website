'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import TextField from "@mui/material/TextField";
import CalendarView from '../CalendarView/CalendarView';

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

export default function PhotographerTimesSection() {
  const locale = useLocale();
  const t = useTranslations('photographerTimes');

  // Time slots state
  const [times, setTimes] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [timesLoading, setTimesLoading] = useState(true);
  const [timeForm, setTimeForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
  });
  const [submittingTime, setSubmittingTime] = useState(false);
  const [deletingTimeId, setDeletingTimeId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  // Proposals state
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [processingProposalId, setProcessingProposalId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 8;

  // Expanded time slots (to show location/notes)
  const [expandedTimeIds, setExpandedTimeIds] = useState(new Set());
  const [expandedProposalIds, setExpandedProposalIds] = useState(new Set());

  const [message, setMessage] = useState({ type: '', text: '' });
  const [messageFading, setMessageFading] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');
  const tc = useTranslations('calendarView');

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

  // Toggle expansion for a proposal
  function toggleProposalExpanded(proposalId) {
    setExpandedProposalIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(proposalId)) {
        newSet.delete(proposalId);
      } else {
        newSet.add(proposalId);
      }
      return newSet;
    });
  }

  useEffect(() => {
    fetchTimes();
    fetchProposals();
  }, []);

  // Auto-fade success messages
  useEffect(() => {
    if (message.type === 'success' && message.text) {
      setMessageFading(false);
      const fadeTimer = setTimeout(() => setMessageFading(true), 3000);
      const clearTimer = setTimeout(() => { setMessage({ type: '', text: '' }); setMessageFading(false); }, 3500);
      return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
    }
  }, [message]);

  async function fetchTimes() {
    try {
      setTimesLoading(true);
      const res = await fetch('/api/photographer/times');
      const data = await res.json();
      setTimes(data.times || []);
      setCurrentUserId(data.currentUserId || null);
    } catch (error) {
      console.error('Error fetching times:', error);
    } finally {
      setTimesLoading(false);
    }
  }

  // Helper to get creator display name
  function getCreatorLabel(time) {
    if (!time.creator) return t('unknownCreator');
    if (time.creator.role === 'admin') return 'TNQ Photo';
    const name = time.creator.name || '';
    return name || time.creator.email || t('unknownCreator');
  }

  async function fetchProposals() {
    try {
      setProposalsLoading(true);
      const res = await fetch('/api/photographer/proposals');
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setProposalsLoading(false);
    }
  }

  async function handleSubmitTime(e) {
    e.preventDefault();
    if (!timeForm.date || !timeForm.start_time || !timeForm.end_time) {
      setMessage({ type: 'error', text: t('fieldsRequired') });
      return;
    }

    setSubmittingTime(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/photographer/times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeForm),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('addSuccess') });
        setTimeForm({
          date: '',
          start_time: '',
          end_time: '',
          location: '',
          notes: '',
        });
        fetchTimes();
      } else {
        setMessage({ type: 'error', text: data.error || t('addError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('addError') });
    } finally {
      setSubmittingTime(false);
    }
  }

  function handleDeleteClick(e, timeId) {
    e.stopPropagation();
    if (confirmingDeleteId === timeId) {
      // Second click - actually delete
      handleDeleteTime(timeId);
    } else {
      // First click - show confirmation
      setConfirmingDeleteId(timeId);
      // Auto-clear confirmation after 3 seconds
      setTimeout(() => {
        setConfirmingDeleteId(prev => prev === timeId ? null : prev);
      }, 3000);
    }
  }

  async function handleDeleteTime(timeId) {
    setDeletingTimeId(timeId);
    setConfirmingDeleteId(null);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/photographer/times?id=${timeId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('deleteSuccess') });
        fetchTimes();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t('deleteError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('deleteError') });
    } finally {
      setDeletingTimeId(null);
    }
  }

  async function handleProposalAction(proposalId, action) {
    setProcessingProposalId(proposalId);
    setMessage({ type: '', text: '' });

    const declineReason = action === 'decline' ? prompt(t('declineReasonPrompt')) : null;
    if (action === 'decline' && declineReason === null) {
      setProcessingProposalId(null);
      return;
    }

    try {
      const res = await fetch('/api/photographer/proposals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, action, decline_reason: declineReason }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: action === 'accept' ? t('acceptSuccess') : t('declineSuccess'),
        });
        fetchProposals();
        if (action === 'accept') {
          fetchTimes(); // Refresh times since a new one was created
        }
      } else {
        setMessage({ type: 'error', text: data.error || t('actionError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('actionError') });
    } finally {
      setProcessingProposalId(null);
    }
  }

  return (
    <div className="space-y-8">
      {message.text && (
        <div
          className={`p-4 rounded ${
            message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}
          style={{ transition: 'opacity 500ms ease-out', opacity: messageFading ? 0 : 1 }}
        >
          {message.text}
        </div>
      )}

      {/* Add Time Slot Form */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="font-medium mb-4">{t('addTime')}</h3>
        <p className="text-text-muted text-xs mb-4">{t('timezoneNote')}</p>
        <form onSubmit={handleSubmitTime} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              type="date"
              label={t('date')}
              value={timeForm.date}
              onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              size="small"
              fullWidth
            />
            <TextField
              type="time"
              label={t('startTime')}
              value={timeForm.start_time}
              onChange={(e) => setTimeForm({ ...timeForm, start_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              size="small"
              fullWidth
            />
            <TextField
              type="time"
              label={t('endTime')}
              value={timeForm.end_time}
              onChange={(e) => setTimeForm({ ...timeForm, end_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              size="small"
              fullWidth
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label={t('location')}
              value={timeForm.location}
              onChange={(e) => setTimeForm({ ...timeForm, location: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label={t('notes')}
              value={timeForm.notes}
              onChange={(e) => setTimeForm({ ...timeForm, notes: e.target.value })}
              size="small"
              fullWidth
            />
          </div>
          <button
            type="submit"
            disabled={submittingTime}
            className="btn-primary text-sm"
          >
            {submittingTime ? t('adding') : t('addTimeButton')}
          </button>
        </form>
      </div>

      {/* All Posted Times */}
      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{t('allTimes')}</h3>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded border border-border overflow-hidden">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 text-xs ${viewMode === 'calendar' ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'}`}
              >
                {tc('calendar')}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'}`}
              >
                {tc('list')}
              </button>
            </div>
            {viewMode === 'list' && times.length > ITEMS_PER_PAGE && (
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
                  {currentPage + 1} / {Math.ceil(times.length / ITEMS_PER_PAGE)}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(times.length / ITEMS_PER_PAGE) - 1, p + 1))}
                  disabled={currentPage >= Math.ceil(times.length / ITEMS_PER_PAGE) - 1}
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
        </div>
        {viewMode === 'calendar' ? (
          <CalendarView
            role="photographer"
            times={times}
            proposals={proposals}
            currentUserId={currentUserId}
            loading={timesLoading}
            onCreate={async (formData) => {
              const res = await fetch('/api/photographer/times', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: formData.date,
                  start_time: formData.startTime,
                  end_time: formData.endTime,
                  location: formData.location || '',
                  notes: formData.notes || '',
                }),
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create');
              }
              setMessage({ type: 'success', text: t('addSuccess') });
              fetchTimes();
            }}
            onDelete={async (timeId) => {
              const res = await fetch(`/api/photographer/times?id=${timeId}`, { method: 'DELETE' });
              if (res.ok) {
                setMessage({ type: 'success', text: t('deleteSuccess') });
                fetchTimes();
              }
            }}
            onAcceptProposal={async (proposalId) => {
              const res = await fetch('/api/photographer/proposals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalId, action: 'accept' }),
              });
              if (res.ok) {
                setMessage({ type: 'success', text: t('acceptSuccess') });
                fetchProposals();
                fetchTimes();
              }
            }}
            onDeclineProposal={async (proposalId, reason) => {
              const res = await fetch('/api/photographer/proposals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalId, action: 'decline', decline_reason: reason }),
              });
              if (res.ok) {
                setMessage({ type: 'success', text: t('declineSuccess') });
                fetchProposals();
              }
            }}
          />
        ) : (
          <>
            {timesLoading ? (
              <p className="text-text-secondary text-sm">Loading...</p>
            ) : times.length === 0 ? (
              <p className="text-text-secondary text-sm">{t('noTimes')}</p>
            ) : (
              <div className="space-y-2">
                {times.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((time) => {
                  const hasDetails = time.location || time.notes;
                  const isExpanded = expandedTimeIds.has(time.id);
                  return (
                    <div
                      key={time.id}
                      className={`px-3 py-2 border rounded-lg ${
                        time.living_group_id
                          ? 'border-green-200 bg-green-50'
                          : 'border-border'
                      } ${hasDetails ? 'cursor-pointer' : ''}`}
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
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-text-muted text-xs">
                            {t('postedBy', { name: getCreatorLabel(time) })}
                          </span>
                          {time.living_group && (
                            <span className="text-green-600 text-xs font-medium">
                              {t('bookedBy', { name: time.living_group.name })}
                            </span>
                          )}
                          {!time.living_group_id && time.created_by === currentUserId && (
                            <button
                              onClick={(e) => handleDeleteClick(e, time.id)}
                              disabled={deletingTimeId === time.id}
                              className={`text-xs ${confirmingDeleteId === time.id ? 'text-red-700 font-medium' : 'text-red-600 hover:text-red-700'}`}
                            >
                              {deletingTimeId === time.id ? '...' : confirmingDeleteId === time.id ? t('confirm') : t('delete')}
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Expandable details */}
                      {isExpanded && hasDetails && (
                        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-text-muted space-y-0.5">
                          {time.location && <p><span className="font-medium">Location:</span> {time.location}</p>}
                          {time.notes && <p><span className="font-medium">Notes:</span> {time.notes}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Proposed Timeslots from Living Groups */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="font-medium mb-4">{t('pendingProposals')}</h3>
        {proposalsLoading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : proposals.length === 0 ? (
          <p className="text-text-secondary text-sm">{t('noProposals')}</p>
        ) : (
          <div className="space-y-2">
            {proposals.map((proposal) => {
              const hasDetails = proposal.location || proposal.notes;
              const isExpanded = expandedProposalIds.has(proposal.id);
              return (
                <div
                  key={proposal.id}
                  className={`px-3 py-2 border border-yellow-200 bg-yellow-50 rounded-lg ${hasDetails ? 'cursor-pointer' : ''}`}
                  onClick={hasDetails ? () => toggleProposalExpanded(proposal.id) : undefined}
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
                          {new Date(proposal.date).toLocaleDateString(locale, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-text-secondary text-sm">
                          {formatTime(proposal.start_time)} - {formatTime(proposal.end_time)} EST
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-text-muted text-xs">
                        {proposal.living_group?.name || 'Unknown Living Group'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleProposalAction(proposal.id, 'accept'); }}
                        disabled={processingProposalId === proposal.id}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingProposalId === proposal.id ? '...' : t('accept')}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleProposalAction(proposal.id, 'decline'); }}
                        disabled={processingProposalId === proposal.id}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {processingProposalId === proposal.id ? '...' : t('decline')}
                      </button>
                    </div>
                  </div>
                  {/* Expandable details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-2 pt-2 border-t border-yellow-200/50 text-xs text-text-muted space-y-0.5">
                      {proposal.location && <p><span className="font-medium">Location:</span> {proposal.location}</p>}
                      {proposal.notes && <p><span className="font-medium">Notes:</span> {proposal.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
