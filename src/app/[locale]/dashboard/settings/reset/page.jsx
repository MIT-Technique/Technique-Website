'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ConfirmationModal from '../../../../../components/ConfirmationModal/ConfirmationModal';

const RESET_ACTIONS = [
  { id: 'clear_booking_times', translationKey: 'clearBookingTimes' },
  { id: 'clear_senior_bios', translationKey: 'clearSeniorBios' },
  { id: 'clear_community_candids', translationKey: 'clearCommunityCandids' },
  { id: 'clear_student_work', translationKey: 'clearStudentWork' },
  { id: 'clear_org_images', translationKey: 'clearOrgImages' },
];

export default function ResetPage() {
  const t = useTranslations('dashboard.settings.reset');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  function openConfirm(actionId) {
    setActiveAction(actionId);
    setModalOpen(true);
  }

  async function handleConfirm() {
    setLoading(true);
    setModalOpen(false);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: activeAction }),
      });
      const data = await res.json();
      setResults(prev => ({ ...prev, [activeAction]: res.ok ? 'success' : data.error || 'error' }));
    } catch (error) {
      console.error('Reset error:', error);
      setResults(prev => ({ ...prev, [activeAction]: 'error' }));
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  const activeTranslationKey = RESET_ACTIONS.find(a => a.id === activeAction)?.translationKey;

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">{t('title')}</h2>
      <p className="text-sm text-text-secondary mb-6">{t('description')}</p>

      <div className="space-y-4">
        {RESET_ACTIONS.map((action) => (
          <div key={action.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium">{t(`${action.translationKey}.label`)}</p>
              <p className="text-xs text-text-secondary mt-0.5">{t(`${action.translationKey}.description`)}</p>
            </div>
            <div className="flex items-center gap-3">
              {results[action.id] === 'success' && (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">{t('cleared')}</span>
              )}
              {results[action.id] && results[action.id] !== 'success' && (
                <span className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">{t('error')}</span>
              )}
              <button
                onClick={() => openConfirm(action.id)}
                disabled={loading && activeAction === action.id}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading && activeAction === action.id ? '...' : t('resetButton')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        open={modalOpen}
        title={t('confirmTitle')}
        message={activeTranslationKey ? t(`${activeTranslationKey}.confirmMessage`) : ''}
        confirmText={t('confirmButton')}
        cancelText={t('cancelButton')}
        onConfirm={handleConfirm}
        onCancel={() => { setModalOpen(false); setActiveAction(null); }}
        isDangerous={true}
      />
    </div>
  );
}
