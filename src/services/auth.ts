import { supabase, isSupabaseConfigured } from './supabase';
import type { AdminUser } from '../types/admin';

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

/** Fetch admin record for this user, or null if not an admin */
export async function fetchAdminUser(userId: string): Promise<AdminUser | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
