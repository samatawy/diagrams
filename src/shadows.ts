import type { IPoint } from "./types";

export type ArrowDirection = 'start' | 'end' | 'both' | 'none';

/**
 * ShadowStyle defines the properties of a shadow effect that can be applied to nodes in the diagram.
 */
export interface ShadowStyle {
    /**
     * The name of the shadow style, used for display purposes in the UI when selecting a shadow effect.
     */
    name: string,

    /**
     * The color of the shadow, which can be a CSS color string (e.g., '#000000' for black) or undefined for a default color.
     * If the color is undefined, the rendering logic may choose a default shadow color based on the node's properties or theme.
     */
    color?: string;

    /**
     * The blur radius of the shadow, which determines how blurry the shadow appears. 
     * A higher value results in a softer, more diffuse shadow, while a value of 0 creates a sharp shadow with no blur.
     */
    blur: number,

    /**
     * The offset of the shadow, which determines the horizontal and vertical displacement of the shadow relative to the node.
     * Positive values move the shadow right and down, while negative values move it left and up.
     * The offset has an x component for horizontal displacement and a y component for vertical displacement, allowing for directional shadows 
     * (e.g., a shadow that appears to the right and below the node).
     */
    offset: IPoint,
}

/**
 * An array of predefined shadow styles that can be applied to nodes in the diagram.
 */
export const shadowStyles: ShadowStyle[] = [
    {
        name: 'No Shadow',
        color: 'transparent',
        blur: 0,
        offset: { x: 0, y: 0 }
    },
    {
        name: 'Close',
        color: '#606060',
        blur: 3,
        offset: { x: 2, y: 2 }
    },
    {
        name: 'Medium',
        color: '#808080',
        blur: 6,
        offset: { x: 4, y: 4 }
    },
    {
        name: 'High',
        color: '#a0a0a0',
        blur: 10,
        offset: { x: 8, y: 8 }
    },
    {
        name: 'Glow',
        color: undefined,
        blur: 15,
        offset: { x: 0, y: 0 }
    },
    {
        name: 'Light',
        color: undefined,
        blur: 30,
        offset: { x: 0, y: 0 }
    },
]
