import { useState } from 'react';
import { AdminHeader } from '../layout/AdminHeader';
import { PromptList } from './PromptList';
import { PromptEditor } from './PromptEditor';
import { NewPromptModal } from './NewPromptModal';
import { useAllPrompts } from '../../hooks/usePrompts';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { Brain } from 'lucide-react';
import { Button } from '../shared/Button';
import type { AIPrompt } from '../../types/prompt';

export function PromptsPage() {
  const { data: prompts = [], isLoading, refetch } = useAllPrompts();
  const [selected, setSelected] = useState<AIPrompt | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Auto-select first prompt if none selected
  if (!selected && prompts.length > 0 && !isLoading) {
    setSelected(prompts[0]);
  }

  return (
    <div className="flex flex-col h-screen">
      <AdminHeader
        title="AI Prompts"
        description="Manage AI system prompts and templates"
        actions={
          <Button size="sm" onClick={() => setShowNew(true)}>
            New Prompt
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="flex-1">
          <EmptyState
            icon={<Brain size={48} />}
            title="No prompts yet"
            description="Create your first AI prompt to control how the AI generates care plans."
            actionLabel="Create First Prompt"
            onAction={() => setShowNew(true)}
          />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <PromptList
            prompts={prompts}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            onNew={() => setShowNew(true)}
          />
          {selected && (
            <PromptEditor
              key={selected.id}
              prompt={selected}
              onUpdated={() => refetch()}
            />
          )}
        </div>
      )}

      <NewPromptModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => refetch()}
      />
    </div>
  );
}
