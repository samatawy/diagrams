import { DiagramEditView } from '../src/editview/diagram.edit.view';
import { NodeHandle } from '../src/types';
import type { INode } from '../src/interfaces';
import { PolylineAdapter } from '../src/nodes/polyline/polyline.adapter';
import { PolygonAdapter } from '../src/nodes/polyline/polygon.adapter';
import { CurveAdapter } from '../src/nodes/polyline/curve.adapter';
import { RectangleAdapter } from '../src/nodes/rectangle/rectangle.adapter';
import {
    DIAGRAM_DELETE_REQUEST_EVENT,
    DIAGRAM_NODE_ADDED_EVENT,
    DIAGRAM_NODE_DELETED_EVENT,
    DIAGRAM_NODE_MOVED_EVENT,
    DIAGRAM_TOOL_CHANGED_EVENT,
    type DiagramNodeChange,
    type DiagramToolChange,
} from '../src/events/diagram.events';

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
        fillRect() { },
        beginPath() { },
        moveTo() { },
        lineTo() { },
        quadraticCurveTo() { },
        rect() { },
        arc() { },
        clip() { },
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

function nodeAt(node: INode, x: number, y: number): boolean {
    const left = Math.min(node.points[0]!.x, node.points[1]!.x);
    const right = Math.max(node.points[0]!.x, node.points[1]!.x);
    const top = Math.min(node.points[0]!.y, node.points[1]!.y);
    const bottom = Math.max(node.points[0]!.y, node.points[1]!.y);

    return x >= left && x <= right && y >= top && y <= bottom;
}

class TestDiagramEditView extends DiagramEditView {
    private hitNodesMock?: (x: number, y: number) => INode[];
    private hitHandleMock?: (x: number, y: number, target?: INode) => NodeHandle;

    public setHitNodesMock(mock?: (x: number, y: number) => INode[]): void {
        this.hitNodesMock = mock;
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

    public triggerPointerUp(event: PointerEvent): void {
        this.pointerUp(event);
    }

    public triggerKeydown(event: KeyboardEvent): void {
        this.keydown(withKeyboardCode(event));
    }

    public override hitNodes(x: number, y: number): INode[] {
        if (this.hitNodesMock) {
            return this.hitNodesMock(x, y);
        }

        return super.hitNodes(x, y);
    }

    public override hitHandle(x: number, y: number, target?: INode): NodeHandle {
        if (this.hitHandleMock) {
            return this.hitHandleMock(x, y, target);
        }

        return super.hitHandle(x, y, target);
    }
}

function withKeyboardCode(event: KeyboardEvent): KeyboardEvent {
    const runtimeEvent = event as unknown as { key: string; code?: string; stopPropagation?: () => void };
    const stopPropagation = runtimeEvent.stopPropagation || (() => { });
    if (runtimeEvent.code && runtimeEvent.stopPropagation) {
        return event;
    }

    const key = runtimeEvent.key;
    let code = key;
    if (key === ' ') {
        code = 'Space';
    } else if (/^[a-zA-Z]$/.test(key)) {
        code = `Key${key.toUpperCase()}`;
    } else if (/^[0-9]$/.test(key)) {
        code = `Digit${key}`;
    }

    return { ...event, code, stopPropagation } as KeyboardEvent;
}

describe('DiagramEditable', () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalPath2D = globalThis.Path2D;

    class FakePath2D {
        rect(): void { }
        roundRect(): void { }
        arc(): void { }
        moveTo(): void { }
        lineTo(): void { }
        quadraticCurveTo(): void { }
        closePath(): void { }
    }

    beforeAll(() => {
        new RectangleAdapter().register();
        new PolylineAdapter().register();
        new PolygonAdapter().register();
        new CurveAdapter().register();
        globalThis.Path2D = FakePath2D as unknown as typeof Path2D;
        HTMLCanvasElement.prototype.getContext = ((contextId: string) => {
            return contextId === '2d' ? createContext() : null;
        }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    });

    afterAll(() => {
        globalThis.Path2D = originalPath2D;
        HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('creates a node from the selected tool using pointer interactions', async () => {
        const host = createHost(400, 300);
        const editable = new TestDiagramEditView('demo', host);
        const added: string[] = [];
        host.addEventListener(DIAGRAM_NODE_ADDED_EVENT, event => {
            added.push((event as CustomEvent<DiagramNodeChange>).detail.nodeId);
        });
        editable.setTool('rectangle');

        editable.triggerPointerDown({
            button: 0,
            offsetX: 10,
            offsetY: 20,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        await Promise.resolve();

        editable.triggerPointerMove({
            buttons: 1,
            offsetX: 110,
            offsetY: 80,
        } as PointerEvent);

        editable.triggerPointerUp({
            offsetX: 110,
            offsetY: 80,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(editable.nodes).toHaveLength(1);
        expect(editable.layers).toHaveLength(1);
        expect(editable.layers[0]?.nodes).toEqual([editable.nodes[0]?.id]);
        expect(editable.nodes[0]?.type).toBe('rectangle');
        expect(editable.nodes[0]?.points).toEqual([{ x: 10, y: 20 }, { x: 110, y: 80 }]);
        expect(editable.selection().map(node => node.id)).toEqual([editable.nodes[0]!.id]);
        expect(added).toEqual([editable.nodes[0]!.id]);
    });

    it('allows deletion to be canceled externally', () => {
        const host = createHost(400, 300);
        const editable = new TestDiagramEditView('demo', host);
        const layer = editable.upsertLayer('main');
        const node: INode = {
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 10, y: 20 }, { x: 110, y: 80 }],
            hollow: false,
            text: 'Node',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editable,
        };

        editable.upsertNode(node);
        layer.nodes.push(node.id);
        editable.select(node, 'isolated');
        host.addEventListener(DIAGRAM_DELETE_REQUEST_EVENT, event => {
            event.preventDefault();
        });

        editable.triggerKeydown({
            key: 'Delete',
            preventDefault() { },
            stopImmediatePropagation() { },
        } as KeyboardEvent);

        expect(editable.nodes).toHaveLength(1);
        expect(editable.layer('main')?.nodes).toEqual(['node-1']);
    });

    it('deletes the current selection with the Delete key and emits node-deleted', () => {
        const host = createHost(400, 300);
        const editable = new TestDiagramEditView('demo', host);
        const layer = editable.upsertLayer('main');
        const deleted: string[] = [];
        host.addEventListener(DIAGRAM_NODE_DELETED_EVENT, event => {
            deleted.push((event as CustomEvent<DiagramNodeChange>).detail.nodeId);
        });
        const node: INode = {
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 10, y: 20 }, { x: 110, y: 80 }],
            hollow: false,
            text: 'Node',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editable,
        };

        editable.upsertNode(node);
        layer.nodes.push(node.id);
        editable.select(node, 'isolated');

        editable.triggerKeydown({
            key: 'Delete',
            preventDefault() { },
            stopImmediatePropagation() { },
        } as KeyboardEvent);

        expect(editable.nodes).toHaveLength(0);
        expect(editable.layer('main')?.nodes).toEqual([]);
        expect(editable.selection()).toEqual([]);
        expect(deleted).toEqual(['node-1']);
    });

    it('toggles selection membership with Ctrl+pointerdown', () => {
        const host = createHost(400, 300);
        const editview = new TestDiagramEditView('demo', host);
        const layer = editview.upsertLayer('main');
        const first: INode = {
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 10, y: 20 }, { x: 110, y: 80 }],
            hollow: false,
            text: 'One',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };
        const second: INode = {
            id: 'node-2',
            type: 'rectangle',
            points: [{ x: 140, y: 20 }, { x: 240, y: 80 }],
            hollow: false,
            text: 'Two',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };

        editview.upsertNode(first);
        editview.upsertNode(second);
        layer.nodes.push(first.id, second.id);
        editview.select(first, 'isolated');
        editview.setHitNodesMock((x: number, y: number) => {
            const found: INode[] = [];
            if (nodeAt(first, x, y)) found.push(first);
            if (nodeAt(second, x, y)) found.push(second);
            return found;
        });
        editview.setHitHandleMock((x: number, y: number) => {
            if (nodeAt(first, x, y) || nodeAt(second, x, y)) {
                return NodeHandle.MOVE;
            }
            return NodeHandle.NONE;
        });

        editview.triggerPointerDown({
            button: 0,
            buttons: 1,
            ctrlKey: true,
            offsetX: 160,
            offsetY: 40,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(editview.selection().map(node => node.id).sort()).toEqual(['node-1', 'node-2']);

        editview.triggerPointerDown({
            button: 0,
            buttons: 1,
            ctrlKey: true,
            offsetX: 20,
            offsetY: 40,
            pointerId: 2,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(editview.selection().map(node => node.id)).toEqual(['node-2']);
    });

    it('toggles selection membership with Shift+pointerup on a node', () => {
        const host = createHost(400, 300);
        const editview = new TestDiagramEditView('demo', host);
        const layer = editview.upsertLayer('main');
        const first: INode = {
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 10, y: 20 }, { x: 110, y: 80 }],
            hollow: false,
            text: 'One',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };
        const second: INode = {
            id: 'node-2',
            type: 'rectangle',
            points: [{ x: 140, y: 20 }, { x: 240, y: 80 }],
            hollow: false,
            text: 'Two',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };

        editview.upsertNode(first);
        editview.upsertNode(second);
        layer.nodes.push(first.id, second.id);
        editview.select(first, 'isolated');
        editview.setHitNodesMock((x: number, y: number) => {
            const found: INode[] = [];
            if (nodeAt(first, x, y)) found.push(first);
            if (nodeAt(second, x, y)) found.push(second);
            return found;
        });
        editview.setHitHandleMock((x: number, y: number) => {
            if (nodeAt(first, x, y) || nodeAt(second, x, y)) {
                return NodeHandle.MOVE;
            }
            return NodeHandle.NONE;
        });

        editview.triggerPointerDown({
            button: 0,
            buttons: 1,
            shiftKey: true,
            offsetX: 160,
            offsetY: 40,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        editview.triggerPointerUp({
            button: 0,
            buttons: 0,
            shiftKey: true,
            offsetX: 160,
            offsetY: 40,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(editview.selection().map(node => node.id)).toEqual(['node-1', 'node-2']);

        editview.triggerPointerDown({
            button: 0,
            buttons: 1,
            shiftKey: true,
            offsetX: 20,
            offsetY: 40,
            pointerId: 2,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        editview.triggerPointerUp({
            button: 0,
            buttons: 0,
            shiftKey: true,
            offsetX: 20,
            offsetY: 40,
            pointerId: 2,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(editview.selection().map(node => node.id).sort()).toEqual(['node-1', 'node-2']);
    });

    it('emits node-moved after dragging a selected node', () => {
        const host = createHost(400, 300);
        const editview = new TestDiagramEditView('demo', host);
        const layer = editview.upsertLayer('main');
        const moved: string[] = [];
        host.addEventListener(DIAGRAM_NODE_MOVED_EVENT, event => {
            moved.push((event as CustomEvent<DiagramNodeChange>).detail.nodeId);
        });
        const node: INode = {
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 10, y: 20 }, { x: 110, y: 80 }],
            hollow: false,
            text: 'Node',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };

        editview.upsertNode(node);
        layer.nodes.push(node.id);
        editview.select(node, 'isolated');
        editview.setHitNodesMock((x: number, y: number) => nodeAt(node, x, y) ? [node] : []);
        editview.setHitHandleMock((x: number, y: number) => nodeAt(node, x, y) ? NodeHandle.MOVE : NodeHandle.NONE);

        editview.triggerPointerDown({
            button: 0,
            buttons: 1,
            offsetX: 20,
            offsetY: 40,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        editview.triggerPointerMove({
            buttons: 1,
            offsetX: 40,
            offsetY: 60,
        } as PointerEvent);

        editview.triggerPointerUp({
            button: 0,
            buttons: 0,
            offsetX: 40,
            offsetY: 60,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(moved).toEqual(['node-1']);
    });

    it('starts a selection rect with Shift+pointerdown from empty space', () => {
        const host = createHost(400, 300);
        const editview = new TestDiagramEditView('demo', host);
        const layer = editview.upsertLayer('main');
        const first: INode = {
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 10, y: 20 }, { x: 110, y: 80 }],
            hollow: false,
            text: 'One',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };
        const second: INode = {
            id: 'node-2',
            type: 'rectangle',
            points: [{ x: 140, y: 20 }, { x: 240, y: 80 }],
            hollow: false,
            text: 'Two',
            image_mode: 'none',
            ready: false,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };

        editview.upsertNode(first);
        editview.upsertNode(second);
        layer.nodes.push(first.id, second.id);
        editview.setHitNodesMock((x: number, y: number) => {
            const found: INode[] = [];
            if (nodeAt(first, x, y)) found.push(first);
            if (nodeAt(second, x, y)) found.push(second);
            return found;
        });

        editview.triggerPointerDown({
            button: 0,
            buttons: 1,
            shiftKey: true,
            offsetX: 5,
            offsetY: 10,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        editview.triggerPointerMove({
            buttons: 1,
            shiftKey: true,
            offsetX: 220,
            offsetY: 70,
        } as PointerEvent);

        editview.triggerPointerUp({
            button: 0,
            buttons: 0,
            shiftKey: true,
            offsetX: 220,
            offsetY: 70,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(editview.selection().map(node => node.id).sort()).toEqual(['node-1', 'node-2']);
    });

    it('drags a polyline endpoint with Alt+pointerdown when starting on a point handle', () => {
        const host = createHost(400, 300);
        const editview = new TestDiagramEditView('demo', host);
        const layer = editview.upsertLayer('main');
        const polyline: INode = {
            id: 'polyline-1',
            type: 'polyline',
            points: [{ x: 20, y: 20 }, { x: 120, y: 20 }, { x: 120, y: 120 }],
            hollow: true,
            text: '',
            textStyle: {
                align: 'center',
                baseline: 'middle',
                fontFace: 'Tahoma',
                size: 16,
                color: '#000000',
            },
            image_mode: 'none',
            ready: true,
            invisible: true,
            strokeStyle: { color: '#000000' },
            fillStyle: { color: 'transparent' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };

        editview.upsertNode(polyline);
        layer.nodes.push(polyline.id);
        editview.render();
        editview.select(polyline, 'isolated');

        editview.triggerPointerDown({
            button: 0,
            buttons: 1,
            altKey: true,
            offsetX: 20,
            offsetY: 20,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        editview.triggerPointerMove({
            buttons: 1,
            offsetX: 45,
            offsetY: 55,
        } as PointerEvent);

        editview.triggerPointerUp({
            button: 0,
            buttons: 0,
            altKey: true,
            offsetX: 45,
            offsetY: 55,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(polyline.points).toEqual([
            { x: 45, y: 55 },
            { x: 120, y: 20 },
            { x: 120, y: 120 },
        ]);
        expect(editview.selection().map(node => node.id)).toEqual(['polyline-1']);
    });

    it('emits tool-changed when selecting a tool and when reverting to select', async () => {
        const host = createHost(400, 300);
        const editview = new TestDiagramEditView('demo', host);
        const changes: Array<{ tool: string; previousTool: string }> = [];

        host.addEventListener(DIAGRAM_TOOL_CHANGED_EVENT, event => {
            const detail = (event as CustomEvent<DiagramToolChange>).detail;
            changes.push({ tool: detail.tool, previousTool: detail.previousTool });
        });

        await editview.setTool('rectangle');

        editview.triggerPointerDown({
            button: 0,
            offsetX: 10,
            offsetY: 20,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        await Promise.resolve();

        editview.triggerPointerMove({
            buttons: 1,
            offsetX: 110,
            offsetY: 80,
        } as PointerEvent);

        editview.triggerPointerUp({
            offsetX: 110,
            offsetY: 80,
            pointerId: 1,
            preventDefault() { },
            stopImmediatePropagation() { },
        } as PointerEvent);

        expect(changes).toEqual([
            { tool: 'rectangle', previousTool: 'select' },
            { tool: 'select', previousTool: 'rectangle' },
        ]);
        expect(editview.currentTool).toBe('select');
    });

    it('reorders selected nodes by z-order methods', () => {
        const host = createHost(400, 300);
        const editview = new TestDiagramEditView('demo', host);
        const layer = editview.upsertLayer('main');

        const first: INode = {
            id: 'node-1',
            type: 'rectangle',
            points: [{ x: 10, y: 20 }, { x: 40, y: 50 }],
            hollow: false,
            text: 'One',
            textStyle: {
                align: 'center',
                baseline: 'middle',
                fontFace: 'Tahoma',
                size: 16,
                color: '#000000',
            },
            image_mode: 'none',
            ready: false,
            invisible: false,
            strokeStyle: {
                color: '#000000',
                width: 1
            },
            fillStyle: { color: '#ffffff' },
            shadowStyle: undefined,
            angle: 0,
            owner: editview,
        };
        const second: INode = {
            ...first,
            id: 'node-2',
            text: 'Two',
            points: [{ x: 50, y: 20 }, { x: 80, y: 50 }],
        };
        const third: INode = {
            ...first,
            id: 'node-3',
            text: 'Three',
            points: [{ x: 90, y: 20 }, { x: 120, y: 50 }],
        };

        editview.upsertNode(first);
        editview.upsertNode(second);
        editview.upsertNode(third);
        layer.nodes.push(first.id, second.id, third.id);

        editview.setSelection([second]);
        editview.bringSelectionToFront();
        expect(layer.nodes).toEqual(['node-1', 'node-3', 'node-2']);

        editview.sendSelectionToBack();
        expect(layer.nodes).toEqual(['node-2', 'node-1', 'node-3']);
    });

    it('reorders layers by z-order methods', () => {
        const host = createHost(400, 300);
        const editview = new TestDiagramEditView('demo', host);

        editview.addLayer('layer-1', 'top');
        editview.addLayer('layer-2', 'top');
        editview.addLayer('layer-3', 'top');

        expect(editview.layers.map(layer => layer.id)).toEqual(['layer-1', 'layer-2', 'layer-3']);

        editview.bringLayerToFront('layer-2');
        expect(editview.layers.map(layer => layer.id)).toEqual(['layer-1', 'layer-3', 'layer-2']);

        editview.sendLayerToBack('layer-2');
        expect(editview.layers.map(layer => layer.id)).toEqual(['layer-2', 'layer-1', 'layer-3']);
    });
});