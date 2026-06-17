import { Sparkles, Link2, AlertTriangle, Footprints, ArrowLeftRight } from 'lucide-react';
import Drawer from './ui/Drawer.jsx';
import BandTag from './ui/BandTag.jsx';
import ReadingBar from './ui/ReadingBar.jsx';
import { bandOf } from '../lib/contract.js';

// Match-read drawer: rationale, strengths, friction, first step, and the three
// readings (complementarity, resonance, friction).
export default function MatchDrawer({ open, onClose, match }) {
  const meta = match ? bandOf(match.band) : bandOf('partial');
  return (
    <Drawer open={open} onClose={onClose} side="right" width="max-w-lg" label="Match detail">
      {match && (
        <div className="p-6 pt-14">
          <div className="flex items-center gap-2 text-offwhite-faint">
            <Sparkles size={16} style={{ color: meta.color }} />
            <span className="font-mono text-xs uppercase tracking-wide">Sealed match {match.id}</span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-lg font-bold text-offwhite">{match.aName}</span>
            <ArrowLeftRight size={16} className="text-offwhite-faint" />
            <span className="font-display text-lg font-bold text-offwhite">{match.bName}</span>
          </div>

          <div className="mt-4">
            <BandTag band={match.band} size="lg" />
          </div>

          <div
            className="mt-6 space-y-4 rounded-2xl border p-5"
            style={{ borderColor: `${meta.color}33`, backgroundColor: `${meta.color}0a` }}
          >
            <ReadingBar
              label="Complementarity"
              value={match.complementarity}
              color="#34D399"
              hint="How well each side's offer meets the other's need"
            />
            <ReadingBar
              label="Resonance"
              value={match.resonance}
              color="#FBBF24"
              hint="How aligned their manifestos and values are"
            />
            <ReadingBar
              label="Friction"
              value={match.friction}
              color="#FB7185"
              hint="How much their goals or scope would clash"
            />
          </div>

          {match.rationale && (
            <Section title="Rationale">
              <p className="text-sm leading-relaxed text-offwhite-dim">{match.rationale}</p>
            </Section>
          )}

          {match.complementaryStrengths.length > 0 && (
            <Section title="Complementary strengths" icon={<Link2 size={15} className="text-jade" />}>
              <ul className="space-y-2">
                {match.complementaryStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-offwhite-dim">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-jade" />
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {match.frictionPoints.length > 0 && (
            <Section title="Friction points" icon={<AlertTriangle size={15} className="text-coral" />}>
              <ul className="space-y-2">
                {match.frictionPoints.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-offwhite-dim">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {match.firstStep && (
            <Section title="Suggested first step" icon={<Footprints size={15} className="text-amber" />}>
              <p className="rounded-xl border border-amber/30 bg-amber/5 p-4 text-sm leading-relaxed text-offwhite">
                {match.firstStep}
              </p>
            </Section>
          )}
        </div>
      )}
    </Drawer>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-offwhite">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
