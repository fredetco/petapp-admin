import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
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

    // Belt-and-suspenders: even if fetchAdminUser's own timeout
    // failed to fire (long-tail bug) or supabase.auth.getSession()
    // itself hangs, force the spinner off after 12s so the user
    // lands on /auth and can recover by signing in again — no
    // more "delete site data" required.
    const safetyTimer = setTimeout(() => {
      console.warn('[AdminAuth] Bootstrap exceeded 12s — forcing loading=false');
      setLoading(false);
    }, 12000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadAdminData(session.user.id);
        }
      })
      .catch((err) => {
        console.error('[AdminAuth] getSession failed:', err);
      })
      .finally(() => {
        setLoading(false);
        clearTimeout(safetyTimer);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
