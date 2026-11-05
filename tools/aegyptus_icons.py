"""アイギュプト専用商品のアイコン名の対応表(商品id -> goods-thumb のファイル名)。

元画像はゲームの icon_3d_<名前>_goods.png (icons-archive/layout-tool-data-ui/fhd/dlc03/icon_content/production_goods)。
build-regions-aegyptus.py と build-chain-aegyptus.py が共有する。
"""

_ICON_BASE = {
    'sesame_pods': 'sesame', 'pomegranates': 'pomegranates', 'dates': 'dates',
    'sanga_cattle': 'sanga_cows', 'kamel': 'camels', 'aegyptian_blue': 'egyptian_blue',
    'honeyed_milk': 'honey_milk', 'sesame_oil': 'sesame_oil', 'papyrus': 'papyrus',
    'stuffed_goose': 'stuffed_goose', 'blue_lotus_tea': 'lotus_tea', 'kayk': 'kahk',
    'rare_meat_platters': 'appetizers', 'wesekh_collars': 'usekh_collar', 'kollurion': 'kohl',
    'shentis': 'shenti', 'kalasirises': 'kalasiris', 'perfumed_oils': 'perfumed_oil',
    'milk_of_poppea': 'bathing_milk', 'apotropaic_talismans': 'talismans', 'oil_lamps': 'oil_lamps',
    'sistrums': 'sistrum_rattle', 'scribing_sets': 'scribes_sets', 'ivory_caskets': 'ivory_casket',
    'mud_bricks': 'mud_bricks', 'limestone_bricks': 'limestone_bricks', 'beads': 'beads',
    'wild_geese': 'wild_goose', 'blue_lotus': 'blue_lotus', 'hippopotami': 'hippos',
}


def icon_name(product_id: str) -> str:
    """'aegyptus_dates' -> 'icon_3d_dates_goods'。対応が無ければ空文字。"""
    base = _ICON_BASE.get(product_id.removeprefix('aegyptus_'))
    return f'icon_3d_{base}_goods' if base else ''
