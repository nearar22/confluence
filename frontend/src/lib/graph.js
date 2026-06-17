// Deterministic graph layout. Signal nodes are placed on a circle (or a
// gentle phyllotaxis spiral for larger sets) so positions stay stable across
// re-renders without a physics simulation. Match edges connect node pairs.

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

// Returns a Map of signalId -> { x, y } in a normalized 0..1 space.
export function layoutNodes(signals) {
  const positions = new Map();
  const n = signals.length;
  if (n === 0) return positions;

  const cx = 0.5;
  const cy = 0.5;

  if (n === 1) {
    positions.set(signals[0].id, { x: cx, y: cy });
    return positions;
  }

  // Golden-angle spiral keeps nodes spread and stable; jitter keyed off id
  // avoids perfectly mechanical placement without being random per render.
  const golden = Math.PI * (3 - Math.sqrt(5));
  const maxR = 0.4;
  signals.forEach((sig, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    const radius = maxR * Math.sqrt(0.12 + 0.88 * t);
    const angle = i * golden + hashStr(sig.id) * 0.6;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    positions.set(sig.id, { x, y });
  });
  return positions;
}

// Builds drawable edges from matches, skipping any whose endpoints are missing.
export function buildEdges(matches, positions) {
  const edges = [];
  for (const m of matches) {
    const pa = positions.get(m.a);
    const pb = positions.get(m.b);
    if (!pa || !pb) continue;
    edges.push({ match: m, from: pa, to: pb });
  }
  return edges;
}
