'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';
import ImageUpload from '../../../components/ImageUpload/ImageUpload';
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { generateTimeSlots, formatTimeDisplay as formatTimeUtil } from '../../../lib/utils/time';

// Generate 30-minute time slot options (06:00 to 23:30)
function generateTimeOptions() {
  const options = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push(time);
    }
  }
  return options;
}

// Format time for display (14:30 -> 2:30 PM)
function formatTimeDisplay(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

const TIME_OPTIONS = generateTimeOptions();

// Get the next 30-minute time slot from now
function getDefaultStartTime() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();

  // Round up to next 30-minute interval
  if (minutes > 30) {
    hours += 1;
    minutes = 0;
  } else if (minutes > 0) {
    minutes = 30;
  }

  // Ensure within TIME_OPTIONS range (06:00 - 23:30)
  if (hours < 6) {
    hours = 6;
    minutes = 0;
  } else if (hours >= 24) {
    hours = 6;
    minutes = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Get end time 1 hour after start
function getDefaultEndTime(startTime) {
  if (!startTime) return '07:00';
  const [h, m] = startTime.split(':').map(Number);
  let endH = h + 1;
  if (endH > 23) endH = 23;
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Strip seconds from time string (HH:MM:SS -> HH:MM)
function formatTime(time) {
  if (!time) return '';
  return time.slice(0, 5);
}

// MUI styling to match other forms
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

export default function LivingGroupPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('livingGroupPage');
  const { isLoggedIn, user, livingGroup, loading: userLoading, refetch } = useUser();

  // Tab state
  const [activeTab, setActiveTab] = useState('book');

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

  // Manual members state
  const [manualMembers, setManualMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersMessage, setMembersMessage] = useState({ type: '', text: '' });
  const [inputMode, setInputMode] = useState('single'); // 'single' or 'bulk'
  const [singleMember, setSingleMember] = useState({ firstName: '', lastName: '' });
  const [bulkText, setBulkText] = useState('');
  const [parsePreview, setParsePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newMemberSection, setNewMemberSection] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Sections state
  const [sections, setSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [removingSectionName, setRemovingSectionName] = useState(null);
  const [sectionsMessage, setSectionsMessage] = useState({ type: '', text: '' });
  const [imageMessage, setImageMessage] = useState({ type: '', text: '' });
  const [sectionToRemove, setSectionToRemove] = useState(null);

  // Time assignments state
  const [timeAssignments, setTimeAssignments] = useState({});
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [savingSlot, setSavingSlot] = useState(null);

  // Documents state
  const [documents, setDocuments] = useState({
    links: '',
    notes: '',
  });
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [documentsMessage, setDocumentsMessage] = useState({ type: '', text: '' });
  const [documentsLoading, setDocumentsLoading] = useState(true);

  // Time proposal state
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [proposalForm, setProposalForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [cancellingProposalId, setCancellingProposalId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 8;

  // Expanded time slots (to show location/notes)
  const [expandedTimeIds, setExpandedTimeIds] = useState(new Set());

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
    const name = `${time.creator.first_name || ''} ${time.creator.last_name || ''}`.trim();
    return name || time.creator.email || t('unknownCreator');
  }

  useEffect(() => {
    if (!userLoading && (!isLoggedIn || user?.role !== 'living_group')) {
      router.push(`/${locale}/login`);
    }
  }, [isLoggedIn, user, userLoading, router, locale]);

  // Auto-fade success messages after 4 seconds
  useEffect(() => {
    if (message.type === 'success' && message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (membersMessage.type === 'success' && membersMessage.text) {
      const timer = setTimeout(() => {
        setMembersMessage({ type: '', text: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [membersMessage]);

  useEffect(() => {
    if (sectionsMessage.type === 'success' && sectionsMessage.text) {
      const timer = setTimeout(() => {
        setSectionsMessage({ type: '', text: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [sectionsMessage]);

  useEffect(() => {
    if (documentsMessage.type === 'success' && documentsMessage.text) {
      const timer = setTimeout(() => {
        setDocumentsMessage({ type: '', text: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [documentsMessage]);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'living_group') {
      fetchTimes();
      checkFrozen();
      fetchMembers();
      fetchProposals();
      fetchSections();
      fetchDocuments();
      if (livingGroup?.id) {
        fetchTimeAssignments(livingGroup.id);
      }
    }
  }, [isLoggedIn, user, livingGroup]);

  // Set default proposal form values on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const defaultStart = getDefaultStartTime();
    const defaultEnd = getDefaultEndTime(defaultStart);
    setProposalForm(prev => ({
      ...prev,
      date: today,
      start_time: defaultStart,
      end_time: defaultEnd,
    }));
  }, []);

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
      const frozen = data.frozenForms?.some(f => f.form_name === 'living_group_booking' && f.is_frozen);
      setIsFrozen(frozen || false);
    } catch (error) {
      console.error('Error checking frozen status:', error);
    }
  }

  async function handleBook(timeId) {
    if (isFrozen) return;

    setBooking(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('bookSuccess') });
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

    const reason = prompt(t('cancelReason'));
    if (reason === null) return;

    setCancelling(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, timeId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('cancelRequestSuccess') });
        fetchTimes();
      } else {
        setMessage({ type: 'error', text: data.error || t('cancelRequestError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('cancelRequestError') });
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
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleAddSingleMember(e) {
    e.preventDefault();
    if (!singleMember.lastName.trim() || !livingGroup?.id) return;

    setAddingMember(true);
    setMembersMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/manual-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: singleMember.firstName.trim(),
          lastName: singleMember.lastName.trim(),
          section_name: newMemberSection || null,
        }),
      });

      if (res.ok) {
        setSingleMember({ firstName: '', lastName: '' });
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

    const memberName = memberToRemove.first_name
      ? `${memberToRemove.last_name}, ${memberToRemove.first_name}`
      : memberToRemove.last_name;

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
        const slotKey = `${a.slotStart}-${a.slotEnd}`;
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
      const res = await fetch('/api/living-groups/documents', {
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

  async function fetchProposals() {
    try {
      setProposalsLoading(true);
      const res = await fetch('/api/living-groups/propose-time');
      const data = await res.json();
      if (res.ok) {
        setProposals(data.proposals || []);
      } else {
        console.error('Error fetching proposals:', data.error);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setProposalsLoading(false);
    }
  }

  useEffect(() => {
    if (livingGroup?.id) {
      fetchLivingGroupEmail();
    }
  }, [livingGroup?.id]);

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


  async function handleSubmitProposal(e) {
    e.preventDefault();
    if (!proposalForm.date || !proposalForm.start_time || !proposalForm.end_time) {
      setMessage({ type: 'error', text: t('proposeTime.fieldsRequired') });
      return;
    }

    // Validate start time is before end time
    const startMins = parseInt(proposalForm.start_time.split(':')[0]) * 60 + parseInt(proposalForm.start_time.split(':')[1]);
    const endMins = parseInt(proposalForm.end_time.split(':')[0]) * 60 + parseInt(proposalForm.end_time.split(':')[1]);
    if (startMins >= endMins) {
      setMessage({ type: 'error', text: t('proposeTime.startBeforeEnd') });
      return;
    }

    // Validate date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (proposalForm.date < today) {
      setMessage({ type: 'error', text: t('proposeTime.noPastDates') });
      return;
    }

    setSubmittingProposal(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/propose-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposalForm),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: t('proposeTime.submitSuccess') });
        if (data.proposal) {
          setProposals(prev => [data.proposal, ...prev]);
        }
        setProposalForm({
          date: '',
          start_time: '',
          end_time: '',
          location: '',
          notes: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || t('proposeTime.submitError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('proposeTime.submitError') });
    } finally {
      setSubmittingProposal(false);
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

  const tabs = [
    { id: 'book', label: t('tabs.book') },
    ...(!isFsilg ? [{ id: 'assign', label: t('tabs.assign') }] : []),
    { id: 'members', label: t('tabs.members') },
    { id: 'documents', label: t('tabs.documents') },
    { id: 'settings', label: t('tabs.settings') },
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

          {/* Frozen Notice */}
          {isFrozen && !isDisabled && activeTab === 'book' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">{t('frozen')}</p>
            </div>
          )}

          {message.text && (
            <div className={`mb-6 p-4 rounded ${
              message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

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

          {/* Profile Tab */}
          {activeTab === 'profile' && (
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

          {/* Book Tab */}
          {activeTab === 'book' && (
            <>
              {/* Current Bookings */}
              {bookedTimes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">{t('currentBooking')}</h2>
                  <div className="space-y-3">
                    {bookedTimes.map((bookedTime) => (
                      <div key={bookedTime.id} className={`p-4 border rounded-lg ${
                        bookedTime.cancellation_requested
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-green-200 bg-green-50'
                      }`}>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                            <p className="font-medium">
                              {new Date(bookedTime.date).toLocaleDateString(locale, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-text-secondary">
                              {formatTime(bookedTime.start_time)} - {formatTime(bookedTime.end_time)} EST
                            </p>
                          </div>
                          {!bookedTime.cancellation_requested && !isDisabled && !isFrozen && (
                            <button
                              onClick={() => handleCancelRequest(bookedTime.id)}
                              disabled={cancelling}
                              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 whitespace-nowrap"
                            >
                              {cancelling ? t('requesting') : t('requestCancel')}
                            </button>
                          )}
                        </div>
                        {bookedTime.cancellation_requested && (
                          <p className="text-yellow-600 text-sm">{t('cancellationPending')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Times */}
              {!isDisabled && (
                <div className="bg-white border border-border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">{t('availableTimes')}</h3>
                    {availableTimes.length > ITEMS_PER_PAGE && (
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
                        <span className="text-sm text-text-secondary">
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
                  {loading ? (
                    <p className="text-text-secondary text-sm">Loading...</p>
                  ) : availableTimes.length === 0 ? (
                    <p className="text-text-secondary text-sm">{t('noTimes')}</p>
                  ) : (
                    <div className="space-y-2">
                      {availableTimes.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((time) => {
                        const hasDetails = time.location || time.notes;
                        const isExpanded = expandedTimeIds.has(time.id);
                        return (
                          <div
                            key={time.id}
                            className={`px-3 py-2 border border-border rounded-lg ${hasDetails ? 'cursor-pointer' : ''}`}
                            onClick={hasDetails ? () => toggleTimeExpanded(time.id) : undefined}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
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
                                    {new Date(time.date).toLocaleDateString(locale, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  <span className="text-text-secondary text-sm">
                                    {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
                                  </span>
                                </div>
                                <span className="text-text-muted text-xs">
                                  {t('postedBy', { name: getCreatorLabel(time) })}
                                </span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleBook(time.id); }}
                                disabled={booking || isFrozen}
                                className="btn-primary text-sm flex-shrink-0"
                              >
                                {booking ? t('booking') : t('book')}
                              </button>
                            </div>
                            {/* Expandable details */}
                            {isExpanded && hasDetails && (
                              <div className="mt-2 pt-2 border-t border-border/50 text-xs text-text-muted space-y-0.5">
                                {time.location && <p><span className="font-medium">{t('locationLabel')}:</span> {time.location}</p>}
                                {time.notes && <p><span className="font-medium">{t('notesLabel')}:</span> {time.notes}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Propose Time Section */}
              {!isDisabled && (
                <div className="mt-8">
                  <div className="bg-white border border-border rounded-lg p-6">
                    <h3 className="font-medium mb-2">{t('proposeTime.title')}</h3>
                    <p className="text-text-secondary text-sm mb-2">{t('proposeTime.description')}</p>
                    <p className="text-text-muted text-xs mb-4">{t('proposeTime.timezoneNote')}</p>

                    <form onSubmit={handleSubmitProposal} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextField
                          type="date"
                          label={t('proposeTime.date')}
                          value={proposalForm.date}
                          onChange={(e) => setProposalForm({ ...proposalForm, date: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: new Date().toISOString().split('T')[0] }}
                          required
                          size="small"
                          fullWidth
                          sx={textFieldSx}
                        />
                        <FormControl size="small" fullWidth required sx={textFieldSx}>
                          <InputLabel id="start-time-label">{t('proposeTime.startTime')}</InputLabel>
                          <Select
                            labelId="start-time-label"
                            value={proposalForm.start_time}
                            label={t('proposeTime.startTime')}
                            onChange={(e) => setProposalForm({ ...proposalForm, start_time: e.target.value })}
                          >
                            {TIME_OPTIONS.map((time) => (
                              <MenuItem key={time} value={time}>
                                {formatTimeDisplay(time)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl size="small" fullWidth required sx={textFieldSx}>
                          <InputLabel id="end-time-label">{t('proposeTime.endTime')}</InputLabel>
                          <Select
                            labelId="end-time-label"
                            value={proposalForm.end_time}
                            label={t('proposeTime.endTime')}
                            onChange={(e) => setProposalForm({ ...proposalForm, end_time: e.target.value })}
                          >
                            {TIME_OPTIONS.map((time) => (
                              <MenuItem key={time} value={time}>
                                {formatTimeDisplay(time)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                          label={t('proposeTime.location')}
                          value={proposalForm.location}
                          onChange={(e) => setProposalForm({ ...proposalForm, location: e.target.value })}
                          size="small"
                          fullWidth
                          sx={textFieldSx}
                        />
                        <TextField
                          label={t('proposeTime.notes')}
                          value={proposalForm.notes}
                          onChange={(e) => setProposalForm({ ...proposalForm, notes: e.target.value })}
                          size="small"
                          fullWidth
                          sx={textFieldSx}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingProposal || isFrozen}
                        className="btn-primary text-sm"
                      >
                        {submittingProposal ? t('proposeTime.submitting') : t('proposeTime.submit')}
                      </button>
                    </form>
                  </div>

                  {/* Your Proposals */}
                  <div className="bg-white border border-border rounded-lg p-6 mt-6">
                    <h3 className="font-medium mb-4">{t('proposeTime.yourProposals')}</h3>
                    {proposalsLoading ? (
                      <p className="text-text-secondary text-sm">Loading...</p>
                    ) : proposals.length === 0 ? (
                      <p className="text-text-secondary text-sm">{t('proposeTime.noProposals')}</p>
                    ) : (
                      <div className="space-y-3">
                        {proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className={`p-4 border rounded-lg ${
                              proposal.status === 'pending'
                                ? 'border-yellow-200 bg-yellow-50'
                                : proposal.status === 'accepted'
                                ? 'border-green-200 bg-green-50'
                                : proposal.status === 'declined'
                                ? 'border-red-200 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {new Date(proposal.date).toLocaleDateString(locale, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                                <p className="text-text-secondary text-sm">
                                  {formatTime(proposal.start_time)} - {formatTime(proposal.end_time)} EST
                                </p>
                                {proposal.location && (
                                  <p className="text-text-muted text-xs mt-1">{proposal.location}</p>
                                )}
                                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                                  proposal.status === 'pending'
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : proposal.status === 'accepted'
                                    ? 'bg-green-200 text-green-800'
                                    : proposal.status === 'declined'
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-gray-200 text-gray-800'
                                }`}>
                                  {t(`proposeTime.status.${proposal.status}`)}
                                </span>
                                {proposal.status === 'declined' && proposal.decline_reason && (
                                  <p className="text-red-600 text-xs mt-1">{proposal.decline_reason}</p>
                                )}
                                {proposal.status === 'accepted' && proposal.accepter && (
                                  <p className="text-green-600 text-xs mt-1">
                                    {t('proposeTime.acceptedBy', {
                                      name: `${proposal.accepter.first_name || ''} ${proposal.accepter.last_name || ''}`.trim() || proposal.accepter.email,
                                    })}
                                  </p>
                                )}
                              </div>
                              {proposal.status === 'pending' && !isFrozen && (
                                <button
                                  onClick={() => handleCancelProposal(proposal.id)}
                                  disabled={cancellingProposalId === proposal.id}
                                  className="text-sm text-red-600 hover:text-red-700"
                                >
                                  {cancellingProposalId === proposal.id ? '...' : t('proposeTime.cancel')}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Assign Tab - Section Management */}
          {activeTab === 'assign' && (
            <div>
              {/* Time Slot Assignment UI - Above Section Management */}
              {sections.length > 0 && bookedTimes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-2">{t('assign.timeSlots.title')}</h3>
                  <p className="text-text-secondary text-sm mb-4">
                    {t('assign.timeSlots.description')}
                  </p>

                  {/* Unassigned sections warning */}
                  {(() => {
                    const allAssignedSections = new Set();
                    bookedTimes.forEach(bt => {
                      const assignments = timeAssignments[bt.id] || {};
                      Object.values(assignments).forEach(sectionName => {
                        if (sectionName) allAssignedSections.add(sectionName);
                      });
                    });
                    const unassigned = sections.filter(s => !allAssignedSections.has(s));

                    if (unassigned.length > 0) {
                      return (
                        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">{t('assign.timeSlots.unassignedSections')}:</span>{' '}
                            {unassigned.join(', ')}
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

                  {/* Assignment grid for each booked time */}
                  <div className="space-y-4">
                    {bookedTimes.map((bookedTime) => (
                      <div key={bookedTime.id} className="bg-white border border-border rounded-lg p-6">
                        {/* Date/Time header with assignment message */}
                        <div className="mb-4 flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium">
                              {new Date(bookedTime.date).toLocaleDateString(locale, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-text-secondary text-sm">
                              {formatTime(bookedTime.start_time)} - {formatTime(bookedTime.end_time)} EST
                            </p>
                          </div>
                          {/* Assignment saved message - right of date */}
                          {sectionsMessage.text && (
                            <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                              sectionsMessage.type === 'success'
                                ? 'text-green-700 bg-green-50'
                                : 'text-red-700 bg-red-50'
                            }`}>
                              {sectionsMessage.text}
                            </span>
                          )}
                        </div>

                        {/* Slot grid */}
                        {assignmentsLoading ? (
                          <p className="text-text-muted text-sm">Loading...</p>
                        ) : (
                          <div className="space-y-2">
                            {/* Header row */}
                            <div className="grid grid-cols-[120px_1fr] gap-2 text-xs font-medium text-text-muted uppercase mb-2">
                              <span>{t('assign.timeSlots.slot')}</span>
                              <span>{t('assign.timeSlots.section')}</span>
                            </div>

                            {/* Slot rows */}
                            {generateTimeSlots(bookedTime.start_time, bookedTime.end_time).map((slot) => {
                              const slotKey = `${slot.start}-${slot.end}`;
                              const currentAssignment = timeAssignments[bookedTime.id]?.[slotKey] || '';
                              const isSaving = savingSlot === `${bookedTime.id}-${slotKey}`;

                              return (
                                <div key={slotKey} className="grid grid-cols-[120px_1fr] gap-2 items-center">
                                  <span className="text-sm font-medium">
                                    {formatTimeUtil(slot.start)} - {formatTimeUtil(slot.end)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={currentAssignment}
                                      onChange={(e) => handleAssignSection(
                                        bookedTime.id,
                                        slot.start,
                                        slot.end,
                                        e.target.value
                                      )}
                                      disabled={isSaving}
                                      className="flex-1 px-3 py-1.5 border border-border rounded text-sm disabled:opacity-50"
                                    >
                                      <option value="">{t('assign.timeSlots.notAssigned')}</option>
                                      {sections.map((section) => (
                                        <option key={section} value={section}>{section}</option>
                                      ))}
                                    </select>
                                    {isSaving && <span className="text-xs text-text-muted">{t('assign.timeSlots.saving')}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Management - Below Time Slot Assignment */}
              <div className={sections.length > 0 && bookedTimes.length > 0 ? 'mt-8' : ''}>
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
                    {addingSection ? t('assign.adding') : t('assign.addSection')}
                  </button>
                </form>

                {imageMessage.text && (
                  <div className={`mb-4 p-4 rounded ${
                    imageMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {imageMessage.text}
                  </div>
                )}

                {/* Sections List - Compact */}
                {sectionsLoading ? (
                  <p className="text-text-secondary">Loading...</p>
                ) : sections.length === 0 ? (
                  <p className="text-text-secondary">{t('assign.noSections')}</p>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section) => {
                      const memberCount = manualMembers.filter(m => m.section_name === section).length;
                      return (
                        <div
                          key={section}
                          className="px-4 py-3 border border-border rounded-lg space-y-2"
                        >
                          <div className="flex justify-between items-center gap-4">
                            <span className="font-medium">{section}</span>
                            <span className="text-sm text-text-muted">
                              {t('assign.memberCount', { count: memberCount })}
                            </span>
                            <button
                              onClick={() => handleRemoveSection(section)}
                              disabled={removingSectionName === section}
                              className="text-sm text-red-600 hover:text-red-700 whitespace-nowrap ml-auto"
                            >
                              {removingSectionName === section ? t('assign.removing') : t('assign.removeSection')}
                            </button>
                          </div>
                          <ImageUpload
                            imageUrl={livingGroup?.section_images?.[section] || null}
                            label={t('assign.sectionImage')}
                            fileName={`${(livingGroup?.name || '').replace(/\s+/g, '_')}_${section.replace(/\s+/g, '_')}_Candid`}
                            disabled={isFrozen}
                            onUpload={async (file) => {
                              setImageMessage({ type: '', text: '' });
                              const fd = new FormData();
                              fd.append('file', file);
                              fd.append('section_name', section);
                              const res = await fetch('/api/living-groups/images', { method: 'POST', body: fd });
                              const data = await res.json();
                              if (!res.ok) {
                                setImageMessage({ type: 'error', text: data.error || 'Upload failed' });
                                throw new Error(data.error || 'Upload failed');
                              }
                              return data.url;
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
                      value={singleMember.firstName}
                      onChange={(e) => setSingleMember({ ...singleMember, firstName: e.target.value })}
                      placeholder={t('members.firstNamePlaceholder')}
                      className="flex-1 min-w-[150px] border border-border rounded px-4 py-2"
                    />
                    <input
                      type="text"
                      value={singleMember.lastName}
                      onChange={(e) => setSingleMember({ ...singleMember, lastName: e.target.value })}
                      placeholder={t('members.lastNamePlaceholder')}
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
                      disabled={addingMember || !singleMember.lastName.trim()}
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
                                {name.lastName}, {name.firstName || '(no first name)'}
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

              {/* Members List - grouped by section if sections exist */}
              {membersLoading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : manualMembers.length === 0 ? (
                <p className="text-text-secondary">{t('members.noMembers')}</p>
              ) : sections.length > 0 ? (
                // Show members grouped by section (sections first, then unassigned)
                <div className="space-y-6">
                  {/* Members by section */}
                  {sections.map((section) => {
                    const sectionMembers = manualMembers.filter(m => m.section_name === section);
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
                              <p className="flex-1">
                                {member.last_name}, {member.first_name || '(no first name)'}
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
                    const unassigned = manualMembers.filter(m => !m.section_name);
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
                              <p className="flex-1">
                                {member.last_name}, {member.first_name || '(no first name)'}
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
                  {manualMembers.map((member) => (
                    <div
                      key={member.id}
                      className="px-4 border border-border rounded-lg flex justify-between items-center"
                    >
                      <p>
                        {member.last_name}, {member.first_name || '(no first name)'}
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
                        {memberToRemove.last_name}, {memberToRemove.first_name || '(no first name)'}
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
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
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
                    {savingDocuments ? t('documents.saving') : t('documents.save')}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              {/* Email Section */}
              <div className="mb-6">
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
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
