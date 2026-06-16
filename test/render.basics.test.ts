import type { INode } from '../src/interfaces';
import { DiagramView } from '../src/view/diagram.view';
import { RenderBasics } from '../src/nodes/render.basics';

class FakePath2D {
    rect(): void { }
}

describe('RenderBasics', () => {
    it('renders text using node textColor instead of fill or stroke color', () => {
        const originalPath2D = globalThis.Path2D;
        globalThis.Path2D = FakePath2D as unknown as typeof Path2D;

        const fillStyles: string[] = [];
        const context = {
            fillStyle: '',
            strokeStyle: '',
            shadowColor: '',
            textAlign: 'left',
            textBaseline: 'top',
            font: '',
            save() { },
            restore() { },
            translate() { },
            rotate() { },
            setLineDash() { },
            measureText(text: string) {
                return { width: text.length * 8 } as TextMetrics;
            },
            fillText(this: { fillStyle: string }, _text: string, _x: number, _y: number) {
                fillStyles.push(String(this.fillStyle));
            },
        } as unknown as CanvasRenderingContext2D;

        const owner = Object.create(DiagramView.prototype) as DiagramView;
        Object.defineProperties(owner, {
            getCoordinates: {
                value: () => ({
                    pan: { x: 0, y: 0 },
                    getBoundingRect: () => ({ left: 20, top: 30, width: 160, height: 60 }),
                }),
            },
            getCache: {
                value: () => ({
                    getNode: () => undefined,
                }),
            },
        });

        const node: INode = {
            id: 'text-node',
            type: 'rectangle',
            points: [{ x: 20, y: 30 }, { x: 180, y: 90 }],
            text: 'Visible label',
            textAlign: 'center',
            textBaseline: 'middle',
            fontFace: 'Tahoma',
            fontSize: 16,
            // font: '16px Tahoma',
            strokeStyle: '#334155',
            textColor: '#000000',
            owner,
        };

        try {
            RenderBasics.renderText(node, context, { overflow: 'visible' });
        } finally {
            globalThis.Path2D = originalPath2D;
        }

        expect(fillStyles).toEqual(['#000000']);
    });

    it('loads image-backed node assets and triggers a rerender', () => {
        const originalImage = globalThis.Image;

        class FakeImage {
            onload: null | (() => void) = null;
            onerror: null | (() => void) = null;
            private _src = '';

            set src(value: string) {
                this._src = value;
                this.onload?.();
            }

            get src(): string {
                return this._src;
            }
        }

        globalThis.Image = FakeImage as unknown as typeof Image;

        const cachedNodes = new Map<INode, any>();
        let renderCount = 0;
        const context = {
            fillStyle: '',
            strokeStyle: '',
            shadowColor: '',
            lineCap: 'round',
            lineJoin: 'round',
            lineWidth: 1,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowBlur: 0,
            save() { },
            restore() { },
            translate() { },
            rotate() { },
            setLineDash() { },
            createPattern() {
                return null;
            },
        } as unknown as CanvasRenderingContext2D;

        const owner = Object.create(DiagramView.prototype) as DiagramView;
        Object.defineProperties(owner, {
            render_mode: { value: 'view' },
            getCoordinates: {
                value: () => ({
                    getBoundingRect: () => ({ left: 20, top: 30, width: 160, height: 60 }),
                }),
            },
            getCache: {
                value: () => ({
                    getNode: (node: INode) => cachedNodes.get(node),
                    setNode: (node: INode, cached: unknown) => cachedNodes.set(node, cached),
                }),
            },
            render: {
                value: () => {
                    renderCount += 1;
                },
            },
        });

        const node: INode = {
            id: 'svg-node',
            type: 'svg',
            points: [{ x: 20, y: 30 }, { x: 180, y: 90 }],
            image_id: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
            img_mode: 'frame',
            strokeStyle: '#334155',
            owner,
        };

        try {
            RenderBasics.prepare(node, context);
        } finally {
            globalThis.Image = originalImage;
        }

        expect(cachedNodes.get(node)?.img).toBeDefined();
        expect(renderCount).toBe(1);
    });
});