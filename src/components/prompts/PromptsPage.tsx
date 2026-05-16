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

  // Auto-select first prompt if none selected — only on desktop where
  // both panes are visible at once. On mobile we want to start on the
  // list so the user can pick.
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  if (isDesktop && !selected && prompts.length > 0 && !isLoading) {
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
          {/* Mobile: show list OR editor, never both. The editor pane
              already has a back button via its <PromptEditor>; here
              we control visibility based on `selected` so the user
              has a clear single-view stack. */}
          <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-1 md:flex-initial md:w-72`}>
            <PromptList
              prompts={prompts}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onNew={() => setShowNew(true)}
            />
          </div>
          {selected && (
            <div className="flex-1 flex min-h-0">
              {/* Back arrow on mobile to return to the list */}
              <button
                onClick={() => setSelected(null)}
                className="md:hidden absolute top-3 left-2 z-10 p-2 rounded-lg bg-white shadow-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                aria-label="Back to prompt list"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 12L6 8l4-4" />
                </svg>
              </button>
              <PromptEditor
                key={selected.id}
                prompt={selected}
                onUpdated={() => refetch()}
              />
            </div>
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
