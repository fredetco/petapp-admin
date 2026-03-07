import { supabase } from './supabase';
import type { AIPrompt, AIPromptAudit } from '../types/prompt';

export async function fetchPromptsByKey(promptKey: string): Promise<AIPrompt[]> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('prompt_key', promptKey)
    .order('version', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllPromptKeys(): Promise<string[]> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('prompt_key')
    .order('prompt_key');
  if (error) throw error;
  const unique = [...new Set((data ?? []).map(d => d.prompt_key))];
  return unique;
}

export async function fetchAllPrompts(): Promise<AIPrompt[]> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .order('prompt_key')
    .order('version', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPrompt(prompt: {
  prompt_key: string;
  title: string;
  description?: string;
  prompt_text: string;
  version: number;
  status: string;
  created_by?: string;
}): Promise<AIPrompt> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .insert(prompt)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePrompt(id: string, updates: Partial<AIPrompt>): Promise<AIPrompt> {
  const { data, error } = await supabase
    .from('ai_prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function activatePrompt(id: string, approvedBy?: string): Promise<AIPrompt> {
  return updatePrompt(id, {
    status: 'active',
    activated_at: new Date().toISOString(),
    approved_by: approvedBy,
  } as Partial<AIPrompt>);
}

export async function archivePrompt(id: string): Promise<AIPrompt> {
  return updatePrompt(id, {
    status: 'archived',
    archived_at: new Date().toISOString(),
  } as Partial<AIPrompt>);
}

export async function createAuditEntry(entry: {
  prompt_id: string;
  action: string;
  changed_by?: string;
  old_value?: string;
  new_value?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('ai_prompt_audit')
    .insert(entry);
  if (error) throw error;
}

export async function fetchAuditLog(promptId?: string): Promise<AIPromptAudit[]> {
  let query = supabase
    .from('ai_prompt_audit')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (promptId) {
    query = query.eq('prompt_id', promptId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
