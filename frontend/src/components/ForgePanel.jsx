import { Zap, Loader2, CheckCircle2, AlertCircle, Wallet, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Drawer from './ui/Drawer.jsx';
import { useForgeMatch } from '../hooks/useForgeMatch.js';
import { initials } from '../lib/format.js';

// The forge flow: two selected signals, then a consensus loading state while a
// GenLayer jury rules their fit. Success is confirmed by the match count rise.
export default function ForgePanel({ open, onClose, wallet, signalA, signalB, onForged }) {
  const { state, forge, reset } = useForgeMatch((m) => onForged?.(m));
  const busy = state.phase === 'wallet' || state.phase === 'consensus';

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (!wallet.address) {
      wallet.connect();
      return;
    }
    if (!signalA || !signalB) return;
    await forge(wallet.address, signalA.id, signalB.id);
  };

  return (
    <Drawer open={open} onClose={handleClose} side="right" label="Forge match">
      <div className="p-6 pt-14">
        <div className="flex items-center gap-2 text-amber">
          <Zap size={18} />
          <h2 className="font-display text-xl font-bold text-offwhite">Forge a match</h2>
        </div>
        <p className="mt-1.5 text-sm text-offwhite-dim">
          A GenLayer jury reads both signals and rules their collaboration fit. This is an AI
          consensus write and can take one to five minutes.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <NodeChip signal={signalA} />
          <ArrowLeftRight size={18} className="shrink-0 text-offwhite-faint" />
          <NodeChip signal={signalB} />
        </div>

        {state.phase === 'confirmed' ? (
          <div className="mt-8 rounded-2xl border border-jade/40 bg-jade/10 p-6 text-center animate-drift-in">
            <CheckCircle2 className="mx-auto text-jade" size={36} />
            <p className="mt-3 font-display text-lg font-semibold text-offwhite">Match sealed</p>
            <p className="mt-1 text-sm text-offwhite-dim">
              A new edge now connects these signals on the graph.
            </p>
            <button
              type="button"
              onClick={() => {
                if (state.match) onForged?.(state.match, true);
                handleClose();
              }}
              className="mt-5 rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-sm font-semibold text-jade transition hover:bg-jade/20"
            >
              Read the verdict
            </button>
          </div>
        ) : busy ? (
          <ConsensusState phase={state.phase} liveStatus={state.liveStatus} />
        ) : (
          <div className="mt-8 space-y-4">
            {state.phase === 'error' && (
              <div className="flex items-start gap-2 rounded-xl border border-coral/40 bg-coral/10 p-3 text-sm text-coral-soft">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!signalA || !signalB}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-semibold text-ink-deep transition hover:bg-amber-soft disabled:opacity-50"
            >
              {!wallet.address ? (
                <>
                  <Wallet size={16} />
                  Connect wallet to forge
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Forge this match
                </>
              )}
            </button>
            <p className="text-center text-xs text-offwhite-faint">
              The flow confirms success by watching the on-chain match count rise, so a slow
              receipt will not lose your verdict.
            </p>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function NodeChip({ signal }) {
  if (!signal) {
    return (
      <div className="flex flex-1 flex-col items-center rounded-2xl border border-dashed border-ink-line p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-line text-offwhite-faint">
          ?
        </div>
        <span className="mt-2 text-xs text-offwhite-faint">Pick a node</span>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl border border-jade/30 bg-jade/5 p-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border border-jade/50 bg-ink font-mono text-sm text-jade-soft"
        style={{ boxShadow: '0 0 12px rgba(52,211,153,0.3)' }}
      >
        {initials(signal.name)}
      </div>
      <span className="mt-2 line-clamp-1 text-center text-xs font-medium text-offwhite">
        {signal.name}
      </span>
    </div>
  );
}

function ConsensusState({ phase, liveStatus }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border border-amber/30 bg-amber/5 p-8 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-amber/30 border-t-amber"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
        <Loader2 size={28} className="animate-spin text-amber" />
      </div>
      <p className="mt-5 font-display text-lg font-semibold text-offwhite">
        {phase === 'wallet' ? 'Confirm in your wallet' : 'Jury in session'}
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-offwhite-dim">
        {phase === 'wallet'
          ? 'Approve the transaction to open the consensus round.'
          : 'Validators are reading both signals and converging on a fit band. This can take a few minutes.'}
      </p>
      {liveStatus && (
        <span className="mt-4 rounded-full border border-ink-line bg-ink/60 px-3 py-1 font-mono text-xs text-amber-soft">
          {liveStatus}
        </span>
      )}
    </div>
  );
}
