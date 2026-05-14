import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ShieldAlert, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabase';

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, adminUser, loading } = useAdminAuth();

  // Escape hatch — if the spinner is showing for more than 4 seconds,
  // expose a "Sign in again" button that nukes the session and
  // sends the user to /auth. Guarantees no one ever gets stuck on
  // an infinite spinner regardless of what's hanging underneath.
  const [escapeVisible, setEscapeVisible] = useState(false);
  useEffect(() => {
    if (!loading) {
      setEscapeVisible(false);
      return;
    }
    const t = setTimeout(() => setEscapeVisible(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  const handleEscape = async () => {
    // Best-effort sign out so the next visit starts cleanly. Don't
    // await it — even if Supabase hangs, we still want to navigate.
    try { supabase.auth.signOut(); } catch { /* ignore */ }
    // Clear any lingering Supabase JWT in localStorage so we don't
    // re-hydrate into the same hung state.
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sb-')) localStorage.removeItem(k);
      }
    } catch { /* ignore */ }
    window.location.replace('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-admin-bg gap-4">
        <LoadingSpinner size="lg" />
        {escapeVisible && (
          <div className="flex flex-col items-center gap-2 text-center max-w-sm px-4">
            <p className="text-sm text-neutral-400">
              Taking longer than usual…
            </p>
            <button
              onClick={handleEscape}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-admin-accent-500 hover:bg-admin-accent-600 text-white text-sm font-semibold transition-colors"
            >
              <LogOut size={14} />
              Sign in again
            </button>
            <p className="text-[11px] text-neutral-500 mt-1">
              This clears your session and reloads.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated but not an admin
  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <ShieldAlert size={48} className="mx-auto mb-4 text-danger" />
          <h2 className="text-xl font-bold text-neutral-800 mb-2">Access Denied</h2>
          <p className="text-neutral-500 text-sm mb-4">
            Your account does not have admin privileges. Contact a super admin to request access.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="text-admin-accent-600 text-sm font-semibold hover:underline"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
