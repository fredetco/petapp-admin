import { PROMPT_VARIABLES } from '../../types/prompt';

interface VariableToolbarProps {
  onInsert: (variable: string) => void;
}

export function VariableToolbar({ onInsert }: VariableToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1.5 py-2">
      <span className="text-xs text-neutral-500 mr-1 self-center">Variables:</span>
      {PROMPT_VARIABLES.map(v => (
        <button
          key={v}
          onClick={() => onInsert(v)}
          className="px-2 py-0.5 text-xs font-mono bg-admin-accent-500/10 text-admin-accent-600 rounded-md hover:bg-admin-accent-500/20 transition-colors"
        >
          {v}
        </button>
      ))}
    </div>
  );
}
