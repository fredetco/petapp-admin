import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, PawPrint, ListChecks, ClipboardList, BookOpen, Calendar, Globe, Bell, MapPin, Clock } from 'lucide-react';
import { AdminHeader } from '../layout/AdminHeader';
import { useUserDetail, useUserPets } from '../../hooks/useUsers';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Button } from '../shared/Button';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatLocation(loc: { city?: string; region?: string; country?: string } | null): string {
  if (!loc) return '—';
  const parts = [loc.city, loc.region, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '—';
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useUserDetail(id);
  const { data: pets = [], isLoading: petsLoading } = useUserPets(id);

  if (userLoading) {
    return (
      <div>
        <AdminHeader title="User profile" />
        <div className="p-4 lg:p-8 flex justify-center"><LoadingSpinner size="lg" /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <AdminHeader title="User not found" />
        <div className="p-8">
          <p className="text-neutral-600">No user with id <code className="text-xs bg-neutral-100 px-1 rounded">{id}</code>.</p>
          <Button onClick={() => navigate('/users')} className="mt-4" variant="secondary">Back to users</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title={user.name || 'Unnamed user'}
        description={user.id}
      />

      <div className="p-4 lg:p-8 space-y-6 max-w-5xl">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft size={14} /> Back to users
        </button>

        {/* Activity stat strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard label="Pets" value={user.petCount} icon={<PawPrint size={16} />} color="text-green-600" bg="bg-green-50" />
          <StatCard label="Tasks" value={user.taskCount} icon={<ListChecks size={16} />} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Care logs" value={user.careLogCount} icon={<BookOpen size={16} />} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Care plans" value={user.carePlanCount} icon={<ClipboardList size={16} />} color="text-purple-600" bg="bg-purple-50" />
        </div>

        {/* Profile fields */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-neutral-800">Profile</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Field icon={<Globe size={14} />} label="Language" value={user.language.toUpperCase()} />
            <Field icon={<Bell size={14} />} label="Reminder frequency" value={user.reminderFrequency} />
            <Field icon={<Clock size={14} />} label="Timezone" value={user.timezone} />
            <Field icon={<MapPin size={14} />} label="Location" value={formatLocation(user.location)} />
            <Field icon={<Calendar size={14} />} label="Joined" value={formatDateTime(user.createdAt)} />
            <Field icon={<Calendar size={14} />} label="Last updated" value={formatDateTime(user.updatedAt)} />
            <Field label="Onboarding complete" value={user.onboardingComplete ? 'Yes' : 'No'} />
            <Field label="Notifications enabled" value={user.notificationsEnabled ? 'Yes' : 'No'} />
            <Field label="User ID" value={user.id} mono />
          </dl>
        </div>

        {/* Pets owned */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-800">Pets ({user.petCount})</h2>
            <Link
              to={`/pets?owner=${user.id}`}
              className="text-xs text-primary-600 hover:underline font-semibold"
            >
              View in Pets tab →
            </Link>
          </div>

          {petsLoading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : pets.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">No pets on file.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {pets.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-6 py-3">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                      <PawPrint size={18} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-800 text-sm">{p.name}</p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {p.species}{p.breed ? ` · ${p.breed}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</span>
        <div className={`${bg} p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-neutral-800">{value}</p>
    </div>
  );
}

function Field({ icon, label, value, mono }: { icon?: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500 font-semibold flex items-center gap-1.5">
        {icon}{label}
      </dt>
      <dd className={`mt-1 text-neutral-800 ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</dd>
    </div>
  );
}
