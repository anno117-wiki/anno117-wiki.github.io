/**
 * Vueベースのツリービューアプリケーション
 * 既存のApp.tsと共存し、機能フラグで切り替え可能
 *
 * TreeAppRoot.vueラッパーコンポーネントを使用し、
 * defineExposeされたメソッド経由でリアクティブに状態を更新
 */

import { createApp } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import TreeAppRoot from '../components/TreeAppRoot.vue';
import type { RecipeListItem } from './types/RecipeList';

export interface TreeAppConfig {
  container: HTMLElement;
  goods: RecipeListItem[];
  selectedId?: string;
  onSelect: (good: RecipeListItem) => void;
}

interface TreeAppRootExposed {
  updateGoods: (goods: RecipeListItem[]) => void;
  updateSelection: (selectedId: string | undefined) => void;
}

export class TreeApp {
  private app: ReturnType<typeof createApp> | null = null;
  private rootInstance: (ComponentPublicInstance & TreeAppRootExposed) | null = null;
  private config: TreeAppConfig;

  constructor(config: TreeAppConfig) {
    this.config = config;
  }

  public mount(): void {
    if (this.app) {
      console.warn('[TreeApp] Already mounted');
      return;
    }

    // ラッパーコンポーネントを作成
    this.app = createApp(TreeAppRoot, {
      initialGoods: this.config.goods,
      initialSelectedId: this.config.selectedId,
      onSelect: this.config.onSelect,
    });

    // マウントして、exposeされたメソッドへの参照を保持
    this.rootInstance = this.app.mount(this.config.container) as ComponentPublicInstance & TreeAppRootExposed;

    console.log('[TreeApp] Mounted successfully with', this.config.goods.length, 'goods');
  }

  public unmount(): void {
    if (!this.app) {
      console.warn('[TreeApp] Not mounted');
      return;
    }

    this.app.unmount();
    this.app = null;
    this.rootInstance = null;

    console.log('[TreeApp] Unmounted successfully');
  }

  public updateGoods(goods: RecipeListItem[]): void {
    this.config.goods = goods;

    if (this.rootInstance && typeof this.rootInstance.updateGoods === 'function') {
      // リアクティブに更新（再マウント不要）
      this.rootInstance.updateGoods(goods);
      console.log('[TreeApp] Updated goods:', goods.length, 'items');
    } else {
      console.warn('[TreeApp] Cannot update goods: not mounted or method not exposed');
    }
  }

  public updateSelection(selectedId: string | undefined): void {
    this.config.selectedId = selectedId;

    if (this.rootInstance && typeof this.rootInstance.updateSelection === 'function') {
      // リアクティブに更新
      this.rootInstance.updateSelection(selectedId);
    } else {
      console.warn('[TreeApp] Cannot update selection: not mounted or method not exposed');
    }
  }
}
