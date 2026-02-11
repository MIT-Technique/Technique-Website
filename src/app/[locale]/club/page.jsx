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
  const { isLoggedIn, user, club, loading: userLoading } = useUser();

  // Tab state
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [descriptionSaveStatus, setDescriptionSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [message, setMessage] = useState({ type: '', text: '' });
  const descriptionSaveTimer = useRef(null);
  const lastSavedDescription = useRef('');
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
  const [documentsSaveStatus, setDocumentsSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const documentsSaveTimer = useRef(null);
  const lastSavedDocuments = useRef({ links: '', notes: '' });


  useEffect(() => {
    if (!userLoading && (!isLoggedIn || user?.role !== 'club')) {
      router.push(`/${locale}/login`);
    }
  }, [isLoggedIn, user, userLoading, router, locale]);

  // Auto-fade success messages after 3.5 seconds
  useEffect(() => {
    if (message.type === 'success' && message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (imageMessage.type === 'success' && imageMessage.text) {
      const timer = setTimeout(() => setImageMessage({ type: '', text: '' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [imageMessage]);

  useEffect(() => {
    if (membersMessage.type === 'success' && membersMessage.text) {
      const timer = setTimeout(() => setMembersMessage({ type: '', text: '' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [membersMessage]);


  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        description: club.description || '',
      });
      lastSavedDescription.current = club.description || '';
    }
  }, [club]);

  // Auto-save description function
  async function saveDescription(description) {
    if (description === lastSavedDescription.current) return;
    if (isFrozen) return;

    setDescriptionSaveStatus('saving');
    try {
      const res = await fetch('/api/clubs/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, description }),
      });

      if (res.ok) {
        lastSavedDescription.current = description;
        setDescriptionSaveStatus('saved');
        // Reset to idle after 2 seconds
        setTimeout(() => setDescriptionSaveStatus('idle'), 2000);
      } else {
        setDescriptionSaveStatus('error');
      }
    } catch (error) {
      setDescriptionSaveStatus('error');
    }
  }

  // Debounced auto-save on description change
  function handleDescriptionChange(e) {
    const words = e.target.value.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 75 || e.target.value.length < formData.description.length) {
      const newDescription = e.target.value;
      setFormData({ ...formData, description: newDescription });

      // Clear existing timer
      if (descriptionSaveTimer.current) {
        clearTimeout(descriptionSaveTimer.current);
      }

      // Set new timer for auto-save (1 second after stop typing)
      descriptionSaveTimer.current = setTimeout(() => {
        saveDescription(newDescription);
      }, 1000);
    }
  }

  // Save on blur
  function handleDescriptionBlur() {
    if (descriptionSaveTimer.current) {
      clearTimeout(descriptionSaveTimer.current);
    }
    saveDescription(formData.description);
  }

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
        const docs = {
          links: data.documents.links || '',
          notes: data.documents.notes || '',
        };
        setDocuments(docs);
        lastSavedDocuments.current = docs;
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  }

  // Auto-save documents function
  async function saveDocuments(docs) {
    if (docs.links === lastSavedDocuments.current.links && docs.notes === lastSavedDocuments.current.notes) return;

    setDocumentsSaveStatus('saving');
    try {
      const res = await fetch('/api/clubs/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docs),
      });

      if (res.ok) {
        lastSavedDocuments.current = docs;
        setDocumentsSaveStatus('saved');
        setTimeout(() => setDocumentsSaveStatus('idle'), 2000);
      } else {
        setDocumentsSaveStatus('error');
      }
    } catch (error) {
      setDocumentsSaveStatus('error');
    }
  }

  // Debounced auto-save on documents change
  function handleDocumentsChange(field, value) {
    const newDocs = { ...documents, [field]: value };
    setDocuments(newDocs);

    if (documentsSaveTimer.current) {
      clearTimeout(documentsSaveTimer.current);
    }

    documentsSaveTimer.current = setTimeout(() => {
      saveDocuments(newDocs);
    }, 1000);
  }

  // Save documents on blur
  function handleDocumentsBlur() {
    if (documentsSaveTimer.current) {
      clearTimeout(documentsSaveTimer.current);
    }
    saveDocuments(documents);
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

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                  {message.text && (
                    <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {message.text}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('form.description')}</label>
                  <p className="text-sm text-text-muted mb-2">{t('form.descriptionHint')}</p>
                  <textarea
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    onBlur={handleDescriptionBlur}
                    placeholder={t('form.descriptionPlaceholder')}
                    className="w-full border border-border rounded px-4 py-2 min-h-[100px]"
                    disabled={isFrozen}
                  />
                  <p className="text-xs text-text-muted mt-1 flex items-center gap-2">
                    <span>{formData.description.trim().split(/\s+/).filter(Boolean).length} / 75 words</span>
                    {descriptionSaveStatus === 'saving' && (
                      <span className="text-text-secondary">Saving...</span>
                    )}
                    {descriptionSaveStatus === 'saved' && (
                      <span className="text-green-600">Saved!</span>
                    )}
                    {descriptionSaveStatus === 'error' && (
                      <span className="text-red-600">Error saving</span>
                    )}
                  </p>
                </div>
              </form>

              {/* Images Section */}
              <div className="mt-8">
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
                            // Return URL for immediate preview via localUrl
                            // Backend is already updated; club data will sync on next page load
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
                            // ImageUpload handles the deleted state visually
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

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
                      {addingMember ? t('members.adding') : <><span className="sm:hidden text-lg leading-none">+</span><span className="hidden sm:inline">{t('members.add')}</span></>}
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
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-medium">{t('documents.title')}</h2>
                {documentsSaveStatus === 'saving' && (
                  <span className="text-sm text-text-secondary">Saving...</span>
                )}
                {documentsSaveStatus === 'saved' && (
                  <span className="text-sm text-green-600">Saved!</span>
                )}
                {documentsSaveStatus === 'error' && (
                  <span className="text-sm text-red-600">Error saving</span>
                )}
              </div>
              <p className="text-text-secondary text-sm mb-6">{t('documents.description')}</p>

              {documentsLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('documents.linksLabel')}</label>
                    <textarea
                      value={documents.links}
                      onChange={(e) => handleDocumentsChange('links', e.target.value)}
                      onBlur={handleDocumentsBlur}
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
                      onChange={(e) => handleDocumentsChange('notes', e.target.value)}
                      onBlur={handleDocumentsBlur}
                      placeholder={t('documents.notesPlaceholder')}
                      className="w-full border border-border rounded px-4 py-2 min-h-[150px]"
                      maxLength={5000}
                    />
                    <p className="text-xs text-text-muted mt-1">
                      {t('documents.notesHint')} ({documents.notes.length}/5000)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
