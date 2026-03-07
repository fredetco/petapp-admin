import type { SpeciesCareTemplate } from '../../types/template';
import { Badge } from '../shared/Badge';
import { Card } from '../shared/Card';
import { FileStack, ChevronRight } from 'lucide-react';

interface TemplateListProps {
  templates: SpeciesCareTemplate[];
  onSelect: (template: SpeciesCareTemplate) => void;
}

const statusVariant = {
  active: 'success' as const,
  draft: 'warning' as const,
  archived: 'default' as const,
};

const confidenceVariant = {
  draft: 'default' as const,
  reviewed: 'info' as const,
  verified: 'success' as const,
};

export function TemplateList({ templates, onSelect }: TemplateListProps) {
  return (
    <div className="grid gap-3">
      {templates.map(t => (
        <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" padding={false}>
          <button onClick={() => onSelect(t)} className="w-full text-left px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-admin-accent-500/10 flex items-center justify-center flex-shrink-0">
                <FileStack size={18} className="text-admin-accent-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-neutral-800 text-sm">{t.display_name}</span>
                  <Badge variant={statusVariant[t.status]}>{t.status}</Badge>
                  <Badge variant={confidenceVariant[t.expert_confidence]}>{t.expert_confidence}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span>{t.species}{t.breed ? ` / ${t.breed}` : ''}</span>
                  <span>{t.template_tasks.tasks.length} tasks</span>
                  <span>v{t.version}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-400" />
            </div>
          </button>
        </Card>
      ))}
    </div>
  );
}
