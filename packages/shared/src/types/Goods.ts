type WorkerType =
    | "patrician"
    | "smith"
    | "nobles"
    | "equites"
    | "plebeian"
    | "alderman"
    | "wader"
    | "mercators"
    | "libertus";

interface BuildingCost {
    [key: string]: number;
}

/** アイギュプトの労働力(thresher・potter・chanter・scribe・gymnasiarch)も同じ形で持つ */
type MaintanceCost = {
    [key in WorkerType]?: number;
} & {
    [key: string]: number;
    money: number;
};

export interface Goods {
    id: string;
    name: string;
    type: string;
    guid: string;
    time: number;
    needs_fuel: boolean;
    building_cost: BuildingCost;
    maintanance_cost: MaintanceCost;
    input: Goods[];
    start_of_chain?: boolean;
    /** 表示名の翻訳キー(goods.<name_key>)。同じ商品を作る建物が複数あるとき、建物名つきの名前を出すために使う */
    name_key?: string;
}