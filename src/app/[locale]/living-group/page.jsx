'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';
import ImageUpload from '../../../components/ImageUpload/ImageUpload';
import { generateTimeSlots } from '../../../lib/utils/time';
import CalendarView from '../../../components/CalendarView/CalendarView';
import SectionAssignmentTimeline from '../../../components/CalendarView/SectionAssignmentTimeline';
import ConfirmationModal from '../../../components/ConfirmationModal/ConfirmationModal';

// Format 24-hour time to 12-hour AM/PM (e.g., "14:30:00" -> "2:30 PM")
function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

// Auto-dismissing message with fade-out
function FadeMessage({ message, onClear, duration = 3500, className = 'mb-6 p-4 rounded' }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!message.text) { setFading(false); return; }
    if (message.type !== 'success') return;
    setFading(false);
    const fadeTimer = setTimeout(() => setFading(true), duration - 500);
    const clearTimer = setTimeout(() => onClear({ type: '', text: '' }), duration);
    return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
  }, [message, duration, onClear]);

  if (!message.text) return null;
  return (
    <div
      className={`${className} ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
      style={{ transition: 'opacity 500ms ease-out', opacity: fading ? 0 : 1 }}
    >
      {message.text}
    </div>
  );
}

export default function LivingGroupPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('livingGroupPage');
  const { isLoggedIn, user, livingGroup, loading: userLoading, refetch } = useUser();

  // Tab state
  const [activeTab, setActiveTab] = useState(null); // Will be set based on living group type
  const [scheduleSubTab, setScheduleSubTab] = useState('book');

  // Settings state (email)
  const [livingGroupEmail, setLivingGroupEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);


  // Scheduling state
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFrozen, setIsFrozen] = useState(false);
  const [formNote, setFormNote] = useState(null);

  // Manual members state
  const [manualMembers, setManualMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersMessage, setMembersMessage] = useState({ type: '', text: '' });
  const [inputMode, setInputMode] = useState('single'); // 'single' or 'bulk'
  const [singleMember, setSingleMember] = useState({ name: '' });
  const [bulkText, setBulkText] = useState('');
  const [parsePreview, setParsePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newMemberSection, setNewMemberSection] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Bulk reset state
  const [showBulkResetConfirm, setShowBulkResetConfirm] = useState(false);
  const [bulkResetSection, setBulkResetSection] = useState('all');
  const [bulkResetting, setBulkResetting] = useState(false);
  const [deletedMembersForRevert, setDeletedMembersForRevert] = useState(null);

  // Members pagination state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [membersPage, setMembersPage] = useState(1);
  const MEMBERS_PER_PAGE = 10;

  // Sections state
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [removingSectionName, setRemovingSectionName] = useState(null);
  const [sectionsMessage, setSectionsMessage] = useState({ type: '', text: '' });
  const [imageMessage, setImageMessage] = useState({ type: '', text: '' });
  const [sectionToRemove, setSectionToRemove] = useState(null);
  const [collapsedTimes, setCollapsedTimes] = useState(new Set());

  // Candid images state (FSILGs only)
  const [imageOverrides, setImageOverrides] = useState({});
  const [candidImageMessage, setCandidImageMessage] = useState({ type: '', text: '' });

  // Profile/Description state (FSILGs only)
  const [description, setDescription] = useState('');
  const [descriptionSaveStatus, setDescriptionSaveStatus] = useState('idle');
  const descriptionSaveTimer = useRef(null);
  const lastSavedDescription = useRef('');

  // Time assignments state
  const [timeAssignments, setTimeAssignments] = useState({});
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [savingSlot, setSavingSlot] = useState(null);

  // Documents state
  const [documents, setDocuments] = useState({
    links: '',
    notes: '',
  });
  const [documentsSaveStatus, setDocumentsSaveStatus] = useState('idle');
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const documentsSaveTimer = useRef(null);
  const lastSavedDocuments = useRef({ links: '', notes: '' });

  // Time proposal state
  const [proposals, setProposals] = useState([]);
  const [cancellingProposalId, setCancellingProposalId] = useState(null);
  const [confirmCancelProposalId, setConfirmCancelProposalId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 8;
  const [bookViewMode, setBookViewMode] = useState('list');
  const tc = useTranslations('calendarView');

  // Expanded time slots (to show location/notes)
  const [expandedTimeIds, setExpandedTimeIds] = useState(new Set());
  const [showListProposeForm, setShowListProposeForm] = useState(false);
  const [proposing, setProposing] = useState(false);

  // Booking location form state
  const [bookingTimeId, setBookingTimeId] = useState(null);
  const [proposedLocations, setProposedLocations] = useState(['']);

  // Toggle expansion for a time slot
  function toggleTimeExpanded(timeId) {
    setExpandedTimeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(timeId)) {
        newSet.delete(timeId);
      } else {
        newSet.add(timeId);
      }
      return newSet;
    });
  }

  // Helper to get creator display name for time slots
  function getCreatorLabel(time) {
    if (!time?.creator) return t('unknownCreator');
    if (time.creator.role === 'admin') return 'TNQ Photo';
    const name = time.creator.name || '';
    return name || time.creator.email || t('unknownCreator');
  }

  useEffect(() => {
    if (!userLoading && (!isLoggedIn || user?.role !== 'living_group')) {
      router.push(`/${locale}/login`);
    }
  }, [isLoggedIn, user, userLoading, router, locale]);

  // Set default tab based on living group type
  useEffect(() => {
    if (livingGroup && activeTab === null) {
      const isFsilg = livingGroup.living_group_type === 'fsilg';
      setActiveTab(isFsilg ? 'profile' : 'sections');
    }
  }, [livingGroup, activeTab]);

  // Track recently cancelled proposal IDs for fade-out
  const [fadingProposals, setFadingProposals] = useState(new Set());
  const [hiddenProposals, setHiddenProposals] = useState(new Set());

  // Lazy-load data per tab
  const fetchedTabs = useRef(new Set());

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'living_group' || !activeTab) return;

    // For schedule tab, check sub-tabs
    if (activeTab === 'schedule') {
      const subTabKey = `schedule-${scheduleSubTab}`;
      if (fetchedTabs.current.has(subTabKey)) return;
      fetchedTabs.current.add(subTabKey);

      if (scheduleSubTab === 'book') {
        fetchTimes();
        checkFrozen();
        fetchProposals();
      } else if (scheduleSubTab === 'assign') {
        fetchSections();
        if (livingGroup?.id) fetchTimeAssignments(livingGroup.id);
      }
    } else {
      if (fetchedTabs.current.has(activeTab)) return;
      fetchedTabs.current.add(activeTab);

      if (activeTab === 'members') {
        fetchMembers();
        if (!fetchedTabs.current.has('schedule-assign')) fetchSections();
      } else if (activeTab === 'settings') {
        if (livingGroup?.id) fetchLivingGroupEmail();
        fetchDocuments();
      } else if (activeTab === 'sections') {
        fetchSections();
      } else if (activeTab === 'profile') {
        // Initialize description from livingGroup data
        if (livingGroup?.description !== undefined) {
          setDescription(livingGroup.description || '');
          lastSavedDescription.current = livingGroup.description || '';
        }
      }
    }
  }, [activeTab, scheduleSubTab, isLoggedIn, user, livingGroup]);


  async function fetchTimes() {
    try {
      setLoading(true);
      const res = await fetch('/api/living-groups/times');
      const data = await res.json();
      setAvailableTimes(data.availableTimes || []);
      setBookedTimes(data.bookedTimes || []);
    } catch (error) {
      console.error('Error fetching times:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkFrozen() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      const formData = data.frozenForms?.find(f => f.form_name === 'living_group_booking');
      const frozen = formData ? (formData.is_closed ?? formData.is_frozen) : false;
      setIsFrozen(frozen || false);
      setFormNote(formData?.note || null);
    } catch (error) {
      console.error('Error checking form status:', error);
    }
  }

  async function handleBook(timeId, locations) {
    if (isFrozen) return;

    setBooking(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeId, proposed_locations: locations }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('bookSuccess') });
        setBookingTimeId(null);
        setProposedLocations(['']);
        fetchTimes();
        refetch();
      } else {
        setMessage({ type: 'error', text: data.error || t('bookError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('bookError') });
    } finally {
      setBooking(false);
    }
  }

  async function handleCancelRequest(timeId) {
    if (isFrozen) return;

    if (!confirm(t('confirmCancel'))) return;

    setCancelling(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('cancelSuccess') });
        fetchTimes();
      } else {
        setMessage({ type: 'error', text: data.error || t('cancelError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('cancelError') });
    } finally {
      setCancelling(false);
    }
  }

  async function fetchMembers() {
    if (!livingGroup?.id) return;
    try {
      setMembersLoading(true);
      const res = await fetch(`/api/living-groups/manual-members?livingGroupId=${livingGroup.id}`);
      const data = await res.json();
      setManualMembers(data.members || []);
      setMembersPage(1); // Reset to first page
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleAddSingleMember(e) {
    e.preventDefault();
    if (!singleMember.name.trim() || !livingGroup?.id) return;

    setAddingMember(true);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: singleMember.name.trim(),
          section_name: newMemberSection || null,
        }),
      });

      if (res.ok) {
        setSingleMember({ name: '' });
        setNewMemberSection('');
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
    if (!livingGroup?.id) return;

    setAddingMember(true);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkText,
          section_name: newMemberSection || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBulkText('');
        setShowPreview(false);
        setParsePreview(null);
        setNewMemberSection('');

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

  function handleRemoveManualMember(member) {
    setMemberToRemove(member);
  }

  async function confirmRemoveMember() {
    if (!memberToRemove) return;

    setRemovingMemberId(memberToRemove.id);
    setMembersMessage({ type: '', text: '' });

    const memberName = memberToRemove.name;

    try {
      const res = await fetch(`/api/living-groups/manual-members?id=${memberToRemove.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembersMessage({
          type: 'success',
          text: `${memberName} removed`
        });
        // Optimistically update state instead of refetching
        setManualMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
        setMembersPage(1); // Reset to first page
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.removeError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.removeError') });
    } finally {
      setRemovingMemberId(null);
      setMemberToRemove(null);
    }
  }

  async function handleBulkReset() {
    setBulkResetting(true);
    setMembersMessage({ type: '', text: '' });
    setDeletedMembersForRevert(null);

    const section = bulkResetSection;

    try {
      const params = new URLSearchParams({
        bulk: 'true',
        section: section,
      });

      const res = await fetch(`/api/living-groups/manual-members?${params}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        const deletedCount = data.deletedCount || 0;
        const deletedMembers = data.deletedMembers || [];

        // Store deleted members for revert
        setDeletedMembersForRevert(deletedMembers);

        // Update local state
        if (section === 'all') {
          setManualMembers([]);
        } else {
          setManualMembers(prev => prev.filter(m => m.section_name !== section));
        }

        setMembersPage(1); // Reset to first page
        setMemberSearchQuery(''); // Clear search

        const sectionText = section === 'all'
          ? t('members.allSections')
          : section;

        setMembersMessage({
          type: 'success',
          text: t('members.bulkResetSuccess', { count: deletedCount, section: sectionText }),
        });
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.bulkResetError') });
      }
    } catch (error) {
      console.error('Bulk reset error:', error);
      setMembersMessage({ type: 'error', text: t('members.bulkResetError') });
    } finally {
      setBulkResetting(false);
      setShowBulkResetConfirm(false);
    }
  }

  async function handleRevertBulkReset() {
    if (!deletedMembersForRevert || deletedMembersForRevert.length === 0) return;

    setMembersMessage({ type: '', text: '' });

    try {
      // Re-insert all deleted members
      const promises = deletedMembersForRevert.map(member =>
        fetch('/api/living-groups/manual-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: member.name,
            section_name: member.section_name,
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        // Refetch members to get fresh data with correct IDs
        await fetchMembers();
        setMembersMessage({
          type: 'success',
          text: t('members.revertSuccess'),
        });
        setDeletedMembersForRevert(null);
      } else {
        setMembersMessage({ type: 'error', text: t('members.revertError') });
      }
    } catch (error) {
      console.error('Revert error:', error);
      setMembersMessage({ type: 'error', text: t('members.revertError') });
    }
  }

  async function handleUpdateMemberSection(memberId, sectionName) {
    setUpdatingMemberId(memberId);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/manual-members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: memberId,
          section_name: sectionName || null,
        }),
      });

      if (res.ok) {
        // Optimistically update state instead of refetching
        setManualMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, section_name: sectionName || null } : m
        ));
      } else {
        const data = await res.json();
        setMembersMessage({ type: 'error', text: data.error || t('members.updateError') });
      }
    } catch (error) {
      setMembersMessage({ type: 'error', text: t('members.updateError') });
    } finally {
      setUpdatingMemberId(null);
    }
  }

  // Sections functions
  async function fetchSections() {
    try {
      setSectionsLoading(true);
      const res = await fetch('/api/living-groups/sections');
      const data = await res.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setSectionsLoading(false);
    }
  }

  async function handleAddSection(e) {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    setAddingSection(true);
    setSectionsMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_name: newSectionName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
        setNewSectionName('');
        setSectionsMessage({ type: 'success', text: t('assign.addSectionSuccess') });
      } else {
        const data = await res.json();
        setSectionsMessage({ type: 'error', text: data.error || t('assign.addSectionError') });
      }
    } catch (error) {
      setSectionsMessage({ type: 'error', text: t('assign.addSectionError') });
    } finally {
      setAddingSection(false);
    }
  }

  function handleRemoveSection(sectionName) {
    setSectionToRemove(sectionName);
  }

  async function confirmRemoveSection() {
    if (!sectionToRemove) return;

    setRemovingSectionName(sectionToRemove);
    setSectionsMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/living-groups/sections?name=${encodeURIComponent(sectionToRemove)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
        setSectionsMessage({ type: 'success', text: t('assign.removeSectionSuccess') });
        fetchMembers(); // Refresh members since their sections might have been cleared
      } else {
        const data = await res.json();
        setSectionsMessage({ type: 'error', text: data.error || t('assign.removeSectionError') });
      }
    } catch (error) {
      setSectionsMessage({ type: 'error', text: t('assign.removeSectionError') });
    } finally {
      setRemovingSectionName(null);
      setSectionToRemove(null);
    }
  }

  // Time assignment functions
  async function fetchTimeAssignments(livingGroupId) {
    if (!livingGroupId) return;
    try {
      setAssignmentsLoading(true);
      const res = await fetch(`/api/living-groups/time-assignments?livingGroupId=${livingGroupId}`);

      // If table doesn't exist (migration not run), silently fail
      if (!res.ok) {
        console.warn('Time assignments feature not available (migration may not be run yet)');
        setTimeAssignments({});
        return;
      }

      const data = await res.json();

      // Transform array to map: { photoshootTimeId: { 'slotStart-slotEnd': sectionName } }
      const assignmentsMap = {};
      (data.assignments || []).forEach(a => {
        if (!assignmentsMap[a.photoshootTimeId]) {
          assignmentsMap[a.photoshootTimeId] = {};
        }
        const slotKey = `${a.slotStart.slice(0, 5)}-${a.slotEnd.slice(0, 5)}`;
        assignmentsMap[a.photoshootTimeId][slotKey] = a.sectionName || '';
      });
      setTimeAssignments(assignmentsMap);
    } catch (error) {
      console.error('Error fetching time assignments:', error);
      setTimeAssignments({});
    } finally {
      setAssignmentsLoading(false);
    }
  }

  async function handleAssignSection(photoshootTimeId, slotStart, slotEnd, sectionName) {
    if (!livingGroup?.id) return;

    const slotKey = `${slotStart}-${slotEnd}`;
    setSavingSlot(`${photoshootTimeId}-${slotKey}`);
    setSectionsMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/time-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoshootTimeId,
          livingGroupId: livingGroup.id,
          sectionName: sectionName || null,
          slotStart,
          slotEnd,
        }),
      });

      if (res.ok) {
        // Optimistic update
        setTimeAssignments(prev => ({
          ...prev,
          [photoshootTimeId]: {
            ...(prev[photoshootTimeId] || {}),
            [slotKey]: sectionName || '',
          },
        }));
        setSectionsMessage({ type: 'success', text: t('assign.saved') });
      } else {
        const data = await res.json();
        setSectionsMessage({ type: 'error', text: data.error || t('assign.saveError') });
      }
    } catch (error) {
      setSectionsMessage({ type: 'error', text: t('assign.saveError') });
    } finally {
      setSavingSlot(null);
    }
  }

  // Documents functions
  async function fetchDocuments() {
    try {
      setDocumentsLoading(true);
      const res = await fetch('/api/living-groups/documents');
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
      const res = await fetch('/api/living-groups/documents', {
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

  // Auto-save description function (FSILGs only)
  async function saveDescription(desc) {
    if (desc === lastSavedDescription.current) return;

    // Validate word count
    const wordCount = desc.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 75) {
      setDescriptionSaveStatus('error');
      return;
    }

    setDescriptionSaveStatus('saving');
    try {
      const res = await fetch('/api/living-groups/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      });
      if (res.ok) {
        lastSavedDescription.current = desc;
        setDescriptionSaveStatus('saved');
        setTimeout(() => setDescriptionSaveStatus('idle'), 2000);
      } else {
        setDescriptionSaveStatus('error');
      }
    } catch (error) {
      setDescriptionSaveStatus('error');
    }
  }

  // Debounced auto-save on description change
  function handleDescriptionChange(value) {
    setDescription(value);

    if (descriptionSaveTimer.current) {
      clearTimeout(descriptionSaveTimer.current);
    }

    descriptionSaveTimer.current = setTimeout(() => {
      saveDescription(value);
    }, 1000);
  }

  // Save description on blur
  function handleDescriptionBlur() {
    if (descriptionSaveTimer.current) {
      clearTimeout(descriptionSaveTimer.current);
    }
    saveDescription(description);
  }

  async function fetchProposals() {
    try {
      const res = await fetch('/api/living-groups/propose-time');
      const data = await res.json();
      if (res.ok) {
        setProposals(data.proposals || []);
      } else {
        console.error('Error fetching proposals:', data.error);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  }

  async function fetchLivingGroupEmail() {
    if (!livingGroup?.id) return;
    try {
      const res = await fetch(`/api/living-groups/email?livingGroupId=${livingGroup.id}`);
      const data = await res.json();
      if (res.ok && data.email) {
        setLivingGroupEmail(data.email);
      }
    } catch (error) {
      console.error('Error fetching living group email:', error);
    }
  }

  async function handleSaveEmail() {
    if (!livingGroup?.id) return;
    setSavingEmail(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          livingGroupId: livingGroup.id,
          email: livingGroupEmail.trim(),
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('settings.emailSaved') });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t('settings.emailError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.emailError') });
    } finally {
      setSavingEmail(false);
    }
  }


  async function handleCancelProposal(proposalId) {
    setCancellingProposalId(proposalId);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/living-groups/propose-time?id=${proposalId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: t('proposeTime.cancelSuccess') });
        setProposals(prev => prev.map(p =>
          p.id === proposalId ? { ...p, status: 'cancelled' } : p
        ));
        // Fade out cancelled proposal after 4.5s, hide after 5s
        setTimeout(() => setFadingProposals(prev => new Set([...prev, proposalId])), 4500);
        setTimeout(() => setHiddenProposals(prev => new Set([...prev, proposalId])), 5000);
        // Refresh booked times since the associated booking was also cancelled
        fetchTimes();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || t('proposeTime.cancelError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('proposeTime.cancelError') });
    } finally {
      setCancellingProposalId(null);
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

  if (!isLoggedIn || user?.role !== 'living_group') {
    return null;
  }

  // Check if disabled
  const isDisabled = livingGroup?.status === 'disabled';

  const isFsilg = livingGroup?.living_group_type === 'fsilg';

  // Dorm-specific section terminology
  const dormSectionLabels = {
    'Baker': 'Sections',
    'Burton Conner': 'Floors',
    'East Campus': 'Halls',
    'New House': 'Houses',
    'New Vassar': 'Sections',
    'Next House': 'Wings',
    'MacGregor': 'Entries',
    'Maseeh': 'Floors',
    'McCormick': 'Floors',
    'Random Hall': 'Floors',
    'Simmons': 'Sections',
  };

  const getSectionsLabel = () => {
    const name = livingGroup?.name;
    if (name && dormSectionLabels[name]) {
      return dormSectionLabels[name];
    }
    return t('tabs.sections');
  };

  const tabs = [
    // Dorms get Sections tab, FSILGs get Profile tab
    {
      id: isFsilg ? 'profile' : 'sections',
      label: isFsilg ? t('tabs.profile') : getSectionsLabel()
    },
    { id: 'members', label: t('tabs.members') },
    { id: 'schedule', label: t('tabs.schedule') },
    { id: 'settings', label: t('tabs.settings') },
  ];

  // Sub-tabs for the Schedule tab
  const scheduleTabs = [
    { id: 'book', label: t('tabs.book') },
    ...(!isFsilg && livingGroup?.dorm_sections?.length > 0 ? [{ id: 'assign', label: t('tabs.assign') }] : []),
  ];

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32 pb-12">
        <section className="container-text">
          <h1 className="mb-2">{t('title')}</h1>
          <p className="text-text-secondary mb-8">
            {t('welcome', { name: livingGroup?.name || user?.email })}
          </p>

          {/* Disabled Notice */}
          {isDisabled && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">{t('disabled')}</p>
              <p className="text-sm text-red-500 mt-1">{t('disabledHint')}</p>
            </div>
          )}

          {/* Closed Notice */}
          {isFrozen && !isDisabled && activeTab === 'schedule' && scheduleSubTab === 'book' && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-700 font-medium">{t('frozen')}</p>
              {formNote && <p className="text-sm text-gray-600 mt-1">{formNote}</p>}
            </div>
          )}

          {!isFrozen && formNote && !isDisabled && activeTab === 'schedule' && scheduleSubTab === 'book' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">{formNote}</p>
            </div>
          )}

          <FadeMessage message={message} onClear={setMessage} />

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab (Dorms only - shows email) */}
          {activeTab === 'profile' && !isFsilg && (
            <div>
              {/* Email Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">{t('email.title')}</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={livingGroupEmail}
                    onChange={(e) => setLivingGroupEmail(e.target.value)}
                    placeholder={t('email.placeholder')}
                    className="flex-1 border border-border rounded px-4 py-2"
                  />
                  <button
                    onClick={handleSaveEmail}
                    disabled={savingEmail}
                    className="px-4 py-2 bg-[#750014] text-white rounded hover:bg-[#5C0010] disabled:opacity-50 whitespace-nowrap"
                  >
                    {savingEmail ? '...' : t('email.save')}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <>
              {/* Sub-tabs for Schedule */}
              <div className="flex gap-4 mb-6 border-b border-border">
                {scheduleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setScheduleSubTab(tab.id)}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      scheduleSubTab === tab.id
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Book Sub-Tab */}
              {scheduleSubTab === 'book' && (
                <>
                  {/* Current Bookings */}
              {bookedTimes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">{t('currentBooking')}</h2>
                  <div className="space-y-3">
                    {bookedTimes.map((bookedTime) => {
                      const isPending = bookedTime.booking_status === 'pending_location';
                      const isConfirmed = bookedTime.booking_status === 'confirmed';
                      return (
                        <div key={bookedTime.id} className={`p-4 border rounded-lg ${isPending ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                            <div>
                              <p className="font-medium">
                                {new Date(bookedTime.date + 'T12:00:00').toLocaleDateString(locale, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-text-secondary">
                                {formatTime(bookedTime.start_time)} - {formatTime(bookedTime.end_time)} EST
                              </p>
                              {isPending && (
                                <p className="text-yellow-700 text-sm mt-1 font-medium">
                                  {t('pendingLocation')}
                                </p>
                              )}
                              {isPending && bookedTime.proposed_locations?.length > 0 && (
                                <p className="text-text-muted text-xs mt-0.5">
                                  {t('yourLocations')}: {bookedTime.proposed_locations.join(', ')}
                                </p>
                              )}
                              {isConfirmed && bookedTime.location && (
                                <p className="text-green-700 text-sm mt-1">
                                  {t('confirmedLocation')}: {bookedTime.location}
                                </p>
                              )}
                            </div>
                            {!isDisabled && !isFrozen && (
                              <button
                                onClick={() => handleCancelRequest(bookedTime.id)}
                                disabled={cancelling}
                                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 whitespace-nowrap w-full sm:w-auto"
                              >
                                {cancelling ? t('cancelling') : t('cancelBooking')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Times */}
              {!isDisabled && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">{t('availableTimes')}</h3>
                    <div className="flex items-center gap-3">
                      {/* View toggle */}
                      <div className="flex rounded border border-border overflow-hidden">
                        <button
                          onClick={() => setBookViewMode('calendar')}
                          className={`px-3 py-1 text-xs ${bookViewMode === 'calendar' ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'}`}
                        >
                          {tc('calendar')}
                        </button>
                        <button
                          onClick={() => setBookViewMode('list')}
                          className={`px-3 py-1 text-xs ${bookViewMode === 'list' ? 'bg-accent text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'}`}
                        >
                          {tc('list')}
                        </button>
                      </div>
                      {bookViewMode === 'list' && availableTimes.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="p-1 text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-sm text-text-secondary whitespace-nowrap">
                            {currentPage + 1} / {Math.ceil(availableTimes.length / ITEMS_PER_PAGE)}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(availableTimes.length / ITEMS_PER_PAGE) - 1, p + 1))}
                            disabled={currentPage >= Math.ceil(availableTimes.length / ITEMS_PER_PAGE) - 1}
                            className="p-1 text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Next page"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {bookViewMode === 'calendar' ? (
                    <CalendarView
                      role="living_group"
                      times={[...availableTimes, ...bookedTimes]}
                      proposals={proposals}
                      loading={loading}
                      frozen={isFrozen}
                      onBook={async (timeId, locations) => { await handleBook(timeId, locations); }}
                      onCancelBooking={async (timeId) => { await handleCancelRequest(timeId); }}
                      onPropose={async (proposalData) => {
                        const res = await fetch('/api/living-groups/propose-time', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(proposalData),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setMessage({ type: 'success', text: t('proposeTime.submitSuccess') });
                          if (data.proposal) {
                            setProposals(prev => [data.proposal, ...prev]);
                          }
                          fetchTimes();
                        } else {
                          throw new Error(data.error || t('proposeTime.submitError'));
                        }
                      }}
                    />
                  ) : (
                    <>
                      {loading ? (
                        <p className="text-text-secondary text-sm">Loading...</p>
                      ) : availableTimes.length === 0 ? (
                        <p className="text-text-secondary text-sm">{t('noTimes')}</p>
                      ) : (
                        <div className="space-y-2">
                          {availableTimes.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((time) => {
                            const hasDetails = time.notes;
                            const isExpanded = expandedTimeIds.has(time.id);
                            const isBookingThis = bookingTimeId === time.id;
                            return (
                              <div
                                key={time.id}
                                className={`px-3 py-2 border border-border rounded-lg ${hasDetails && !isBookingThis ? 'cursor-pointer' : ''}`}
                                onClick={hasDetails && !isBookingThis ? () => toggleTimeExpanded(time.id) : undefined}
                              >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0">
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {hasDetails && (
                                        <svg
                                          className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      )}
                                      <span className="font-medium text-sm">
                                        {new Date(time.date + 'T12:00:00').toLocaleDateString(locale, {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                      <span className="text-text-secondary text-sm">
                                        {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                                      </span>
                                    </div>
                                    <span className="text-text-muted text-xs truncate">
                                      {t('postedBy', { name: getCreatorLabel(time) })}
                                    </span>
                                  </div>
                                  {!isBookingThis && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBookingTimeId(time.id);
                                        setProposedLocations(['']);
                                      }}
                                      disabled={booking || isFrozen}
                                      className="btn-primary text-sm flex-shrink-0 w-full sm:w-auto"
                                    >
                                      {t('book')}
                                    </button>
                                  )}
                                </div>
                                {/* Booking location form */}
                                {isBookingThis && (
                                  <div className="mt-3 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                                    <p className="text-sm font-medium mb-2">{t('proposeLocations')}</p>
                                    <p className="text-xs text-text-muted mb-2">{t('proposeLocationsHint')}</p>
                                    <div className="space-y-2">
                                      {proposedLocations.map((loc, i) => (
                                        <div key={i} className="flex gap-2">
                                          <input
                                            type="text"
                                            value={loc}
                                            onChange={(e) => {
                                              const updated = [...proposedLocations];
                                              updated[i] = e.target.value;
                                              setProposedLocations(updated);
                                            }}
                                            placeholder={t('locationPlaceholder')}
                                            className="flex-1 border border-border rounded px-2 py-1.5 text-sm"
                                            maxLength={200}
                                          />
                                          {proposedLocations.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => setProposedLocations(proposedLocations.filter((_, j) => j !== i))}
                                              className="text-red-500 text-sm px-2 hover:text-red-700"
                                            >
                                              ×
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                      {proposedLocations.length < 5 && (
                                        <button
                                          type="button"
                                          onClick={() => setProposedLocations([...proposedLocations, ''])}
                                          className="text-xs text-accent hover:underline"
                                        >
                                          + {t('addLocation')}
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                      <button
                                        onClick={() => {
                                          const cleaned = proposedLocations.map(l => l.trim()).filter(l => l.length > 0);
                                          if (cleaned.length === 0) {
                                            setMessage({ type: 'error', text: t('locationRequired') });
                                            return;
                                          }
                                          handleBook(time.id, cleaned);
                                        }}
                                        disabled={booking}
                                        className="btn-primary text-sm"
                                      >
                                        {booking ? t('booking') : t('confirmBook')}
                                      </button>
                                      <button
                                        onClick={() => { setBookingTimeId(null); setProposedLocations(['']); }}
                                        className="text-sm text-text-secondary hover:text-text-primary"
                                      >
                                        {tc('cancel')}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {/* Expandable details */}
                                {isExpanded && hasDetails && !isBookingThis && (
                                  <div className="mt-2 pt-2 border-t border-border/50 text-xs text-text-muted space-y-0.5">
                                    {time.notes && <p><span className="font-medium">{t('notesLabel')}:</span> {time.notes}</p>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Propose a Time */}
                      {!isFrozen && (
                        <div className="mt-4">
                          {showListProposeForm ? (
                            <div className="border border-border rounded-lg p-4">
                              <h4 className="text-sm font-medium mb-3">{t('proposeTime.title')}</h4>
                              <p className="text-xs text-text-muted mb-3">{t('proposeTime.description')}</p>
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const form = e.target;
                                  const date = form.proposeDate.value;
                                  const start_time = form.proposeStart.value;
                                  const end_time = form.proposeEnd.value;
                                  const notes = form.proposeNotes.value;
                                  if (!date || !start_time || !end_time) return;
                                  if (start_time >= end_time) {
                                    setMessage({ type: 'error', text: t('proposeTime.startBeforeEnd') });
                                    return;
                                  }
                                  setProposing(true);
                                  try {
                                    const res = await fetch('/api/living-groups/propose-time', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ date, start_time, end_time, notes }),
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      setMessage({ type: 'success', text: t('proposeTime.submitSuccess') });
                                      if (data.proposal) {
                                        setProposals(prev => [data.proposal, ...prev]);
                                      }
                                      setShowListProposeForm(false);
                                      fetchTimes();
                                    } else {
                                      setMessage({ type: 'error', text: data.error || t('proposeTime.submitError') });
                                    }
                                  } catch {
                                    setMessage({ type: 'error', text: t('proposeTime.submitError') });
                                  } finally {
                                    setProposing(false);
                                  }
                                }}
                                className="space-y-3"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium mb-1">{t('proposeTime.date')}</label>
                                    <input
                                      type="date"
                                      name="proposeDate"
                                      min={new Date().toISOString().split('T')[0]}
                                      className="w-full border border-border rounded px-2 py-1.5 text-sm"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1">{t('proposeTime.startTime')} (EST)</label>
                                    <input
                                      type="time"
                                      name="proposeStart"
                                      className="w-full border border-border rounded px-2 py-1.5 text-sm"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1">{t('proposeTime.endTime')} (EST)</label>
                                    <input
                                      type="time"
                                      name="proposeEnd"
                                      className="w-full border border-border rounded px-2 py-1.5 text-sm"
                                      required
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">{t('proposeTime.notes')}</label>
                                  <input type="text" name="proposeNotes" className="w-full border border-border rounded px-2 py-1.5 text-sm" />
                                </div>
                                <div className="flex gap-2">
                                  <button type="submit" disabled={proposing} className="btn-primary text-sm">
                                    {proposing ? t('proposeTime.submitting') : t('proposeTime.submit')}
                                  </button>
                                  <button type="button" onClick={() => setShowListProposeForm(false)} className="text-sm text-text-secondary ml-4 hover:text-text-primary">
                                    {tc('cancel')}
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowListProposeForm(true)}
                              className="w-full py-2 text-sm border border-dashed border-accent/40 text-accent rounded-lg hover:bg-accent/5 transition-colors"
                            >
                              + {t('proposeTime.title')}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Your Proposals */}
                  {proposals.filter(p => !hiddenProposals.has(p.id) && !(p.status === 'cancelled' && !p.accepted_by)).length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <h4 className="text-xs font-medium text-text-muted uppercase mb-2">{t('proposeTime.yourProposals')}</h4>
                      <div className="space-y-2">
                        {proposals.filter(p => !hiddenProposals.has(p.id) && !(p.status === 'cancelled' && !p.accepted_by)).map((proposal) => (
                          <div
                            key={proposal.id}
                            className={`px-3 py-2 border rounded-lg text-sm ${
                              proposal.status === 'pending'
                                ? 'border-yellow-200 bg-yellow-50'
                                : proposal.status === 'accepted'
                                ? 'border-green-200 bg-green-50'
                                : proposal.status === 'declined'
                                ? 'border-red-200 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                            style={{ transition: 'opacity 500ms ease-out', opacity: fadingProposals.has(proposal.id) ? 0 : 1 }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-baseline gap-2">
                                  <p className="font-medium pb-0">
                                    {new Date(proposal.date + 'T12:00:00').toLocaleDateString(locale, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                  <span className="text-text-secondary text-sm">
                                    {formatTime(proposal.start_time)} - {formatTime(proposal.end_time)} EST
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
                                    proposal.status === 'pending'
                                      ? 'bg-yellow-200 text-yellow-800'
                                      : proposal.status === 'accepted'
                                      ? 'bg-green-200 text-green-800'
                                      : proposal.status === 'declined'
                                      ? 'bg-red-200 text-red-800'
                                      : 'bg-gray-200 text-gray-800'
                                  }`}>
                                    {proposal.status === 'pending' ? t('proposeTime.status.posted') : t(`proposeTime.status.${proposal.status}`)}
                                  </span>
                                </div>
                                {proposal.notes && (
                                  <p className="text-text-muted text-xs mt-0.5">
                                    <span className="italic">{proposal.notes}</span>
                                  </p>
                                )}
                                {proposal.status === 'declined' && proposal.decline_reason && (
                                  <p className="text-red-600 text-xs mt-1">{proposal.decline_reason}</p>
                                )}
                                {proposal.status === 'accepted' && proposal.accepter && (
                                  <p className="text-green-600 text-xs mt-1">
                                    {t('proposeTime.acceptedBy', {
                                      name: proposal.accepter.name || proposal.accepter.email,
                                    })}
                                  </p>
                                )}
                              </div>
                              {(proposal.status === 'pending' || proposal.status === 'accepted') && !isFrozen && (
                                <button
                                  onClick={() => {
                                    if (confirmCancelProposalId !== proposal.id) {
                                      setConfirmCancelProposalId(proposal.id);
                                      setTimeout(() => setConfirmCancelProposalId((prev) => prev === proposal.id ? null : prev), 3000);
                                      return;
                                    }
                                    setConfirmCancelProposalId(null);
                                    handleCancelProposal(proposal.id);
                                  }}
                                  disabled={cancellingProposalId === proposal.id}
                                  className={`text-xs flex-shrink-0 ml-2 ${confirmCancelProposalId === proposal.id ? 'text-red-700 font-medium' : 'text-red-600 hover:text-red-700'}`}
                                >
                                  {cancellingProposalId === proposal.id ? '...' : confirmCancelProposalId === proposal.id ? t('proposeTime.confirmCancel') : t('proposeTime.cancel')}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
                </>
              )}

              {/* Assign Sub-Tab */}
              {scheduleSubTab === 'assign' && (
                <div>
                  {bookedTimes.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-text-secondary text-sm mb-3">{t('assign.noBookedTimes')}</p>
                      <button
                        onClick={() => setScheduleSubTab('book')}
                        className="text-sm text-red-600 hover:text-red-700 underline"
                      >
                        {t('assign.goToBook')}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-medium mb-2">{t('assign.timeSlots.title')}</h3>
                      <p className="text-text-secondary text-sm mb-4">
                        {t('assign.timeSlots.description')}
                      </p>

                      {/* Unassigned sections warning */}
                      {(() => {
                        const allAssignedSections = new Set();
                        let totalSlots = 0;
                        let assignedSlots = 0;
                        bookedTimes.forEach(bt => {
                          const assignments = timeAssignments[bt.id] || {};
                          const slots = generateTimeSlots(bt.start_time, bt.end_time);
                          totalSlots += slots.length;
                          slots.forEach(slot => {
                            const key = `${slot.start}-${slot.end}`;
                            if (assignments[key]) {
                              assignedSlots++;
                              allAssignedSections.add(assignments[key]);
                            }
                          });
                        });
                        const unassigned = sections.filter(s => !allAssignedSections.has(s));

                        if (unassigned.length > 0 || assignedSlots < totalSlots) {
                          return (
                            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm text-yellow-800">
                                {unassigned.length > 0 && (
                                  <><span className="font-medium">{t('assign.timeSlots.unassignedSections')}:</span>{' '}{unassigned.join(', ')}</>
                                )}
                                {unassigned.length > 0 && assignedSlots < totalSlots && <br />}
                                {assignedSlots < totalSlots && (
                                  <span>{assignedSlots}/{totalSlots} slots assigned</span>
                                )}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm p-0 font-medium text-green-800">{t('assign.timeSlots.allAssigned')}</p>
                          </div>
                        );
                      })()}

                      {/* Assignment timeline for each booked time, grouped by date */}
                      <div className="space-y-4">
                        {Object.entries(
                          bookedTimes.reduce((groups, bt) => {
                            (groups[bt.date] ||= []).push(bt);
                            return groups;
                          }, {})
                        )
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([dateStr, dateTimes]) => (
                          <div key={dateStr} className="bg-white border border-border rounded-lg p-6">
                            {/* Date header */}
                            <div
                              className="flex justify-between items-center cursor-pointer select-none"
                              onClick={() => setCollapsedTimes((prev) => {
                                const next = new Set(prev);
                                if (next.has(dateStr)) next.delete(dateStr);
                                else next.add(dateStr);
                                return next;
                              })}
                            >
                              <div className="flex items-center gap-2">
                                <svg
                                  className={`w-4 h-4 flex-shrink-0 text-text-muted transition-transform ${collapsedTimes.has(dateStr) ? '' : 'rotate-90'}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="font-medium leading-none">
                                  {new Date(dateStr + 'T12:00:00').toLocaleDateString(locale, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <FadeMessage
                                message={sectionsMessage}
                                onClear={setSectionsMessage}
                                className="text-xs px-2 py-1 rounded whitespace-nowrap"
                              />
                            </div>

                            {!collapsedTimes.has(dateStr) && (
                              <div className="mt-4 space-y-6">
                                {dateTimes
                                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                  .map((bookedTime) => (
                                  <div key={bookedTime.id}>
                                    <p className="text-text-secondary text-sm mb-3">
                                      {formatTime(bookedTime.start_time)} - {formatTime(bookedTime.end_time)} EST
                                    </p>
                                    {assignmentsLoading ? (
                                      <p className="text-text-muted text-sm">Loading...</p>
                                    ) : (
                                      <SectionAssignmentTimeline
                                        bookedTime={bookedTime}
                                        sections={sections}
                                        assignments={timeAssignments[bookedTime.id] || {}}
                                        onAssign={handleAssignSection}
                                        formatTime={formatTime}
                                        saving={!!savingSlot}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Sections Tab - Section Management */}
          {activeTab === 'sections' && (
            <div>
              <p className="text-text-secondary text-sm mb-4">{t('assign.description')}</p>

              {/* Add section form */}
              <form onSubmit={handleAddSection} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder={t('assign.addPlaceholder')}
                  className="flex-1 border border-border rounded px-4 py-2"
                />
                <button
                  type="submit"
                  disabled={addingSection || !newSectionName.trim()}
                  className="btn-primary"
                >
                  {addingSection ? t('assign.adding') : <><span className="sm:hidden text-lg leading-none">+</span><span className="hidden sm:inline">{t('assign.addSection')}</span></>}
                </button>
              </form>

              <FadeMessage message={imageMessage} onClear={setImageMessage} className="mb-4 p-4 rounded" />

              {/* Sections List - Compact */}
              {sectionsLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : sections.length === 0 ? (
                <div>
                  <p className="text-text-secondary text-sm mb-4">{t('assign.noSectionsDescription')}</p>
                  <div className="px-3 py-3 border border-border rounded-lg flex items-start gap-3 max-w-sm">
                    <ImageUpload
                      imageUrl={livingGroup?.section_images?.['__default__'] || null}
                      fileName={`${(livingGroup?.name || '').replace(/\s+/g, '_')}_Candid`}
                      size="sm"
                      disabled={isFrozen}
                      onUpload={async (file) => {
                        setImageMessage({ type: '', text: '' });

                        // Step 1: Get presigned upload URL
                        const presignRes = await fetch('/api/living-groups/images/presign', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            fileName: file.name,
                            fileType: file.type,
                            sectionName: '__default__'
                          })
                        });

                        if (!presignRes.ok) {
                          const presignData = await presignRes.json();
                          setImageMessage({ type: 'error', text: presignData.error || 'Failed to prepare upload' });
                          throw new Error(presignData.error || 'Failed to prepare upload');
                        }

                        const { signedUrl, path, livingGroupId, sectionName } = await presignRes.json();

                        // Step 2: Upload directly to Supabase Storage
                        const uploadRes = await fetch(signedUrl, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': file.type,
                            'x-upsert': 'true'
                          },
                          body: file
                        });

                        if (!uploadRes.ok) {
                          const errorText = await uploadRes.text().catch(() => '');
                          console.error('Upload failed:', uploadRes.status, errorText);
                          setImageMessage({ type: 'error', text: 'Upload to storage failed' });
                          throw new Error('Upload to storage failed');
                        }

                        // Step 3: Confirm upload and update database
                        const confirmRes = await fetch('/api/living-groups/images/confirm', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ path, sectionName, livingGroupId })
                        });

                        const confirmData = await confirmRes.json();
                        if (!confirmRes.ok) {
                          setImageMessage({ type: 'error', text: confirmData.error || 'Failed to confirm upload' });
                          throw new Error(confirmData.error || 'Failed to confirm upload');
                        }

                        return confirmData.url;
                      }}
                      onDelete={async () => {
                        setImageMessage({ type: '', text: '' });
                        const res = await fetch(`/api/living-groups/images?section_name=${encodeURIComponent('__default__')}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (!res.ok) {
                          setImageMessage({ type: 'error', text: data.error || 'Delete failed' });
                          throw new Error(data.error || 'Delete failed');
                        }
                      }}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{t('assign.defaultImageTitle')}</span>
                      <p className="text-xs text-text-muted mt-1">{t('assign.defaultImageHint')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sections.map((section) => {
                    const memberCount = manualMembers.filter(m => m.section_name === section).length;
                    return (
                      <div
                        key={section}
                        className="px-3 py-3 border border-border rounded-lg flex items-start gap-3"
                      >
                        <ImageUpload
                          imageUrl={livingGroup?.section_images?.[section] || null}
                          fileName={`${(livingGroup?.name || '').replace(/\s+/g, '_')}_${section.replace(/\s+/g, '_')}_Candid`}
                          size="sm"
                          disabled={isFrozen}
                          onUpload={async (file) => {
                            setImageMessage({ type: '', text: '' });

                            // Step 1: Get presigned upload URL
                            const presignRes = await fetch('/api/living-groups/images/presign', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                fileName: file.name,
                                fileType: file.type,
                                sectionName: section
                              })
                            });

                            if (!presignRes.ok) {
                              const presignData = await presignRes.json();
                              setImageMessage({ type: 'error', text: presignData.error || 'Failed to prepare upload' });
                              throw new Error(presignData.error || 'Failed to prepare upload');
                            }

                            const { signedUrl, path, livingGroupId, sectionName } = await presignRes.json();

                            // Step 2: Upload directly to Supabase Storage
                            const uploadRes = await fetch(signedUrl, {
                              method: 'PUT',
                              headers: { 'Content-Type': file.type },
                              body: file
                            });

                            if (!uploadRes.ok) {
                              setImageMessage({ type: 'error', text: 'Upload to storage failed' });
                              throw new Error('Upload to storage failed');
                            }

                            // Step 3: Confirm upload and update database
                            const confirmRes = await fetch('/api/living-groups/images/confirm', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path, sectionName, livingGroupId })
                            });

                            const confirmData = await confirmRes.json();
                            if (!confirmRes.ok) {
                              setImageMessage({ type: 'error', text: confirmData.error || 'Failed to confirm upload' });
                              throw new Error(confirmData.error || 'Failed to confirm upload');
                            }

                            return confirmData.url;
                          }}
                          onDelete={async () => {
                            setImageMessage({ type: '', text: '' });
                            const res = await fetch(`/api/living-groups/images?section_name=${encodeURIComponent(section)}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (!res.ok) {
                              setImageMessage({ type: 'error', text: data.error || 'Delete failed' });
                              throw new Error(data.error || 'Delete failed');
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-medium">{section}</span>
                            <button
                              onClick={() => handleRemoveSection(section)}
                              disabled={removingSectionName === section}
                              className="text-xs text-red-600 hover:text-red-700 whitespace-nowrap"
                            >
                              {removingSectionName === section ? t('assign.removing') : t('assign.removeSection')}
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              setNewMemberSection(section);
                              setActiveTab('members');
                            }}
                            className="text-xs text-text-muted hover:text-accent hover:underline"
                          >
                            {t('assign.memberCount', { count: memberCount })}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Confirmation Modal for Removing Section */}
              {sectionToRemove && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-medium mb-2">{t('assign.confirmRemoveTitle')}</h3>
                    <p className="text-text-secondary mb-4">
                      {t('assign.confirmRemoveMessage', { section: sectionToRemove })}
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setSectionToRemove(null)}
                        className="px-4 py-2 border border-border rounded hover:bg-gray-50"
                      >
                        {t('members.cancel')}
                      </button>
                      <button
                        onClick={confirmRemoveSection}
                        disabled={removingSectionName === sectionToRemove}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {removingSectionName === sectionToRemove ? t('assign.removing') : t('members.confirm')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab - FSILGs Only */}
          {activeTab === 'profile' && isFsilg && (
            <div>
              {/* Description Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">{t('profile.descriptionTitle')}</h3>
                <p className="text-text-secondary text-sm mb-3">{t('profile.descriptionHint')}</p>
                <textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  disabled={isFrozen}
                  placeholder={t('profile.descriptionPlaceholder')}
                  className="w-full p-3 border border-border rounded min-h-[120px] resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
                  maxLength={2000}
                />
                <p className="text-xs text-text-muted mt-1 flex items-center gap-2">
                  <span className={description.trim().split(/\s+/).filter(Boolean).length > 75 ? 'text-red-600' : ''}>
                    {description.trim().split(/\s+/).filter(Boolean).length} / 75 {t('profile.words')}
                  </span>
                  {descriptionSaveStatus === 'saving' && (
                    <span className="text-text-secondary">{t('profile.saving')}</span>
                  )}
                  {descriptionSaveStatus === 'saved' && (
                    <span className="text-green-600">{t('profile.saved')}</span>
                  )}
                  {descriptionSaveStatus === 'error' && (
                    <span className="text-red-600">{t('profile.saveError')}</span>
                  )}
                </p>
              </div>

              {/* Candid Images Section */}
              <h3 className="text-lg font-semibold mb-4">{t('profile.photosTitle')}</h3>

              {candidImageMessage.text && (
                <div className={`mb-6 p-4 rounded ${
                  candidImageMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {candidImageMessage.text}
                </div>
              )}

              <div className="flex gap-4 flex-wrap">
                {[1, 2, 3].map((slot) => {
                  const suffix = slot === 1 ? '' : `_${slot}`;
                  const imageField = `candid_image_${slot}`;
                  // Use local override if set, otherwise fall back to livingGroup data
                  const currentUrl = imageField in imageOverrides
                    ? imageOverrides[imageField]
                    : livingGroup?.[imageField];
                  return (
                    <ImageUpload
                      key={slot}
                      imageUrl={currentUrl}
                      label={slot === 1 ? t('candids.mainImage') : t('candids.additionalImage')}
                      fileName={`${(livingGroup?.name || '').replace(/\s+/g, '_')}_Candid${suffix}`}
                      disabled={isFrozen}
                      onUpload={async (file) => {
                        setCandidImageMessage({ type: '', text: '' });

                        // Step 1: Get presigned upload URL
                        const presignRes = await fetch('/api/living-groups/candid-images/presign', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            fileName: file.name,
                            fileType: file.type,
                            slot: String(slot)
                          })
                        });

                        if (!presignRes.ok) {
                          const presignData = await presignRes.json();
                          setCandidImageMessage({ type: 'error', text: presignData.error || 'Failed to prepare upload' });
                          throw new Error(presignData.error || 'Failed to prepare upload');
                        }

                        const { signedUrl, path, livingGroupId } = await presignRes.json();

                        // Step 2: Upload directly to Supabase Storage
                        const uploadRes = await fetch(signedUrl, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': file.type,
                            'x-upsert': 'true'
                          },
                          body: file
                        });

                        if (!uploadRes.ok) {
                          const errorText = await uploadRes.text().catch(() => '');
                          console.error('Upload failed:', uploadRes.status, errorText);
                          setCandidImageMessage({ type: 'error', text: 'Upload to storage failed' });
                          throw new Error('Upload to storage failed');
                        }

                        // Step 3: Confirm upload and update database
                        const confirmRes = await fetch('/api/living-groups/candid-images/confirm', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ path, slot: String(slot), livingGroupId })
                        });

                        const confirmData = await confirmRes.json();
                        if (!confirmRes.ok) {
                          setCandidImageMessage({ type: 'error', text: confirmData.error || 'Failed to confirm upload' });
                          throw new Error(confirmData.error || 'Failed to confirm upload');
                        }

                        setCandidImageMessage({
                          type: 'success',
                          text: t('candids.uploadSuccess')
                        });
                        // Update locally with cache-busting param
                        const newUrl = confirmData.url;
                        setImageOverrides(prev => ({ ...prev, [imageField]: newUrl }));
                        return newUrl;
                      }}
                      onDelete={async () => {
                        setCandidImageMessage({ type: '', text: '' });
                        const res = await fetch(`/api/living-groups/candid-images?slot=${slot}`, {
                          method: 'DELETE'
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setCandidImageMessage({
                            type: 'error',
                            text: data.error || 'Delete failed'
                          });
                          throw new Error(data.error || 'Delete failed');
                        }
                        setCandidImageMessage({
                          type: 'success',
                          text: t('candids.deleteSuccess')
                        });
                        // Clear locally
                        setImageOverrides(prev => ({ ...prev, [imageField]: null }));
                      }}
                    />
                  );
                })}
              </div>

              <p className="text-text-secondary text-sm mt-6 p-3 bg-gray-50 border border-gray-200 rounded">
                {t('candids.optionalNote')}
              </p>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              {/* Success/Error Message with optional Undo button */}
              {membersMessage.text && (
                deletedMembersForRevert && deletedMembersForRevert.length > 0 && membersMessage.type === 'success' ? (
                  // Message with undo button - no auto-fade
                  <div
                    className="mb-6 p-4 rounded flex items-center justify-between gap-3 bg-green-50 text-green-600"
                  >
                    <p className="flex-1 pb-0">{membersMessage.text}</p>
                    <button
                      onClick={handleRevertBulkReset}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                    >
                      {t('members.bulkReset.revertButton')}
                    </button>
                  </div>
                ) : (
                  // Regular message - auto-fade after 3.5 seconds
                  <FadeMessage message={membersMessage} onClear={setMembersMessage} />
                )
              )}

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
                    {sections.length > 0 && (
                      <select
                        value={newMemberSection}
                        onChange={(e) => setNewMemberSection(e.target.value)}
                        className="border border-border rounded px-4 py-2"
                      >
                        <option value="">{t('members.noSection')}</option>
                        {sections.map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    )}
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
                    {sections.length > 0 && (
                      <select
                        value={newMemberSection}
                        onChange={(e) => setNewMemberSection(e.target.value)}
                        className="border border-border rounded px-4 py-2"
                      >
                        <option value="">{t('members.assignLater')}</option>
                        {sections.map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    )}
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

              {/* Divider */}
              {!membersLoading && manualMembers.length > 0 && (
                <div className="border-t border-gray-200 my-6"></div>
              )}

              {/* Search and Pagination Controls */}
              {!membersLoading && manualMembers.length > 0 && (() => {
                // Filter members based on search query
                const filteredMembers = memberSearchQuery.trim()
                  ? manualMembers.filter(m =>
                      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    )
                  : manualMembers;

                const totalPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE);
                const startIndex = (membersPage - 1) * MEMBERS_PER_PAGE;
                const endIndex = startIndex + MEMBERS_PER_PAGE;
                const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

                return (
                  <>
                    {/* Search and Pagination Bar */}
                    <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      {/* Search Input */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={memberSearchQuery}
                          onChange={(e) => {
                            setMemberSearchQuery(e.target.value);
                            setMembersPage(1); // Reset to first page on search
                          }}
                          placeholder={t('members.searchPlaceholder') || 'Search members...'}
                          className="w-full border border-border rounded px-4 py-2"
                        />
                      </div>

                      {/* Pagination Controls */}
                      {filteredMembers.length > MEMBERS_PER_PAGE && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setMembersPage(p => Math.max(1, p - 1))}
                            disabled={membersPage === 1}
                            className="p-2 text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed border border-border rounded"
                            aria-label="Previous page"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-sm text-text-secondary whitespace-nowrap min-w-[60px] text-center">
                            {membersPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => setMembersPage(p => Math.min(totalPages, p + 1))}
                            disabled={membersPage >= totalPages}
                            className="p-2 text-text-secondary hover:text-text disabled:opacity-30 disabled:cursor-not-allowed border border-border rounded"
                            aria-label="Next page"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Store filtered and paginated members for rendering below */}
                    <div style={{ display: 'none' }} data-filtered-members={JSON.stringify(paginatedMembers)} />
                  </>
                );
              })()}

              {/* Members List - grouped by section if sections exist */}
              {membersLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : manualMembers.length === 0 ? (
                <p className="text-text-secondary">{t('members.noMembers')}</p>
              ) : (() => {
                // Apply search filter and pagination
                const filteredMembers = memberSearchQuery.trim()
                  ? manualMembers.filter(m =>
                      m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    )
                  : manualMembers;

                const startIndex = (membersPage - 1) * MEMBERS_PER_PAGE;
                const endIndex = startIndex + MEMBERS_PER_PAGE;
                const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

                if (filteredMembers.length === 0) {
                  return <p className="text-text-secondary">{t('members.noResults') || 'No members found'}</p>;
                }

                return sections.length > 0 ? (
                // Show members grouped by section (sections first, then unassigned)
                <div className="space-y-6">
                  {/* Members by section */}
                  {sections.map((section) => {
                    const sectionMembers = paginatedMembers.filter(m => m.section_name === section);
                    if (sectionMembers.length === 0) return null;
                    return (
                      <div key={section}>
                        <h3 className="text-sm font-medium text-text-muted mb-2">
                          {section} ({sectionMembers.length})
                        </h3>
                        <div className="space-y-2">
                          {sectionMembers.map((member) => (
                            <div
                              key={member.id}
                              className="py-2 px-3 border border-border rounded-lg flex justify-between items-center gap-2"
                            >
                              <p className="flex-1 p-0">
                                {member.name}
                              </p>
                              <select
                                value={member.section_name || ''}
                                onChange={(e) => handleUpdateMemberSection(member.id, e.target.value)}
                                disabled={updatingMemberId === member.id}
                                className="text-sm border border-border rounded px-2 py-1"
                              >
                                <option value="">{t('members.noSection')}</option>
                                {sections.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleRemoveManualMember(member)}
                                disabled={removingMemberId === member.id}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                {removingMemberId === member.id ? '...' : t('members.remove')}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Unassigned members - at the bottom */}
                  {(() => {
                    const unassigned = paginatedMembers.filter(m => !m.section_name);
                    if (unassigned.length === 0) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-medium text-text-muted mb-2">
                          {t('members.unassigned')} ({unassigned.length})
                        </h3>
                        <div className="space-y-2">
                          {unassigned.map((member) => (
                            <div
                              key={member.id}
                              className="py-2 px-3 border border-border rounded-lg flex justify-between items-center gap-2"
                            >
                              <p className="flex-1 py-1">
                                {member.name}
                              </p>
                              <select
                                value={member.section_name || ''}
                                onChange={(e) => handleUpdateMemberSection(member.id, e.target.value)}
                                disabled={updatingMemberId === member.id}
                                className="text-sm border border-border rounded px-2 py-1"
                              >
                                <option value="">{t('members.selectSection')}</option>
                                {sections.map((section) => (
                                  <option key={section} value={section}>{section}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleRemoveManualMember(member)}
                                disabled={removingMemberId === member.id}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                {removingMemberId === member.id ? '...' : t('members.remove')}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                // No sections - simple list
                <div className="space-y-2">
                  {paginatedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="px-4 py-2 border border-border rounded-lg flex justify-between items-center"
                    >
                      <p className="p-0">
                        {member.name}
                      </p>
                      <button
                        onClick={() => handleRemoveManualMember(member)}
                        disabled={removingMemberId === member.id}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        {removingMemberId === member.id ? t('members.removing') : t('members.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              );
              })()}

              {/* Bulk Reset Section */}
              {manualMembers.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <button
                      onClick={() => setShowBulkResetConfirm(true)}
                      disabled={bulkResetting}
                      className="px-4 py-2 border-2 border-[#750014] text-[#750014] rounded hover:bg-[#750014] hover:text-white disabled:opacity-50 whitespace-nowrap text-sm transition-colors"
                    >
                      {bulkResetting ? t('members.bulkReset.resetting') : t('members.bulkReset.button')}
                    </button>
                    {!isFsilg && sections.length > 0 && (
                      <select
                        value={bulkResetSection}
                        onChange={(e) => setBulkResetSection(e.target.value)}
                        className="border border-border rounded px-3 py-2 text-sm"
                      >
                        <option value="all">{t('members.bulkReset.allSections')}</option>
                        {sections.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Member Removal Confirmation Modal */}
              {memberToRemove && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-medium mb-2">{t('members.remove')}</h3>
                    <p className="text-text-secondary mb-4">
                      {t('members.confirmRemove')}
                      <br />
                      <span className="font-medium">
                        {memberToRemove.name}
                      </span>
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setMemberToRemove(null)}
                        className="px-4 py-2 border border-border rounded hover:bg-gray-50"
                      >
                        {t('members.cancel')}
                      </button>
                      <button
                        onClick={confirmRemoveMember}
                        disabled={removingMemberId === memberToRemove.id}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {removingMemberId === memberToRemove.id ? t('members.removing') : t('members.confirm')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Reset Confirmation Modal */}
              <ConfirmationModal
                open={showBulkResetConfirm}
                onCancel={() => setShowBulkResetConfirm(false)}
                onConfirm={handleBulkReset}
                title={t('members.bulkReset.confirmTitle')}
                message={
                  isFsilg || bulkResetSection === 'all'
                    ? t('members.bulkReset.confirmMessageAll', { count: manualMembers.length })
                    : t('members.bulkReset.confirmMessageSection', {
                        section: bulkResetSection,
                        count: manualMembers.filter(m => m.section_name === bulkResetSection).length,
                      })
                }
                confirmText={t('members.bulkReset.confirmButton')}
                cancelText={t('members.cancel')}
                isDangerous={true}
                disabled={bulkResetting}
              />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              {/* Email Section */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2">{t('settings.emailTitle')}</label>
                <p className="text-text-secondary text-sm mb-3">{t('settings.emailDescription')}</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={livingGroupEmail}
                    onChange={(e) => setLivingGroupEmail(e.target.value)}
                    placeholder={t('settings.emailPlaceholder')}
                    className="flex-1 border border-border rounded px-4 py-2"
                  />
                  <button
                    onClick={handleSaveEmail}
                    disabled={savingEmail}
                    className="px-4 py-2 bg-[#750014] text-white rounded hover:bg-[#5C0010] disabled:opacity-50 whitespace-nowrap"
                  >
                    {savingEmail ? '...' : t('settings.saveEmail')}
                  </button>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-medium">{t('documents.title')}</h3>
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
                <p className="text-text-secondary text-sm mb-4">{t('documents.description')}</p>

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
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
