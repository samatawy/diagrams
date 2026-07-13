import type { IConnection, IConnectionAnchor, INode } from "../interfaces";
import { isConnection } from "../guards";
import { DiagramConstants } from "../model/diagram.constants";
import { NodeHandle, type IRect } from "../types";
import type { DiagramEditView } from "../editview/diagram.edit.view";
import { absoluteToRelative } from "../value.utils";

export interface AutoFixReport {
    connectionsFixed: number;
    edgesAligned: number;
    spreadsFixed: number;
}

const EMPTY_REPORT: AutoFixReport = { connectionsFixed: 0, edgesAligned: 0, spreadsFixed: 0 };

/**
 * AutoFixLayout performs best-effort layout corrections on a diagram in three ordered passes:
 * 1. Autoconnect dangling connections whose loose endpoint is within CONNECT_THRESHOLD of
 *    exactly one non-connection node.
 * 2. Align nodes whose shared edges fall within an alignment threshold (±4 px by default).
 * 3. Equalize spacing for node groups that already share an axis and are near-uniform in spread.
 *
 * All mutations are covered by a single addUndo() call, giving the user one undo entry.
 */
export class AutoFixLayout {

    private static readonly CONNECT_THRESHOLD = DiagramConstants.HANDLE_HIT_EPSILON * 2;
    private static readonly CONNECT_AMBIGUITY_EPSILON = 1;
    private static readonly ALIGN_THRESHOLD = 8;    // 4;
    private static readonly SPREAD_THRESHOLD = 8;   // 6;

    private readonly diagram: DiagramEditView;

    constructor(diagram: DiagramEditView) {
        this.diagram = diagram;
    }

    public apply(): AutoFixReport {
        const allNodes = this.diagram.nodes;
        if (!allNodes.length) return { ...EMPTY_REPORT };

        const prevSelection = this.diagram.selection();

        (this.diagram as any).addUndo();

        const report: AutoFixReport = {
            connectionsFixed: this.fixDanglingConnections(allNodes),
            edgesAligned: this.alignNearEdges(allNodes),
            spreadsFixed: this.equalizeNearSpreads(allNodes),
        };

        this.diagram.setSelection(prevSelection);
        this.diagram.render('nodes');

        return report;
    }

    // ── Pass 1: autoconnect dangling connections ──────────────────────────────

    private fixDanglingConnections(allNodes: INode[]): number {
        const threshold = AutoFixLayout.CONNECT_THRESHOLD;
        const shapes = allNodes.filter(n => !isConnection(n));
        const connections = allNodes.filter(n => isConnection(n));
        let fixed = 0;

        for (const conn of connections) {
            const c = conn as INode & IConnection;
            if (c.points.length < 2) continue;
            const missingFrom = !c.from;
            const missingTo = !c.to;
            if (!missingFrom && !missingTo) continue;

            if (missingFrom) {
                const pt = c.points[0]!;
                const anchor = this.nearestUniqueAnchor(pt.x, pt.y, shapes, threshold, c.to?.node);
                if (anchor) { c.from = anchor; fixed++; }
            }
            if (missingTo) {
                const pt = c.points[c.points.length - 1]!;
                const anchor = this.nearestUniqueAnchor(pt.x, pt.y, shapes, threshold, c.from?.node);
                if (anchor) { c.to = anchor; fixed++; }
            }
        }

        return fixed;
    }

    private nearestUniqueAnchor(
        x: number, y: number,
        shapes: INode[], threshold: number,
        excludeNode?: string | INode,
    ): IConnectionAnchor | undefined {
        const excludeId = excludeNode
            ? (typeof excludeNode === 'string' ? excludeNode : excludeNode.id)
            : undefined;

        const coords = this.diagram.getCoordinates();
        const candidates: Array<{ node: INode, rect: IRect, distance: number }> = [];

        for (const shape of shapes) {
            if (shape.id === excludeId) continue;
            const b = coords.getBoundingRect(shape);
            const distance = this.distanceToRect(x, y, b);
            if (distance <= threshold) candidates.push({ node: shape, rect: b, distance });
        }

        if (!candidates.length) return undefined;

        candidates.sort((a, b) => a.distance - b.distance);
        if (
            candidates.length > 1
            && Math.abs(candidates[1]!.distance - candidates[0]!.distance) <= AutoFixLayout.CONNECT_AMBIGUITY_EPSILON
        ) {
            return undefined;
        }

        const winner = candidates[0]!;
        return {
            node: winner.node.id,
            handle: this.closestSideHandle(x, y, winner.rect),
            relative: absoluteToRelative({ x, y }, winner.rect),
        };
    }

    private distanceToRect(x: number, y: number, rect: IRect): number {
        const right = rect.left + rect.width;
        const bottom = rect.top + rect.height;
        const dx = Math.max(rect.left - x, 0, x - right);
        const dy = Math.max(rect.top - y, 0, y - bottom);
        return Math.hypot(dx, dy);
    }

    private closestSideHandle(x: number, y: number, rect: IRect): NodeHandle {
        const right = rect.left + rect.width;
        const bottom = rect.top + rect.height;
        const dLeft = Math.abs(x - rect.left);
        const dRight = Math.abs(x - right);
        const dTop = Math.abs(y - rect.top);
        const dBottom = Math.abs(y - bottom);

        const min = Math.min(dLeft, dRight, dTop, dBottom);
        if (min === dTop) return NodeHandle.N;
        if (min === dBottom) return NodeHandle.S;
        if (min === dLeft) return NodeHandle.W;
        return NodeHandle.E;
    }

    // ── Pass 2: align near-matching edges ────────────────────────────────────

    private alignNearEdges(allNodes: INode[]): number {
        const shapes = allNodes.filter(n => !isConnection(n));
        if (shapes.length < 2) return 0;

        const threshold = AutoFixLayout.ALIGN_THRESHOLD;
        const coords = this.diagram.getCoordinates();
        const prevSelection = this.diagram.selection();
        let aligned = 0;

        for (const dir of ['top', 'bottom', 'left', 'right'] as const) {
            const groups = this.groupByNearEdge(shapes, dir, threshold, coords);
            for (const group of groups) {
                this.diagram.setSelection(group);
                this.diagram.alignSelected(dir);
                aligned += group.length;
            }
        }

        this.diagram.setSelection(prevSelection);
        return aligned;
    }

    private groupByNearEdge(
        shapes: INode[],
        dir: 'top' | 'bottom' | 'left' | 'right',
        threshold: number,
        coords: ReturnType<DiagramEditView['getCoordinates']>,
    ): INode[][] {
        const edgeVal = (b: IRect): number => {
            switch (dir) {
                case 'top': return b.top;
                case 'bottom': return b.top + b.height;
                case 'left': return b.left;
                case 'right': return b.left + b.width;
            }
        };

        const sorted = shapes
            .map(n => ({ node: n, val: edgeVal(coords.getBoundingRect(n)) }))
            .sort((a, b) => a.val - b.val);

        const groups: INode[][] = [];
        let current: INode[] = [];
        let anchorVal = NaN;

        for (const { node, val } of sorted) {
            if (isNaN(anchorVal) || Math.abs(val - anchorVal) <= threshold) {
                current.push(node);
                if (isNaN(anchorVal)) anchorVal = val;
            } else {
                if (current.length >= 2) groups.push(current);
                current = [node];
                anchorVal = val;
            }
        }
        if (current.length >= 2) groups.push(current);

        return groups;
    }

    // ── Pass 3: equalize near-uniform spreads ─────────────────────────────────

    private equalizeNearSpreads(allNodes: INode[]): number {
        const shapes = allNodes.filter(n => !isConnection(n));
        if (shapes.length < 3) return 0;

        const threshold = AutoFixLayout.SPREAD_THRESHOLD;
        const coords = this.diagram.getCoordinates();
        const prevSelection = this.diagram.selection();
        let equalized = 0;

        for (const dir of ['row', 'column'] as const) {
            const groups = this.groupForSpread(shapes, dir, threshold, coords);
            for (const group of groups) {
                this.diagram.setSelection(group);
                this.diagram.spreadSelected(dir);
                equalized += group.length;
            }
        }

        this.diagram.setSelection(prevSelection);
        return equalized;
    }

    private groupForSpread(
        shapes: INode[],
        dir: 'row' | 'column',
        threshold: number,
        coords: ReturnType<DiagramEditView['getCoordinates']>,
    ): INode[][] {
        const primary = (b: IRect) => dir === 'row' ? b.left : b.top;
        const secondary = (b: IRect) => dir === 'row' ? b.top : b.left;

        const alignThreshold = AutoFixLayout.ALIGN_THRESHOLD;
        const byAxis = new Map<number, { node: INode; b: IRect }[]>();

        for (const shape of shapes) {
            const b = coords.getBoundingRect(shape);
            const sec = secondary(b);
            let found = false;
            for (const [key, group] of byAxis) {
                if (Math.abs(sec - key) <= alignThreshold) { group.push({ node: shape, b }); found = true; break; }
            }
            if (!found) byAxis.set(sec, [{ node: shape, b }]);
        }

        const result: INode[][] = [];

        for (const group of byAxis.values()) {
            if (group.length < 3) continue;
            const sorted = [...group].sort((a, b) => primary(a.b) - primary(b.b));

            const gaps: number[] = [];
            for (let i = 1; i < sorted.length; i++) {
                const prev = sorted[i - 1]!.b, curr = sorted[i]!.b;
                gaps.push(dir === 'row'
                    ? curr.left - (prev.left + prev.width)
                    : curr.top - (prev.top + prev.height));
            }

            if (gaps.length >= 2 && Math.max(...gaps) - Math.min(...gaps) <= threshold) {
                result.push(sorted.map(e => e.node));
            }
        }

        return result;
    }
}
