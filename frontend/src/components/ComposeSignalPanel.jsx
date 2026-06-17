import { useState } from 'react';
import { Radio, Loader2, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';
import Drawer from './ui/Drawer.jsx';
import { usePostSignal } from '../hooks/usePostSignal.js';

const FIELD =
  'w-full rounded-xl border border-ink-line bg-ink/60 px-3.5 py-2.5 text-sm text-offwhite placeholder:text-offwhite-faint outline-none transition focus:border-jade/50 focus:ring-1 focus:ring-jade/30';

export default function ComposeSignalPanel({ open, onClose, wallet, onPosted }) {
  const [form, setForm] = useState({ name: '', offer: '', seek: '', manifesto: '', tags: '' });
  const { state, post, reset } = usePostSignal((sig) => {
    onPosted?.(sig);
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const busy = state.phase === 'wallet' || state.phase === 'submitting';
  const canSubmit =
    form.name.trim() && form.offer.trim() && form.seek.trim() && wallet.address && !busy;

  const handleClose = () => {
    if (busy) return;
    reset();
    setForm({ name: '', offer: '', seek: '', manifesto: '', tags: '' });
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!wallet.address) {
      wallet.connect();
      return;
    }
    await post(wallet.address, form);
  };

  return (
    <Drawer open={open} onClose={handleClose} side="right" label="Compose signal">
      <div className="p-6 pt-14">
        <div className="flex items-center gap-2 text-jade">
          <Radio size={18} />
          <h2 className="font-display text-xl font-bold text-offwhite">Compose a signal</h2>
        </div>
        <p className="mt-1.5 text-sm text-offwhite-dim">
          State what you offer and what you seek. Your signal becomes a node others can match with.
        </p>

        {state.phase === 'confirmed' ? (
          <div className="mt-8 rounded-2xl border border-jade/40 bg-jade/10 p-6 text-center animate-drift-in">
            <CheckCircle2 className="mx-auto text-jade" size={36} />
            <p className="mt-3 font-display text-lg font-semibold text-offwhite">Signal posted</p>
            <p className="mt-1 text-sm text-offwhite-dim">
              {state.signal?.name} is now a node on the graph.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 rounded-full border border-jade/40 bg-jade/10 px-5 py-2 text-sm font-semibold text-jade transition hover:bg-jade/20"
            >
              Back to the graph
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Name" hint="What to call this signal">
              <input
                className={FIELD}
                value={form.name}
                onChange={set('name')}
                maxLength={60}
                placeholder="Aurora Labs"
                disabled={busy}
              />
            </Field>
            <Field label="Offers" hint="What you bring to a collaboration">
              <textarea
                className={`${FIELD} min-h-[72px] resize-none`}
                value={form.offer}
                onChange={set('offer')}
                maxLength={360}
                placeholder="Real-time data pipelines and ML infra."
                disabled={busy}
              />
            </Field>
            <Field label="Seeks" hint="What you are looking for">
              <textarea
                className={`${FIELD} min-h-[72px] resize-none`}
                value={form.seek}
                onChange={set('seek')}
                maxLength={360}
                placeholder="A design partner for a consumer-facing dashboard."
                disabled={busy}
              />
            </Field>
            <Field label="Manifesto" hint="A short statement of values (optional)">
              <textarea
                className={`${FIELD} min-h-[64px] resize-none`}
                value={form.manifesto}
                onChange={set('manifesto')}
                maxLength={400}
                placeholder="We build in the open and ship weekly."
                disabled={busy}
              />
            </Field>
            <Field label="Tags" hint="Comma or newline separated, up to 6">
              <input
                className={FIELD}
                value={form.tags}
                onChange={set('tags')}
                placeholder="data, ml, infra"
                disabled={busy}
              />
            </Field>

            {state.phase === 'error' && (
              <div className="flex items-start gap-2 rounded-xl border border-coral/40 bg-coral/10 p-3 text-sm text-coral-soft">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit && wallet.address}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-jade px-5 py-3 text-sm font-semibold text-ink-deep transition hover:bg-jade-soft disabled:opacity-50"
            >
              {!wallet.address ? (
                <>
                  <Wallet size={16} />
                  Connect wallet to post
                </>
              ) : busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {state.phase === 'wallet' ? 'Confirm in wallet' : 'Posting signal'}
                </>
              ) : (
                <>
                  <Radio size={16} />
                  Post signal
                </>
              )}
            </button>
            <p className="text-center text-xs text-offwhite-faint">
              post_signal is deterministic and settles in seconds.
            </p>
          </form>
        )}
      </div>
    </Drawer>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-offwhite">{label}</span>
      {hint && <span className="ml-2 text-xs text-offwhite-faint">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
