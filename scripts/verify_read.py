import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from gl import make_client, read_view  # noqa: E402


def main():
    root = os.path.dirname(os.path.dirname(__file__))
    addr = json.load(open(os.path.join(root, "deployment.json")))["address"]
    if len(sys.argv) > 1:
        addr = sys.argv[1]
    client, account = make_client()
    print("addr:", addr)
    print("get_stats:", json.dumps(read_view(client, account, addr, "get_stats"), default=str))
    print("get_signals:", json.dumps(read_view(client, account, addr, "get_signals", [0]), default=str))
    print("get_matches:", json.dumps(read_view(client, account, addr, "get_matches", [0]), default=str))


if __name__ == "__main__":
    main()
