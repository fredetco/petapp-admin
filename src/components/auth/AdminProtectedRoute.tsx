import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, adminUser, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <LoadingSpinner size="lg" />
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
