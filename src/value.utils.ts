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
