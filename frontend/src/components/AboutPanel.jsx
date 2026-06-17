import { Info, Copy, ExternalLink, Droplets, Check } from 'lucide-react';
import { useState } from 'react';
import Drawer from './ui/Drawer.jsx';
import {
  CONTRACT_ADDRESS,
  DEPLOY_TX,
  EXPLORER,
  FAUCET,
  NETWORK_NAME,
  CHAIN_ID,
  addressUrl,
  txUrl,
} from '../lib/contract.js';

const STEPS = [
  ['Post a signal', 'State what you offer, what you seek, and a short manifesto. It becomes a node.'],
  ['Forge a match', 'Pick two nodes. A GenLayer jury reads both and rules the collaboration fit.'],
  ['Read the verdict', 'The sealed match draws a glowing edge, colored by its fit band.'],
];

export default function AboutPanel({ open, onClose }) {
  const [copied, setCopied] = useState('');
  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  return (
    <Drawer open={open} onClose={onClose} side="right" width="max-w-md" label="About Confluence">
      <div className="p-6 pt-14">
        <div className="flex items-center gap-2 text-jade">
          <Info size={18} />
          <h2 className="font-display text-xl font-bold text-offwhite">About Confluence</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-offwhite-dim">
          Confluence is an AI collaboration matchmaker. Builders post signals, anyone forges a
          match between two of them, and a GenLayer jury rules their mutual fit. Sealed matches form
          an on-chain connection graph: signals are nodes, matches are edges.
        </p>

        <h3 className="mt-7 font-display text-sm font-semibold uppercase tracking-wide text-offwhite">
          How it works
        </h3>
        <ol className="mt-3 space-y-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-jade/40 bg-jade/10 font-mono text-xs text-jade">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-offwhite">{title}</p>
                <p className="text-xs text-offwhite-dim">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h3 className="mt-7 font-display text-sm font-semibold uppercase tracking-wide text-offwhite">
          Contract
        </h3>
        <div className="mt-3 space-y-2.5">
          <InfoRow label="Network">
            <span className="text-offwhite">
              {NETWORK_NAME} testnet, chain {CHAIN_ID}
            </span>
          </InfoRow>
          <CopyRow
            label="Address"
            value={CONTRACT_ADDRESS}
            href={addressUrl(CONTRACT_ADDRESS)}
            copied={copied === 'addr'}
            onCopy={() => copy(CONTRACT_ADDRESS, 'addr')}
          />
          <CopyRow
            label="Deploy tx"
            value={DEPLOY_TX}
            href={txUrl(DEPLOY_TX)}
            copied={copied === 'tx'}
            onCopy={() => copy(DEPLOY_TX, 'tx')}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={FAUCET}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-jade/40 bg-jade/10 px-5 py-2.5 text-sm font-semibold text-jade transition hover:bg-jade/20"
          >
            <Droplets size={16} />
            Claim test GEN from the faucet
          </a>
          <a
            href={EXPLORER}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-ink-line px-5 py-2.5 text-sm text-offwhite-dim transition hover:text-offwhite"
          >
            <ExternalLink size={16} />
            Open the block explorer
          </a>
        </div>
      </div>
    </Drawer>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink-line bg-ink/40 px-4 py-2.5 text-sm">
      <span className="text-offwhite-faint">{label}</span>
      {children}
    </div>
  );
}

function CopyRow({ label, value, href, copied, onCopy }) {
  return (
    <div className="rounded-xl border border-ink-line bg-ink/40 px-4 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-offwhite-faint">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="text-offwhite-faint transition hover:text-jade"
            aria-label={`Copy ${label}`}
          >
            {copied ? <Check size={14} className="text-jade" /> : <Copy size={14} />}
          </button>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-offwhite-faint transition hover:text-jade"
            aria-label={`Open ${label} on explorer`}
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
      <p className="mt-1 break-all font-mono text-xs text-offwhite-dim">{value}</p>
    </div>
  );
}
