import { useState } from 'react';
import { AdminHeader } from '../layout/AdminHeader';
import { TemplateList } from './TemplateList';
import { TemplateEditor } from './TemplateEditor';
import { useAllTemplates, useCreateTemplate } from '../../hooks/useTemplates';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { FileStack } from 'lucide-react';
import type { SpeciesCareTemplate } from '../../types/template';

export function TemplatesPage() {
  const { data: templates = [], isLoading, refetch } = useAllTemplates();
  const [selected, setSelected] = useState<SpeciesCareTemplate | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newSpecies, setNewSpecies] = useState('');
  const [newName, setNewName] = useState('');
  const createMutation = useCreateTemplate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = await createMutation.mutateAsync({
      species: newSpecies.toLowerCase(),
      display_name: newName,
    });
    setNewSpecies('');
    setNewName('');
    setShowNew(false);
    await refetch();
    setSelected(t);
  };

  if (selected) {
    return (
      <div>
        <AdminHeader
          title="Edit Template"
          description={selected.display_name}
        />
        <div className="p-8">
          <TemplateEditor
            template={selected}
            onBack={() => setSelected(null)}
            onUpdated={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Species Care Templates"
        description="Expert-curated care plans by species and breed"
        actions={
          <Button size="sm" onClick={() => setShowNew(true)}>
            New Template
          </Button>
        }
      />

      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={<FileStack size={48} />}
            title="No templates yet"
            description="Create species-specific care templates that the AI will use as a base for generating care plans."
            actionLabel="Create First Template"
            onAction={() => setShowNew(true)}
          />
        ) : (
          <TemplateList templates={templates} onSelect={setSelected} />
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Care Template">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Species</label>
            <input
              value={newSpecies}
              onChange={(e) => setNewSpecies(e.target.value)}
              required
              className="w-full rounded-xl border-neutral-300 focus:border-admin-accent-500 focus:ring-admin-accent-500 text-sm"
              placeholder="dog, cat, corn_snake, bearded_dragon..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Display Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="w-full rounded-xl border-neutral-300 focus:border-admin-accent-500 focus:ring-admin-accent-500 text-sm"
              placeholder="Dog (General)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
