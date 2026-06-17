import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// A slide-in panel anchored to a side of the viewport. Used for compose,
// match detail, and the about/help slide-over.
export default function Drawer({ open, onClose, side = 'right', width = 'max-w-md', children, label }) {
  const fromX = side === 'right' ? '100%' : '-100%';
  const anchor = side === 'right' ? 'right-0' : 'left-0';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-label={label}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="absolute inset-0 bg-ink-deep/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={`absolute top-0 ${anchor} flex h-full w-full ${width} flex-col border-l border-ink-line bg-ink-raised/95 shadow-drawer`}
            initial={{ x: fromX }}
            animate={{ x: 0 }}
            exit={{ x: fromX }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full border border-ink-line bg-ink/60 p-2 text-offwhite-dim transition hover:text-offwhite"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
            <div className="thin-scroll h-full overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
