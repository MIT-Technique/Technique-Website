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

  // Tab state
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFrozen, setIsFrozen] = useState(false);

  // Email state
  const [clubEmail, setClubEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Members state (manual members only)
  const [manualMembers, setManualMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersMessage, setMembersMessage] = useState({ type: '', text: '' });
  const [newManualMember, setNewManualMember] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  // Documents state
  const [documents, setDocuments] = useState({
    links: '',
    notes: '',
  });
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [documentsMessage, setDocumentsMessage] = useState({ type: '', text: '' });
  const [documentsLoading, setDocumentsLoading] = useState(true);


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
      });
    }
  }, [club]);

  useEffect(() => {
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

  // Fetch data when logged in
  useEffect(() => {
    if (isLoggedIn && user?.role === 'club') {
      fetchMembers();
      fetchDocuments();
      fetchClubEmail();
    }
  }, [isLoggedIn, user]);

  async function fetchClubEmail() {
    try {
      const res = await fetch('/api/clubs/email');
      const data = await res.json();
      if (res.ok && data.email) {
        setClubEmail(data.email);
      }
    } catch (error) {
      console.error('Error fetching club email:', error);
    }
  }

  async function handleSaveEmail() {
    setSavingEmail(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clubEmail.trim() }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('email.saved') });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t('email.error') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('email.error') });
    } finally {
      setSavingEmail(false);
    }
  }


  async function fetchMembers() {
    try {
      setMembersLoading(true);
      const res = await fetch('/api/clubs/manual-members');
      const data = await res.json();
      setManualMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }
  }

  async function fetchDocuments() {
    try {
      setDocumentsLoading(true);
      const res = await fetch('/api/clubs/documents');
      const data = await res.json();
      if (res.ok && data.documents) {
        setDocuments({
          links: data.documents.links || '',
          notes: data.documents.notes || '',
        });
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function handleSaveDocuments(e) {
    e.preventDefault();
    setSavingDocuments(true);
    setDocumentsMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documents),
      });

      if (res.ok) {
        setDocumentsMessage({ type: 'success', text: t('documents.saveSuccess') });
      } else {
        const data = await res.json();
        setDocumentsMessage({ type: 'error', text: data.error || t('documents.saveError') });
      }
    } catch (error) {
      setDocumentsMessage({ type: 'error', text: t('documents.saveError') });
    } finally {
      setSavingDocuments(false);
    }
  }

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

  async function handleAddManualMember(e) {
    e.preventDefault();
    if (!newManualMember.trim()) return;

    setAddingMember(true);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newManualMember.trim() }),
      });

      if (res.ok) {
        setNewManualMember('');
        setMembersMessage({ type: 'success', text: t('members.addSuccess') });
        fetchMembers();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.addError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.addError') });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveManualMember(memberId) {
    setRemovingMemberId(memberId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/clubs/manual-members?id=${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembersMessage({ type: 'success', text: t('members.removeSuccess') });
        fetchMembers();
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.removeError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.removeError') });
    } finally {
      setRemovingMemberId(null);
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

  const tabs = [
    { id: 'profile', label: t('tabs.profile') },
    { id: 'members', label: t('tabs.members') },
    { id: 'documents', label: t('tabs.documents') },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32 pb-12">
        <section className="container-text">
          <h1 className="mb-2">{t('title')}</h1>
          <p className="text-text-secondary mb-8">
            {t('welcome', { name: club?.name || '' })}
          </p>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {isFrozen && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-medium">{t('frozen')}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('email.title')}</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={clubEmail}
                      onChange={(e) => setClubEmail(e.target.value)}
                      placeholder={t('email.placeholder')}
                      className="flex-1 border border-border rounded px-4 py-2"
                      disabled={isFrozen}
                    />
                    <button
                      type="button"
                      onClick={handleSaveEmail}
                      disabled={savingEmail || isFrozen}
                      className="px-4 py-2 bg-[#750014] text-white rounded hover:bg-[#5C0010] disabled:opacity-50 whitespace-nowrap"
                    >
                      {savingEmail ? '...' : t('email.save')}
                    </button>
                  </div>
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

            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              {membersMessage.text && (
                <div className={`mb-6 p-4 rounded ${
                  membersMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {membersMessage.text}
                </div>
              )}

              <h2 className="text-lg font-medium mb-4">{t('members.title')}</h2>

              {/* Add member form */}
              <form onSubmit={handleAddManualMember} className="mb-6 flex gap-2">
                <input
                  type="text"
                  value={newManualMember}
                  onChange={(e) => setNewManualMember(e.target.value)}
                  placeholder={t('members.addPlaceholder')}
                  className="flex-1 border border-border rounded px-4 py-2"
                />
                <button
                  type="submit"
                  disabled={addingMember || !newManualMember.trim()}
                  className="btn-primary"
                >
                  {addingMember ? t('members.adding') : t('members.add')}
                </button>
              </form>

              {/* Members List */}
              {membersLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : manualMembers.length === 0 ? (
                <p className="text-text-secondary">{t('members.noMembers')}</p>
              ) : (
                <div className="space-y-2">
                  {manualMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 border border-border rounded-lg flex justify-between items-center"
                    >
                      <p>{member.name}</p>
                      <button
                        onClick={() => handleRemoveManualMember(member.id)}
                        disabled={removingMemberId === member.id}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        {removingMemberId === member.id ? t('members.removing') : t('members.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <h2 className="text-lg font-medium mb-2">{t('documents.title')}</h2>
              <p className="text-text-secondary text-sm mb-6">{t('documents.description')}</p>

              {documentsMessage.text && (
                <div className={`mb-6 p-4 rounded ${
                  documentsMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {documentsMessage.text}
                </div>
              )}

              {documentsLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : (
                <form onSubmit={handleSaveDocuments} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('documents.linksLabel')}</label>
                    <textarea
                      value={documents.links}
                      onChange={(e) => setDocuments({ ...documents, links: e.target.value })}
                      placeholder={t('documents.linksPlaceholder')}
                      className="w-full border border-border rounded px-4 py-2 min-h-[120px] font-mono text-sm"
                      maxLength={2000}
                    />
                    <p className="text-xs text-text-muted mt-1">
                      {t('documents.linksHint')} ({documents.links.length}/2000)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t('documents.notesLabel')}</label>
                    <textarea
                      value={documents.notes}
                      onChange={(e) => setDocuments({ ...documents, notes: e.target.value })}
                      placeholder={t('documents.notesPlaceholder')}
                      className="w-full border border-border rounded px-4 py-2 min-h-[150px]"
                      maxLength={5000}
                    />
                    <p className="text-xs text-text-muted mt-1">
                      {t('documents.notesHint')} ({documents.notes.length}/5000)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={savingDocuments}
                    className="btn-primary"
                  >
                    {savingDocuments ? t('saving') : t('documents.save')}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
