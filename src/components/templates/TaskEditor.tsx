import { useState } from 'react';
import type { TemplateTask, TaskCategory, FrequencyBucket, TaskPriority, ComplexityLevel } from '../../types/template';
import { Button } from '../shared/Button';
import { ComplexityBadge } from './ComplexityBadge';
import { Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

interface TaskEditorProps {
  tasks: TemplateTask[];
  onChange: (tasks: TemplateTask[]) => void;
}

const categories: TaskCategory[] = ['daily_care', 'health', 'grooming', 'habitat'];
const frequencies: FrequencyBucket[] = ['daily', '2x_week', '3x_week', 'weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'annual', 'as_needed'];
const priorities: TaskPriority[] = ['low', 'medium', 'high'];
const complexities: ComplexityLevel[] = ['minimal', 'standard', 'detailed'];

const categoryColors: Record<TaskCategory, string> = {
  daily_care: 'border-l-amber-400',
  health: 'border-l-red-400',
  grooming: 'border-l-violet-400',
  habitat: 'border-l-cyan-400',
};

export function TaskEditor({ tasks, onChange }: TaskEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addTask = () => {
    const id = `task_${Date.now()}`;
    const newTask: TemplateTask = {
      id,
      title: '',
      title_fr: '',
      description: '',
      description_fr: '',
      category: 'daily_care',
      frequency: 'daily',
      priority: 'medium',
      complexity: 'standard',
    };
    onChange([...tasks, newTask]);
    setExpandedId(id);
  };

  const updateTask = (id: string, updates: Partial<TemplateTask>) => {
    onChange(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTask = (id: string) => {
    onChange(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-neutral-700">Tasks ({tasks.length})</h4>
        <Button size="sm" variant="secondary" onClick={addTask}>Add Task</Button>
      </div>

      {tasks.map((task) => {
        const isExpanded = expandedId === task.id;
        return (
          <div
            key={task.id}
            className={`border border-admin-border rounded-xl overflow-hidden border-l-4 ${categoryColors[task.category]}`}
          >
            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : task.id)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
            >
              <GripVertical size={14} className="text-neutral-300" />
              <span className="text-sm font-medium text-neutral-800 flex-1">
                {task.title || 'Untitled task'}
              </span>
              <ComplexityBadge level={task.complexity} />
              <span className="text-xs text-neutral-400">{task.frequency}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Expanded editor */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-admin-border bg-neutral-50/50">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Title (EN)</label>
                    <input
                      value={task.title}
                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                      className="w-full rounded-lg border-neutral-300 text-sm"
                      placeholder="Morning feeding"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Title (FR)</label>
                    <input
                      value={task.title_fr}
                      onChange={(e) => updateTask(task.id, { title_fr: e.target.value })}
                      className="w-full rounded-lg border-neutral-300 text-sm"
                      placeholder="Repas du matin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Description (EN)</label>
                    <textarea
                      value={task.description}
                      onChange={(e) => updateTask(task.id, { description: e.target.value })}
                      className="w-full rounded-lg border-neutral-300 text-sm"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Description (FR)</label>
                    <textarea
                      value={task.description_fr}
                      onChange={(e) => updateTask(task.id, { description_fr: e.target.value })}
                      className="w-full rounded-lg border-neutral-300 text-sm"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Category</label>
                    <select
                      value={task.category}
                      onChange={(e) => updateTask(task.id, { category: e.target.value as TaskCategory })}
                      className="w-full rounded-lg border-neutral-300 text-sm"
                    >
                      {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Frequency</label>
                    <select
                      value={task.frequency}
                      onChange={(e) => updateTask(task.id, { frequency: e.target.value as FrequencyBucket })}
                      className="w-full rounded-lg border-neutral-300 text-sm"
                    >
                      {frequencies.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Priority</label>
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                      className="w-full rounded-lg border-neutral-300 text-sm"
                    >
                      {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">Min. Complexity</label>
                    <select
                      value={task.complexity}
                      onChange={(e) => updateTask(task.id, { complexity: e.target.value as ComplexityLevel })}
                      className="w-full rounded-lg border-neutral-300 text-sm"
                    >
                      {complexities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Expert Notes (internal)</label>
                  <input
                    value={task.expertNotes ?? ''}
                    onChange={(e) => updateTask(task.id, { expertNotes: e.target.value })}
                    className="w-full rounded-lg border-neutral-300 text-sm"
                    placeholder="Notes for the AI, not shown to users"
                  />
                </div>

                <div className="flex justify-end">
                  <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => removeTask(task.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <p className="text-center text-neutral-400 text-sm py-8">No tasks yet. Click "Add Task" to start building the template.</p>
      )}
    </div>
  );
}
