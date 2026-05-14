/**
 * Admin queries against `profiles` + related tables.
 *
 * Relies on an admin-readable RLS policy on `profiles` and `pets` —
 * already in use by analytics.ts (DashboardStats counts across all
 * users). Email lives in auth.users and is not queryable from the
 * browser without service_role; we surface what profiles has and
 * leave email out until we add a SECURITY DEFINER RPC.
 */
import { supabase } from './supabase';
import { withTimeout, ADMIN_QUERY_TIMEOUT_MS } from '../utils/withTimeout';

export interface UserListEntry {
  id: string;
  name: string | null;
  language: string;
  timezone: string;
  onboardingComplete: boolean;
  createdAt: string;
  petCount: number;
  suspendedAt: string | null;
  deletedAt: string | null;
}

export interface UserDetail {
  id: string;
  name: string | null;
  language: string;
  reminderFrequency: string;
  timezone: string;
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  location: { city?: string; region?: string; country?: string } | null;
  createdAt: string;
  updatedAt: string;
  petCount: number;
  taskCount: number;
  careLogCount: number;
  carePlanCount: number;
  suspendedAt: string | null;
  deletedAt: string | null;
}

export interface UserPetSummary {
  id: string;
  name: string;
  species: string;
  breed: string;
  photoUrl: string | null;
  createdAt: string;
}

/**
 * Two-query approach: pull all profiles, then bulk-count pets per
 * owner. Avoids per-row roundtrips and the awkwardness of a
 * count-via-relationship query.
 */
export async function fetchAllUsers(opts: { includeDeleted?: boolean } = {}): Promise<UserListEntry[]> {
  let q = supabase
    .from('profiles')
    .select('id, name, language, timezone, onboarding_complete, created_at, suspended_at, deleted_at')
    .order('created_at', { ascending: false });
  if (!opts.includeDeleted) q = q.is('deleted_at', null);
  const { data: profiles, error } = await withTimeout(q, ADMIN_QUERY_TIMEOUT_MS, 'Loading users');
  if (error) throw error;

  // Bulk pet count: SELECT owner_id, then count client-side. The
  // alternative (.select('id, pets(count)')) needs a relationship FK
  // hint and is finicky.
  const { data: pets, error: petsErr } = await withTimeout(
    supabase.from('pets').select('owner_id'),
    ADMIN_QUERY_TIMEOUT_MS,
    'Counting pets per user'
  );
  if (petsErr) throw petsErr;

  const petCountByOwner = new Map<string, number>();
  for (const p of pets ?? []) {
    petCountByOwner.set(p.owner_id, (petCountByOwner.get(p.owner_id) ?? 0) + 1);
  }

  return (profiles ?? []).map((p: {
    id: string;
    name: string | null;
    language: string | null;
    timezone: string | null;
    onboarding_complete: boolean | null;
    created_at: string;
    suspended_at: string | null;
    deleted_at: string | null;
  }) => ({
    id: p.id,
    name: p.name,
    language: p.language ?? 'en',
    timezone: p.timezone ?? 'America/Toronto',
    onboardingComplete: p.onboarding_complete ?? false,
    createdAt: p.created_at,
    petCount: petCountByOwner.get(p.id) ?? 0,
    suspendedAt: p.suspended_at,
    deletedAt: p.deleted_at,
  }));
}

export async function fetchUserDetail(userId: string): Promise<UserDetail | null> {
  const { data: profile, error } = await withTimeout(
    supabase.from('profiles').select('*').eq('id', userId).single(),
    ADMIN_QUERY_TIMEOUT_MS,
    'Loading user profile'
  );
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Parallel count queries — head: true means we get only the count.
  const [petCount, taskCount, careLogCount, carePlanCount] = await withTimeout(
    Promise.all([
      supabase.from('pets').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase.from('care_log_entries').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase.from('care_plans').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    ]),
    ADMIN_QUERY_TIMEOUT_MS,
    'Loading activity counts'
  );

  return {
    id: profile.id,
    name: profile.name,
    language: profile.language ?? 'en',
    reminderFrequency: profile.reminder_frequency ?? 'normal',
    timezone: profile.timezone ?? 'America/Toronto',
    onboardingComplete: profile.onboarding_complete ?? false,
    notificationsEnabled: profile.notifications_enabled ?? false,
    location: profile.location ?? null,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    petCount: petCount.count ?? 0,
    taskCount: taskCount.count ?? 0,
    careLogCount: careLogCount.count ?? 0,
    carePlanCount: carePlanCount.count ?? 0,
    suspendedAt: profile.suspended_at ?? null,
    deletedAt: profile.deleted_at ?? null,
  };
}

// ─── Mutations ───────────────────────────────────────────────

export interface UserEditPayload {
  name: string | null;
  language: string;
  reminderFrequency: string;
  timezone: string;
  notificationsEnabled: boolean;
}

export async function updateUserProfile(userId: string, p: UserEditPayload): Promise<void> {
  const { error } = await withTimeout(
    supabase
      .from('profiles')
      .update({
        name: p.name,
        language: p.language,
        reminder_frequency: p.reminderFrequency,
        timezone: p.timezone,
        notifications_enabled: p.notificationsEnabled,
      })
      .eq('id', userId),
    ADMIN_QUERY_TIMEOUT_MS,
    'Saving user'
  );
  if (error) throw error;
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<void> {
  const { error } = await withTimeout(
    supabase
      .from('profiles')
      .update({ suspended_at: suspended ? new Date().toISOString() : null })
      .eq('id', userId),
    ADMIN_QUERY_TIMEOUT_MS,
    suspended ? 'Suspending user' : 'Unsuspending user'
  );
  if (error) throw error;
}

export async function softDeleteUser(userId: string): Promise<void> {
  // Soft delete — sets deleted_at. Auth row remains; the user-app
  // side will need to enforce "deleted profile = forced sign-out"
  // when that's added.
  const { error } = await withTimeout(
    supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        suspended_at: new Date().toISOString(), // implicit suspend
      })
      .eq('id', userId),
    ADMIN_QUERY_TIMEOUT_MS,
    'Deleting user'
  );
  if (error) throw error;
}

export async function restoreUser(userId: string): Promise<void> {
  const { error } = await withTimeout(
    supabase
      .from('profiles')
      .update({ deleted_at: null, suspended_at: null })
      .eq('id', userId),
    ADMIN_QUERY_TIMEOUT_MS,
    'Restoring user'
  );
  if (error) throw error;
}

export async function fetchPetsForUser(userId: string): Promise<UserPetSummary[]> {
  const { data, error } = await withTimeout(
    supabase
      .from('pets')
      .select('id, name, species, breed, photo_url, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true }),
    ADMIN_QUERY_TIMEOUT_MS,
    "Loading user's pets"
  );
  if (error) throw error;

  return (data ?? []).map((p: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    photo_url: string | null;
    created_at: string;
  }) => ({
    id: p.id,
    name: p.name,
    species: p.species,
    breed: p.breed ?? '',
    photoUrl: p.photo_url,
    createdAt: p.created_at,
  }));
}
