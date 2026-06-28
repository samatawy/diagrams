import { isConnection, isConnectionNode } from "../guards";
import type { INode } from "../interfaces";
import type { Diagram } from "../model/diagram";
import { isHollow, isInvisible, lineWidth, nodeId } from "../value.utils";

export interface DiagramQualityMetrics {
    layer_count: number;
    node_count: number;
    connection_count: number;

    invisible_nodes: number;
    invisible_connections: number;
    nodes_sans_text: number;
    connections_sans_text: number;

    isolated_nodes: number;
    orphaned_connections: number;
    dangling_connections: number;

    distinct_colors: number;
    distinct_node_colors: number;
    distinct_connection_colors: number;
    distinct_fonts: number;
    distinct_assets: number;
    distinct_node_types: number;
    distinct_connection_types: number;
}

export type DiagramQualityTag = 'bland' | 'colorful' | 'simple' | 'incomplete' | 'noisy';

export class DiagramQualityService {

    public static computeQualityMetrics(diagram: Diagram): DiagramQualityMetrics {
        const visible = diagram.nodes.filter(node => !isInvisible(node));
        const nodes = visible.filter(n => !isConnection(n));
        const connections = visible.filter(n => isConnection(n));

        // const nodes = diagram.nodes.filter(n => !isConnection(n));
        // const connections = diagram.nodes.filter(n => isConnection(n));

        const invisibleNodes = diagram.nodes.filter(node => node.invisible && !isConnection(node));
        const invisibleConnections = diagram.nodes.filter(conn => conn.invisible && isConnection(conn));

        const nodesSansText = nodes.filter(node => !node.text || node.text.trim() === '');
        const connectionsSansText = connections.filter(conn => !conn.text || conn.text.trim() === '');
        const danglingConnections = connections.filter(conn => (conn.from && !conn.to) || (!conn.from && conn.to));
        const orphanedConnections = connections.filter(conn => !conn.from && !conn.to);

        const connected_ids: Set<string> = new Set();
        for (const conn of connections) {
            if (conn.from) connected_ids.add(nodeId(conn.from.node));
            if (conn.to) connected_ids.add(nodeId(conn.to.node));
        }
        const isolatedNodes = nodes.filter(node => !connected_ids.has(node.id));

        const distinctNodeColors = new Set<string>();
        const distinctConnectionColors = new Set<string>();
        const distinctColors = new Set<string>();
        const distinctFonts = new Set<string>();
        const distinctAssets = new Set<string>();
        const distinctNodeTypes = new Set<string>();
        const distinctConnectionTypes = new Set<string>();

        for (const node of nodes) {
            this.addStrokeColor(node, distinctNodeColors);
            this.addFillColor(node, distinctNodeColors);
            this.addTextColor(node, distinctNodeColors);
            this.addShadowColor(node, distinctNodeColors);

            if (node.textStyle?.fontFace) distinctFonts.add(node.textStyle.fontFace);
            if (node.image_id) distinctAssets.add(node.image_id);
        }

        for (const connection of connections) {
            this.addStrokeColor(connection, distinctConnectionColors);
            this.addFillColor(connection, distinctConnectionColors);
            this.addTextColor(connection, distinctConnectionColors);
            this.addShadowColor(connection, distinctConnectionColors);

            if (connection.textStyle?.fontFace) distinctFonts.add(connection.textStyle.fontFace);
            if (connection.image_id) distinctAssets.add(connection.image_id);
        }

        for (const color of distinctNodeColors) {
            distinctColors.add(color);
        }
        for (const color of distinctConnectionColors) {
            distinctColors.add(color);
        }

        for (const node of nodes) {
            distinctNodeTypes.add(node.type);
        }
        for (const connection of connections) {
            distinctConnectionTypes.add(connection.type);
        }

        return {
            layer_count: diagram.layers.length || 1,
            node_count: nodes.length,
            connection_count: connections.length,
            invisible_nodes: invisibleNodes.length,
            invisible_connections: invisibleConnections.length,

            nodes_sans_text: nodesSansText.length,
            connections_sans_text: connectionsSansText.length,
            isolated_nodes: isolatedNodes.length,
            dangling_connections: danglingConnections.length,
            orphaned_connections: orphanedConnections.length,

            distinct_colors: distinctColors.size,
            distinct_node_colors: distinctNodeColors.size,
            distinct_connection_colors: distinctConnectionColors.size,
            distinct_fonts: distinctFonts.size,
            distinct_assets: distinctAssets.size,
            distinct_node_types: distinctNodeTypes.size,
            distinct_connection_types: distinctConnectionTypes.size
        };
    }

    public static computeQualityTags(metrics: DiagramQualityMetrics, maxTags: number = 3): DiagramQualityTag[] {

        const nodeCount = metrics.node_count;
        const connectionCount = metrics.connection_count;
        const elementCount = nodeCount + connectionCount;
        const distinctColors = metrics.distinct_colors;
        const colorDensity = distinctColors / Math.max(1, nodeCount);

        const scores = new Map<DiagramQualityTag, number>([
            ['bland', 0],
            ['colorful', 0],
            ['simple', 0],
            ['incomplete', 0],
            ['noisy', 0],
        ]);

        // Incomplete: structural issues first.
        if (metrics.dangling_connections > 0 || metrics.orphaned_connections > 0) {
            scores.set('incomplete', (scores.get('incomplete') ?? 0) + 0.7);
        }
        if (metrics.isolated_nodes > 0) {
            scores.set('incomplete', (scores.get('incomplete') ?? 0) + 0.2);
        }
        if (connectionCount > 0) {
            const unlabeledConnections = metrics.connections_sans_text / Math.max(1, connectionCount);
            if (unlabeledConnections >= 0.5) {
                scores.set('incomplete', (scores.get('incomplete') ?? 0) + 0.2);
            }
        }
        if (nodeCount > 0) {
            const unlabeledNodes = metrics.nodes_sans_text / Math.max(1, nodeCount);
            if (unlabeledNodes >= 0.65) {
                scores.set('incomplete', (scores.get('incomplete') ?? 0) + 0.15);
            }
        }

        // Simple: low complexity and low style variety.
        if (elementCount <= 16) {
            scores.set('simple', (scores.get('simple') ?? 0) + 0.4);
        }
        if (metrics.distinct_node_types <= 3 && metrics.distinct_connection_types <= 2) {
            scores.set('simple', (scores.get('simple') ?? 0) + 0.25);
        }
        if (distinctColors <= 4 && metrics.distinct_fonts <= 2) {
            scores.set('simple', (scores.get('simple') ?? 0) + 0.2);
        }
        if (connectionCount <= Math.max(1, Math.round(nodeCount * 1.2))) {
            scores.set('simple', (scores.get('simple') ?? 0) + 0.15);
        }

        // Bland: very little visual variation (primarily useful beyond tiny diagrams).
        if (elementCount >= 6 && distinctColors <= 3) {
            scores.set('bland', (scores.get('bland') ?? 0) + 0.55);
        }
        if (metrics.distinct_fonts <= 1) {
            scores.set('bland', (scores.get('bland') ?? 0) + 0.2);
        }
        if (metrics.distinct_node_types <= 2) {
            scores.set('bland', (scores.get('bland') ?? 0) + 0.15);
        }

        // Colorful: richer, controlled color variety.
        if (distinctColors >= 6) {
            scores.set('colorful', (scores.get('colorful') ?? 0) + 0.5);
        }
        if (colorDensity >= 0.25 && colorDensity <= 1.5) {
            scores.set('colorful', (scores.get('colorful') ?? 0) + 0.25);
        } else if (colorDensity > 1.5) {
            scores.set('colorful', (scores.get('colorful') ?? 0) + 0.05);
        }
        if (metrics.distinct_fonts <= 3) {
            scores.set('colorful', (scores.get('colorful') ?? 0) + 0.1);
        }

        // Noisy: excess variation and/or dense connectivity.
        if (distinctColors >= 12) {
            scores.set('noisy', (scores.get('noisy') ?? 0) + 0.35);
        }
        if (metrics.distinct_fonts >= 4) {
            scores.set('noisy', (scores.get('noisy') ?? 0) + 0.15);
        }
        if ((metrics.distinct_node_types + metrics.distinct_connection_types) >= 10) {
            scores.set('noisy', (scores.get('noisy') ?? 0) + 0.2);
        }
        if (nodeCount >= 8 && connectionCount > (nodeCount * 1.8)) {
            scores.set('noisy', (scores.get('noisy') ?? 0) + 0.25);
        }
        if ((metrics.invisible_nodes + metrics.invisible_connections) > 0) {
            scores.set('noisy', (scores.get('noisy') ?? 0) + 0.1);
        }

        const priority: Record<DiagramQualityTag, number> = {
            incomplete: 0,
            noisy: 1,
            simple: 2,
            colorful: 3,
            bland: 4,
        };

        const threshold = 0.45;
        const tags = Array.from(scores.entries())
            .filter(([, score]) => score >= threshold)
            .sort((a, b) => {
                if (b[1] !== a[1]) {
                    return b[1] - a[1];
                }
                return priority[a[0]] - priority[b[0]];
            })
            .map(([tag]) => tag);

        return tags.slice(0, Math.max(1, maxTags));
    }

    private static addStrokeColor(node: INode, colorSet: Set<string>): void {
        if (!node.strokeStyle?.color || node.invisible || lineWidth(node) === 0) return;

        this.addColor(node.strokeStyle.color, colorSet);
    }

    private static addFillColor(node: INode, colorSet: Set<string>): void {
        if (!node.fillStyle || node.invisible || isHollow(node)) return;

        this.addColor(node.fillStyle, colorSet);
    }

    private static addTextColor(node: INode, colorSet: Set<string>): void {
        if (!node.text || node.invisible) return;

        this.addColor(node.textStyle?.color, colorSet);
    }

    private static addShadowColor(node: INode, colorSet: Set<string>): void {
        if (!node.shadowStyle || node.invisible) return;
        if (node.shadowStyle.offset.x === 0 && node.shadowStyle.offset.y === 0 && node.shadowStyle.blur === 0) return;

        this.addColor(node.shadowStyle.color, colorSet);
    }

    private static addColor(color: string | undefined, colorSet: Set<string>): void {
        if (color && color.trim() !== '' && color !== 'transparent' && color !== 'inherit') {
            colorSet.add(color);
        }
    }

    private static addFont(node: INode, fontSet: Set<string>): void {
        if (!node.text || node.invisible) return;

        if (node.textStyle?.fontFace) {
            fontSet.add(node.textStyle.fontFace);
        }
    }
}
