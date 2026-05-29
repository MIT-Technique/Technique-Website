'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import DaySidePanel from './DaySidePanel';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';

// Format 24-hour time to 12-hour AM/PM
function formatTime(time) {
  if (!time) return '';
  const clean = time.slice(0, 5);
  const [hours, minutes] = clean.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d;
}

const VIEW_MODE_TAB_LABELS = { day: 'Day', week: 'Week', month: 'Month' };

export default function CalendarView({
  role,
  times = [],
  proposals = [],
  currentUserId = null,
  onBook,
  onCreate,
  onDelete,
  onAcceptProposal,
  onDeclineProposal,
  onCancelBooking,
  onPropose,
  onConfirmLocation,
  onAssignPhotographer,
  photographers = [],
  frozen = false,
  loading = false,
  timeAssignments = {},
}) {
  const locale = 'en-US';

  const today = new Date();

  const [viewMode, setViewMode] = useState('month'); // 'day' | 'week' | 'month'
  const [viewDate, setViewDate] = useState(today); // anchor date
  const [selectedDate, setSelectedDate] = useState(null);
  const [prefillTimes, setPrefillTimes] = useState(null); // { startTime, endTime }

  // Derived values
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Group times by date
  const timesByDate = useMemo(() => {
    const map = {};
    times.forEach((time) => {
      const key = time.date;
      if (!map[key]) map[key] = [];
      map[key].push(time);
    });
    return map;
  }, [times]);

  // Only show pending proposals on the calendar
  const pendingProposals = useMemo(() => proposals.filter((p) => p.status === 'pending'), [proposals]);

  const proposalsByDate = useMemo(() => {
    const map = {};
    pendingProposals.forEach((p) => {
      const key = p.date;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [pendingProposals]);

  // Navigation
  function navigate(delta) {
    const d = new Date(viewDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + delta);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + delta * 7);
    } else {
      d.setDate(d.getDate() + delta);
    }
    setViewDate(d);
  }

  function goToToday() {
    setViewDate(new Date());
    if (viewMode === 'day') {
      // also update selectedDate if in day mode
    }
  }

  // Header label
  function getHeaderLabel() {
    if (viewMode === 'month') {
      return new Date(viewYear, viewMonth).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
    }
    if (viewMode === 'week') {
      const ws = getWeekStart(viewDate);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const startStr = ws.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      const endStr = we.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    // day
    return viewDate.toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Day names for month view
  const dayNames = Array.from({ length: 7 }, (_, i) => {
    const sun = new Date(2024, 0, 7 + i);
    return sun.toLocaleDateString(locale, { weekday: 'short' });
  });

  // Selected day data (for side panel in month/week modes)
  const selectedTimes = selectedDate ? (timesByDate[selectedDate] || []) : [];
  const selectedProposals = selectedDate ? (proposalsByDate[selectedDate] || []) : [];

  // Week start for week view
  const weekStart = getWeekStart(viewDate);

  // Day view date string
  const dayDateStr = toDateStr(viewDate);

  return (
    <div className="relative">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 h-9">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-secondary text-text-secondary"
              aria-label="Previous"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-medium text-sm sm:text-lg px-1">{getHeaderLabel()}</span>
            <button
              onClick={() => navigate(1)}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-secondary text-text-secondary"
              aria-label="Next"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 flex-shrink-0 mr-2">
            <button
              onClick={goToToday}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-bg-secondary text-text-secondary"
            >
              {"Today"}
            </button>
            <div className="flex rounded border border-border overflow-hidden">
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm ${
                  viewMode === mode
                    ? 'bg-accent text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                }`}
              >
                {VIEW_MODE_TAB_LABELS[mode]}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> {"Available"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {"Booked"}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> {"Proposed"}
          </span>
          {role === 'living_group' && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> {"Other Proposals"}
            </span>
          )}
        </div>

        {/* View content */}
        {viewMode === 'month' && (
          <MonthView
            viewYear={viewYear}
            viewMonth={viewMonth}
            timesByDate={timesByDate}
            proposalsByDate={proposalsByDate}
            selectedDate={selectedDate}
            onDayClick={(dateStr) => { setSelectedDate(dateStr === selectedDate ? null : dateStr); setPrefillTimes(null); }}
            role={role}
            loading={loading}
            locale={locale}
            dayNames={dayNames}
          />
        )}

        {viewMode === 'week' && (
          <WeekView
            weekStart={weekStart}
            times={times}
            proposals={pendingProposals}
            role={role}
            currentUserId={currentUserId}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            frozen={frozen}
            loading={loading}
            formatTime={formatTime}
            timeAssignments={timeAssignments}
            onBook={onBook}
            onDelete={onDelete}
            onCancelBooking={onCancelBooking}
            onAcceptProposal={onAcceptProposal}
            onDeclineProposal={onDeclineProposal}
            onGridTimeClick={({ date: dateStr, startTime, endTime }) => {
              setSelectedDate(dateStr);
              setPrefillTimes({ startTime, endTime });
            }}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            date={dayDateStr}
            times={times}
            proposals={pendingProposals}
            role={role}
            currentUserId={currentUserId}
            frozen={frozen}
            loading={loading}
            formatTime={formatTime}
            timeAssignments={timeAssignments}
            onBook={onBook}
            onCreate={onCreate}
            onDelete={onDelete}
            onAcceptProposal={onAcceptProposal}
            onDeclineProposal={onDeclineProposal}
            onCancelBooking={onCancelBooking}
            onPropose={onPropose}
          />
        )}
      </div>

      {/* Side Panel (month + week views) */}
      <AnimatePresence>
        {selectedDate && viewMode !== 'day' && (
          <DaySidePanel
            key={selectedDate}
            date={selectedDate}
            times={selectedTimes}
            proposals={selectedProposals}
            role={role}
            currentUserId={currentUserId}
            onClose={() => { setSelectedDate(null); setPrefillTimes(null); }}
            onBook={onBook}
            onCreate={(...args) => { setPrefillTimes(null); return onCreate?.(...args); }}
            onDelete={onDelete}
            onAcceptProposal={onAcceptProposal}
            onDeclineProposal={onDeclineProposal}
            onCancelBooking={onCancelBooking}
            onPropose={(...args) => { setPrefillTimes(null); return onPropose?.(...args); }}
            onConfirmLocation={onConfirmLocation}
            onAssignPhotographer={onAssignPhotographer}
            photographers={photographers}
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
