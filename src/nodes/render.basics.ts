import type { INode } from "../interfaces";
import type { IPoint, IRect } from "../types";
import { isDiagramViewLike } from "../guards";
import type { INodeCached } from "../view/view.cache";
import type { TextOverflowMode } from "../factory/node.adapter";
import { fillStyle, imageMode, imageId, lineWidth, nodeFontFace, nodeFontSize, shadowStyle, strokeStyle, textAlign, textBaseline, textColor } from "../value.utils";
import { DiagramConstants } from "../model/diagram.constants";
import { NodeBasics } from "./node.basics";

export interface TextOptions {
    overflow: TextOverflowMode;
    path?: Path2D;
    from?: IPoint,
    to?: IPoint,
}

/**
 * Provides basic rendering utilities for diagram nodes, including preparation of the canvas context for drawing nodes and their text.
 * It handles setting up styles, shadows, and transformations based on node properties such as angle and transparency.
 * The class also includes logic for rendering multi-line text within nodes, taking into account text alignment and baseline settings.
 */
export class RenderBasics {

    /**
     * Prepares the canvas context for rendering a node, including setting styles, shadows, and transformations.
     * @param node The node to prepare for rendering.
     * @param context The canvas rendering context.
     */
    public static prepare(node: INode, context: CanvasRenderingContext2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        this.ensureImage(node, cached);

        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = lineWidth(node);
        context.strokeStyle = strokeStyle(node);
        context.fillStyle = fillStyle(node);
        if (cached.img && imageMode(node) == 'pattern') {
            context.fillStyle = context.createPattern(cached.img, 'repeat') || '';
        }
        const shadow = shadowStyle(node);
        context.shadowColor = this.resolveShadowColor(node);
        context.shadowOffsetX = shadow.offset.x;
        context.shadowOffsetY = shadow.offset.y;
        context.shadowBlur = shadow.blur;

        // if (node.shadowStyle) {
        //     context.shadowColor = this.resolveShadowColor(node);
        //     context.shadowOffsetX = node.shadowStyle.offset.x;
        //     context.shadowOffsetY = node.shadowStyle.offset.y;
        //     context.shadowBlur = node.shadowStyle.blur;
        // } else {
        //     context.shadowColor = 'transparent';
        //     context.shadowOffsetX = 0;
        //     context.shadowOffsetY = 0;
        //     context.shadowBlur = 0;
        // }

        // Transparent shapes (hot spots) should not viewable in 'view' mode..
        if (node.transparent) {
            if (diagram.render_mode == 'view') {
                context.strokeStyle = 'transparent';
                context.fillStyle = 'transparent';
            } else if (diagram.render_mode == 'edit') {
                context.lineWidth = 1;
                context.setLineDash([4, 4]);
            }
        }

        if (node.angle) {
            let rect = coordinates.getBoundingRect(node);
            let center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            }
            context.translate(center.x, center.y);
            context.rotate(node.angle);
            context.translate(-center.x, -center.y);

            // let rect = this.getRect();
            // let center = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}
            // context.transform(
            //     this.cos, this.sin,
            //     -this.cos, this.sin,
            //     center.x, center.y
            // )
            // context.transform(1,0,0,1, -center.x, -center.y);
        }
    }

    private static ensureImage(node: INode, cached: INodeCached): void {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const cache = diagram.getCache();
        const resolver = diagram as unknown as { resolveNodeImageSource?: (node: INode) => string | undefined };
        let imageSource: string | undefined;
        if (typeof resolver.resolveNodeImageSource === 'function') {
            try {
                imageSource = resolver.resolveNodeImageSource(node);
            } catch {
                // Some test doubles use DiagramView prototype without full Diagram initialization.
                imageSource = imageId(node);
            }
        } else {
            imageSource = imageId(node);
        }

        if (!imageSource || imageMode(node) == 'none') {
            if (cached.img || cached.image_loading) {
                cached.img = undefined;
                cached.pattern = undefined;
                cached.image_loading = false;
                cache.setNode(node, cached);
            }
            return;
        }

        if (cached.img?.src === imageSource && (cached.img || cached.image_loading)) {
            return;
        }

        if (typeof Image === 'undefined') {
            return;
        }

        const img = new Image();
        cached.img = img;
        cached.pattern = undefined;
        cached.image_loading = true;
        cache.setNode(node, cached);
        img.onload = () => {
            cached.img = img;
            cached.pattern = undefined;
            cached.image_loading = false;
            cache.setNode(node, cached);
            const view = diagram as unknown as { render?: () => void };
            if (typeof view.render === 'function') {
                view.render();
            }
        };
        img.onerror = () => {
            cached.img = undefined;
            cached.pattern = undefined;
            cached.image_loading = false;
            cache.setNode(node, cached);
        };
        img.src = imageSource;
    }

    /**
     * Skips shadow for subsequent draw calls on the context.
     * Call this after fill and before stroke when shadow should not apply to the stroke.
     */
    public static skipShadow(context: CanvasRenderingContext2D): void {
        context.shadowColor = 'transparent';
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 0;
    }

    /**
     * Prepares the canvas context for rendering node handles, including setting styles and transformations based on node properties.
     * @param node The node for which to prepare handles.
     * @param context The canvas rendering context.
     */
    public static prepareHandles(node: INode, context: CanvasRenderingContext2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();

        context.lineWidth = 1;
        context.strokeStyle = DiagramConstants.SELECTION_ANCHOR_STROKESTYLE;
        context.fillStyle = DiagramConstants.SELECTION_ANCHOR_FILLSTYLE;

        context.shadowColor = 'transparent';

        if (node.angle) {
            let rect = coordinates.getBoundingRect(node);
            let center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            context.translate(center.x, center.y);
            context.rotate(node.angle);
            context.translate(-center.x, -center.y);

            // context.transform(
            //     this.cos, this.sin,
            //     -this.cos, this.sin,
            //     center.x, center.y
            // )
            // context.transform(1,0,0,1, -center.x, -center.y);
        }
    }

    /**
     * Renders the text for a node, taking into account text alignment, overflow, and clipping options.
     * Text options can define 2 points: from and to - if provided, the text is rendered on the slope between them.
     * 
     * N.B. After rendering the text path is cached for hit-testing.
     *  
     * @param node The node for which to render text.
     * @param context The canvas rendering context.
     * @param options Options for text rendering, including overflow and clipping path.
     */
    public static renderText(node: INode, context: CanvasRenderingContext2D, options: TextOptions): void {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        if (options.from || options.to) {
            // Sloped line betyween 2 points

            let rect: IRect, from: IPoint, to: IPoint;
            if (options.from && options.to) {
                from = options.from;
                to = options.to;
            } else {
                rect = coordinates.getBoundingRect(node);
                from = { x: rect.left, y: rect.top };
                to = { x: rect.left + rect.width, y: rect.top + rect.height };
            }
            // Render and cache text-path from the same geometry pass.
            cached.text_path = this.renderLineSloped(node, context, from, to);
            if (typeof (cache as { setNode?: unknown }).setNode === 'function') {
                cache.setNode(node, cached);
            }
            // context.stroke(cached.text_path!);      // DEBUGGING
            return;
        }

        if (node.points.length > 1) {
            let rect = coordinates.getBoundingRect(node);
            let textPath: Path2D | undefined;

            if (options.overflow == 'hidden' && options.path) {
                context.save();
                context.clip(options.path);
                textPath = this.renderLines(node, context, rect);
                context.restore();

            } else if (options.overflow == 'hidden') {
                context.save();
                context.beginPath();
                context.rect(rect.left, rect.top, rect.width, rect.height);
                context.clip();
                textPath = this.renderLines(node, context, rect);
                context.restore();

            } else if (options.overflow == 'visible') {
                textPath = this.renderLines(node, context, rect);
            }

            cached.text_path = textPath;
            if (typeof (cache as { setNode?: unknown }).setNode === 'function') {
                cache.setNode(node, cached);
            }
        }
    }

    /**
     * Render text over multiple horizontal lines, taking into account text alignment and baseline settings. 
     * Returns a Path2D representing the hit area for the text (that can be used for hit testing).
     * @param node The node for which to render the text.
     * @param context The canvas rendering context.
     * @param from The starting point of the sloped line.
     * @param to The ending point of the sloped line.
     * @returns A Path2D representing the hit area for the text.
     */
    private static renderLines(node: INode, context: CanvasRenderingContext2D, rect: IRect): Path2D | undefined {
        if (!context) return undefined;

        const { lines, lineHeight, startline, textRect } = this.getTextLayout(node, context, rect);
        const path = new Path2D();
        const padding = DiagramConstants.HANDLE_HIT_EPSILON;
        const align = textAlign(node);
        const baseline = textBaseline(node);

        for (let i = 0; i < lines.length; i++) {
            let x = textRect.left;
            let y = startline + (i * lineHeight);
            switch (align) {
                case 'left':
                    context.fillText(lines[i]!, x, y);
                    break;
                case 'center':
                    context.fillText(lines[i]!, x + textRect.width / 2, y);
                    break;
                case 'right':
                    context.fillText(lines[i]!, x + textRect.width, y);
                    break;
            }

            // Now add padding to calculate the hit text path and collect all lines into a path.

            const line = lines[i] || '';
            const width = context.measureText(line).width;

            let left = textRect.left;
            switch (align) {
                case 'left':
                    left = textRect.left;
                    break;
                case 'center':
                    left = textRect.left + (textRect.width - width) / 2;
                    break;
                case 'right':
                    left = textRect.left + textRect.width - width;
                    break;
            }

            let top = y;
            switch (baseline) {
                case 'top':
                    top = y;
                    break;
                case 'middle':
                    top = y - lineHeight / 2;
                    break;
                case 'bottom':
                    top = y - lineHeight;
                    break;
            }

            path.rect(
                left - padding,
                top - padding,
                Math.max(width + padding * 2, padding * 2),
                lineHeight + padding * 2,
            );
        }

        // Finally return the text hit path
        return path;
    }

    /**
     * Render text along a sloped line defined by two points, taking into account text alignment and baseline settings. 
     * Returns a Path2D representing the hit area for the text (that can be used for hit testing).
     * @param node The node for which to render the text.
     * @param context The canvas rendering context.
     * @param from The starting point of the sloped line.
     * @param to The ending point of the sloped line.
     * @returns A Path2D representing the hit area for the text.
     */
    private static renderLineSloped(node: INode, context: CanvasRenderingContext2D, from: IPoint, to: IPoint): Path2D | undefined {
        if (!context) return;

        ({ from, to } = NodeBasics.normalizeLine(from, to));

        const angle = NodeBasics.calculateAngle(from, to);

        const { lines, lineHeight, startline } = this.getTextLayoutSloped(node, context, from, to);

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const epsilon = 4;

        const line = lines[0] || '';
        const width = context.measureText(line).width;
        const y = startline - epsilon;

        let x = from.x;
        switch (textAlign(node)) {
            case 'left':
                x = from.x;
                break;
            case 'center':
                x = from.x + (to.x - from.x - width) / 2;
                break;
            case 'right':
                x = to.x - width;
                break;
        }

        context.save();
        context.translate(midX, midY);
        context.rotate(angle);
        context.translate(-midX, -midY);
        context.textAlign = 'left';
        context.textBaseline = 'bottom';
        context.fillText(line, x, y);
        context.restore();

        // Now add padding to calculate the hit text path and return it.

        const padding = DiagramConstants.HANDLE_HIT_EPSILON;
        const boxLeft = x - padding;
        const boxTop = y - lineHeight - padding;
        const boxWidth = Math.max(width + padding * 2, padding * 2);
        const boxHeight = lineHeight + padding * 2;

        const rotatePoint = (px: number, py: number): IPoint => {
            const dx = px - midX;
            const dy = py - midY;
            return {
                x: midX + (dx * Math.cos(angle)) - (dy * Math.sin(angle)),
                y: midY + (dx * Math.sin(angle)) + (dy * Math.cos(angle)),
            };
        };

        const p1 = rotatePoint(boxLeft, boxTop);
        const p2 = rotatePoint(boxLeft + boxWidth, boxTop);
        const p3 = rotatePoint(boxLeft + boxWidth, boxTop + boxHeight);
        const p4 = rotatePoint(boxLeft, boxTop + boxHeight);

        const path = new Path2D();
        path.moveTo(p1.x, p1.y);
        path.lineTo(p2.x, p2.y);
        path.lineTo(p3.x, p3.y);
        path.lineTo(p4.x, p4.y);
        path.closePath();

        return path;
    }

    /**
     * Calculate the text layout for a node within a given rectangle, returning the lines of text, line height, and starting line position.
     * @param node The node for which to calculate the text layout.
     * @param context The canvas rendering context.
     * @param rect The rectangle within which to layout the text.
     * @returns An object containing the lines of text, line height, and starting line position.
     */
    private static getTextLayout(node: INode, context: CanvasRenderingContext2D, rect: IRect) {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) {
            return { lines: [], lineHeight: 0, startline: 0, textRect: rect };
        }

        if (!node.text?.length) {
            return { lines: [], lineHeight: 0, startline: 0, textRect: rect };
        }

        // Text should remain legible against the node fill and should not inherit shape shadows.
        context.shadowColor = 'transparent';
        context.fillStyle = node.transparent && diagram.render_mode == 'view'
            ? 'transparent'
            : textColor(node);

        context.textAlign = textAlign(node);
        context.textBaseline = textBaseline(node);

        context.font = `${nodeFontSize(node)}px ${nodeFontFace(node)}`;

        let fparts = context.font.split('px');
        let fontSize = (fparts.length > 0) ? +(fparts[0]!.trim()) || DiagramConstants.DEFAULT_NODE_FONT_SIZE : DiagramConstants.DEFAULT_NODE_FONT_SIZE;
        let lineHeight = (fontSize * 1.25);
        const textPadding = Math.max(DiagramConstants.DEFAULT_TEXT_PADDING, lineWidth(node));
        const textRect = {
            left: rect.left + textPadding,
            top: rect.top + textPadding,
            width: Math.max(1, rect.width - (textPadding * 2)),
            height: Math.max(lineHeight, rect.height - (textPadding * 2)),
        };
        let lines = this.getLines(node.text, textRect.width, context);
        let startline = 0;

        const baseline = textBaseline(node);
        switch (baseline) {
            case 'top':
                startline = textRect.top + (fontSize / 2);
                break;
            case 'middle':
                startline = textRect.top + (fontSize / 4) + (textRect.height / 2) - (lineHeight * (lines.length - 1) / 2);
                break;
            case 'bottom':
                startline = textRect.top + textRect.height - (lineHeight * (lines.length - 1));
                break;
        }

        return { lines, lineHeight, startline, textRect };
    }

    /**
     * Calculate the text layout for a sloped line between two points, returning the lines of text, line height, and starting line position.
     * @param node The node for which to calculate the text layout.
     * @param context The canvas rendering context.
     * @param from The starting point of the sloped line.
     * @param to The ending point of the sloped line.
     * @returns An object containing the lines of text, line height, and starting line position.
     */
    private static getTextLayoutSloped(node: INode, context: CanvasRenderingContext2D, from: IPoint, to: IPoint) {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) {
            return { lines: [], lineHeight: 0, startline: 0 };
        }

        if (!node.text?.length) {
            return { lines: [], lineHeight: 0, startline: 0 };
        }

        const width = NodeBasics.calculateLength(from, to);

        // Text should remain legible against the node fill and should not inherit shape shadows.
        context.shadowColor = 'transparent';
        context.fillStyle = node.transparent && diagram.render_mode == 'view'
            ? 'transparent'
            : textColor(node);

        context.textAlign = textAlign(node);
        // context.textBaseline = textBaseline(node);

        context.font = `${nodeFontSize(node)}px ${nodeFontFace(node)} `;

        let fparts = context.font.split('px');
        let fontSize = (fparts.length > 0) ? +(fparts[0]!.trim()) || DiagramConstants.DEFAULT_NODE_FONT_SIZE : DiagramConstants.DEFAULT_NODE_FONT_SIZE;
        let lineHeight = (fontSize * 1.25);
        let lines = this.getLines(node.text, width, context);
        let startline = 0;

        // const baseline = textBaseline(node);
        // switch (baseline) {
        //     case 'top':
        //         startline = from.y + (fontSize / 2);
        //         break;
        //     case 'middle':
        //         startline = from.y + (fontSize / 4) + ((to.y - from.y) / 2) - (lineHeight * (lines.length - 1) / 2);
        //         break;
        //     case 'bottom':
        //         startline = to.y - (fontSize / 2);
        //         break;
        // }
        startline = from.y + (fontSize / 4) + ((to.y - from.y) / 2) - (lineHeight * (lines.length - 1) / 2);

        return { lines, lineHeight, startline };
    }

    private static getLines(text: string, maxWidth: number, context: CanvasRenderingContext2D): string[] {
        let textlines = text.split('\n');
        let lines: string[] = [];

        for (let src of textlines) {
            const words = src.split(" ");
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                let word = words[i];
                const width = context.measureText(currentLine + " " + word).width;
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine!);
                    currentLine = word;
                }
            }
            lines.push(currentLine!);
        }
        return lines;
    }

    private static resolveShadowColor(node: INode): string {
        const explicit = (node.shadowStyle?.color ?? '').trim();
        if (explicit) {
            return explicit;
        }
        // No explicit color: derive from node visual colors.
        if (node.transparent) return 'transparent';
        if (node.strokeStyle) return this.toAlphaColor(node.strokeStyle, 0.35);
        if (node.fillStyle) return this.toAlphaColor(node.fillStyle, 0.35);
        return 'rgba(0, 0, 0, 0.35)';
    }

    private static toAlphaColor(color: string, alpha: number): string {
        const a = Math.max(0, Math.min(1, alpha));

        const hex = color.trim();
        const hexMatch = /^#([a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.exec(hex);
        if (hexMatch) {
            const value = hexMatch[1]!;
            const expand = (part: string) => (part.length === 1 ? part + part : part);

            if (value.length === 3 || value.length === 4) {
                const r = parseInt(expand(value.slice(0, 1)), 16);
                const g = parseInt(expand(value.slice(1, 2)), 16);
                const b = parseInt(expand(value.slice(2, 3)), 16);
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            }

            const r = parseInt(value.slice(0, 2), 16);
            const g = parseInt(value.slice(2, 4), 16);
            const b = parseInt(value.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }

        const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/i.exec(color.trim());
        if (rgbMatch) {
            const r = Math.max(0, Math.min(255, Number(rgbMatch[1])));
            const g = Math.max(0, Math.min(255, Number(rgbMatch[2])));
            const b = Math.max(0, Math.min(255, Number(rgbMatch[3])));
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }

        return 'rgba(0, 0, 0, 0.35)';
    }

}