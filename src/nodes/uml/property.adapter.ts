import type { SpecificOptions, TextOverflowMode, TextPlacement } from "../../factory";
import { isDiagramViewLike } from "../../guards";
import type { IHandlePoint, INode } from "../../interfaces";
import { NodeHandle, type AnchorScope, type IPoint, type ITextBaseline, type ITextOrientation } from "../../types";
import { nodeFontFace, nodeFontSize, textColor } from "../../value.utils";
import type { INodeCached } from "../../view/view.cache";
import { RectangleAdapter } from "../rectangle/rectangle.adapter";
import { RenderBasics } from "../render.basics";

export class UmlPropertyAdapter extends RectangleAdapter {

    public static TYPE = 'uml_property';

    can_rotate = false;
    drag_create = true;
    connection_handles = [NodeHandle.E, NodeHandle.W];
    resize_handles = [];
    single_line_text = true;
    text_overflow: TextOverflowMode = 'hidden';
    text_baselines: ITextBaseline[] = ['middle'];
    text_orientations: ITextOrientation[] = ['horizontal'];

    /**
     * Overrides the render method to skip certain elements.
     * @param node 
     * @param context 
     * @param show 
     */
    public override render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (node.points.length > 1) {
            let rect = coordinates.getBoundingRect(node);

            context.save();
            RenderBasics.prepare(node, context, show);

            const path = new Path2D();
            path.rect(rect.left, rect.top, rect.width, rect.height);
            context.fill(path);

            RenderBasics.skipShadow(context);
            context.stroke(path);

            // if (node.text && show !== 'quick') {
            //     RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
            // }

            if (show !== 'quick') {
                // Render the datatype and constraints on the right side of the field
                // const datatype = node.specific?.datatype || '';
                let scope = '';
                if (node.specific?.scope === 'public') scope = '+';
                if (node.specific?.scope === 'protected') scope = '#';
                if (node.specific?.scope === 'private') scope = '-';
                if (node.specific?.scope === 'package') scope = '~';

                const left = scope; // Only show scope for now
                const right = node.specific?.datatype ? `: ${node.specific?.datatype ?? ''}` : '';
                const font = `100 ${nodeFontSize(node)}px ${nodeFontFace(node)}`;
                const color = textColor(node);

                if (left) {
                    context.save();
                    const textX = rect.left + 4; // Padding from the left edge
                    const textY = rect.top + rect.height / 2; // Vertically centered
                    context.font = font;
                    context.fillStyle = color;
                    context.textAlign = 'left';
                    context.textBaseline = 'middle';
                    context.fillText(left, textX, textY);
                    context.restore();
                }
                if (right) {
                    context.save();
                    const textX = rect.left + rect.width - 4; // Padding from the right edge
                    const textY = rect.top + rect.height / 2; // Vertically centered
                    context.font = font;
                    context.fillStyle = color;
                    context.textAlign = 'right';
                    context.textBaseline = 'middle';
                    context.fillText(right, textX, textY);
                    context.restore();
                }

                RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
            }

            cached.path = path;
            cache.setNode(node, cached);

            context.restore();
        }
    }

    public textPlacement(node: INode): TextPlacement {
        const padding = 2; // Padding from the edges
        const char = nodeFontSize(node) * 0.6; // Approximate width of a character in pixels

        return {
            rect: {
                left: node.points[0]!.x + padding + char,
                top: node.points[0]!.y + padding,
                width: node.points[1]!.x - node.points[0]!.x - 2 * padding - 10 * char,
                height: node.points[1]!.y - node.points[0]!.y - 2 * padding,
            }
        } as TextPlacement;
    }

    public getAnchors(node: INode, show: AnchorScope, direction: 'from' | 'to' | 'any' = 'any'): IHandlePoint[] {
        const anchors: IHandlePoint[] = [];
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return anchors;
        const coordinates = diagram.getCoordinates();

        if (node.points.length > 1) {
            const rect = coordinates.getBoundingRect(node);

            // E anchor
            anchors.push({
                handle: NodeHandle.E,
                point: { x: rect.left + rect.width, y: rect.top + rect.height / 2 }
            });

            // W anchor
            anchors.push({
                handle: NodeHandle.W,
                point: { x: rect.left, y: rect.top + rect.height / 2 }
            });
        }

        if (show === 'connection_handles') {
            return anchors.filter(anchor => this.canConnectTo(node, anchor.handle, direction, undefined, anchor.point));
        } else {
            return anchors;
        }
    }

    public override canConnectTo(node: INode, handle: NodeHandle, direction: 'from' | 'to' | 'any', target?: Partial<INode>, point?: IPoint): boolean {
        if (!this.connection_handles.includes(handle)) return false;
        if (target && !target.type?.startsWith('uml')) return false;
        return node.ready === true;
    }

    specificOptions(node: INode, path: string): SpecificOptions | undefined {
        if (path === 'datatype' || path === 'specific.datatype') {
            return {
                label: 'Datatype',
                datatype: 'string',
            }
        } else if (path === 'scope' || path === 'specific.scope') {
            return {
                label: 'Scope',
                datatype: 'enum',
                options: {
                    public: { label: 'Public', value: 'public' },
                    private: { label: 'Private', value: 'private' },
                    protected: { label: 'Protected', value: 'protected' },
                    package: { label: 'Package', value: 'package' },
                }
            }
        }
        return undefined;
    }

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: this.type,
            points: [{ x: 0, y: 0 }, { x: 104, y: 16 }],
            text: 'property',
            specific: {
                datatype: 'string',
                scope: 'public',
            },
            textStyle: {
                color: '#000000',
                size: 9,
                align: 'left',
                baseline: 'middle',
            },
            strokeStyle: {
                color: '#00000020',
                width: 1,
            },
            geometry: {
                index: -1
            }
        }
    }
}