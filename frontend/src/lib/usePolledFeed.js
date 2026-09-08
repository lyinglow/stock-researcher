import { useEffect, useRef, useState } from "react";

const POLL_MS = 10000;
const MAX_POLLS = 30; // web search generation can take several minutes

/** Polls a background-generated feed (e.g. GET /api/discover, /api/themes)
 * until it stops returning `pending`. `loading` starts true so callers can
 * show a working state immediately on mount, rather than waiting for the
 * first round trip - which can itself take a while if the free backend is
 * cold-starting. */
export default function usePolledFeed(fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const pollCount = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchFn();
        if (cancelled) return;
        if (result.pending) {
          if (pollCount.current < MAX_POLLS) {
            setData(result);
            pollCount.current += 1;
            timerRef.current = setTimeout(load, POLL_MS);
          } else {
            setLoading(false);
            setFailed(true);
          }
        } else {
          setData(result);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setFailed(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchFn]);

  return { data, loading, failed };
}
