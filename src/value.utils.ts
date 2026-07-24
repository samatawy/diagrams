import type { INode } from "./interfaces";
import { BOLD_FONT_WEIGHT, NORMAL_FONT_WEIGHT, type FillStyle, type ShadowStyle, type TextStyle } from "./style.interfaces";
import type { ArrowType, IFontWeight, ImageMode, IPoint, IRect, ITextAlign, ITextBaseline, ITextOrientation } from "./types";
import { DiagramConstants } from "./model/diagram.constants";
import { NodeRegistry } from "./factory/node.registry";

export function humanize(key: string): string {
    const parts = key.split(/[-_]/).filter(Boolean);
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function deepClone(obj: any, options?: { exclude?: string[] }): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }

    const cloned: any = {};
    for (const key in obj) {
        if (options?.exclude?.includes(key)) continue;

        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

export function deepCloneNode(obj: any, options?: { exclude?: string[] }): any {
    const clone = deepClone(obj, { exclude: [...options?.exclude ?? [], 'owner'] });
    clone.owner = obj.owner; // Preserve the owner reference
    return clone;
}

export function absoluteToRelative(point: IPoint, rect: IRect): IPoint {
    const x = rect.width ? (point.x - rect.left) / rect.width : 0.5;
    const y = rect.height ? (point.y - rect.top) / rect.height : 0.5;
    return { x, y };
}

export function relativeToAbsolute(relative: IPoint, rect: IRect): IPoint {
    const x = rect.left + (relative.x * rect.width);
    const y = rect.top + (relative.y * rect.height);
    return { x, y };
}

export function nodeId(node: INode | string): string {
    return typeof node === 'string' ? node : node.id;
}

export function nodeClass(node: INode): string | undefined {
    return node.style_class;
}

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
    const stored = node.textStyle?.baseline || DiagramConstants.DEFAULT_NODE_TEXT_BASELINE;
    const allowed = NodeRegistry.adapter(node.type)?.text_baselines;
    if (allowed && !allowed.includes(stored)) {
        return allowed[0]!;
    }
    return stored;
}

export function textOrientation(node: INode): ITextOrientation {
    const stored = node.textStyle?.orientation || DiagramConstants.DEFAULT_TEXT_ORIENTATION;
    const allowed = NodeRegistry.adapter(node.type)?.text_orientations;
    if (allowed && !allowed.includes(stored)) {
        return allowed[0]!;
    }
    return stored;
}

export function textBold(node: INode): boolean {
    const weight = node.textStyle?.weight ?? NORMAL_FONT_WEIGHT;
    return weight >= BOLD_FONT_WEIGHT;
}

export function textWeight(node: INode): IFontWeight {
    return node.textStyle?.weight || NORMAL_FONT_WEIGHT;
}

export function textItalic(node: INode): boolean {
    return !!node.textStyle?.italic;
}

export function textUnderline(node: INode): boolean {
    return !!node.textStyle?.underline;
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
    return node.textStyle?.color || node.strokeStyle?.color || DiagramConstants.DEFAULT_NODE_TEXT_COLOR;
}

/**
 * Resolves the halo color for text rendering on the given node.
 * Returns transparent when no halo should be drawn (explicit transparent only).
 * Missing halo is treated as 'inherit'.
 * When value is 'inherit' (or missing), resolves: node fillStyle (if not transparent) →
 * diagram background → a fallback contrast color derived from the text color.
 * Any candidate that does not contrast sufficiently with the text color is skipped.
 */
export function textHaloColor(node: INode): string {    //} | undefined {
    const raw = node.textStyle?.halo;
    if (raw === 'transparent') return 'transparent';

    const tc = textColor(node);

    if (raw && raw !== 'inherit') {
        // Explicit color: only use it if it contrasts with the text color.
        return colorContrastsWithText(raw, tc) ? raw : 'transparent';
    }

    // 'inherit' (or missing): walk the resolution chain, skipping conflicting candidates.
    const fill = node.fillStyle;
    if (fill?.color && fill.color !== 'transparent' && colorContrastsWithText(fill.color, tc)) return fill.color;
    // if (fill && fill !== 'transparent' && colorContrastsWithText(fill, tc)) return fill;

    const diagram = node.owner as any;
    const bg = diagram?.background?.color ?? diagram?.canvasBackgroundColor;
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
export function hexLuminance(color: string): number {
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

export function svgToDataUri(svgString: string): string {
    // encodeURIComponent handles special chars safely
    const encoded = encodeURIComponent(svgString);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
    // OR use base64 if you prefer:
    // return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
}

export function lineWidth(node: INode): number {
    return node.strokeStyle?.width ?? 1;
}

export function lineDash(node: INode): string | number[] {
    if (typeof node.strokeStyle?.dash === 'string') {
        return node.strokeStyle.dash || 'solid';
    } else if (Array.isArray(node.strokeStyle?.dash)) {
        return node.strokeStyle.dash.length > 0 ? node.strokeStyle.dash : 'solid';
    } else return 'solid';
}

export function lineDashArray(node: INode): number[] {
    const scale = lineWidth(node);
    if (Array.isArray(node.strokeStyle?.dash)) {
        return node.strokeStyle.dash.map(v => v * scale).filter(v => v > 0);
    } else {
        switch (node.strokeStyle?.dash) {
            case 'solid':
                return [];
            case 'dashed':
                return [10 * scale, 6 * scale];
            case 'dotted':
                return [2 * scale, 4 * scale];
            case 'dashdot':
            case 'dash-dot':
            case 'dash_dot':
                return [10 * scale, 4 * scale, 2 * scale, 4 * scale];
            default:
                return [];
        }
    }
}

export function arrowStart(node: INode): ArrowType {
    return node.strokeStyle?.arrow_start ?? 'none';
}

export function arrowEnd(node: INode): ArrowType {
    return node.strokeStyle?.arrow_end ?? 'none';
}

export function strokeColor(node: INode): string {
    return node.strokeStyle?.color ?? '#000000';
}

export function fillColor(node: INode): string {
    return node.fillStyle?.color || 'transparent';
}

export function fillStyle(node: INode): FillStyle {
    return node.fillStyle ?? { color: 'transparent' };
}

export function isInvisible(node: INode): boolean {
    return !!node.invisible;
}

export function isHollow(node: INode): boolean {
    if (node.hollow !== undefined) {
        return node.hollow;
    }
    const adapter = NodeRegistry.adapter(node.type);
    if (adapter?.hollow_mode === 'always') {
        return true;
    } else if (adapter?.hollow_mode === 'never') {
        return false;
    } else {
        return (node.fillStyle === undefined || fillColor(node) === 'transparent') && !node.fillStyle?.gradient && node.image_id === undefined;
        // return (fillStyle(node) === undefined || fillStyle(node) === 'transparent') && imageId(node) === undefined;
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
