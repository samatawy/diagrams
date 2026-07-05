import type { INode } from "../../interfaces";
import type { IRect } from "../../types";

const THROW_FILL_STYLE = 'lightgray';
export const EVENT_FILL_STYLE = 'white';
export const GATEWAY_FILL_STYLE = 'white';
export const TASK_FILL_STYLE = 'white';
export const DATA_FILL_STYLE = 'white';

export class C4Basics {

    /**
     * Renders an ">_" inside the node for backend C4 container.
     * Assumes the context is already prepared and the node is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderBackend(rect: IRect, radius: number, context: CanvasRenderingContext2D, node: INode, show?: 'all' | 'quick'): void {

        context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the cross

        const codePath = new Path2D();
        const codeSize = 16;
        const padding_top = 16;
        const padding_left = radius / 2;

        codePath.moveTo(rect.left + padding_left, rect.top + padding_top);
        codePath.lineTo(rect.left + padding_left + codeSize, rect.top + padding_top + codeSize / 2);
        codePath.lineTo(rect.left + padding_left, rect.top + padding_top + codeSize);

        codePath.moveTo(rect.left + padding_left + codeSize + 2, rect.top + padding_top + codeSize);
        codePath.lineTo(rect.left + padding_left + codeSize + 2 + codeSize, rect.top + padding_top + codeSize);

        context.stroke(codePath);
    }

    /**
     * Renders a browser header (3 round buttons and a header)inside the node for C4 UI container.
     * Assumes the context is already prepared and the node is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderUI(rect: IRect, radius: number, context: CanvasRenderingContext2D, node: INode, show?: 'all' | 'quick'): void {

        context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the ring

        const headerPath = new Path2D();
        const ht = 8; // Height of the header controls
        const padding_top = ht;
        const padding_left = radius / 2;

        // headerPath.rect(rect.left, rect.top, rect.width, ht);
        let x = rect.left + padding_left;
        headerPath.arc(
            x + ht,
            rect.top + padding_top + ht / 2,
            ht / 2,
            0, 2 * Math.PI); // Left button

        x += ht + 4;
        headerPath.arc(
            x + ht,
            rect.top + padding_top + ht / 2,
            ht / 2,
            0, 2 * Math.PI); // Middle button

        x += ht + 4;
        headerPath.arc(
            x + ht,
            rect.top + padding_top + ht / 2,
            ht / 2,
            0, 2 * Math.PI); // Right button

        x += ht + 4;
        headerPath.roundRect(
            x + 4,
            rect.top + padding_top,
            rect.width - (x - rect.left) - padding_left - ht,
            ht,
            4); // Rounded corners for the header

        context.fillStyle = context.strokeStyle; // Use the current stroke style for filling
        context.fill(headerPath);
        // context.stroke(headerPath);
    }

    /**
     * Renders a folder shape for static C4 containers.
     * Assumes the context is already prepared and the bounding rectangle is provided.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Optional parameter to control rendering detail ('all' | 'quick').
     */
    public static renderFolder(rect: IRect, radius: number, context: CanvasRenderingContext2D, node: INode, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Reduce line width for the diamond

        const folderPath = new Path2D();
        const ht = 8; // Height of the folder tab
        const padding_top = ht;
        const padding_left = radius / 2;

        folderPath.moveTo(rect.left, rect.top + padding_top + ht);
        folderPath.lineTo(rect.left + padding_left, rect.top + padding_top + ht);
        folderPath.lineTo(rect.left + padding_left + ht / 2, rect.top + padding_top);
        folderPath.lineTo(rect.left + rect.width / 3, rect.top + padding_top);
        folderPath.lineTo(rect.left + rect.width / 3 + ht / 2, rect.top + padding_top + ht);
        folderPath.lineTo(rect.left + rect.width, rect.top + padding_top + ht);

        context.stroke(folderPath);
    }

}