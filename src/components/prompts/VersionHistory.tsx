import { format } from 'date-fns';
import type { AIPrompt } from '../../types/prompt';
import { Badge } from '../shared/Badge';

interface VersionHistoryProps {
  versions: AIPrompt[];
  currentId: string;
  onSelect: (prompt: AIPrompt) => void;
}

const statusVariant = {
  active: 'success' as const,
  draft: 'warning' as const,
  archived: 'default' as const,
};

export function VersionHistory({ versions, currentId, onSelect }: VersionHistoryProps) {
  if (versions.length === 0) return null;

  return (
    <div className="border-t border-admin-border pt-4 mt-4">
      <h4 className="text-sm font-bold text-neutral-700 mb-3">Version History</h4>
      <div className="space-y-2">
        {versions.map(v => (
          <button
            key={v.id}
            onClick={() => onSelect(v)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              v.id === currentId
                ? 'bg-admin-accent-500/10 ring-1 ring-admin-accent-500/30'
                : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[v.status]}>{v.status}</Badge>
              <span className="font-medium text-neutral-700">v{v.version}</span>
              <span className="text-neutral-400 text-xs">
                {format(new Date(v.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
