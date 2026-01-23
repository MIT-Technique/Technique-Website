'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';

export default function ClubPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('clubPage');
  const { isLoggedIn, user, club, loading: userLoading, refetch } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberList: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    if (!userLoading && (!isLoggedIn || user?.role !== 'club')) {
      router.push(`/${locale}/login`);
    }
  }, [isLoggedIn, user, userLoading, router, locale]);

  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        description: club.description || '',
        memberList: club.member_list || '',
      });
    }
  }, [club]);

  useEffect(() => {
    // Check if form is frozen
    async function checkFrozen() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        const frozen = data.frozenForms?.some(f => f.form_name === 'club_form' && f.is_frozen);
        setIsFrozen(frozen || false);
      } catch (error) {
        console.error('Error checking frozen status:', error);
      }
    }
    checkFrozen();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isFrozen) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('success') });
        refetch();
      } else {
        setMessage({ type: 'error', text: data.error || t('error') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('error') });
    } finally {
      setSaving(false);
    }
  }

  if (userLoading) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32">
        <div className="container-text text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn || user?.role !== 'club') {
    return null;
  }

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32 pb-12">
        <section className="container-text">
          <h1 className="mb-4">{t('title')}</h1>
          <p className="text-text-secondary mb-8">
            {t('welcome', { email: user?.email })}
          </p>

          {/* Status */}
          {club && (
            <div className={`mb-6 p-4 rounded-lg ${
              club.approval_status === 'pending'
                ? 'bg-yellow-50 border border-yellow-200'
                : club.approval_status === 'approved'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className="font-medium">
                {t('status')}: {t(`statusValues.${club.approval_status}`)}
              </p>
              <p className="text-sm text-text-secondary">
                {t('clubId')}: {club.club_id}
              </p>
              {club.approval_notes && (
                <p className="text-sm text-text-secondary mt-2">
                  {t('notes')}: {club.approval_notes}
                </p>
              )}
            </div>
          )}

          {/* Frozen Notice */}
          {isFrozen && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">{t('frozen')}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t('form.name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-border rounded px-4 py-2"
                disabled={isFrozen}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('form.description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-border rounded px-4 py-2 min-h-[100px]"
                disabled={isFrozen}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('form.memberList')}</label>
              <textarea
                value={formData.memberList}
                onChange={(e) => setFormData({ ...formData, memberList: e.target.value })}
                className="w-full border border-border rounded px-4 py-2 min-h-[150px]"
                placeholder={t('form.memberListPlaceholder')}
                disabled={isFrozen}
              />
              <p className="text-sm text-text-muted mt-1">{t('form.memberListHint')}</p>
            </div>

            {/* Images Section */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('form.images')}</label>
              <p className="text-sm text-text-muted mb-4">{t('form.imagesHint')}</p>
              <div className="flex gap-4">
                {[club?.candid_image_1, club?.candid_image_2, club?.candid_image_3]
                  .filter(Boolean)
                  .map((img, i) => (
                    <div key={i} className="relative">
                      <img
                        src={img}
                        alt={`Club image ${i + 1}`}
                        className="w-24 h-24 object-cover rounded"
                      />
                    </div>
                  ))}
              </div>
              <p className="text-sm text-text-muted mt-2">{t('form.uploadNote')}</p>
            </div>

            {message.text && (
              <div className={`p-4 rounded ${
                message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || isFrozen}
              className="btn-primary"
            >
              {saving ? t('saving') : t('save')}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
