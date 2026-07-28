import { NodeHandle, type IPoint, type IRect } from "../types";
import type { DiagramView } from "../view/diagram.view";
import { isConnection, isContainer } from "../guards";
import { deepClone, isLocked } from "../value.utils";
import ELK from "elkjs";
import type { ElkExtendedEdge, ElkNode, ElkPort } from "elkjs";
import { GroupBasics } from "../nodes/group.basics";
import { NodeRegistry } from "../factory/node.registry";
import type { CoordinateSystem } from "../view/coordinate.system";
import type { IContainer, IGroup, INode } from "../interfaces";

export type AutoLayoutDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type AutoLayoutMethod = 'block' | 'flow' | 'tree' | 'circuit' | 'force' | 'radial';

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
     * Automatically layout the diagram using the specified method and direction.
     * @param method The layout method to use (flow, tree, circuit, stress, radial)
     * @param direction The direction for the layout (UP, DOWN, LEFT, RIGHT)
     * @returns A promise that resolves to the array of laid out nodes
     */
    public autoLayout(method: AutoLayoutMethod, direction?: AutoLayoutDirection): Promise<INode[]> {
        switch (method) {
            case 'block':
                return this.autoLayoutBlock();
            case 'flow':
                return this.autolayoutFlow(direction ?? 'RIGHT');
            case 'tree':
                return this.autoLayoutTree(direction ?? 'DOWN');
            case "circuit":
                return this.autoCircuit();
            case "force":
                return this.autoForce();
            case "radial":
                return this.autoRadial();
            default:
                return this.autoLayoutBlock();
        }
    }

    /**
     * Automatically layout the diagram in a default flow.
     */
    public async autoLayoutBlock(): Promise<INode[]> {
        const elk = new ELK();
        const graph = this.buildElkGraph();

        graph.layoutOptions = {
            'elk.algorithm': 'layered',
            "elk.direction": "UNDEFINED",

            'elk.spacing.nodeNode': '40',
            'elk.spacing.edgeEdge': '32',
            'elk.spacing.edgeNode': '32',

            'elk.layered.spacing.nodeNodeBetweenLayers': '40',
            'elk.layered.spacing.edgeEdgeBetweenLayers': '32',
            'elk.layered.spacing.edgeNodeBetweenLayers': '32',

            'elk.edgeRouting': 'ORTHOGONAL',

            "elk.layered.edgeRouting.thoroughness": "EXPENSIVE",
            "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
            "elk.layered.crossingMinimization.semiInteractive": "true",

            "elk.hierarchyHandling": "SEPARATE_CHILDREN",
            // "elk.hierarchyHandling": "INCLUDE_CHILDREN",

            // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',

            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
            "elk.layered.cycleBreaking.strategy": "GREEDY",
            // 'elk.edgeRouting.avoidNodeOverlap': 'true',
        };

        const result = await elk.layout(graph);

        console.log('ELK Result:', result);

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

            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            'elk.edgeRouting.avoidNodeOverlap': 'true',
        };

        const result = await elk.layout(graph);

        return this.applyElkGraph(result);
    }

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
        };

        const result = await elk.layout(graph);

        return this.applyElkGraph(result);
    }

    /**
     * Automatically layout the diagram in a network.
     */
    public async autoForce(): Promise<INode[]> {
        const elk = new ELK();
        const graph = this.buildElkGraph();

        graph.layoutOptions = {
            "elk.algorithm": "force",
            "elk.force.repulsion": "1.5",
            "elk.force.gravity": "0.1",
            "elk.force.temperature": "1.5",
            "elk.force.iterations": "1000",
            "elk.force.compact": "true",

            "elk.nodeSize.constraints": "MINIMUM_SIZE",
            "elk.nodeSize.options": "CORRECT_PORT_SPACING",

            "elk.edgeRouting": "ORTHOGONAL",
            "elk.layered.edgeRouting.thoroughness": "EXPENSIVE",

            "elk.spacing.nodeNode": "64",
            'elk.spacing.edgeEdge': '32',
            'elk.spacing.edgeNode': '32',
        };

        // graph.layoutOptions = {
        //     "elk.algorithm": "stress",
        //     "elk.stress.desiredEdgeLength": "168",
        //     "elk.stress.maxIterations": "500",
        //     "elk.stress.clusterPenalty": "100",

        //     "elk.nodeSize.constraints": "MINIMUM_SIZE",
        //     "elk.nodeSize.options": "CORRECT_PORT_SPACING",
        //     "elk.stress.nodeRepulsion": "10000",

        //     "elk.edgeRouting": "ORTHOGONAL",
        //     "elk.layered.edgeRouting.thoroughness": "EXPENSIVE",

        //     "elk.spacing.nodeNode": "64",
        //     'elk.spacing.edgeEdge': '32',
        //     'elk.spacing.edgeNode': '48',

        //     "elk.aspectRatio": "1.6",
        // };

        const result = await elk.layout(graph);

        return this.applyElkGraph(result);
    }

    /**
     * Automatically layout the diagram in a radial layout.
     * N.B. Very poor results. To be evaluated before deployment.
     */
    public async autoRadial(): Promise<INode[]> {
        const elk = new ELK();
        const graph = this.buildElkGraph();

        graph.layoutOptions = {
            "elk.algorithm": "radial",
            "elk.radial.nodePlacement": "CIRCULAR",
            "elk.radial.wedge": "0.5",
            "elk.radial.centralDistance": "1",
            "elk.radial.distanceFactor": "2.0",

            "elk.edgeRouting": "ORTHOGONAL",

            "elk.spacing.nodeNode": "144",
            'elk.spacing.edgeEdge': '32',
            'elk.spacing.edgeNode': '32',
        };

        const result = await elk.layout(graph);

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

    protected buildElkNode(node: any, relative_to?: IRect, coordinates?: CoordinateSystem): ElkNode | undefined {
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

        if (relative_to) {
            // const relative_rect = coordinates.getBoundingRect(relative_to);
            // elk_node.x = rect.left - relative_rect.left;
            // elk_node.y = rect.top - relative_rect.top;

            elk_node.x = rect.left - relative_to.left;
            elk_node.y = rect.top - relative_to.top;

            // elk_node.layoutOptions = {
            //     ...elk_node.layoutOptions,
            //     'elk.noLayout': 'true',
            // }
        }

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
                elk_node.layoutOptions = {
                    ...elk_node.layoutOptions,
                    'elk.algorithm': 'fixed',
                    // 'elk.noLayout': 'true',
                    // 'elk.nodeSize.constraints': 'PORTS',
                    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
                };
                const children = group.nodes.map(id => this.diagram.node(id));
                elk_node.children = children.map(child => this.buildElkNode(child, rect, coordinates))
                    .filter(child => child !== undefined) as ElkNode[];
            }
        }

        return elk_node;
    }

    protected buildElkGroup(group: IGroup, coordinates?: CoordinateSystem): ElkNode | undefined {
        coordinates = coordinates ?? this.diagram.getCoordinates();
        const nodes = group.nodes.map(id => this.diagram.node(id))
            .filter(node => node !== undefined);

        const rect = coordinates.getBoundingRectAll(nodes);
        if (!rect) return undefined;

        const elk_group: ElkNode = {
            id: group.id,
            width: rect.width,
            height: rect.height,
            layoutOptions: {
                'elk.algorithm': 'fixed',
                'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            }
        };

        const children = group.nodes.map(id => this.diagram.node(id));
        elk_group.children = children.map(child => this.buildElkNode(child, rect, coordinates))
            .filter(child => child !== undefined) as ElkNode[];

        return elk_group;
    }

    // protected buildElkPort(node: any, handle: NodeHandle): ElkPort | undefined {
    //     if (!node) return undefined;
    //     return {
    //         id: `${node.id}_${handle}`,
    //         layoutOptions: {
    //             'portConstraints': 'FIXED_SIDE',
    //         }
    //     };
    // }

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
            routing = 'POLYLINE';
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
            return this.buildElkNode(node, undefined, coordinates);
        }).filter(node => node !== undefined) as ElkNode[];

        for (const group of this.diagram.groups) {
            const owner = this.diagram.nodes
                .filter(n => isContainer(n))
                .find(n => n.owns_group === group.id);
            if (owner) continue; // Skip groups that have an owner, as they are handled by their container

            const elkGroupNode = this.buildElkGroup(group, coordinates);
            if (elkGroupNode) elkNodes.push(elkGroupNode);
        }

        const elkEdges: ElkExtendedEdge[] = edges.map(edge => {
            return this.buildElkEdge(edge);
        }).filter(edge => edge !== undefined) as ElkExtendedEdge[];

        const graph: ElkNode = {
            id: 'root',
            children: elkNodes,
            edges: elkEdges,
        };

        console.log('ELK Graph:', graph);
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
                points: this.getNodePoints(node, elkNode),
            }
            planned.push(clone);

            if (elkNode.children && elkNode.children.length > 0) {
                for (const child of elkNode.children) {
                    const childNode = this.diagram.node(child.id);
                    if (!childNode) continue;

                    const cloneChild = {
                        ...childNode,
                        points: this.getNodePoints(childNode, child),
                    }

                    for (const pt of cloneChild.points) {
                        pt.x += elkNode.x ?? 0;
                        pt.y += elkNode.y ?? 0;
                    }

                    planned.push(cloneChild);
                }
            }
        }

        for (const group of this.diagram.groups) {
            const elkGroup = nodeMap.get(group.id);
            if (!elkGroup) continue;

            if (elkGroup.children && elkGroup.children.length > 0) {
                for (const child of elkGroup.children) {
                    const childNode = this.diagram.node(child.id);
                    if (!childNode) continue;

                    const cloneChild = {
                        ...childNode,
                        points: this.getNodePoints(childNode, child),
                    }

                    for (const pt of cloneChild.points) {
                        pt.x += elkGroup.x ?? 0;
                        pt.y += elkGroup.y ?? 0;
                    }

                    planned.push(cloneChild);
                }
            }
        }

        for (const edge of this.diagram.nodes.filter(node => isConnection(node))) {
            const elkEdge = edgeMap.get(edge.id);
            if (!elkEdge) continue;

            const clone = {
                ...edge,
                points: this.getEdgePoints(edge, elkEdge),
            }
            planned.push(clone);
        }
        return planned;
    }

    private getNodePoints(node: INode, elkNode: ElkNode): IPoint[] {
        const rect = this.diagram.getCoordinates().getBoundingRect(node);
        const relative_points = node.points.map(p => ({
            x: (p.x - rect.left) / rect.width,
            y: (p.y - rect.top) / rect.height
        }));

        const scaled_points = relative_points.map(p => ({
            x: elkNode.x! + p.x * elkNode.width!,
            y: elkNode.y! + p.y * elkNode.height!
        }));

        return scaled_points;
    }

    private getEdgePoints(edge: INode, elkEdge: ElkExtendedEdge): IPoint[] {
        const points: IPoint[] = [];
        if (!elkEdge.sections || elkEdge.sections.length === 0) {
            return deepClone(edge.points);
        }
        for (const segment of elkEdge.sections || []) {
            if (segment.startPoint) {
                points.push({ x: segment.startPoint.x, y: segment.startPoint.y });
            }
            for (const bp of segment.bendPoints || []) {
                points.push({ x: bp.x, y: bp.y });
            }
            if (segment.endPoint) {
                points.push({ x: segment.endPoint.x, y: segment.endPoint.y });
            }
        }
        return points;
    }

}
