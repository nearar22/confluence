import { useCallback, useRef, useState } from 'react';
import { makeWalletClient, CONTRACT_ADDRESS, fetchStats, fetchAllSignals } from '../lib/contract.js';
import { pollUntilDecided } from '../lib/tx.js';

const INITIAL = { phase: 'idle', liveStatus: '', error: null, signal: null };

function friendlyError(e) {
  const s = String(e);
  if (/user rejected|denied/i.test(s)) return 'You declined the signature request.';
  if (/LackOfFundForMaxFee|insufficient/i.test(s))
    return 'Wallet balance is below the write fee reserve. Claim test GEN and retry.';
  if (/rate limit|429/i.test(s)) return 'The network is busy. Wait a moment and retry.';
  return 'The signal could not be posted. Please retry.';
}

// post_signal is deterministic and fast, but the SDK can still throw on the
// receipt while the tx is live, so success is confirmed by the signal count
// rising rather than by the writeContract return alone.
export function usePostSignal(onConfirmed) {
  const [state, setState] = useState(INITIAL);
  const busy = useRef(false);

  const reset = useCallback(() => {
    busy.current = false;
    setState(INITIAL);
  }, []);

  const post = useCallback(
    async (account, { name, offer, seek, manifesto, tags }) => {
      if (busy.current) return false;
      busy.current = true;
      setState({ ...INITIAL, phase: 'wallet' });

      let baseline = 0;
      try {
        baseline = (await fetchStats()).signals;
      } catch {
        baseline = 0;
      }

      const client = makeWalletClient(account);
      let hash = null;
      try {
        hash = await client.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: 'post_signal',
          args: [name, offer, seek, manifesto, tags],
          value: 0n,
        });
      } catch (e) {
        if (/user rejected|denied|LackOfFundForMaxFee|insufficient/i.test(String(e))) {
          setState((s) => ({ ...s, phase: 'error', error: friendlyError(e) }));
          busy.current = false;
          return false;
        }
        // Non-fatal: tx may still be live, fall through to state polling.
      }

      setState((s) => ({ ...s, phase: 'submitting' }));

      if (hash) {
        await pollUntilDecided(
          client,
          hash,
          (liveStatus) => setState((s) => ({ ...s, liveStatus })),
          { tries: 40, intervalMs: 4000 }
        );
      }

      for (let i = 0; i < 40; i++) {
        try {
          const stats = await fetchStats();
          if (stats.signals > baseline) {
            const all = await fetchAllSignals();
            const newest = all[all.length - 1] || null;
            setState((s) => ({ ...s, phase: 'confirmed', signal: newest }));
            onConfirmed?.(newest);
            busy.current = false;
            return true;
          }
        } catch {
          /* keep polling */
        }
        await new Promise((r) => setTimeout(r, 4000));
      }

      setState((s) => ({
        ...s,
        phase: 'error',
        error: 'The signal did not settle in time. It may still appear shortly.',
      }));
      busy.current = false;
      return false;
    },
    [onConfirmed]
  );

  return { state, post, reset };
}
