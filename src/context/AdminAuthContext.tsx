import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured, type User } from '../services/supabase';
import {
  signInWithEmail as _signInWithEmail,
  signInWithGoogle as _signInWithGoogle,
  signOut as _signOut,
  fetchAdminUser,
} from '../services/auth';
import type { AdminUser, AdminRole } from '../types/admin';

interface AdminAuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  role: AdminRole | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async (userId: string) => {
    try {
      const admin = await fetchAdminUser(userId);
      setAdminUser(admin);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Verbose diagnostics so DevTools can show exactly which
    // bootstrap step hangs the spinner. Tag with timestamps so
    // user can paste them back to diagnose.
    const t0 = Date.now();
    const log = (msg: string, extra?: unknown) =>
      console.log(`[AdminAuth +${Date.now() - t0}ms] ${msg}`, extra ?? '');
    log('Bootstrap started');

    // Safety net at 8s. If anything hangs (getSession itself,
    // fetchAdminUser without timeout firing, React not re-rendering),
    // force loading=false so AdminProtectedRoute can either redirect
    // or show its "Sign in again" escape button.
    const safetyTimer = setTimeout(() => {
      console.warn('[AdminAuth] Bootstrap exceeded 8s — forcing loading=false');
      setLoading(false);
    }, 8000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        log('getSession resolved', { hasSession: !!session, userId: session?.user?.id });
        setUser(session?.user ?? null);
        if (session?.user) {
          log('Calling loadAdminData…');
          await loadAdminData(session.user.id);
          log('loadAdminData returned');
        }
      })
      .catch((err) => {
        console.error('[AdminAuth] getSession or loadAdminData failed:', err);
      })
      .finally(() => {
        log('Bootstrap finally — setting loading=false');
        setLoading(false);
        clearTimeout(safetyTimer);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        log('onAuthStateChange', { event: _event, userId: session?.user?.id });
        const newUser = session?.user ?? null;
        setUser(newUser);
        if (newUser) {
          await loadAdminData(newUser.id);
        } else {
          setAdminUser(null);
        }
      },
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [loadAdminData]);

  const value: AdminAuthContextType = {
    user,
    adminUser,
    role: adminUser?.role ?? null,
    loading,
    isAdmin: !!adminUser,
    signInWithEmail: _signInWithEmail,
    signInWithGoogle: _signInWithGoogle,
    signOut: _signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
}
