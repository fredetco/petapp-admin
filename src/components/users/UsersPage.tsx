import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, CheckCircle2, Circle, RefreshCw, Pencil, Ban, Trash2, RotateCcw,
} from 'lucide-react';
import { AdminHeader } from '../layout/AdminHeader';
import { useAllUsers } from '../../hooks/useUsers';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { Button } from '../shared/Button';
import { AdminUserEditModal } from './AdminUserEditModal';
import {
  setUserSuspended, softDeleteUser, restoreUser, type UserListEntry,
} from '../../services/users';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<UserListEntry | null>(null);

  const { data: users = [], isLoading, error, refetch, isFetching } = useAllUsers({ includeDeleted: showDeleted });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspend }: { id: string; suspend: boolean }) => setUserSuspended(id, suspend),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => softDeleteUser(id),
    onSuccess: invalidate,
  });
  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: invalidate,
  });

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
        description={`${users.length} total${showDeleted ? ' (incl. deleted)' : ''} — click a row to see full profile`}
      />

      <div className="p-8 space-y-4 max-w-7xl">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or user ID..."
              className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="rounded text-primary-500 focus:ring-primary-300"
            />
            Show deleted
          </label>
        </div>

        {isLoading ? (
          <LoadingWithRetry onRetry={() => refetch()} />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold">Failed to load users</p>
              <p className="text-xs mt-0.5 text-red-600">{(error as Error).message}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => refetch()} loading={isFetching} icon={<RefreshCw size={14} />}>
              Retry
            </Button>
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
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Pets</th>
                  <th className="text-left px-4 py-3 font-semibold">Language</th>
                  <th className="text-left px-4 py-3 font-semibold">Onboarded</th>
                  <th className="text-left px-4 py-3 font-semibold">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((u) => {
                  const isDeleted = !!u.deletedAt;
                  const isSuspended = !!u.suspendedAt && !isDeleted;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => navigate(`/users/${u.id}`)}
                      className={`cursor-pointer transition-colors ${
                        isDeleted ? 'opacity-50 hover:bg-neutral-50' : 'hover:bg-primary-50/40'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-800">{u.name || <span className="text-neutral-400 italic">unnamed</span>}</p>
                        <p className="text-[11px] text-neutral-400 font-mono">{u.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3">
                        {isDeleted ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase">Deleted</span>
                        ) : isSuspended ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase">Suspended</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase">Active</span>
                        )}
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
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isDeleted ? (
                            <IconButton
                              title="Restore"
                              onClick={() => restoreMutation.mutate(u.id)}
                              loading={restoreMutation.isPending && restoreMutation.variables === u.id}
                              icon={<RotateCcw size={14} />}
                              color="text-primary-600 hover:bg-primary-50"
                            />
                          ) : (
                            <>
                              <IconButton
                                title="Edit"
                                onClick={() => setEditTarget(u)}
                                icon={<Pencil size={14} />}
                                color="text-neutral-600 hover:bg-neutral-100"
                              />
                              <IconButton
                                title={isSuspended ? 'Unsuspend' : 'Suspend'}
                                onClick={() => suspendMutation.mutate({ id: u.id, suspend: !isSuspended })}
                                loading={suspendMutation.isPending && suspendMutation.variables?.id === u.id}
                                icon={<Ban size={14} />}
                                color={isSuspended ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}
                              />
                              <IconButton
                                title="Delete"
                                onClick={() => {
                                  if (window.confirm(`Delete ${u.name || 'this user'}? This is a soft delete — you can restore them later.`)) {
                                    deleteMutation.mutate(u.id);
                                  }
                                }}
                                loading={deleteMutation.isPending && deleteMutation.variables === u.id}
                                icon={<Trash2 size={14} />}
                                color="text-red-600 hover:bg-red-50"
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminUserEditModal
        open={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}

function IconButton({
  title, onClick, icon, color, loading,
}: {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={loading}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
    >
      {loading ? <LoadingSpinner size="sm" /> : icon}
    </button>
  );
}

function LoadingWithRetry({ onRetry }: { onRetry: () => void }) {
  const [tookTooLong, setTookTooLong] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTookTooLong(true), 8000);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <LoadingSpinner size="lg" />
      {tookTooLong && (
        <>
          <p className="text-sm text-neutral-500">Taking longer than usual…</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline font-semibold"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </>
      )}
    </div>
  );
}
