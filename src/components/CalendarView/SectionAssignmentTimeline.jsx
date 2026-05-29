'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { generateTimeSlots, formatTimeDisplay } from '../../lib/utils/time';

// Consistent colors for sections
const SECTION_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', chip: 'bg-blue-500' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', chip: 'bg-purple-500' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', chip: 'bg-amber-500' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', chip: 'bg-teal-500' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', chip: 'bg-rose-500' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800', chip: 'bg-indigo-500' },
  { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', chip: 'bg-emerald-500' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', chip: 'bg-orange-500' },
];

function getSectionColor(sections, sectionName) {
  const idx = sections.indexOf(sectionName);
  if (idx < 0) return SECTION_COLORS[0];
  return SECTION_COLORS[idx % SECTION_COLORS.length];
}

const ROW_HEIGHT = 12; // px per quarter-hour
const PAD = 1; // padding rows above and below

export default function SectionAssignmentTimeline({
  bookedTime,
  sections = [],
  assignments = {},
  onAssign,
  formatTime,
  saving = false,
}) {
  const [activeBrush, setActiveBrush] = useState(null); // section name or '__clear__'
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [dragging, setDragging] = useState(false);
  const gridRef = useRef(null);

  const slots = useMemo(
    () => generateTimeSlots(bookedTime.start_time, bookedTime.end_time),
    [bookedTime.start_time, bookedTime.end_time]
  );

  // Compute hour labels at hour boundaries (like DayView)
  const hourLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < slots.length; i++) {
      const [h, m] = slots[i].start.split(':').map(Number);
      if (m === 0 || i === 0) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        labels.push({ label: `${h12} ${ampm}`, row: i + 1 });
      }
    }
    // Add end label
    const last = slots[slots.length - 1];
    if (last) {
      const [h, m] = last.end.split(':').map(Number);
      if (m === 0) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        labels.push({ label: `${h12} ${ampm}`, row: slots.length + 1 });
      }
    }
    return labels;
  }, [slots]);

  const scrollRef = useRef(null);

  const getSlotIndex = useCallback((e) => {
    const grid = gridRef.current;
    const scroll = scrollRef.current;
    if (!grid || !scroll) return -1;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const idx = Math.floor(y / ROW_HEIGHT) - PAD;
    return Math.max(0, Math.min(idx, slots.length - 1));
  }, [slots.length]);

  const getDragRange = useCallback(() => {
    if (dragStart === null) return new Set();
    const end = dragEnd !== null ? dragEnd : dragStart;
    const min = Math.min(dragStart, end);
    const max = Math.max(dragStart, end);
    const range = new Set();
    for (let i = min; i <= max; i++) range.add(i);
    return range;
  }, [dragStart, dragEnd]);

  const handleMouseDown = useCallback((e) => {
    if (!activeBrush) return;
    e.preventDefault();
    const idx = getSlotIndex(e);
    if (idx < 0) return;
    setDragging(true);
    setDragStart(idx);
    setDragEnd(idx);
  }, [activeBrush, getSlotIndex]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    e.preventDefault();
    const idx = getSlotIndex(e);
    if (idx >= 0) setDragEnd(idx);
  }, [dragging, getSlotIndex]);

  const handleMouseUp = useCallback(async () => {
    if (!dragging || dragStart === null || !activeBrush) {
      setDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const end = dragEnd !== null ? dragEnd : dragStart;
    const min = Math.min(dragStart, end);
    const max = Math.max(dragStart, end);
    const sectionName = activeBrush === '__clear__' ? null : activeBrush;

    // Batch assign all slots in the range
    const promises = [];
    for (let i = min; i <= max; i++) {
      const slot = slots[i];
      if (slot) {
        promises.push(onAssign(bookedTime.id, slot.start, slot.end, sectionName));
      }
    }
    await Promise.all(promises);

    setDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [dragging, dragStart, dragEnd, activeBrush, slots, bookedTime.id, onAssign]);

  const dragRange = getDragRange();

  // Track which slot index starts a new section group (for label display)
  const groupStartSet = useMemo(() => {
    const starts = new Set();
    let prev = null;
    for (let i = 0; i < slots.length; i++) {
      const key = `${slots[i].start}-${slots[i].end}`;
      const section = assignments[key] || '';
      if (section !== prev) {
        if (section) starts.add(i);
        prev = section;
      } else {
        prev = section;
      }
    }
    return starts;
  }, [slots, assignments]);

  // Total grid rows: pad + slots + pad (+ 1 only if there's an end hour label)
  const hasEndLabel = slots.length > 0 && (() => {
    const last = slots[slots.length - 1];
    const [, m] = last.end.split(':').map(Number);
    return m === 0;
  })();
  const totalRows = PAD + slots.length + PAD + (hasEndLabel ? 1 : 0);

  // Adjust hour labels to account for padding offset
  const adjustedHourLabels = useMemo(() =>
    hourLabels.map(({ label, row }) => ({ label, row: row + PAD })),
    [hourLabels]
  );

  return (
    <div>
      {/* Section palette */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {sections.map((section) => {
          const color = getSectionColor(sections, section);
          const isActive = activeBrush === section;
          return (
            <button
              key={section}
              onClick={() => setActiveBrush(isActive ? null : section)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                isActive
                  ? `${color.bg} ${color.border} ${color.text} ring-2 ring-offset-1 ring-current font-medium`
                  : `border-border text-text-secondary hover:${color.bg}`
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${color.chip} mr-1.5`} />
              {section}
            </button>
          );
        })}
        <button
          onClick={() => setActiveBrush(activeBrush === '__clear__' ? null : '__clear__')}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
            activeBrush === '__clear__'
              ? 'border-gray-400 bg-gray-100 text-gray-700 ring-2 ring-offset-1 ring-gray-400 font-medium'
              : 'border-border text-text-secondary hover:bg-gray-50'
          }`}
        >
          ✕ {"Clear"}
        </button>
      </div>

      {activeBrush && (
        <p className="text-xs text-text-muted mb-2">
          {activeBrush === '__clear__'
            ? "Drag across slots to clear assignments"
            : `Drag across slots to assign "${activeBrush}"`}
        </p>
      )}

      {/* Timeline grid — CSS grid matching DayView style */}
      <div
        ref={scrollRef}
        className="overflow-y-auto border border-border rounded-lg"
        style={{ maxHeight: '300px' }}
      >
      <div
        ref={gridRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (dragging) handleMouseUp(); }}
        className={`select-none relative ${activeBrush ? 'cursor-crosshair' : ''}`}
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          gridTemplateColumns: '50px 1fr',
        }}
      >
        {/* Top padding row (grayed out) */}
        <div style={{ gridRow: 1, gridColumn: '1 / -1' }} className="bg-gray-100/60" />
        {/* Bottom padding row (grayed out) */}
        <div style={{ gridRow: PAD + slots.length + 1, gridColumn: '1 / -1' }} className="bg-gray-100/60" />

        {/* Hour labels + grid lines */}
        {adjustedHourLabels.map(({ label, row }) => (
          <div
            key={`label-${row}`}
            style={{ gridRow: row, gridColumn: 1 }}
            className="text-[10px] text-text-muted pr-2 text-right -translate-y-1/2 z-10"
          >
            {label}
          </div>
        ))}
        {adjustedHourLabels.map(({ row }, i) => (
          <div
            key={`line-${i}`}
            style={{ gridRow: row, gridColumn: 2 }}
            className="border-t border-border/50"
          />
        ))}

        {/* Slot overlays in column 2 */}
        {slots.map((slot, idx) => {
          const slotKey = `${slot.start}-${slot.end}`;
          const assignedSection = assignments[slotKey] || '';
          const sectionColor = assignedSection ? getSectionColor(sections, assignedSection) : null;
          const isInDragRange = dragging && dragRange.has(idx);
          const dragBrushColor = activeBrush && activeBrush !== '__clear__'
            ? getSectionColor(sections, activeBrush)
            : null;

          const bgClass = isInDragRange
            ? activeBrush === '__clear__' ? 'bg-red-50' : dragBrushColor ? dragBrushColor.bg : 'bg-accent/10'
            : assignedSection && sectionColor ? sectionColor.bg : '';

          // Only show label on the first slot of a consecutive section group
          const isGroupStart = groupStartSet.has(idx);
          const showDragLabel = isInDragRange && (idx === Math.min(dragStart ?? idx, dragEnd ?? idx));

          return (
            <div
              key={slotKey}
              style={{ gridRow: idx + 1 + PAD, gridColumn: 2 }}
              className={`flex items-center px-2 transition-colors ${bgClass}`}
            >
              {isInDragRange && showDragLabel ? (
                <span className={`text-[10px] font-medium truncate ${
                  activeBrush === '__clear__' ? 'text-red-600 line-through' : dragBrushColor ? dragBrushColor.text : ''
                }`}>
                  {activeBrush === '__clear__' ? (assignedSection || '') : activeBrush}
                </span>
              ) : !isInDragRange && assignedSection && isGroupStart ? (
                <span className={`text-[10px] font-medium truncate ${sectionColor?.text || 'text-text-primary'}`}>
                  {assignedSection}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// Export for use in admin calendar
export { SECTION_COLORS, getSectionColor };
