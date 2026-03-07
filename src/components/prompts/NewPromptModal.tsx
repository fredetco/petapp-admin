import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { useCreatePrompt } from '../../hooks/usePrompts';

interface NewPromptModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewPromptModal({ open, onClose, onCreated }: NewPromptModalProps) {
  const [promptKey, setPromptKey] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const createMutation = useCreatePrompt();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      prompt_key: promptKey,
      title,
      description: description || undefined,
      prompt_text: '# Enter your prompt here\n\nAvailable variables: {pet.name}, {pet.species}, {pet.breed}, {pet.age}\n',
      version: 1,
    });
    setPromptKey('');
    setTitle('');
    setDescription('');
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New AI Prompt">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">
            Prompt Key
          </label>
          <input
            value={promptKey}
            onChange={(e) => setPromptKey(e.target.value)}
            required
            className="w-full rounded-xl border-neutral-300 focus:border-admin-accent-500 focus:ring-admin-accent-500 text-sm"
            placeholder="care_plan_system"
          />
          <p className="text-xs text-neutral-400 mt-1">Unique identifier used by the AI edge function</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-xl border-neutral-300 focus:border-admin-accent-500 focus:ring-admin-accent-500 text-sm"
            placeholder="Care Plan — System Prompt"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">
            Description (optional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border-neutral-300 focus:border-admin-accent-500 focus:ring-admin-accent-500 text-sm"
            placeholder="System prompt for generating structured care plans"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createMutation.isPending}>Create Prompt</Button>
        </div>
      </form>
    </Modal>
  );
}
