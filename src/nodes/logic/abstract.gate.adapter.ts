import type { IConnection, IConnectionAnchor, IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IPoint, type IRect } from "../../types";
import { isDiagramViewLike } from "../../guards";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "../rectangle/rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { isHollow } from "../../value.utils";
import { NodeRegistry } from "../../factory";

/**
 * AbstractGateAdapter is a node adapter responsible for rendering generic logic gate nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling gate shapes and hit testing.
 * Registers with the NodeRegistry under the appropriate gate name.
 */
export abstract class AbstractGateAdapter extends RectangleAdapter {

    has_text = false;
    min_width = 24;
    min_height = 24;

    connection_handles: NodeHandle[] = [NodeHandle.E, NodeHandle.W];

    protected input_handles: NodeHandle[] = [NodeHandle.W];
    protected output_handles: NodeHandle[] = [NodeHandle.E];

    protected aspect_ratio = 1;

    public getAnchors(node: INode, show: AnchorScope, direction?: 'from' | 'to' | 'any'): IHandlePoint[] {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return [];
        const coordinates = diagram.getCoordinates();
        const rect = coordinates.getBoundingRect(node);

        const anchors: IHandlePoint[] = [];

        const handles = (show === 'all_handles' || show === 'selection_handles') ? [
            NodeHandle.N, NodeHandle.S, NodeHandle.E, NodeHandle.W,
            NodeHandle.NE, NodeHandle.NW, NodeHandle.SE, NodeHandle.SW
        ] : this.connection_handles;

        for (const handle of handles) {
            switch (handle) {
                // case NodeHandle.N:
                //     anchors.push({ handle, point: { x: rect.left + rect.width / 2, y: rect.top } });
                //     break;
                // case NodeHandle.S:
                //     anchors.push({ handle, point: { x: rect.left + rect.width / 2, y: rect.top + rect.height } });
                //     break;
                // case NodeHandle.E:
                //     anchors.push({ handle, point: { x: rect.left + rect.width, y: rect.top + rect.height / 2 } });
                //     break;
                // case NodeHandle.W:
                //     anchors.push({ handle, point: { x: rect.left, y: rect.top + rect.height / 2 } });
                //     break;
                case NodeHandle.NE:
                    anchors.push({ handle, point: { x: rect.left + rect.width, y: rect.top } });
                    break;
                case NodeHandle.NW:
                    anchors.push({ handle, point: { x: rect.left, y: rect.top } });
                    break;
                case NodeHandle.SE:
                    anchors.push({ handle, point: { x: rect.left + rect.width, y: rect.top + rect.height } });
                    break;
                case NodeHandle.SW:
                    anchors.push({ handle, point: { x: rect.left, y: rect.top + rect.height } });
                    break;
            }
        }

        // if (show === 'connection_handles') {
        //     return anchors.filter(anchor => this.canConnect(node, direction ?? 'any', anchor.handle, anchor.point));
        // } else {
        return anchors;
        // }
    }
    //         return super.getAnchors(node, show, direction);
    // }

    protected abstract renderGateShape(node: INode, rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): Path2D;

    public override render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            let from = { x: node.points[0]!.x, y: node.points[0]!.y }
            let to = { x: node.points[0]!.x, y: node.points[0]!.y }
            for (let pt of node.points) {
                from.x = Math.min(from.x, pt.x)
                from.y = Math.min(from.y, pt.y)
                to.x = Math.max(to.x, pt.x)
                to.y = Math.max(to.y, pt.y)
            }
            let rect: IRect = { left: from.x, top: from.y, width: to.x - from.x, height: to.y - from.y }

            /* Draw a horizontal AND logic gate, inputs on the left and output on the right */

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = this.renderGateShape(node, rect, context, show);

            context.fill(path);

            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public override canConnectTo(node: INode, handle: NodeHandle, direction: 'from' | 'to' | 'any', target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('logic')) {
            return false;
        }
        return true;
    }

    public defaultConnection(): Partial<IConnection> | null {
        return NodeRegistry.createDraft('logic_connection') as Partial<IConnection> | null;
    }

    // public override canConnect(node: INode, direction: 'from' | 'to' | 'any', handle: NodeHandle, point: IPoint): boolean {
    //     switch (direction) {
    //         case 'from':
    //             return this.output_handles.includes(handle);
    //         case 'to':
    //             return this.input_handles.includes(handle);
    //         case 'any':
    //             return this.input_handles.includes(handle) || this.output_handles.includes(handle);
    //     }
    // }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        let width = 40, height = 40;
        if (this.aspect_ratio > 1) {
            width = height * this.aspect_ratio;
        } else if (this.aspect_ratio < 1) {
            height = width / this.aspect_ratio;
        }

        return {
            type: this.type,
            locked_aspect: true,
            points: [{ x: 0, y: 0 }, { x: width, y: height }],
            textStyle: {
                color: '#000000',
                fontFace: 'system-ui',
                size: 9,
            },
            strokeStyle: {
                color: '#000000',
                width: 1,
            },
            fillStyle: {
                color: '#FFFFFF64',
            },
        };
    }

}