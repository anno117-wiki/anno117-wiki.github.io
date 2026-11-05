#!/usr/bin/env python3
"""アイギュプトの建物(wiki 建物効果ページ)のアイコンを、表示用の96px WebPにして buildings-thumb/ に置く。

入力 : apps/wiki/docs/wiki/buildings-aegyptus.json の icon (tools/build-buildings-aegyptus.py が出力)
       _local/anno-official-data/icons-archive/ のゲームのアイコン(icon_3d_<icon>.png)
出力 : apps/wiki/docs/public/icons/buildings-thumb/icon_3d_<icon>.webp (既にあるものは作り直さない)

アイコンが見つからないときは、その名前を表示して異常終了する(画面の画像切れを防ぐため)。
実行: python tools/build-aegyptus-building-icons.py
依存: Pillow
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BUILDINGS = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'buildings-aegyptus.json'
ARCHIVE = ROOT / '_local' / 'anno-official-data' / 'icons-archive'
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'public' / 'icons' / 'buildings-thumb'
THUMB_SIZE = 96
WEBP_QUALITY = 85


def index_archive() -> dict[str, Path]:
    """アーカイブ内の icon_3d_*.png を、ファイル名 -> パスで引けるようにする(DLC03のフォルダを優先)。"""
    found: dict[str, Path] = {}
    for p in sorted(ARCHIVE.rglob('icon_3d_*.png'), key=lambda p: ('dlc03' not in p.parts, str(p))):
        found.setdefault(p.name, p)
    return found


def main() -> None:
    icons = sorted({b['icon'] for b in json.loads(BUILDINGS.read_text(encoding='utf-8'))['buildings'] if b.get('icon')})
    sources = index_archive()
    OUT.mkdir(parents=True, exist_ok=True)
    made, missing = 0, []
    for icon in icons:
        dest = OUT / f'icon_3d_{icon}.webp'
        if dest.exists():
            continue
        src = sources.get(f'icon_3d_{icon}.png')
        if src is None:
            missing.append(icon)
            continue
        with Image.open(src) as img:
            img = img.convert('RGBA')
            img.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
            img.save(dest, 'WEBP', quality=WEBP_QUALITY, method=6)
        made += 1
    print(f'アイコン {len(icons)}種のうち、新しく {made}件を生成')
    if missing:
        sys.exit(f'見つからないアイコン: {missing}')


if __name__ == '__main__':
    main()
