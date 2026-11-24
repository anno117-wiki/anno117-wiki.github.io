r"""スキルツリー(研究)のアイコンを作る。

やること:
  1. apps/wiki/docs/wiki/techs.json の各研究について、assets.xml の /Tech/TechIcon が指す資産の
     /Standard/IconFilename(アイコンのファイル名)を引く
  2. _local/anno-official-data/v3.0.1-steam/tech-icons/ に展開済みの DDS(512x512)を、72px の WebP にして
     apps/wiki/docs/public/icons/tech/<アイコン名>.webp に置く
  3. 研究のGUID→アイコン名の対応と、ほぼ白いアイコン(下地が要るもの)の一覧を
     apps/wiki/docs/wiki/tech-icons.json に書く

DDS の展開(PC版のゲームが要る。パッチ用のRDAが元の版を差し替えるので、必ず ui.rda の後にパッチを展開する):
  RDA=".../Anno 117 - Pax Romana/maindata"
  OUT=_local/anno-official-data/v3.0.1-steam/tech-icons
  for f in ui zz_patchfiles_300; do
    _local/tools/RdaConsole/build/RdaConsole.exe extract -f "$RDA/$f.rda" -o $OUT \
      --filter "(<アイコン名を | でつないだもの>)_0\.dds$" -y -n
  done
  アイコン名の一覧は、このスクリプトを一度流すと「足りないDDS」として表示される。
  新しいパッチでは、版ごとの新しいフォルダを作って取り直す(古い版は消さない)。

使い方: python tools/build-tech-icons.py
"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_resolver import DATA_DIR, Resolver  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TECHS_JSON = ROOT / 'apps/wiki/docs/wiki/techs.json'
OUT_JSON = ROOT / 'apps/wiki/docs/wiki/tech-icons.json'
OUT_DIR = ROOT / 'apps/wiki/docs/public/icons/tech'
DDS_DIR = DATA_DIR / 'tech-icons'
SIZE = 72
WHITE_LEVEL = 200  # 不透明な画素の平均の明るさがこれを超えたら「ほぼ白」


def icon_name_of(resolver: Resolver, guid: str) -> str:
    tech = resolver.get(int(guid))
    if not tech:
        raise SystemExit(f'研究 {guid} が assets.xml に無い')
    icon_guid = tech['v'].get('/Tech/TechIcon')
    icon = resolver.get(int(icon_guid)) if icon_guid else None
    path = icon['v'].get('/Standard/IconFilename') if icon else None
    if not path:
        raise SystemExit(f'研究 {guid} のアイコンのファイル名が引けない')
    return Path(path).stem


def find_dds(name: str) -> Path | None:
    found = sorted(DDS_DIR.glob(f'**/{name}_0.dds'))
    # 4k があれば4k、なければ最初の1つ
    for f in found:
        if '/4k/' in f.as_posix():
            return f
    return found[0] if found else None


def is_white(img: Image.Image) -> bool:
    data = img.tobytes()  # RGBA の並び
    px = [(data[i], data[i + 1], data[i + 2]) for i in range(0, len(data), 4) if data[i + 3] > 128]
    return bool(px) and sum(sum(p) / 3 for p in px) / len(px) > WHITE_LEVEL


def main() -> None:
    techs = json.loads(TECHS_JSON.read_text(encoding='utf-8'))['techs']
    resolver = Resolver()
    by_guid = {t['guid']: icon_name_of(resolver, t['guid']) for t in techs}
    names = sorted(set(by_guid.values()))

    missing = [n for n in names if find_dds(n) is None]
    if missing:
        print(f'足りないDDS {len(missing)}件(上のdocstringの手順で展開する):')
        print('(' + '|'.join(missing) + r')_0\.dds$')
        raise SystemExit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    white = []
    for n in names:
        img = Image.open(find_dds(n)).convert('RGBA')
        img.thumbnail((SIZE, SIZE), Image.LANCZOS)
        img.save(OUT_DIR / f'{n}.webp', 'WEBP', quality=88, method=6)
        if is_white(img):
            white.append(n)

    out = {'icons': by_guid, 'whiteIcons': white}
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f'研究 {len(by_guid)}件 / アイコン {len(names)}種類 / ほぼ白 {len(white)}種類 → {OUT_JSON.name}・{OUT_DIR.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
