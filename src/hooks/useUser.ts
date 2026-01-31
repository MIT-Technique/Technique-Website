'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Club, LivingGroup, Sports, FormSetting } from '../lib/supabase/types';

interface SessionData {
  isLoggedIn: boolean;
  user: User | null;
  club?: Club | null;
  livingGroup?: LivingGroup | null;
  sports?: Sports | null;
  frozenForms?: FormSetting[];
}

export function useUser() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/session');

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();
      setSession(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to fetch session');
      setSession({ isLoggedIn: false, user: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession({ isLoggedIn: false, user: null });
      window.location.href = '/';
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    isLoggedIn: session?.isLoggedIn ?? false,
    user: session?.user ?? null,
    club: session?.club ?? null,
    livingGroup: session?.livingGroup ?? null,
    sports: session?.sports ?? null,
    frozenForms: session?.frozenForms ?? [],
    loading,
    error,
    logout,
    refetch,
  };
}

export function useFormFrozen(formName: string) {
  const { frozenForms, loading } = useUser();

  const isFrozen = frozenForms.some(
    (form) => form.form_name === formName && form.is_frozen
  );

  return { isFrozen, loading };
}
