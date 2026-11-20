"""texts_*.xml(ゲームの画面の文言)を読むモジュール。

入力: _local/anno-official-data/v3.0.1-steam/texts_{language}.xml
      (Steam版の config.rda から展開したもの。language は japanese / english など)

使い方:
    from assets_texts import load_texts
    ja = load_texts('japanese')   # {LineId(int): 文言}
    ja[int(asset_values['/Text/OasisId'])]

日本語の文言は単語の間にゼロ幅スペース(U+200B)が入っている。表示用に使うときは取り除く(strip_zw)。
"""
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / '_local' / 'anno-official-data' / 'v3.0.1-steam'
ZERO_WIDTH_SPACE = '​'


def load_texts(language: str, data_dir: Path = DATA_DIR) -> dict[int, str]:
    """{LineId: 文言}。ファイルが無ければ FileNotFoundError"""
    path = data_dir / f'texts_{language}.xml'
    if not path.exists():
        raise FileNotFoundError(f'{path} が無い(Steam版の config.rda から展開して置く)')
    out: dict[int, str] = {}
    for t in ET.parse(path).getroot().iter('Text'):
        line_id = t.findtext('LineId')
        if line_id is not None:
            out[int(line_id)] = t.findtext('Text') or ''
    return out


def strip_zw(text: str) -> str:
    return text.replace(ZERO_WIDTH_SPACE, '')
