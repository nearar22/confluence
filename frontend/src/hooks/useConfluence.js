import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAllSignals, fetchAllMatches } from '../lib/contract.js';

// Loads the full graph (signals + matches) and refreshes on a slow interval.
// Reads are wrapped in retry/backoff inside the lib layer.
export function useConfluence(pollMs = 30000) {
  const [signals, setSignals] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [sigs, mts] = await Promise.all([fetchAllSignals(), fetchAllMatches()]);
      if (!mounted.current) return;
      setSignals(sigs);
      setMatches(mts);
      setError(null);
      setLastUpdated(Date.now());
    } catch (e) {
      if (!mounted.current) return;
      setError('The graph could not be read from the chain. Retrying shortly.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(false);
    const id = setInterval(() => load(true), pollMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load, pollMs]);

  const stats = {
    signals: signals.length,
    matches: matches.length,
  };

  return { signals, matches, stats, loading, error, lastUpdated, refresh: () => load(true) };
}
