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

// A tx can reach ACCEPTED while its execution reverted (a deterministic
// [EXPECTED] UserError inside the write). The node marks these as an error
// execution result; detect that so the UI can stop and report instead of
// polling for a state change that will never happen.
// A successful GenLayer write settles with tx_execution_result_name
// FINISHED_WITH_RETURN. A genuine revert reports ERROR / REVERTED. NOT_VOTED and
// IDLE are normal transient values before finalization and must NOT be treated
// as errors, or every freshly ACCEPTED tx would look failed.
function executionErrored(tx) {
  if (!tx) return false;
  const fields = [tx.tx_execution_result_name, tx.execution_result, tx.result_name];
  for (const f of fields) {
    const v = String(f || '');
    if (/error|revert|rolled_?back|finished_with_error/i.test(v)) return true;
  }
  return false;
}

export async function pollUntilDecided(client, hash, onUpdate, opts = {}) {
  const { tries = 200, intervalMs = 8000 } = opts;
  for (let i = 0; i < tries; i++) {
    const tx = await client.getTransaction({ hash }).catch(() => null);
    const status = statusName(tx ? tx.status : 'PENDING');
    onUpdate?.(status);
    if (TERMINAL.has(status)) {
      return { status, tx, errored: status !== 'FINALIZED' && executionErrored(tx) };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: 'TIMEOUT' };
}
