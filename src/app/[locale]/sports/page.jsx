'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';
import ImageUpload from '../../../components/ImageUpload/ImageUpload';
import ConfirmationModal from '../../../components/ConfirmationModal/ConfirmationModal';

export default function SportsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('sportsPage');
  const { isLoggedIn, user, sports, loading: userLoading } = useUser();

  const [activeTab, setActiveTab] = useState('profile');
  const [isFrozen, setIsFrozen] = useState(false);

  // Profile state
  const [formData, setFormData] = useState({
    description: '',
    has_gender_teams: false,
    achievement_summary: '',
    mens_achievement_summary: '',
    womens_achievement_summary: '',
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [message, setMessage] = useState({ type: '', text: '' });
  const profileSaveTimer = useRef(null);
  const lastSavedProfile = useRef({
    description: '',
    achievement_summary: '',
    mens_achievement_summary: '',
    womens_achievement_summary: '',
  });

  // Email state
  const [sportsEmail, setSportsEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Coaches state
  const [coaches, setCoaches] = useState([]);
  const [coachesLoading, setCoachesLoading] = useState(true);
  const [coachesMessage, setCoachesMessage] = useState({ type: '', text: '' });
  const [newCoach, setNewCoach] = useState({ name: '', role: '' });
  const [addingCoach, setAddingCoach] = useState(false);
  const [removingCoachId, setRemovingCoachId] = useState(null);

  // Members state
  const [manualMembers, setManualMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersMessage, setMembersMessage] = useState({ type: '', text: '' });
  const [inputMode, setInputMode] = useState('single');
  const [singleMember, setSingleMember] = useState({ name: '', role: '' });
  const [bulkText, setBulkText] = useState('');
  const [parsePreview, setParsePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [activeTeamTab, setActiveTeamTab] = useState('mens');
  const [showCoachRoleDropdown, setShowCoachRoleDropdown] = useState(false);
  const [showMemberRoleDropdown, setShowMemberRoleDropdown] = useState(false);

  // Image URL overrides (to avoid full refetch on upload/delete)
  const [imageOverrides, setImageOverrides] = useState({});
  const [imageMessage, setImageMessage] = useState({ type: '', text: '' });

  // Gender teams confirmation modal
  const [showGenderConfirm, setShowGenderConfirm] = useState(false);
  const [pendingGenderValue, setPendingGenderValue] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState({ links: '', notes: '' });
  const [documentsSaveStatus, setDocumentsSaveStatus] = useState('idle');
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const documentsSaveTimer = useRef(null);
  const lastSavedDocuments = useRef({ links: '', notes: '' });

  useEffect(() => {
    if (!userLoading && (!isLoggedIn || user?.role !== 'sports')) {
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
    if (coachesMessage.type === 'success' && coachesMessage.text) {
      const timer = setTimeout(() => setCoachesMessage({ type: '', text: '' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [coachesMessage]);

  useEffect(() => {
    if (membersMessage.type === 'success' && membersMessage.text) {
      const timer = setTimeout(() => setMembersMessage({ type: '', text: '' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [membersMessage]);


  useEffect(() => {
    if (sports) {
      setFormData({
        description: sports.description || '',
        has_gender_teams: sports.has_gender_teams || false,
        achievement_summary: sports.achievement_summary || '',
        mens_achievement_summary: sports.mens_achievement_summary || '',
        womens_achievement_summary: sports.womens_achievement_summary || '',
      });
      lastSavedProfile.current = {
        description: sports.description || '',
        achievement_summary: sports.achievement_summary || '',
        mens_achievement_summary: sports.mens_achievement_summary || '',
        womens_achievement_summary: sports.womens_achievement_summary || '',
      };
    }
  }, [sports]);

  // Lazy-load data per tab
  const fetchedTabs = useRef(new Set());

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'sports') return;
    if (fetchedTabs.current.has(activeTab)) return;
    fetchedTabs.current.add(activeTab);

    if (activeTab === 'profile') {
      fetchSportsEmail();
      (async () => {
        try {
          const res = await fetch('/api/auth/session');
          const data = await res.json();
          const frozen = data.frozenForms?.some(f => f.form_name === 'sports_form' && f.is_frozen);
          setIsFrozen(frozen || false);
        } catch (error) {
          console.error('Error checking frozen status:', error);
        }
      })();
    } else if (activeTab === 'coaches') {
      fetchCoaches();
    } else if (activeTab === 'members') {
      fetchMembers();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, isLoggedIn, user]);

  // ==================== API CALLS ====================

  async function fetchSportsEmail() {
    try {
      const res = await fetch('/api/sports/email');
      const data = await res.json();
      if (res.ok && data.email) setSportsEmail(data.email);
    } catch (error) {
      console.error('Error fetching email:', error);
    }
  }

  async function handleSaveEmail() {
    setSavingEmail(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/sports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sportsEmail.trim() }),
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

  // Auto-save profile function
  async function saveProfile(data) {
    const hasChanges =
      data.description !== lastSavedProfile.current.description ||
      data.achievement_summary !== lastSavedProfile.current.achievement_summary ||
      data.mens_achievement_summary !== lastSavedProfile.current.mens_achievement_summary ||
      data.womens_achievement_summary !== lastSavedProfile.current.womens_achievement_summary;

    if (!hasChanges) return;
    if (isFrozen) return;

    setProfileSaveStatus('saving');
    try {
      const res = await fetch('/api/sports/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        lastSavedProfile.current = {
          description: data.description,
          achievement_summary: data.achievement_summary,
          mens_achievement_summary: data.mens_achievement_summary,
          womens_achievement_summary: data.womens_achievement_summary,
        };
        setProfileSaveStatus('saved');
        setTimeout(() => setProfileSaveStatus('idle'), 2000);
      } else {
        setProfileSaveStatus('error');
      }
    } catch (error) {
      setProfileSaveStatus('error');
    }
  }

  // Debounced auto-save on profile change
  function handleProfileChange(field, value) {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    if (profileSaveTimer.current) {
      clearTimeout(profileSaveTimer.current);
    }

    profileSaveTimer.current = setTimeout(() => {
      saveProfile(newData);
    }, 1000);
  }

  // Save profile on blur
  function handleProfileBlur() {
    if (profileSaveTimer.current) {
      clearTimeout(profileSaveTimer.current);
    }
    saveProfile(formData);
  }

  // Coaches
  async function fetchCoaches() {
    try {
      setCoachesLoading(true);
      const res = await fetch('/api/sports/coaches');
      const data = await res.json();
      setCoaches(data.coaches || []);
    } catch (error) {
      console.error('Error fetching coaches:', error);
    } finally {
      setCoachesLoading(false);
    }
  }

  async function handleAddCoach(e) {
    e.preventDefault();
    if (!newCoach.name.trim() || !newCoach.role.trim()) return;
    setAddingCoach(true);
    setCoachesMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/sports/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCoach.name.trim(),
          role: newCoach.role.trim(),
          display_order: coaches.length,
        }),
      });
      if (res.ok) {
        setNewCoach({ name: '', role: '' });
        setCoachesMessage({ type: 'success', text: t('coaches.addSuccess') });
        fetchCoaches();
      } else {
        const data = await res.json();
        setCoachesMessage({ type: 'error', text: data.error || t('coaches.addError') });
      }
    } catch (error) {
      setCoachesMessage({ type: 'error', text: t('coaches.addError') });
    } finally {
      setAddingCoach(false);
    }
  }

  async function handleRemoveCoach(coachId) {
    setRemovingCoachId(coachId);
    setCoachesMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/sports/coaches?id=${coachId}`, { method: 'DELETE' });
      if (res.ok) {
        setCoaches(prev => prev.filter(c => c.id !== coachId));
        setCoachesMessage({ type: 'success', text: t('coaches.removeSuccess') });
      } else {
        const data = await res.json();
        setCoachesMessage({ type: 'error', text: data.error || t('coaches.removeError') });
      }
    } catch (error) {
      setCoachesMessage({ type: 'error', text: t('coaches.removeError') });
    } finally {
      setRemovingCoachId(null);
    }
  }

  function handleMoveCoach(coachId, direction) {
    const idx = coaches.findIndex(c => c.id === coachId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === coaches.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;

    // Optimistic update: swap immediately in local state
    const updated = [...coaches];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    setCoaches(updated);

    // Persist in background, show error only on failure
    Promise.all([
      fetch('/api/sports/coaches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coaches[idx].id, display_order: swapIdx }),
      }),
      fetch('/api/sports/coaches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coaches[swapIdx].id, display_order: idx }),
      }),
    ]).then(results => {
      if (results.some(r => !r.ok)) {
        setCoachesMessage({ type: 'error', text: 'Failed to save order' });
        fetchCoaches(); // revert to server state
      }
    }).catch(() => {
      setCoachesMessage({ type: 'error', text: 'Failed to save order' });
      fetchCoaches();
    });
  }

  // Members
  async function fetchMembers() {
    try {
      setMembersLoading(true);
      const res = await fetch('/api/sports/manual-members');
      const data = await res.json();
      setManualMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleAddSingleMember(e) {
    e.preventDefault();
    if (!singleMember.name.trim()) return;
    setAddingMember(true);
    setMembersMessage({ type: '', text: '' });
    const team = formData.has_gender_teams ? activeTeamTab : null;
    try {
      const res = await fetch('/api/sports/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: singleMember.name.trim(),
          role: singleMember.role.trim() || null,
          team,
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
    const team = formData.has_gender_teams ? activeTeamTab : null;
    try {
      const res = await fetch('/api/sports/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkText, team }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkText('');
        setShowPreview(false);
        setParsePreview(null);
        let msg = t('members.bulkAddSuccess', { count: data.count });
        if (data.parseErrors?.length > 0) msg += ` ${t('members.withErrors', { count: data.parseErrors.length })}`;
        if (data.duplicates?.length > 0) msg += ` ${t('members.withDuplicates', { count: data.duplicates.length })}`;
        setMembersMessage({ type: 'success', text: msg });
        fetchMembers();
      } else {
        setMembersMessage({ type: 'error', text: data.error || t('members.bulkAddError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.bulkAddError') });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(memberId) {
    setRemovingMemberId(memberId);
    setMembersMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/sports/manual-members?id=${memberId}`, { method: 'DELETE' });
      if (res.ok) {
        setManualMembers(prev => prev.filter(m => m.id !== memberId));
        setMembersMessage({ type: 'success', text: t('members.removeSuccess') });
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

  // Documents
  async function fetchDocuments() {
    try {
      setDocumentsLoading(true);
      const res = await fetch('/api/sports/documents');
      const data = await res.json();
      if (res.ok && data.documents) {
        const docs = { links: data.documents.links || '', notes: data.documents.notes || '' };
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
      const res = await fetch('/api/sports/documents', {
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

  // ==================== RENDER HELPERS ====================

  function getFilteredMembers(teamFilter) {
    if (!teamFilter) return manualMembers;
    return manualMembers.filter(m => m.team === teamFilter);
  }

  function renderMembersList(teamFilter) {
    const filtered = getFilteredMembers(teamFilter);
    if (membersLoading) return <p className="text-text-secondary">Loading...</p>;
    if (filtered.length === 0) return <p className="text-text-secondary">{t('members.noMembers')}</p>;

    return (
      <div className="space-y-2">
        {filtered.map((member) => (
          <div key={member.id} className="px-3 py-2 border border-border rounded-lg flex justify-between items-center">
            <span>{member.name}{member.role && <span className="text-text-secondary ml-2">— {member.role}</span>}</span>
            <button
              onClick={() => handleRemoveMember(member.id)}
              disabled={removingMemberId === member.id}
              className="text-sm text-red-600 hover:text-red-700"
            >
              {removingMemberId === member.id ? t('members.removing') : t('members.remove')}
            </button>
          </div>
        ))}
      </div>
    );
  }

  function renderImageSlots(teamParam) {
    const prefix = teamParam ? `${teamParam}_` : '';
    const sportName = (sports?.name || '').replace(/\s+/g, '_');
    return (
      <div className="flex gap-4 flex-wrap">
        {[1, 2, 3].map((slot) => {
          const suffix = slot === 1 ? '' : `_${slot}`;
          const imageField = `${prefix}candid_image_${slot}`;
          // Use local override if set, otherwise fall back to sports data
          const currentUrl = imageField in imageOverrides
            ? imageOverrides[imageField]
            : sports?.[imageField];
          return (
            <ImageUpload
              key={`${teamParam || 'unified'}-${slot}`}
              imageUrl={currentUrl}
              label={slot === 1 ? t('photos.mainImage') : t('photos.additionalImage')}
              fileName={`${sportName}${teamParam ? `_${teamParam}` : ''}_Candid${suffix}`}
              disabled={isFrozen}
              onUpload={async (file) => {
                setImageMessage({ type: '', text: '' });
                const fd = new FormData();
                fd.append('file', file);
                fd.append('slot', String(slot));
                if (teamParam) fd.append('team', teamParam);
                const res = await fetch('/api/sports/images', { method: 'POST', body: fd });
                const data = await res.json();
                if (!res.ok) {
                  setImageMessage({ type: 'error', text: data.error || 'Upload failed' });
                  throw new Error(data.error || 'Upload failed');
                }
                // ImageUpload handles display via localUrl; data syncs on next page load
                return data.url;
              }}
              onDelete={async () => {
                setImageMessage({ type: '', text: '' });
                const params = new URLSearchParams({ slot: String(slot) });
                if (teamParam) params.set('team', teamParam);
                const res = await fetch(`/api/sports/images?${params}`, { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) {
                  setImageMessage({ type: 'error', text: data.error || 'Delete failed' });
                  throw new Error(data.error || 'Delete failed');
                }
                // Clear locally
                setImageOverrides(prev => ({ ...prev, [imageField]: null }));
              }}
            />
          );
        })}
      </div>
    );
  }

  // ==================== LOADING / AUTH GUARD ====================

  if (userLoading) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32">
        <div className="container-text text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn || user?.role !== 'sports') return null;

  const tabs = [
    { id: 'profile', label: t('tabs.profile') },
    { id: 'coaches', label: t('tabs.coaches') },
    { id: 'members', label: t('tabs.members') },
    { id: 'photos', label: t('tabs.photos') },
    { id: 'achievements', label: t('tabs.achievements') },
    { id: 'documents', label: t('tabs.documents') },
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32 pb-12">
        <section className="container-text">
          <h1 className="mb-8">{sports?.name || ''} Team Dashboard</h1>

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

          {/* ==================== PROFILE TAB ==================== */}
          {activeTab === 'profile' && (
            <div>
              {isFrozen && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-medium">{t('frozen')}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('profile.email')}</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={sportsEmail}
                      onChange={(e) => setSportsEmail(e.target.value)}
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

                {/* Description */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium">{t('profile.description')}</label>
                    {profileSaveStatus === 'saving' && (
                      <span className="text-sm text-text-secondary">Saving...</span>
                    )}
                    {profileSaveStatus === 'saved' && (
                      <span className="text-sm text-green-600">Saved!</span>
                    )}
                    {profileSaveStatus === 'error' && (
                      <span className="text-sm text-red-600">Error saving</span>
                    )}
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleProfileChange('description', e.target.value)}
                    onBlur={handleProfileBlur}
                    className="w-full border border-border rounded px-4 py-2 min-h-[100px]"
                    disabled={isFrozen}
                  />
                </div>

                {/* Gender Teams Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="has_gender_teams"
                    checked={formData.has_gender_teams}
                    onChange={(e) => {
                      setPendingGenderValue(e.target.checked);
                      setShowGenderConfirm(true);
                    }}
                    className="w-4 h-4"
                    disabled={isFrozen}
                  />
                  <label htmlFor="has_gender_teams" className="text-sm font-medium">
                    {t('profile.hasGenderTeams')}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ==================== COACHES TAB ==================== */}
          {activeTab === 'coaches' && (
            <div>
              {coachesMessage.text && (
                <div className={`mb-6 p-4 rounded ${
                  coachesMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {coachesMessage.text}
                </div>
              )}

              {/* Add Coach Form */}
              <form onSubmit={handleAddCoach} className="mb-6">
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={newCoach.name}
                    onChange={(e) => setNewCoach({ ...newCoach, name: e.target.value })}
                    placeholder={t('coaches.namePlaceholder')}
                    className="flex-1 min-w-[150px] border border-border rounded px-4 py-2"
                    required
                  />
                  <div className="relative flex-1 min-w-[150px]">
                    <input
                      type="text"
                      value={newCoach.role}
                      onChange={(e) => setNewCoach({ ...newCoach, role: e.target.value })}
                      onFocus={() => setShowCoachRoleDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCoachRoleDropdown(false), 150)}
                      placeholder={t('coaches.rolePlaceholder')}
                      className="w-full border border-border rounded px-4 py-2"
                      required
                    />
                    {showCoachRoleDropdown && (() => {
                      const options = [
                        t('coaches.headCoach'),
                        t('coaches.assistantCoach'),
                        t('coaches.volunteerAssistantCoach'),
                      ].filter(o => !newCoach.role || o.toLowerCase().includes(newCoach.role.toLowerCase()));
                      return options.length > 0 ? (
                        <ul className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {options.map((option) => (
                            <li
                              key={option}
                              onMouseDown={() => setNewCoach({ ...newCoach, role: option })}
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
                    disabled={addingCoach}
                    className="btn-primary whitespace-nowrap"
                  >
                    {addingCoach ? '...' : <><span className="sm:hidden text-lg leading-none">+</span><span className="hidden sm:inline">{t('coaches.addCoach')}</span></>}
                  </button>
                </div>
              </form>

              {/* Coaches List */}
              {coachesLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : coaches.length === 0 ? (
                <p className="text-text-secondary">{t('coaches.noCoaches')}</p>
              ) : (
                <div className="space-y-2">
                  {coaches.map((coach, idx) => (
                    <div key={coach.id} className="px-3 py-2 border border-border rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium">{coach.name}</span>
                        <span className="text-text-secondary ml-2">— {coach.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveCoach(coach.id, 'up')}
                          disabled={idx === 0}
                          className="text-sm text-text-secondary hover:text-text disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveCoach(coach.id, 'down')}
                          disabled={idx === coaches.length - 1}
                          className="text-sm text-text-secondary hover:text-text disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveCoach(coach.id)}
                          disabled={removingCoachId === coach.id}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          {removingCoachId === coach.id ? '...' : t('coaches.remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== MEMBERS TAB ==================== */}
          {activeTab === 'members' && (
            <div>
              {membersMessage.text && (
                <div className={`mb-6 p-4 rounded ${
                  membersMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {membersMessage.text}
                </div>
              )}

              {/* Team Sub-tabs (if gendered) */}
              {formData.has_gender_teams && (
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setActiveTeamTab('mens')}
                    className={`px-4 py-2 rounded ${
                      activeTeamTab === 'mens' ? 'bg-[#750014] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('members.mensTeam')}
                  </button>
                  <button
                    onClick={() => setActiveTeamTab('womens')}
                    className={`px-4 py-2 rounded ${
                      activeTeamTab === 'womens' ? 'bg-[#750014] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('members.womensTeam')}
                  </button>
                </div>
              )}

              {/* Mode Switcher */}
              <div className="mb-4 flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setInputMode('single')}
                  className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    inputMode === 'single' ? 'border-[#750014] text-[#750014]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('members.addSingle')}
                </button>
                <button
                  onClick={() => setInputMode('bulk')}
                  className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    inputMode === 'bulk' ? 'border-[#750014] text-[#750014]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('members.bulkImport')}
                </button>
              </div>

              {/* Single Add */}
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
                        onFocus={() => setShowMemberRoleDropdown(true)}
                        onBlur={() => setTimeout(() => setShowMemberRoleDropdown(false), 150)}
                        placeholder={t('members.rolePlaceholder')}
                        className="w-full border border-border rounded px-4 py-2"
                      />
                      {showMemberRoleDropdown && (() => {
                        const options = [
                          t('members.roles.captain'),
                          t('members.roles.squadLeader'),
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

              {/* Bulk Import */}
              {inputMode === 'bulk' && (
                <div className="mb-6">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">{t('members.bulkInputLabel')}</label>
                    <p className="text-xs text-text-muted mb-2">{t('members.bulkInputHint')}</p>
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
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
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
                              <div key={i} className="py-1">{name.name}</div>
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
                      <button onClick={() => setShowPreview(false)} className="text-sm text-text-secondary hover:text-text">
                        {t('members.closePreview')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              <h2 className="text-lg font-medium mt-6 mb-4">{t('members.listTitle')} ({getFilteredMembers(formData.has_gender_teams ? activeTeamTab : null).length})</h2>
              {renderMembersList(formData.has_gender_teams ? activeTeamTab : null)}
            </div>
          )}

          {/* ==================== PHOTOS TAB ==================== */}
          {activeTab === 'photos' && (
            <div>
              {isFrozen && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-medium">{t('frozen')}</p>
                </div>
              )}

              {imageMessage.text && (
                <div className={`mb-6 p-4 rounded ${
                  imageMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {imageMessage.text}
                </div>
              )}

              {formData.has_gender_teams ? (
                <>
                  <h2 className="text-lg font-medium mb-4">{t('photos.mensPhotos')}</h2>
                  {renderImageSlots('mens')}

                  <h2 className="text-lg font-medium mb-4 mt-8">{t('photos.womensPhotos')}</h2>
                  {renderImageSlots('womens')}
                </>
              ) : (
                renderImageSlots(null)
              )}
            </div>
          )}

          {/* ==================== ACHIEVEMENTS TAB ==================== */}
          {activeTab === 'achievements' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-medium">{t('achievements.title')}</h2>
                {profileSaveStatus === 'saving' && (
                  <span className="text-sm text-text-secondary">Saving...</span>
                )}
                {profileSaveStatus === 'saved' && (
                  <span className="text-sm text-green-600">Saved!</span>
                )}
                {profileSaveStatus === 'error' && (
                  <span className="text-sm text-red-600">Error saving</span>
                )}
              </div>
              <div className="space-y-6">
                {formData.has_gender_teams ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('achievements.mensAchievements')}</label>
                      <textarea
                        value={formData.mens_achievement_summary}
                        onChange={(e) => handleProfileChange('mens_achievement_summary', e.target.value)}
                        onBlur={handleProfileBlur}
                        placeholder={t('achievements.placeholder')}
                        className="w-full border border-border rounded px-4 py-2 min-h-[150px]"
                        disabled={isFrozen}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('achievements.womensAchievements')}</label>
                      <textarea
                        value={formData.womens_achievement_summary}
                        onChange={(e) => handleProfileChange('womens_achievement_summary', e.target.value)}
                        onBlur={handleProfileBlur}
                        placeholder={t('achievements.placeholder')}
                        className="w-full border border-border rounded px-4 py-2 min-h-[150px]"
                        disabled={isFrozen}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('achievements.label')}</label>
                    <textarea
                      value={formData.achievement_summary}
                      onChange={(e) => handleProfileChange('achievement_summary', e.target.value)}
                      onBlur={handleProfileBlur}
                      placeholder={t('achievements.placeholder')}
                      className="w-full border border-border rounded px-4 py-2 min-h-[150px]"
                      disabled={isFrozen}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== DOCUMENTS TAB ==================== */}
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
      <ConfirmationModal
        open={showGenderConfirm}
        title={t('profile.genderToggleTitle')}
        message={t('profile.genderToggleWarning')}
        confirmText={t('profile.genderToggleConfirm')}
        cancelText={t('profile.genderToggleCancel')}
        isDangerous
        onConfirm={() => {
          setFormData({ ...formData, has_gender_teams: pendingGenderValue });
          setShowGenderConfirm(false);
        }}
        onCancel={() => setShowGenderConfirm(false)}
      />
      <Footer />
    </>
  );
}
