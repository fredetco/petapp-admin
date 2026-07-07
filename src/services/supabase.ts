/**
 * MyZoo Admin data client.
 *
 * Historically this exported a supabase-js client; it now re-exports the
 * self-hosted API shim (apiClient.ts) which speaks to our own PHP +
 * PostgreSQL backend on PlanetHoster. Import paths across the admin app
 * stay unchanged — the fluent query surface is identical.
 */
export { supabase, isSupabaseConfigured, API_URL } from './apiClient';
export type { Session, User, ApiError } from './apiClient';
