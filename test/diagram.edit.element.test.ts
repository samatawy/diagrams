import type { INode } from '../src';
import { DiagramEditView } from '../src/editview/diagram.edit.view';
import { DiagramEditElement, registerDiagramEditElement } from '../src/elements/diagram.edit.element';

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

describe('DiagramEditElement', () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalResizeObserver = globalThis.ResizeObserver;
    const tagName = 'pz-diagram-edit-test';

    class ResizeObserverMock {
        observe = vi.fn();
        disconnect = vi.fn();
    }

    beforeAll(() => {
        HTMLCanvasElement.prototype.getContext = ((contextId: string) => {
            return contextId === '2d' ? createContext() : null;
        }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
        globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
        registerDiagramEditElement(tagName);
    });

    afterAll(() => {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        globalThis.ResizeObserver = originalResizeObserver;
    });

    it('creates and destroys a DiagramEditView with the custom element lifecycle', () => {
        const destroySpy = vi.spyOn(DiagramEditView.prototype, 'destroy');
        const element = document.createElement(tagName) as DiagramEditElement;

        Object.defineProperty(element, 'clientWidth', { value: 400, configurable: true });
        Object.defineProperty(element, 'clientHeight', { value: 300, configurable: true });

        element.setAttribute('diagram-id', 'wrapped-edit');
        element.diagram = {
            nodes: [{
                id: 'node-1',
                type: 'rectangle',
                points: [{ x: 0, y: 0 }, { x: 100, y: 50 }],
                strokeStyle: '#000000',
                owner: {} as DiagramEditView,
            }] as INode[],
            layers: [{ id: 'main', name: 'Main', visible: true, nodes: ['node-1'] }],
        };

        document.body.appendChild(element);

        expect(element.edit).toBeInstanceOf(DiagramEditView);
        expect(element.edit?.id).toBe('wrapped-edit');
        expect(element.querySelector('canvas')).not.toBeNull();

        document.body.removeChild(element);

        expect(destroySpy).toHaveBeenCalledTimes(1);
        expect(element.edit).toBeUndefined();
        expect(element.querySelector('canvas')).toBeNull();

        destroySpy.mockRestore();
    });
});
