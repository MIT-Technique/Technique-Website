'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { formatTimeDisplay } from '../../lib/utils/time';
import { SECTION_COLORS } from './SectionAssignmentTimeline';

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
  sectionAssignments,
}) {
  const t = useTranslations('calendarView');
  const [processing, setProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

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
    return creator.name || creator.email || t('unknown');
  }

  function getCreatorEmail() {
    const creator = slot?.creator || slot?.created_by_user;
    return creator?.email || null;
  }

  function getLg() {
    const lg = slot?.living_group;
    return Array.isArray(lg) ? lg[0] : lg;
  }

  function getLivingGroupEmail() {
    const lg = getLg();
    const user = Array.isArray(lg?.user) ? lg.user[0] : lg?.user;
    return user?.email || null;
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

  // Compute colored bands for section assignments (used in both compact and expanded views)
  const sectionBands = useMemo(() => {
    if (!sectionAssignments || Object.keys(sectionAssignments).length === 0) return null;
    const allSections = [...new Set(Object.values(sectionAssignments).filter(Boolean))].sort();
    if (allSections.length === 0) return null;

    const [sH, sM] = slot.start_time.slice(0, 5).split(':').map(Number);
    const [eH, eM] = slot.end_time.slice(0, 5).split(':').map(Number);
    const totalStart = sH * 60 + sM;
    const totalEnd = eH * 60 + eM;
    const totalDuration = totalEnd - totalStart;
    if (totalDuration <= 0) return null;

    const entries = [];
    for (const [key, section] of Object.entries(sectionAssignments)) {
      if (!section) continue;
      const [startStr, endStr] = key.split('-');
      const [bsH, bsM] = startStr.split(':').map(Number);
      const [beH, beM] = endStr.split(':').map(Number);
      entries.push({ section, startMin: bsH * 60 + bsM, endMin: beH * 60 + beM, startStr, endStr });
    }
    entries.sort((a, b) => a.startMin - b.startMin);

    const merged = [];
    for (const e of entries) {
      const last = merged.length > 0 ? merged[merged.length - 1] : null;
      if (last && last.section === e.section && last.endMin === e.startMin) {
        last.endMin = e.endMin;
        last.endStr = e.endStr;
      } else {
        merged.push({ ...e });
      }
    }

    const bands = merged.map((r) => {
      const top = ((r.startMin - totalStart) / totalDuration) * 100;
      const height = ((r.endMin - r.startMin) / totalDuration) * 100;
      const isFirst = r.startMin === totalStart;
      const isLast = r.endMin === totalEnd;
      const sectionIdx = allSections.indexOf(r.section);
      const color = SECTION_COLORS[sectionIdx % SECTION_COLORS.length];
      return { top, height, color, section: r.section, isFirst, isLast, key: `${r.startStr}-${r.endStr}` };
    });

    const sectionRanges = {};
    for (const r of merged) {
      if (!sectionRanges[r.section]) sectionRanges[r.section] = [];
      sectionRanges[r.section].push({ start: r.startStr, end: r.endStr });
    }
    const legend = allSections.map((section) => ({
      section,
      color: SECTION_COLORS[allSections.indexOf(section) % SECTION_COLORS.length],
      ranges: sectionRanges[section] || [],
    }));

    return { bands, legend };
  }, [sectionAssignments, slot.start_time, slot.end_time]);

  if (compact) {
    return (
      <div
        className={`border rounded text-[10px] px-1 py-0.5 overflow-hidden leading-tight cursor-pointer h-full relative ${styles}${isOwn ? ' !border-l-[3px] !border-l-accent' : ''}`}
      >
        {sectionBands && sectionBands.bands.map((b) => (
          <div
            key={b.key}
            className={`absolute right-0 w-1 ${b.color?.chip || 'bg-green-500'} opacity-70`}
            style={{
              top: `${b.top}%`,
              height: `${b.height}%`,
              borderRadius: `${b.isFirst ? '2px' : '0'} ${b.isFirst ? '2px' : '0'} ${b.isLast ? '2px' : '0'} ${b.isLast ? '2px' : '0'}`,
            }}
          />
        ))}
        <span className="font-medium relative">
          {formatTime(slot.start_time)}
        </span>
        {getLg()?.name && (
          <span className="block truncate opacity-75 relative">{getLg().name}</span>
        )}
        {sectionBands && (
          <div className="relative mt-0.5 space-y-0">
            {sectionBands.legend.map(({ section, color, ranges }) => (
              <div key={section} className="flex items-start gap-1 leading-tight">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px] ${color?.chip || 'bg-green-500'}`} />
                <span className="opacity-75 break-words min-w-0">
                  <span className="font-medium">{section}</span>{ranges.length > 0 && <span className="opacity-60">{' – '}{ranges.map(r => `${formatTimeDisplay(r.start).replace(/AM|PM/, s => s.toLowerCase())}–${formatTimeDisplay(r.end).replace(/AM|PM/, s => s.toLowerCase())}`).join(', ')}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg px-3 py-1.5 overflow-hidden text-sm h-full relative ${styles}${isOwn ? ' !border-l-[3px] !border-l-accent' : ''}`}
    >
      {sectionBands && sectionBands.bands.map((b) => (
        <div
          key={b.key}
          className={`absolute right-0 w-1 ${b.color?.chip || 'bg-green-500'} opacity-70`}
          style={{
            top: `${b.top}%`,
            height: `${b.height}%`,
            borderRadius: `${b.isFirst ? '2px' : '0'} ${b.isFirst ? '2px' : '0'} ${b.isLast ? '2px' : '0'} ${b.isLast ? '2px' : '0'}`,
          }}
        />
      ))}
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
              onClick={() => {
                if (!confirmCancel) {
                  setConfirmCancel(true);
                  setTimeout(() => setConfirmCancel(false), 3000);
                  return;
                }
                setConfirmCancel(false);
                handleAction(onCancelBooking, slot.id);
              }}
              disabled={processing}
              className={`text-xs ${confirmCancel ? 'text-red-700 font-medium' : 'text-red-600 hover:text-red-700'}`}
            >
              {processing ? '...' : confirmCancel ? t('confirmAction') : t('cancel')}
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
          ? <>{t('proposedBy')}{' '}{isAdminOrPhotographer && getLivingGroupEmail() ? <a href={`mailto:${getLivingGroupEmail()}`} className="font-medium hover:underline">{getLg()?.name || t('unknown')}</a> : <span className="font-medium">{getLg()?.name || t('unknown')}</span>}</>
          : type === 'booked'
            ? <>{t('postedBy')}{' '}{isLivingGroup && getCreatorEmail() ? <a href={`mailto:${getCreatorEmail()}`} className="font-medium hover:underline">{getCreatorLabel()}</a> : <span className="font-medium">{getCreatorLabel()}</span>}{' · '}{t('bookedBy')}{' '}{isAdminOrPhotographer && getLivingGroupEmail() ? <a href={`mailto:${getLivingGroupEmail()}`} className="font-medium text-green-700 hover:underline">{getLg()?.name || t('booked')}</a> : <span className="font-medium text-green-700">{getLg()?.name || t('booked')}</span>}</>
            : <>{t('postedBy')}{' '}{isLivingGroup && getCreatorEmail() ? <a href={`mailto:${getCreatorEmail()}`} className="font-medium hover:underline">{getCreatorLabel()}</a> : getCreatorLabel()}</>
        }
        {slot.location && <>{' · '}{slot.location}</>}
        {slot.notes && <>{' · '}<span className="italic">{slot.notes}</span></>}
      </p>
      {/* Section assignments for admin/staph on booked slots */}
      {type === 'booked' && isAdminOrPhotographer && sectionAssignments && Object.keys(sectionAssignments).length > 0 && (
        <SectionRows assignments={sectionAssignments} />
      )}
    </div>
  );
}

// Section assignment legend for admin view (expanded day/month slots)
function SectionRows({ assignments }) {
  const legend = useMemo(() => {
    const allSections = [...new Set(Object.values(assignments).filter(Boolean))].sort();
    if (allSections.length === 0) return [];

    // Collect entries with minute values
    const entries = [];
    for (const [key, section] of Object.entries(assignments)) {
      if (!section) continue;
      const [startStr, endStr] = key.split('-');
      const [bsH, bsM] = startStr.split(':').map(Number);
      const [beH, beM] = endStr.split(':').map(Number);
      entries.push({ section, startMin: bsH * 60 + bsM, endMin: beH * 60 + beM, startStr, endStr });
    }
    entries.sort((a, b) => a.startMin - b.startMin);

    // Merge consecutive same-section entries
    const merged = [];
    for (const e of entries) {
      const last = merged.length > 0 ? merged[merged.length - 1] : null;
      if (last && last.section === e.section && last.endMin === e.startMin) {
        last.endMin = e.endMin;
        last.endStr = e.endStr;
      } else {
        merged.push({ ...e });
      }
    }

    // Group ranges by section
    const sectionRanges = {};
    for (const r of merged) {
      if (!sectionRanges[r.section]) sectionRanges[r.section] = [];
      sectionRanges[r.section].push({ start: r.startStr, end: r.endStr });
    }

    return allSections.map((section) => ({
      section,
      color: SECTION_COLORS[allSections.indexOf(section) % SECTION_COLORS.length],
      ranges: sectionRanges[section] || [],
    }));
  }, [assignments]);

  if (legend.length === 0) return null;

  return (
    <div className="mt-1.5 pt-1.5 border-t border-green-200/60 space-y-0">
      {legend.map(({ section, color, ranges }) => (
        <div key={section} className="flex items-start gap-1.5 text-[10px] leading-tight">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-[2px] ${color?.chip || 'bg-green-500'}`} />
          <span className="min-w-0">
            <span className={`${color?.text || 'text-green-800'} font-medium`}>{section}</span>
            {ranges.length > 0 && (
              <span className="text-green-700/50">{' – '}{ranges.map(r => `${formatTimeDisplay(r.start).replace(/AM|PM/, s => s.toLowerCase())}–${formatTimeDisplay(r.end).replace(/AM|PM/, s => s.toLowerCase())}`).join(', ')}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
