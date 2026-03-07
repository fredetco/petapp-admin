export interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface ComplexityConfig {
  default_complexity: 'minimal' | 'standard' | 'detailed';
  max_tasks_minimal: number;
  max_tasks_standard: number;
  max_tasks_detailed: number;
  categories: string[];
  supported_languages: string[];
}
