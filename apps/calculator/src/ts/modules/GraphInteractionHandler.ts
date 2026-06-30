import type { ViewBox, Point } from './GraphTypes';

export class GraphInteractionHandler {
    private svgElement: SVGSVGElement;
    private onViewBoxChange: (vb: ViewBox) => void;
    private cancelled = false;

    private isDragging = false;
    private startX = 0;
    private startY = 0;
    private activeTouches = new Map<number, Point>();
    private initialPinchDistance: number | null = null;
    private initialViewBox: ViewBox | null = null;

    constructor(svgElement: SVGSVGElement, onViewBoxChange: (vb: ViewBox) => void) {
        this.svgElement = svgElement;
        this.onViewBoxChange = onViewBoxChange;
        this.bindMouseEvents();
        this.bindTouchEvents();
        this.svgElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    cancel(): void {
        this.cancelled = true;
    }

    parseViewBox(): ViewBox {
        const viewBoxStr = this.svgElement.getAttribute('viewBox');
        if (!viewBoxStr) return { x: 0, y: 0, width: 400, height: 400 };
        const vb = viewBoxStr.split(' ').map(Number).filter(v => !Number.isNaN(v));
        if (vb.length !== 4) return { x: 0, y: 0, width: 400, height: 400 };
        return { x: vb[0]!, y: vb[1]!, width: vb[2]!, height: vb[3]! };
    }

    updateViewBox(viewBox: ViewBox): void {
        this.svgElement.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
        this.onViewBoxChange({ ...viewBox });
    }

    fitToView(): void {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (this.cancelled) return;
                try {
                    const bbox = this.svgElement.getBBox();
                    if (bbox.width === 0 || bbox.height === 0) return;

                    const padding = 100;
                    const verticalOffset = 80;
                    this.updateViewBox({
                        x: bbox.x - padding,
                        y: bbox.y - padding + verticalOffset,
                        width: bbox.width + padding * 2,
                        height: bbox.height + padding * 2
                    });
                } catch (error) {
                    console.warn('[fitToView] getBBox failed:', error);
                }
            });
        });
    }

    private clientToSvgPoint(touch: Touch): Point {
        const rect = this.svgElement.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    private distance(p1: Point, p2: Point): number {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    private firstActiveTouch(): Point {
        return this.activeTouches.values().next().value!;
    }

    private resetTouches = (): void => {
        this.activeTouches.clear();
        this.initialPinchDistance = null;
        this.initialViewBox = null;
        this.isDragging = false;
        this.svgElement.style.cursor = 'default';
    };

    private bindMouseEvents(): void {
        this.svgElement.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 0 && (e.target as HTMLElement).tagName !== 'image') {
                this.isDragging = true;
                this.startX = e.clientX;
                this.startY = e.clientY;
                this.svgElement.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        this.svgElement.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.isDragging) return;
            const viewBox = this.parseViewBox();
            const clientRect = this.svgElement.getBoundingClientRect();
            const dx = (e.clientX - this.startX) * (viewBox.width / clientRect.width);
            const dy = (e.clientY - this.startY) * (viewBox.height / clientRect.height);
            viewBox.x -= dx;
            viewBox.y -= dy;
            this.updateViewBox(viewBox);
            this.startX = e.clientX;
            this.startY = e.clientY;
        });

        this.svgElement.addEventListener('mouseup', (e: MouseEvent) => {
            if (e.button === 0) {
                this.isDragging = false;
                this.svgElement.style.cursor = 'default';
            }
        });

        this.svgElement.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.svgElement.style.cursor = 'default';
        });

        this.svgElement.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            const viewBox = this.parseViewBox();
            const rect = this.svgElement.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const svgX = viewBox.x + (mouseX / rect.width) * viewBox.width;
            const svgY = viewBox.y + (mouseY / rect.height) * viewBox.height;
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            const newWidth = viewBox.width * zoomFactor;
            const newHeight = viewBox.height * zoomFactor;
            viewBox.x = svgX - (mouseX / rect.width) * newWidth;
            viewBox.y = svgY - (mouseY / rect.height) * newHeight;
            viewBox.width = newWidth;
            viewBox.height = newHeight;
            this.updateViewBox(viewBox);
        });
    }

    private bindTouchEvents(): void {
        this.svgElement.addEventListener('touchstart', (e: TouchEvent) => {
            if (e.touches.length > 0) e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches.item(i);
                if (!touch) continue;
                this.activeTouches.set(touch.identifier, this.clientToSvgPoint(touch));
            }
            if (this.activeTouches.size === 1) {
                const point = this.firstActiveTouch();
                this.isDragging = true;
                this.startX = point.x;
                this.startY = point.y;
                this.svgElement.style.cursor = 'grabbing';
            } else if (this.activeTouches.size === 2) {
                const vals = this.activeTouches.values();
                this.initialPinchDistance = this.distance(vals.next().value!, vals.next().value!);
                this.initialViewBox = { ...this.parseViewBox() };
                this.isDragging = false;
            }
        }, { passive: false });

        this.svgElement.addEventListener('touchmove', (e: TouchEvent) => {
            if (e.touches.length > 0) e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches.item(i);
                if (!touch) continue;
                this.activeTouches.set(touch.identifier, this.clientToSvgPoint(touch));
            }
            if (this.activeTouches.size === 1 && this.isDragging) {
                const point = this.firstActiveTouch();
                const viewBox = this.parseViewBox();
                const clientRect = this.svgElement.getBoundingClientRect();
                const dx = (point.x - this.startX) * (viewBox.width / clientRect.width);
                const dy = (point.y - this.startY) * (viewBox.height / clientRect.height);
                viewBox.x -= dx;
                viewBox.y -= dy;
                this.updateViewBox(viewBox);
                this.startX = point.x;
                this.startY = point.y;
            } else if (this.activeTouches.size === 2 && this.initialPinchDistance && this.initialViewBox) {
                const vals = this.activeTouches.values();
                const p1 = vals.next().value!;
                const p2 = vals.next().value!;
                const currentDistance = this.distance(p1, p2);
                if (currentDistance <= 0) return;
                const scale = this.initialPinchDistance / currentDistance;
                const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
                const clientRect = this.svgElement.getBoundingClientRect();
                const focusX = this.initialViewBox.x + (mid.x / clientRect.width) * this.initialViewBox.width;
                const focusY = this.initialViewBox.y + (mid.y / clientRect.height) * this.initialViewBox.height;
                const newWidth = this.initialViewBox.width * scale;
                const newHeight = this.initialViewBox.height * scale;
                this.updateViewBox({
                    x: focusX - (mid.x / clientRect.width) * newWidth,
                    y: focusY - (mid.y / clientRect.height) * newHeight,
                    width: newWidth,
                    height: newHeight
                });
            }
        }, { passive: false });

        this.svgElement.addEventListener('touchend', (e: TouchEvent) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches.item(i);
                if (!touch) continue;
                this.activeTouches.delete(touch.identifier);
            }
            if (this.activeTouches.size === 0) {
                this.resetTouches();
            } else if (this.activeTouches.size === 1) {
                this.initialPinchDistance = null;
                this.initialViewBox = null;
                const point = this.firstActiveTouch();
                this.isDragging = true;
                this.startX = point.x;
                this.startY = point.y;
            } else if (this.activeTouches.size === 2) {
                // 3本指→2本指: ピンチ状態を再初期化して継続
                const vals = this.activeTouches.values();
                this.initialPinchDistance = this.distance(vals.next().value!, vals.next().value!);
                this.initialViewBox = { ...this.parseViewBox() };
            }
        });

        this.svgElement.addEventListener('touchcancel', this.resetTouches);
    }
}
