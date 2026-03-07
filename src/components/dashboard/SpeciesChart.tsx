import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSpeciesDistribution } from '../../hooks/useAnalytics';
import { Card } from '../shared/Card';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const COLORS = [
  '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
];

function capitalize(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function SpeciesChart() {
  const { data, isLoading } = useSpeciesDistribution();

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      </Card>
    );
  }

  const total = (data ?? []).reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <h4 className="text-sm font-bold text-neutral-700 mb-4">Species Distribution</h4>
      {total === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-8">No pets registered yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="species"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ species, percent }) =>
                `${capitalize(species)} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {(data ?? []).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, capitalize(name)]}
            />
            <Legend formatter={(value: string) => capitalize(value)} />
          </PieChart>
        </ResponsiveContainer>
      )}
      <p className="text-xs text-neutral-400 mt-2 text-center">{total} total pets</p>
    </Card>
  );
}
