import { Brain, Plus } from 'lucide-react';
import type { AIPrompt } from '../../types/prompt';
import { Badge } from '../shared/Badge';

interface PromptListProps {
  prompts: AIPrompt[];
  selectedId: string | null;
  onSelect: (prompt: AIPrompt) => void;
  onNew: () => void;
}

const statusVariant = {
  active: 'success' as const,
  draft: 'warning' as const,
  archived: 'default' as const,
};

export function PromptList({ prompts, selectedId, onSelect, onNew }: PromptListProps) {
  // Group by prompt_key, show latest version of each
  const grouped = new Map<string, AIPrompt[]>();
  for (const p of prompts) {
    const list = grouped.get(p.prompt_key) ?? [];
    list.push(p);
    grouped.set(p.prompt_key, list);
  }

  return (
    <div className="w-72 border-r border-admin-border bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b border-admin-border flex items-center justify-between">
        <h3 className="font-bold text-sm text-neutral-800">Prompts</h3>
        <button
          onClick={onNew}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors"
          title="New prompt"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {[...grouped.entries()].map(([key, versions]) => {
          const active = versions.find(v => v.status === 'active') ?? versions[0];
          const isSelected = selectedId === active.id;

          return (
            <button
              key={key}
              onClick={() => onSelect(active)}
              className={`w-full text-left px-4 py-3 border-b border-admin-border transition-colors ${
                isSelected
                  ? 'bg-admin-accent-500/10 border-l-2 border-l-admin-accent-500'
                  : 'hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Brain size={14} className="text-neutral-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-neutral-800 truncate">{active.title}</span>
              </div>
              <div className="flex items-center gap-2 ml-5">
                <Badge variant={statusVariant[active.status]}>{active.status}</Badge>
                <span className="text-xs text-neutral-400">v{active.version}</span>
              </div>
            </button>
          );
        })}

        {prompts.length === 0 && (
          <div className="p-4 text-center text-neutral-400 text-sm">
            No prompts yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}
