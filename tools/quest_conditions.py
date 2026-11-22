"""クエストの分かれ道の条件のうち、「内部の変数を比べる条件」(ConditionCompareVariable) を読める文にする。

変数名は開発者が付けた英語名で、意味はこの表に作者が書いた（名前と、その変数を書き換える選択肢・場面からの読み取り。実機では未確認）。
表に無い変数は「内部の記録「名前」…」という形で、名前と値をそのまま出す。

読み方の約束（実データで確かめた）:
  - 比べる相手の値が省略された条件は「偽（0）」と比べている。例: 依頼を断ると true になる変数の条件で、
    「満たす」側が、断っていない場合に進む場面につながっている。
  - 比べ方（ComparisonOperation）が省略されたものは「等しい」とみなす。
"""

# 真偽の変数: 変数名 -> (真のときの文, 偽のときの文)
BOOL_VARS = {
    "004_FoundPhilosophers": ("哲学者を見つけた", "哲学者をまだ見つけていない"),
    "Act3_Calidus_got_Caeso_deal": ("カリドゥスの提案をカエソに伝えた", "カリドゥスの提案をカエソに伝えていない"),
    "Bribe": ("賄賂を使った", "賄賂を使っていない"),
    "Campaign_Act2_IsRomanized": ("ローマ化した", "ローマ化していない"),
    "Campaign_Act2_StartedThroughCampaign": ("キャンペーンから第2幕を始めた", "キャンペーンから第2幕を始めていない（単独で始めた）"),
    "Campaign_Act3_StartedThroughCampaign": ("キャンペーンから第3幕を始めた", "キャンペーンから第3幕を始めていない（単独で始めた）"),
    "Campaign_FreeBenBaalion": ("ベン・バーリオンを自由にした", "ベン・バーリオンを自由にしていない"),
    "Campaign_LuciusAlive": ("ルキウスが生きている", "ルキウスが生きていない"),
    "Campaign_LuciusPaid": ("ルキウスに5,000デナリウスを渡した", "ルキウスに5,000デナリウスを渡していない"),
    "Campaign_MarciaConvinced": ("マルキアを説得した", "マルキアを説得していない"),
    "Campaign_MilitaryDone": ("軍事の件を終えた", "軍事の件を終えていない"),
    "DLC01_QL4-5_found_special_rock": ("特別な岩を見つけた", "特別な岩を見つけていない"),
    "DLC01_QL4-5_met_sybil_in_winter": ("冬にシビュラに会った", "冬にシビュラに会っていない"),
    "DLC03_MainStory_FinalDecisionActive": ("最終決断の場面に入っている", "最終決断の場面に入っていない"),
    "DeniedQuest": ("依頼を断った", "依頼を断っていない"),
    "DianaQuestDenied": ("ディアナの依頼を断った", "ディアナの依頼を断っていない"),
    "QuestDenied": ("依頼を断った", "依頼を断っていない"),
    "QuestAbandon": ("依頼を放棄した", "依頼を放棄していない"),
    "QuestAccepted": ("依頼を受けた", "依頼を受けていない"),
    "EscortEnd": ("護衛が終わった", "護衛が終わっていない"),
    "EvidencePublished": ("証拠を公表した", "証拠を公表していない"),
    "ExaminedCrewList": ("乗組員名簿を調べた", "乗組員名簿を調べていない"),
    "ExaminedKashtaBlade": ("カシュタの刃を調べた", "カシュタの刃を調べていない"),
    "ExaminedKitchenBlade": ("台所の刃を調べた", "台所の刃を調べていない"),
    "ExaminedLovePendant": ("愛のペンダントを調べた", "愛のペンダントを調べていない"),
    "ExaminedOrnateBlade": ("装飾された刃を調べた", "装飾された刃を調べていない"),
    "ExaminedTheaterPlay": ("劇を調べた", "劇を調べていない"),
    "FirstEvidenceFound_ValeriaNewInformation": ("最初の証拠でウァレリアの新しい情報が出た", "最初の証拠でウァレリアの新しい情報が出ていない"),
    "GotMummy1": ("ミイラ1を手に入れた", "ミイラ1を手に入れていない"),
    "GotMummy2": ("ミイラ2を手に入れた", "ミイラ2を手に入れていない"),
    "GotMummy3": ("ミイラ3を手に入れた", "ミイラ3を手に入れていない"),
    "HideForDecimus": ("デキムスから隠した", "デキムスから隠していない"),
    "OpenedCrate": ("木箱を開けた", "木箱を開けていない"),
    "PlayerArrivedInTime": ("間に合った", "間に合わなかった"),
    "SPQL019Accepted": ("カエソの輸送船の襲撃に同意した", "カエソの輸送船の襲撃に同意していない"),
    "ValeriaHub_AddLeadPendantLocation": ("ペンダントの手がかりを加えた", "ペンダントの手がかりを加えていない"),
    "ValeriaHub_AddLeadSnakeBlade": ("蛇の刃の手がかりを加えた", "蛇の刃の手がかりを加えていない"),
    "ValeriaHub_AddLeadTheaterPlay": ("劇の手がかりを加えた", "劇の手がかりを加えていない"),
    "ValeriaHub_FirstTimeExit": ("初めて出ようとしている", "初めてではない"),
    "ValeriaHub_FirstTimeOpened": ("初めて開いた", "初めてではない"),
    "MainStory_UpgradeRoman": ("ローマ層への進化を済ませた", "ローマ層への進化を済ませていない"),
    "good_food": ("晩餐の料理が良い出来だった", "晩餐の料理が良い出来ではなかった"),
    "good_god": ("晩餐の神への捧げ物が良い出来だった", "晩餐の神への捧げ物が良い出来ではなかった"),
    "good_song": ("晩餐の歌が良い出来だった", "晩餐の歌が良い出来ではなかった"),
    "perfect_banquet": ("晩餐が完璧だった", "晩餐が完璧ではなかった"),
    "BreadBasket_MainStory": ("穀物の本筋を進めている", "穀物の本筋を進めていない"),
    "Act1_BlockReactions": ("反応を止めている", "反応を止めていない"),
    "Campaign_StopDianaClickable": ("ディアナを選べなくした", "ディアナを選べなくしていない"),
    "Achievement_AnOfferYouCantRefuse_Valeria": ("ウァレリアの依頼に答えた", "ウァレリアの依頼にまだ答えていない"),
}

# 数の変数: 変数名 -> (名前, {値: 意味の文})。値の意味が分かるものだけ、右の表に書く
NUM_VARS = {
    "AllianceState": ("同盟の相手", {0: "一人で対処する", 1: "ウァレリアと組んだ", 2: "ディアナと組んだ"}),
    "Annoyance DLC03_01": ("苛立ち度", {}),
    "AnubimGateNumber": ("アヌビスの門の番号", {}),
    "Campaign_Act1_DianaBirthdayPartyTracker": ("ディアナの誕生会の選択", {1: "ディアナをかばった", 2: "ディアナに来てほしいと乞うた"}),
    "Campaign_Act2_SuccessLevelGnaeus": ("第2幕でのグナエウスの成功度", {}),
    "Campaign_Act2_VoadaSolution": ("ウォアダの件の解決方法", {}),
    "Campaign_Act3_JuliaQuestCounter": ("第3幕のユリアの依頼の進み具合", {}),
    "Campaign_GnaeusPower": ("グナエウスの勢力", {}),
    "Campaign_JuliaPower": ("ユリアの勢力", {}),
    "Campaign_PowerStruggleSolution": ("権力争いの決着", {}),
    "Campaign_RememberRopeAmount": ("覚えている縄の量", {}),
    "Colosseum_AudienceFavor": ("観客の支持", {}),
    "Colosseum_NeutralFavor": ("中立の支持", {}),
    "Colosseum_PatricianFavor": ("パトリキの支持", {}),
    "CultorStone": ("異端教団への入信を希望した回数", {}),
    "DLC03_EMA Path": ("選んだ道", {1: "穀物税の管理を掌握する", 2: "ヘロンの副業に加わる"}),
    "Act2_ConstructionMaterialCounter": ("建設資材の進み具合", {}),
    "INT Escort Loop Variable": ("護衛の繰り返し回数", {}),
    "Julia_MerchantSuccess": ("ユリアの商人の成功度", {}),
    "MM_HowManyCorrectAnswers": ("正解の数", {}),
    "MummificationSupplyStatus": ("ミイラ化の供給", {1: "ウァレリアまたはカンディスの注文に応じた", 2: "ヘロンの注文に応じた", 3: "何も供給しない"}),
    "MummyCondition": ("ミイラの状態の値", {}),
    "RNG": ("乱数の結果", {}),
    "Recurrence": ("「後で戻って決断する」を選んだ回数", {}),
    "RockfallCollectiblesCounter": ("落石で集めた品の数", {}),
    "Rockfall_CompletionType": ("落石の終わり方", {}),
    "SPQLW006_Virtue": ("徳の得点", {}),
    "SPQL_ManxTendency": ("マンクスへの傾き", {}),
    "SpeakerSentAround": ("弁士を追い払った回数", {}),
    "ThievesVariable": ("泥棒の進み具合", {}),
    "TilesTracker": ("タイルの進み具合", {}),
    "Worthiness": ("ふさわしさの得点", {}),
    "insignificant_beast_counter": ("取るに足らない獣を選んだ回数", {}),
    "VulcanSacrifices": ("ウルカヌスへの捧げ物の数", {}),
    "Vulcanic_Fervour": ("ウルカヌス信仰の熱意", {}),
}

# 比べ方 -> 数の言い方
OP_SUFFIX = {"Equals": "", "MoreThan": "より多い", "LessThan": "未満", "AtMost": "以下", "AtLeast": "以上"}

_VALUE_KEYS = ("BoolValue", "IntValue", "FloatValue")
_VARIABLE_KEYS = ("IntVariableName", "FloatVariableName", "AssetVariableName", "BoolVariableName")


def _second(p):
    """比べる相手を (値, 変数名) で返す。省略されていれば (None, None)。"""
    value = variable = None
    for k, v in p.items():
        if not k.startswith("SecondVariable.Values."):
            continue
        tail = k.rsplit(".", 1)[-1]
        if tail in _VALUE_KEYS:
            value = v
        elif tail in _VARIABLE_KEYS:
            variable = v
    return value, variable


def _number(v):
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return int(f) if f.is_integer() else f


def _label(var):
    if var in NUM_VARS:
        return NUM_VARS[var][0]
    return f"内部の記録「{var}」"


def variable_condition(p):
    """ConditionCompareVariable の引数（辞書）を読める文にする。"""
    var = p.get("VariableToCheck")
    if not var:
        return None
    op = p.get("ComparisonOperation", "Equals")
    value, other = _second(p)

    # 別の変数と比べる（例: グナエウスの勢力がユリアの勢力より多い）
    if other is not None:
        if var == "Challenger" and other == "InvalidChallenger":
            return "挑戦者が決まっていない" if op == "Equals" else "挑戦者が決まっている"
        suffix = OP_SUFFIX.get(op)
        if suffix is None:
            return None
        if var == "MP_VolcanoQuestLineOwner":
            return "この島の持ち主が、ウルカヌスのクエストの参加者である"
        return f"{_label(var)}が{_label(other)}" + ("と同じ" if op == "Equals" else suffix)

    # 真偽の変数（相手の値の省略は偽）
    if var in BOOL_VARS:
        true_text, false_text = BOOL_VARS[var]
        wants_true = value in ("1", "true", "True")
        if op != "Equals":
            return None
        return true_text if wants_true else false_text

    # 数の変数（相手の値の省略は0）
    n = _number(value) if value is not None else 0
    suffix = OP_SUFFIX.get(op)
    if n is None or suffix is None:
        return None
    if var in NUM_VARS:
        label, meanings = NUM_VARS[var]
        if op == "Equals" and n in meanings:
            return meanings[n]
        return f"{label}が{n:,}" + suffix if op != "Equals" else f"{label}が{n:,}"
    return f"{_label(var)}が{n:,}" + (suffix if op != "Equals" else "")
