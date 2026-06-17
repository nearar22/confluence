import { motion } from 'framer-motion';
import { Check, Tag } from 'lucide-react';
import { initials } from '../lib/format.js';
import { RosterSkeleton } from './ui/Skeleton.jsx';

// Side roster listing all signals. In select mode it doubles as a checklist
// for the forge flow.
export default function Roster({ signals, loading, selectMode, selected, onToggleSelect, onOpenSignal }) {
  if (loading) return <RosterSkeleton />;

  if (signals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-line p-6 text-center">
        <p className="text-sm text-offwhite-dim">No signals yet.</p>
        <p className="mt-1 text-xs text-offwhite-faint">
          Compose the first signal to seed the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {signals.map((sig, i) => {
        const isSelected = selected?.includes(sig.id);
        return (
          <motion.button
            key={sig.id}
            type="button"
            onClick={() => (selectMode ? onToggleSelect?.(sig.id) : onOpenSignal?.(sig))}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
            whileHover={{ y: -2 }}
            className={`block w-full rounded-2xl border p-4 text-left transition ${
              isSelected
                ? 'border-jade/60 bg-jade/10 shadow-glow'
                : 'border-ink-line bg-ink-raised/40 hover:border-jade/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-jade/40 bg-ink font-mono text-xs text-jade-soft"
                style={{ boxShadow: '0 0 12px rgba(52,211,153,0.25)' }}
              >
                {isSelected ? <Check size={15} className="text-jade" /> : initials(sig.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-display text-sm font-semibold text-offwhite">
                    {sig.name}
                  </p>
                  <span className="shrink-0 font-mono text-[11px] text-offwhite-faint">
                    {sig.matches} {sig.matches === 1 ? 'edge' : 'edges'}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-offwhite-dim">
                  <span className="text-jade-soft">Offers</span> {sig.offer}
                </p>
                {sig.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sig.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-offwhite-faint"
                      >
                        <Tag size={9} />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
