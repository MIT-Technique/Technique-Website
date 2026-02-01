'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import CreateSlotForm from './CreateSlotForm';

export default function DaySidePanel({
  date,
  times = [],
  proposals = [],
  role,
  currentUserId,
  onClose,
  onBook,
  onCreate,
  onDelete,
  onAcceptProposal,
  onDeclineProposal,
  onCancelBooking,
  onPropose,
  frozen = false,
  formatTime,
}) {
  const locale = useLocale();
  const t = useTranslations('calendarView');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const isAdminOrPhotographer = role === 'admin' || role === 'photographer';
  const isLivingGroup = role === 'living_group';

  const availableTimes = times.filter((t) => !t.living_group_id && !t.cancelled_at);
  const bookedTimes = times.filter((t) => t.living_group_id && !t.cancelled_at);

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isPast = new Date(date) < new Date(new Date().toISOString().split('T')[0]);

  async function handleBook(timeId) {
    if (!onBook) return;
    setProcessingId(timeId);
    try {
      await onBook(timeId);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(timeId) {
    if (!onDelete) return;
    if (confirmDeleteId !== timeId) {
      setConfirmDeleteId(timeId);
      setTimeout(() => setConfirmDeleteId((prev) => (prev === timeId ? null : prev)), 3000);
      return;
    }
    setConfirmDeleteId(null);
    setProcessingId(timeId);
    try {
      await onDelete(timeId);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCancelBooking(timeId) {
    if (!onCancelBooking) return;
    setProcessingId(timeId);
    try {
      await onCancelBooking(timeId);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleAcceptProposal(proposalId) {
    if (!onAcceptProposal) return;
    setProcessingId(proposalId);
    try {
      await onAcceptProposal(proposalId);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeclineProposal(proposalId) {
    if (!onDeclineProposal) return;
    const reason = prompt(t('declineReasonPrompt'));
    if (reason === null) return;
    setProcessingId(proposalId);
    try {
      await onDeclineProposal(proposalId, reason);
    } finally {
      setProcessingId(null);
    }
  }

  function getCreatorLabel(time) {
    const creator = time?.creator || time?.created_by_user;
    if (!creator) return t('unknown');
    if (creator.role === 'admin') return 'TNQ Photo';
    return creator.name || creator.email || t('unknown');
  }

  async function handleCreate(formData) {
    if (!onCreate) return;
    await onCreate({ ...formData, date });
    setShowCreateForm(false);
  }

  async function handlePropose(formData) {
    if (!onPropose) return;
    await onPropose({
      date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      location: formData.location,
      notes: formData.notes,
    });
    setShowProposeForm(false);
  }

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute top-0 right-0 w-[360px] max-w-full z-20 bg-white border border-border rounded-lg shadow-lg"
    >
      <div className="w-full max-h-[500px] overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium text-sm">{dateLabel}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {availableTimes.length + bookedTimes.length} {t('slots')} &middot; {proposals.length} {t('proposals')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-secondary text-text-secondary"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create slot button/form (admin/photographer) */}
        {isAdminOrPhotographer && !isPast && (
          <div className="mb-4">
            {showCreateForm ? (
              <CreateSlotForm
                date={date}
                onSubmit={handleCreate}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-2 text-sm border border-dashed border-accent/40 text-accent rounded-lg hover:bg-accent/5 transition-colors"
              >
                + {t('addSlot')}
              </button>
            )}
          </div>
        )}

        {/* Propose time button/form (living group) */}
        {isLivingGroup && !frozen && !isPast && onPropose && (
          <div className="mb-4">
            {showProposeForm ? (
              <CreateSlotForm
                date={date}
                onSubmit={handlePropose}
                onCancel={() => setShowProposeForm(false)}
                submitLabel={t('proposeSlot')}
              />
            ) : (
              <button
                onClick={() => setShowProposeForm(true)}
                className="w-full py-2 text-sm border border-dashed border-accent/40 text-accent rounded-lg hover:bg-accent/5 transition-colors"
              >
                + {t('proposeTime')}
              </button>
            )}
          </div>
        )}

        {/* Booked Times */}
        {bookedTimes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-muted uppercase mb-2">{t('booked')}</h4>
            <div className="space-y-2">
              {bookedTimes.map((time) => (
                <div key={time.id} className="px-3 py-2 border border-green-200 bg-green-50 rounded-lg text-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-medium pb-0">
                      {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                    </p>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      {isLivingGroup && !frozen && (
                        <button
                          onClick={() => handleCancelBooking(time.id)}
                          disabled={processingId === time.id}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          {processingId === time.id ? '...' : t('cancel')}
                        </button>
                      )}
                      {role === 'admin' && (
                        <button
                          onClick={() => handleDelete(time.id)}
                          disabled={processingId === time.id}
                          className={`text-xs ${confirmDeleteId === time.id ? 'text-red-700 font-medium' : 'text-red-600 hover:text-red-700'}`}
                        >
                          {processingId === time.id ? '...' : confirmDeleteId === time.id ? t('confirmAction') : t('deleteSlot')}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 leading-snug">
                    {t('postedBy')} {getCreatorLabel(time)}
                    {' · '}<span className="text-green-700 font-medium">{time.living_group?.name || t('booked')}</span>
                    {time.location && <>{' · '}{time.location}</>}
                    {time.notes && <>{' · '}<span className="italic">{time.notes}</span></>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Times */}
        {availableTimes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-muted uppercase mb-2">{t('available')}</h4>
            <div className="space-y-2">
              {availableTimes.map((time) => (
                <div key={time.id} className="px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-medium pb-0">
                      {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                    </p>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      {isLivingGroup && !frozen && !isPast && (
                        <button
                          onClick={() => handleBook(time.id)}
                          disabled={processingId === time.id}
                          className="text-xs px-2.5 py-1 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                        >
                          {processingId === time.id ? '...' : t('book')}
                        </button>
                      )}
                      {isAdminOrPhotographer && (
                        <>
                          {(role === 'admin' || (time.created_by === currentUserId)) && (
                            <button
                              onClick={() => handleDelete(time.id)}
                              disabled={processingId === time.id}
                              className={`text-xs ${confirmDeleteId === time.id ? 'text-red-700 font-medium' : 'text-red-600 hover:text-red-700'}`}
                            >
                              {processingId === time.id ? '...' : confirmDeleteId === time.id ? t('confirmAction') : t('deleteSlot')}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 leading-snug">
                    {t('postedBy')} {getCreatorLabel(time)}
                    {time.location && <>{' · '}{time.location}</>}
                    {time.notes && <>{' · '}<span className="italic">{time.notes}</span></>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proposals */}
        {proposals.length > 0 && isAdminOrPhotographer && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-muted uppercase mb-2">{t('pending')}</h4>
            <div className="space-y-2">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="px-3 py-2 border border-yellow-200 bg-yellow-50 rounded-lg text-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-medium pb-0">
                      {formatTime(proposal.start_time)} - {formatTime(proposal.end_time)} EST
                    </p>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleAcceptProposal(proposal.id)}
                        disabled={processingId === proposal.id}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingId === proposal.id ? '...' : t('accept')}
                      </button>
                      <button
                        onClick={() => handleDeclineProposal(proposal.id)}
                        disabled={processingId === proposal.id}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {processingId === proposal.id ? '...' : t('decline')}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 leading-snug">
                    <span className="text-yellow-700 font-medium">{proposal.living_group?.name || t('unknown')}</span>
                    {proposal.location && <>{' · '}{proposal.location}</>}
                    {proposal.notes && <>{' · '}<span className="italic">{proposal.notes}</span></>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {availableTimes.length === 0 && bookedTimes.length === 0 && proposals.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">{t('noSlots')}</p>
        )}
      </div>
    </motion.div>
  );
}
