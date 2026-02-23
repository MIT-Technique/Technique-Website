'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence } from 'framer-motion';
import DaySidePanel from './DaySidePanel';
import TimelineSlot, { timeToRow } from './TimelineSlot';

const HOUR_START = 0;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START; // 24
const ROWS = TOTAL_HOURS * 4; // 96 quarter-hour rows
const ROW_HEIGHT_DEFAULT = 12; // px per quarter-hour
const ROW_HEIGHT_MOBILE = 8;

function formatHourLabel(hour) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12} ${ampm}`;
}

export default function DayView({
  date,
  times = [],
  proposals = [],
  role,
  currentUserId,
  frozen = false,
  loading = false,
  formatTime,
  onBook,
  onCreate,
  onDelete,
  onAcceptProposal,
  onDeclineProposal,
  onCancelBooking,
  onPropose,
  timeAssignments = {},
}) {
  const t = useTranslations('calendarView');
  const [rowHeight, setRowHeight] = useState(ROW_HEIGHT_DEFAULT);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = (e) => setRowHeight(e.matches ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DEFAULT);
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const [showPanel, setShowPanel] = useState(false);
  const [prefillTimes, setPrefillTimes] = useState(null);
  const gridRef = useRef(null);
  const [flashError, setFlashError] = useState(null);
  const flashTimer = useRef(null);

  function showFlashError(msg) {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashError(msg);
    flashTimer.current = setTimeout(() => setFlashError(null), 2000);
  }

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const isPast = new Date(date) < new Date(new Date().toISOString().split('T')[0]);
  const isToday = date === new Date().toISOString().split('T')[0];

  const dayTimes = useMemo(() => times.filter((t) => t.date === date), [times, date]);
  const dayProposals = useMemo(() => proposals.filter((p) => p.date === date), [proposals, date]);

  const availableTimes = dayTimes.filter((t) => !t.living_group_id && !t.cancelled_at);
  const bookedTimes = dayTimes.filter((t) => t.living_group_id && !t.cancelled_at);

  // Current time indicator row
  const now = new Date();
  const nowRow = isToday
    ? (now.getHours() - HOUR_START) * 4 + Math.floor(now.getMinutes() / 15) + 1
    : null;

  const handleGridClick = useCallback((e) => {
    if (isPast && role !== 'admin') {
      showFlashError(t('noPastDates'));
      return;
    }
    if (e.target.closest('[data-slot]')) return;
    const grid = gridRef.current;
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top + grid.parentElement.scrollTop;
    const row = Math.floor(y / rowHeight);
    const hour = Math.floor(row / 4) + HOUR_START;
    const min = (row % 4) * 15;
    if (hour < 0 || hour >= 24) return;
    const startTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const endHour = hour + 1;
    const endTime = endHour >= 24 ? '23:45' : `${String(endHour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    setPrefillTimes({ startTime, endTime });
    setShowPanel(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPast, role, t]);

  if (loading) {
    return <div className="py-12 text-center text-text-secondary text-sm">Loading...</div>;
  }

  return (
    <div className="relative">
      {/* Timeline */}
      <div className={`overflow-y-auto border border-border rounded-lg relative ${isPast && role !== 'admin' ? 'opacity-40' : ''}`} style={{ maxHeight: '600px' }}>
        {flashError && (
          <div className="sticky top-1/2 z-30 flex justify-center pointer-events-none">
            <div className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-fade-in-out">
              {flashError}
            </div>
          </div>
        )}
        <div
          ref={gridRef}
          onClick={handleGridClick}
          className="relative cursor-pointer"
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${ROWS}, ${rowHeight}px)`,
            gridTemplateColumns: '50px 1fr',
          }}
        >
          {/* Hour labels and lines */}
          {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
            const hour = HOUR_START + i;
            const row = i * 4 + 1;
            return (
              <div
                key={`label-${hour}`}
                style={{ gridRow: row, gridColumn: 1 }}
                className="text-[10px] text-text-muted pr-2 text-right -translate-y-1/2"
              >
                {formatHourLabel(hour)}
              </div>
            );
          })}

          {/* Hour grid lines */}
          {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
            const row = i * 4 + 1;
            return (
              <div
                key={`line-${i}`}
                style={{ gridRow: row, gridColumn: 2 }}
                className="border-t border-border/50"
              />
            );
          })}

          {/* Current time indicator */}
          {nowRow && nowRow > 0 && nowRow <= ROWS && (
            <div
              style={{ gridRow: nowRow, gridColumn: '1 / -1' }}
              className="relative z-20 h-0"
            >
              <div className="absolute left-[46px] right-0 border-t-2 border-red-500" />
              <div className="absolute left-[42px] w-3 h-3 rounded-full bg-red-500 -translate-y-1/2" />
            </div>
          )}

          {/* Available slots */}
          {availableTimes.map((slot) => {
            const sr = timeToRow(slot.start_time);
            const er = timeToRow(slot.end_time);
            return (
            <div key={slot.id} data-slot style={{ gridColumn: 2, gridRow: `${sr} / ${er}` }} className="px-1">
              <TimelineSlot
                slot={slot}
                type="available"
                role={role}
                currentUserId={currentUserId}
                frozen={frozen}
                isOwn={!!currentUserId && slot.created_by === currentUserId}
                formatTime={formatTime}
                onBook={onBook}
                onDelete={onDelete}
              />
            </div>
            );
          })}

          {/* Booked slots */}
          {bookedTimes.map((slot) => {
            const sr = timeToRow(slot.start_time);
            const er = timeToRow(slot.end_time);
            return (
            <div key={slot.id} data-slot style={{ gridColumn: 2, gridRow: `${sr} / ${er}` }} className="px-1">
              <TimelineSlot
                slot={slot}
                type="booked"
                role={role}
                currentUserId={currentUserId}
                frozen={frozen}
                isOwn={role === 'living_group' || (!!currentUserId && slot.created_by === currentUserId)}
                formatTime={formatTime}
                onCancelBooking={onCancelBooking}
                onDelete={onDelete}
                sectionAssignments={timeAssignments[slot.id]}
              />
            </div>
            );
          })}

          {/* Proposals */}
          {dayProposals.map((slot) => {
            const sr = timeToRow(slot.start_time);
            const er = timeToRow(slot.end_time);
            return (
            <div key={slot.id} data-slot style={{ gridColumn: 2, gridRow: `${sr} / ${er}` }} className="px-1">
              <TimelineSlot
                slot={slot}
                type="proposal"
                role={role}
                currentUserId={currentUserId}
                isOwn={role === 'living_group'}
                formatTime={formatTime}
                onAcceptProposal={onAcceptProposal}
                onDeclineProposal={onDeclineProposal}
              />
            </div>
            );
          })}
        </div>
      </div>

      {/* Side Panel overlay */}
      <AnimatePresence>
        {showPanel && (
          <DaySidePanel
            key={date}
            date={date}
            times={dayTimes}
            proposals={dayProposals}
            role={role}
            currentUserId={currentUserId}
            onClose={() => { setShowPanel(false); setPrefillTimes(null); }}
            onBook={onBook}
            onCreate={(...args) => { setPrefillTimes(null); return onCreate?.(...args); }}
            onDelete={onDelete}
            onAcceptProposal={onAcceptProposal}
            onDeclineProposal={onDeclineProposal}
            onCancelBooking={onCancelBooking}
            onPropose={(...args) => { setPrefillTimes(null); return onPropose?.(...args); }}
            frozen={frozen}
            formatTime={formatTime}
            initialStartTime={prefillTimes?.startTime || ''}
            initialEndTime={prefillTimes?.endTime || ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
