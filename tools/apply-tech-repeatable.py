#!/usr/bin/env python3
"""繰り返し研究できるスキルに、techs.json の `repeatable: true` を付ける(月桂冠風の飾り枠の表示用)。

入力 : assets.xml から作った研究(tools/assets_techs.py。各スキルの repeatable。245件中14件が true)
出力 : apps/wiki/docs/wiki/techs.json (guid が一致するスキルに repeatable: true を付ける。false は項目を持たせない)

- techs.json は CRLF・インデント2で書かれているので、同じ書式で書き戻す
- 何度実行しても結果は同じ(付け直す)。build-techs-dlc03.py は repeatable も出すので、DLC03を作り直したら、この結果と同じになる
実行: python tools/apply-tech-repeatable.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from assets_techs import load_techs  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'apps' / 'wiki' / 'docs' / 'wiki' / 'techs.json'


def main() -> None:
    planner = load_techs()['techs']  # assets.xml から作る(Planner の techs.json と同じ形)
    repeatable = {str(t['guid']) for t in planner if t['repeatable']}
    raw = OUT.read_text(encoding='utf-8')
    nl = '\r\n' if '\r\n' in raw else '\n'
    data = json.loads(raw)
    if json.dumps(data, ensure_ascii=False, indent=2).replace('\n', nl) + nl != raw:
        sys.exit('techs.json の書式が想定と違う(書き戻すと差分が出る)ため中止')
    guids = {str(t['guid']) for t in data['techs']}
    missing = repeatable - guids
    if missing:
        sys.exit(f'Planner の繰り返しスキルが techs.json に無い: {sorted(missing)}')
    for t in data['techs']:
        if str(t['guid']) in repeatable:
            t['repeatable'] = True
        else:
            t.pop('repeatable', None)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2).replace('\n', nl) + nl, encoding='utf-8', newline='')
    print(f'繰り返しスキル {len(repeatable)} 件に印を付けた -> {OUT}')


if __name__ == '__main__':
    main()
