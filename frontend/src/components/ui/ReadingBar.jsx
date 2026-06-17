import { motion } from 'framer-motion';

// A labelled 0-100 reading rendered as a glowing meter.
export default function ReadingBar({ label, value, color = '#34D399', hint }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-offwhite-dim">{label}</span>
        <span className="font-mono text-sm font-semibold text-offwhite font-numeric">{pct}</span>
      </div>
      {hint && <p className="mt-0.5 text-xs text-offwhite-faint">{hint}</p>}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}88` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
