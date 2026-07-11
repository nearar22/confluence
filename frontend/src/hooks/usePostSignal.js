import { useCallback, useRef, useState } from 'react';
import {
  makeWalletClient,
  CONTRACT_ADDRESS,
  CHAIN_ID,
  CHAIN_ID_HEX,
  BRADBURY_PARAMS,
  fetchStats,
  fetchAllSignals,
} from '../lib/contract.js';
import { pollUntilDecided } from '../lib/tx.js';

const INITIAL = { phase: 'idle', liveStatus: '', error: null, signal: null };

async function ensureBradbury() {
  const eth = typeof window !== 'undefined' ? window.ethereum : null;
  if (!eth) return;
  try {
    const cid = await eth.request({ method: 'eth_chainId' });
    if (parseInt(cid, 16) === CHAIN_ID) return;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX }],
      });
    } catch {
      await eth.request({ method: 'wallet_addEthereumChain', params: [BRADBURY_PARAMS] });
    }
  } catch (e) {
    console.error('chain switch error:', e);
  }
}

function friendlyError(e) {
  const s = String(e);
  if (/user rejected|denied/i.test(s)) return 'You declined the signature request.';
  if (/LackOfFundForMaxFee|insufficient/i.test(s))
    return 'Wallet balance is below the write fee reserve. Claim test GEN and retry.';
  if (/backpressure|not currently accepting|l1_sender_commit/i.test(s))
    return 'The Bradbury network is congested right now and is not accepting transactions. Wait a minute and retry.';
  if (/chain|network mismatch|wrong network|switch/i.test(s))
    return 'Your wallet is on the wrong network. Switch MetaMask to Bradbury and retry.';
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

      await ensureBradbury();

      let client;
      try {
        client = makeWalletClient(account);
      } catch (e) {
        setState((s) => ({ ...s, phase: 'error', error: friendlyError(e) }));
        busy.current = false;
        return false;
      }
      let hash = null;
      try {
        hash = await client.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: 'post_signal',
          args: [name, offer, seek, manifesto, tags],
          value: 0n,
        });
      } catch (e) {
        console.error('post_signal writeContract error:', e);
        if (
          /user rejected|denied|LackOfFundForMaxFee|insufficient/i.test(String(e)) ||
          /chain|network|provider|wallet/i.test(String(e)) ||
          /backpressure|not currently accepting|l1_sender_commit/i.test(String(e))
        ) {
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
