import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function PlaceholderPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">PetApp Admin</h1>
        <p className="text-neutral-500">Dashboard coming soon</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<PlaceholderPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
