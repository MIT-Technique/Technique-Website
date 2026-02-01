'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import CreateSlotForm from './CreateSlotForm';
import TimelineSlot, { timeToRow } from './TimelineSlot';

const HOUR_START = 6;
const HOUR_END = 23;
const TOTAL_HOURS = HOUR_END - HOUR_START; // 17
const ROWS = TOTAL_HOURS * 4; // 68 quarter-hour rows
const ROW_HEIGHT = 15; // px per quarter-hour

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
}) {
  const locale = useLocale();
  const t = useTranslations('calendarView');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isAdminOrPhotographer = role === 'admin' || role === 'photographer';

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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

  async function handleCreate(formData) {
    if (!onCreate) return;
    await onCreate({ ...formData, date });
    setShowCreateForm(false);
  }

  if (loading) {
    return <div className="py-12 text-center text-text-secondary text-sm">Loading...</div>;
  }

  return (
    <div>
      {/* Create slot */}
      {isAdminOrPhotographer && !isPast && (
        <div className="mb-3">
          {showCreateForm ? (
            <CreateSlotForm
              date={date}
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="py-1.5 px-3 text-sm border border-dashed border-accent/40 text-accent rounded-lg hover:bg-accent/5 transition-colors"
            >
              + {t('addSlot')}
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="overflow-y-auto border border-border rounded-lg" style={{ maxHeight: '600px' }}>
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${ROWS}, ${ROW_HEIGHT}px)`,
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
            <div key={slot.id} style={{ gridColumn: 2, gridRow: `${sr} / ${er}` }} className="px-1">
              <TimelineSlot
                slot={slot}
                type="available"
                role={role}
                currentUserId={currentUserId}
                frozen={frozen}
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
            <div key={slot.id} style={{ gridColumn: 2, gridRow: `${sr} / ${er}` }} className="px-1">
              <TimelineSlot
                slot={slot}
                type="booked"
                role={role}
                currentUserId={currentUserId}
                frozen={frozen}
                formatTime={formatTime}
                onCancelBooking={onCancelBooking}
                onDelete={onDelete}
              />
            </div>
            );
          })}

          {/* Proposals */}
          {dayProposals.map((slot) => {
            const sr = timeToRow(slot.start_time);
            const er = timeToRow(slot.end_time);
            return (
            <div key={slot.id} style={{ gridColumn: 2, gridRow: `${sr} / ${er}` }} className="px-1">
              <TimelineSlot
                slot={slot}
                type="proposal"
                role={role}
                currentUserId={currentUserId}
                formatTime={formatTime}
                onAcceptProposal={onAcceptProposal}
                onDeclineProposal={onDeclineProposal}
              />
            </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {dayTimes.length === 0 && dayProposals.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-4">{t('noSlots')}</p>
      )}
    </div>
  );
}
