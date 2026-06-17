// Transaction status decoding for GenLayer writes.
//
// The installed SDK can throw while parsing a submission receipt even though
// the transaction is live, so callers confirm success by polling contract
// state. This module decodes tx status when a hash is available.

const STATUS_NAME = {
  '0': 'UNINITIALIZED',
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
  '14': 'ACTIVATED',
};

export const statusName = (s) => {
  if (s === undefined || s === null) return 'PENDING';
  const byCode = STATUS_NAME[String(s)];
  if (byCode) return byCode;
  return String(s).toUpperCase();
};

// Terminal states end the poll. LEADER_TIMEOUT (13), VALIDATORS_TIMEOUT (12)
// and ACTIVATED (14) are explicitly non-terminal: an AI write can sit in these
// while validators churn, then move forward.
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export const isTerminal = (name) => TERMINAL.has(name);

export async function pollUntilDecided(client, hash, onUpdate, opts = {}) {
  const { tries = 200, intervalMs = 8000 } = opts;
  for (let i = 0; i < tries; i++) {
    const tx = await client.getTransaction({ hash }).catch(() => null);
    const status = statusName(tx ? tx.status : 'PENDING');
    onUpdate?.(status);
    if (TERMINAL.has(status)) return { status, tx };
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: 'TIMEOUT' };
}
