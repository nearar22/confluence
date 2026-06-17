import { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { layoutNodes, buildEdges } from '../lib/graph.js';
import { bandOf } from '../lib/contract.js';
import { initials } from '../lib/format.js';

// The home surface: signal nodes positioned on an SVG canvas, sealed matches
// drawn as glowing edges colored by band. Selecting nodes drives the forge
// flow; clicking an edge opens the match read.
export default function ConstellationGraph({
  signals,
  matches,
  selectMode,
  selected,
  onToggleSelect,
  onOpenSignal,
  onOpenMatch,
  highlightMatchId,
}) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(320, r.width), h: Math.max(320, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const positions = useMemo(() => layoutNodes(signals), [signals]);
  const edges = useMemo(() => buildEdges(matches, positions), [matches, positions]);

  // Degree per node, to size the glow.
  const degree = useMemo(() => {
    const d = new Map();
    for (const m of matches) {
      d.set(m.a, (d.get(m.a) || 0) + 1);
      d.set(m.b, (d.get(m.b) || 0) + 1);
    }
    return d;
  }, [matches]);

  const px = (x) => x * size.w;
  const py = (y) => y * size.h;

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="absolute inset-0"
      >
        <defs>
          <filter id="edge-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* edges */}
        {edges.map(({ match, from, to }) => {
          const meta = bandOf(match.band);
          const active = highlightMatchId === match.id;
          return (
            <g key={match.id} className="cursor-pointer" onClick={() => onOpenMatch?.(match)}>
              <line
                x1={px(from.x)}
                y1={py(from.y)}
                x2={px(to.x)}
                y2={py(to.y)}
                stroke={meta.color}
                strokeWidth={active ? 5 : 3}
                strokeOpacity={0.5}
                filter="url(#edge-blur)"
              />
              <line
                x1={px(from.x)}
                y1={py(from.y)}
                x2={px(to.x)}
                y2={py(to.y)}
                stroke={meta.color}
                strokeWidth={active ? 2.2 : 1.4}
                strokeOpacity={0.95}
                strokeDasharray="6 6"
                className="animate-edge-flow"
              />
            </g>
          );
        })}

        {/* nodes */}
        {signals.map((sig) => {
          const p = positions.get(sig.id);
          if (!p) return null;
          const isSelected = selected?.includes(sig.id);
          const deg = degree.get(sig.id) || 0;
          const radius = 16 + Math.min(deg, 6) * 2.2;
          const color = isSelected ? '#34D399' : '#6EE7B7';
          return (
            <g
              key={sig.id}
              transform={`translate(${px(p.x)}, ${py(p.y)})`}
              className="cursor-pointer"
              onClick={() => (selectMode ? onToggleSelect?.(sig.id) : onOpenSignal?.(sig))}
            >
              <circle
                r={radius + 10}
                fill={color}
                opacity={isSelected ? 0.28 : 0.12}
                className={isSelected ? 'animate-pulse-glow' : ''}
              />
              <circle
                r={radius}
                fill="#0D1B16"
                stroke={color}
                strokeWidth={isSelected ? 3 : 1.6}
                style={{ filter: `drop-shadow(0 0 8px ${color}aa)` }}
              />
              <text
                textAnchor="middle"
                dy="0.34em"
                className="select-none font-mono"
                fontSize={radius > 20 ? 13 : 11}
                fill="#F4F7F4"
              >
                {initials(sig.name)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* node labels as positioned HTML for crisp text */}
      <div className="pointer-events-none absolute inset-0">
        {signals.map((sig) => {
          const p = positions.get(sig.id);
          if (!p) return null;
          const deg = degree.get(sig.id) || 0;
          const radius = 16 + Math.min(deg, 6) * 2.2;
          return (
            <motion.div
              key={sig.id}
              className="absolute -translate-x-1/2 whitespace-nowrap text-center"
              style={{ left: px(p.x), top: py(p.y) + radius + 12 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="rounded-full bg-ink/60 px-2 py-0.5 text-[11px] font-medium text-offwhite-dim backdrop-blur-sm">
                {sig.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
