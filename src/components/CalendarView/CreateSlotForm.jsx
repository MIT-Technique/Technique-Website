'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

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

function formatTimeLabel(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

const TIME_OPTIONS = generateTimeOptions();

export default function CreateSlotForm({ date, onSubmit, onCancel, submitLabel }) {
  const t = useTranslations('calendarView');
  const [form, setForm] = useState({
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.startTime || !form.endTime) {
      setError(t('fieldsRequired'));
      return;
    }
    if (form.startTime >= form.endTime) {
      setError(t('startBeforeEnd'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        date,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location,
        notes: form.notes,
      });
      setForm({ startTime: '', endTime: '', location: '', notes: '' });
    } catch (err) {
      setError(err.message || t('createError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border border-border rounded-lg bg-bg-secondary space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium mb-1">{t('startTime')} (EST)</label>
          <select
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="w-full text-sm border border-border rounded px-2 py-1.5"
            required
          >
            <option value="">--</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>{formatTimeLabel(time)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">{t('endTime')} (EST)</label>
          <select
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            className="w-full text-sm border border-border rounded px-2 py-1.5"
            required
          >
            <option value="">--</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>{formatTimeLabel(time)}</option>
            ))}
          </select>
        </div>
      </div>
      <input
        type="text"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        placeholder={t('locationPlaceholder')}
        className="w-full text-sm border border-border rounded px-2 py-1.5"
      />
      <input
        type="text"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder={t('notesPlaceholder')}
        className="w-full text-sm border border-border rounded px-2 py-1.5"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 text-sm py-1.5 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
        >
          {submitting ? '...' : (submitLabel || t('createSlot'))}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm py-1.5 px-3 border border-border rounded hover:bg-bg-secondary"
        >
          {t('cancelAction')}
        </button>
      </div>
    </form>
  );
}
