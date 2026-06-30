import type { Goods } from '@anno/shared';
import { ModifierRegistry } from './ModifierRegistry';
import type { AbstractProductionModifier } from './ProductionModifier';
import { SettingsManager } from './SettingsManager';

const SECONDS_PER_MINUTE = 60;
const RECOMMENDED_RATE_STEP = 0.1;
const MAX_RECOMMENDED_RATE = 25;
const ACCEPTABLE_BUILDING_ERROR = 0.05;

/**
 * BuildingsMap型定義
 * 建物IDをキーとし、建物数（number）を値として保持
 * 特別なキー '_metadata' でGoods情報を保持
 */
export interface BuildingsMetadata {
  [buildingId: string]: Goods;
}

export interface BuildingsMap {
  [buildingId: string]: number | BuildingsMetadata | undefined;
  _metadata?: BuildingsMetadata;
}

/**
 * Pure calculation utilities for production chains.
 * Singleton — always access via ProductionCalculator.getInstance().
 */
export class ProductionCalculator {
    private static _instance: ProductionCalculator | null = null;
    private productionModifiers: AbstractProductionModifier[] = [];

    public static getInstance(): ProductionCalculator {
        if (!ProductionCalculator._instance) {
            ProductionCalculator._instance = new ProductionCalculator();
        }
        return ProductionCalculator._instance;
    }

    private constructor() {
        this.productionModifiers = ModifierRegistry.getInstance().getModifiers();
        this.productionModifiers.forEach((modifier) => modifier.loadConfig());

        // Keep modifier configs in sync when settings change.
        SettingsManager.getInstance().onChange((config) => {
            this.productionModifiers.forEach((modifier) => modifier.applySettings(config));
        });
    }

    /** Returns icon filenames for all modifiers that are boosting the given node. */
    getActiveVisualModifiers(buildingType: string): string[] {
        const goodsLike = { type: buildingType } as Goods;
        return this.productionModifiers.flatMap(m => {
            const icon = m.getVisualModifier();
            if (!icon) return [];
            return m.getProductivity(goodsLike).isAffected ? [icon] : [];
        });
    }

    /** Returns icon filenames for all modifiers that visually affect a specific production node. */
    getActiveVisualModifiersForNode(node: Goods): string[] {
        return this.productionModifiers.flatMap(m => {
            const icon = m.getVisualModifierForNode(node);
            if (!icon) return [];
            return m.getProductivity(node).isAffected ? [icon] : [];
        });
    }

    getProductivity(node: Goods): number {
        if (!node) return 1;
        let productivity = 1;

        for (const modifier of this.productionModifiers) {
            const modType = modifier.getType();
            if (modType === 'flat') {
                productivity += modifier.getValue(node);
            } else if (modType === 'percentage') {
                productivity += (100 * modifier.getValue(node));
            }
        }

        return productivity;
    }

    getAdjustedTime(node: Goods): number {
        if (!node) return 60;
        const time = node.time || 60;
        const productivity = this.getProductivity(node);
        return productivity ? time / productivity : time;
    }

    collectAllBuildings(productionData: Goods, requiredPerMinute: number, result: BuildingsMap = {}, depth = 0): BuildingsMap {
        if (!productionData || depth > 10) return result;

        const adjustedDuration = this.getAdjustedTime(productionData);
        const key = productionData.id || 'unknown';
        const buildings = adjustedDuration > 0
            ? (requiredPerMinute * adjustedDuration) / SECONDS_PER_MINUTE
            : 0;

        result[key] = ((result[key] as number) || 0) + buildings;
        if (!result['_metadata']) result['_metadata'] = {};
        if (!result['_metadata'][key]) {
            result['_metadata'][key] = productionData;
        }

        const outputCyclesPerMinute = adjustedDuration > 0
            ? (buildings * SECONDS_PER_MINUTE) / adjustedDuration
            : 0;

        if (Array.isArray(productionData.input)) {
            for (const input of productionData.input) {
                if (!input.id) continue;
                const requiredInputPerMinute = outputCyclesPerMinute;

                if (input.start_of_chain) {
                    const inputBuildings = this.calculateStartOfChainBuildings(input, requiredInputPerMinute, buildings, productionData);
                    result[input.id] = ((result[input.id] as number) || 0) + inputBuildings;
                    if (!result['_metadata'][input.id]) {
                        result['_metadata'][input.id] = input;
                    }
                    continue;
                }

                if (Array.isArray(input.input)) {
                    this.collectAllBuildings(input, requiredInputPerMinute, result, depth + 1);
                }
            }
        }

        return result;
    }

    private calculateStartOfChainBuildings(input: Goods, requiredInputPerMinute: number, consumingBuildings: number, parentProduction: Goods): number {
        const parentNeedsCharcoal = (parentProduction as any).fuel?.some((fuel: { id: string }) => fuel.id === 'charcoal') || parentProduction.needs_fuel;

        if (input.id === 'charcoal' && parentNeedsCharcoal) {
            const charcoalConsumptionPerBuildingPerMinute = SECONDS_PER_MINUTE / 120;
            const charcoalRequiredPerMinute = consumingBuildings * charcoalConsumptionPerBuildingPerMinute;
            const charcoalProductionDuration = 30;
            const perBuildingRate = SECONDS_PER_MINUTE / charcoalProductionDuration;
            return perBuildingRate > 0 ? charcoalRequiredPerMinute / perBuildingRate : 0;
        }

        const adjustedInputDuration = this.getAdjustedTime(input);
        const inputRatePerBuilding = adjustedInputDuration > 0
            ? SECONDS_PER_MINUTE / adjustedInputDuration
            : 0;
        return inputRatePerBuilding > 0
            ? requiredInputPerMinute / inputRatePerBuilding
            : 0;
    }

    collectBaseInputs(productionData: Goods, baseInputs: Map<string, Goods> = new Map()): Map<string, Goods> {
        if (!productionData || !Array.isArray(productionData.input)) {
            return baseInputs;
        }
        for (const input of productionData.input) {
            if (!input.id) continue;
            if (input.start_of_chain) {
                if (!baseInputs.has(input.id)) {
                    baseInputs.set(input.id, input);
                }
                continue;
            }
            if (Array.isArray(input.input)) {
                this.collectBaseInputs(input, baseInputs);
            }
        }
        return baseInputs;
    }

    calculateFuelBuildings(productionData: Goods, allBuildings: BuildingsMap): Array<{ id: string; count: number }> {
        const fuelList: Array<{ id: string; burning_time?: number }> =
            (productionData as any).fuel?.length
                ? (productionData as any).fuel
                : productionData.needs_fuel
                    ? [{ id: 'charcoal', burning_time: 120 }]
                    : [];

        if (!fuelList.length) return [];
        const consumingBuildings = productionData.id ? ((allBuildings[productionData.id] as number) || 0) : 0;

        return fuelList.map((fuel) => {
            const burningTime = fuel.burning_time || 120;
            const fuelBuildingDuration = 30;
            const fuelPerBuildingPerMinute = burningTime > 0 ? SECONDS_PER_MINUTE / burningTime : 0;
            const totalFuelNeededPerMinute = consumingBuildings * fuelPerBuildingPerMinute;
            const fuelProductionPerBuilding = fuelBuildingDuration > 0 ? SECONDS_PER_MINUTE / fuelBuildingDuration : 0;
            const fuelBuildingsNeeded = fuelProductionPerBuilding > 0
                ? totalFuelNeededPerMinute / fuelProductionPerBuilding
                : 0;
            return { id: fuel.id, count: fuelBuildingsNeeded };
        });
    }

    findRecommendedRate(productionData: Goods): number {

        const minRateForMainBuilding = this.getMinimumRateForMainBuilding(productionData);

        if (minRateForMainBuilding > MAX_RECOMMENDED_RATE) {
            return this.roundRate(minRateForMainBuilding);
        }

        let bestCandidateRate = minRateForMainBuilding;
        let bestCandidateError = Number.POSITIVE_INFINITY;
        let bestCandidateTotalError = Number.POSITIVE_INFINITY;
        let firstIntegerRate: number | null = null;

        const minStep = Math.max(1, Math.ceil(minRateForMainBuilding / RECOMMENDED_RATE_STEP));
        const maxSteps = Math.round(MAX_RECOMMENDED_RATE / RECOMMENDED_RATE_STEP);
        for (let step = minStep; step <= maxSteps; step++) {
            const candidateRate = this.roundRate(step * RECOMMENDED_RATE_STEP);
            const { maxError, totalError } = this.measureBuildingError(productionData, candidateRate);

            // 燃料建物を除外した誤差をチェック（Auto Ratio用）
            const errorExcludingFuel = this.measureBuildingErrorExcludingFuel(productionData, candidateRate);
            if (errorExcludingFuel <= 0.01 && firstIntegerRate === null) {
                firstIntegerRate = candidateRate;
            }

            const isBetterCandidate =
                maxError < bestCandidateError - 0.0001 ||
                (Math.abs(maxError - bestCandidateError) <= 0.0001 && totalError < bestCandidateTotalError - 0.0001) ||
                (
                    Math.abs(maxError - bestCandidateError) <= 0.0001 &&
                    Math.abs(totalError - bestCandidateTotalError) <= 0.0001 &&
                    candidateRate < bestCandidateRate
                );

            if (isBetterCandidate) {
                bestCandidateRate = candidateRate;
                bestCandidateError = maxError;
                bestCandidateTotalError = totalError;
            }
        }

        // 燃料建物を除くすべての建物が整数のレートが見つかればそれを返す（優先度：高）
        if (firstIntegerRate !== null) {
            return firstIntegerRate;
        }

        // 整数レートが見つからない場合は、誤差が最小のレートを返す（優先度：低）
        return this.roundRate(bestCandidateRate);
    }

    private getMinimumRateForMainBuilding(productionData: Goods): number {
        const adjustedDuration = this.getAdjustedTime(productionData);
        if (adjustedDuration <= 0) {
            return 1;
        }

        const minRate = SECONDS_PER_MINUTE / adjustedDuration;
        return Math.max(this.roundRate(minRate), RECOMMENDED_RATE_STEP);
    }

    private collectCycleTimes(productionData: Goods, bucket: number[] = []): number[] {
        if (!productionData) return bucket;
        bucket.push(productionData.time || 60);

        if (Array.isArray(productionData.input)) {
            for (const input of productionData.input) {
                if (Array.isArray(input.input)) {
                    this.collectCycleTimes(input, bucket);
                } else if (input.time) {
                    bucket.push(input.time);
                }
            }
        }
        return bucket;
    }

    private allBuildingsAreWholeNumbers(productionData: Goods, rate: number): boolean {
        const allBuildings = this.collectAllBuildings(this.cloneRecipe(productionData), rate, {});
        for (const [key, value] of Object.entries(allBuildings)) {
            if (key === '_metadata') continue;
            const num = value as number;
            const fraction = Math.abs(num - Math.round(num));
            if (fraction > 0.05 && fraction < 0.95) {
                return false;
            }
        }
        return true;
    }

    private measureBuildingError(productionData: Goods, rate: number): { maxError: number; totalError: number } {
        const allBuildings = this.collectAllBuildings(this.cloneRecipe(productionData), rate, {});
        let maxError = 0;
        let totalError = 0;

        for (const [key, value] of Object.entries(allBuildings)) {
            if (key === '_metadata') continue;
            const num = value as number;
            const error = Math.abs(num - Math.round(num));
            if (error > maxError) {
                maxError = error;
            }
            totalError += error;
        }

        for (const fuel of this.calculateFuelBuildings(productionData, allBuildings)) {
            const error = Math.abs(fuel.count - Math.round(fuel.count));
            if (error > maxError) {
                maxError = error;
            }
            totalError += error;
        }

        return { maxError, totalError };
    }

    /** 燃料建物を除外した誤差測定（Auto Ratio用） */
    private measureBuildingErrorExcludingFuel(productionData: Goods, rate: number): number {
        const allBuildings = this.collectAllBuildings(this.cloneRecipe(productionData), rate, {});
        let maxError = 0;

        for (const [key, value] of Object.entries(allBuildings)) {
            if (key === '_metadata') continue;
            const num = value as number;
            const error = Math.abs(num - Math.round(num));
            if (error > maxError) {
                maxError = error;
            }
        }

        return maxError;
    }

    calculateTotals(allBuildings: BuildingsMap): { buildingCost: Record<string, number>; maintenance: Record<string, number> } {
        const totals = {
            buildingCost: {} as Record<string, number>,
            maintenance: {} as Record<string, number>,
        };
        if (!allBuildings || !allBuildings['_metadata']) {
            return totals;
        }

        for (const [goodId, count] of Object.entries(allBuildings)) {
            if (goodId === '_metadata') continue;
            const metadata = allBuildings['_metadata'][goodId] as Goods | undefined;
            if (!metadata) continue;
            const ceiled = Math.ceil(count as number);

            if (metadata.building_cost) {
                this.accumulateCosts(totals.buildingCost, metadata.building_cost, ceiled);
            }
            if (metadata.maintanance_cost) {
                this.accumulateCosts(totals.maintenance, metadata.maintanance_cost, ceiled);
            }
        }
        return totals;
    }

    private accumulateCosts(target: Record<string, number>, costs: Record<string, number>, multiplier: number): void {
        for (const [resource, amount] of Object.entries(costs)) {
            const total = amount * multiplier;
            if (total <= 0) continue;
            target[resource] = (target[resource] || 0) + total;
        }
    }

    private roundRate(rate: number): number {
        return Math.ceil(rate * 10) / 10;
    }

    cloneRecipe(recipe: Goods): Goods {
        return structuredClone(recipe);
    }
}
