'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';
import PhotographerTimesSection from '../../../components/PhotographerTimesSection/PhotographerTimesSection';
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import { Button } from "@mui/material";

// Strip seconds from time string (HH:MM:SS -> HH:MM)
function formatTime(time) {
  if (!time) return '';
  return time.slice(0, 5);
}

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

  // Auto-fade success messages after 4 seconds
  useEffect(() => {
    if (bioMessage.type === 'success' && bioMessage.text) {
      const timer = setTimeout(() => setBioMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [bioMessage]);

  useEffect(() => {
    if (clubMessage.type === 'success' && clubMessage.text) {
      const timer = setTimeout(() => setClubMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [clubMessage]);

  useEffect(() => {
    if (schedulingMessage.type === 'success' && schedulingMessage.text) {
      const timer = setTimeout(() => setSchedulingMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [schedulingMessage]);

  // Fetch bio data for students
  useEffect(() => {
    if (isLoggedIn && user?.role === 'staph') {
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

  // Fetch scheduling data for living group accounts
  useEffect(() => {
    if (isLoggedIn && user?.role === 'living_group') {
      fetchSchedulingData();
    }
  }, [isLoggedIn, user]);

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

    // Staph users get Staph Tools tab right after Profile
    if (user?.is_staph) {
      tabs.push({ id: 'photographerTools', label: t('tabs.photographerTools') });
    }

    if (user?.role === 'club') {
      tabs.push({ id: 'club', label: t('tabs.clubInfo') });
    } else if (user?.role === 'living_group') {
      tabs.push({ id: 'scheduling', label: t('tabs.scheduling') });
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
                    <span className="capitalize">
                      {user?.role === 'admin' ? 'Admin' : user?.role === 'staph' ? 'Staph' : user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Information Section */}
              {user?.role === 'staph' && (
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
              {user?.role === 'staph' && (
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

          {/* Scheduling Tab (Living Group Accounts) */}
          {activeTab === 'scheduling' && user?.role === 'living_group' && (
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
                      {formatTime(bookedTime.start_time)} - {formatTime(bookedTime.end_time)} EST
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
                              {formatTime(time.start_time)} - {formatTime(time.end_time)} EST
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

          {/* Staph Tools Tab - for staph users */}
          {activeTab === 'photographerTools' && user?.is_staph && (
            <PhotographerTimesSection />
          )}

        </section>
      </main>
      <Footer />
    </>
  );
}
