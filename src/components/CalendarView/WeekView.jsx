'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import TimelineSlot, { timeToRow } from './TimelineSlot';

const HOUR_START = 6;
const HOUR_END = 23;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const ROWS = TOTAL_HOURS * 4;
const ROW_HEIGHT = 15;

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
}) {
  const locale = useLocale();
  const t = useTranslations('calendarView');
  const today = new Date();
  const todayStr = toDateStr(today);

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

  if (loading) {
    return <div className="py-12 text-center text-text-secondary text-sm">Loading...</div>;
  }

  return (
    <div className="overflow-y-auto border border-border rounded-lg" style={{ maxHeight: '600px' }}>
      {/* Column headers */}
      <div
        className="sticky top-0 z-10 bg-white border-b border-border"
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
          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr === selectedDate ? null : dateStr)}
              className={`text-center py-2 cursor-pointer transition-colors border-l border-border ${
                isSelected ? 'bg-accent/5' : 'hover:bg-bg-secondary/50'
              }`}
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
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${ROWS}, ${ROW_HEIGHT}px)`,
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

        {/* Column separators */}
        {weekDates.map((d, idx) => (
          <div
            key={`sep-${idx}`}
            style={{ gridRow: `1 / span ${ROWS}`, gridColumn: idx + 2 }}
            className="border-l border-border/30"
          />
        ))}

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
              <div key={slot.id} style={{ gridColumn: colIdx + 2, gridRow: `${sr} / ${er}` }} className="px-0.5">
                <TimelineSlot
                  slot={slot}
                  type="available"
                  compact
                  role={role}
                  currentUserId={currentUserId}
                  frozen={frozen}
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
              <div key={slot.id} style={{ gridColumn: colIdx + 2, gridRow: `${sr} / ${er}` }} className="px-0.5">
                <TimelineSlot
                  slot={slot}
                  type="booked"
                  compact
                  role={role}
                  currentUserId={currentUserId}
                  frozen={frozen}
                  formatTime={formatTime}
                  onCancelBooking={onCancelBooking}
                  onDelete={onDelete}
                />
              </div>
              );
            }),
            ...(role === 'admin' || role === 'photographer'
              ? dayProposals.map((slot) => {
                  const sr = timeToRow(slot.start_time);
                  const er = timeToRow(slot.end_time);
                  return (
                  <div key={slot.id} style={{ gridColumn: colIdx + 2, gridRow: `${sr} / ${er}` }} className="px-0.5">
                    <TimelineSlot
                      slot={slot}
                      type="proposal"
                      compact
                      role={role}
                      formatTime={formatTime}
                      onAcceptProposal={onAcceptProposal}
                      onDeclineProposal={onDeclineProposal}
                    />
                  </div>
                  );
                })
              : []),
          ];
        })}
      </div>
    </div>
  );
}
