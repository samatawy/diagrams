// import { isDiagramViewLike } from "../../guards";
// import type { INode } from "../../interfaces";
// import { isHollow } from "../../value.utils";
// import type { INodeCached } from "../../view/view.cache";
// import { RectangleAdapter } from "../rectangle/rectangle.adapter";
// import { RenderBasics } from "../render.basics";

// export class Table2Adapter extends RectangleAdapter {

//     public static TYPE = 'table';

//     public override render(node: INode, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {

//         if (!context) return;
//         const diagram = node.owner;
//         if (!isDiagramViewLike(diagram)) return;

//         const coordinates = diagram.getCoordinates();
//         const cache = diagram.getCache();
//         const cached = cache.getNode(node) || {} as INodeCached;

//         if (node.points.length > 1) {
//             let rect = coordinates.getBoundingRect(node);

//             context.save();
//             RenderBasics.prepare(node, context, show);

//             const path = new Path2D();
//             path.rect(rect.left, rect.top, rect.width, rect.height);

//             context.fill(path);
//             RenderBasics.renderImage(node, context, rect, path);

//             if (!isHollow(node)) {
//                 RenderBasics.skipShadow(context);
//             }
//             context.stroke(path);

//             if (node.text && show !== 'quick') {
//                 if (node.specific?.rows && node.specific?.columns) {
//                     node.textStyle = node.textStyle || {};
//                     node.textStyle.baseline = 'top';
//                     node.textStyle.orientation = 'horizontal';
//                     node.textStyle.size = Math.max(Math.min(node.textStyle.size || 0, 12), 8);
//                 }
//                 RenderBasics.renderText(node, context, { overflow: this.text_overflow, path });
//             }

//             if (node.specific && node.specific?.rows && node.specific?.columns) {
//                 const top_padding = (node.textStyle?.size || 12) * 1.4 + 4; /* 1.4; */
//                 const table_height = rect.height - top_padding;

//                 const inner = new Path2D();
//                 for (let r = 0; r < +node.specific.rows; r++) {
//                     const y = rect.top + top_padding + (r * table_height / +node.specific.rows);
//                     inner.moveTo(rect.left, y);
//                     inner.lineTo(rect.left + rect.width, y);
//                 }
//                 for (let c = 0; c < +node.specific.columns; c++) {
//                     const x = rect.left + (c * rect.width / +node.specific.columns);
//                     inner.moveTo(x, rect.top + top_padding);
//                     inner.lineTo(x, rect.top + top_padding + table_height);
//                 }
//                 context.stroke(inner);
//             }

//             cached.path = path;
//             cache.setNode(node, cached);

//             context.restore();
//         }
//     }

//     public onCreateDraft(tool: string): Partial<INode> | undefined {
//         return {
//             type: this.type,
//             points: [{ x: 0, y: 0 }, { x: 104, y: 104 }],
//             text: 'Table',
//             specific: {
//                 rows: 2,
//                 columns: 2,
//             },
//         }
//     }
// }