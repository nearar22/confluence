import { useCallback, useRef, useState } from 'react';
import { makeWalletClient, CONTRACT_ADDRESS, fetchStats, fetchAllMatches } from '../lib/contract.js';
import { pollUntilDecided } from '../lib/tx.js';

const INITIAL = { phase: 'idle', liveStatus: '', error: null, match: null };

function friendlyError(e) {
  const s = String(e);
  if (/user rejected|denied/i.test(s)) return 'You declined the signature request.';
  if (/LackOfFundForMaxFee|insufficient/i.test(s))
    return 'Wallet balance is below the AI-write fee reserve. Claim test GEN and retry.';
  if (/already matched/i.test(s)) return 'These two signals are already connected.';
  if (/rate limit|429/i.test(s)) return 'The jury is busy. Wait a moment and retry.';
  return 'The match could not be sealed. Please retry.';
}

// forge_match runs an AI consensus round (1-5 min). The installed SDK can
// throw on the submission receipt even though the tx is live, so success is
// confirmed by polling get_stats until the match count rises. Only user
// rejection and insufficient funds are treated as hard errors.
export function useForgeMatch(onConfirmed) {
  const [state, setState] = useState(INITIAL);
  const busy = useRef(false);

  const reset = useCallback(() => {
    busy.current = false;
    setState(INITIAL);
  }, []);

  const forge = useCallback(
    async (account, signalA, signalB) => {
      if (busy.current) return false;
      busy.current = true;
      setState({ ...INITIAL, phase: 'wallet' });

      let baseline = 0;
      try {
        baseline = (await fetchStats()).matches;
      } catch {
        baseline = 0;
      }

      const client = makeWalletClient(account);
      let hash = null;
      try {
        hash = await client.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: 'forge_match',
          args: [signalA, signalB],
          value: 0n,
        });
      } catch (e) {
        if (/user rejected|denied|LackOfFundForMaxFee|insufficient/i.test(String(e))) {
          setState((s) => ({ ...s, phase: 'error', error: friendlyError(e) }));
          busy.current = false;
          return false;
        }
        // Non-fatal throw: the consensus tx may still be live.
      }

      setState((s) => ({ ...s, phase: 'consensus' }));

      // Path A: poll the tx hash through non-terminal AI states to a verdict.
      if (hash) {
        await pollUntilDecided(client, hash, (liveStatus) =>
          setState((s) => ({ ...s, liveStatus }))
        );
      }

      // Path B: the count rising proves the edge landed regardless of SDK path.
      for (let i = 0; i < 90; i++) {
        try {
          const stats = await fetchStats();
          if (stats.matches > baseline) {
            const all = await fetchAllMatches();
            const newest = all[0] || null; // get_matches is newest first
            setState((s) => ({ ...s, phase: 'confirmed', match: newest }));
            onConfirmed?.(newest);
            busy.current = false;
            return true;
          }
        } catch {
          /* keep polling */
        }
        await new Promise((r) => setTimeout(r, 8000));
      }

      setState((s) => ({
        ...s,
        phase: 'error',
        error: 'The match did not settle in time. It may still appear in the graph shortly.',
      }));
      busy.current = false;
      return false;
    },
    [onConfirmed]
  );

  return { state, forge, reset };
}
