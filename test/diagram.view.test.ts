import { DiagramView } from '../src/view/diagram.view';
import { NodeHandle } from '../src/types';
import type { ILayer, INode } from '../src/interfaces';
import { DIAGRAM_BACKGROUND_CLICK_EVENT, DIAGRAM_NODE_CLICK_EVENT, DIAGRAM_PAN_EVENT, DIAGRAM_SELECTION_EVENT, DIAGRAM_VIEWPORT_EVENT, DIAGRAM_ZOOM_EVENT } from '../src';

class TestDiagramView extends DiagramView {
    private hitNodeMock?: (x: number, y: number) => INode | undefined;
    private hitHandleMock?: (x: number, y: number, target?: INode) => NodeHandle;

    public setHitNodeMock(mock?: (x: number, y: number) => INode | undefined): void {
        this.hitNodeMock = mock;
    }

    public setHitHandleMock(mock?: (x: number, y: number, target?: INode) => NodeHandle): void {
        this.hitHandleMock = mock;
    }

    public triggerPointerDown(event: PointerEvent): void {
        this.pointerDown(event);
    }

    public triggerPointerMove(event: PointerEvent): void {
        this.pointerMove(event);
    }

    public triggerWheel(event: WheelEvent): void {
        this.wheel(event);
    }

    public triggerKeydown(event: KeyboardEvent): void {
        this.keydown(event);
    }

    public triggerKeyup(event: KeyboardEvent): void {
        this.keyup(event);
    }

    protected override hitNode(x: number, y: number): INode | undefined {
        if (this.hitNodeMock) {
            return this.hitNodeMock(x, y);
        }

        return super.hitNode(x, y);
    }

    protected override hitHandle(x: number, y: number, target?: INode): NodeHandle {
        if (this.hitHandleMock) {
            return this.hitHandleMock(x, y, target);
        }

        return super.hitHandle(x, y, target);
    }
}

function createNode(id: string, owner: DiagramView, left: number, top: number, width: number, height: number): INode {
    return {
        id,
        type: 'rectangle',
        points: [
            { x: left, y: top },
            { x: left + width, y: top + height },
        ],
        hollow: false,
        text: id,
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
        owner,
    };
}

function createHost(width: number, height: number): HTMLDivElement {
    const host = document.createElement('div');
    Object.defineProperty(host, 'clientWidth', { value: width, configurable: true });
    Object.defineProperty(host, 'clientHeight', { value: height, configurable: true });
    return host;
}

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

describe('DiagramView', () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalResizeObserver = globalThis.ResizeObserver;

    class ResizeObserverMock {
        observe = vi.fn();
        disconnect = vi.fn();
    }

    beforeAll(() => {
        HTMLCanvasElement.prototype.getContext = ((contextId: string) => {
            return contextId === '2d' ? createContext() : null;
        }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
        globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    });

    afterAll(() => {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        globalThis.ResizeObserver = originalResizeObserver;
    });

    it('emits node click, background click, selection, pan, zoom and viewport events', () => {
        const host = createHost(400, 300);
        const view = new TestDiagramView('demo', host);
        const layer = view.upsertLayer('main');
        const node = createNode('node-1', view, 20, 20, 120, 60);
        view.upsertNode(node);
        layer.nodes.push(node.id);

        const selectionEvents: unknown[] = [];
        const nodeClickEvents: unknown[] = [];
        const backgroundEvents: unknown[] = [];
        const panEvents: unknown[] = [];
        const zoomEvents: unknown[] = [];
        const viewportEvents: unknown[] = [];

        host.addEventListener(DIAGRAM_SELECTION_EVENT, event => selectionEvents.push((event as CustomEvent).detail));
        host.addEventListener(DIAGRAM_NODE_CLICK_EVENT, event => nodeClickEvents.push((event as CustomEvent).detail));
        host.addEventListener(DIAGRAM_BACKGROUND_CLICK_EVENT, event => backgroundEvents.push((event as CustomEvent).detail));
        host.addEventListener(DIAGRAM_PAN_EVENT, event => panEvents.push((event as CustomEvent).detail));
        host.addEventListener(DIAGRAM_ZOOM_EVENT, event => zoomEvents.push((event as CustomEvent).detail));
        host.addEventListener(DIAGRAM_VIEWPORT_EVENT, event => viewportEvents.push((event as CustomEvent).detail));

        view.setHitNodeMock(() => node);
        view.triggerPointerDown({
            button: 0,
            offsetX: 30,
            offsetY: 30,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        view.setHitNodeMock(() => undefined);
        view.triggerPointerDown({
            button: 0,
            offsetX: 5,
            offsetY: 6,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        view.triggerPointerMove({ buttons: 1, movementX: 10, movementY: -5 } as PointerEvent);
        view.triggerWheel({
            ctrlKey: true,
            metaKey: false,
            deltaY: -10,
            offsetX: 100,
            offsetY: 80,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as WheelEvent);

        expect(nodeClickEvents).toHaveLength(1);
        expect(nodeClickEvents[0]).toMatchObject({ nodeId: 'node-1', node });
        expect(backgroundEvents).toHaveLength(1);
        expect(backgroundEvents[0]).toMatchObject({ canvas: { x: 5, y: 6 } });
        expect(selectionEvents).toEqual([
            { nodeId: 'node-1', node, nodeIds: ['node-1'], nodes: [node] },
            { nodeId: undefined, node: undefined, nodeIds: [], nodes: [] },
        ]);
        expect(panEvents).toHaveLength(2);
        expect(zoomEvents).toHaveLength(1);
        expect(viewportEvents).toHaveLength(2);
    });

    it('supports selecting a node by id or node instance', () => {
        const host = createHost(400, 300);
        const view = new DiagramView('demo', host);
        const layer = view.upsertLayer('main');
        const node = createNode('node-1', view, 20, 20, 120, 60);
        view.upsertNode(node);
        layer.nodes.push(node.id);

        const selectedById = view.selectNode('node-1');
        const selectedByNode = view.selectNode(node);

        expect(selectedById).toBe(node);
        expect(selectedByNode).toBe(node);
        expect(view.selection()).toEqual([node]);
    });

    it('does not pan when dragging from a node unless space is pressed', () => {
        const host = createHost(400, 300);
        const view = new TestDiagramView('demo', host);
        const layer = view.upsertLayer('main');
        const node = createNode('node-1', view, 20, 20, 120, 60);
        view.upsertNode(node);
        layer.nodes.push(node.id);

        view.setHitNodeMock(() => node);

        view.triggerPointerDown({
            button: 0,
            offsetX: 30,
            offsetY: 30,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        view.triggerPointerMove({ buttons: 1, movementX: 10, movementY: -5 } as PointerEvent);
        expect(view.getCoordinates().pan).toEqual({ x: 0, y: 0 });

        view.triggerKeydown({ key: ' ' } as KeyboardEvent);
        view.triggerPointerDown({
            button: 0,
            offsetX: 30,
            offsetY: 30,
            pointerId: 2,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);
        view.triggerPointerMove({ buttons: 1, movementX: 10, movementY: -5 } as PointerEvent);
        view.triggerKeyup({ key: ' ' } as KeyboardEvent);

        expect(view.getCoordinates().pan).toEqual({ x: -10, y: 5 });
    });

    it('fits all nodes into the container on initial render when requested', () => {
        const host = createHost(200, 100);
        const initialLayer: ILayer = { id: 'main', name: 'Main', visible: true, nodes: ['node-1'] };
        const initialNodes = [{
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 0, y: 0 }, { x: 400, y: 100 }],
            hollow: false,
            text: 'node-1',
            textAlign: 'center',
            textBaseline: 'middle',
            font: '16px Tahoma',
            image_id: undefined,
            img_mode: 'none' as const,
            ready: false,
            transparent: false,
            strokeStyle: '#000000',
            fillStyle: '#ffffff',
            lineWidth: 1,
            shadowStyle: undefined,
            angle: 0,
            owner: {} as DiagramView,
        }] as INode[];

        const view = new DiagramView('demo', host, {
            nodes: initialNodes,
            layers: [initialLayer],
        }, {
            initialView: { mode: 'fit-all', padding: 0 },
        });

        expect(view.getCoordinates().zoom).toBeCloseTo(0.5);
        expect(view.getCoordinates().pan).toEqual({ x: 0, y: -25 });
    });

    it('supports top-right alignment when fitting all nodes initially', () => {
        const host = createHost(200, 100);
        const initialLayer: ILayer = { id: 'main', name: 'Main', visible: true, nodes: ['node-1'] };
        const initialNodes = [{
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
            hollow: false,
            text: 'node-1',
            textAlign: 'center',
            textBaseline: 'middle',
            font: '16px Tahoma',
            image_id: undefined,
            img_mode: 'none' as const,
            ready: false,
            transparent: false,
            strokeStyle: '#000000',
            fillStyle: '#ffffff',
            lineWidth: 1,
            shadowStyle: undefined,
            angle: 0,
            owner: {} as DiagramView,
        }] as INode[];

        const view = new DiagramView('demo', host, {
            nodes: initialNodes,
            layers: [initialLayer],
        }, {
            initialView: {
                mode: 'fit-all',
                padding: 0,
                alignment: { horizontal: 'right', vertical: 'top' },
            },
        });

        expect(view.getCoordinates().zoom).toBeCloseTo(1);
        expect(view.getCoordinates().pan).toEqual({ x: -100, y: 0 });
    });

    it('defaults fit-width to top alignment vertically', () => {
        const host = createHost(200, 200);
        const initialLayer: ILayer = { id: 'main', name: 'Main', visible: true, nodes: ['node-1'] };
        const initialNodes = [{
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 0, y: 0 }, { x: 100, y: 50 }],
            hollow: false,
            text: 'node-1',
            textAlign: 'center',
            textBaseline: 'middle',
            font: '16px Tahoma',
            image_id: undefined,
            img_mode: 'none' as const,
            ready: false,
            transparent: false,
            strokeStyle: '#000000',
            fillStyle: '#ffffff',
            lineWidth: 1,
            shadowStyle: undefined,
            angle: 0,
            owner: {} as DiagramView,
        }] as INode[];

        const view = new DiagramView('demo', host, {
            nodes: initialNodes,
            layers: [initialLayer],
        }, {
            initialView: {
                mode: 'fit-width',
                padding: 0,
            },
        });

        expect(view.getCoordinates().zoom).toBeCloseTo(2);
        expect(view.getCoordinates().pan).toEqual({ x: 0, y: 0 });
    });

    it('supports setting zoom directly with zoomTo', () => {
        const host = createHost(400, 300);
        const view = new DiagramView('demo', host);
        const zoomEvents: unknown[] = [];

        host.addEventListener(DIAGRAM_ZOOM_EVENT, event => zoomEvents.push((event as CustomEvent).detail));

        view.setViewport({ zoom: 2 });
        view.zoomTo(1);

        expect(view.getCoordinates().zoom).toBeCloseTo(1);
        expect(zoomEvents.length).toBeGreaterThanOrEqual(2);
    });

    it('cleans up listeners, observer and owned canvas on destroy', () => {
        const host = createHost(400, 300);
        const addEventListenerSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener');
        const removeEventListenerSpy = vi.spyOn(HTMLCanvasElement.prototype, 'removeEventListener');
        const removeChildSpy = vi.spyOn(host, 'removeChild');

        const view = new DiagramView('demo', host);
        const observer = (view as unknown as { resizeObserver?: ResizeObserverMock }).resizeObserver;
        const canvas = view.getCanvas();

        view.destroy();

        expect(addEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerleave', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
        expect(observer?.disconnect).toHaveBeenCalledTimes(1);
        expect(removeChildSpy).toHaveBeenCalledWith(canvas);
        expect(host.contains(canvas)).toBe(false);

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
        removeChildSpy.mockRestore();
    });
});