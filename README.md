```
CONFLUENCE(1)                  GenLayer Manual                  CONFLUENCE(1)
```

## NAME

**confluence** - an on-chain AI matchmaker that rules the collaboration fit
between two builders and weaves the result into a connection graph.

## SYNOPSIS

```
post_signal(name, offer, seek, manifesto, tags)   -> signal
forge_match(signal_a, signal_b)                   -> match (AI consensus)
get_signals(start) | get_matches(start) | get_stats()
```

## DESCRIPTION

Most collaboration tools list people. Confluence reads them. A builder posts a
**signal**: what they offer, what they seek, and a short manifesto. Anyone may
then take two signals and ask the contract to forge a **match**. A GenLayer jury
reads both signals together and rules how well they could actually work
together, and the sealed verdict becomes an edge in an on-chain connection
graph. Signals are nodes; matches are the glowing lines between them.

What sets this contract apart from a one-record judge: the consensus round
operates over a **pair** of previously stored records, not a single submission,
and a write appends a graph edge plus per-node degree counters. There is no
server and no database; the contract is the entire backend. Nothing is escrowed
or transferred; a caller pays only the network fee.

## METHODS

**post_signal**(name, offer, seek, manifesto, tags) -> dict
> Deterministic, fast. Stores a signal node. `tags` is a comma or newline
> separated string, capped. Returns the stored record including its `id` and a
> running `matches` degree count that starts at zero.

**forge_match**(signal_a, signal_b) -> dict
> The one AI write. Refuses a self-match and refuses a duplicate edge (the pair
> is canonicalized so a-b and b-a are one edge). Runs the consensus round below,
> appends the edge, bumps each node's degree, and returns the match with three
> readings, complementary strengths, friction points, a rationale, and a
> concrete first step.

**get_signals**(start) / **get_matches**(start) -> list
> Paged at twenty. Signals in creation order; matches newest first. The frontend
> reconstructs the graph from these two lists.

**get_signal**(id) / **get_match**(id) -> dict, **get_stats**() -> dict
> Single lookups and the `{signals, matches}` counters behind the header figures.

## CONSENSUS

The fit is read by a leader and confirmed by every validator. The jury returns
three integer readings: complementarity (how well each side's offer meets the
other's need), resonance (how aligned their manifestos are), and friction (how
much they would clash). Validators do not compare those raw numbers, since two
honest model runs never match them. The contract collapses the three into a
single fit **band** by deterministic argmax, and validators only have to agree
on the band.

```python
def _fit_band(readings):
    comp = int(readings.get("complementarity", 0))
    fric = int(readings.get("friction", 0))
    partial = max(0, 100 - abs(comp - fric))   # close comp and friction read as partial
    scores = {"strong": comp, "misaligned": fric, "partial": partial}
    best, best_val = None, -1
    for b in BANDS:                  # fixed order, ties resolve identically
        if scores[b] > best_val:
            best_val, best = scores[b], b
    return best or BANDS[0]

def validator_fn(leaders_res):
    if not isinstance(leaders_res, gl.vm.Return):
        return _handle_leader_error(leaders_res, leader_fn)
    mine = leader_fn()
    theirs = leaders_res.calldata
    if not isinstance(theirs, dict):
        return False
    tr = theirs.get("readings")
    return isinstance(tr, dict) and _fit_band(mine["readings"]) == _fit_band(tr)

return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```

Deterministic guards run first (a signal must name an offer and a seek; a match
needs two known, distinct, not-already-matched signals), so a cheap failure
never spends a consensus round. Both signals enter the prompt as untrusted data;
a signal that tries to claim a perfect match is judged honestly anyway. After
consensus the band is re-derived in code, so the stored edge is shaped by the
contract, not by the model's phrasing.

## ENVIRONMENT

```
NETWORK    Bradbury testnet, chain 4221
FRONTEND   React + Vite static SPA, genlayer-js, no backend
VISUAL     animated mesh-gradient field, a constellation graph of signal nodes
           and glowing band-colored match edges as the primary surface
```

The home surface is the graph itself, not a landing page: nodes drift over a
living mesh gradient, edges glow jade for a strong match, amber for partial,
coral for misaligned. A side roster lists signals, a slide-in panel composes
one, and selecting two nodes forges a match with a consensus loading state.

## DIAGNOSTICS

An AI write takes one to five minutes to reach consensus, and the installed
genlayer-js can raise while parsing the submission receipt even though the
transaction is live. The frontend therefore confirms a match by watching the
on-chain match count rise, not by trusting the write to return. Read calls are
retried with exponential backoff and polled slowly to respect the RPC limit.

## FILES

```
contracts/contract.py    the entire backend; the authoritative implementation
frontend/                the static SPA that renders the graph
```

## SEE ALSO

The live contract, browsable on the Bradbury explorer:

> address `0xA08f34982FC0b56a996525f07599E972549cF3E6`
> https://explorer-bradbury.genlayer.com/address/0xA08f34982FC0b56a996525f07599E972549cF3E6

The deployment that put it there:

> tx `0x5187d4046bf9e2bd3271f1866569560f7c7fb6d2ffe3f2d021c00a42376cbdd8`
> https://explorer-bradbury.genlayer.com/tx/0x5187d4046bf9e2bd3271f1866569560f7c7fb6d2ffe3f2d021c00a42376cbdd8
