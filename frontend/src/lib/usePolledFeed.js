import { useEffect, useRef, useState } from "react";

const POLL_MS = 10000;
const MAX_POLLS = 48; // web search generation can take several minutes, longer for themes

/** Formats a seconds count as "0:45" or "3:12". */
export function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Polls a background-generated feed (e.g. GET /api/discover, /api/themes)
 * until it stops returning `pending`. `loading` starts true so callers can
 * show a working state immediately on mount, rather than waiting for the
 * first round trip - which can itself take a while if the free backend is
 * cold-starting. `elapsed` counts seconds since the wait started, so callers
 * can show progress without promising a finish time nobody can guarantee. */
export default function usePolledFeed(fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const pollCount = useRef(0);
  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const startRef = useRef(Date.now());
  const loadRef = useRef(null);
  const settledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    function stopTicking() {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }

    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

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
            settledRef.current = true;
            stopTicking();
          }
        } else {
          setData(result);
          setLoading(false);
          settledRef.current = true;
          stopTicking();
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setFailed(true);
          settledRef.current = true;
          stopTicking();
        }
      }
    }

    loadRef.current = load;
    load();

    // Backgrounded mobile tabs can have their timers throttled or frozen
    // outright, so a scan that finished minutes ago never gets picked up -
    // the page just sits on "Scanning..." indefinitely. Re-check the moment
    // the tab becomes visible again instead of waiting on a timer that may
    // never fire.
    function handleVisibility() {
      if (document.visibilityState === "visible" && !settledRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        loadRef.current();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      stopTicking();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchFn]);

  return { data, loading, failed, elapsed };
}
