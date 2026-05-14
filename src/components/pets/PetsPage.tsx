import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PawPrint, Search, X, Filter, RefreshCw } from 'lucide-react';
import { AdminHeader } from '../layout/AdminHeader';
import { useAdminPets, usePetSpeciesList } from '../../hooks/useAdminPets';
import { useUserDetail } from '../../hooks/useUsers';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { Button } from '../shared/Button';

const sexBadge: Record<string, string> = {
  male: 'bg-blue-50 text-blue-700',
  female: 'bg-pink-50 text-pink-700',
  unknown: 'bg-neutral-100 text-neutral-500',
};

/**
 * Escalates to a Retry button after 8s so a hung query doesn't trap
 * the user with an infinite spinner.
 */
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

export function PetsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters are URL-bound so deep links from UserDetailPage work and
  // back-button preserves state.
  const speciesParam = searchParams.get('species') ?? '';
  const ownerParam = searchParams.get('owner') ?? '';
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  // Debounce search to avoid hammering Supabase on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput), 250);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      species: speciesParam || undefined,
      ownerId: ownerParam || undefined,
      search: debouncedSearch.trim() || undefined,
    }),
    [speciesParam, ownerParam, debouncedSearch]
  );

  const { data: pets = [], isLoading, error, refetch, isFetching } = useAdminPets(filters);
  const { data: speciesOptions = [] } = usePetSpeciesList();
  const { data: ownerProfile } = useUserDetail(ownerParam || undefined);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const clearOwner = () => updateParam('owner', '');
  const clearSpecies = () => updateParam('species', '');
  const clearAll = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const hasFilter = !!(speciesParam || ownerParam || debouncedSearch);

  return (
    <div>
      <AdminHeader
        title="Pets"
        description={`${pets.length} pet${pets.length === 1 ? '' : 's'}${hasFilter ? ' matching filters' : ' total'}`}
      />

      <div className="p-8 space-y-4 max-w-6xl">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or passport ID..."
              className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Species filter */}
          <select
            value={speciesParam}
            onChange={(e) => updateParam('species', e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">All species</option>
            {speciesOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {hasFilter && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700"
            >
              <X size={14} /> Clear all
            </button>
          )}
        </div>

        {/* Active owner-filter chip (deep-linked from UserDetailPage) */}
        {ownerParam && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-xs">
            <Filter size={12} className="text-primary-700" />
            <span className="text-primary-800 font-semibold">
              Owner: {ownerProfile?.name || ownerParam.slice(0, 8) + '…'}
            </span>
            <button onClick={clearOwner} className="text-primary-600 hover:text-primary-800">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Active species-filter chip */}
        {speciesParam && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs ml-2">
            <Filter size={12} className="text-green-700" />
            <span className="text-green-800 font-semibold capitalize">Species: {speciesParam}</span>
            <button onClick={clearSpecies} className="text-green-600 hover:text-green-800">
              <X size={12} />
            </button>
          </div>
        )}

        {isLoading ? (
          <LoadingWithRetry onRetry={() => refetch()} />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold">Failed to load pets</p>
              <p className="text-xs mt-0.5 text-red-600">{(error as Error).message}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => refetch()} loading={isFetching} icon={<RefreshCw size={14} />}>
              Retry
            </Button>
          </div>
        ) : pets.length === 0 ? (
          <EmptyState
            icon={<PawPrint size={48} />}
            title={hasFilter ? 'No pets match these filters' : 'No pets yet'}
            description={hasFilter ? 'Try clearing some filters or adjusting your search.' : 'Pets show up here once users add them.'}
            actionLabel={hasFilter ? 'Clear filters' : undefined}
            onAction={hasFilter ? clearAll : undefined}
          />
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Pet</th>
                  <th className="text-left px-4 py-3 font-semibold">Species</th>
                  <th className="text-left px-4 py-3 font-semibold">Breed</th>
                  <th className="text-left px-4 py-3 font-semibold">Sex</th>
                  <th className="text-left px-4 py-3 font-semibold">Owner</th>
                  <th className="text-left px-4 py-3 font-semibold">Passport ID</th>
                  <th className="text-left px-4 py-3 font-semibold">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pets.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                            <PawPrint size={16} />
                          </div>
                        )}
                        <span className="font-semibold text-neutral-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-700">{p.species}</td>
                    <td className="px-4 py-3 text-neutral-600">{p.breed || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${sexBadge[p.sex] ?? sexBadge.unknown}`}>
                        {p.sex}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/users/${p.ownerId}`}
                        className="text-primary-700 hover:underline"
                      >
                        {p.ownerName || <span className="text-neutral-400 italic">unnamed</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{p.passportId}</td>
                    <td className="px-4 py-3 text-neutral-600">{new Date(p.createdAt).toLocaleDateString()}</td>
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
