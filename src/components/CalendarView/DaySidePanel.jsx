'use client';

import { useState } from 'react';
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
  onConfirmLocation,
  onAssignPhotographer,
  photographers = [],
  frozen = false,
  formatTime,
  initialStartTime = '',
  initialEndTime = '',
}) {
  const locale = 'en-US';

  const isAdminOrPhotographer = role === 'admin' || role === 'photographer';
  const isLivingGroup = role === 'living_group';

  const hasPrefill = !!(initialStartTime && initialEndTime);
  const [showCreateForm, setShowCreateForm] = useState(isAdminOrPhotographer && hasPrefill);
  const [showProposeForm, setShowProposeForm] = useState(isLivingGroup && hasPrefill);
  const [processingId, setProcessingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [bookingTimeId, setBookingTimeId] = useState(null);
  const [proposedLocations, setProposedLocations] = useState(['']);
  // State for admin confirming location on pending bookings
  const [confirmingLocationId, setConfirmingLocationId] = useState(null);
  // State for assigning photographer
  const [assigningPhotographerId, setAssigningPhotographerId] = useState(null);

  const availableTimes = times.filter((t) => !t.living_group_id && !t.cancelled_at);
  const bookedTimes = times.filter((t) => t.living_group_id && !t.cancelled_at);

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isPast = new Date(date) < new Date(new Date().toISOString().split('T')[0]);

  async function handleBook(timeId, locations) {
    if (!onBook) return;
    setProcessingId(timeId);
    try {
      await onBook(timeId, locations);
      setBookingTimeId(null);
      setProposedLocations(['']);
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
    const reason = prompt("Enter a reason for declining (optional):");
    if (reason === null) return;
    setProcessingId(proposalId);
    try {
      await onDeclineProposal(proposalId, reason);
    } finally {
      setProcessingId(null);
    }
  }

  function getLg(item) {
    const lg = item?.living_group;
    return Array.isArray(lg) ? lg[0] : lg;
  }

  function getCreatorLabel(time) {
    const creator = time?.creator || time?.created_by_user;
    if (!creator) return "Unknown";
    return creator.name || creator.email || "Unknown";
  }

  function getCreatorEmail(time) {
    const creator = time?.creator || time?.created_by_user;
    return creator?.email || null;
  }

  function getLivingGroupEmail(item) {
    const lg = getLg(item);
    const user = Array.isArray(lg?.user) ? lg.user[0] : lg?.user;
    return user?.email || null;
  }

  function getPhotographer(time) {
    const photographer = time?.photographer;
    return Array.isArray(photographer) ? photographer[0] : photographer;
  }

  async function handleAssignPhotographer(timeId, photographerId) {
    if (!onAssignPhotographer) return;
    setAssigningPhotographerId(timeId);
    try {
      await onAssignPhotographer(timeId, photographerId);
    } finally {
      setAssigningPhotographerId(null);
    }
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
      className="absolute top-0 right-0 w-[360px] max-w-full z-40 bg-white border border-border rounded-lg shadow-lg"
    >
      <div className="w-full max-h-[500px] overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium text-sm">{dateLabel}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {availableTimes.length + bookedTimes.length} {"slots"} &middot; {proposals.length} {"proposals"}
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
                initialStartTime={initialStartTime}
                initialEndTime={initialEndTime}
              />
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-2 text-sm border border-dashed border-accent/40 text-accent rounded-lg hover:bg-accent/5 transition-colors"
              >
                + {"Add Time Slot"}
              </button>
            )}
          </div>
        )}

        {/* Booked Times */}
        {bookedTimes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-muted uppercase mb-2">{"Booked"}</h4>
            <div className="space-y-2">
              {bookedTimes.map((time) => {
                const isPending = time.booking_status === 'pending_location';
                const isConfirmed = time.booking_status === 'confirmed';
                const borderColor = isPending ? 'border-yellow-200' : 'border-green-200';
                const bgColor = isPending ? 'bg-yellow-50' : 'bg-green-50';
                return (
                <div key={time.id} className={`px-3 py-2 border ${borderColor} ${bgColor} rounded-lg text-sm${(isLivingGroup || (currentUserId && time.created_by === currentUserId)) ? ' !border-l-[3px] !border-l-accent' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="font-medium pb-0">
                        {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                      </p>
                      {isPending && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded font-medium">{"Proposed"}</span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      {isLivingGroup && !frozen && (
                        <button
                          onClick={() => handleCancelBooking(time.id)}
                          disabled={processingId === time.id}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          {processingId === time.id ? '...' : "Cancel"}
                        </button>
                      )}
                      {role === 'admin' && (
                        <button
                          onClick={() => handleDelete(time.id)}
                          disabled={processingId === time.id}
                          className={`text-xs ${confirmDeleteId === time.id ? 'text-red-700 font-medium' : 'text-red-600 hover:text-red-700'}`}
                        >
                          {processingId === time.id ? '...' : confirmDeleteId === time.id ? "Confirm?" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 leading-snug">
                    {"Posted by"}{' '}
                    {isLivingGroup && getCreatorEmail(time) ? (
                      <a href={`mailto:${getCreatorEmail(time)}`} className="text-accent hover:underline font-medium">{getCreatorLabel(time)}</a>
                    ) : (
                      <span className="font-medium">{getCreatorLabel(time)}</span>
                    )}
                    {' · '}{"Booked by"}{' '}
                    {isAdminOrPhotographer && getLivingGroupEmail(time) ? (
                      <a href={`mailto:${getLivingGroupEmail(time)}`} className="text-green-700 hover:underline font-medium">{getLg(time)?.name || "Booked"}</a>
                    ) : (
                      <span className="text-green-700 font-medium">{getLg(time)?.name || "Booked"}</span>
                    )}
                    {isConfirmed && time.location && <>{' · '}{time.location}</>}
                    {time.notes && <>{' · '}<span className="italic">{time.notes}</span></>}
                  </p>
                  {/* Admin location selector for pending bookings */}
                  {isPending && isAdminOrPhotographer && onConfirmLocation && time.proposed_locations?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-yellow-200">
                      <p className="text-xs font-medium mb-1">{"Select a location:"}</p>
                      <div className="flex flex-wrap gap-1">
                        {time.proposed_locations.map((loc, i) => (
                          <button
                            key={i}
                            onClick={async () => {
                              setConfirmingLocationId(time.id);
                              try {
                                await onConfirmLocation(time.id, loc);
                              } finally {
                                setConfirmingLocationId(null);
                              }
                            }}
                            disabled={confirmingLocationId === time.id}
                            className="text-xs px-2 py-1 bg-white border border-yellow-300 rounded hover:bg-yellow-100 disabled:opacity-50"
                          >
                            {confirmingLocationId === time.id ? '...' : loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* LG view of pending locations */}
                  {isPending && isLivingGroup && time.proposed_locations?.length > 0 && (
                    <p className="text-xs text-text-muted mt-1">
                      {"Proposed locations"}: {time.proposed_locations.join(', ')}
                    </p>
                  )}
                  {/* Photographer assignment for admin (only for confirmed bookings) */}
                  {role === 'admin' && isConfirmed && onAssignPhotographer && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium whitespace-nowrap">{"Photographer"}:</label>
                        <select
                          value={getPhotographer(time)?.id || ''}
                          onChange={(e) => handleAssignPhotographer(time.id, e.target.value || null)}
                          disabled={assigningPhotographerId === time.id}
                          className="flex-1 text-xs border border-border rounded px-2 py-1 bg-white disabled:opacity-50"
                        >
                          <option value="">{"Unassigned"}</option>
                          {photographers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name || p.email}
                            </option>
                          ))}
                        </select>
                        {assigningPhotographerId === time.id && (
                          <span className="text-xs text-text-muted">...</span>
                        )}
                      </div>
                      {getPhotographer(time) && (
                        <p className="text-xs text-green-700 mt-1">
                          {"Assigned to"}: {getPhotographer(time)?.name || getPhotographer(time)?.email}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Show assigned photographer for non-admin users */}
                  {role !== 'admin' && getPhotographer(time) && (
                    <p className="text-xs text-green-700 mt-1">
                      {"Photographer"}: {getPhotographer(time)?.name || getPhotographer(time)?.email}
                    </p>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Times */}
        {(availableTimes.length > 0 || (isLivingGroup && !frozen && !isPast && onPropose)) && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-muted uppercase mb-2 group/tooltip relative inline-block cursor-help" title={"Click on dates and the calendar grid to set or propose time slots"}>
              {"Available"}
              <svg className="w-3.5 h-3.5 inline-block ml-1 -mt-0.5 text-text-muted/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </h4>
            <div className="space-y-2">
              {availableTimes.map((time) => {
                const isBookingThis = bookingTimeId === time.id;
                return (
                <div key={time.id} className={`px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm${(currentUserId && time.created_by === currentUserId) ? ' !border-l-[3px] !border-l-accent' : ''}`}>
                  <div className="flex justify-between items-center">
                    <p className="font-medium pb-0">
                      {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                    </p>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      {isLivingGroup && !frozen && !isPast && !isBookingThis && (
                        <button
                          onClick={() => { setBookingTimeId(time.id); setProposedLocations(['']); }}
                          disabled={processingId === time.id}
                          className="text-xs px-2.5 py-1 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                        >
                          {"Book"}
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
                              {processingId === time.id ? '...' : confirmDeleteId === time.id ? "Confirm?" : "Delete"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 leading-snug">
                    {"Posted by"}{' '}
                    {isLivingGroup && getCreatorEmail(time) ? (
                      <a href={`mailto:${getCreatorEmail(time)}`} className="text-accent hover:underline font-medium">{getCreatorLabel(time)}</a>
                    ) : (
                      <span className="font-medium">{getCreatorLabel(time)}</span>
                    )}
                    {time.notes && <>{' · '}<span className="italic">{time.notes}</span></>}
                  </p>
                  {/* Booking location form */}
                  {isBookingThis && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs font-medium mb-1">{"Proposed Location(s)"}</p>
                      <div className="space-y-1.5">
                        {proposedLocations.map((loc, i) => (
                          <div key={i} className="flex gap-1">
                            <input
                              type="text"
                              value={loc}
                              onChange={(e) => {
                                const updated = [...proposedLocations];
                                updated[i] = e.target.value;
                                setProposedLocations(updated);
                              }}
                              placeholder={"e.g., Baker House Main Lounge"}
                              className="flex-1 border border-border rounded px-2 py-1 text-xs"
                              maxLength={200}
                            />
                            {proposedLocations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setProposedLocations(proposedLocations.filter((_, j) => j !== i))}
                                className="text-red-500 text-xs px-1 hover:text-red-700"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        {proposedLocations.length < 5 && (
                          <button
                            type="button"
                            onClick={() => setProposedLocations([...proposedLocations, ''])}
                            className="text-xs text-accent hover:underline"
                          >
                            + {"Add another location"}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            const cleaned = proposedLocations.map(l => l.trim()).filter(l => l.length > 0);
                            if (cleaned.length === 0) return;
                            handleBook(time.id, cleaned);
                          }}
                          disabled={processingId === time.id}
                          className="text-xs px-2.5 py-1 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
                        >
                          {processingId === time.id ? '...' : "Confirm Booking"}
                        </button>
                        <button
                          onClick={() => { setBookingTimeId(null); setProposedLocations(['']); }}
                          className="text-xs text-text-secondary hover:text-text-primary"
                        >
                          {"Cancel"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}

              {/* Propose time (living group) */}
              {isLivingGroup && !frozen && !isPast && onPropose && (
                showProposeForm ? (
                  <CreateSlotForm
                    date={date}
                    onSubmit={handlePropose}
                    onCancel={() => setShowProposeForm(false)}
                    submitLabel={"Propose"}
                    initialStartTime={initialStartTime}
                    initialEndTime={initialEndTime}
                  />
                ) : (
                  <button
                    onClick={() => setShowProposeForm(true)}
                    className="w-full py-2 text-sm border border-dashed border-accent/40 text-accent rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    + {"Propose Time"}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Proposals */}
        {proposals.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-muted uppercase mb-2">{"Proposed"}</h4>
            <div className="space-y-2">
              {proposals.map((proposal) => {
                // Living groups see other groups' proposals as gray
                const isOwnProposal = isLivingGroup || isAdminOrPhotographer;
                const proposalBorder = isOwnProposal ? 'border-blue-200' : 'border-gray-200';
                const proposalBg = isOwnProposal ? 'bg-blue-50' : 'bg-gray-50';
                const proposalNameColor = isOwnProposal ? 'text-blue-700' : 'text-gray-700';
                return (
                <div key={proposal.id} className={`px-3 py-2 border ${proposalBorder} ${proposalBg} rounded-lg text-sm${isLivingGroup ? ' !border-l-[3px] !border-l-accent' : ''}`}>
                  <div className="flex justify-between items-center">
                    <p className="font-medium pb-0">
                      {formatTime(proposal.start_time)} - {formatTime(proposal.end_time)} EST
                    </p>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      {isAdminOrPhotographer && (
                        <>
                          <button
                            onClick={() => handleAcceptProposal(proposal.id)}
                            disabled={processingId === proposal.id}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingId === proposal.id ? '...' : "Accept"}
                          </button>
                          <button
                            onClick={() => handleDeclineProposal(proposal.id)}
                            disabled={processingId === proposal.id}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {processingId === proposal.id ? '...' : "Decline"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 leading-snug">
                    {"Proposed by"}{' '}
                    {isAdminOrPhotographer && getLivingGroupEmail(proposal) ? (
                      <a href={`mailto:${getLivingGroupEmail(proposal)}`} className={`${proposalNameColor} hover:underline font-medium`}>{getLg(proposal)?.name || "Unknown"}</a>
                    ) : (
                      <span className={`${proposalNameColor} font-medium`}>{getLg(proposal)?.name || "Unknown"}</span>
                    )}
                    {proposal.notes && <>{' · '}<span className="italic">{proposal.notes}</span></>}
                  </p>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {availableTimes.length === 0 && bookedTimes.length === 0 && proposals.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">{"No time slots for this day"}</p>
        )}
      </div>
    </motion.div>
  );
}
