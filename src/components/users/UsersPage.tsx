import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, CheckCircle2, Circle } from 'lucide-react';
import { AdminHeader } from '../layout/AdminHeader';
import { useAllUsers } from '../../hooks/useUsers';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function UsersPage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading, error } = useAllUsers();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => (u.name ?? '').toLowerCase().includes(q) || u.id.includes(q)
    );
  }, [users, search]);

  return (
    <div>
      <AdminHeader
        title="Users"
        description={`${users.length} total — click a row to see full profile`}
      />

      <div className="p-8 space-y-4 max-w-6xl">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or user ID..."
            className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            Failed to load users: {(error as Error).message}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title={users.length === 0 ? 'No users yet' : 'No users match your search'}
            description={users.length === 0 ? 'Once people sign up they\'ll appear here.' : 'Try a different search term.'}
          />
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Pets</th>
                  <th className="text-left px-4 py-3 font-semibold">Language</th>
                  <th className="text-left px-4 py-3 font-semibold">Onboarded</th>
                  <th className="text-left px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => navigate(`/users/${u.id}`)}
                    className="hover:bg-primary-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-800">{u.name || <span className="text-neutral-400 italic">unnamed</span>}</p>
                      <p className="text-[11px] text-neutral-400 font-mono">{u.id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {u.petCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                          {u.petCount}
                        </span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 uppercase text-xs">{u.language}</td>
                    <td className="px-4 py-3">
                      {u.onboardingComplete ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <Circle size={16} className="text-neutral-300" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
