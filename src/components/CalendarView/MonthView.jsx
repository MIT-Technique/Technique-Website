'use client';

import { useTranslations } from 'next-intl';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function MonthView({
  viewYear,
  viewMonth,
  timesByDate,
  proposalsByDate,
  selectedDate,
  onDayClick,
  role,
  loading,
  locale,
  dayNames,
}) {
  const t = useTranslations('calendarView');
  const today = new Date();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  return (
    <>
      {/* Day names header */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-text-muted py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      {loading ? (
        <div className="py-12 text-center text-text-secondary text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-7 border-t border-l border-border">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="border-r border-b border-border min-h-[80px] bg-bg-secondary/30" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTimes = timesByDate[dateStr] || [];
            const dayProposals = proposalsByDate[dateStr] || [];

            const availableCount = dayTimes.filter((t) => !t.living_group_id && !t.cancelled_at).length;
            const bookedCount = dayTimes.filter((t) => t.living_group_id && !t.cancelled_at).length;
            const proposalCount = dayProposals.length;

            const isToday =
              day === today.getDate() &&
              viewMonth === today.getMonth() &&
              viewYear === today.getFullYear();
            const isSelected = dateStr === selectedDate;
            const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0]);

            return (
              <div
                key={day}
                onClick={() => onDayClick(dateStr)}
                className={`border-r border-b border-border min-h-[80px] p-1.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-accent/5 ring-2 ring-accent ring-inset'
                    : 'hover:bg-bg-secondary/50'
                } ${isPast ? 'opacity-60' : ''}`}
              >
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-accent text-white' : ''
                  }`}
                >
                  {day}
                </span>
                <div className="flex gap-1.5">
                  {availableCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      {availableCount}
                    </span>
                  )}
                  {bookedCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-700">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {bookedCount}
                    </span>
                  )}
                  {proposalCount > 0 && (role === 'admin' || role === 'photographer') && (
                    <span className="flex items-center gap-0.5 text-[10px] text-yellow-700">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {proposalCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {Array.from(
            { length: (7 - ((firstDay + daysInMonth) % 7)) % 7 },
            (_, i) => (
              <div key={`trail-${i}`} className="border-r border-b border-border min-h-[80px] bg-bg-secondary/30" />
            )
          )}
        </div>
      )}
    </>
  );
}
