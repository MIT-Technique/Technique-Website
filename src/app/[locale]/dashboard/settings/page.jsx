'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('dashboard.settings');
  const [formSettings, setFormSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  const forms = [
    { name: 'senior_bio', label: t('forms.seniorBio') },
    { name: 'club_form', label: t('forms.clubForm') },
    { name: 'living_group_booking', label: t('forms.livingGroupBooking') },
  ];

  useEffect(() => {
    fetchSettings();
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

  function isFormFrozen(formName) {
    const setting = formSettings.find(s => s.form_name === formName);
    return setting?.is_frozen || false;
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-6">{t('title')}</h2>

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

      <div className="border-t border-border pt-8">
        <h3 className="text-md font-medium mb-4">{t('info.title')}</h3>
        <div className="text-sm text-text-secondary space-y-2">
          <p>{t('info.adminEmail')}: technique@mit.edu</p>
          <p>{t('info.graduatingYear')}: 2026</p>
        </div>
      </div>
    </div>
  );
}
