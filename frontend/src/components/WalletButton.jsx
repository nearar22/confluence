import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wallet, ChevronDown, LogOut, Droplets, ExternalLink, AlertTriangle } from 'lucide-react';
import { shortAddr } from '../lib/format.js';
import { FAUCET, EXPLORER, NETWORK_NAME, addressUrl } from '../lib/contract.js';

// Named MockWalletButton per spec, but this is a real MetaMask connection.
export default function MockWalletButton({ wallet }) {
  const { address, onRightChain, connecting, connect, disconnect, switchChain, error } = wallet;
  const [open, setOpen] = useState(false);

  if (!address) {
    return (
      <div className="flex flex-col items-end">
        <button
          type="button"
          onClick={connect}
          disabled={connecting}
          className="inline-flex items-center gap-2 rounded-full border border-jade/40 bg-jade/10 px-4 py-2 text-sm font-semibold text-jade transition hover:bg-jade/20 disabled:opacity-60"
        >
          <Wallet size={16} />
          {connecting ? 'Connecting' : 'Connect wallet'}
        </button>
        {error && <span className="mt-1 text-xs text-coral">{error}</span>}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-ink-line bg-ink-raised/70 px-3 py-2 text-sm text-offwhite transition hover:border-jade/40"
      >
        <span
          className={`h-2 w-2 rounded-full ${onRightChain ? 'bg-jade' : 'bg-amber'}`}
          style={{ boxShadow: onRightChain ? '0 0 8px #34D399' : '0 0 8px #FBBF24' }}
        />
        <span className="font-mono">{shortAddr(address)}</span>
        <ChevronDown size={14} className="text-offwhite-faint" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-ink-line bg-ink-raised/95 p-2 shadow-drawer backdrop-blur"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="px-3 py-2">
                <p className="text-xs text-offwhite-faint">Connected to</p>
                <p className="text-sm font-medium text-offwhite">{NETWORK_NAME} testnet</p>
              </div>

              {!onRightChain && (
                <button
                  type="button"
                  onClick={() => {
                    switchChain();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-amber transition hover:bg-amber/10"
                >
                  <AlertTriangle size={15} />
                  Switch to {NETWORK_NAME}
                </button>
              )}

              <a
                href={addressUrl(address)}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-offwhite-dim transition hover:bg-white/5 hover:text-offwhite"
              >
                <ExternalLink size={15} />
                View on explorer
              </a>

              <a
                href={FAUCET}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-offwhite-dim transition hover:bg-white/5 hover:text-offwhite"
              >
                <Droplets size={15} />
                Claim test GEN
              </a>

              <div className="my-1 h-px bg-ink-line" />
              <p className="truncate px-3 py-1 font-mono text-xs text-offwhite-faint">
                {address}
              </p>
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-coral transition hover:bg-coral/10"
              >
                <LogOut size={15} />
                Disconnect
              </button>
              <span className="sr-only">{EXPLORER}</span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
