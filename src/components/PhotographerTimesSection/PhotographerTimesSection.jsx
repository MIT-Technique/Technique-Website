'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import TextField from "@mui/material/TextField";

export default function PhotographerTimesSection() {
  const locale = useLocale();
  const t = useTranslations('photographerTimes');

  // Time slots state
  const [times, setTimes] = useState([]);
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

  // Proposals state
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [processingProposalId, setProcessingProposalId] = useState(null);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTimes();
    fetchProposals();
  }, []);

  async function fetchTimes() {
    try {
      setTimesLoading(true);
      const res = await fetch('/api/photographer/times');
      const data = await res.json();
      setTimes(data.times || []);
    } catch (error) {
      console.error('Error fetching times:', error);
    } finally {
      setTimesLoading(false);
    }
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

  async function handleDeleteTime(timeId) {
    setDeletingTimeId(timeId);
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
        <div className={`p-4 rounded ${
          message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {message.text}
        </div>
      )}

      {/* Add Time Slot Form */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="font-medium mb-4">{t('addTime')}</h3>
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

      {/* Your Posted Times */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="font-medium mb-4">{t('yourTimes')}</h3>
        {timesLoading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : times.length === 0 ? (
          <p className="text-text-secondary text-sm">{t('noTimes')}</p>
        ) : (
          <div className="space-y-3">
            {times.map((time) => (
              <div
                key={time.id}
                className={`p-4 border rounded-lg ${
                  time.living_group_id
                    ? 'border-green-200 bg-green-50'
                    : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start">
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
                    {time.location && (
                      <p className="text-text-muted text-xs mt-1">{time.location}</p>
                    )}
                    {time.living_group && (
                      <p className="text-green-600 text-sm mt-2">
                        {t('bookedBy', { name: time.living_group.name })}
                      </p>
                    )}
                  </div>
                  {!time.living_group_id && (
                    <button
                      onClick={() => handleDeleteTime(time.id)}
                      disabled={deletingTimeId === time.id}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      {deletingTimeId === time.id ? '...' : t('delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Proposals from Living Groups */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="font-medium mb-4">{t('pendingProposals')}</h3>
        {proposalsLoading ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : proposals.length === 0 ? (
          <p className="text-text-secondary text-sm">{t('noProposals')}</p>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {proposal.living_group?.name || 'Unknown Living Group'}
                    </p>
                    <p className="text-text-secondary text-sm">
                      {new Date(proposal.date).toLocaleDateString(locale, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-text-secondary text-sm">
                      {proposal.start_time} - {proposal.end_time}
                    </p>
                    {proposal.location && (
                      <p className="text-text-muted text-xs mt-1">{t('location')}: {proposal.location}</p>
                    )}
                    {proposal.notes && (
                      <p className="text-text-muted text-xs mt-1">{t('notes')}: {proposal.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProposalAction(proposal.id, 'accept')}
                      disabled={processingProposalId === proposal.id}
                      className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {processingProposalId === proposal.id ? '...' : t('accept')}
                    </button>
                    <button
                      onClick={() => handleProposalAction(proposal.id, 'decline')}
                      disabled={processingProposalId === proposal.id}
                      className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {processingProposalId === proposal.id ? '...' : t('decline')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
