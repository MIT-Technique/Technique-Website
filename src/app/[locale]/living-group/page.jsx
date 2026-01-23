'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '../../../hooks/useUser';
import Footer from '../../../components/Footer/Footer';

export default function LivingGroupPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('livingGroupPage');
  const { isLoggedIn, user, livingGroup, loading: userLoading, refetch } = useUser();
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTime, setBookedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    if (!userLoading && (!isLoggedIn || user?.role !== 'living_group_leader')) {
      router.push(`/${locale}/login`);
    }
  }, [isLoggedIn, user, userLoading, router, locale]);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'living_group_leader') {
      fetchTimes();
      checkFrozen();
    }
  }, [isLoggedIn, user]);

  async function fetchTimes() {
    try {
      setLoading(true);
      const res = await fetch('/api/living-groups/times');
      const data = await res.json();
      setAvailableTimes(data.availableTimes || []);
      setBookedTime(data.bookedTime || null);
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

  async function handleCancelRequest() {
    if (isFrozen) return;

    const reason = prompt(t('cancelReason'));
    if (reason === null) return;

    setCancelling(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/living-groups/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
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

  if (userLoading) {
    return (
      <main className="min-h-screen pt-24 lg:pt-32">
        <div className="container-text text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn || user?.role !== 'living_group_leader') {
    return null;
  }

  // Check if disabled
  const isDisabled = livingGroup?.status === 'disabled';

  return (
    <>
      <main className="min-h-screen pt-24 lg:pt-32 pb-12">
        <section className="container-text">
          <h1 className="mb-4">{t('title')}</h1>
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
          {isFrozen && !isDisabled && (
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

          {/* Current Booking */}
          {bookedTime && (
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">{t('currentBooking')}</h2>
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
                {bookedTime.cancellation_requested && (
                  <p className="text-yellow-600 text-sm mt-2">{t('cancellationPending')}</p>
                )}
                {!bookedTime.cancellation_requested && !isDisabled && !isFrozen && (
                  <button
                    onClick={handleCancelRequest}
                    disabled={cancelling}
                    className="mt-4 px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    {cancelling ? t('requesting') : t('requestCancel')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Available Times */}
          {!bookedTime && !isDisabled && (
            <div>
              <h2 className="text-lg font-medium mb-4">{t('availableTimes')}</h2>
              {loading ? (
                <p className="text-text-secondary">Loading...</p>
              ) : availableTimes.length === 0 ? (
                <p className="text-text-secondary">{t('noTimes')}</p>
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
                        onClick={() => handleBook(time.id)}
                        disabled={booking || isFrozen}
                        className="btn-primary text-sm"
                      >
                        {booking ? t('booking') : t('book')}
                      </button>
                    </div>
                  ))}
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
