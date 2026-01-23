'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// Format 24-hour time to 12-hour AM/PM format
function formatTime(time24) {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function PhotoshootsPage() {
  const t = useTranslations('dashboard.photoshoots');
  const [times, setTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTime, setNewTime] = useState({ date: '', startTime: '', endTime: '', notes: '' });

  useEffect(() => {
    fetchTimes();
  }, [filter]);

  async function fetchTimes() {
    try {
      setLoading(true);
      let url = '/api/admin/photoshoot-times';
      if (filter === 'booked') url += '?booked=true';
      if (filter === 'available') url += '?available=true';
      if (filter === 'cancellation') url += '?cancellation_requested=true';

      const res = await fetch(url);
      const data = await res.json();
      setTimes(data.times || []);
    } catch (error) {
      console.error('Error fetching times:', error);
    } finally {
      setLoading(false);
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
        setNewTime({ date: '', startTime: '', endTime: '', notes: '' });
        setShowAddForm(false);
        fetchTimes();
      }
    } catch (error) {
      console.error('Error adding time:', error);
    }
  }

  async function handleCancellationAction(timeId, action) {
    try {
      const res = await fetch('/api/admin/photoshoot-times', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeId, action }),
      });

      if (res.ok) {
        fetchTimes();
      }
    } catch (error) {
      console.error('Error processing cancellation:', error);
    }
  }

  async function handleDelete(timeId) {
    if (!confirm(t('confirmDelete'))) return;

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">{t('title')}</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-sm"
        >
          {showAddForm ? t('cancel') : t('addTime')}
        </button>
      </div>

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
                className="w-full border border-border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.startTime')}</label>
              <input
                type="time"
                value={newTime.startTime}
                onChange={(e) => setNewTime({ ...newTime, startTime: e.target.value })}
                className="w-full border border-border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('form.endTime')}</label>
              <input
                type="time"
                value={newTime.endTime}
                onChange={(e) => setNewTime({ ...newTime, endTime: e.target.value })}
                className="w-full border border-border rounded px-3 py-2 text-sm"
                required
              />
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
      <div className="flex gap-2 mb-4">
        {['all', 'available', 'booked', 'cancellation'].map((f) => (
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

      {/* Times List */}
      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : times.length === 0 ? (
        <p className="text-text-secondary">{t('noTimes')}</p>
      ) : (
        <div className="space-y-3">
          {times.map((time) => (
            <div
              key={time.id}
              className={`p-4 border rounded-lg ${
                time.cancellation_requested
                  ? 'border-red-200 bg-red-50'
                  : time.living_group_id
                  ? 'border-green-200 bg-green-50'
                  : 'border-border'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {new Date(time.date).toLocaleDateString()} &middot; {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                  </p>
                  {time.living_group && (
                    <p className="text-sm text-text-secondary mt-1">
                      {t('bookedBy')}: {time.living_group.name}
                    </p>
                  )}
                  {time.location && (
                    <p className="text-sm text-text-secondary mt-1">
                      {t('location')}: {time.location}
                    </p>
                  )}
                  {time.cancellation_requested && (
                    <p className="text-sm text-red-600 mt-1">
                      {t('cancellationRequested')}: {time.cancellation_request_reason || t('noReason')}
                    </p>
                  )}
                  {time.notes && (
                    <p className="text-sm text-text-muted mt-1">{time.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {time.cancellation_requested && (
                    <>
                      <button
                        onClick={() => handleCancellationAction(time.id, 'approve_cancellation')}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        {t('approve')}
                      </button>
                      <button
                        onClick={() => handleCancellationAction(time.id, 'deny_cancellation')}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        {t('deny')}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(time.id)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
