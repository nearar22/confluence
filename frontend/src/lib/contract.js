import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

export const CONTRACT_ADDRESS = '0xA08f34982FC0b56a996525f07599E972549cF3E6';
export const DEPLOY_TX = '0x5187d4046bf9e2bd3271f1866569560f7c7fb6d2ffe3f2d021c00a42376cbdd8';
export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';
export const RPC_URL = 'https://rpc-bradbury.genlayer.com';
export const NETWORK_NAME = 'Bradbury';
export const CHAIN_ID = 4221;
export const CHAIN_ID_HEX = '0x107D';

export const addressUrl = (addr) => `${EXPLORER}/address/${addr}`;
export const txUrl = (hash) => `${EXPLORER}/tx/${hash}`;

// Fit bands map a sealed match to one of three readings. Colors track the
// art direction: jade for strong, amber for partial, coral for misaligned.
export const BANDS = {
  strong: { key: 'strong', label: 'Strong confluence', color: '#34D399', glow: 'rgba(52, 211, 153, 0.55)' },
  partial: { key: 'partial', label: 'Partial confluence', color: '#FBBF24', glow: 'rgba(251, 191, 36, 0.5)' },
  misaligned: { key: 'misaligned', label: 'Misaligned', color: '#FB7185', glow: 'rgba(251, 113, 133, 0.5)' },
};

export const bandOf = (band) => BANDS[String(band)] || BANDS.partial;

export const readClient = createClient({ chain: testnetBradbury });
export const makeWalletClient = (account) => createClient({ chain: testnetBradbury, account });

// Reads can hit transient RPC errors; retry with exponential backoff.
export async function withRpcRetry(fn, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/rate limit|429|timeout|network|fetch|ECONN|503|502|gateway/i.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i));
    }
  }
  throw last;
}

// ----- value coercion (the SDK can return Map / bigint shapes) -------------

function asNumber(v) {
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function asString(v) {
  return v === undefined || v === null ? '' : String(v);
}
function pick(obj, key) {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return obj[key];
  return undefined;
}
function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v instanceof Map) return Array.from(v.values());
  return [];
}

// ----- normalizers ---------------------------------------------------------

export function normSignal(raw) {
  return {
    id: asString(pick(raw, 'id')),
    name: asString(pick(raw, 'name')),
    offer: asString(pick(raw, 'offer')),
    seek: asString(pick(raw, 'seek')),
    manifesto: asString(pick(raw, 'manifesto')),
    tags: asArray(pick(raw, 'tags')).map(asString).filter(Boolean),
    author: asString(pick(raw, 'author')),
    matches: asNumber(pick(raw, 'matches')),
    seq: asNumber(pick(raw, 'seq')),
  };
}

export function normMatch(raw) {
  return {
    id: asString(pick(raw, 'id')),
    a: asString(pick(raw, 'a')),
    b: asString(pick(raw, 'b')),
    aName: asString(pick(raw, 'aName')),
    bName: asString(pick(raw, 'bName')),
    band: asString(pick(raw, 'band')) || 'partial',
    complementarity: asNumber(pick(raw, 'complementarity')),
    resonance: asNumber(pick(raw, 'resonance')),
    friction: asNumber(pick(raw, 'friction')),
    complementaryStrengths: asArray(pick(raw, 'complementaryStrengths')).map(asString).filter(Boolean),
    frictionPoints: asArray(pick(raw, 'frictionPoints')).map(asString).filter(Boolean),
    rationale: asString(pick(raw, 'rationale')),
    firstStep: asString(pick(raw, 'firstStep')),
    seq: asNumber(pick(raw, 'seq')),
  };
}

// ----- view reads -----------------------------------------------------------

async function readView(functionName, args = []) {
  return withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName, args }));
}

export async function fetchStats() {
  const raw = await readView('get_stats');
  return { signals: asNumber(pick(raw, 'signals')), matches: asNumber(pick(raw, 'matches')) };
}

// Walk the paged view (PAGE = 20) until the chain returns a short page.
export async function fetchAllSignals() {
  const out = [];
  let start = 0;
  for (let guard = 0; guard < 200; guard++) {
    const page = asArray(await readView('get_signals', [start])).map(normSignal);
    out.push(...page);
    if (page.length < 20) break;
    start += page.length;
  }
  return out;
}

export async function fetchAllMatches() {
  const out = [];
  let start = 0;
  for (let guard = 0; guard < 200; guard++) {
    const page = asArray(await readView('get_matches', [start])).map(normMatch);
    out.push(...page);
    if (page.length < 20) break;
    start += page.length;
  }
  return out;
}

export async function fetchSignal(id) {
  return normSignal(await readView('get_signal', [id]));
}

export async function fetchMatch(id) {
  return normMatch(await readView('get_match', [id]));
}
