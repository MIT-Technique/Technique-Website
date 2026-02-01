'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';
import ImageUpload from '../../../components/ImageUpload/ImageUpload';

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
  const [imageMessage, setImageMessage] = useState({ type: '', text: '' });
  const [isFrozen, setIsFrozen] = useState(false);

  // Email state
  const [clubEmail, setClubEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Members state (manual members only)
  const [manualMembers, setManualMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersMessage, setMembersMessage] = useState({ type: '', text: '' });
  const [inputMode, setInputMode] = useState('single'); // 'single' or 'bulk'
  const [singleMember, setSingleMember] = useState({ name: '', role: '' });
  const [bulkText, setBulkText] = useState('');
  const [parsePreview, setParsePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

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

  // Auto-fade success messages after 4 seconds
  useEffect(() => {
    if (message.type === 'success' && message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (imageMessage.type === 'success' && imageMessage.text) {
      const timer = setTimeout(() => setImageMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [imageMessage]);

  useEffect(() => {
    if (membersMessage.type === 'success' && membersMessage.text) {
      const timer = setTimeout(() => setMembersMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [membersMessage]);

  useEffect(() => {
    if (documentsMessage.type === 'success' && documentsMessage.text) {
      const timer = setTimeout(() => setDocumentsMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [documentsMessage]);

  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        description: club.description || '',
      });
    }
  }, [club]);

  // Lazy-load data per tab
  const fetchedTabs = useRef(new Set());

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'club') return;
    if (fetchedTabs.current.has(activeTab)) return;
    fetchedTabs.current.add(activeTab);

    if (activeTab === 'profile') {
      fetchClubEmail();
      (async () => {
        try {
          const res = await fetch('/api/auth/session');
          const data = await res.json();
          const frozen = data.frozenForms?.some(f => f.form_name === 'club_form' && f.is_frozen);
          setIsFrozen(frozen || false);
        } catch (error) {
          console.error('Error checking frozen status:', error);
        }
      })();
    } else if (activeTab === 'members') {
      fetchMembers();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, isLoggedIn, user]);

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

  async function handleAddSingleMember(e) {
    e.preventDefault();
    if (!singleMember.name.trim()) return;

    setAddingMember(true);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: singleMember.name.trim(),
          role: singleMember.role.trim() || null,
        }),
      });

      if (res.ok) {
        setSingleMember({ name: '', role: '' });
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

  async function handlePreviewBulk() {
    const { parseBulkNames } = await import('../../../lib/utils/nameParser');
    const result = parseBulkNames(bulkText);
    setParsePreview(result);
    setShowPreview(true);
  }

  async function handleImportBulk() {
    setAddingMember(true);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkText,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBulkText('');
        setShowPreview(false);
        setParsePreview(null);

        let message = t('members.bulkAddSuccess', { count: data.count });
        if (data.parseErrors?.length > 0) {
          message += ` ${t('members.withErrors', { count: data.parseErrors.length })}`;
        }
        if (data.duplicates?.length > 0) {
          message += ` ${t('members.withDuplicates', { count: data.duplicates.length })}`;
        }

        setMembersMessage({ type: 'success', text: message });
        fetchMembers();
      } else {
        setMembersMessage({
          type: 'error',
          text: data.error || t('members.bulkAddError'),
        });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.bulkAddError') });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveManualMember(memberId) {
    setRemovingMemberId(memberId);
    setMembersMessage({ type: '', text: '' });

    // Find the member to get their name for the success message
    const memberToRemove = manualMembers.find(m => m.id === memberId);
    const memberName = memberToRemove?.name || '';

    try {
      const res = await fetch(`/api/clubs/manual-members?id=${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembersMessage({
          type: 'success',
          text: memberName ? `${memberName} removed` : t('members.removeSuccess')
        });
        // Optimistically update state instead of refetching
        setManualMembers(prev => prev.filter(m => m.id !== memberId));
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
                  <p className="text-sm text-text-muted mb-2">{t('form.descriptionHint')}</p>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                      if (words.length <= 75 || e.target.value.length < formData.description.length) {
                        setFormData({ ...formData, description: e.target.value });
                      }
                    }}
                    placeholder={t('form.descriptionPlaceholder')}
                    className="w-full border border-border rounded px-4 py-2 min-h-[100px]"
                    disabled={isFrozen}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    {formData.description.trim().split(/\s+/).filter(Boolean).length} / 75 words
                  </p>
                </div>

                {/* Images Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('form.images')}</label>
                  <p className="text-sm text-text-muted mb-4">{t('form.imagesHint')}</p>
                  {imageMessage.text && (
                    <div className={`mb-4 p-4 rounded ${
                      imageMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {imageMessage.text}
                    </div>
                  )}
                  <div className="flex gap-4 flex-wrap">
                    {[1, 2, 3].map((slot) => {
                      const clubName = (club?.name || '').replace(/\s+/g, '_');
                      const nameSuffix = slot === 1 ? '' : `_${slot}`;
                      return (
                        <ImageUpload
                          key={slot}
                          imageUrl={club?.[`candid_image_${slot}`]}
                          label={slot === 1 ? t('form.mainImage') : t('form.additionalImage')}
                          fileName={`${clubName}_Candid${nameSuffix}`}
                          disabled={isFrozen}
                          onUpload={async (file) => {
                            setImageMessage({ type: '', text: '' });
                            const fd = new FormData();
                            fd.append('file', file);
                            fd.append('slot', String(slot));
                            const res = await fetch('/api/clubs/images', { method: 'POST', body: fd });
                            const data = await res.json();
                            if (!res.ok) {
                              setImageMessage({ type: 'error', text: data.error || 'Upload failed' });
                              throw new Error(data.error || 'Upload failed');
                            }
                            return data.url;
                          }}
                          onDelete={async () => {
                            setImageMessage({ type: '', text: '' });
                            const res = await fetch(`/api/clubs/images?slot=${slot}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (!res.ok) {
                              setImageMessage({ type: 'error', text: data.error || 'Delete failed' });
                              throw new Error(data.error || 'Delete failed');
                            }
                          }}
                        />
                      );
                    })}
                  </div>
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

              {/* Mode Switcher */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setInputMode('single')}
                  className={`px-4 py-2 rounded ${
                    inputMode === 'single'
                      ? 'bg-[#750014] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('members.addSingle')}
                </button>
                <button
                  onClick={() => setInputMode('bulk')}
                  className={`px-4 py-2 rounded ${
                    inputMode === 'bulk'
                      ? 'bg-[#750014] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('members.bulkImport')}
                </button>
              </div>

              {/* Single Add Mode */}
              {inputMode === 'single' && (
                <form onSubmit={handleAddSingleMember} className="mb-6">
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={singleMember.name}
                      onChange={(e) => setSingleMember({ ...singleMember, name: e.target.value })}
                      placeholder={t('members.namePlaceholder')}
                      className="flex-1 min-w-[150px] border border-border rounded px-4 py-2"
                      required
                    />
                    <div className="relative flex-1 min-w-[150px]">
                      <input
                        type="text"
                        value={singleMember.role}
                        onChange={(e) => setSingleMember({ ...singleMember, role: e.target.value })}
                        onFocus={() => setShowRoleDropdown(true)}
                        onBlur={() => setTimeout(() => setShowRoleDropdown(false), 150)}
                        placeholder={t('members.rolePlaceholder')}
                        className="w-full border border-border rounded px-4 py-2"
                      />
                      {showRoleDropdown && (() => {
                        const options = [
                          t('members.roles.president'),
                          t('members.roles.vicePresident'),
                          t('members.roles.secretary'),
                          t('members.roles.treasurer'),
                          t('members.roles.socialChair'),
                          t('members.roles.publicityChair'),
                        ].filter(o => !singleMember.role || o.toLowerCase().includes(singleMember.role.toLowerCase()));
                        return options.length > 0 ? (
                          <ul className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {options.map((option) => (
                              <li
                                key={option}
                                onMouseDown={() => setSingleMember({ ...singleMember, role: option })}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                              >
                                {option}
                              </li>
                            ))}
                          </ul>
                        ) : null;
                      })()}
                    </div>
                    <button
                      type="submit"
                      disabled={addingMember || !singleMember.name.trim()}
                      className="btn-primary whitespace-nowrap"
                    >
                      {addingMember ? t('members.adding') : t('members.add')}
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Import Mode */}
              {inputMode === 'bulk' && (
                <div className="mb-6">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">
                      {t('members.bulkInputLabel')}
                    </label>
                    <p className="text-xs text-text-muted mb-2">
                      {t('members.bulkInputHint')}
                    </p>
                  </div>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={t('members.bulkPlaceholder')}
                    className="w-full border border-border rounded px-4 py-2 min-h-[150px] font-mono text-sm"
                  />
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <button
                      onClick={handlePreviewBulk}
                      disabled={!bulkText.trim()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('members.preview')}
                    </button>
                    <button
                      onClick={handleImportBulk}
                      disabled={addingMember || !bulkText.trim()}
                      className="btn-primary"
                    >
                      {addingMember ? t('members.importing') : t('members.import')}
                    </button>
                  </div>

                  {/* Preview Modal */}
                  {showPreview && parsePreview && (
                    <div className="mt-4 p-4 border border-border rounded bg-gray-50">
                      <h3 className="font-medium mb-2">{t('members.previewTitle')}</h3>
                      <p className="text-sm text-text-secondary mb-3">
                        {t('members.previewCount', { count: parsePreview.success.length })}
                      </p>

                      {parsePreview.success.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-green-600 mb-1">
                            {t('members.successfulParse')} ({parsePreview.success.length})
                          </p>
                          <div className="max-h-40 overflow-y-auto bg-white p-2 rounded border text-sm">
                            {parsePreview.success.map((name, i) => (
                              <div key={i} className="py-1">
                                {name.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsePreview.errors.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-red-600 mb-1">
                            {t('members.parseErrors')} ({parsePreview.errors.length})
                          </p>
                          <div className="max-h-40 overflow-y-auto bg-white p-2 rounded border text-sm">
                            {parsePreview.errors.map((err, i) => (
                              <div key={i} className="py-1 text-red-600">
                                Line {err.line}: &quot;{err.text}&quot; - {err.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setShowPreview(false)}
                        className="text-sm text-text-secondary hover:text-text"
                      >
                        {t('members.closePreview')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              <div>
                {membersLoading ? (
                  <p className="text-text-secondary">Loading...</p>
                ) : manualMembers.length === 0 ? (
                  <p className="text-text-secondary">{t('members.noMembers')}</p>
                ) : (
                  <div className="space-y-2">
                    {manualMembers.map((member) => (
                      <div
                        key={member.id}
                        className="px-3 py-2 border border-border rounded-lg flex justify-between items-center"
                      >
                        <span>
                          {member.name}
                          {member.role && <span className="text-text-secondary ml-2">— {member.role}</span>}
                        </span>
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
