'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const HOUR_START = 0;

export function timeToRow(timeStr) {
  if (!timeStr) return 1;
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return (h - HOUR_START) * 4 + Math.floor(m / 15) + 1;
}

const TYPE_STYLES = {
  available: 'border-blue-200 bg-blue-50 text-blue-900',
  booked: 'border-green-200 bg-green-50 text-green-900',
  proposal: 'border-yellow-200 bg-yellow-50 text-yellow-900',
};

const TYPE_BADGE = {
  available: 'bg-blue-100 text-blue-700',
  booked: 'bg-green-100 text-green-700',
  proposal: 'bg-yellow-100 text-yellow-700',
};

export default function TimelineSlot({
  slot,
  type,
  compact = false,
  role,
  currentUserId,
  frozen = false,
  isOwn = false,
  formatTime,
  onBook,
  onDelete,
  onAcceptProposal,
  onDeclineProposal,
  onCancelBooking,
}) {
  const t = useTranslations('calendarView');
  const [processing, setProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAdmin = role === 'admin';
  const isAdminOrPhotographer = role === 'admin' || role === 'photographer';
  const isLivingGroup = role === 'living_group';

  // Living groups see other groups' proposals as gray
  const isOtherProposal = type === 'proposal' && isLivingGroup && !isOwn;
  const styles = isOtherProposal ? 'border-gray-200 bg-gray-50 text-gray-900' : TYPE_STYLES[type];
  const badgeStyles = isOtherProposal ? 'bg-gray-100 text-gray-700' : TYPE_BADGE[type];

  function getCreatorLabel() {
    const creator = slot?.creator || slot?.created_by_user;
    if (!creator) return t('unknown');
    if (creator.role === 'admin') return 'TNQ Photo';
    return creator.name || creator.email || t('unknown');
  }

  function getBookerLabel() {
    const booker = slot?.booked_by_user || slot?.created_by_user || slot?.creator;
    if (!booker) return t('unknown');
    return booker.email || t('unknown');
  }

  async function handleAction(fn, ...args) {
    if (!fn) return;
    setProcessing(true);
    try {
      await fn(...args);
    } finally {
      setProcessing(false);
    }
  }

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setConfirmDelete(false);
    handleAction(onDelete, slot.id);
  }

  async function handleDecline() {
    const reason = prompt(t('declineReasonPrompt'));
    if (reason === null) return;
    await handleAction(onDeclineProposal, slot.id, reason);
  }

  if (compact) {
    return (
      <div
        className={`border rounded text-[10px] px-1 py-0.5 overflow-hidden leading-tight cursor-pointer h-full ${styles}${isOwn ? ' !border-l-[3px] !border-l-accent' : ''}`}
      >
        <span className="font-medium">
          {formatTime(slot.start_time)}
        </span>
        {slot.living_group?.name && (
          <span className="block truncate opacity-75">{slot.living_group.name}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg px-3 py-1.5 overflow-hidden text-sm h-full ${styles}${isOwn ? ' !border-l-[3px] !border-l-accent' : ''}`}
    >
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium whitespace-nowrap">
            {formatTime(slot.start_time)} - {formatTime(slot.end_time)} EST
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeStyles}`}>
            {t(type === 'available' ? 'available' : type === 'booked' ? 'booked' : 'pending')}
          </span>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {type === 'available' && isLivingGroup && !frozen && (
            <button
              onClick={() => handleAction(onBook, slot.id)}
              disabled={processing}
              className="text-xs px-2 py-0.5 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
            >
              {processing ? '...' : t('book')}
            </button>
          )}
          {type === 'booked' && isLivingGroup && !frozen && (
            <button
              onClick={() => handleAction(onCancelBooking, slot.id)}
              disabled={processing}
              className="text-xs text-red-600 hover:text-red-700"
            >
              {processing ? '...' : t('cancel')}
            </button>
          )}
          {type === 'available' && isAdminOrPhotographer && (isAdmin || slot.created_by === currentUserId) && (
            <button
              onClick={handleDeleteClick}
              disabled={processing}
              className={`text-xs ${confirmDelete ? 'text-red-700 font-medium' : 'text-red-600 hover:text-red-700'}`}
            >
              {processing ? '...' : confirmDelete ? t('confirmAction') : t('deleteSlot')}
            </button>
          )}
          {type === 'booked' && isAdmin && (
            <button
              onClick={handleDeleteClick}
              disabled={processing}
              className={`text-xs ${confirmDelete ? 'text-red-700 font-medium' : 'text-red-600 hover:text-red-700'}`}
            >
              {processing ? '...' : confirmDelete ? t('confirmAction') : t('deleteSlot')}
            </button>
          )}
          {type === 'proposal' && isAdminOrPhotographer && (
            <>
              <button
                onClick={() => handleAction(onAcceptProposal, slot.id)}
                disabled={processing}
                className="text-xs px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? '...' : t('accept')}
              </button>
              <button
                onClick={handleDecline}
                disabled={processing}
                className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? '...' : t('decline')}
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-xs opacity-75 mt-0.5 leading-snug truncate">
        {type === 'proposal'
          ? <span className="font-medium">{slot.living_group?.name || t('unknown')}</span>
          : type === 'booked'
            ? <><span className="font-medium">{slot.living_group?.name || t('booked')}</span>{' · '}{t('bookedBy', { name: getBookerLabel() })}</>
            : <>{t('postedBy')} {getCreatorLabel()}</>
        }
        {slot.location && <>{' · '}{slot.location}</>}
        {slot.notes && <>{' · '}<span className="italic">{slot.notes}</span></>}
      </p>
    </div>
  );
}
