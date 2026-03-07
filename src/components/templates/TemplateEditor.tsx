import { useState } from 'react';
import type { SpeciesCareTemplate, TemplateTask } from '../../types/template';
import { TaskEditor } from './TaskEditor';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { useUpdateTemplate, useActivateTemplate, useArchiveTemplate } from '../../hooks/useTemplates';
import { ArrowLeft, Save, Zap, Archive } from 'lucide-react';

interface TemplateEditorProps {
  template: SpeciesCareTemplate;
  onBack: () => void;
  onUpdated: () => void;
}

const statusVariant = {
  active: 'success' as const,
  draft: 'warning' as const,
  archived: 'default' as const,
};

export function TemplateEditor({ template, onBack, onUpdated }: TemplateEditorProps) {
  const [displayName, setDisplayName] = useState(template.display_name);
  const [description, setDescription] = useState(template.description ?? '');
  const [species, setSpecies] = useState(template.species);
  const [breed, setBreed] = useState(template.breed ?? '');
  const [tasks, setTasks] = useState<TemplateTask[]>(template.template_tasks.tasks);
  const [dirty, setDirty] = useState(false);

  const updateMutation = useUpdateTemplate();
  const activateMutation = useActivateTemplate();
  const archiveMutation = useArchiveTemplate();

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: template.id,
      updates: {
        display_name: displayName,
        description: description || null,
        species,
        breed: breed || null,
        template_tasks: { tasks },
        minimal_task_ids: tasks.filter(t => t.complexity === 'minimal').map(t => t.id),
        standard_task_ids: tasks.filter(t => ['minimal', 'standard'].includes(t.complexity)).map(t => t.id),
        detailed_task_ids: tasks.map(t => t.id),
      },
    });
    setDirty(false);
    onUpdated();
  };

  const handleActivate = async () => {
    if (dirty) await handleSave();
    await activateMutation.mutateAsync(template.id);
    onUpdated();
  };

  const handleArchive = async () => {
    await archiveMutation.mutateAsync(template.id);
    onUpdated();
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft size={18} className="text-neutral-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setDirty(true); }}
              className="text-xl font-bold text-neutral-800 bg-transparent border-none p-0 focus:ring-0"
              placeholder="Template name"
            />
            <Badge variant={statusVariant[template.status]}>{template.status}</Badge>
          </div>
        </div>
      </div>

      {/* Meta fields */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Species</label>
          <input
            value={species}
            onChange={(e) => { setSpecies(e.target.value); setDirty(true); }}
            className="w-full rounded-xl border-neutral-300 text-sm"
            placeholder="dog"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Breed (optional)</label>
          <input
            value={breed}
            onChange={(e) => { setBreed(e.target.value); setDirty(true); }}
            className="w-full rounded-xl border-neutral-300 text-sm"
            placeholder="All breeds"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
            className="w-full rounded-xl border-neutral-300 text-sm"
            placeholder="General care template for..."
          />
        </div>
      </div>

      {/* Task editor */}
      <TaskEditor
        tasks={tasks}
        onChange={(newTasks) => { setTasks(newTasks); setDirty(true); }}
      />

      {/* Action bar */}
      <div className="flex items-center gap-3 pt-4 border-t border-admin-border">
        <Button
          variant="secondary"
          size="sm"
          icon={<Save size={14} />}
          loading={updateMutation.isPending}
          disabled={!dirty}
          onClick={handleSave}
        >
          Save
        </Button>

        {template.status !== 'active' && (
          <Button
            size="sm"
            icon={<Zap size={14} />}
            loading={activateMutation.isPending}
            onClick={handleActivate}
          >
            Activate
          </Button>
        )}

        {template.status !== 'archived' && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Archive size={14} />}
            loading={archiveMutation.isPending}
            onClick={handleArchive}
          >
            Archive
          </Button>
        )}

        {dirty && <span className="text-xs text-admin-accent-500 ml-auto">Unsaved changes</span>}
      </div>
    </div>
  );
}
