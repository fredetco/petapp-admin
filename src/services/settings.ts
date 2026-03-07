import { supabase } from './supabase';
import type { PlatformSetting } from '../types/settings';

export async function fetchAllSettings(): Promise<PlatformSetting[]> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .order('key');
  if (error) throw error;
  return data ?? [];
}

export async function updateSetting(
  key: string,
  value: unknown,
  updatedBy?: string,
): Promise<PlatformSetting> {
  const { data, error } = await supabase
    .from('platform_settings')
    .update({ value, updated_by: updatedBy })
    .eq('key', key)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchUserComplexityDistribution(): Promise<{ level: string; count: number }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('care_plan_complexity');
  if (error) throw error;

  const counts: Record<string, number> = { minimal: 0, standard: 0, detailed: 0 };
  for (const row of data ?? []) {
    const level = row.care_plan_complexity || 'standard';
    counts[level] = (counts[level] || 0) + 1;
  }

  return Object.entries(counts).map(([level, count]) => ({ level, count }));
}
