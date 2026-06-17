"""Post two signals, then forge a match (the AI consensus write). Confirms the
pairwise matchmaking round works and seals an edge."""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import patch_status  # noqa: E402
patch_status.apply()
from gl import make_client, read_view  # noqa: E402

TERMINAL = {"ACCEPTED", "FINALIZED", "UNDETERMINED", "CANCELED"}


def wait(client, tx, label):
    for i in range(160):
        try:
            t = client.get_transaction(transaction_hash=tx)
        except Exception as e:
            print(f"[{label} {i}] err {e}", flush=True)
            time.sleep(8)
            continue
        name = t.get("status_name") or t.get("status") if isinstance(t, dict) else None
        ex = t.get("tx_execution_result_name") if isinstance(t, dict) else None
        print(f"[{label} {i}] status={name} exec={ex}", flush=True)
        if str(name) in TERMINAL:
            return
        time.sleep(8)


def main():
    root = os.path.dirname(os.path.dirname(__file__))
    addr = json.load(open(os.path.join(root, "deployment.json")))["address"]
    client, account = make_client()
    print("addr:", addr)

    sigs = [
        ["Aria Labs", "Rust and zk circuit engineering, proving systems", "A frontend and product designer to make our tooling usable", "We build privacy infrastructure and believe usability is the missing half of cryptography."],
        ["Mosaic Studio", "Product design and frontend for technical tools", "A strong cryptography backend partner to build on", "Design-led studio that turns hard protocol tech into interfaces people actually use."],
    ]
    for s in sigs:
        try:
            tx = client.write_contract(address=addr, function_name="post_signal", args=[s[0], s[1], s[2], s[3], "design,crypto"], value=0)
            print("post tx:", tx)
            wait(client, tx, "post")
        except Exception as e:
            print("post submit note:", e)
        time.sleep(3)

    print("signals now:", json.dumps(read_view(client, account, addr, "get_stats"), default=str))

    try:
        tx = client.write_contract(address=addr, function_name="forge_match", args=["sig-1", "sig-2"], value=0)
        print("match tx:", tx)
        wait(client, tx, "match")
    except Exception as e:
        print("match submit note:", e)

    print("\nstats:", json.dumps(read_view(client, account, addr, "get_stats"), default=str))
    matches = read_view(client, account, addr, "get_matches", [0])
    m = matches[0] if matches else {}
    print("match band:", m.get("band"), "comp:", m.get("complementarity"), "res:", m.get("resonance"), "fric:", m.get("friction"))
    print("strengths:", json.dumps(m.get("complementaryStrengths"), default=str))
    print("rationale:", str(m.get("rationale"))[:240])
    print("firstStep:", str(m.get("firstStep"))[:160])


if __name__ == "__main__":
    main()
