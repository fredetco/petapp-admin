import { supabase } from './supabase';

export interface DashboardStats {
  totalUsers: number;
  totalPets: number;
  activePrompts: number;
  totalTemplates: number;
}

export interface SpeciesDistribution {
  species: string;
  count: number;
}

export interface AuditLogEntry {
  id: string;
  prompt_id: string;
  action: string;
  changed_by: string | null;
  created_at: string;
  prompt_title?: string;
  admin_name?: string;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [usersRes, petsRes, promptsRes, templatesRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('pets').select('id', { count: 'exact', head: true }),
    supabase.from('ai_prompts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('species_care_templates').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    totalPets: petsRes.count ?? 0,
    activePrompts: promptsRes.count ?? 0,
    totalTemplates: templatesRes.count ?? 0,
  };
}

export async function fetchSpeciesDistribution(): Promise<SpeciesDistribution[]> {
  const { data, error } = await supabase.from('pets').select('species');
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const species = row.species || 'unknown';
    counts[species] = (counts[species] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([species, count]) => ({ species, count }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchRecentAuditLog(): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('ai_prompt_audit')
    .select(`
      id,
      prompt_id,
      action,
      changed_by,
      created_at,
      ai_prompts ( title ),
      admin_users ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    prompt_id: row.prompt_id,
    action: row.action,
    changed_by: row.changed_by,
    created_at: row.created_at,
    prompt_title: row.ai_prompts?.title || 'Unknown',
    admin_name: row.admin_users?.name || 'System',
  }));
}
