"""DLC03ガイドの「パンドラのアンフォラ」の選択肢の流れ図（SVG）を作り、ガイドの図を差し替える。

使い方: python tools/build-quest-flow-pandora.py            # ガイドの図を差し替える（そのあと bun run build:site）
        python tools/build-quest-flow-pandora.py out.svg    # ファイルに書き出すだけ
値の元は annohead の3.0データ（_local/anno-official-data/v3.0-annohead/）。見た目は custom.css の .qsvg を使う。
"""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")


def write_out(svg, label):
    """引数があればそのファイルへ、無ければ DLC03ガイドの同じ図（aria-label で探す）を差し替える。"""
    if len(sys.argv) > 1:
        open(sys.argv[1], "w", encoding="utf-8").write(svg)
        return
    md = Path(__file__).resolve().parent.parent / "apps/wiki/docs/guide/dlc03-dawn-of-delta.md"
    s = md.read_text(encoding="utf-8")
    key = f'aria-label="{label}"'
    if key not in s:
        sys.exit(f"図が見つかりません: {label}（{md}）")
    i = s.index(key)
    a = s.rindex("<svg", 0, i)
    b = s.index("</svg>", i) + len("</svg>")
    md.write_text(s[:a] + svg + s[b:], encoding="utf-8")
    print(f"差し替えました: {md}")


W = 380
parts = []


def box(x, y, w, h, lines, kind="n"):
    """kind: q=問い, n=選択・出来事, r=報酬, m=控えめ"""
    parts.append(f'<rect class="qs-{kind}" x="{x}" y="{y}" width="{w}" height="{h}" rx="6"/>')
    cx = x + w / 2
    n = len(lines)
    top = y + h / 2 - (n - 1) * 7.5 + 4.5
    for i, t in enumerate(lines):
        cls = "qs-t" if i == 0 else "qs-s"
        if kind in ("q",) and i == 0:
            cls = "qs-tb"
        parts.append(f'<text class="{cls}" x="{cx:g}" y="{top + i * 15:g}">{t}</text>')


def edge(pts, label=None, lx=None, ly=None, anchor="middle"):
    d = "M" + " L".join(f"{x:g},{y:g}" for x, y in pts)
    parts.append(f'<path class="qs-e" d="{d}" marker-end="url(#qs-arr)"/>')
    if label:
        parts.append(f'<text class="qs-l" x="{lx:g}" y="{ly:g}" text-anchor="{anchor}">{label}</text>')


# 列の中心
C1, C2, C3 = 62, 190, 318
BW = 116

# A
box(90, 6, 200, 30, ["A. デキムスのアンフォラが届く"], "q")
edge([(150, 36), (C1, 62)])
edge([(190, 36), (C2, 62)])
edge([(230, 36), (C3, 62)])
# 1段目の選択
box(C1 - BW / 2, 62, BW, 30, ["栓を抜く"])
box(C2 - BW / 2, 62, BW, 34, ["牛で交易所に隠す", "（サンガ牛が要る）"])
box(C3 - BW / 2, 62, BW, 30, ["アルビオンに隠す"])
# B
edge([(C1, 92), (C1, 116)])
box(C1 - BW / 2, 116, BW, 30, ["B. 指輪が出た"], "q")
# 3段目
Y3 = 186
box(C1 - BW / 2, Y3, BW, 34, ["ディアナに届ける", "（期限内）"])
box(C2 - BW / 2, Y3, BW, 34, ["交易所に隠す", "牛をそろえる"])
box(C3 - BW / 2, Y3, BW, 34, ["アルビオンへ運ぶ", "（期限内）"])
edge([(C1, 146), (C1, Y3)], "渡す", C1 - 6, 170, "end")
edge([(108, 146), (C2 - 30, Y3)], "隠す", 150, 160)
edge([(118, 140), (C3 - 40, Y3)], "送る", 250, 160)
edge([(C2, 96), (C2, Y3)])
edge([(C3, 92), (C3, Y3)])
# ミウト
YM = 256
edge([(40, Y3 + 34), (40, YM)], "間に合う", 44, 240, "start")
box(9, YM, 82, 28, ["ミウト"], "r")
# C
YC = 320
edge([(100, Y3 + 34), (150, YC)], "間に合わない", 136, 304, "end")
edge([(C2, Y3 + 34), (C2, YC)])
edge([(290, Y3 + 34), (240, YC)], "間に", 262, 284, "start")
parts.append('<text class="qs-l" x="262" y="298" text-anchor="start">合わない</text>')
box(80, YC, 200, 30, ["C. 皇帝の艦隊が港を調べる"], "q")
# Cの選択
YO = 384
edge([(130, YC + 30), (92, YO)])
edge([(230, YC + 30), (240, YO)])
box(10, YO, 164, 40, ["見せる", "評判+15・何ももらえない"])
box(182, YO, 116, 40, ["否定する", "成功率60%か25%"])
# 失敗
YF = 452
edge([(205, YO + 40), (205, YF)], "失敗", 201, 442, "end")
box(160, YF, 90, 26, ["評判-10"], "m")
# D
YD = 520
edge([(270, YO + 40), (270, YD)], "成功", 274, 442, "start")
edge([(C3, Y3 + 34), (C3, YD)], "間に合う", 319, 240, "start")
box(146, YD, 228, 36, ["D. デキムスのために隠し通せた", "（否定の成功は、隠した場合だけ）"], "q")
# Dの先
YE = 590
edge([(190, YD + 36), (70, YE)], "開けていた", 118, 574, "end")
box(10, YE, 120, 28, ["マルクス"], "r")
edge([(290, YD + 36), (290, YE)], "開けていない", 286, 578, "end")
box(146, YE, 228, 28, ["最後にもう一度選ぶ"], "q")
opts = [("開けて指輪をディアナに渡す", "ミウト", "r"),
        ("開けて指輪を手元に置く", "指輪だけ", "n"),
        ("開けて指輪をデキムスに返す", "マルクス", "r"),
        ("放っておく", "マルクス", "r")]
y = YE + 40
for t, rw, k in opts:
    parts.append(f'<path class="qs-e" d="M160,{YE + 28} L160,{y + 18} L172,{y + 18}" marker-end="url(#qs-arr)"/>')
    box(174, y, 200, 36, [t, rw], k)
    y += 42
H = y + 4

svg = (f'<svg class="qsvg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="パンドラのアンフォラの選択肢の流れ図">'
       '<defs><marker id="qs-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path class="qs-a" d="M0,0 L0,6 L8,3 z"/></marker></defs>'
       + "".join(parts) + "</svg>")
write_out(svg, "パンドラのアンフォラの選択肢の流れ図")
