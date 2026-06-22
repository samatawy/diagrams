import type { IConnection, INode } from "./interfaces";
import { BOLD_FONT_WEIGHT, NORMAL_FONT_WEIGHT, type ShadowStyle, type TextStyle } from "./style.interfaces";
import type { IConnectionLabelOrientation, ImageMode, ITextAlign, ITextBaseline, ITextOrientation } from "./types";
import { DiagramConstants } from "./model/diagram.constants";

export function isLocked(node: INode): boolean {
    return !!node.locked;
}

export function isAspectLocked(node: INode): boolean {
    return !!node.locked_aspect;
}

export function textStyle(node: INode): TextStyle {
    return node.textStyle ?? {};
}

export function textAlign(node: INode): ITextAlign {
    return node.textStyle?.align || DiagramConstants.DEFAULT_NODE_TEXT_ALIGN;
}

export function textBaseline(node: INode): ITextBaseline {
    return node.textStyle?.baseline || DiagramConstants.DEFAULT_NODE_TEXT_BASELINE;
}

export function textOrientation(node: INode): ITextOrientation {
    return node.textStyle?.orientation || 'horizontal';
}

export function textBold(node: INode): boolean {
    const weight = node.textStyle?.weight ?? NORMAL_FONT_WEIGHT;
    return weight >= BOLD_FONT_WEIGHT;
}

export function textWeight(node: INode): number {
    return node.textStyle?.weight || NORMAL_FONT_WEIGHT;
}

export function textItalic(node: INode): boolean {
    return !!node.textStyle?.italic;
}

export function labelOrientation(node: INode): IConnectionLabelOrientation {
    return (node as IConnection).labelOrientation || DiagramConstants.DEFAULT_LABEL_ORIENTATION;
}

export function nodeFontFace(node: INode): string {
    return node.textStyle?.fontFace || DiagramConstants.DEFAULT_NODE_FONT_FACE;
}

export function nodeFontSize(node: INode): number {
    return node.textStyle?.size || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
}

export function nodeText(node: INode): string {
    return node.text || '';
}

export function textColor(node: INode): string {
    return node.textStyle?.color || node.strokeStyle || DiagramConstants.DEFAULT_NODE_TEXT_COLOR;
}

/**
 * Resolves the halo color for text rendering on the given node.
 * Returns undefined when no halo should be drawn (transparent / missing).
 * When value is 'inherit', resolves: node fillStyle (if not transparent) →
 * diagram background → a fallback contrast color derived from the text color.
 * Any candidate that does not contrast sufficiently with the text color is skipped.
 */
export function textHaloColor(node: INode): string | undefined {
    const raw = node.textStyle?.halo;
    if (!raw || raw === 'transparent') return undefined;

    const tc = textColor(node);

    if (raw !== 'inherit') {
        // Explicit color: only use it if it contrasts with the text color.
        return colorContrastsWithText(raw, tc) ? raw : undefined;
    }

    // 'inherit': walk the resolution chain, skipping any candidate that conflicts.
    const fill = node.fillStyle;
    if (fill && fill !== 'transparent' && colorContrastsWithText(fill, tc)) return fill;

    const diagram = node.owner as any;
    const bg = diagram?.background ?? diagram?.canvasBackgroundColor;
    if (bg && bg !== 'transparent' && colorContrastsWithText(bg, tc)) return bg;

    // Last resort: a pure-contrast fallback guaranteed to work.
    const fallback = hexLuminance(tc) > 0.179 ? '#000000' : '#ffffff';
    return fallback;
}

/** Returns true when haloColor provides enough contrast against the text color to be useful. */
function colorContrastsWithText(haloColor: string, textCol: string): boolean {
    const hl = hexLuminance(haloColor);
    const tl = hexLuminance(textCol);
    if (hl < 0 || tl < 0) return true; // unknown format — allow it
    const lighter = Math.max(hl, tl);
    const darker = Math.min(hl, tl);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return ratio >= 3; // WCAG large-text minimum
}

/** Relative luminance of a #rrggbb or #rgb hex color, or -1 if unparseable. */
function hexLuminance(color: string): number {
    const hex = color.trim();
    let r: number, g: number, b: number;
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
        r = parseInt(hex.slice(1, 3), 16) / 255;
        g = parseInt(hex.slice(3, 5), 16) / 255;
        b = parseInt(hex.slice(5, 7), 16) / 255;
    } else if (/^#[0-9a-f]{3}$/i.test(hex)) {
        r = parseInt(hex[1]! + hex[1]!, 16) / 255;
        g = parseInt(hex[2]! + hex[2]!, 16) / 255;
        b = parseInt(hex[3]! + hex[3]!, 16) / 255;
    } else {
        return -1; // can't parse; leave contrast check to caller
    }
    const lin = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function lineWidth(node: INode): number {
    return node.lineWidth ?? 1;
}

export function strokeStyle(node: INode): string {
    return node.strokeStyle || '#000000';
}

export function fillStyle(node: INode): string {
    return node.fillStyle || '#ffffff';
}

export function isInvisible(node: INode): boolean {
    return !!node.invisible;
}

export function isHollow(node: INode): boolean {
    if (node.hollow !== undefined) {
        return node.hollow;
    } else {
        return fillStyle(node) === undefined;
    }
}

export function imageMode(node: INode): ImageMode {
    return node.image_mode ?? (node.image_id ? 'contain' : 'none');
}

export function imageId(node: INode): string | undefined {
    return node.image_id;
}

export const SHADOW_NONE: ShadowStyle = {
    name: 'No Shadow',
    color: 'transparent',
    blur: 0,
    offset: { x: 0, y: 0 }
};

export function shadowStyle(node: INode): ShadowStyle {
    return node.shadowStyle ?? SHADOW_NONE;
}

export function nodeOpacity(node: INode): number {
    const v = node.opacity;
    if (v === undefined || v === null) return 1;
    return Math.min(100, Math.max(0, v)) / 100;
}

export function nodeAngle(node: INode): number {
    return node.angle || 0;
}
