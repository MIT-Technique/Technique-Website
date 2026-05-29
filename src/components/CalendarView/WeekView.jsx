'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import TimelineSlot, { timeToRow } from './TimelineSlot';

const HOUR_START = 0;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const ROWS = TOTAL_HOURS * 4;
const ROW_HEIGHT_DEFAULT = 12;
const ROW_HEIGHT_MOBILE = 8;

function formatHourLabel(hour) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12} ${ampm}`;
}

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WeekView({
  weekStart,
  times = [],
  proposals = [],
  role,
  currentUserId,
  selectedDate,
  onSelectDate,
  frozen = false,
  loading = false,
  formatTime,
  onBook,
  onDelete,
  onCancelBooking,
  onAcceptProposal,
  onDeclineProposal,
  onGridTimeClick,
  timeAssignments = {},
}) {
  const locale = 'en-US';

  const [rowHeight, setRowHeight] = useState(ROW_HEIGHT_DEFAULT);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = (e) => setRowHeight(e.matches ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DEFAULT);
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  const today = new Date();
  const todayStr = toDateStr(today);
  const gridRef = useRef(null);
  const [flashError, setFlashError] = useState(null);
  const flashTimer = useRef(null);

  function showFlashError(msg) {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashError(msg);
    flashTimer.current = setTimeout(() => setFlashError(null), 2000);
  }

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const timesByDate = useMemo(() => {
    const map = {};
    times.forEach((time) => {
      if (!map[time.date]) map[time.date] = [];
      map[time.date].push(time);
    });
    return map;
  }, [times]);

  const proposalsByDate = useMemo(() => {
    const map = {};
    proposals.forEach((p) => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    return map;
  }, [proposals]);

  const handleGridClick = useCallback((e) => {
    if (e.target.closest('[data-slot]')) return;
    const grid = gridRef.current;
    if (!grid) return;
    if (!onGridTimeClick) return;
    const rect = grid.getBoundingClientRect();
    const scrollContainer = grid.parentElement;
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;
    // 50px = time label column width
    if (x <= 50) return;
    const colWidth = (rect.width - 50) / 7;
    const colIdx = Math.floor((x - 50) / colWidth);
    if (colIdx < 0 || colIdx > 6) return;
    const dateStr = toDateStr(weekDates[colIdx]);
    if (new Date(dateStr) < new Date(todayStr) && role !== 'admin') {
      showFlashError("Cannot schedule in the past");
      return;
    }
    const row = Math.floor(y / rowHeight);
    const hour = Math.floor(row / 4) + HOUR_START;
    const min = (row % 4) * 15;
    if (hour < 0 || hour >= 24) return;
    const startTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const endHour = hour + 1;
    const endTime = endHour >= 24 ? '23:45' : `${String(endHour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    onGridTimeClick({ date: dateStr, startTime, endTime });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, todayStr, onGridTimeClick, t]);

  if (loading) {
    return <div className="py-12 text-center text-text-secondary text-sm">Loading...</div>;
  }

  return (
    <div className="overflow-y-auto border border-border rounded-lg relative" style={{ maxHeight: '600px' }}>
      {flashError && (
        <div className="sticky top-1/2 z-30 flex justify-center pointer-events-none">
          <div className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-fade-in-out">
            {flashError}
          </div>
        </div>
      )}
      {/* Column headers */}
      <div
        className="sticky top-0 z-30 bg-white border-b border-border"
        style={{
          display: 'grid',
          gridTemplateColumns: '50px repeat(7, 1fr)',
        }}
      >
        <div /> {/* spacer for time label column */}
        {weekDates.map((d) => {
          const dateStr = toDateStr(d);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isPast = new Date(dateStr) < new Date(todayStr);
          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr === selectedDate ? null : dateStr)}
              className={`text-center py-2 cursor-pointer transition-colors border-l border-border ${
                isSelected ? 'bg-accent/5' : isPast ? 'bg-gray-50' : 'hover:bg-bg-secondary/50'
              } ${isPast ? 'opacity-40' : ''}`}
            >
              <div className="text-[10px] text-text-muted uppercase">
                {d.toLocaleDateString(locale, { weekday: 'short' })}
              </div>
              <div
                className={`text-sm font-medium mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-accent text-white' : ''
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline grid */}
      <div
        ref={gridRef}
        onClick={handleGridClick}
        className="cursor-pointer"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${ROWS}, ${rowHeight}px)`,
          gridTemplateColumns: '50px repeat(7, 1fr)',
        }}
      >
        {/* Hour labels */}
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
              style={{ gridRow: row, gridColumn: '2 / -1' }}
              className="border-t border-border/50"
            />
          );
        })}

        {/* Column separators + past day backgrounds */}
        {weekDates.map((d, idx) => {
          const dateStr = toDateStr(d);
          const isPast = new Date(dateStr) < new Date(todayStr);
          return (
            <div
              key={`sep-${idx}`}
              style={{ gridRow: `1 / span ${ROWS}`, gridColumn: idx + 2 }}
              className={`border-l border-border/30 ${isPast ? 'bg-gray-50 opacity-40' : ''}`}
            />
          );
        })}

        {/* Current time indicator */}
        {(() => {
          const nowRow = (today.getHours() - HOUR_START) * 4 + Math.floor(today.getMinutes() / 15) + 1;
          if (nowRow <= 0 || nowRow > ROWS) return null;
          // Find which column today is in
          const todayColIdx = weekDates.findIndex((d) => toDateStr(d) === todayStr);
          if (todayColIdx === -1) return null;
          return (
            <div
              style={{ gridRow: nowRow, gridColumn: todayColIdx + 2 }}
              className="relative z-20 h-0"
            >
              <div className="absolute inset-x-0 border-t-2 border-red-500" />
            </div>
          );
        })()}

        {/* Slots per day */}
        {weekDates.map((d, colIdx) => {
          const dateStr = toDateStr(d);
          const dayTimes = timesByDate[dateStr] || [];
          const dayProposals = proposalsByDate[dateStr] || [];

          const available = dayTimes.filter((t) => !t.living_group_id && !t.cancelled_at);
          const booked = dayTimes.filter((t) => t.living_group_id && !t.cancelled_at);

          return [
            ...available.map((slot) => {
              const sr = timeToRow(slot.start_time);
              const er = timeToRow(slot.end_time);
              return (
              <div key={slot.id} data-slot style={{ gridColumn: colIdx + 2, gridRow: `${sr} / ${er}` }} className="px-0.5">
                <TimelineSlot
                  slot={slot}
                  type="available"
                  compact
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
            }),
            ...booked.map((slot) => {
              const sr = timeToRow(slot.start_time);
              const er = timeToRow(slot.end_time);
              return (
              <div key={slot.id} data-slot style={{ gridColumn: colIdx + 2, gridRow: `${sr} / ${er}` }} className="px-0.5">
                <TimelineSlot
                  slot={slot}
                  type="booked"
                  compact
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
            }),
            ...dayProposals.map((slot) => {
                  const sr = timeToRow(slot.start_time);
                  const er = timeToRow(slot.end_time);
                  return (
                  <div key={slot.id} data-slot style={{ gridColumn: colIdx + 2, gridRow: `${sr} / ${er}` }} className="px-0.5">
                    <TimelineSlot
                      slot={slot}
                      type="proposal"
                      compact
                      role={role}
                      currentUserId={currentUserId}
                      isOwn={role === 'living_group'}
                      formatTime={formatTime}
                      onAcceptProposal={onAcceptProposal}
                      onDeclineProposal={onDeclineProposal}
                    />
                  </div>
                  );
                }),
          ];
        })}
      </div>
    </div>
  );
}
