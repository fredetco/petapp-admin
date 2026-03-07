import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useUserDistribution } from '../../hooks/useSettings';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const COLORS: Record<string, string> = {
  minimal: '#22C55E',
  standard: '#F59E0B',
  detailed: '#3B82F6',
};

export function UserDistributionChart() {
  const { data, isLoading } = useUserDistribution();

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const total = (data ?? []).reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <h4 className="text-sm font-bold text-neutral-700 mb-4">User Complexity Distribution</h4>
      {total === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-8">No users yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={48}>
            <XAxis dataKey="level" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`${value} users`, 'Count']} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {(data ?? []).map((entry) => (
                <Cell key={entry.level} fill={COLORS[entry.level] ?? '#94A3B8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <p className="text-xs text-neutral-400 mt-2 text-center">{total} total users</p>
    </Card>
  );
}
