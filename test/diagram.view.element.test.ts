import type { INode } from '../src';
import { DiagramView } from '../src/view/diagram.view';
import { DiagramViewElement, registerDiagramViewElement } from '../src/elements/diagram.view.element';

function createContext(): CanvasRenderingContext2D {
    return {
        setTransform() { },
        clearRect() { },
        save() { },
        restore() { },
        translate() { },
        rotate() { },
        setLineDash() { },
        stroke() { },
        fill() { },
        beginPath() { },
        moveTo() { },
        lineTo() { },
        rect() { },
        arc() { },
        closePath() { },
        fillText() { },
        strokeText() { },
        measureText() {
            return { width: 100 } as TextMetrics;
        },
        createPattern() {
            return null;
        },
        isPointInStroke() {
            return false;
        },
        isPointInPath() {
            return false;
        },
        canvas: document.createElement('canvas'),
        lineWidth: 1,
        strokeStyle: '#000000',
        fillStyle: '#ffffff',
        lineCap: 'round',
        lineJoin: 'round',
        shadowColor: 'transparent',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 0,
    } as unknown as CanvasRenderingContext2D;
}

describe('DiagramViewElement', () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalResizeObserver = globalThis.ResizeObserver;
    const tagName = 'pz-diagram-view-test';

    class ResizeObserverMock {
        observe = vi.fn();
        disconnect = vi.fn();
    }

    beforeAll(() => {
        HTMLCanvasElement.prototype.getContext = ((contextId: string) => {
            return contextId === '2d' ? createContext() : null;
        }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
        globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
        registerDiagramViewElement(tagName);
    });

    afterAll(() => {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        globalThis.ResizeObserver = originalResizeObserver;
    });

    it('creates and destroys a DiagramView with the custom element lifecycle', () => {
        const destroySpy = vi.spyOn(DiagramView.prototype, 'destroy');
        const element = document.createElement(tagName) as DiagramViewElement;

        Object.defineProperty(element, 'clientWidth', { value: 400, configurable: true });
        Object.defineProperty(element, 'clientHeight', { value: 300, configurable: true });

        element.setAttribute('diagram-id', 'wrapped');
        element.diagram = {
            nodes: [{
                id: 'node-1',
                type: 'rectangle',
                points: [{ x: 0, y: 0 }, { x: 100, y: 50 }],
                hollow: false,
                text: 'node-1',
                textAlign: 'center',
                textBaseline: 'middle',
                font: '16px Tahoma',
                image_id: undefined,
                img_mode: 'none',
                ready: false,
                transparent: false,
                strokeStyle: '#000000',
                fillStyle: '#ffffff',
                lineWidth: 1,
                shadowStyle: undefined,
                angle: 0,
                owner: {} as DiagramView,
            }] as INode[],
            layers: [{ id: 'main', name: 'Main', visible: true, nodes: ['node-1'] }],
        };
        element.options = { selectedNodeId: 'node-1' };

        document.body.appendChild(element);

        expect(element.view).toBeInstanceOf(DiagramView);
        expect(element.view?.id).toBe('wrapped');
        expect(element.view?.selection().map(node => node.id)).toEqual(['node-1']);
        expect(element.querySelector('canvas')).not.toBeNull();

        document.body.removeChild(element);

        expect(destroySpy).toHaveBeenCalledTimes(1);
        expect(element.view).toBeUndefined();
        expect(element.querySelector('canvas')).toBeNull();

        destroySpy.mockRestore();
    });
});