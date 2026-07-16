/**
 * apiClient — drop-in replacement for the supabase-js client, backed by
 * our self-hosted PHP API (https://app.myzoo.ai/api → PlanetHoster N0C).
 *
 * Implements exactly the subset of the supabase-js surface the three
 * MyZoo apps use (audited in ARCHITECTURE-SELFHOST.md):
 *
 *   supabase.from(t).select/insert/update/upsert/delete
 *     .eq .neq .gt .gte .lt .lte .like .ilike .in .is .not .contains .or .match
 *     .order .limit .single .maybeSingle  (+ count:'exact', head:true)
 *   supabase.rpc(name, args)
 *   supabase.auth.{getSession,getUser,signUp,signInWithPassword,
 *     signInWithOtp,signInWithOAuth,signOut,onAuthStateChange}
 *   supabase.storage.from(bucket).{upload,getPublicUrl}
 *   supabase.channel(...).on(...).subscribe() — no-op stub (realtime → none)
 *   supabase.functions.invoke(name, {body})
 *
 * Queries serialize to a JSON AST → POST /api/db. The server validates
 * tables/columns/ops against a whitelist and applies the policy engine
 * (replaces RLS). See server-api/lib/query.php for the AST contract.
 */

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://app.myzoo.ai/api';

// ── Types (mirror the supabase-js shapes the apps consume) ──

export interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  // Index signatures are `any` to match supabase-js's User metadata typing —
  // call sites do `user_metadata.name || ''` and similar.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  user_metadata: { full_name?: string | null; [k: string]: any };
  app_metadata: { provider?: string; is_admin?: boolean; [k: string]: any };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  created_at: string | null;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  /** Unix seconds when the access token expires. */
  expires_at: number;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
  status?: number;
}

type Result<T> = { data: T; error: null } | { data: null; error: ApiError };

/** Query results carry loosely-typed rows — mirrors the untyped
 *  supabase-js client the app was written against: lists are `any[]`
 *  (so callback params stay contextually typed), single() is `any`. */
type QueryResult<TData> = { data: TData | null; error: ApiError | null; count: number | null };

type AuthChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED';

// ── Session store ──

const SESSION_KEY = 'myzoo_session';

let currentSession: Session | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>();
/** Set when a session was just consumed from the URL hash so the first
 *  subscriber (AuthCallback) receives SIGNED_IN instead of INITIAL_SESSION. */
let pendingSignedInEvent = false;

function decodeJwtExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : Math.floor(Date.now() / 1000) + 3600;
  } catch {
    return Math.floor(Date.now() / 1000) + 3600;
  }
}

function persistSession(s: Session | null): void {
  currentSession = s;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* storage full/blocked — session stays in memory */ }
  scheduleRefresh();
}

function loadSession(): void {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) currentSession = JSON.parse(raw) as Session;
  } catch { currentSession = null; }
}

function emit(event: AuthChangeEvent, session: Session | null): void {
  listeners.forEach((cb) => {
    try { cb(event, session); } catch { /* listener errors are theirs */ }
  });
}

function scheduleRefresh(): void {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
  if (!currentSession) return;
  const msUntil = (currentSession.expires_at - 60) * 1000 - Date.now();
  refreshTimer = setTimeout(() => { void refreshSession(); }, Math.max(5_000, msUntil));
}

/**
 * Single-flight refresh. The server ROTATES refresh tokens (old one is
 * revoked the moment a new one is issued), so concurrent refresh calls
 * — e.g. several queries booting at once with an expired access token —
 * must share one request. Without this, the losers get 401 on the
 * now-revoked token and would wrongly clear the winner's fresh session.
 */
let refreshInFlight: Promise<Session | null> | null = null;

function refreshSession(): Promise<Session | null> {
  if (refreshInFlight) return refreshInFlight;
  const attempted = currentSession?.refresh_token;
  if (!attempted) return Promise.resolve(null);

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: attempted }),
      });
      if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
      const body = await res.json();
      const session = sessionFromTokens(body);
      persistSession(session);
      emit('TOKEN_REFRESHED', session);
      return session;
    } catch {
      // Only sign out if nothing replaced the token we tried — never
      // clobber a session someone else just established.
      if (currentSession?.refresh_token === attempted) {
        persistSession(null);
        emit('SIGNED_OUT', null);
      }
      return currentSession;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function sessionFromTokens(body: {
  access_token: string; refresh_token: string; user: User;
}): Session {
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_at: decodeJwtExp(body.access_token),
    user: body.user,
  };
}

/** Magic-link + Google OAuth land on /auth/callback#access_token=…&refresh_token=… */
function detectSessionInUrl(): void {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash;
  if (!hash.includes('access_token=')) return;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const access = params.get('access_token');
  const refresh = params.get('refresh_token');
  if (!access || !refresh) return;

  // Strip tokens from the URL before anything can log it.
  history.replaceState(null, '', window.location.pathname + window.location.search);

  // We only have tokens — fetch the user, THEN persist + announce.
  // Never emit SIGNED_IN with a user-less session: AuthContext consumers
  // treat session.user as authoritative and would bounce to /auth.
  const provisional: Session = {
    access_token: access,
    refresh_token: refresh,
    expires_at: decodeJwtExp(access),
    user: null as unknown as User,
  };
  currentSession = provisional; // lets apiFetch attach the token meanwhile

  void fetch(`${API_URL}/auth/user`, {
    headers: { Authorization: `Bearer ${access}` },
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((body: { user: User }) => {
      persistSession({ ...provisional, user: body.user });
      pendingSignedInEvent = true; // late subscribers still get SIGNED_IN
      emit('SIGNED_IN', currentSession);
    })
    .catch(() => {
      currentSession = null;
    });
}

// ── HTTP core ──

async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (currentSession && Date.now() / 1000 > currentSession.expires_at - 15 && retry) {
    await refreshSession(); // token about to expire — refresh proactively
  }
  if (currentSession?.access_token) {
    headers.set('Authorization', `Bearer ${currentSession.access_token}`);
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401 && retry && currentSession?.refresh_token) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch(path, init, false);
  }
  return res;
}

async function toResult<T>(res: Response, map406ToPgrst = false): Promise<Result<T>> {
  let body: Record<string, unknown> = {};
  try { body = await res.json(); } catch { /* non-JSON error */ }
  if (!res.ok) {
    const code = (body.code as string) || undefined;
    return {
      data: null,
      error: {
        message: (body.error as string) || `HTTP ${res.status}`,
        // supabase-js signals "single() found no rows" as PGRST116 and the
        // apps check for exactly that string — translate our 406/no_rows.
        code: map406ToPgrst && res.status === 406 && code === 'no_rows' ? 'PGRST116' : code,
        status: res.status,
      },
    };
  }
  return { data: (body.data ?? null) as T, error: null };
}

// ── Query builder ──

type FilterTriple = [string, string, unknown];

/* eslint-disable @typescript-eslint/no-explicit-any */
class QueryBuilder<TData = any[]> implements PromiseLike<QueryResult<TData>> {
  private ast: {
    table: string;
    op: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
    columns?: string;
    filters: FilterTriple[];
    order?: { column: string; ascending: boolean }[];
    limit?: number;
    single?: true | 'maybe';
    count?: 'exact';
    head?: true;
    values?: unknown;
    onConflict?: string;
  };

  constructor(table: string) {
    this.ast = { table, op: 'select', filters: [] };
  }

  select(columns = '*', opts?: { count?: 'exact'; head?: boolean }): this {
    // After a write, .select() only sets the RETURNING column list.
    this.ast.columns = columns;
    if (opts?.count) this.ast.count = opts.count;
    if (opts?.head) this.ast.head = true;
    return this;
  }

  insert(values: unknown): this { this.ast.op = 'insert'; this.ast.values = values; return this; }
  update(values: unknown): this { this.ast.op = 'update'; this.ast.values = values; return this; }
  upsert(values: unknown, opts?: { onConflict?: string }): this {
    this.ast.op = 'upsert'; this.ast.values = values;
    if (opts?.onConflict) this.ast.onConflict = opts.onConflict;
    return this;
  }
  delete(): this { this.ast.op = 'delete'; return this; }

  eq(c: string, v: unknown): this { this.ast.filters.push(['eq', c, v]); return this; }
  neq(c: string, v: unknown): this { this.ast.filters.push(['neq', c, v]); return this; }
  gt(c: string, v: unknown): this { this.ast.filters.push(['gt', c, v]); return this; }
  gte(c: string, v: unknown): this { this.ast.filters.push(['gte', c, v]); return this; }
  lt(c: string, v: unknown): this { this.ast.filters.push(['lt', c, v]); return this; }
  lte(c: string, v: unknown): this { this.ast.filters.push(['lte', c, v]); return this; }
  like(c: string, v: string): this { this.ast.filters.push(['like', c, v]); return this; }
  ilike(c: string, v: string): this { this.ast.filters.push(['ilike', c, v]); return this; }
  in(c: string, v: unknown[]): this { this.ast.filters.push(['in', c, v]); return this; }
  is(c: string, v: null | boolean): this { this.ast.filters.push(['is', c, v]); return this; }
  not(c: string, op: string, v: unknown): this {
    if (op === 'is') { this.ast.filters.push(['not_is', c, v]); return this; }
    throw new Error(`not(${op}) is not supported by the MyZoo API client`);
  }
  contains(c: string, v: unknown): this { this.ast.filters.push(['contains', c, v]); return this; }
  or(expr: string): this { this.ast.filters.push(['or', '', expr]); return this; }
  match(obj: Record<string, unknown>): this {
    for (const [c, v] of Object.entries(obj)) this.eq(c, v);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    (this.ast.order ??= []).push({ column, ascending: opts?.ascending ?? true });
    return this;
  }
  limit(n: number): this { this.ast.limit = n; return this; }
  range(from: number, to: number): this {
    if (from !== 0) throw new Error('range() with non-zero offset is not supported');
    this.ast.limit = to - from + 1;
    return this;
  }
  single(): QueryBuilder<any> {
    this.ast.single = true;
    return this as unknown as QueryBuilder<any>;
  }
  maybeSingle(): QueryBuilder<any> {
    this.ast.single = 'maybe';
    return this as unknown as QueryBuilder<any>;
  }

  private async execute(): Promise<QueryResult<TData>> {
    // Server rejects '' as a column for or(); it expects the triple value only.
    const ast = { ...this.ast, filters: this.ast.filters.map((f) => (f[0] === 'or' ? ['or', 'id', f[2]] : f)) };
    const res = await apiFetch('/db', { method: 'POST', body: JSON.stringify(ast) });
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
      const code = (body.code as string) || undefined;
      return {
        data: null,
        error: {
          message: (body.error as string) || `HTTP ${res.status}`,
          code: res.status === 406 && code === 'no_rows' ? 'PGRST116' : code,
          status: res.status,
        },
        count: null,
      };
    }
    return {
      data: (body.data ?? null) as TData | null,
      error: null,
      count: typeof body.count === 'number' ? body.count : null,
    };
  }

  then<R1 = QueryResult<TData>, R2 = never>(
    onfulfilled?: ((v: QueryResult<TData>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Realtime stub (Supabase channels → none; UI refreshes on navigation) ──

interface ChannelStub {
  on: (...args: unknown[]) => ChannelStub;
  subscribe: (cb?: (status: string) => void) => ChannelStub;
  unsubscribe: () => Promise<string>;
}

function makeChannel(): ChannelStub {
  const ch: ChannelStub = {
    on: () => ch,
    subscribe: (cb) => { cb?.('SUBSCRIBED'); return ch; },
    unsubscribe: () => Promise.resolve('ok'),
  };
  return ch;
}

// ── The client ──

export const supabase = {
  from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  },

  async rpc(name: string, args: Record<string, unknown> = {}): Promise<{ data: any; error: ApiError | null }> {
    const res = await apiFetch(`/rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
    return toResult(res);
  },

  auth: {
    async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
      if (currentSession && Date.now() / 1000 > currentSession.expires_at - 15) {
        await refreshSession();
      }
      return { data: { session: currentSession }, error: null };
    },

    async getUser(): Promise<{ data: { user: User | null }; error: ApiError | null }> {
      const { data: { session } } = await this.getSession();
      return { data: { user: session?.user ?? null }, error: null };
    },

    async signUp(opts: {
      email: string; password: string;
      options?: { data?: { full_name?: string }; captchaToken?: string };
    }): Promise<{ data: { user: User | null; session: Session | null }; error: ApiError | null }> {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: opts.email,
          password: opts.password,
          name: opts.options?.data?.full_name,
          captcha: opts.options?.captchaToken,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: { user: null, session: null }, error: { message: body.error || `HTTP ${res.status}`, code: body.code, status: res.status } };
      }
      return this._acceptTokens(body);
    },

    async signInWithPassword(opts: {
      email: string; password: string; options?: { captchaToken?: string };
    }): Promise<{ data: { user: User | null; session: Session | null }; error: ApiError | null }> {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: opts.email,
          password: opts.password,
          captcha: opts.options?.captchaToken,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: { user: null, session: null }, error: { message: body.error || `HTTP ${res.status}`, code: body.code, status: res.status } };
      }
      return this._acceptTokens(body);
    },

    async signInWithOtp(opts: {
      email: string;
      options?: { emailRedirectTo?: string; captchaToken?: string };
    }): Promise<{ data: Record<string, never>; error: ApiError | null }> {
      const res = await fetch(`${API_URL}/auth/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: opts.email,
          captcha: opts.options?.captchaToken,
          // Which SPA the magic link should land back on (validated server-side)
          redirect_to: opts.options?.emailRedirectTo || window.location.origin,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { data: {}, error: { message: body.error || `HTTP ${res.status}`, code: body.code, status: res.status } };
      return { data: {}, error: null };
    },

    async signInWithOAuth(opts: {
      provider: string; options?: { redirectTo?: string };
    }): Promise<{ data: { provider: string; url: string | null }; error: ApiError | null }> {
      if (opts.provider === 'google') {
        const back = opts.options?.redirectTo || window.location.origin;
        const url = `${API_URL}/auth/google/start?redirect=${encodeURIComponent(back)}`;
        window.location.assign(url);
        return { data: { provider: 'google', url }, error: null };
      }
      return {
        data: { provider: opts.provider, url: null },
        error: { message: `${opts.provider} sign-in is not configured yet` },
      };
    },

    async signOut(): Promise<{ error: ApiError | null }> {
      const refresh = currentSession?.refresh_token;
      persistSession(null);
      emit('SIGNED_OUT', null);
      if (refresh) {
        // Best-effort server-side revocation; local sign-out already done.
        void fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh }),
        }).catch(() => undefined);
      }
      return { error: null };
    },

    onAuthStateChange(
      cb: (event: AuthChangeEvent, session: Session | null) => void,
    ): { data: { subscription: { unsubscribe: () => void } } } {
      listeners.add(cb);
      // Mirror supabase-js: announce current state asynchronously on subscribe.
      setTimeout(() => {
        if (!listeners.has(cb)) return;
        // A session is only announced once it carries its user.
        const session = currentSession?.user ? currentSession : null;
        if (pendingSignedInEvent && session) {
          pendingSignedInEvent = false;
          cb('SIGNED_IN', session);
        } else {
          cb('INITIAL_SESSION', session);
        }
      }, 0);
      return { data: { subscription: { unsubscribe: () => { listeners.delete(cb); } } } };
    },

    /** Internal: store tokens from an auth response and fire SIGNED_IN. */
    _acceptTokens(body: { access_token?: string; refresh_token?: string; user?: User }): {
      data: { user: User | null; session: Session | null }; error: ApiError | null;
    } {
      if (!body.access_token || !body.refresh_token || !body.user) {
        return { data: { user: null, session: null }, error: { message: 'Malformed auth response' } };
      }
      const session = sessionFromTokens(body as { access_token: string; refresh_token: string; user: User });
      persistSession(session);
      emit('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File | Blob, _opts?: { upsert?: boolean; contentType?: string }) {
          const form = new FormData();
          form.append('bucket', bucket);
          form.append('path', path);
          form.append('file', file);
          const res = await apiFetch('/storage/upload', { method: 'POST', body: form });
          return toResult<{ path: string; fullPath: string; publicUrl: string }>(res);
        },
        getPublicUrl(path: string): { data: { publicUrl: string } } {
          return { data: { publicUrl: `${API_URL}/storage/${bucket}/${path}` } };
        },
      };
    },
  },

  functions: {
    async invoke(name: string, opts: { body?: unknown } = {}): Promise<{ data: any; error: ApiError | null }> {
      const res = await apiFetch(`/fn/${name}`, { method: 'POST', body: JSON.stringify(opts.body ?? {}) });
      const body = await res.json().catch(() => null);
      if (!res.ok) return { data: null, error: { message: 'Function error', status: res.status } };
      return { data: body, error: null };
    },
  },

  channel(_name: string): ChannelStub { return makeChannel(); },
  removeChannel(_ch: unknown): Promise<string> { return Promise.resolve('ok'); },
};

/** The API URL always has a default — the app is always "configured". */
export const isSupabaseConfigured = true;

// ── Module init ──
loadSession();
detectSessionInUrl();
scheduleRefresh();
