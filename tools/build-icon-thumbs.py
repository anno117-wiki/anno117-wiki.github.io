"""wiki 用アイコンの表示用サムネイル(WebP)を生成する。

wiki の商品一覧・生産チェーン一覧・建物効果はアイコンを最大28pxで表示するが、
元画像は128〜512pxのPNG(1枚最大約220KB)で、ページ転送量の大半を占めていた。
表示サイズに見合う小さなWebPを別ディレクトリに出力し、wiki側はそちらを参照する。

入力→出力（各入力ディレクトリの直下の *.png のみ。サブディレクトリは対象外）:
  packages/shared/public/icons/*.png          -> apps/wiki/docs/public/icons/goods-thumb/<名前>.webp
  apps/wiki/docs/public/icons/buildings/*.png -> apps/wiki/docs/public/icons/buildings-thumb/<名前>.webp

使い方: python tools/build-icon-thumbs.py
依存: Pillow
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WIKI_ICONS = ROOT / "apps" / "wiki" / "docs" / "public" / "icons"

# (入力ディレクトリ, 出力ディレクトリ)
JOBS: list[tuple[Path, Path]] = [
    (ROOT / "packages" / "shared" / "public" / "icons", WIKI_ICONS / "goods-thumb"),
    (WIKI_ICONS / "buildings", WIKI_ICONS / "buildings-thumb"),
]

# 表示は最大28px。高解像度スマホ(3倍)でもぼやけないよう 28*3 を上回る96pxにする
THUMB_SIZE = 96
WEBP_QUALITY = 85


def build_thumb(src: Path, dest: Path) -> None:
    with Image.open(src) as img:
        img = img.convert("RGBA")
        img.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
        img.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)


def run_job(src_dir: Path, out_dir: Path) -> list[str]:
    """1ディレクトリ分のサムネイルを生成し、失敗メッセージの一覧を返す。"""
    if not src_dir.is_dir():
        return [f"入力ディレクトリがありません: {src_dir}"]

    sources = sorted(src_dir.glob("*.png"))
    if not sources:
        return [f"PNG が見つかりません: {src_dir}"]

    out_dir.mkdir(parents=True, exist_ok=True)

    failed: list[str] = []
    src_total = 0
    out_total = 0
    for src in sources:
        dest = out_dir / (src.stem + ".webp")
        try:
            build_thumb(src, dest)
        except Exception as e:  # 壊れた画像が1枚あっても残りは処理する
            failed.append(f"{src.name}: {e}")
            continue
        src_total += src.stat().st_size
        out_total += dest.stat().st_size

    print(f"[{out_dir.name}] 生成: {len(sources) - len(failed)} / {len(sources)} 件"
          f"  サイズ: {src_total / 1024:.0f}KB -> {out_total / 1024:.0f}KB")
    return failed


def main() -> int:
    failed: list[str] = []
    for src_dir, out_dir in JOBS:
        failed += run_job(src_dir, out_dir)

    if failed:
        print("失敗:", *failed, sep="\n  ", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
