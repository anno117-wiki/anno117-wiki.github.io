#!/usr/bin/env python3
"""
skilltree-full-data.json の connections/annoS/annoR を techs.json に付与する。
既存フィールドは上書きしない（build-game-data.py の保護機構と対称）。

実行: python tools/apply-skilltree-connections.py
"""
import json, sys
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
FULL_DATA = BASE / "_local/skilltree-full-data.json"
TECHS_JSON = BASE / "apps/wiki/docs/wiki/techs.json"

# ---- ロード ----
full = json.loads(FULL_DATA.read_text(encoding="utf-8"))
techs_data = json.loads(TECHS_JSON.read_text(encoding="utf-8"))

nodes_by_guid = {n["guid"]: n for n in full["nodes"]}
edges = full["edges"]

print(f"Input: {full['node_count']} nodes / {full['edge_count']} edges", file=sys.stderr)

# ---- edges → 各 guid の connections リスト（無向 → 双方向） ----
connections: dict[str, list[str]] = defaultdict(list)
converted = 0
for a, b in edges:
    if a not in nodes_by_guid or b not in nodes_by_guid:
        print(f"  WARNING: edge ({a},{b}) に unknown guid", file=sys.stderr)
        continue
    connections[a].append(b)
    connections[b].append(a)
    converted += 1

print(f"Converted edges: {converted}/{full['edge_count']}", file=sys.stderr)
if converted != full["edge_count"]:
    print("ERROR: 取りこぼしあり。中断します。", file=sys.stderr)
    sys.exit(1)

# ---- techs.json に付与 ----
techs = techs_data["techs"]
updated = 0
not_found = []

for tech in techs:
    g = tech.get("guid")
    if not g or g not in nodes_by_guid:
        continue
    node = nodes_by_guid[g]
    changed = False

    tech["connections"] = sorted(connections.get(g, []))
    tech["annoS"] = node["annoS"]
    tech["annoR"] = node["annoR"]
    changed = True

    if changed:
        updated += 1

for g in nodes_by_guid:
    if not any(t.get("guid") == g for t in techs):
        not_found.append(g)

print(f"Updated techs: {updated}", file=sys.stderr)
print(f"Full-data nodes not in techs.json: {len(not_found)}", file=sys.stderr)
if not_found:
    print(f"  Missing guids: {not_found[:10]}", file=sys.stderr)

# ---- 統計確認 ----
total_connections = sum(len(t.get("connections", [])) for t in techs)
print(f"Total connection entries: {total_connections} (expected: {converted * 2})", file=sys.stderr)

# ---- 書き出し ----
TECHS_JSON.write_text(
    json.dumps({"techs": techs}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(f"Wrote {TECHS_JSON}", file=sys.stderr)
