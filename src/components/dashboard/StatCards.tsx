import { Users, PawPrint, Sparkles, FileText } from 'lucide-react';
import { useDashboardStats } from '../../hooks/useAnalytics';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const STATS_CONFIG = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'totalPets', label: 'Total Pets', icon: PawPrint, color: 'text-green-500', bg: 'bg-green-50' },
  { key: 'activePrompts', label: 'Active Prompts', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'totalTemplates', label: 'Templates', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
] as const;

export function StatCards() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 flex justify-center">
            <LoadingSpinner />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {STATS_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
        <div key={key} className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</span>
            <div className={`${bg} p-2 rounded-lg`}>
              <Icon size={16} className={color} />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-800">
            {data ? data[key as keyof typeof data] : 0}
          </p>
        </div>
      ))}
    </div>
  );
}
