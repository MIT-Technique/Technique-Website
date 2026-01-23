'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import { Button } from "@mui/material";

// MUI styling
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#E5E5E5" },
    "&:hover fieldset": { borderColor: "#D0D0D0" },
    "&.Mui-focused fieldset": { borderColor: "#750014" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#750014" },
};

const selectSx = {
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E5E5" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D0D0" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#750014" },
};

export default function ProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('pages.profile');
  const { isLoggedIn, user, club, livingGroup, loading: userLoading, refetch } = useUser();

  // Tab state
  const [activeTab, setActiveTab] = useState('profile');

  // Bio form state
  const [bioData, setBioData] = useState({
    firstName: '',
    lastName: '',
    major: '',
    secondMajor: 'None',
  });
  const [bioLoading, setBioLoading] = useState(true);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioMessage, setBioMessage] = useState({ type: '', text: '' });

  // Club form state
  const [clubData, setClubData] = useState({
    name: '',
    description: '',
    memberList: '',
  });
  const [clubSaving, setClubSaving] = useState(false);
  const [clubMessage, setClubMessage] = useState({ type: '', text: '' });

  // Scheduling state
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTime, setBookedTime] = useState(null);
  const [schedulingLoading, setSchedulingLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingLocation, setBookingLocation] = useState('');
  const [schedulingMessage, setSchedulingMessage] = useState({ type: '', text: '' });

  // My Clubs state
  const [myMemberships, setMyMemberships] = useState([]);
  const [myPendingRequests, setMyPendingRequests] = useState([]);
  const [myInvitations, setMyInvitations] = useState([]);
  const [clubSearch, setClubSearch] = useState('');
  const [clubSearchResults, setClubSearchResults] = useState([]);
  const [clubSearchLoading, setClubSearchLoading] = useState(false);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsMessage, setClubsMessage] = useState({ type: '', text: '' });
  const [joiningClubId, setJoiningClubId] = useState(null);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);
  const [processingInvitationId, setProcessingInvitationId] = useState(null);

  // Staph request state
  const [staphRequestPending, setStaphRequestPending] = useState(false);
  const [staphRequestSubmitting, setStaphRequestSubmitting] = useState(false);

  // Redirect admin to dashboard
  useEffect(() => {
    if (!userLoading && isLoggedIn && user?.role === 'admin') {
      router.push(`/${locale}/dashboard`);
    }
  }, [isLoggedIn, user, userLoading, router, locale]);

  // Redirect non-logged-in users to login
  useEffect(() => {
    if (!userLoading && !isLoggedIn) {
      router.push(`/${locale}/login`);
    }
  }, [isLoggedIn, userLoading, router, locale]);

  // Fetch bio data for students
  useEffect(() => {
    if (isLoggedIn && user?.role === 'student') {
      fetchBioData();
    }
  }, [isLoggedIn, user]);

  // Load club data
  useEffect(() => {
    if (club) {
      setClubData({
        name: club.name || '',
        description: club.description || '',
        memberList: club.member_list || '',
      });
    }
  }, [club]);

  // Fetch scheduling data for living group leaders
  useEffect(() => {
    if (isLoggedIn && user?.role === 'living_group_leader') {
      fetchSchedulingData();
    }
  }, [isLoggedIn, user]);

  // Fetch my clubs data for students and living group leaders
  useEffect(() => {
    if (isLoggedIn && (user?.role === 'student' || user?.role === 'living_group_leader')) {
      fetchMyClubsData();
    }
  }, [isLoggedIn, user]);

  // Check for pending staph request for students
  useEffect(() => {
    if (isLoggedIn && user?.role === 'student') {
      checkStaphRequest();
    }
  }, [isLoggedIn, user]);

  async function checkStaphRequest() {
    try {
      const res = await fetch('/api/user/request-promotion');
      const data = await res.json();
      const pendingStaphRequest = (data.requests || []).find(
        r => r.request_type === 'staph_request' && r.status === 'pending'
      );
      setStaphRequestPending(!!pendingStaphRequest);
    } catch (error) {
      console.error('Error checking staph request:', error);
    }
  }

  async function handleStaphRequest() {
    setStaphRequestSubmitting(true);
    try {
      const res = await fetch('/api/user/request-promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_type: 'staph_request' }),
      });
      if (res.ok) {
        setStaphRequestPending(true);
      } else {
        const data = await res.json();
        console.error('Error submitting staph request:', data.error);
      }
    } catch (error) {
      console.error('Error submitting staph request:', error);
    } finally {
      setStaphRequestSubmitting(false);
    }
  }

  async function fetchBioData() {
    try {
      setBioLoading(true);
      const res = await fetch('/api/bio');
      const data = await res.json();
      if (data.data) {
        setBioData({
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || '',
          major: data.data.major || '',
          secondMajor: data.data.second_major || 'None',
        });
      }
    } catch (error) {
      console.error('Error fetching bio:', error);
    } finally {
      setBioLoading(false);
    }
  }

  async function fetchSchedulingData() {
    try {
      setSchedulingLoading(true);
      const res = await fetch('/api/living-groups/times');
      const data = await res.json();
      setAvailableTimes(data.availableTimes || []);
      setBookedTime(data.bookedTime || null);
    } catch (error) {
      console.error('Error fetching times:', error);
    } finally {
      setSchedulingLoading(false);
    }
  }

  async function fetchMyClubsData() {
    try {
      setClubsLoading(true);
      const [membershipsRes, requestsRes, invitationsRes] = await Promise.all([
        fetch('/api/clubs/my-memberships'),
        fetch('/api/clubs/my-requests'),
        fetch('/api/clubs/my-invitations'),
      ]);
      const membershipsData = await membershipsRes.json();
      const requestsData = await requestsRes.json();
      const invitationsData = await invitationsRes.json();
      setMyMemberships(membershipsData.memberships || []);
      setMyPendingRequests(requestsData.requests || []);
      setMyInvitations(invitationsData.invitations || []);
    } catch (error) {
      console.error('Error fetching clubs data:', error);
    } finally {
      setClubsLoading(false);
    }
  }

  async function searchClubs(query) {
    if (!query || query.length < 2) {
      setClubSearchResults([]);
      return;
    }
    try {
      setClubSearchLoading(true);
      const res = await fetch(`/api/clubs/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      // Filter out clubs user is already a member of or has pending request
      const memberClubIds = new Set(myMemberships.map(m => m.club_id));
      const pendingClubIds = new Set(myPendingRequests.map(r => r.club_id));
      const filteredClubs = (data.clubs || []).filter(
        c => !memberClubIds.has(c.id) && !pendingClubIds.has(c.id)
      );
      setClubSearchResults(filteredClubs);
    } catch (error) {
      console.error('Error searching clubs:', error);
    } finally {
      setClubSearchLoading(false);
    }
  }

  async function handleJoinClub(clubId) {
    setJoiningClubId(clubId);
    setClubsMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/clubs/join-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: clubId }),
      });
      const data = await res.json();
      if (res.ok) {
        setClubsMessage({ type: 'success', text: t('myClubs.requestSent', { club: data.club_name }) });
        setClubSearch('');
        setClubSearchResults([]);
        fetchMyClubsData();
      } else {
        setClubsMessage({ type: 'error', text: data.error || t('myClubs.requestError') });
      }
    } catch (error) {
      setClubsMessage({ type: 'error', text: t('myClubs.requestError') });
    } finally {
      setJoiningClubId(null);
    }
  }

  async function handleCancelRequest(requestId) {
    setCancellingRequestId(requestId);
    setClubsMessage({ type: '', text: '' });
    try {
      const res = await fetch(`/api/clubs/join-request?id=${requestId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setClubsMessage({ type: 'success', text: t('myClubs.requestCancelled') });
        fetchMyClubsData();
      } else {
        const data = await res.json();
        setClubsMessage({ type: 'error', text: data.error || t('myClubs.cancelError') });
      }
    } catch (error) {
      setClubsMessage({ type: 'error', text: t('myClubs.cancelError') });
    } finally {
      setCancellingRequestId(null);
    }
  }

  async function handleInvitationResponse(invitationId, action) {
    setProcessingInvitationId(invitationId);
    setClubsMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/clubs/my-invitations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitation_id: invitationId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setClubsMessage({
          type: 'success',
          text: action === 'accept' ? t('myClubs.invitations.accepted') : t('myClubs.invitations.declined'),
        });
        fetchMyClubsData();
      } else {
        setClubsMessage({ type: 'error', text: data.error || t('myClubs.invitations.error') });
      }
    } catch (error) {
      setClubsMessage({ type: 'error', text: t('myClubs.invitations.error') });
    } finally {
      setProcessingInvitationId(null);
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchClubs(clubSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [clubSearch, myMemberships, myPendingRequests]);

  async function handleBioSubmit(e) {
    e.preventDefault();
    setBioSaving(true);
    setBioMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/bio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: bioData.firstName,
          lastName: bioData.lastName,
          major: bioData.major,
          second_major: bioData.secondMajor === 'None' ? '' : bioData.secondMajor,
        }),
      });

      if (res.ok) {
        setBioMessage({ type: 'success', text: t('studentInfo.success') });
        refetch();
      } else {
        setBioMessage({ type: 'error', text: t('studentInfo.error') });
      }
    } catch (error) {
      setBioMessage({ type: 'error', text: t('studentInfo.error') });
    } finally {
      setBioSaving(false);
    }
  }

  async function handleClubSubmit(e) {
    e.preventDefault();
    setClubSaving(true);
    setClubMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/clubs/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clubData),
      });

      if (res.ok) {
        setClubMessage({ type: 'success', text: t('club.success') });
        refetch();
      } else {
        setClubMessage({ type: 'error', text: t('club.error') });
      }
    } catch (error) {
      setClubMessage({ type: 'error', text: t('club.error') });
    } finally {
      setClubSaving(false);
    }
  }

  async function handleBookTime(timeId) {
    setBooking(true);
    setSchedulingMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeId, location: bookingLocation }),
      });

      if (res.ok) {
        setSchedulingMessage({ type: 'success', text: t('scheduling.bookSuccess') });
        setBookingLocation('');
        fetchSchedulingData();
        refetch();
      } else {
        const data = await res.json();
        setSchedulingMessage({ type: 'error', text: data.error || t('scheduling.bookError') });
      }
    } catch (error) {
      setSchedulingMessage({ type: 'error', text: t('scheduling.bookError') });
    } finally {
      setBooking(false);
    }
  }

  // Get available tabs based on role
  function getTabs() {
    const tabs = [{ id: 'profile', label: t('tabs.profile') }];

    if (user?.role === 'student') {
      tabs.push({ id: 'myClubs', label: t('tabs.myClubs') });
    } else if (user?.role === 'club') {
      tabs.push({ id: 'club', label: t('tabs.clubInfo') });
    } else if (user?.role === 'living_group_leader') {
      tabs.push({ id: 'scheduling', label: t('tabs.scheduling') });
      tabs.push({ id: 'myClubs', label: t('tabs.myClubs') });
    }

    return tabs;
  }

  const majors = [
    "1", "1-12", "1-ENG", "2", "2A", "2-OE", "3", "3-A", "3-C", "4", "4-B",
    "5", "5-7", "6-1", "6-2", "6-3", "6-3A", "6-4", "6-5", "6-7", "6-9", "6-14", "6-P",
    "7", "8", "9", "10", "10-B", "10-C", "10-ENG", "11", "11-6", "12",
    "14-1", "14-2", "15-1", "15-2", "15-3", "16", "16-ENG", "17", "17-M",
    "18", "18-C", "21", "21A", "21-CMS", "21E", "21G", "21L", "21H", "21M", "21T", "21S", "21W",
    "20", "22", "22-ENG", "24", "24-1", "24-2", "STS",
  ];

  if (userLoading) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32">
        <div className="container-text text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  // Admin redirects to dashboard
  if (user?.role === 'admin') {
    return null;
  }

  const tabs = getTabs();

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32 pb-12">
        <section className="container-text">
          <h1 className="mb-2">{t('title')}</h1>
          <p className="text-text-secondary mb-8">
            {t('welcome', { email: user?.email })}
          </p>

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
            <div className="space-y-6">
              {/* Account Information */}
              <div className="card-elevated p-6">
                <h2 className="text-lg font-medium mb-4">{t('profile.title')}</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('profile.email')}</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('profile.role')}</span>
                    <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Staph request for students - small and unobtrusive */}
                {user?.role === 'student' && (
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <p className="text-xs text-text-muted">
                      {t('promotion.staphTitle')}{' '}
                      {staphRequestPending ? (
                        <span className="text-yellow-600">{t('promotion.requestPending')}</span>
                      ) : (
                        <button
                          onClick={handleStaphRequest}
                          disabled={staphRequestSubmitting}
                          className="text-accent hover:underline disabled:opacity-50"
                        >
                          {staphRequestSubmitting ? '...' : t('promotion.staphRequestButton')}
                        </button>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Student Information Section */}
              {user?.role === 'student' && (
                <div className="card-elevated p-6">
                  <h2 className="text-lg font-medium mb-4">{t('studentInfo.title')}</h2>
                  <p className="text-sm text-text-secondary mb-4">{t('studentInfo.description')}</p>

                  {bioLoading ? (
                    <p className="text-text-secondary">Loading...</p>
                  ) : (
                    <form onSubmit={handleBioSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <TextField
                          required
                          label={t('studentInfo.firstName')}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          value={bioData.firstName}
                          onChange={(e) => setBioData({ ...bioData, firstName: e.target.value })}
                          sx={textFieldSx}
                        />
                        <TextField
                          required
                          label={t('studentInfo.lastName')}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                          value={bioData.lastName}
                          onChange={(e) => setBioData({ ...bioData, lastName: e.target.value })}
                          sx={textFieldSx}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormControl fullWidth>
                          <InputLabel shrink sx={{ "&.Mui-focused": { color: "#750014" } }}>
                            {t('studentInfo.major')} *
                          </InputLabel>
                          <Select
                            value={bioData.major}
                            label={`${t('studentInfo.major')} *`}
                            notched
                            required
                            onChange={(e) => setBioData({ ...bioData, major: e.target.value })}
                            sx={selectSx}
                          >
                            {majors.map((m) => (
                              <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth>
                          <InputLabel shrink sx={{ "&.Mui-focused": { color: "#750014" } }}>
                            {t('studentInfo.secondMajor')}
                          </InputLabel>
                          <Select
                            value={bioData.secondMajor}
                            label={t('studentInfo.secondMajor')}
                            notched
                            onChange={(e) => setBioData({ ...bioData, secondMajor: e.target.value })}
                            sx={selectSx}
                          >
                            <MenuItem value="None">{t('studentInfo.none')}</MenuItem>
                            {majors.map((m) => (
                              <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>

                      {bioMessage.text && (
                        <div className={`p-4 rounded ${
                          bioMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {bioMessage.text}
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={bioSaving}
                        fullWidth
                        sx={{
                          backgroundColor: "#750014",
                          "&:hover": { backgroundColor: "#5C0010" },
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 500,
                          py: 1.5,
                          boxShadow: "none",
                        }}
                      >
                        {bioSaving ? t('studentInfo.saving') : t('studentInfo.save')}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Senior Bio CTA - compact, lower priority */}
              {user?.role === 'student' && (
                <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary/50 rounded-lg">
                  <span className="text-sm text-text-secondary">{t('studentInfo.seniorBioTitle')}</span>
                  <button
                    onClick={() => router.push(`/${locale}/bio`)}
                    className="text-sm text-accent hover:underline"
                  >
                    {t('studentInfo.completeSeniorBio')} →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Club Info Tab (Clubs) */}
          {activeTab === 'club' && user?.role === 'club' && (
            <div>
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
                    {t('club.status')}: {t(`club.statusValues.${club.approval_status}`)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {t('club.clubId')}: {club.club_id}
                  </p>
                </div>
              )}

              <form onSubmit={handleClubSubmit} className="card-elevated p-6 space-y-4">
                <TextField
                  required
                  label={t('club.name')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={clubData.name}
                  onChange={(e) => setClubData({ ...clubData, name: e.target.value })}
                  sx={textFieldSx}
                  fullWidth
                />

                <TextField
                  label={t('club.description')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={clubData.description}
                  onChange={(e) => setClubData({ ...clubData, description: e.target.value })}
                  multiline
                  minRows={3}
                  sx={textFieldSx}
                  fullWidth
                />

                <TextField
                  label={t('club.memberList')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={clubData.memberList}
                  onChange={(e) => setClubData({ ...clubData, memberList: e.target.value })}
                  multiline
                  minRows={4}
                  sx={textFieldSx}
                  fullWidth
                  placeholder={t('club.memberListPlaceholder')}
                />

                {clubMessage.text && (
                  <div className={`p-4 rounded ${
                    clubMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {clubMessage.text}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={clubSaving}
                  fullWidth
                  sx={{
                    backgroundColor: "#750014",
                    "&:hover": { backgroundColor: "#5C0010" },
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 500,
                    py: 1.5,
                    boxShadow: "none",
                  }}
                >
                  {clubSaving ? t('club.saving') : t('club.save')}
                </Button>
              </form>
            </div>
          )}

          {/* Scheduling Tab (Living Group Leaders) */}
          {activeTab === 'scheduling' && user?.role === 'living_group_leader' && (
            <div>
              {/* Living group info */}
              {livingGroup && (
                <div className={`mb-6 p-4 rounded-lg ${
                  livingGroup.status === 'active'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="font-medium">{livingGroup.name}</p>
                  <p className="text-sm text-text-secondary capitalize">
                    {t('scheduling.status')}: {livingGroup.status}
                  </p>
                </div>
              )}

              {schedulingMessage.text && (
                <div className={`mb-6 p-4 rounded ${
                  schedulingMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {schedulingMessage.text}
                </div>
              )}

              {/* Current Booking */}
              {bookedTime && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">{t('scheduling.currentBooking')}</h2>
                  <div className={`p-4 border rounded-lg ${
                    bookedTime.cancellation_requested
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-green-200 bg-green-50'
                  }`}>
                    <p className="font-medium">
                      {new Date(bookedTime.date).toLocaleDateString(locale, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-text-secondary">
                      {bookedTime.start_time} - {bookedTime.end_time}
                    </p>
                    {bookedTime.location && (
                      <p className="text-text-secondary text-sm mt-1">
                        {t('scheduling.location')}: {bookedTime.location}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Available Times */}
              {!bookedTime && livingGroup?.status === 'active' && (
                <div>
                  <h2 className="text-lg font-medium mb-4">{t('scheduling.availableTimes')}</h2>

                  {/* Location input */}
                  <div className="mb-4">
                    <TextField
                      label={t('scheduling.location')}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      value={bookingLocation}
                      onChange={(e) => setBookingLocation(e.target.value)}
                      sx={textFieldSx}
                      fullWidth
                      placeholder={t('scheduling.locationPlaceholder')}
                      helperText={t('scheduling.locationHint')}
                    />
                  </div>

                  {schedulingLoading ? (
                    <p className="text-text-secondary">Loading...</p>
                  ) : availableTimes.length === 0 ? (
                    <p className="text-text-secondary">{t('scheduling.noTimes')}</p>
                  ) : (
                    <div className="space-y-3">
                      {availableTimes.map((time) => (
                        <div
                          key={time.id}
                          className="p-4 border border-border rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {new Date(time.date).toLocaleDateString(locale, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-text-secondary text-sm">
                              {time.start_time} - {time.end_time}
                            </p>
                          </div>
                          <button
                            onClick={() => handleBookTime(time.id)}
                            disabled={booking}
                            className="btn-primary text-sm"
                          >
                            {booking ? t('scheduling.booking') : t('scheduling.book')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* My Clubs Tab (Students and Living Group Leaders) */}
          {activeTab === 'myClubs' && (user?.role === 'student' || user?.role === 'living_group_leader') && (
            <div>
              {clubsMessage.text && (
                <div className={`mb-6 p-4 rounded ${
                  clubsMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {clubsMessage.text}
                </div>
              )}

              {/* Search for clubs */}
              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">{t('myClubs.searchTitle')}</h2>
                <TextField
                  label={t('myClubs.searchPlaceholder')}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  value={clubSearch}
                  onChange={(e) => setClubSearch(e.target.value)}
                  sx={textFieldSx}
                  fullWidth
                  placeholder={t('myClubs.searchHint')}
                />

                {/* Search results */}
                {clubSearchLoading ? (
                  <p className="text-text-secondary mt-4">Loading...</p>
                ) : clubSearchResults.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {clubSearchResults.map((club) => (
                      <div
                        key={club.id}
                        className="p-4 border border-border rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{club.name}</p>
                          {club.description && (
                            <p className="text-text-secondary text-sm line-clamp-1">{club.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleJoinClub(club.id)}
                          disabled={joiningClubId === club.id}
                          className="btn-primary text-sm"
                        >
                          {joiningClubId === club.id ? t('myClubs.requesting') : t('myClubs.requestJoin')}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : clubSearch.length >= 2 ? (
                  <p className="text-text-secondary mt-4">{t('myClubs.noResults')}</p>
                ) : null}
              </div>

              {/* Club Invitations */}
              {myInvitations.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">{t('myClubs.invitations.title')}</h2>
                  <div className="space-y-2">
                    {myInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="p-4 border border-blue-200 bg-blue-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{invitation.club?.name || 'Unknown Club'}</p>
                            {invitation.club?.description && (
                              <p className="text-text-secondary text-sm line-clamp-1">{invitation.club.description}</p>
                            )}
                            <p className="text-text-muted text-xs mt-1">
                              {t('myClubs.invitations.invitedBy', {
                                name: `${invitation.inviter?.first_name || ''} ${invitation.inviter?.last_name || ''}`.trim() || 'Unknown',
                              })}
                              {' • '}
                              {t('myClubs.invitations.invitedOn', {
                                date: new Date(invitation.created_at).toLocaleDateString(locale),
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                              disabled={processingInvitationId === invitation.id}
                              className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              {processingInvitationId === invitation.id ? '...' : t('myClubs.invitations.accept')}
                            </button>
                            <button
                              onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                              disabled={processingInvitationId === invitation.id}
                              className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              {processingInvitationId === invitation.id ? '...' : t('myClubs.invitations.decline')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending requests */}
              {myPendingRequests.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium mb-4">{t('myClubs.pendingRequests')}</h2>
                  <div className="space-y-2">
                    {myPendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{request.club?.name || 'Unknown Club'}</p>
                          <p className="text-text-secondary text-sm">
                            {t('myClubs.requestedOn', {
                              date: new Date(request.created_at).toLocaleDateString(locale),
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancellingRequestId === request.id}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          {cancellingRequestId === request.id ? t('myClubs.cancelling') : t('myClubs.cancel')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My memberships */}
              <div>
                <h2 className="text-lg font-medium mb-4">{t('myClubs.memberships')}</h2>
                {clubsLoading ? (
                  <p className="text-text-secondary">Loading...</p>
                ) : myMemberships.length === 0 ? (
                  <p className="text-text-secondary">{t('myClubs.noMemberships')}</p>
                ) : (
                  <div className="space-y-2">
                    {myMemberships.map((membership) => (
                      <div
                        key={membership.id}
                        className="p-4 border border-green-200 bg-green-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{membership.club?.name || 'Unknown Club'}</p>
                            {membership.club?.description && (
                              <p className="text-text-secondary text-sm line-clamp-2">{membership.club.description}</p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            membership.role === 'leader'
                              ? 'bg-accent text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {membership.role === 'leader' ? t('myClubs.leader') : t('myClubs.member')}
                          </span>
                        </div>
                        <p className="text-text-muted text-xs mt-2">
                          {t('myClubs.joinedOn', {
                            date: new Date(membership.joined_at).toLocaleDateString(locale),
                          })}
                        </p>
                      </div>
                    ))}
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
