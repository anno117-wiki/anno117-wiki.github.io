import type { Goods } from '@anno/shared';

export interface ViewBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface GoodMetadata {
    id: string;
    displayName: string;
    icon: string;
}

export interface NodeData {
    x: number;
    y: number;
    good: GoodMetadata;
    buildings: number;
    textAlign: 'left' | 'right';
    hasFuel: boolean;
    buildingType: string;
    prodNode: Goods;
    depth: number;
    maxDepth: number;
    isLeaf: boolean;
    startOfChain: boolean;
    buildingCost?: Record<string, number>;
    maintenanceCost?: Record<string, number>;
    productivity: number;
}

export interface LabelGeometry {
    labelX: number;
    labelY: number;
    labelAnchor: 'start' | 'middle' | 'end';
    buildingsY: number;
}
