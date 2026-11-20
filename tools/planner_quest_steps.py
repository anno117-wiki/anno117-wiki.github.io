"""Planner のクエストのノード（quests.json の nodes）から、クエスト一覧の「節」(steps) を作る。

annohead に無いクエスト（皇帝の依頼・住民の依頼・総督の決定など）用。
annohead 由来の build_story() と同じ形の節を返す（QuestList.vue がそのまま描ける）。

節にするもの:
  - 選択肢が2つ以上の決定（DecisionRoot の画面 + 各選択肢の結果）
  - 文のある目標（Objective 系）
結果（報酬と、次に進む節）は、見せる節に着くまでのノードをたどって集める。
読み方の限界: 並行して走る枝は全部たどる。報酬の割り当ては実機で確かめていない。
"""
import re

REWARD_KINDS = {"goods", "item", "reputation", "effect", "unlock", "incident"}


def _clean(s):
    return " ".join((s or "").replace("​", "").replace("\r", "").split())


class PlannerSteps:
    def __init__(self, meta, text, name, reward, readable, text_limit=160):
        """meta: Planner のクエスト1件。text(ref)->日本語の文 / name(guid)->名前 /
        reward(kind, asset, amount)->札の辞書 / readable(文)->差し込みを読める形に"""
        self.meta = meta
        self.nodes = {n["id"]: n for n in meta["nodes"]}
        self.vars = {k: v.get("start") for k, v in (meta.get("variables") or {}).items()}
        self.text, self.name, self.reward, self.readable = text, name, reward, readable
        self.limit = text_limit

    # ---- 文 ----
    def _fill(self, s, obj_vars):
        """目標の文の差し込みを、目標が持つ値で埋める（埋められない分は readable に任せる）"""
        def sub(m):
            key = m.group(1)
            v = obj_vars.get(key)
            if isinstance(v, dict) and isinstance(v.get("$ref"), int):
                return self.name(v["$ref"]) or m.group(0)
            if isinstance(v, (int, float)):
                return f"{v:,.0f}" if float(v).is_integer() else f"{v:g}"
            return m.group(0)
        return re.sub(r"\{([^{}]*(?:\([^{}]*\))?[^{}]*)\}", sub, s)

    def _t(self, ref, obj_vars=None, limit=None):
        if ref is None:
            return None
        s = _clean(self.text(ref))
        if not s:
            return None
        if obj_vars:
            s = self._fill(s, obj_vars)
        s = re.sub(r"<[^>]+>", "", s)  # <i> <b> などの装飾は外す
        s = re.sub(r"(?<!\d)0/(\d)", r"\g<1>", s)  # 「0/30」は「30」に（達成前の値は意味がない）
        s = self.readable(s)
        # 埋められなかった差し込みは、読める言葉にする。数が付く目標は「：」より前の説明だけにする
        if re.search("（(?:必要な数|必要な量|今の数|数)）", s):
            head = re.split("[:：]", s, maxsplit=1)[0].strip()
            if head:
                s = head
        for ph, word in (("（届け先）", "指定の場所"), ("（品物）", "指定の品物")):
            s = s.replace(ph, word)
        s = " ".join(s.split()).rstrip(":：").rstrip()
        lim = limit or self.limit
        return s if len(s) <= lim else s[:lim].rstrip() + "…"

    # ---- 報酬 ----
    def _amount(self, a):
        if isinstance(a, str) and a.startswith("$"):
            return self.vars.get(a[1:])
        return a

    def _rewards(self, node):
        out = []
        for r in node.get("rewards") or []:
            if r.get("kind") in REWARD_KINDS:
                got = self.reward(r["kind"], r.get("asset"), self._amount(r.get("amount")))
                if got:
                    out.append(got)
        # 通知に出る報酬の一覧（shownRewards）は、報酬の節に無いときだけ足す
        if not out:
            for nt in node.get("notifications") or []:
                for r in nt.get("shownRewards") or []:
                    if r.get("asset"):
                        got = self.reward("goods", r["asset"], self._amount(r.get("amount")))
                        if got:
                            out.append(got)
        return out

    # ---- 見せる節 ----
    def _is_choice(self, n):
        return n["kind"] == "DecisionRoot" or (n["kind"] == "Decision" and len((n.get("decision") or {}).get("options") or []) >= 2
                                               and not self._screen_owner(n["id"]))

    def _screen_owner(self, nid):
        """この決定が、DecisionRoot の画面として使われているなら、その DecisionRoot の id"""
        for n in self.nodes.values():
            if n["kind"] == "DecisionRoot" and any(e["kind"] == "screen" and e["to"] == nid for e in n["edges"]):
                return n["id"]
        return None

    def _is_objective(self, n):
        o = n.get("objective")
        return bool(o) and n["kind"] != "SelectObjectiveComponent" and (o.get("text") is not None or o.get("headline") is not None) \
            and bool(self._t(o.get("headline") if o.get("headline") is not None else o.get("text"), o.get("vars")))

    def _visible_ids(self):
        # 開始から幅優先で、見つけた順に並べる
        start = next((n["id"] for n in self.nodes.values() if n["kind"] == "StoryLine"), None)
        order, seen, queue = [], set(), [start]
        while queue:
            g = queue.pop(0)
            if g in seen or g not in self.nodes:
                continue
            seen.add(g)
            n = self.nodes[g]
            if self._is_choice(n) or self._is_objective(n):
                order.append(g)
            queue += [e["to"] for e in n["edges"]]
        return order

    def _outcome(self, targets, visible, labels, base_seen=()):
        """targets から出発して、見せる節に着くまでの報酬を集める"""
        rewards, nxt, seen = [], [], set(base_seen)
        stack = list(targets)
        while stack:
            g = stack.pop(0)
            if g in seen or g not in self.nodes:
                continue
            seen.add(g)
            if g in visible:
                nxt.append(labels[g])
                continue
            n = self.nodes[g]
            rewards += self._rewards(n)
            stack += [e["to"] for e in n["edges"]]
        return {"rewards": self._dedupe(rewards), "next": list(dict.fromkeys(nxt))}

    @staticmethod
    def _dedupe(rewards):
        """同じ札を1つにする。「効果: X」と「品物: X 1」のように、種類だけ違う同名は先に出た方を残す"""
        def core(r):
            t = r["t"].split(": ", 1)[-1]
            return re.sub(r" [\d,.]+$", "", t)
        seen, out = set(), []
        for r in rewards:
            if r["t"] in seen or (r["k"] in ("goods", "questitem") and core(r) in {core(x) for x in out if x["k"] not in ("goods", "questitem")}):
                continue
            seen.add(r["t"])
            out.append(r)
        return out

    def build(self):
        order = self._visible_ids()
        visible = set(order)
        labels, cnt = {}, {}
        for g in order:
            k = "選択" if self.nodes[g]["kind"] in ("DecisionRoot", "Decision") else "目標"
            cnt[k] = cnt.get(k, 0) + 1
            labels[g] = f"{k}{cnt[k]}"
        steps = []
        for g in order:
            n = self.nodes[g]
            if n["kind"] in ("DecisionRoot", "Decision"):
                steps.append(self._choice_step(n, visible, labels))
            else:
                o = n["objective"]
                ov = o.get("vars") or {}
                st = {"id": labels[g], "kind": "objective",
                      "text": self._t(o.get("headline") if o.get("headline") is not None else o.get("text"), ov) or "（目標）"}
                by = {}
                for e in n["edges"]:
                    by.setdefault(e["kind"], []).append(e["to"])
                st["met"] = self._outcome(by.get("success", []), visible, labels, {g})
                st["missed"] = self._outcome(by.get("failure", []) + by.get("timeout", []), visible, labels, {g})
                steps.append(st)
        return steps

    def _choice_step(self, n, visible, labels):
        screen = n
        if n["kind"] == "DecisionRoot":
            sid = next((e["to"] for e in n["edges"] if e["kind"] == "screen"), None)
            screen = self.nodes.get(sid, n)
        dec = screen.get("decision") or {}
        speaker = dec.get("character")
        st = {"id": labels[n["id"]], "kind": "decision",
              "speaker": self.name(speaker) if speaker else None,
              "title": self._t(dec.get("headline")), "text": self._t(dec.get("text")), "options": []}
        for i, opt in enumerate(dec.get("options") or []):
            # 選択肢 i の結果: 根（DecisionRoot）の option i と、画面の option i の先
            targets = [e["to"] for e in n["edges"] if e["kind"] == "option" and e.get("index") == i]
            if screen is not n:
                targets += [e["to"] for e in screen["edges"] if e["kind"] == "option" and e.get("index") == i]
            res = self._outcome(targets, visible, labels, {n["id"], screen["id"]})
            st["options"].append({"text": self._t(opt.get("text")) or "（文なし）", **res})
        if n["kind"] == "DecisionRoot":
            to = [e["to"] for e in n["edges"] if e["kind"] == "timeout"]
            if to:
                st["timeout"] = self._outcome(to, visible, labels, {n["id"], screen["id"]})
        return st
