import { supabase } from './supabase';
import type { SpeciesCareTemplate } from '../types/template';

export async function fetchAllTemplates(): Promise<SpeciesCareTemplate[]> {
  const { data, error } = await supabase
    .from('species_care_templates')
    .select('*')
    .order('species')
    .order('version', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTemplate(id: string): Promise<SpeciesCareTemplate> {
  const { data, error } = await supabase
    .from('species_care_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTemplate(template: {
  species: string;
  breed?: string;
  display_name: string;
  description?: string;
  template_tasks: { tasks: never[] };
  created_by?: string;
}): Promise<SpeciesCareTemplate> {
  const { data, error } = await supabase
    .from('species_care_templates')
    .insert({ ...template, status: 'draft', version: 1 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(
  id: string,
  updates: Partial<SpeciesCareTemplate>,
): Promise<SpeciesCareTemplate> {
  const { data, error } = await supabase
    .from('species_care_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function activateTemplate(id: string): Promise<SpeciesCareTemplate> {
  return updateTemplate(id, {
    status: 'active',
  } as Partial<SpeciesCareTemplate>);
}

export async function archiveTemplate(id: string): Promise<SpeciesCareTemplate> {
  return updateTemplate(id, {
    status: 'archived',
  } as Partial<SpeciesCareTemplate>);
}
