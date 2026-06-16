import type { INode } from "./interfaces";
import type { ShadowStyle } from "./shadows";
import type { ImageMode, ITextAlign, ITextBaseline } from "./types";

export function textAlign(node: INode): ITextAlign {
    return node.textAlign || 'center';
}

export function textBaseline(node: INode): ITextBaseline {
    return node.textBaseline || 'middle';
}

export function nodeFontFace(node: INode): string {
    return node.fontFace || 'system';   //'16px sans-serif';
}

export function nodeFontSize(node: INode): number {
    return node.fontSize || 14;
}

export function nodeText(node: INode): string {
    return node.text || '';
}

export function textColor(node: INode): string {
    return node.textColor || node.strokeStyle || '#000000';
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

export function isTransparent(node: INode): boolean {
    return !!node.transparent;
}

export function isHollow(node: INode): boolean {
    if (node.hollow !== undefined) {
        return node.hollow;
    } else {
        return fillStyle(node) === undefined;
    }
}

export function imageMode(node: INode): ImageMode {
    return node.img_mode || 'none';
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

export function nodeAngle(node: INode): number {
    return node.angle || 0;
}