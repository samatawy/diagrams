import { NodeHandle, type IPoint } from "../types";
import type { DiagramView } from "../view/diagram.view";
import { isConnection, isContainer } from "../guards";
import { isLocked } from "../value.utils";
import ELK from "elkjs";
import type { ElkCommonDescription, ElkExtendedEdge, ElkNode, ElkPort, LayoutOptions } from "elkjs";
import { GroupBasics } from "../nodes/group.basics";
import { NodeRegistry } from "../factory/node.registry";
import type { CoordinateSystem } from "../view/coordinate.system";
import type { INode } from "../interfaces";

/**
 * ElkLayout is a utility class that provides methods to automatically layout nodes using ELK. 
 * Currently experimental and calls only layered flow layouts.
 */
export class ElkLayout {

    private diagram: DiagramView;

    /**
     * Creates an instance of ElkLayout and attaches it to a DiagramView.
     * This allows the ElkLayout to manipulate the viewport of the DiagramView when fitting content.
     * @param diagram the DiagramView instance to attach to
     * @param options optional configuration for minimum and maximum zoom levels
     */
    constructor(diagram: DiagramView) {
        this.diagram = diagram;
    }

    /**
     * Automatically layout the diagram in a default flow.
     */
    public async autoLayout(): Promise<INode[]> {
        const elk = new ELK();
        const graph = this.buildElkGraph();

        graph.layoutOptions = {
            'elk.algorithm': 'layered',
            'elk.spacing.nodeNode': '32',
            'elk.layered.spacing.nodeNodeBetweenLayers': '32',
            'elk.layered.spacing.edgeEdgeBetweenLayers': '16',
            'elk.edgeRouting': 'ORTHOGONAL',

            // 'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
            // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            'elk.edgeRouting.avoidNodeOverlap': 'true',
        };

        const result = await elk.layout(graph);

        console.log('Elk layout result:', result);
        return this.applyElkGraph(result);
    }

    /**
     * Automatically layout the diagram in a top-to-bottom flow.
     */
    public async autolayoutFlow(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): Promise<INode[]> {
        const elk = new ELK();
        const graph = this.buildElkGraph();

        graph.layoutOptions = {
            'elk.algorithm': 'layered',
            'elk.direction': direction,
            'elk.spacing.nodeNode': '32',
            'elk.layered.spacing.nodeNodeBetweenLayers': '64',
            'elk.layered.spacing.edgeEdgeBetweenLayers': '32',
            'elk.edgeRouting': 'ORTHOGONAL',

            // 'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
            // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            'elk.edgeRouting.avoidNodeOverlap': 'true',
        };

        const result = await elk.layout(graph);

        console.log('Elk layout result:', result);
        return this.applyElkGraph(result);
    }

    // /**
    //  * Automatically layout the diagram in a left-to-right flow.
    //  */
    // public async autoLeftRight(): Promise<INode[]> {
    //     const elk = new ELK();
    //     const graph = this.buildElkGraph();

    //     graph.layoutOptions = {
    //         'elk.algorithm': 'layered',
    //         'elk.direction': 'RIGHT',
    //         'elk.spacing.nodeNode': '32',
    //         'elk.layered.spacing.nodeNodeBetweenLayers': '64',
    //         'elk.layered.spacing.edgeEdgeBetweenLayers': '32',
    //         'elk.edgeRouting': 'ORTHOGONAL',

    //         // 'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
    //         // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    //         'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    //         'elk.edgeRouting.avoidNodeOverlap': 'true',
    //     };

    //     const result = await elk.layout(graph);

    //     console.log('Elk layout result:', result);
    //     return this.applyElkGraph(result);
    // }

    /**
     * Automatically layout the diagram in a top-to-bottom tree.
     */
    public async autoLayoutTree(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): Promise<INode[]> {
        const elk = new ELK();
        const graph = this.buildElkGraph();

        graph.layoutOptions = {
            'elk.algorithm': 'mrtree',
            'elk.direction': direction,
            'elk.mrtree.spacing': '64',
            'elk.mrtree.maxDepth': '16',

            'elk.spacing.nodeNode': '32',
            'elk.spacing.edgeEdge': '16',
            'elk.spacing.edgeNode': '16',
            'elk.layered.spacing.nodeNodeBetweenLayers': '64',
            'elk.layered.spacing.edgeEdgeBetweenLayers': '32',
            'elk.edgeRouting': 'ORTHOGONAL',

            'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            'elk.layered.mergeEdges': 'true',
        };

        const result = await elk.layout(graph);

        console.log('Elk layout result:', result);
        return this.applyElkGraph(result);
    }

    /**
     * Automatically layout the diagram in a bottom-to-top tree.
     */
    public async autoTreeBottomUp(): Promise<INode[]> {
        const elk = new ELK();
        const graph = this.buildElkGraph();

        graph.layoutOptions = {
            'elk.algorithm': 'mrtree',
            'elk.direction': 'UP',
            'elk.mrtree.spacing': '64',
            'elk.mrtree.maxDepth': '16',

            'elk.spacing.nodeNode': '32',
            'elk.spacing.edgeEdge': '16',
            'elk.spacing.edgeNode': '16',
            'elk.layered.spacing.nodeNodeBetweenLayers': '64',
            'elk.layered.spacing.edgeEdgeBetweenLayers': '32',
            'elk.edgeRouting': 'ORTHOGONAL',

            'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            'elk.layered.mergeEdges': 'true',
        };

        const result = await elk.layout(graph);

        console.log('Elk layout result:', result);
        return this.applyElkGraph(result);
    }

    /**
     * Automatically layout the diagram in a circuit.
     */
    public async autoCircuit(): Promise<INode[]> {
        const elk = new ELK();
        const graph = this.buildElkGraph();

        graph.layoutOptions = {
            "elk.algorithm": "layered",

            "elk.direction": "UNDEFINED",

            "elk.edgeRouting": "ORTHOGONAL",

            "elk.layered.crossingMinimization.forceNodeModelOrder": "false",
            "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",

            "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
            "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",

            "elk.layered.edgeRouting.strategy": "ORTHOGONAL",
            "elk.layered.edgeRouting.thoroughness": "EXPENSIVE",

            "elk.layered.cycleBreaking.strategy": "GREEDY",

            "elk.layered.edgeRouting.separateConnectedComponents": "true",

            "elk.spacing.nodeNode": "64",
            'elk.spacing.edgeEdge': '32',
            'elk.spacing.edgeNode': '32',

            "elk.layered.spacing.nodeNodeBetweenLayers": "64",
            "elk.layered.spacing.edgeEdgeBetweenLayers": "32",
            "elk.layered.spacing.edgeNodeBetweenLayers": "32",

            // 'elk.algorithm': 'force',

            // 'elk.force.iterations': '500',
            // 'elk.force.repulsion': '0.5',
            // 'elk.force.gravity': '0.1',

            // 'elk.spacing.nodeNode': '64',
            // 'elk.spacing.edgeEdge': '32',
            // 'elk.spacing.edgeNode': '32',
            // // 'elk.layered.spacing.nodeNodeBetweenLayers': '64',
            // // 'elk.layered.spacing.edgeEdgeBetweenLayers': '32',
            // 'elk.edgeRouting': 'ORTHOGONAL',

            // 'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
            // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            // 'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            // 'elk.edgeRouting.avoidNodeOverlap': 'true',
        };

        const result = await elk.layout(graph);

        console.log('Elk layout result:', result);
        return this.applyElkGraph(result);
    }

    protected handleToElkPortSide(handle: NodeHandle): string {
        switch (handle) {
            case NodeHandle.N:
                return 'NORTH';
            case NodeHandle.S:
                return 'SOUTH';
            case NodeHandle.E:
            case NodeHandle.NE:
            case NodeHandle.SE:
                return 'EAST';
            case NodeHandle.W:
            case NodeHandle.NW:
            case NodeHandle.SW:
                return 'WEST';
            default:
                return '';
        }
    }

    protected buildElkNode(node: any, coordinates?: CoordinateSystem): ElkNode | undefined {
        if (!node) return undefined;

        coordinates = coordinates ?? this.diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node);
        const elk_node: ElkNode = {
            id: node.id,
            width: rect.width,
            height: rect.height,
            layoutOptions: {
                'portConstraints': 'FIXED_SIDE',
            }
        };

        const ports: ElkPort[] = NodeRegistry.adapter(node.type)?.connection_handles?.map((h: NodeHandle) => {
            return {
                id: `${node.id}_${h}`,
                width: 0,
                height: 0,
                layoutOptions: {
                    'port.side': this.handleToElkPortSide(h),
                },
            } as ElkPort;
        }) || [];
        elk_node.ports = ports;

        if (isLocked(node)) {
            elk_node.x = rect.left;
            elk_node.y = rect.top;
            elk_node.layoutOptions = {
                'portConstraints': 'FIXED_SIDE',
                'elk.position': '(0, 0)',
            };
        };

        if (isContainer(node)) {
            const group = this.diagram.group(node.owns_group);
            if (group) {
                const children = group.nodes.map(id => this.diagram.node(id));
                elk_node.children = children.map(child => this.buildElkNode(child)).filter(child => child !== undefined) as ElkNode[];
            }
        }

        return elk_node;
    }

    protected buildElkEdge(edge: any): ElkExtendedEdge | undefined {
        const source_id = (typeof edge.from?.node === 'string') ? edge.from.node : edge.from?.node?.id;
        const sourceNode = source_id ? this.diagram.node(source_id) : undefined;

        const target_id = (typeof edge.to?.node === 'string') ? edge.to.node : edge.to?.node?.id;
        const targetNode = target_id ? this.diagram.node(target_id) : undefined;

        if (!sourceNode || !targetNode) return undefined;

        const source_port_id = source_id ? `${source_id}_${edge.from?.handle}` : undefined;
        const target_port_id = target_id ? `${target_id}_${edge.to?.handle}` : undefined;

        let routing = 'ORTHOGONAL';
        if (edge.type === 'line') {
            routing = 'ORTHOGONAL';
        } else if (edge.type === 'curve') {
            routing = 'SPLINES';
        }

        return {
            id: edge.id,
            sources: [source_port_id || ''],
            targets: [target_port_id || ''],
            layoutOptions: {
                'elk.edgeRouting': routing,
            }
        };
    }

    protected buildElkGraph(): ElkNode {
        const coordinates = this.diagram.getCoordinates();
        const nodes = this.diagram.nodes.filter(node => !isConnection(node));
        const edges = this.diagram.nodes.filter(node => isConnection(node));

        const elkNodes: ElkNode[] = nodes.map(node => {
            if (GroupBasics.nodeGroup(node)) {
                return undefined; // Skip nodes in groups, as they are handled by their container
            }
            return this.buildElkNode(node, coordinates);
        })
            .filter(node => node !== undefined) as ElkNode[];

        const elkEdges: ElkExtendedEdge[] = edges.map(edge => {
            return this.buildElkEdge(edge);
        }).filter(edge => edge !== undefined) as ElkExtendedEdge[];

        const graph: ElkNode = {
            id: 'root',
            children: elkNodes,
            edges: elkEdges,
        };

        return graph;
    }

    protected applyElkGraph(layout: ElkNode): INode[] {
        // Build lookup maps
        const nodeMap = new Map(layout.children!.map(n => [n.id, n]));
        const edgeMap = new Map(layout.edges!.map(e => [e.id, e]));

        const planned: INode[] = [];

        for (const node of this.diagram.nodes.filter(node => !isConnection(node))) {
            if (NodeRegistry.adapter(node.type)?.is_connector) continue;
            // if (['line', 'orthogonal', 'polyline', 'curve'].includes(node.type)) continue;

            const elkNode = nodeMap.get(node.id);
            if (!elkNode) continue;

            const clone = {
                ...node,
                points: [
                    { x: elkNode.x!, y: elkNode.y! },
                    { x: elkNode.x! + elkNode.width!, y: elkNode.y! + elkNode.height! }
                ]
            }
            planned.push(clone);
        }

        for (const edge of this.diagram.nodes.filter(node => isConnection(node))) {
            const elkEdge = edgeMap.get(edge.id);
            if (!elkEdge) continue;

            const clone = {
                ...edge,
                points: [] as IPoint[],
                // points: elkEdge.sections?.flatMap(section => section.bendPoints?.map(bp => ({ x: bp.x, y: bp.y })) || []) || []
            }
            for (const segment of elkEdge.sections || []) {
                if (segment.startPoint) {
                    clone.points.push({ x: segment.startPoint.x, y: segment.startPoint.y });
                }
                for (const bp of segment.bendPoints || []) {
                    clone.points.push({ x: bp.x, y: bp.y });
                }
                if (segment.endPoint) {
                    clone.points.push({ x: segment.endPoint.x, y: segment.endPoint.y });
                }
            }
            planned.push(clone);
        }
        return planned;
    }

    // /**
    //  * Applies the calculated viewport settings (zoom and pan) to the diagram based on the provided bounds.
    //  * This method applies a transform to the diagram's canvas and coordinate system.
    //  * @param bounds The bounding rectangle of the content to fit.
    //  * @param zoom The zoom level to apply.
    //  * @param padding The padding to apply around the content.
    //  * @param alignment The alignment options for fitting the content.
    //  */
    // protected applyViewportForBounds(bounds: IRect, zoom: number, padding: number, alignment?: FitAlign): void {
    //     const canvas = this.diagram.getCanvas();
    // const coordinates = this.diagram.getCoordinates();
    // const pixelRatio = coordinates.pixelRatio || 1;
    // const horizontal = alignment?.horizontal || 'center';
    // const vertical = alignment?.vertical || 'center';

    // const contentWidth = bounds.width * zoom;
    // const contentHeight = bounds.height * zoom;
    // const viewportWidth = canvas.width / pixelRatio;
    // const viewportHeight = canvas.height / pixelRatio;
    // const offsetX = this.getHorizontalOffset(viewportWidth, contentWidth, padding, horizontal);
    // const offsetY = this.getVerticalOffset(viewportHeight, contentHeight, padding, vertical);

    // this.diagram.animateViewport({
    //     zoom: zoom,
    //     pan: {
    //         x: bounds.left * zoom - offsetX,
    //         y: bounds.top * zoom - offsetY,
    //     }
    // });
    // }

    // /**
    //  * Clamps the zoom value to the allowed range defined by `minZoom` and `maxZoom`.
    //  * @param value The zoom value to clamp.
    //  * @returns The clamped zoom value.
    //  */
    // public clampZoom(value: number): number {
    //     return Math.min(this.maxZoom, Math.max(this.minZoom, value || 1));
    // }

    // private getHorizontalOffset(viewportWidth: number, contentWidth: number, padding: number, alignment: HorizontalAlign): number {
    //     switch (alignment) {
    //         case 'left':
    //             return padding;
    //         case 'right':
    //             return viewportWidth - padding - contentWidth;
    //         default:
    //             return (viewportWidth - contentWidth) / 2;
    //     }
    // }

    // private getVerticalOffset(viewportHeight: number, contentHeight: number, padding: number, alignment: VerticalAlign): number {
    //     switch (alignment) {
    //         case 'top':
    //             return padding;
    //         case 'bottom':
    //             return viewportHeight - padding - contentHeight;
    //         default:
    //             return (viewportHeight - contentHeight) / 2;
    //     }
    // }

}
