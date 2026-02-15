'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings');
  const [formSettings, setFormSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hire rate state
  const [hireRate, setHireRate] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);

  const forms = [
    { name: 'senior_bio', label: t('forms.seniorBio') },
    { name: 'club_form', label: t('forms.clubForm') },
    { name: 'living_group_booking', label: t('forms.livingGroupBooking') },
    { name: 'sports_form', label: t('forms.sportsForm') },
    { name: 'candids_form', label: t('forms.candidsForm') },
    { name: 'student_work_form', label: t('forms.studentWorkForm') },
  ];

  useEffect(() => {
    fetchSettings();
    fetchHireRate();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/form-settings');
      const data = await res.json();
      setFormSettings(data.formSettings || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFreeze(formName, currentlyFrozen) {
    try {
      const res = await fetch('/api/admin/form-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formName, freeze: !currentlyFrozen }),
      });

      if (res.ok) {
        fetchSettings();
      }
    } catch (error) {
      console.error('Error updating form setting:', error);
    }
  }

  async function fetchHireRate() {
    try {
      const res = await fetch('/api/hire/rate');
      const data = await res.json();
      setHireRate(String(data.rate || 85));
    } catch (error) {
      console.error('Error fetching hire rate:', error);
      setHireRate('85');
    }
  }

  async function handleSaveRate() {
    const rate = parseFloat(hireRate);
    if (isNaN(rate) || rate <= 0) return;
    setSavingRate(true);
    setRateSaved(false);
    try {
      const res = await fetch('/api/hire/rate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate }),
      });
      if (res.ok) {
        setRateSaved(true);
        setTimeout(() => setRateSaved(false), 4000);
      }
    } catch (error) {
      console.error('Error saving hire rate:', error);
    } finally {
      setSavingRate(false);
    }
  }

  function isFormFrozen(formName) {
    const setting = formSettings.find(s => s.form_name === formName);
    return setting?.is_frozen || false;
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-md font-medium mb-4">{t('formFreeze.title')}</h3>
        <p className="text-sm text-text-secondary mb-4">{t('formFreeze.description')}</p>

        {loading ? (
          <p className="text-text-secondary">Loading...</p>
        ) : (
          <div className="space-y-3">
            {forms.map((form) => {
              const isFrozen = isFormFrozen(form.name);
              return (
                <div
                  key={form.name}
                  className={`p-4 border rounded-lg flex justify-between items-center ${
                    isFrozen ? 'border-red-200 bg-red-50' : 'border-border'
                  }`}
                >
                  <div>
                    <p className="font-medium">{form.label}</p>
                    <p className={`text-sm ${isFrozen ? 'text-red-600' : 'text-text-secondary'}`}>
                      {isFrozen ? t('formFreeze.frozen') : t('formFreeze.active')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFreeze(form.name, isFrozen)}
                    className={`px-4 py-2 text-sm rounded ${
                      isFrozen
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isFrozen ? t('formFreeze.unfreeze') : t('formFreeze.freeze')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hire Rate */}
      <div className="mb-8">
        <h3 className="text-md font-medium mb-4">{t('hireRate.title')}</h3>
        <p className="text-sm text-text-secondary mb-4">{t('hireRate.description')}</p>
        <div className="flex items-center gap-3 max-w-xs">
          <label className="text-sm font-medium whitespace-nowrap">{t('hireRate.label')}</label>
          <input
            type="number"
            value={hireRate}
            onChange={(e) => setHireRate(e.target.value)}
            min="1"
            step="1"
            className="border border-border rounded px-3 py-2 text-sm w-24"
          />
          <button
            onClick={handleSaveRate}
            disabled={savingRate}
            className="px-4 py-2 bg-accent text-white rounded text-sm hover:bg-accent/90 disabled:opacity-50"
          >
            {savingRate ? t('hireRate.saving') : t('hireRate.save')}
          </button>
        </div>
        {rateSaved && (
          <p className="text-sm text-green-600 mt-2">{t('hireRate.saved')}</p>
        )}
      </div>
    </div>
  );
}
