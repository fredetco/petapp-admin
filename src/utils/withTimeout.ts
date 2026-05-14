/**
 * Race a promise against a timeout so a hung Supabase query surfaces
 * as a visible error instead of spinning forever.
 *
 * Supabase JS uses raw fetch() with no built-in timeout. If the
 * server stalls (RLS policy that hits a slow path, transient network
 * issue, edge function cold start) the request never resolves, React
 * Query stays in `pending`, and the user sees an infinite spinner.
 * This wrapper rejects after `ms` so the hook moves to `error` and
 * the page can render a Retry button.
 *
 * Note: this doesn't actually cancel the underlying fetch (Supabase
 * doesn't expose that cleanly from PostgrestFilterBuilder.then).
 * React Query just discards the late result when it arrives.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms / 1000}s. Network may be slow — try again.`)),
          ms
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Default timeout for admin queries. 8s is short enough that a
 *  stuck or schema-mismatch query surfaces in ~10s total (one
 *  attempt; we set retry:0 in App.tsx for admin queries). Slower
 *  than that and the user starts assuming it's hung. */
export const ADMIN_QUERY_TIMEOUT_MS = 8_000;
