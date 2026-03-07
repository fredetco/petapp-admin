export type TemplateStatus = 'draft' | 'active' | 'archived';
export type ExpertConfidence = 'draft' | 'reviewed' | 'verified';
export type TaskCategory = 'daily_care' | 'health' | 'grooming' | 'habitat';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ComplexityLevel = 'minimal' | 'standard' | 'detailed';
export type FrequencyBucket = 'daily' | '2x_week' | '3x_week' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'as_needed';

export interface TemplateTaskCondition {
  minAgeMonths?: number;
  maxAgeMonths?: number;
  sexSpecific?: 'male' | 'female';
  neuteredOnly?: boolean;
  notNeutered?: boolean;
  climateZones?: string[];
  seasons?: string[];
}

export interface SeasonalVariation {
  season: string;
  frequencyOverride?: FrequencyBucket;
  descriptionOverride?: string;
}

export interface TemplateTask {
  id: string;
  title: string;
  title_fr: string;
  description: string;
  description_fr: string;
  category: TaskCategory;
  frequency: FrequencyBucket;
  priority: TaskPriority;
  complexity: ComplexityLevel;
  conditions?: TemplateTaskCondition;
  seasonalVariation?: SeasonalVariation[];
  expertNotes?: string;
}

export interface SpeciesCareTemplate {
  id: string;
  species: string;
  breed: string | null;
  version: number;
  status: TemplateStatus;
  display_name: string;
  description: string | null;
  template_tasks: { tasks: TemplateTask[] };
  created_by: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  expert_confidence: ExpertConfidence;
  minimal_task_ids: string[] | null;
  standard_task_ids: string[] | null;
  detailed_task_ids: string[] | null;
  created_at: string;
  updated_at: string;
}
