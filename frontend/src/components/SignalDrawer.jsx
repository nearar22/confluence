import { Radio, Tag, Zap, ExternalLink, Hash } from 'lucide-react';
import Drawer from './ui/Drawer.jsx';
import { initials, shortAddr } from '../lib/format.js';
import { addressUrl } from '../lib/contract.js';

// Read view for a single signal node, with a shortcut into the forge flow.
export default function SignalDrawer({ open, onClose, signal, connectedMatches, onForgeFrom, onOpenMatch }) {
  return (
    <Drawer open={open} onClose={onClose} side="right" label="Signal detail">
      {signal && (
        <div className="p-6 pt-14">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full border border-jade/50 bg-ink font-mono text-jade-soft"
              style={{ boxShadow: '0 0 16px rgba(52,211,153,0.3)' }}
            >
              {initials(signal.name)}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-offwhite">{signal.name}</h2>
              <span className="font-mono text-xs text-offwhite-faint">{signal.id}</span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Block label="Offers" tone="jade">
              {signal.offer}
            </Block>
            <Block label="Seeks" tone="amber">
              {signal.seek}
            </Block>
            {signal.manifesto && (
              <Block label="Manifesto" tone="coral">
                {signal.manifesto}
              </Block>
            )}
          </div>

          {signal.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {signal.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-offwhite-dim"
                >
                  <Tag size={11} />
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between rounded-xl border border-ink-line bg-ink/40 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-offwhite-dim">
              <Hash size={14} />
              {signal.matches} {signal.matches === 1 ? 'connection' : 'connections'}
            </span>
            <a
              href={addressUrl(signal.author)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 font-mono text-xs text-offwhite-faint transition hover:text-jade"
            >
              {shortAddr(signal.author)}
              <ExternalLink size={12} />
            </a>
          </div>

          <button
            type="button"
            onClick={() => onForgeFrom?.(signal)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-5 py-2.5 text-sm font-semibold text-amber transition hover:bg-amber/20"
          >
            <Zap size={16} />
            Forge a match from here
          </button>

          {connectedMatches?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-offwhite">
                <Radio size={15} className="text-jade" />
                Sealed connections
              </h3>
              <div className="space-y-2">
                {connectedMatches.map((m) => {
                  const other = m.a === signal.id ? m.bName : m.aName;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onOpenMatch?.(m)}
                      className="flex w-full items-center justify-between rounded-xl border border-ink-line bg-ink-raised/40 px-4 py-2.5 text-left text-sm transition hover:border-jade/30"
                    >
                      <span className="text-offwhite-dim">{other}</span>
                      <span className="font-mono text-xs capitalize text-offwhite-faint">
                        {m.band}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function Block({ label, tone, children }) {
  const color = tone === 'jade' ? '#34D399' : tone === 'amber' ? '#FBBF24' : '#FB7185';
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
        {label}
      </span>
      <p className="mt-1 text-sm leading-relaxed text-offwhite-dim">{children}</p>
    </div>
  );
}
