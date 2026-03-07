import { formatDistanceToNow } from 'date-fns';
import { useRecentAuditLog } from '../../hooks/useAnalytics';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  created: 'info',
  updated: 'warning',
  activated: 'success',
  archived: 'danger',
};

export function AuditLogTable() {
  const { data, isLoading } = useRecentAuditLog();

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      </Card>
    );
  }

  return (
    <Card>
      <h4 className="text-sm font-bold text-neutral-700 mb-4">Recent Prompt Audit Log</h4>
      {(!data || data.length === 0) ? (
        <p className="text-sm text-neutral-400 text-center py-8">No audit entries yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500">Prompt</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500">Action</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500">Changed By</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500">When</th>
              </tr>
            </thead>
            <tbody>
              {data.map(entry => (
                <tr key={entry.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-2.5 px-3 font-medium text-neutral-700">
                    {entry.prompt_title}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={ACTION_VARIANT[entry.action] || 'default'}>
                      {entry.action}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-500">
                    {entry.admin_name}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-400">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
