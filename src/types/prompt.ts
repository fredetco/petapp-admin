export type PromptStatus = 'draft' | 'active' | 'archived';

export interface AIPrompt {
  id: string;
  prompt_key: string;
  version: number;
  status: PromptStatus;
  title: string;
  description: string | null;
  prompt_text: string;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  activated_at: string | null;
  archived_at: string | null;
}

export type AuditAction = 'created' | 'activated' | 'archived' | 'edited';

export interface AIPromptAudit {
  id: string;
  prompt_id: string;
  action: AuditAction;
  changed_by: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export const PROMPT_VARIABLES = [
  '{pet.name}',
  '{pet.species}',
  '{pet.breed}',
  '{pet.age}',
  '{location.city}',
  '{location.climateZone}',
  '{season.current}',
  '{complexity}',
  '{language}',
] as const;
