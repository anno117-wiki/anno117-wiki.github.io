/**
 * パネルリサイズ機能
 * 左右パネルの境界をドラッグして幅を変更可能にする
 */

export class PanelResizer {
  private static _instance: PanelResizer | null = null;

  public static getInstance(): PanelResizer {
    if (!PanelResizer._instance) {
      PanelResizer._instance = new PanelResizer();
    }
    return PanelResizer._instance;
  }

  private resizeHandle: HTMLElement | null = null;
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;
  private minWidth = 250;
  private maxWidth = 600;

  private constructor() {
    this.init();
  }

  private init(): void {
    this.resizeHandle = document.getElementById('resize-handle');
    if (!this.resizeHandle) return;

    // CSS変数から最小/最大幅を取得
    const rootStyles = getComputedStyle(document.documentElement);
    const minWidthStr = rootStyles.getPropertyValue('--left-panel-min-width').trim();
    const maxWidthStr = rootStyles.getPropertyValue('--left-panel-max-width').trim();

    if (minWidthStr) this.minWidth = parseInt(minWidthStr);
    if (maxWidthStr) this.maxWidth = parseInt(maxWidthStr);

    // イベントリスナー登録
    this.resizeHandle.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // タッチイベント対応
    this.resizeHandle.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.startResize(e.clientX);
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.startResize(e.touches[0].clientX);
    }
  }

  private startResize(clientX: number): void {
    this.isResizing = true;
    this.startX = clientX;

    // 現在の幅を取得
    const rootStyles = getComputedStyle(document.documentElement);
    const currentWidth = rootStyles.getPropertyValue('--left-panel-width').trim();
    this.startWidth = parseInt(currentWidth) || 400;

    // リサイズ中のスタイルを適用
    if (this.resizeHandle) {
      this.resizeHandle.classList.add('resizing');
    }
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isResizing) return;
    this.resize(e.clientX);
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isResizing || e.touches.length !== 1) return;
    e.preventDefault();
    this.resize(e.touches[0].clientX);
  }

  private resize(clientX: number): void {
    const delta = clientX - this.startX;
    let newWidth = this.startWidth + delta;

    // 最小/最大幅の制限
    newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));

    // CSS変数を更新
    document.documentElement.style.setProperty('--left-panel-width', `${newWidth}px`);
  }

  private handleMouseUp(): void {
    if (!this.isResizing) return;
    this.endResize();
  }

  private handleTouchEnd(): void {
    if (!this.isResizing) return;
    this.endResize();
  }

  private endResize(): void {
    this.isResizing = false;

    // リサイズ中のスタイルを解除
    if (this.resizeHandle) {
      this.resizeHandle.classList.remove('resizing');
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // 幅をlocalStorageに保存
    const rootStyles = getComputedStyle(document.documentElement);
    const currentWidth = rootStyles.getPropertyValue('--left-panel-width').trim();
    try {
      localStorage.setItem('anno117_left_panel_width', currentWidth);
    } catch (error) {
      console.warn('[PanelResizer] Failed to save panel width', error);
    }
  }

  /**
   * 保存された幅を復元
   */
  public restoreSavedWidth(): void {
    try {
      const savedWidth = localStorage.getItem('anno117_left_panel_width');
      if (savedWidth) {
        const width = parseInt(savedWidth);
        if (width >= this.minWidth && width <= this.maxWidth) {
          document.documentElement.style.setProperty('--left-panel-width', savedWidth);
        }
      }
    } catch (error) {
      console.warn('[PanelResizer] Failed to restore panel width', error);
    }
  }
}
