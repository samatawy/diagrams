import type { INode } from "../interfaces";
import type { IRect } from "../types";
import { isDiagramViewLike } from "../guards";
import type { INodeCached } from "../view/view.cache";
import type { TextOverflowMode } from "../factory/node.adapter";

export interface TextOptions {
    overflow: TextOverflowMode;
    path?: Path2D;
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
        context.lineWidth = node.lineWidth;
        context.strokeStyle = node.strokeStyle;
        context.fillStyle = node.fillStyle;
        if (cached.img && node.img_mode == 'pattern') {
            context.fillStyle = context.createPattern(cached.img, 'repeat') || '';
        }
        if (node.shadowStyle) {
            context.shadowColor = node.shadowStyle.color || node.fillStyle;
            context.shadowOffsetX = node.shadowStyle.offset.x;
            context.shadowOffsetY = node.shadowStyle.offset.y;
            context.shadowBlur = node.shadowStyle.blur;
        }

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
                imageSource = node.image_id;
            }
        } else {
            imageSource = node.image_id;
        }

        if (!imageSource || node.img_mode == 'none') {
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
        context.strokeStyle = 'gray';
        context.fillStyle = 'transparent';

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
        cached.text_path = this.getTextHitPath(node, context);
        if (typeof (cache as { setNode?: unknown }).setNode === 'function') {
            cache.setNode(node, cached);
        }

        if (node.points.length > 1) {
            let rect = coordinates.getBoundingRect(node);

            if (options.overflow == 'hidden' && options.path) {
                context.save();
                context.clip(options.path);
                this.renderLines(node, context, rect);
                context.restore();

            } else if (options.overflow == 'hidden') {
                context.save();
                context.beginPath();
                context.rect(rect.left, rect.top, rect.width, rect.height);
                context.clip();
                this.renderLines(node, context, rect);
                context.restore();

            } else if (options.overflow == 'visible') {
                this.renderLines(node, context, rect);
            }
        }
    }

    private static renderLines(node: INode, context: CanvasRenderingContext2D, rect: IRect) {
        if (!context) return;

        const { lines, lineHeight, startline } = this.getTextLayout(node, context, rect);

        for (let i = 0; i < lines.length; i++) {
            let x = rect.left;
            let y = startline + (i * lineHeight);
            // let y = rect.top + 6 + (i * lineHeight);    // MAGIC NUMBER !

            switch (node.textAlign) {
                case 'left':
                    context.fillText(lines[i]!, x, y);
                    break;
                case 'center':
                    context.fillText(lines[i]!, x + rect.width / 2, y);
                    break;
                case 'right':
                    context.fillText(lines[i]!, x + rect.width, y);
                    break;
            }
        }
    }

    private static getTextLayout(node: INode, context: CanvasRenderingContext2D, rect: IRect) {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) {
            return { lines: [], lineHeight: 0, startline: 0 };
        }

        // Text should remain legible against the node fill and should not inherit shape shadows.
        context.shadowColor = 'transparent';
        context.fillStyle = node.transparent && diagram.render_mode == 'view'
            ? 'transparent'
            : (node.textColor || node.strokeStyle || '#111827');

        context.textAlign = node.textAlign || 'center';
        context.textBaseline = node.textBaseline || 'middle';
        context.font = node.font;

        let fparts = node.font.split('px');
        let fontSize = (fparts.length > 0) ? +(fparts[0]!.trim()) || 16 : 16;
        let lineHeight = (fontSize * 1.25);
        let lines = this.getLines(node.text, rect.width, context);
        let startline = 0;

        switch (node.textBaseline) {
            case 'top':
                startline = rect.top + 6;
                break;
            case 'middle':
                startline = rect.top + 3 + (rect.height / 2) - (lineHeight * (lines.length - 1) / 2);
                break;
            case 'bottom':
                startline = rect.top + rect.height - (lineHeight * (lines.length - 1));
                break;
        }

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

    /**
     * Returns a Path2D object representing the hit area for the text of a node, including optional padding.
     * @param node The node for which to get the text hit path.
     * @param context The canvas rendering context.
     * @param padding The padding to apply around the text hit area.
     * @returns A Path2D object representing the text hit area, or undefined if the node has insufficient points.
     */
    public static getTextHitPath(node: INode, context: CanvasRenderingContext2D, padding = 4): Path2D | undefined {
        const diagram = node.owner;
        if (!isDiagramViewLike(diagram)) return undefined;
        const coordinates = diagram.getCoordinates();

        if (node.points.length <= 1) {
            return undefined;
        }

        const rect = coordinates.getBoundingRect(node);
        const { lines, lineHeight, startline } = this.getTextLayout(node, context, rect);
        const path = new Path2D();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i] || '';
            const width = context.measureText(line).width;
            const y = startline + (i * lineHeight);

            let left = rect.left;
            switch (node.textAlign) {
                case 'left':
                    left = rect.left;
                    break;
                case 'center':
                    left = rect.left + (rect.width - width) / 2;
                    break;
                case 'right':
                    left = rect.left + rect.width - width;
                    break;
            }

            let top = y;
            switch (node.textBaseline) {
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

        return path;
    }
}