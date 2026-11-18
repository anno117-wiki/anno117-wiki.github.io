"""DLC03ガイドの「ニュンパイオスの3部作」の選択肢の流れ図（SVG）を作り、ガイドの図を差し替える。

使い方: python tools/build-quest-flow-nymphaeus.py            # ガイドの図を差し替える（そのあと bun run build:site）
        python tools/build-quest-flow-nymphaeus.py out.svg    # ファイルに書き出すだけ
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
y = 6


def text(x, ty, t, cls="qs-t", anchor=None):
    a = f' text-anchor="{anchor}"' if anchor else ""
    parts.append(f'<text class="{cls}" x="{x:g}" y="{ty:g}"{a}>{t}</text>')


def box(x, by, w, h, lines, kind="n"):
    parts.append(f'<rect class="qs-{kind}" x="{x:g}" y="{by:g}" width="{w:g}" height="{h:g}" rx="6"/>')
    n = len(lines)
    top = by + h / 2 - (n - 1) * 7.5 + 4.5
    for i, t in enumerate(lines):
        cls = "qs-tb" if (kind == "q" and i == 0) else ("qs-t" if i == 0 else "qs-s")
        text(x + w / 2, top + i * 15, t, cls)


def arrow(x1, y1, x2, y2, label=None, lx=None, ly=None, anchor="start"):
    parts.append(f'<path class="qs-e" d="M{x1:g},{y1:g} L{x2:g},{y2:g}" marker-end="url(#qs-arr)"/>')
    if label:
        text(lx, ly, label, "qs-l", anchor)


def down(gap=20):
    """前の要素の下から次の要素へ、真ん中に矢印を引いて y を進める。"""
    global y
    arrow(W / 2, y, W / 2, y + gap - 2)
    y += gap


def header(t):
    global y
    parts.append(f'<rect class="qs-h" x="0" y="{y:g}" width="{W}" height="26" rx="4"/>')
    text(12, y + 18, t, "qs-hb", "start")
    y += 34


def question(lines):
    global y
    h = 30 if len(lines) == 1 else 44
    box(10, y, W - 20, h, lines, "q")
    y += h


def options(items, note=None, kind_of=None):
    """items: [(行のリスト, 種類)]。2列に並べ、まとめて薄い枠で囲む。"""
    global y
    arrow(W / 2, y, W / 2, y + 12)
    y += 14
    col_w, gap = 172, 8
    rows = [items[i:i + 2] for i in range(0, len(items), 2)]
    heights = [max(16 + 15 * len(it[0]) for it in r) for r in rows]
    total = sum(heights) + gap * (len(rows) - 1) + 16
    note_h = 15 * len(note) + 4 if note else 0
    parts.append(f'<rect class="qs-g" x="6" y="{y:g}" width="{W - 12}" height="{total + note_h:g}" rx="8"/>')
    yy = y + 8
    for r, h in zip(rows, heights):
        for i, (lines, k) in enumerate(r):
            x = 14 + i * (col_w + gap) if len(r) == 2 else (W - col_w) / 2
            box(x, yy, col_w, h, lines, k)
        yy += h + gap
    if note:
        for i, t in enumerate(note):
            text(W / 2, yy + 6 + i * 15, t, "qs-l")
    y += total + note_h


def answers(rows):
    """推理の問いと答え。左に問い、右に答え（緑）。"""
    global y
    arrow(W / 2, y, W / 2, y + 12)
    y += 14
    h, gap = 30, 6
    total = len(rows) * (h + gap) + 10
    parts.append(f'<rect class="qs-g" x="6" y="{y:g}" width="{W - 12}" height="{total:g}" rx="8"/>')
    yy = y + 8
    for q, a in rows:
        text(18, yy + h / 2 + 4.5, q, "qs-t", "start")
        box(150, yy, 220, h, [a], "r")
        yy += h + gap
    y += total


# ---- 1. ミイラ化 ----
header("1. ニュンパイオスのミイラ化")
question(["ミイラ作りの材料をどこに頼む？"])
options([(["ウァレリア", "費用25,000"], "n"), (["カンディス", "費用10,000・評判-5"], "n"),
         (["ヘロン", "費用7,500・評判+2・出来-15"], "n"), (["何も頼まない", "出来-30"], "n")])
down()
question(["アヌビスの仮面をどう手に入れる？"])
options([(["カンディスに払う", "費用10,000・評判-5"], "n"),
         (["墓から盗ませる", "費用100・成功率40%", "出来-10（失敗は-20）"], "n"),
         (["陶工に作らせる", "費用2,000"], "n"), (["その場しのぎ", "出来-25"], "n")],
        note=["カンディスはゲームにいるとき、陶工は陶工の住民が", "いるときだけ選べます"])
down()
question(["遺体を切り開いたベンをどうする？"])
options([(["ベンを罰する"], "n"), (["神に逆らう", "費用15,000"], "n")], note=["どちらでも出来は変わりません"])
down()
question(["ナトロンで塩漬けにした遺体をどうする？"])
options([(["遺体を乾かす", "乾くのを待つ"], "n"), (["ベンに続けるよう命じる", "乾かさない・出来-80"], "n")])
down()
question(["装飾石棺を届ける", "ミイラの出来は100から始まり、選択で下がる"])
# 出来による分かれ道
y0 = y
arrow(130, y0, 100, y0 + 30, "56以上", 92, y0 + 18, "end")
arrow(250, y0, 280, y0 + 30, "56未満", 288, y0 + 18, "start")
y = y0 + 30
box(20, y, 160, 30, ["問題なし"], "n")
box(200, y, 160, 30, ["出来事「病気」が起きる"], "m")
y += 30
text(W / 2, y + 16, "乾かさないと必ず56未満。乾かしても「何も頼まない」と", "qs-l")
text(W / 2, y + 31, "「その場しのぎ」を両方選ぶと56未満になります", "qs-l")
y += 42

# ---- 2. 私的な捜査 ----
down(24)
header("2. 私的な捜査")
question(["ウァレリアの船「カルナク号」で聞き込み、", "証拠を集める"])
options([(["包丁"], "n"), (["装飾された刃"], "n"), (["カシュタの武器"], "n"),
         (["劇（アレクサンドロス大王）"], "n"), (["愛のペンダント"], "n"), (["追加雇用者の名簿"], "n")])
y += 8
box(10, y, W - 20, 92, ["手掛かりの場所", "ヒッポリトゥム（遺体が見つかった村）", "ナウクラティスの劇場", "ナイルの底（街の潜り手に頼む）", "3か所のアヌビスの門"], "m")
y += 92
text(W / 2, y + 16, "困ったら、カルナク号でウァレリアにヒントを聞けます", "qs-l")
y += 24

# ---- 3. 正義を？ ----
down(24)
header("3. ニュンパイオスに正義を？")
question(["犯人を推理する（緑が答え）"])
answers([("凶器", "装飾された刃"), ("刺したのは", "料理人 → フラアテス（コブラ）"),
         ("ペンダントの「C」", "皇帝カエサル"), ("戯曲で隠したかった所", "禁断の愛"), ("黒幕", "皇帝カエサル")])
# 正解でなければやり直し
y0 = y
text(W / 2, y0 + 16, "答えは6つ（刺した人は「料理人」と「フラアテス」で2つ）。", "qs-l")
text(W / 2, y0 + 31, "1つでも違うと「何かがおかしい」と言われ、やり直し", "qs-l")
y += 40
down()
question(["真相を公表する？"])
options([(["皇帝が命じたと公表する", "評判-40"], "n"), (["悲惨な事故だったとする", "評判+30"], "n")])
down()
box(60, y, W - 120, 30, ["どちらでも「ハナ・レクター」を受け取る"], "r")
y += 30
down()
question(["ニュンパイオスをどう埋葬する？"])
options([(["すぐ未完成のピラミッドに", "封じる"], "n"), (["ピラミッドの修復を終えて", "から葬儀をする"], "n")])
H = y + 6

svg = (f'<svg class="qsvg" viewBox="0 0 {W} {H:g}" width="{W}" height="{H:g}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ニュンパイオスの3部作の選択肢の流れ図">'
       '<defs><marker id="qs-arr2" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path class="qs-a" d="M0,0 L0,6 L8,3 z"/></marker></defs>'
       + "".join(parts).replace("url(#qs-arr)", "url(#qs-arr2)") + "</svg>")
write_out(svg, "ニュンパイオスの3部作の選択肢の流れ図")
