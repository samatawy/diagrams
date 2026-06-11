import { NodeRegistry } from "../../factory/node.registry";
import type { INode } from "../../interfaces";
import { NodeHandle, type IPoint } from "../../types";
import { isDiagramViewLike } from "../../guards";
import { RectangleAdapter } from "./rectangle.adapter";
import { RenderBasics } from "../render.basics";
import type { HollowMode, TextOverflowMode } from "../../factory/node.adapter";

/**
 * TextAdapter is a node adapter responsible for rendering text nodes in the diagram. 
 * It extends the RectangleAdapter to leverage basic rectangle rendering capabilities while adding specific logic for handling text content and hit testing.
 * Registers with the NodeRegistry under the name 'text'.
 */
export class TextAdapter extends RectangleAdapter {

    public static NAME = 'text';
    protected name = TextAdapter.NAME;

    hollow_mode: HollowMode = 'always';
    text_overflow: TextOverflowMode = 'visible';

    register() {
        NodeRegistry.register(this.name, this);
    }

    hitTest(node: INode, point: IPoint) {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return NodeHandle.NONE;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node);

        const rect = coordinates.getBoundingRect(node, false);
        const cos = cached?.cos || Math.cos(node.angle);
        const sin = cached?.sin || Math.sin(node.angle);
        const hitPoint = coordinates.getHitPoint({ x: point.x, y: point.y }, rect, node.angle, cos, sin);

        if (cached?.path && coordinates.isPointInPath(cached.path, hitPoint.x, hitPoint.y)) {
            return NodeHandle.MOVE;
        }

        return super.hitTest(node, point);
    }

    render(node: INode, context: CanvasRenderingContext2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {};
        cached.path = RenderBasics.getTextHitPath(node, context);
        cache.setNode(node, cached);

        context.save();
        RenderBasics.prepare(node, context);
        RenderBasics.renderText(node, context, { overflow: this.text_overflow, path: cached.path! });
        context.restore();
    }

}
