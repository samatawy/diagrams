import type { IConnection, IConnectionAnchor, IGrid, INode } from "../interfaces";
import { NodeRegistry } from "../factory/node.registry";
import { NodeBasics } from "../nodes/node.basics";
import { NodeHandle } from "../types";
import type { IRect } from "../types";
import type { DiagramView } from "../view/diagram.view";
import { isConnectionNode } from "../guards";


/**
 * Renderable line segment used to visualize alignment guides.
 */
export interface DiagramLineGuide {
    /** 
     * Optional guide category used by renderers. 
     */
    kind?: 'line' | 'guideline';
    /** 
     * Start point in diagram/world coordinates. 
     */
    from: { x: number; y: number };
    /** 
     * End point in diagram/world coordinates. 
     */
    to: { x: number; y: number };
    /** 
     * Optional stroke color override. 
     */
    color?: string;
    /** 
     * Optional stroke width (world units).
     */
    width?: number;
    /** 
     * Optional line dash pattern. 
     */
    dash?: number[];
    /** 
     * Optional alpha value in range [0, 1]. 
     */
    alpha?: number;
}

/**
 * Generic guide type currently represented as a line segment.
 */
export type DiagramGuide = DiagramLineGuide;

/**
 * Axis discriminator for snapping operations.
 */
export type SnapAxis = "x" | "y";

/**
 * Named rectangle points used in snap matching.
 */
export type SnapPointKey = "left" | "centerX" | "right" | "top" | "middleY" | "bottom";

/**
 * Candidate target rectangle used for guide matching.
 */
interface SnapCandidate {
    /** 
     * Candidate node id. 
     */
    id: string;
    /** 
     * Candidate bounding rectangle in world coordinates. 
     */
    rect: IRect;
}

/**
 * A single snap match between a source point and candidate target point.
 */
export interface SnapMatch {
    /** 
     * Axis on which this match was computed. 
     */
    axis: SnapAxis;
    /** 
     * Candidate node id that produced this match. 
     */
    candidateId: string;
    /** 
     * Source point key on the moving/resizing rectangle. 
     */
    sourcePoint: SnapPointKey;
    /** 
     * Target point key on the candidate rectangle. 
     */
    targetPoint: SnapPointKey;
    /** 
     * Signed delta required to align source and target points. 
     */
    delta: number;
    /** 
     * Absolute distance between source and target points before snapping. 
     */
    distance: number;
}

/**
 * Optional tuning knobs used by snap/match calculations.
 */
export interface SnapOptions {
    /**
     * Snap threshold as a scalar or per-axis values.
     * Matches farther than this threshold are ignored.
     */
    threshold?: number | Partial<Record<SnapAxis, number>>;
    /**
     * Threshold used when deciding which guides are rendered.
     * Defaults to `threshold` when omitted.
     */
    render_threshold?: number | Partial<Record<SnapAxis, number>>;
    /**
     * Threshold used when deciding which deltas are snapped on pointer-up.
     * Defaults to `threshold` when omitted.
     */
    snap_threshold?: number | Partial<Record<SnapAxis, number>>;
    /**
     * Preferred drag direction per axis for tie-break ranking.
     * Positive values bias positive deltas, negative values bias negative deltas.
     */
    preferDeltaSign?: Partial<Record<SnapAxis, number>>;
}

/**
 * Axis deltas and top-ranked/all-ranked matches for a snap pass.
 */
interface SnapDeltaResult {
    /** 
     * Chosen X-axis snap delta.
     */
    dx: number;
    /** 
     * Chosen Y-axis snap delta.
     */
    dy: number;
    /** 
     * Ordered list of all X-axis matches.
     */
    xMatches: SnapMatch[];
    /** 
     * Ordered list of all Y-axis matches. 
     */
    yMatches: SnapMatch[];
}

/**
 * Snap result enriched with renderable guide lines.
 */
export interface SnapGuideResult extends SnapDeltaResult {
    /** 
     * Guides that can be rendered for visual feedback. 
     */
    guides: DiagramGuide[];
    /**
     * Options used to compute this result.
     */
    options?: SnapOptions;
}

/**
 * Input required to compute guide candidates and snap results for an interaction step.
 */
export interface GuidesComputeInput {
    /** 
     * Diagram instance that provides nodes, layers, grid, and coordinates. 
     */
    diagram: DiagramView;
    /** 
     * Active nodes participating in move/resize interaction. 
     */
    nodes: INode[];
    /** 
     * Delta X from latest interaction step. 
     */
    byX: number;
    /** 
     * Delta Y from latest interaction step. 
     */
    byY: number;
    /** 
     * Optional down-shape id to explicitly exclude from candidate matching. 
     */
    downShapeId?: string;
    /**
     * Active interaction handle. When provided, guides are restricted to the
     * edges that are actually moving, matching the snap behavior of pointer-up.
     */
    handle?: NodeHandle;
}

/**
 * Input required to apply a previously computed pending snap result.
 */
export interface GuidesApplyInput {
    /** 
     * Diagram instance for coordinate and adapter access. 
     */
    diagram: DiagramView;
    /** 
     * Previously computed snap result. 
     */
    snap?: SnapGuideResult;
    /** 
     * Active handle that determines how snap deltas are applied. 
     */
    handle: NodeHandle;
    /** 
     * Nodes to mutate when applying the snap. 
     */
    nodes: INode[];
    /** 
     * Optional resize aspect-lock flag passed through on resize. 
     */
    preserveAspect?: boolean;
}

/**
 * Stateless helpers for axis-aware nearest/snap calculations.
 * Rendering concerns are intentionally left to views.
 */
export class Guides {

    /**
     * Removes connection-like nodes from a collection before guide computation.
     * @param nodes Nodes to filter.
     * @returns Only non-connection nodes.
     */
    private static filterNonConnectionNodes(nodes: INode[]): INode[] {
        return nodes.filter(node => !isConnectionNode(node));
    }

    /**
     * Computes snap result and visual guides for the current interaction state.
     * @param input Context including diagram access, moving nodes, and pointer deltas.
     * @returns Snap result with guides, or `undefined` when no valid guide context exists.
     */
    public static computeResult(input: GuidesComputeInput): SnapGuideResult | undefined {
        const filtered = this.filterNonConnectionNodes(input.nodes);
        if (!filtered.length) {
            return undefined;
        }

        const coordinates = input.diagram.getCoordinates();
        const bounds = this.getBounds(filtered, node => coordinates.getBoundingRect(node, true));
        if (!bounds) {
            return undefined;
        }

        const excludedNodeIds = new Set(filtered.map(node => node.id));
        if (input.downShapeId) {
            excludedNodeIds.add(input.downShapeId);
        }

        const candidates = this.getCandidates(
            excludedNodeIds,
            bounds,
            input.diagram,
            coordinates,
        );
        if (!candidates.length) {
            return undefined;
        }

        const options = this.buildSnapOptions(input.diagram.grid, input.byX, input.byY);

        return this.snapWithGuides(bounds, candidates, options, input.handle);
    }

    /**
     * Applies a pending snap result to the provided nodes at pointer-up.
     * @param input Context containing pending snap data and mutation target nodes.
     * @returns `true` when a snap delta was applied; otherwise `false`.
     */
    public static applyPendingToNodes(input: GuidesApplyInput): boolean {
        if (!input.snap || !input.nodes.length) {
            return false;
        }

        const { dx, dy } = this.snapDeltas(input.snap, input.handle);
        if (dx === 0 && dy === 0) {
            return false;
        }

        if (input.handle === NodeHandle.MOVE) {
            for (const node of input.nodes) {
                NodeBasics.moveBy(node, dx, dy, 'ignore_scale');
            }
            return true;
        }

        const zoom = input.diagram.getCoordinates().zoom || 1;
        for (const node of input.nodes) {
            NodeBasics.resizeHandle(node, input.handle, dx * zoom, dy * zoom, input.preserveAspect);
            NodeRegistry.adapter(node.type)?.afterResize?.(node, input.handle);
        }
        return true;
    }

    /**
     * Build SnapOptions from a grid and the current drag direction.
     */
    private static buildSnapOptions(grid: Pick<IGrid, 'width' | 'height'>, byX: number, byY: number): SnapOptions {
        const xThreshold = Math.max(1, grid.width || 6);
        const yThreshold = Math.max(1, grid.height || 6);

        return {
            threshold: { x: xThreshold, y: yThreshold },
            render_threshold: { x: xThreshold, y: yThreshold },
            snap_threshold: { x: xThreshold, y: yThreshold },
            preferDeltaSign: { x: byX, y: byY },
        };
    }

    /**
     * Given a pending snap result and the active drag handle, return the dx/dy
     * to apply at pointer-up.  For MOVE, the closest match on each axis wins.
     * For resize handles, only the match whose sourcePoint matches the active
      * edge of that handle is eligible.  A match is only applied when its
      * distance falls within `snap_threshold`.
     */
    private static snapDeltas(snap: SnapGuideResult, handle: NodeHandle, options?: SnapOptions): { dx: number; dy: number } {
        const effective = options ?? snap.options ?? {};
        const xThreshold = this.thresholdForAxis(effective, 'x', 'snap');
        const yThreshold = this.thresholdForAxis(effective, 'y', 'snap');
        const isMove = handle === NodeHandle.MOVE;
        const xSourceKey = isMove ? undefined : this.handleSourceKey(handle, 'x');
        const ySourceKey = isMove ? undefined : this.handleSourceKey(handle, 'y');

        const dx = isMove || xSourceKey !== null
            ? this.pickDelta(snap.xMatches, xThreshold, xSourceKey ?? undefined)
            : 0;
        const dy = isMove || ySourceKey !== null
            ? this.pickDelta(snap.yMatches, yThreshold, ySourceKey ?? undefined)
            : 0;

        return { dx, dy };
    }

    /**
     * Builds all matches for a given axis and sorts them by preference.
     * @param movingRect Current moving rectangle.
     * @param candidates Candidate target rectangles.
     * @param axis Axis to evaluate.
     * @param options Snap behavior options.
     * @returns Ordered axis matches from best to worst.
     */
    private static matchesByAxis(movingRect: IRect, candidates: SnapCandidate[], axis: SnapAxis, options: SnapOptions = {}): SnapMatch[] {
        const threshold = this.thresholdForAxis(options, axis, 'match');
        const preferredDirection = options.preferDeltaSign?.[axis] ?? 0;
        const sourcePoints = this.axisPoints(movingRect, axis);
        const matches: SnapMatch[] = [];

        for (const candidate of candidates) {
            const targetPoints = this.axisPoints(candidate.rect, axis);

            for (const source of sourcePoints) {
                for (const target of targetPoints) {
                    const delta = target.value - source.value;
                    const distance = Math.abs(delta);

                    if (distance > threshold) {
                        continue;
                    }

                    const current: SnapMatch = {
                        axis,
                        candidateId: candidate.id,
                        sourcePoint: source.key,
                        targetPoint: target.key,
                        delta,
                        distance,
                    };
                    matches.push(current);
                }
            }
        }

        matches.sort((a, b) => this.compareMatches(a, b, preferredDirection));

        return matches;
    }

    /**
     * Comparison function used to rank candidate matches.
     * @param a First match.
     * @param b Second match.
     * @param preferredDirection Preferred drag direction for tie-breaking.
     * @returns Sort order value for `Array.sort`.
     */
    private static compareMatches(a: SnapMatch, b: SnapMatch, preferredDirection: number): number {
        if (a.distance !== b.distance) {
            return a.distance - b.distance;
        }

        const aSignScore = this.directionScore(a.delta, preferredDirection);
        const bSignScore = this.directionScore(b.delta, preferredDirection);
        if (aSignScore !== bSignScore) {
            return aSignScore - bSignScore;
        }

        const aSourceRank = this.pointRank(a.axis, a.sourcePoint);
        const bSourceRank = this.pointRank(b.axis, b.sourcePoint);
        if (aSourceRank !== bSourceRank) {
            return preferredDirection >= 0
                ? bSourceRank - aSourceRank
                : aSourceRank - bSourceRank;
        }

        const aTargetRank = this.pointRank(a.axis, a.targetPoint);
        const bTargetRank = this.pointRank(b.axis, b.targetPoint);
        return preferredDirection >= 0
            ? bTargetRank - aTargetRank
            : aTargetRank - bTargetRank;
    }

    /**
     * Computes the best snap delta on X and Y and preserves all axis matches.
     * @param movingRect Current moving rectangle.
     * @param candidates Candidate target rectangles.
     * @param options Snap behavior options.
     * @returns Delta result and ordered axis match lists.
     */
    private static snapDelta(movingRect: IRect, candidates: SnapCandidate[], options: SnapOptions = {}): SnapDeltaResult {
        const xMatches = this.matchesByAxis(movingRect, candidates, "x", options);
        const yMatches = this.matchesByAxis(movingRect, candidates, "y", options);
        const xMatch = xMatches[0];
        const yMatch = yMatches[0];

        return {
            dx: xMatch?.delta ?? 0,
            dy: yMatch?.delta ?? 0,
            xMatches,
            yMatches,
        };
    }

    /**
     * Computes snap deltas and materializes visual guides from all matches.
     * @param movingRect Current moving rectangle.
     * @param candidates Candidate target rectangles.
     * @param options Snap behavior options.
     * @returns Snap result augmented with renderable guides.
     */
    private static snapWithGuides(movingRect: IRect, candidates: SnapCandidate[], options: SnapOptions = {}, handle?: NodeHandle): SnapGuideResult {
        const result = this.snapDelta(movingRect, candidates, options);
        const xGuideThreshold = this.thresholdForAxis(options, 'x', 'render');
        const yGuideThreshold = this.thresholdForAxis(options, 'y', 'render');
        const isMove = !handle || handle === NodeHandle.MOVE;
        const xSourceKey = isMove ? undefined : this.handleSourceKey(handle, 'x');
        const ySourceKey = isMove ? undefined : this.handleSourceKey(handle, 'y');

        const xFiltered = result.xMatches.filter(
            m => m.distance <= xGuideThreshold && (xSourceKey === undefined || m.sourcePoint === xSourceKey)
        );
        const xBest = xFiltered[0]?.distance ?? Infinity;
        const xGuideMatches = xFiltered.filter(m => m.distance === xBest);

        const yFiltered = result.yMatches.filter(
            m => m.distance <= yGuideThreshold && (ySourceKey === undefined || m.sourcePoint === ySourceKey)
        );
        const yBest = yFiltered[0]?.distance ?? Infinity;
        const yGuideMatches = yFiltered.filter(m => m.distance === yBest);

        return {
            ...result,
            guides: this.buildGuides(movingRect, candidates, xGuideMatches, yGuideMatches),
            options,
        };
    }

    /**
     * Builds guideline segments from axis matches.
     * @param movingRect Current moving rectangle.
     * @param candidates Candidate target rectangles.
     * @param xMatches Ordered X-axis matches.
     * @param yMatches Ordered Y-axis matches.
     * @returns Renderable line guides.
     */
    private static buildGuides(movingRect: IRect, candidates: SnapCandidate[], xMatches: SnapMatch[], yMatches: SnapMatch[]): DiagramGuide[] {
        const guides: DiagramGuide[] = [];
        const candidatesById = new Map(candidates.map(candidate => [candidate.id, candidate]));
        const seen = new Set<string>();

        for (const xMatch of xMatches) {
            const candidate = candidatesById.get(xMatch.candidateId);
            if (candidate) {
                const x = this.pointValue(candidate.rect, xMatch.targetPoint);
                const key = `x:${x}`;
                if (seen.has(key)) {
                    continue;
                }
                seen.add(key);
                guides.push({
                    kind: 'guideline',
                    from: {
                        x,
                        y: Math.min(movingRect.top, candidate.rect.top),
                    },
                    to: {
                        x,
                        y: Math.max(movingRect.top + movingRect.height, candidate.rect.top + candidate.rect.height),
                    },
                });
            }
        }

        for (const yMatch of yMatches) {
            const candidate = candidatesById.get(yMatch.candidateId);
            if (candidate) {
                const y = this.pointValue(candidate.rect, yMatch.targetPoint);
                const key = `y:${y}`;
                if (seen.has(key)) {
                    continue;
                }
                seen.add(key);
                guides.push({
                    kind: 'guideline',
                    from: {
                        x: Math.min(movingRect.left, candidate.rect.left),
                        y,
                    },
                    to: {
                        x: Math.max(movingRect.left + movingRect.width, candidate.rect.left + candidate.rect.width),
                        y,
                    },
                });
            }
        }

        return guides;
    }

    /**
     * Returns the axis reference points (start/middle/end) for a rectangle.
     * @param rect Rectangle to analyze.
     * @param axis Axis to project points onto.
     * @returns Ordered point key/value pairs for the axis.
     */
    private static axisPoints(rect: IRect, axis: SnapAxis): Array<{ key: SnapPointKey; value: number }> {
        if (axis === "x") {
            return [
                { key: "left", value: rect.left },
                { key: "centerX", value: rect.left + rect.width / 2 },
                { key: "right", value: rect.left + rect.width },
            ];
        }

        return [
            { key: "top", value: rect.top },
            { key: "middleY", value: rect.top + rect.height / 2 },
            { key: "bottom", value: rect.top + rect.height },
        ];
    }

    /**
     * Maps a resize handle to the source snap point expected for an axis.
     * @param handle Active resize handle.
     * @param axis Axis for which source point is needed.
     * @returns Source point key, or `null` when the handle does not affect that axis.
     */
    private static handleSourceKey(handle: NodeHandle, axis: SnapAxis): SnapPointKey | null {
        if (axis === 'x') {
            if (handle === NodeHandle.E || handle === NodeHandle.NE || handle === NodeHandle.SE) return 'right';
            if (handle === NodeHandle.W || handle === NodeHandle.NW || handle === NodeHandle.SW) return 'left';
            return null;
        }

        if (handle === NodeHandle.S || handle === NodeHandle.SE || handle === NodeHandle.SW) return 'bottom';
        if (handle === NodeHandle.N || handle === NodeHandle.NE || handle === NodeHandle.NW) return 'top';
        return null;
    }

    /**
     * Picks the first match that satisfies threshold and optional source-point constraints.
     * @param matches Ordered candidate matches.
     * @param threshold Maximum match distance.
     * @param sourceKey Optional required source point.
     * @returns Chosen delta, or `0` when nothing qualifies.
     */
    private static pickDelta(matches: SnapMatch[], threshold: number, sourceKey: SnapPointKey | undefined): number {
        for (const match of matches) {
            if (match.distance > threshold) continue;
            if (sourceKey !== undefined && match.sourcePoint !== sourceKey) continue;
            return match.delta;
        }
        return 0;
    }

    /**
     * Resolves axis threshold for matching, rendering, or snapping with option fallbacks.
     * @param options Snap options input.
     * @param axis Axis to resolve.
     * @param mode Threshold mode to resolve.
     * @returns Numeric threshold for the requested axis.
     */
    private static thresholdForAxis(options: SnapOptions, axis: SnapAxis, mode: 'match' | 'render' | 'snap'): number {
        const source = mode === 'render'
            ? (options.render_threshold ?? options.threshold)
            : mode === 'snap'
                ? (options.snap_threshold ?? options.threshold)
                : options.threshold;

        if (typeof source === 'number') {
            return source;
        }

        if (source && typeof source[axis] === 'number') {
            return source[axis]!;
        }

        return 6;
    }

    /**
     * Scores whether a delta aligns with preferred direction.
     * @param delta Match delta.
     * @param preferredDirection User drag direction.
     * @returns `0` for preferred/no-op, `1` for opposite direction.
     */
    private static directionScore(delta: number, preferredDirection: number): number {
        if (!preferredDirection || !delta) {
            return 0;
        }

        return Math.sign(delta) === Math.sign(preferredDirection) ? 0 : 1;
    }

    /**
     * Provides stable ordering rank for snap points on an axis.
     * @param axis Axis containing the point.
     * @param key Point key to rank.
     * @returns Integer rank used in tie-break sorting.
     */
    private static pointRank(axis: SnapAxis, key: SnapPointKey): number {
        if (axis === 'x') {
            switch (key) {
                case 'left':
                    return 0;
                case 'centerX':
                    return 1;
                case 'right':
                    return 2;
                default:
                    return 1;
            }
        }

        switch (key) {
            case 'top':
                return 0;
            case 'middleY':
                return 1;
            case 'bottom':
                return 2;
            default:
                return 1;
        }
    }

    /**
     * Projects a snap point key into a numeric coordinate.
     * @param rect Rectangle containing the point.
     * @param key Point key to resolve.
     * @returns Point coordinate value.
     */
    private static pointValue(rect: IRect, key: SnapPointKey): number {
        switch (key) {
            case 'left':
                return rect.left;
            case 'centerX':
                return rect.left + rect.width / 2;
            case 'right':
                return rect.left + rect.width;
            case 'top':
                return rect.top;
            case 'middleY':
                return rect.top + rect.height / 2;
            case 'bottom':
                return rect.top + rect.height;
        }
    }

    /**
     * Computes union bounds for a set of nodes.
     * @param nodes Nodes to bound.
     * @param getRect Rectangle accessor for each node.
     * @returns Bounding rectangle, or `undefined` when no nodes are provided.
     */
    private static getBounds(nodes: INode[], getRect: (node: INode) => IRect): IRect | undefined {
        let bounds: IRect | undefined;

        for (const node of nodes) {
            const rect = getRect(node);

            if (!bounds) {
                bounds = { ...rect };
                continue;
            }

            const right = Math.max(bounds.left + bounds.width, rect.left + rect.width);
            const bottom = Math.max(bounds.top + bounds.height, rect.top + rect.height);
            bounds.left = Math.min(bounds.left, rect.left);
            bounds.top = Math.min(bounds.top, rect.top);
            bounds.width = right - bounds.left;
            bounds.height = bottom - bounds.top;
        }

        return bounds;
    }

    /**
     * Collects snap candidates from visible layers while excluding selected and linked nodes.
     * @param excludedNodeIds Node ids excluded from snapping.
     * @param movingBounds Current bounds of moving nodes.
     * @param diagram Diagram access point.
     * @param coordinates Coordinate system used for rectangle evaluation.
     * @returns Candidate nodes and their bounds.
     */
    private static getCandidates(excludedNodeIds: Set<string>, movingBounds: IRect, diagram: DiagramView, coordinates: ReturnType<DiagramView['getCoordinates']>): SnapCandidate[] {
        const candidates: SnapCandidate[] = [];
        const seen = new Set<string>();
        const linkedNodeIds = this.getLinkedNodeIds(excludedNodeIds, diagram.nodes);

        const tryAddNode = (node: INode): void => {
            if (seen.has(node.id)) {
                return;
            }
            seen.add(node.id);

            if (excludedNodeIds.has(node.id) || linkedNodeIds.has(node.id) || isConnectionNode(node)) {
                return;
            }

            const rect = coordinates.getBoundingRect(node, true);
            if (rect.left === movingBounds.left
                && rect.top === movingBounds.top
                && rect.width === movingBounds.width
                && rect.height === movingBounds.height) {
                return;
            }

            candidates.push({ id: node.id, rect });
        };

        for (const layer of diagram.layers) {
            if (!layer.visible) {
                continue;
            }

            const layerNodes = layer.nodes
                .map(nodeId => diagram.node(nodeId))
                .filter((node): node is INode => !!node);

            for (const node of layerNodes) {
                tryAddNode(node);
            }
        }

        // Defensive fallback: if layer membership is stale, compute candidates from all nodes.
        // if (!candidates.length) {
        //     for (const node of diagram.nodes) {
        //         tryAddNode(node);
        //     }
        // }

        return candidates;
    }

    /**
     * Finds nodes linked to the current selection directly through anchor points.
     * @param nodeIds Selected/excluded node ids.
     * @param allNodes All diagram nodes.
     * @returns Linked node ids to be excluded from snapping.
     */
    private static getLinkedNodeIds(nodeIds: Set<string>, allNodes: INode[]): Set<string> {
        const linked = new Set<string>();

        for (const node of allNodes) {
            const connection = node as INode & IConnection;
            if (!connection.from && !connection.to) {
                continue;
            }

            const fromId = this.anchorNodeId(connection.from);
            const toId = this.anchorNodeId(connection.to);
            if (!fromId || !toId) {
                continue;
            }

            if (nodeIds.has(fromId) || nodeIds.has(toId)) {
                linked.add(node.id);
            }
        }

        return linked;
    }

    // /**
    //  * Finds nodes linked to the current selection through connection endpoints.
    //  * @param nodeIds Selected/excluded node ids.
    //  * @param allNodes All diagram nodes.
    //  * @returns Linked node ids to be excluded from snapping.
    //  */
    // private static getLinkedNodeIds(nodeIds: Set<string>, allNodes: INode[]): Set<string> {
    //     const linked = new Set<string>();

    //     for (const node of allNodes) {
    //         // if (!isConnectionNode(node)) {
    //         //     continue;
    //         // }
    //         const connection = node as INode & IConnection;
    //         if (!connection.from && !connection.to) {
    //             continue;
    //         }

    //         const fromId = this.anchorNodeId(connection.from);
    //         const toId = this.anchorNodeId(connection.to);
    //         if (!fromId || !toId) {
    //             continue;
    //         }

    //         if (nodeIds.has(fromId)) {
    //             linked.add(toId);
    //         }
    //         if (nodeIds.has(toId)) {
    //             linked.add(fromId);
    //         }
    //     }

    //     return linked;
    // }

    /**
     * Extracts a connection anchor node id from string/object anchor forms.
     * @param anchor Connection anchor input.
     * @returns Node id, or `undefined` when anchor is missing.
     */
    private static anchorNodeId(anchor?: IConnectionAnchor): string | undefined {
        if (!anchor) {
            return undefined;
        }
        return typeof anchor.node === 'string' ? anchor.node : anchor.node.id;
    }

}
