import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Radio, Zap, Info, X, GitBranch, Activity, Loader2 } from 'lucide-react';
import MeshGradient from './components/MeshGradient.jsx';
import MockWalletButton from './components/WalletButton.jsx';
import ConstellationGraph from './components/ConstellationGraph.jsx';
import Roster from './components/Roster.jsx';
import ComposeSignalPanel from './components/ComposeSignalPanel.jsx';
import ForgePanel from './components/ForgePanel.jsx';
import MatchDrawer from './components/MatchDrawer.jsx';
import SignalDrawer from './components/SignalDrawer.jsx';
import AboutPanel from './components/AboutPanel.jsx';
import { useWallet } from './hooks/useWallet.js';
import { useConfluence } from './hooks/useConfluence.js';
import { bandOf } from './lib/contract.js';

export default function App() {
  const wallet = useWallet();
  const { signals, matches, stats, loading, error, refresh } = useConfluence();

  const [composeOpen, setComposeOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activeMatch, setActiveMatch] = useState(null);
  const [activeSignal, setActiveSignal] = useState(null);
  const [highlightMatchId, setHighlightMatchId] = useState(null);

  // Forge selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [forgeOpen, setForgeOpen] = useState(false);

  const signalById = useMemo(() => {
    const m = new Map();
    signals.forEach((s) => m.set(s.id, s));
    return m;
  }, [signals]);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const startForge = () => {
    setActiveSignal(null);
    setSelectMode(true);
    setSelected([]);
  };

  const cancelForge = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const forgeFrom = (signal) => {
    setActiveSignal(null);
    setSelectMode(true);
    setSelected([signal.id]);
  };

  const onForged = (match, openDetail) => {
    refresh();
    setForgeOpen(false);
    setSelectMode(false);
    setSelected([]);
    if (openDetail && match) {
      setActiveMatch(match);
      setHighlightMatchId(match.id);
    }
  };

  const connectedMatches = useMemo(() => {
    if (!activeSignal) return [];
    return matches.filter((m) => m.a === activeSignal.id || m.b === activeSignal.id);
  }, [activeSignal, matches]);

  const selA = selected[0] ? signalById.get(selected[0]) : null;
  const selB = selected[1] ? signalById.get(selected[1]) : null;

  const bandCounts = useMemo(() => {
    const c = { strong: 0, partial: 0, misaligned: 0 };
    matches.forEach((m) => {
      if (c[m.band] !== undefined) c[m.band] += 1;
    });
    return c;
  }, [matches]);

  return (
    <div className="relative min-h-screen text-offwhite">
      <MeshGradient />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-line/60 bg-ink/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-jade/40 bg-jade/10"
              style={{ boxShadow: '0 0 18px rgba(52,211,153,0.3)' }}
            >
              <GitBranch size={18} className="text-jade" />
            </div>
            <div>
              <h1 className="font-display text-lg font-extrabold leading-none tracking-tight">
                Confluence
              </h1>
              <p className="text-[11px] text-offwhite-faint">AI collaboration matchmaker</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="hidden items-center gap-1.5 rounded-full border border-ink-line px-3 py-2 text-sm text-offwhite-dim transition hover:text-offwhite sm:flex"
            >
              <Info size={15} />
              About
            </button>
            <MockWalletButton wallet={wallet} />
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[360px_1fr]">
        {/* Sidebar */}
        <aside className="order-2 flex flex-col gap-4 lg:order-1">
          <StatsStrip stats={stats} bandCounts={bandCounts} loading={loading} />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-jade px-4 py-2.5 text-sm font-semibold text-ink-deep transition hover:bg-jade-soft"
            >
              <Radio size={16} />
              Compose
            </button>
            {selectMode ? (
              <button
                type="button"
                onClick={cancelForge}
                className="flex items-center justify-center gap-2 rounded-full border border-ink-line px-4 py-2.5 text-sm text-offwhite-dim transition hover:text-offwhite"
              >
                <X size={16} />
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={startForge}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-4 py-2.5 text-sm font-semibold text-amber transition hover:bg-amber/20"
              >
                <Zap size={16} />
                Forge
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-ink-line/70 bg-ink-raised/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-offwhite-dim">
                Signal roster
              </h2>
              <span className="font-mono text-xs text-offwhite-faint">{signals.length}</span>
            </div>
            <div className="thin-scroll max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
              <Roster
                signals={signals}
                loading={loading}
                selectMode={selectMode}
                selected={selected}
                onToggleSelect={toggleSelect}
                onOpenSignal={(s) => setActiveSignal(s)}
              />
            </div>
          </div>
        </aside>

        {/* Graph surface */}
        <section className="order-1 lg:order-2">
          <div className="relative h-[70vh] min-h-[480px] overflow-hidden rounded-3xl border border-ink-line/70 bg-ink-deep/30 lg:h-[calc(100vh-110px)]">
            {error && (
              <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-coral/40 bg-coral/10 px-4 py-1.5 text-xs text-coral-soft">
                {error}
              </div>
            )}

            {loading ? (
              <GraphSkeleton />
            ) : signals.length === 0 ? (
              <EmptyGraph onCompose={() => setComposeOpen(true)} />
            ) : (
              <ConstellationGraph
                signals={signals}
                matches={matches}
                selectMode={selectMode}
                selected={selected}
                onToggleSelect={toggleSelect}
                onOpenSignal={(s) => setActiveSignal(s)}
                onOpenMatch={(m) => {
                  setActiveMatch(m);
                  setHighlightMatchId(m.id);
                }}
                highlightMatchId={highlightMatchId}
              />
            )}

            <GraphLegend />

            <AnimatePresence>
              {selectMode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-5 left-1/2 z-10 w-[min(560px,92%)] -translate-x-1/2 rounded-2xl border border-amber/30 bg-ink-raised/90 p-4 backdrop-blur"
                >
                  <p className="text-center text-sm text-offwhite-dim">
                    {selected.length === 0
                      ? 'Select two signal nodes to forge a match.'
                      : selected.length === 1
                      ? `Selected ${selA?.name}. Pick one more node.`
                      : `Ready: ${selA?.name} and ${selB?.name}.`}
                  </p>
                  {selected.length === 2 && (
                    <button
                      type="button"
                      onClick={() => setForgeOpen(true)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-ink-deep transition hover:bg-amber-soft"
                    >
                      <Zap size={16} />
                      Forge match
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Panels */}
      <ComposeSignalPanel
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        wallet={wallet}
        onPosted={() => {
          refresh();
        }}
      />
      <ForgePanel
        open={forgeOpen}
        onClose={() => setForgeOpen(false)}
        wallet={wallet}
        signalA={selA}
        signalB={selB}
        onForged={onForged}
      />
      <MatchDrawer
        open={!!activeMatch}
        onClose={() => setActiveMatch(null)}
        match={activeMatch}
      />
      <SignalDrawer
        open={!!activeSignal}
        onClose={() => setActiveSignal(null)}
        signal={activeSignal}
        connectedMatches={connectedMatches}
        onForgeFrom={forgeFrom}
        onOpenMatch={(m) => {
          setActiveSignal(null);
          setActiveMatch(m);
          setHighlightMatchId(m.id);
        }}
      />
      <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

function StatsStrip({ stats, bandCounts, loading }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-2xl border border-ink-line/70 bg-ink-raised/30 p-4">
        <div className="flex items-center gap-1.5 text-offwhite-faint">
          <Radio size={13} />
          <span className="text-xs">Signals</span>
        </div>
        <p className="mt-1 font-display text-2xl font-bold text-offwhite font-numeric">
          {loading ? '-' : stats.signals}
        </p>
      </div>
      <div className="rounded-2xl border border-ink-line/70 bg-ink-raised/30 p-4">
        <div className="flex items-center gap-1.5 text-offwhite-faint">
          <Activity size={13} />
          <span className="text-xs">Matches</span>
        </div>
        <p className="mt-1 font-display text-2xl font-bold text-offwhite font-numeric">
          {loading ? '-' : stats.matches}
        </p>
        {!loading && stats.matches > 0 && (
          <div className="mt-2 flex gap-2 text-[10px]">
            <BandDot band="strong" n={bandCounts.strong} />
            <BandDot band="partial" n={bandCounts.partial} />
            <BandDot band="misaligned" n={bandCounts.misaligned} />
          </div>
        )}
      </div>
    </div>
  );
}

function BandDot({ band, n }) {
  const meta = bandOf(band);
  return (
    <span className="inline-flex items-center gap-1 text-offwhite-faint">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {n}
    </span>
  );
}

function GraphLegend() {
  return (
    <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 rounded-2xl border border-ink-line/60 bg-ink/50 px-3 py-2.5 backdrop-blur">
      <span className="text-[10px] uppercase tracking-wide text-offwhite-faint">Edge bands</span>
      {['strong', 'partial', 'misaligned'].map((b) => {
        const meta = bandOf(b);
        return (
          <div key={b} className="flex items-center gap-2 text-xs text-offwhite-dim">
            <span
              className="h-0.5 w-5 rounded-full"
              style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
            />
            {meta.label}
          </div>
        );
      })}
    </div>
  );
}

function GraphSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-offwhite-faint">
        <Loader2 size={28} className="animate-spin text-jade" />
        <span className="text-sm">Reading the graph from chain</span>
      </div>
    </div>
  );
}

function EmptyGraph({ onCompose }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex h-20 w-20 items-center justify-center rounded-full border border-jade/30 bg-jade/5 animate-pulse-glow"
      >
        <GitBranch size={32} className="text-jade" />
      </motion.div>
      <h2 className="mt-5 font-display text-2xl font-bold text-offwhite">The graph is empty</h2>
      <p className="mt-2 max-w-sm text-sm text-offwhite-dim">
        Confluence grows from the first signal. Compose one to place a node, then forge a match to
        draw the first glowing edge.
      </p>
      <button
        type="button"
        onClick={onCompose}
        className="mt-6 flex items-center gap-2 rounded-full bg-jade px-6 py-3 text-sm font-semibold text-ink-deep transition hover:bg-jade-soft"
      >
        <Radio size={16} />
        Compose the first signal
      </button>
    </div>
  );
}
