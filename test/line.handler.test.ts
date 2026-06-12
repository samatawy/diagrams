import type { IConnection, INode } from '../src/interfaces';
import { ConnectionBasics } from '../src/nodes/connection.basics';
import { LineAdapter } from '../src/nodes/polyline/line.adapter';
import { NodeHandle } from '../src/types';

class FakePath2D {
    commands: Array<{ type: string; values: number[] }> = [];

    moveTo(x: number, y: number): void {
        this.commands.push({ type: 'moveTo', values: [x, y] });
    }

    lineTo(x: number, y: number): void {
        this.commands.push({ type: 'lineTo', values: [x, y] });
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.commands.push({ type: 'quadraticCurveTo', values: [cpx, cpy, x, y] });
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.commands.push({ type: 'bezierCurveTo', values: [cp1x, cp1y, cp2x, cp2y, x, y] });
    }

    rect(x: number, y: number, width: number, height: number): void {
        this.commands.push({ type: 'rect', values: [x, y, width, height] });
    }
}

function createNode(owner: any, overrides: Partial<INode & IConnection> = {}): INode & IConnection {
    return {
        id: overrides.id || 'node',
        type: overrides.type || 'line',
        points: overrides.points || [],
        from: overrides.from,
        to: overrides.to,
        startArrow: overrides.startArrow,
        endArrow: overrides.endArrow,
        ready: overrides.ready ?? true,
        hollow: overrides.hollow ?? true,
        text: overrides.text || '',
        textAlign: overrides.textAlign || 'center',
        textBaseline: overrides.textBaseline || 'middle',
        font: overrides.font || '16px Tahoma',
        image_id: overrides.image_id,
        img_mode: overrides.img_mode || 'none',
        transparent: overrides.transparent ?? false,
        strokeStyle: overrides.strokeStyle || '#111827',
        fillStyle: overrides.fillStyle || '#dbeafe',
        textColor: overrides.textColor || '#111827',
        lineWidth: overrides.lineWidth || 2,
        shadowStyle: overrides.shadowStyle,
        angle: overrides.angle || 0,
        owner,
    };
}

describe('LineHandler', () => {
    it('syncs anchored endpoints and renders bezier lines with arrowheads', () => {
        const originalPath2D = globalThis.Path2D;
        globalThis.Path2D = FakePath2D as unknown as typeof Path2D;

        const cache = new Map<INode, any>();
        const owner = {
            render_mode: 'view' as const,
            grid: { forced: false, visible: true, color: 'lightgray', width: 20, height: 20 },
            nodes: [] as INode[],
            node(id: string) {
                return this.nodes.find(node => node.id === id);
            },
            getCache() {
                return {
                    getNode: (node: INode) => cache.get(node),
                    setNode: (node: INode, value: unknown) => cache.set(node, value),
                };
            },
            getCoordinates() {
                return {
                    getBoundingRect(node: INode) {
                        const xs = node.points.map(point => point.x);
                        const ys = node.points.map(point => point.y);
                        const left = Math.min(...xs);
                        const top = Math.min(...ys);
                        return {
                            left,
                            top,
                            width: Math.max(...xs) - left,
                            height: Math.max(...ys) - top,
                        };
                    },
                    getRenderPoint(point: { x: number; y: number }) {
                        return point;
                    },
                    isPointInStroke() {
                        return false;
                    },
                    isPointInPath() {
                        return false;
                    },
                };
            },
        };

        const target = createNode(owner, {
            id: 'target',
            type: 'rectangle',
            points: [{ x: 20, y: 20 }, { x: 60, y: 50 }],
            hollow: false,
        });

        const line = createNode(owner, {
            id: 'line',
            points: [{ x: 0, y: 0 }, { x: 40, y: 10 }, { x: 80, y: 40 }, { x: 120, y: 80 }],
            from: { node: 'target', handle: NodeHandle.E, xOffset: 1, yOffset: 0.5 },
            endArrow: true,
        });

        owner.nodes.push(target, line);

        ConnectionBasics.syncEndpoints(line);
        expect(line.points[0]).toEqual({ x: 60, y: 35 });

        const strokes: unknown[] = [];
        let fillCount = 0;
        const context = {
            strokeStyle: '#111827',
            fillStyle: '#dbeafe',
            lineWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
            shadowColor: 'transparent',
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
            beginPath() { },
            moveTo() { },
            lineTo() { },
            stroke(path?: unknown) {
                strokes.push(path);
            },
            fill() {
                fillCount += 1;
            },
        } as unknown as CanvasRenderingContext2D;

        try {
            new LineAdapter().render(line, context);
        } finally {
            globalThis.Path2D = originalPath2D;
        }

        const renderedPath = strokes[0] as FakePath2D;
        expect(renderedPath.commands).toContainEqual({
            type: 'bezierCurveTo',
            values: [40, 10, 80, 40, 120, 80],
        });
        expect(fillCount).toBe(1);
    });
});