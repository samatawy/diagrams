import type { SpecificOptions } from "../../factory/node.adapter";
import { isDiagramViewLike } from "../../guards";
import type { INode } from "../../interfaces";
import type { IRect } from "../../types";
import { isHollow } from "../../value.utils";
import type { INodeCached } from "../../view/view.cache";
import { RoundRectangleAdapter } from "../rectangle/round.rectangle.adapter";
import { RenderBasics } from "../render.basics";
import { C4Basics } from "./C4.Basics";

type C4ContainerType = 'backend' | 'ui' | 'static' | 'default';

export class C4ContainerAdapter extends RoundRectangleAdapter {

    static readonly TYPE = 'c4_container';

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

            const radius = this.getCornerRadius(node, rect);

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            path.moveTo(rect.left, rect.top + radius);
            // NW
            path.arcTo(rect.left, rect.top, rect.left + radius, rect.top, radius);
            path.lineTo(rect.left + rect.width - radius, rect.top);
            // NE
            path.arcTo(rect.left + rect.width, rect.top, rect.left + rect.width, rect.top + radius, radius);
            path.lineTo(rect.left + rect.width, rect.top + rect.height - radius);
            // SE
            path.arcTo(rect.left + rect.width, rect.top + rect.height, rect.left + rect.width - radius, rect.top + rect.height, radius);
            path.lineTo(rect.left + radius, rect.top + rect.height);
            // SW
            path.arcTo(rect.left, rect.top + rect.height, rect.left, rect.top + rect.height - radius, radius);
            path.closePath();

            context.fill(path);
            RenderBasics.renderImage(node, context, rect, path);

            context.save();
            this.renderInternal(node, rect, radius, context, show);
            context.restore();

            if (!isHollow(node)) {
                RenderBasics.skipShadow(context);
            }
            context.stroke(path);

            if (node.text && show !== 'quick') {
                RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    protected renderInternal(node: INode, rect: IRect, radius: number, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        switch (node.specific?.c4_container_type as C4ContainerType) {
            case 'backend':
                C4Basics.renderBackend(rect, radius, context, node, show);
                break;
            case 'ui':
                C4Basics.renderUI(rect, radius, context, node, show);
                break;
            case 'static':
                C4Basics.renderFolder(rect, radius, context, node, show);
                break;
            default:
        }
    }

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_container',
            specific: {
                c4_container_type: 'none',
            },
            points: [{ x: 0, y: 0 }, { x: 104, y: 80 }],

            text: 'Container',
            fillStyle: '#438dd5',
            strokeStyle: {
                color: 'white',
                width: 2,
                dash: [],
            },
            textStyle: {
                color: 'white',
                halo: 'inherit',
                size: 12,
                fontFace: 'system-ui',
                baseline: 'bottom',
            },
        }
    }


    public specificOptions(node: INode, path: string): SpecificOptions | undefined {

        if (path === 'specific.c4_container_type' || path === 'c4_container_type') {
            return {
                label: 'Container Type',
                readonly: false,
                datatype: 'enum',
                options: {
                    backend: { label: 'Backend', value: 'backend' },
                    ui: { label: 'UI', value: 'ui' },
                    static: { label: 'Static', value: 'static' },
                    default: { label: 'Default', value: 'default' },
                },
            }
        }
    }
}
