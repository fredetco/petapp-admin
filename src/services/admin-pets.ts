/**
 * Admin queries against `pets` — all pets across all users, with
 * filters for species and owner. Relies on the same admin-readable
 * RLS policy used by analytics.ts.
 */
import { supabase } from './supabase';
import { withTimeout, ADMIN_QUERY_TIMEOUT_MS } from '../utils/withTimeout';

export interface AdminPetRow {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  photoUrl: string | null;
  passportId: string;
  ownerId: string;
  ownerName: string | null;
  createdAt: string;
}

export interface AdminPetFilters {
  species?: string;
  ownerId?: string;
  search?: string;
}

/**
 * Two-query approach: pull pets matching filters, then resolve owner
 * names from profiles in a single follow-up. PostgREST joins through
 * the FK work, but the response shape is fragile when nullable, so
 * we do the join client-side for clarity.
 */
export async function fetchAllPets(filters: AdminPetFilters = {}): Promise<AdminPetRow[]> {
  let q = supabase
    .from('pets')
    .select('id, name, species, breed, sex, photo_url, passport_id, owner_id, created_at')
    .order('created_at', { ascending: false });

  if (filters.species) q = q.eq('species', filters.species);
  if (filters.ownerId) q = q.eq('owner_id', filters.ownerId);
  if (filters.search) {
    // ILIKE on name OR passport_id. PostgREST `or` filter is the
    // canonical way to express disjunction.
    const term = `%${filters.search.replace(/[%_]/g, '\\$&')}%`;
    q = q.or(`name.ilike.${term},passport_id.ilike.${term}`);
  }

  const { data: pets, error } = await withTimeout(
    q,
    ADMIN_QUERY_TIMEOUT_MS,
    'Loading pets'
  );
  if (error) throw error;
  if (!pets || pets.length === 0) return [];

  const ownerIds = Array.from(new Set(pets.map((p) => p.owner_id)));
  const { data: owners, error: ownErr } = await withTimeout(
    supabase.from('profiles').select('id, name').in('id', ownerIds),
    ADMIN_QUERY_TIMEOUT_MS,
    'Resolving owners'
  );
  if (ownErr) throw ownErr;

  const ownerNameById = new Map<string, string | null>();
  for (const o of owners ?? []) ownerNameById.set(o.id, o.name);

  return pets.map((p) => ({
    id: p.id,
    name: p.name,
    species: p.species,
    breed: p.breed ?? '',
    sex: p.sex ?? 'unknown',
    photoUrl: p.photo_url,
    passportId: p.passport_id,
    ownerId: p.owner_id,
    ownerName: ownerNameById.get(p.owner_id) ?? null,
    createdAt: p.created_at,
  }));
}

/** Distinct species list for the filter dropdown. */
export async function fetchPetSpeciesList(): Promise<string[]> {
  const { data, error } = await withTimeout(
    supabase.from('pets').select('species'),
    ADMIN_QUERY_TIMEOUT_MS,
    'Loading species filter'
  );
  if (error) throw error;
  const set = new Set<string>();
  for (const p of data ?? []) if (p.species) set.add(p.species);
  return Array.from(set).sort();
}
