'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUser } from '../../../../hooks/useUser';
import ConfirmationModal from '../../../../components/ConfirmationModal/ConfirmationModal';
import CalendarView from '../../../../components/CalendarView/CalendarView';

// Format 24-hour time to 12-hour AM/PM format
function formatTime(time24) {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Generate 15-minute time slot options (06:00 to 23:45)
function generateTimeOptions() {
  const options = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push(time);
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function getDefaultStartTime() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  minutes = Math.ceil(minutes / 15) * 15;
  if (minutes >= 60) { hours += 1; minutes = 0; }
  if (hours < 6) { hours = 6; minutes = 0; }
  else if (hours >= 24) { hours = 6; minutes = 0; }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getDefaultEndTime(startTime) {
  if (!startTime) return '07:00';
  const [h, m] = startTime.split(':').map(Number);
  let endH = h + 1;
  if (endH > 23) endH = 23;
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function PhotoshootsPage() {
  const t = useTranslations('dashboard.photoshoots');
  const tc = useTranslations('calendarView');
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';
  const [times, setTimes] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');
  const [newTime, setNewTime] = useState(() => {
    const start = getDefaultStartTime();
    return { date: new Date().toISOString().split('T')[0], startTime: start, endTime: getDefaultEndTime(start), notes: '' };
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [timeAssignments, setTimeAssignments] = useState({});

  useEffect(() => {
    fetchTimes();
    fetchProposals();
  }, [filter]);

  async function fetchTimes() {
    try {
      setLoading(true);
      let url = '/api/admin/photoshoot-times';
      if (filter === 'booked') url += '?booked=true';
      if (filter === 'available') url += '?available=true';

      const res = await fetch(url);
      const data = await res.json();
      const timesList = data.times || [];
      setTimes(timesList);
      fetchTimeAssignments(timesList);
    } catch (error) {
      console.error('Error fetching times:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimeAssignments(timesList) {
    try {
      const bookedIds = (timesList || times)
        .filter((t) => t.living_group_id && !t.cancelled_at)
        .map((t) => t.id);
      if (bookedIds.length === 0) { setTimeAssignments({}); return; }
      const results = await Promise.all(
        bookedIds.map((id) =>
          fetch(`/api/living-groups/time-assignments?photoshootTimeId=${id}`)
            .then((r) => r.ok ? r.json() : { assignments: [] })
        )
      );
      const map = {};
      results.forEach((data) => {
        (data.assignments || []).forEach((a) => {
          if (!a.sectionName) return;
          if (!map[a.photoshootTimeId]) map[a.photoshootTimeId] = {};
          map[a.photoshootTimeId][`${a.slotStart.slice(0, 5)}-${a.slotEnd.slice(0, 5)}`] = a.sectionName;
        });
      });
      setTimeAssignments(map);
    } catch (error) {
      console.error('Error fetching time assignments:', error);
    }
  }

  async function fetchProposals() {
    try {
      const res = await fetch('/api/photographer/proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  }

  async function handleAddTime(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/photoshoot-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTime),
      });

      if (res.ok) {
        const start = getDefaultStartTime();
        setNewTime({ date: new Date().toISOString().split('T')[0], startTime: start, endTime: getDefaultEndTime(start), notes: '' });
        setShowAddForm(false);
        fetchTimes();
      }
    } catch (error) {
      console.error('Error adding time:', error);
    }
  }

  function handleDeleteClick(timeId) {
    setDeleteTargetId(timeId);
    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm() {
    const timeId = deleteTargetId;
    setDeleteModalOpen(false);
    setDeleteTargetId(null);

    try {
      const res = await fetch('/api/admin/photoshoot-times', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeId }),
      });

      if (res.ok) {
        fetchTimes();
      }
    } catch (error) {
      console.error('Error deleting time:', error);
    }
  }

  async function handleAcceptProposal(proposalId) {
    const res = await fetch('/api/photographer/proposals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, action: 'accept' }),
    });
    if (res.ok) {
      fetchProposals();
      fetchTimes();
    }
  }

  async function handleDeclineProposal(proposalId, reason) {
    const res = await fetch('/api/photographer/proposals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, action: 'decline', decline_reason: reason }),
    });
    if (res.ok) {
      fetchProposals();
    }
  }

  async function handleCalendarCreate(formData) {
    const res = await fetch('/api/admin/photoshoot-times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes || '',
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create');
    }
    fetchTimes();
  }

  async function handleConfirmLocation(timeId, location) {
    const res = await fetch('/api/admin/photoshoot-times/confirm-location', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeId, location }),
    });
    if (res.ok) fetchTimes();
  }

  async function handleCalendarDelete(timeId) {
    const res = await fetch('/api/admin/photoshoot-times', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeId }),
    });
    if (res.ok) fetchTimes();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">{t('title')}</h2>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 text-sm ${viewMode === 'calendar' ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'}`}
            >
              {tc('calendar')}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'}`}
            >
              {tc('list')}
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView
          role="admin"
          times={times}
          proposals={proposals}
          loading={loading}
          timeAssignments={timeAssignments}
          onCreate={handleCalendarCreate}
          onDelete={handleCalendarDelete}
          onAcceptProposal={handleAcceptProposal}
          onDeclineProposal={handleDeclineProposal}
          onConfirmLocation={handleConfirmLocation}
        />
      ) : (
        <>
          {/* Add Time Form */}
          {showAddForm && (
            <form onSubmit={handleAddTime} className="mb-6 p-4 border border-border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('form.date')}</label>
                  <input
                    type="date"
                    value={newTime.date}
                    onChange={(e) => setNewTime({ ...newTime, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-border rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('form.startTime')} (EST)</label>
                  <select
                    value={newTime.startTime}
                    onChange={(e) => setNewTime({ ...newTime, startTime: e.target.value })}
                    className="w-full border border-border rounded px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select time</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{formatTime(time)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('form.endTime')} (EST)</label>
                  <select
                    value={newTime.endTime}
                    onChange={(e) => setNewTime({ ...newTime, endTime: e.target.value })}
                    className="w-full border border-border rounded px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select time</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{formatTime(time)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('form.notes')}</label>
                  <input
                    type="text"
                    value={newTime.notes}
                    onChange={(e) => setNewTime({ ...newTime, notes: e.target.value })}
                    className="w-full border border-border rounded px-3 py-2 text-sm"
                    placeholder={t('form.notesPlaceholder')}
                  />
                </div>
              </div>
              <button type="submit" className="mt-4 btn-primary text-sm">
                {t('form.submit')}
              </button>
            </form>
          )}

          {/* Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {['all', 'available', 'booked'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === f
                      ? 'bg-accent text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                  }`}
                >
                  {t(`filters.${f}`)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary text-sm"
            >
              {showAddForm ? t('cancel') : t('addTime')}
            </button>
          </div>

          {/* Times List */}
          {loading ? (
            <p className="text-text-secondary">Loading...</p>
          ) : times.length === 0 ? (
            <p className="text-text-secondary">{t('noTimes')}</p>
          ) : (
            <div className="space-y-3">
              {times.map((time) => {
                const isPending = time.booking_status === 'pending_location';
                const isConfirmed = time.booking_status === 'confirmed';
                const borderClass = isPending
                  ? 'border-yellow-200 bg-yellow-50'
                  : time.living_group_id
                    ? 'border-green-200 bg-green-50'
                    : 'border-border';
                return (
                <div
                  key={time.id}
                  className={`p-4 border rounded-lg ${borderClass}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {new Date(time.date).toLocaleDateString()} &middot; {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                        </p>
                        {isPending && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded font-medium">{t('pendingLocation')}</span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {time.created_by_user?.email && (
                          <span>Created by: <a href={`mailto:${time.created_by_user.email}`} className="text-accent hover:underline">{time.created_by_user.email}</a></span>
                        )}
                        {time.created_by_user?.email && time.living_group && (
                          <span> &middot; </span>
                        )}
                        {time.living_group && (
                          <span>
                            {t('bookedBy')}: {time.living_group.name}
                            {time.living_group.user?.email && (
                              <span> (<a href={`mailto:${time.living_group.user.email}`} className="text-accent hover:underline">{time.living_group.user.email}</a>)</span>
                            )}
                          </span>
                        )}
                      </p>
                      {isConfirmed && time.location && (
                        <p className="text-sm text-text-muted mt-1">
                          <span>{t('location')}: {time.location}</span>
                          {time.notes && <span> &middot; {time.notes}</span>}
                        </p>
                      )}
                      {!isConfirmed && time.notes && (
                        <p className="text-sm text-text-muted mt-1">{time.notes}</p>
                      )}
                      {/* Location selector for pending bookings */}
                      {isPending && time.proposed_locations?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">{t('selectLocation')}</p>
                          <div className="flex flex-wrap gap-2">
                            {time.proposed_locations.map((loc, i) => (
                              <button
                                key={i}
                                onClick={() => handleConfirmLocation(time.id, loc)}
                                className="text-sm px-3 py-1 bg-white border border-yellow-300 rounded hover:bg-yellow-100"
                              >
                                {loc}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteClick(time.id)}
                          className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </>
      )}
      <ConfirmationModal
        open={deleteModalOpen}
        title={t('delete')}
        message={t('confirmDelete')}
        confirmText={t('delete')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteModalOpen(false); setDeleteTargetId(null); }}
        isDangerous
      />
    </div>
  );
}
