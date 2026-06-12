import type { AbstractProductionModifier, ModifierDefinition } from './ProductionModifier';

/**
 * Central registry for all production modifiers.
 * New modifiers only need to register once at bootstrap.
 */
export class ModifierRegistry {
    private static _instance: ModifierRegistry | null = null;
    private readonly modifiers = new Map<string, AbstractProductionModifier>();
    private readonly definitionChangeListeners = new Set<() => void>();

    public static getInstance(): ModifierRegistry {
        if (!ModifierRegistry._instance) {
            ModifierRegistry._instance = new ModifierRegistry();
        }
        return ModifierRegistry._instance;
    }

    register(modifier: AbstractProductionModifier): void {
        const id = modifier.getDefinition().id;
        this.modifiers.set(id, modifier);
    }

    getModifiers(): AbstractProductionModifier[] {
        return Array.from(this.modifiers.values());
    }

    getDefinitions(): ModifierDefinition[] {
        return this.getModifiers().map((modifier) => modifier.getDefinition());
    }

    /**
     * Subscribe to definition changes (e.g., when Item activeChainId changes).
     * @param callback Function to call when definitions change
     * @returns Unsubscribe function
     */
    onDefinitionsChanged(callback: () => void): () => void {
        this.definitionChangeListeners.add(callback);
        return () => this.definitionChangeListeners.delete(callback);
    }

    /**
     * Notify all listeners that modifier definitions have changed.
     * Called when Item.setActiveChain() changes the active chain.
     */
    notifyDefinitionsChanged(): void {
        this.definitionChangeListeners.forEach((listener) => {
            try {
                listener();
            } catch (error) {
                console.error('[ModifierRegistry] Error in definition change listener:', error);
            }
        });
    }
}
