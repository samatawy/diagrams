import type { IConnection, INode } from "../interfaces";
import type { ArrowType, ImageMode, IPoint, IRect } from "../types";
import { isDiagramViewLike } from "../guards";
import type { INodeCached } from "../view/view.cache";
import type { TextOverflowMode } from "../factory/node.adapter";
import { imageMode, imageId, lineWidth, nodeFontFace, nodeFontSize, nodeOpacity, shadowStyle, strokeColor, textAlign, textBaseline, textColor, textHaloColor, isLocked, textOrientation, lineDashArray, fillColor, arrowStart, arrowEnd } from "../value.utils";
import { DiagramConstants } from "../model/diagram.constants";
import { NodeBasics } from "./node.basics";
import { NodeRegistry } from "../factory/node.registry";
import { gradientArgsForBox } from "../editor/gradient/color.utils";
import type { FillStyle } from "../style.interfaces";

export interface TextOptions {
    overflow: TextOverflowMode;
    path?: Path2D;
    from?: IPoint,
    to?: IPoint,
}

interface ImageBounds {
    fx: number;
    fy: number;
    fw: number;
    fh: number
};


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
    public static prepare(node: INode, context: CanvasRenderingContext2D, show: 'all' | 'quick' = 'all'): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;
        const coordinates = diagram.getCoordinates();
        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;

        this.ensureImage(node, cached);

        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.miterLimit = 4;
        context.globalAlpha = nodeOpacity(node);
        context.lineWidth = lineWidth(node);
        context.setLineDash(lineDashArray(node));
        context.strokeStyle = strokeColor(node);

        this.applyFillStyle(node, coordinates.getBoundingRect(node), context);
        // context.fillStyle = fillColor(node);

        if (cached.img && imageMode(node) === 'pattern') {
            context.fillStyle = context.createPattern(cached.img, 'repeat') || '';
        }

        if (show !== 'quick') {
            const shadow = shadowStyle(node);
            context.shadowColor = this.resolveShadowColor(node);
            context.shadowOffsetX = shadow.offset.x;
            context.shadowOffsetY = shadow.offset.y;
            context.shadowBlur = shadow.blur;
        }

        // Invisible shapes (hot spots) should not viewable in 'view' mode..
        if (node.invisible) {
            if (diagram.render_mode === 'view') {
                context.strokeStyle = 'transparent';
                context.fillStyle = 'transparent';
            } else if (diagram.render_mode === 'edit') {
                context.lineWidth = 1;
                // TODO: Think of a better way and include scaling.
                context.setLineDash([6, 6]);
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

        if (!imageSource || imageMode(node) === 'none') {
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
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.miterLimit = 4;
        context.strokeStyle = DiagramConstants.SELECTION_ANCHOR_STROKE_COLOR;
        context.fillStyle = DiagramConstants.SELECTION_ANCHOR_FILL_COLOR;

        context.shadowColor = 'transparent';

        if (node.angle) {
            let rect = coordinates.getBoundingRect(node);
            let center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            context.translate(center.x, center.y);
            context.rotate(node.angle);
            context.translate(-center.x, -center.y);
        }
    }

    public static renderHandle(node: INode, point: IPoint, path: Path2D, canvas: CanvasRenderingContext2D): void {
        const size = DiagramConstants.SELECTION_HANDLE_SIZE;
        if (isLocked(node)) {
            path.roundRect(point.x - size / 2, point.y - size / 2, size, size, size / 2);

            const line_offset = size * (Math.SQRT2 / 2) / 2;
            const groove = new Path2D();
            groove.moveTo(point.x - line_offset, point.y + line_offset);
            groove.lineTo(point.x + line_offset, point.y - line_offset);
            canvas.stroke(groove);
        } else {
            path.rect(point.x - size / 2, point.y - size / 2, size, size);
        }
    }

    public static renderRotateHandle(node: INode, point: IPoint, path: Path2D, canvas: CanvasRenderingContext2D): void {
        const size = DiagramConstants.SELECTION_HANDLE_SIZE;
        if (isLocked(node)) {
            path.roundRect(point.x - size / 2, point.y - size / 2, size, size, size / 2);

            const line_offset = size * (Math.SQRT2 / 2) / 2;
            const groove = new Path2D();
            groove.moveTo(point.x - line_offset, point.y + line_offset);
            groove.lineTo(point.x + line_offset, point.y - line_offset);
            canvas.stroke(groove);
        } else {
            path.roundRect(point.x - size / 2, point.y - size / 2, size, size, size / 2);
        }
    }

    /**
     * Renders the node's image onto the canvas, clipped to the given shape path.
     * Respects `image_mode`, `image_padding`, and `image_align` from the node.
     *
     * - `'fit'`     — stretches the image to fill the padded rect (ignores aspect ratio).
     * - `'contain'` — scales the image to fit inside the padded rect, preserving aspect ratio,
     *                 positioned according to `image_align` (default `'center'`).
     * - `'pattern'` — no-op; pattern fill is applied in `prepare()` via `createPattern`.
     * - `'none'`    — no-op.
     *
     * Must be called inside a `context.save()` / `context.restore()` block, after `prepare()`.
     * Pass the shape's `path` for non-rectangular shapes so the image is clipped correctly.
     *
     * @param node The node being rendered.
     * @param context The canvas rendering context.
     * @param rect The node's bounding rect in canvas coordinates.
     * @param path Optional clip path (the filled shape). When omitted the image is drawn unclipped.
     */
    public static renderImage(node: INode, context: CanvasRenderingContext2D, rect: IRect, path?: Path2D): void {
        if (!context) return;
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return;

        const cache = diagram.getCache();
        const cached = cache.getNode(node) || {} as INodeCached;
        const img = cached.img;
        if (!img) return;

        const mode: ImageMode = node.image_mode ?? 'contain';
        if (mode === 'none' || mode === 'pattern') return;

        // For cover mode use the adapter's visual rect (which may extend beyond
        // the points-derived rect for shapes like document nodes).
        const adapter = NodeRegistry.adapter(node.type);
        const coverRect = mode === 'cover' && adapter
            ? adapter.getVisualRect(node, rect)
            : rect;

        let bounds: ImageBounds | null = null;
        switch (mode) {
            case 'cover': bounds = RenderBasics.getCoverBounds(node, coverRect, img); break;
            case 'contain': bounds = RenderBasics.getContainBounds(node, rect, img); break;
            case 'fit': bounds = RenderBasics.getFitBounds(node, rect, img); break;
        }

        if (!bounds) return;
        const { fx, fy, fw, fh } = bounds;

        if (path) {
            context.save();
            context.clip(path);
            context.drawImage(img, fx, fy, fw, fh);
            context.restore();
        } else {
            context.drawImage(img, fx, fy, fw, fh);
        }
    }

    private static getFitBounds(node: INode, rect: IRect, _img: HTMLImageElement): ImageBounds | null {
        const pad = Math.max(0, node.image_padding ?? 0);
        const fw = rect.width - pad * 2;
        const fh = rect.height - pad * 2;
        if (fw <= 0 || fh <= 0) return null;
        return { fx: rect.left + pad, fy: rect.top + pad, fw, fh };
    }

    private static getContainBounds(node: INode, rect: IRect, img: HTMLImageElement): ImageBounds | null {
        const pad = Math.max(0, node.image_padding ?? 0);
        const bx = rect.left + pad, by = rect.top + pad;
        const bw = rect.width - pad * 2, bh = rect.height - pad * 2;
        if (bw <= 0 || bh <= 0) return null;

        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        let fw = bw, fh = bh;
        if (imgW > 0 && imgH > 0) {
            const imgAspect = imgW / imgH;
            if (imgAspect > bw / bh) { fw = bw; fh = bw / imgAspect; }
            else { fh = bh; fw = bh * imgAspect; }
        }

        const box = { left: bx, top: by, width: bw, height: bh };
        const { x: fx, y: fy } = RenderBasics.alignedPosition(node.image_align, box, fw, fh);
        return { fx, fy, fw, fh };
    }

    private static getCoverBounds(node: INode, rect: IRect, img: HTMLImageElement): ImageBounds | null {

        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;
        if (imgW <= 0 || imgH <= 0) return null;

        const { left: bx, top: by, width: bw, height: bh } = rect;
        const imgAspect = imgW / imgH;

        let fw: number, fh: number;
        if (imgAspect < bw / bh) { fw = bw; fh = bw / imgAspect; }
        else { fh = bh; fw = bh * imgAspect; }

        const { x: fx, y: fy } = RenderBasics.alignedPosition(node.image_align, rect, fw, fh);
        return { fx, fy, fw, fh };
    }

    /**
     * Computes the top-left position (fx, fy) to place a box of size (fw × fh)
     * inside a container of size (cw × ch) at origin (cx, cy), according to align.
     */
    private static alignedPosition(align: INode['image_align'], rect: IRect, fw: number, fh: number): IPoint {
        const { left: cx, top: cy, width: cw, height: ch } = rect;
        switch (align ?? 'center') {
            case 'top-left': return { x: cx, y: cy };
            case 'top': return { x: cx + (cw - fw) / 2, y: cy };
            case 'top-right': return { x: cx + cw - fw, y: cy };
            case 'left': return { x: cx, y: cy + (ch - fh) / 2 };
            case 'right': return { x: cx + cw - fw, y: cy + (ch - fh) / 2 };
            case 'bottom-left': return { x: cx, y: cy + ch - fh };
            case 'bottom': return { x: cx + (cw - fw) / 2, y: cy + ch - fh };
            case 'bottom-right': return { x: cx + cw - fw, y: cy + ch - fh };
            default: return { x: cx + (cw - fw) / 2, y: cy + (ch - fh) / 2 }; // center
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

        const adapter = NodeRegistry.adapter(node.type);
        if (!NodeRegistry.hasText(node.type)) {
            return; // unsupported
        }
        const placement = adapter?.textPlacement(node);
        if (!placement?.rect && !placement?.segment) {
            return; // no valid text placement
        }

        if (placement.segment) {
            options.from = options.from || placement.segment.from;
            options.to = options.to || placement.segment.to;
        }

        if (options.from || options.to) {
            // Sloped line betyween 2 points

            let rect: IRect, from: IPoint, to: IPoint;
            if (options.from && options.to) {
                from = options.from;
                to = options.to;
            } else {
                rect = placement.rect ?? coordinates.getBoundingRect(node);
                from = { x: rect.left, y: rect.top };
                to = { x: rect.left + rect.width, y: rect.top + rect.height };
            }
            // Render and cache text-path from the same geometry pass.
            cached.text_path = this.renderLineSloped(node, context, from, to);
            if (typeof (cache as { setNode?: unknown }).setNode === 'function') {
                cache.setNode(node, cached);
            }
            return;
        }

        if (node.points.length > 1) {
            let rect = placement.rect ?? coordinates.getBoundingRect(node);
            let textPath: Path2D | undefined;

            if (options.overflow === 'hidden' && options.path) {
                context.save();
                context.clip(options.path);
                textPath = this.renderLines(node, context, rect);
                context.restore();

            } else if (options.overflow === 'hidden') {
                context.save();
                context.beginPath();
                context.rect(rect.left, rect.top, rect.width, rect.height);
                context.clip();
                textPath = this.renderLines(node, context, rect);
                context.restore();

            } else if (options.overflow === 'visible') {
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
        if (textOrientation(node) === 'vertical') {
            return this.renderLinesVertical(node, context, rect);
        }

        const { lines, lineHeight, startline, textRect } = this.getTextLayout(node, context, rect);
        const path = new Path2D();
        const padding = DiagramConstants.HANDLE_HIT_EPSILON;
        const align = textAlign(node);
        const baseline = textBaseline(node);

        const preferBackgroundHalo = this.isTextPlacedOutsideNode(node, textRect);
        const haloColor = this.resolveTextHaloColor(node, preferBackgroundHalo);
        const fontSize = nodeFontSize(node) || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
        const haloWidth = Math.max(2, fontSize * 0.12);

        for (let i = 0; i < lines.length; i++) {
            let x = textRect.left;
            let y = startline + (i * lineHeight);
            // if (haloColor) {
            //     context.save();
            //     context.strokeStyle = haloColor;
            //     context.lineWidth = haloWidth * 2;
            //     context.lineJoin = 'round';
            //     context.lineCap = 'round';
            //     switch (align) {
            //         case 'left': context.strokeText(lines[i]!, x, y); break;
            //         case 'center': context.strokeText(lines[i]!, x + textRect.width / 2, y); break;
            //         case 'right': context.strokeText(lines[i]!, x + textRect.width, y); break;
            //     }
            //     context.restore();
            // }
            switch (align) {
                case 'left':
                    this.renderTextAt(lines[i]!, x, y, node, context);
                    // context.fillText(lines[i]!, x, y);
                    break;
                case 'center':
                    this.renderTextAt(lines[i]!, x + textRect.width / 2, y, node, context);
                    // context.fillText(lines[i]!, x + textRect.width / 2, y);
                    break;
                case 'right':
                    this.renderTextAt(lines[i]!, x + textRect.width, y, node, context);
                    // context.fillText(lines[i]!, x + textRect.width, y);
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
     * Render text over vertical lines by rotating the text layout space around the rect center.
     * Returns a Path2D representing the hit area for the text (that can be used for hit testing).
     */
    private static renderLinesVertical(node: INode, context: CanvasRenderingContext2D, rect: IRect): Path2D | undefined {
        if (!context) return undefined;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = -Math.PI / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const rotatePoint = (x: number, y: number): IPoint => {
            const dx = x - centerX;
            const dy = y - centerY;
            return {
                x: centerX + (dx * cos) - (dy * sin),
                y: centerY + (dx * sin) + (dy * cos),
            };
        };

        const rotatedRect: IRect = {
            left: centerX - rect.height / 2,
            top: centerY - rect.width / 2,
            width: rect.height,
            height: rect.width,
        };

        const { lines, lineHeight, startline, textRect } = this.getTextLayout(node, context, rotatedRect);
        const path = new Path2D();
        const padding = DiagramConstants.HANDLE_HIT_EPSILON;
        const align = textAlign(node);
        const baseline = textBaseline(node);

        const preferBackgroundHalo = this.isTextPlacedOutsideNode(node, rect);
        const haloColor = this.resolveTextHaloColor(node, preferBackgroundHalo);
        const fontSize = nodeFontSize(node) || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
        const haloWidth = Math.max(2, fontSize * 0.12);

        context.save();
        context.translate(centerX, centerY);
        context.rotate(angle);
        context.translate(-centerX, -centerY);

        for (let i = 0; i < lines.length; i++) {
            let x = textRect.left;
            let y = startline + (i * lineHeight);
            // if (haloColor) {
            //     context.save();
            //     context.strokeStyle = haloColor;
            //     context.lineWidth = haloWidth * 2;
            //     context.lineJoin = 'round';
            //     context.lineCap = 'round';
            //     switch (align) {
            //         case 'left': context.strokeText(lines[i]!, x, y); break;
            //         case 'center': context.strokeText(lines[i]!, x + textRect.width / 2, y); break;
            //         case 'right': context.strokeText(lines[i]!, x + textRect.width, y); break;
            //     }
            //     context.restore();
            // }
            switch (align) {
                case 'left':
                    this.renderTextAt(lines[i]!, x, y, node, context);
                    // context.fillText(lines[i]!, x, y);
                    break;
                case 'center':
                    this.renderTextAt(lines[i]!, x + textRect.width / 2, y, node, context);
                    // context.fillText(lines[i]!, x + textRect.width / 2, y);
                    break;
                case 'right':
                    this.renderTextAt(lines[i]!, x + textRect.width, y, node, context);
                    // context.fillText(lines[i]!, x + textRect.width, y);
                    break;
            }

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

            const boxLeft = left - padding;
            const boxTop = top - padding;
            const boxWidth = Math.max(width + padding * 2, padding * 2);
            const boxHeight = lineHeight + padding * 2;

            const p1 = rotatePoint(boxLeft, boxTop);
            const p2 = rotatePoint(boxLeft + boxWidth, boxTop);
            const p3 = rotatePoint(boxLeft + boxWidth, boxTop + boxHeight);
            const p4 = rotatePoint(boxLeft, boxTop + boxHeight);

            path.moveTo(p1.x, p1.y);
            path.lineTo(p2.x, p2.y);
            path.lineTo(p3.x, p3.y);
            path.lineTo(p4.x, p4.y);
            path.closePath();
        }

        context.restore();

        return path;
    }

    /**
     * Returns true when text placement is clearly outside the node's visual bounds.
     */
    private static isTextPlacedOutsideNode(node: INode, textRect: IRect): boolean {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return false;

        const coordinates = diagram.getCoordinates();
        const nodeRect = coordinates.getBoundingRect(node);
        const nodeRight = nodeRect.left + nodeRect.width;
        const nodeBottom = nodeRect.top + nodeRect.height;
        const textRight = textRect.left + textRect.width;
        const textBottom = textRect.top + textRect.height;

        return (
            textRect.left >= nodeRight
            || textRight <= nodeRect.left
            || textRect.top >= nodeBottom
            || textBottom <= nodeRect.top
        );
    }

    /**
     * Resolves halo color with an optional preference for diagram background when text is outside the node.
     */
    private static resolveTextHaloColor(node: INode, preferBackground: boolean): string {
        if (node.textStyle?.halo !== 'inherit' || !preferBackground) {
            return textHaloColor(node);
        }

        // Keep text halo "inherit" behavior but avoid invisible halo by preferring background first when text is outside.
        const bgPreferred = textHaloColor({ ...node, fillStyle: 'transparent' } as INode);
        if (bgPreferred && bgPreferred !== 'transparent') {
            return bgPreferred;
        }

        return textHaloColor(node);
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

        const { lines, lineHeight } = this.getTextLayoutSloped(node, context, from, to);

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const line = lines[0] || '';
        const width = context.measureText(line).width;
        const padding = DiagramConstants.HANDLE_HIT_EPSILON;

        if (textOrientation(node) === 'horizontal') {
            // Draw the label horizontally, centered on the segment midpoint, shifted up by half a line.
            const anchorX = midX;
            const anchorY = midY;

            context.textAlign = 'center';
            context.textBaseline = 'middle';

            this.renderTextAt(line, anchorX, anchorY, node, context);
            // const haloColorH = textHaloColor(node);
            // if (haloColorH) {
            //     const fszH = nodeFontSize(node) || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
            //     context.save();
            //     context.strokeStyle = haloColorH;
            //     context.lineWidth = Math.max(2, fszH * 0.12) * 2;
            //     context.lineJoin = 'round';
            //     context.lineCap = 'round';
            //     context.strokeText(line, anchorX, anchorY);
            //     context.restore();
            // }
            // context.fillText(line, anchorX, anchorY);

            // Axis-aligned hit box — no rotation math needed.
            const path = new Path2D();
            path.rect(
                anchorX - width / 2 - padding,
                anchorY - lineHeight / 2 - padding,
                width + padding * 2,
                lineHeight + padding * 2,
            );
            return path;
        }

        // --- path orientation (default): rotate canvas to follow the segment angle ---
        const angle = NodeBasics.calculateAngle(from, to);
        const epsilon = 4;
        const { startline } = this.getTextLayoutSloped(node, context, from, to);
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
        this.renderTextAt(line, x, y, node, context);
        // const haloColorP = textHaloColor(node);
        // if (haloColorP) {
        //     const fszP = nodeFontSize(node) || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
        //     context.strokeStyle = haloColorP;
        //     context.lineWidth = Math.max(2, fszP * 0.12) * 2;
        //     context.lineJoin = 'round';
        //     context.lineCap = 'round';
        //     context.strokeText(line, x, y);
        // }
        // context.fillText(line, x, y);
        context.restore();

        // Rotated hit box.
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

    private static renderTextAt(line: string, x: number, y: number, node: INode, context: CanvasRenderingContext2D) {
        const fszP = nodeFontSize(node) || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
        const haloColorP = textHaloColor(node);

        if (node.textStyle?.underline) {
            const length = context.measureText(line).width;
            const width = Math.max(1, fszP * 0.08);
            const offset = fszP * 0.1;
            let linestart = x;
            switch (context.textAlign) {
                case 'left': linestart = x; break;
                case 'center': linestart = x - length / 2; break;
                case 'right': linestart = x - length; break;
            }
            let baseline = y;
            switch (context.textBaseline) {
                case 'top': baseline = y + fszP; break;
                case 'middle': baseline = y + fszP / 2; break;
                case 'bottom': baseline = y; break;
            }

            context.save();
            if (haloColorP) {
                context.strokeStyle = haloColorP;
                context.lineWidth = width * 2;  // Math.max(2, fszP * 0.12) * 2;
                context.lineJoin = 'round';
                context.lineCap = 'round';
                const haloPath = new Path2D();
                haloPath.moveTo(linestart, baseline + offset);
                haloPath.lineTo(linestart + length, baseline + offset);
                context.stroke(haloPath);
            }
            const path = new Path2D();
            path.moveTo(linestart, baseline + offset);
            path.lineTo(linestart + length, baseline + offset);
            context.strokeStyle = context.fillStyle;
            context.lineWidth = width;
            context.lineCap = 'square';
            context.stroke(path);
            context.restore();
        }

        if (haloColorP) {
            context.save();
            context.strokeStyle = haloColorP;
            context.lineWidth = Math.max(2, fszP * 0.12) * 2;
            context.lineJoin = 'round';
            context.lineCap = 'round';
            context.strokeText(line, x, y);
            context.restore();
        }
        context.fillText(line, x, y);
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
        context.fillStyle = node.invisible && diagram.render_mode === 'view'
            ? 'transparent'
            : textColor(node);

        context.textAlign = textAlign(node);
        context.textBaseline = textBaseline(node);

        context.font = this.buildTextFont(node);

        const fontSize = nodeFontSize(node) || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
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
                // startline = textRect.top + (fontSize / 2);
                startline = textRect.top;
                break;
            case 'middle':
                // startline = textRect.top + (fontSize / 4) + (textRect.height / 2) - (lineHeight * (lines.length - 1) / 2);
                startline = textRect.top + (textRect.height / 2) - (lineHeight * (lines.length - 1) / 2);
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
        context.fillStyle = node.invisible && diagram.render_mode === 'view'
            ? 'transparent'
            : textColor(node);

        context.textAlign = textAlign(node);
        // context.textBaseline = textBaseline(node);

        context.font = this.buildTextFont(node);

        const fontSize = nodeFontSize(node) || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
        let lineHeight = (fontSize * 1.25);
        let lines = this.getLines(node.text, width, context);
        let startline = from.y + (fontSize / 4) + ((to.y - from.y) / 2) - (lineHeight * (lines.length - 1) / 2);

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

    private static buildTextFont(node: INode): string {
        const style = node.textStyle?.italic ? 'italic ' : '';
        const weight = this.normalizeFontWeight(node.textStyle?.weight);
        return `${style}${weight} ${nodeFontSize(node)}px ${nodeFontFace(node)}`;
    }

    private static normalizeFontWeight(weight: unknown): number {
        if (typeof weight !== 'number' || !Number.isFinite(weight)) {
            return 400;
        }

        const rounded = Math.round(weight / 100) * 100;
        return Math.min(900, Math.max(100, rounded));
    }

    private static resolveShadowColor(node: INode): string {
        const explicit = (node.shadowStyle?.color ?? '').trim();
        if (explicit && explicit !== 'inherit') {
            return explicit;
        }
        // 'inherit' or empty: derive from node visual colors.
        if (node.invisible) return 'transparent';
        if (node.strokeStyle) return this.toAlphaColor(strokeColor(node), 0.35);
        if (node.fillStyle) return this.toAlphaColor(fillColor(node), 0.35);
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

    /**
     * Renders the arrows for a connection node.
     * @param node The connection node to render arrows for.
     * @param context The canvas rendering context.
     */
    public static renderArrows(node: INode & IConnection, context: CanvasRenderingContext2D, points?: IPoint[]): void {
        points = points || node.points;
        if (points.length < 2) return;

        const start = arrowStart(node);
        if (start !== 'none') {
            this.renderArrowTyped(node, start, points[1]!, points[0]!, context);
        }
        const end = arrowEnd(node);
        if (end !== 'none') {
            this.renderArrowTyped(node, end, points[points.length - 2]!, points[points.length - 1]!, context);
        }
    }

    public static renderArrowTyped(node: INode, type: ArrowType, from: IPoint, to: IPoint, context: CanvasRenderingContext2D): void {
        switch (type) {
            case 'solid_triangle':
            case 'hollow_triangle':
                this.renderTriangleArrow(node, type, from, to, context);
                break;
            case 'solid_spear':
            case 'hollow_spear':
                this.renderSpearArrow(node, type, from, to, context);
                break;
            case 'solid_diamond':
            case 'hollow_diamond':
                this.renderDiamondArrow(node, type, from, to, context);
                break;
            case 'solid_circle':
            case 'hollow_circle':
                this.renderCircleArrow(node, type, from, to, context);
                break;
            default:
            // None or unsupported arrow type; do nothing.
        }
    }

    private static renderTriangleArrow(node: INode, type: ArrowType, from: IPoint, to: IPoint, context: CanvasRenderingContext2D): void {
        const headlen = 10;
        const angle = NodeBasics.calculateAngle(from, to);

        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(
            to.x - headlen * Math.cos(angle - Math.PI / 7),
            to.y - headlen * Math.sin(angle - Math.PI / 7),
        );
        context.lineTo(
            to.x - headlen * Math.cos(angle + Math.PI / 7),
            to.y - headlen * Math.sin(angle + Math.PI / 7),
        );
        context.lineTo(to.x, to.y);
        // context.lineTo(
        //     to.x - headlen * Math.cos(angle - Math.PI / 7),
        //     to.y - headlen * Math.sin(angle - Math.PI / 7),
        // );

        if (type === 'solid_triangle') {
            context.fillStyle = context.strokeStyle;
        } else {
            context.fillStyle = this.getHollowFillColor(node);
        }
        context.setLineDash([]);
        context.fill();
        context.stroke();
    }

    private static renderSpearArrow(node: INode, type: ArrowType, from: IPoint, to: IPoint, context: CanvasRenderingContext2D): void {
        const headlen = 10;
        const angle = NodeBasics.calculateAngle(from, to);

        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(
            to.x - headlen * Math.cos(angle - Math.PI / 7),
            to.y - headlen * Math.sin(angle - Math.PI / 7),
        );
        context.lineTo(
            to.x - headlen / 2 * Math.cos(angle),
            to.y - headlen / 2 * Math.sin(angle),
        );
        context.lineTo(
            to.x - headlen * Math.cos(angle + Math.PI / 7),
            to.y - headlen * Math.sin(angle + Math.PI / 7),
        );
        context.lineTo(to.x, to.y);

        if (type === 'solid_spear') {
            context.fillStyle = context.strokeStyle;
        } else {
            context.fillStyle = this.getHollowFillColor(node);
        }
        context.setLineDash([]);
        context.fill();
        context.stroke();
    }

    private static renderDiamondArrow(node: INode, type: ArrowType, from: IPoint, to: IPoint, context: CanvasRenderingContext2D): void {
        const headlen = 10;
        const angle = NodeBasics.calculateAngle(from, to);

        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(
            to.x - headlen * Math.cos(angle - Math.PI / 7),
            to.y - headlen * Math.sin(angle - Math.PI / 7),
        );
        context.lineTo(
            to.x - headlen * 2 * Math.cos(angle),
            to.y - headlen * 2 * Math.sin(angle),
        );
        context.lineTo(
            to.x - headlen * Math.cos(angle + Math.PI / 7),
            to.y - headlen * Math.sin(angle + Math.PI / 7),
        );
        context.lineTo(to.x, to.y);

        if (type === 'solid_diamond') {
            context.fillStyle = context.strokeStyle;
        } else {
            context.fillStyle = this.getHollowFillColor(node);
        }
        context.setLineDash([]);
        context.fill();
        context.stroke();
    }

    private static renderCircleArrow(node: INode, type: ArrowType, from: IPoint, to: IPoint, context: CanvasRenderingContext2D): void {
        const headlen = 10;
        const angle = NodeBasics.calculateAngle(from, to);

        context.beginPath();
        context.arc(to.x - headlen / 2 * Math.cos(angle),
            to.y - headlen / 2 * Math.sin(angle),
            headlen / 2, 0, 2 * Math.PI);

        if (type === 'solid_circle') {
            context.fillStyle = context.strokeStyle;
        } else {
            context.fillStyle = this.getHollowFillColor(node);
        }
        context.setLineDash([]);
        context.fill();
        context.stroke();
    }

    private static getHollowFillColor(node: INode): string {
        let fill = node.fillStyle?.color || 'white';
        if (fill === 'transparent' || fill === 'inherit' || fill.match(/^rgba\(.*,\s*0\)$/)) {
            fill = 'white';
        }
        return fill;
    }

    private static applyFillStyle(node: INode, rect: IRect, context: CanvasRenderingContext2D): void {
        const color = node.fillStyle?.color || 'transparent';
        const gradient = node.fillStyle?.gradient;

        if (color === 'inherit') {
            context.fillStyle = fillColor(node);
        } else {
            context.fillStyle = color;
        }

        if (gradient) {
            let args = gradientArgsForBox(gradient, rect);

            let ctx_gradient;
            switch (gradient.type) {
                case 'linear':
                    ctx_gradient = context.createLinearGradient(args.x0, args.y0, args.x1, args.y1);
                    break;
                case 'radial':
                    ctx_gradient = context.createRadialGradient(args.x0, args.y0, args.r0, args.x1, args.y1, args.r1);
                    break;
                case 'conic':
                    ctx_gradient = context.createConicGradient(args.angle, args.x0, args.y0);
                    break;
                default:
                    ctx_gradient = null;
            }
            if (ctx_gradient) {
                for (const stop of gradient.stops) {
                    ctx_gradient.addColorStop(stop.position / 100, stop.color);
                }
                context.fillStyle = ctx_gradient;
            }
        }
    }

    public static applyContextFillStyle(fillStyle: FillStyle, rect: IRect, context: CanvasRenderingContext2D): void {
        const color = fillStyle.color || 'transparent';
        const gradient = fillStyle.gradient;

        if (color) {
            context.fillStyle = color;
        }

        if (gradient) {
            let args = gradientArgsForBox(gradient, rect);

            let ctx_gradient;
            switch (gradient.type) {
                case 'linear':
                    ctx_gradient = context.createLinearGradient(args.x0, args.y0, args.x1, args.y1);
                    break;
                case 'radial':
                    ctx_gradient = context.createRadialGradient(args.x0, args.y0, args.r0, args.x1, args.y1, args.r1);
                    break;
                case 'conic':
                    ctx_gradient = context.createConicGradient(args.angle, args.x0, args.y0);
                    break;
                default:
                    ctx_gradient = null;
            }
            if (ctx_gradient) {
                for (const stop of gradient.stops) {
                    ctx_gradient.addColorStop(stop.position / 100, stop.color);
                }
                context.fillStyle = ctx_gradient;
            }
        }
    }
}