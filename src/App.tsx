import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute';
import { AdminAuthPage } from './components/auth/AdminAuthPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { AdminShell } from './components/layout/AdminShell';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { PromptsPage } from './components/prompts/PromptsPage';
import { TemplatesPage } from './components/templates/TemplatesPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { UsersPage } from './components/users/UsersPage';
import { UserDetailPage } from './components/users/UserDetailPage';
import { PetsPage } from './components/pets/PetsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // No automatic retry. With the 8s withTimeout, a failed query
      // would otherwise spin for ~16s before showing the error. The
      // pages render a Retry button so the user can manually re-run.
      retry: 0,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AdminAuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AdminAuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected admin routes */}
            <Route element={
              <AdminProtectedRoute>
                <AdminShell />
              </AdminProtectedRoute>
            }>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              <Route path="/pets" element={<PetsPage />} />
              <Route path="/prompts" element={<PromptsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AdminAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
