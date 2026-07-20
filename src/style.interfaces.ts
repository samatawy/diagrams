import type { IGradient } from "./color.types";
import type { ArrowType, IFontWeight, IPoint, ITextAlign, ITextBaseline, ITextOrientation } from "./types";

/**
 * TextStyle defines the properties of text that can be rendered on nodes in the diagram, including font, size, alignment, and color.
 */
export interface TextStyle {
    /**
     * The font face of the text, which can be a CSS font-family string (e.g., 'Arial', 'Helvetica', 'Times New Roman') or undefined for a default font.
     * If the font face is undefined, the rendering logic may choose a default font based on the node's properties or theme.
     */
    fontFace?: string;

    /**
     * The font size of the text, which can be a number representing the size in pixels or undefined for a default size.
     * If the font size is undefined, the rendering logic may choose a default size based on the node's properties or theme.
     */
    size?: number;

    /**
     * The color of the text, which can be a CSS color string (e.g., '#000000' for black) or undefined for a default color.
     * If the color is undefined, the rendering logic may choose a default text color based on the node's properties or theme.
     */
    color?: string;

    /**
     * The color of a halo rendered around text to improve its visibility against complex backgrounds, 
     * which can be a CSS color string (e.g., '#ffffff' for white) or undefined for no halo.
     * Use 'inherit' to use the same color as the node's fillstyle or diagram background.
     */
    halo?: string;

    /**
     * The alignment of the text relative to its anchor point, which can be 'left', 'center', or 'right'.
     */
    align?: ITextAlign;

    /**
     * The baseline of the text relative to its anchor point, which can be 'top', 'middle', or 'bottom'.
     */
    baseline?: ITextBaseline;

    /**
     * The orientation of the text, which can be 'horizontal' for normal left-to-right text or 'vertical' for text that is rotated 90 degrees clockwise.
     */
    orientation?: ITextOrientation;

    // /**
    //  * Whether the text is bold, which can be true for bold text, false for normal weight, or undefined for a default weight.
    //  */
    // bold?: boolean;

    weight?: IFontWeight;

    /**
     * Whether the text is italicized, which can be true for italic text, false for normal style, or undefined for a default style.
     */
    italic?: boolean;

    /**
     * Whether the text is underlined, which can be true for underlined text, false for normal style, or undefined for a default style.
     */
    underline?: boolean;

    // strikethrough?: boolean;
}

export const NORMAL_FONT_WEIGHT: IFontWeight = 400;

export const BOLD_FONT_WEIGHT: IFontWeight = 700;

/**
 * StrokeStyle defines the properties of a stroke (outline) that can be applied to nodes in the diagram, including color, width, dash pattern, and arrow direction.
 */
export interface StrokeStyle {
    /**
     * The color of the stroke, which can be a CSS color string (e.g., '#000000' for black) or undefined for a default color.
     * If the color is undefined, the rendering logic may choose a default stroke color based on the node's properties or theme.
     */
    color?: string;

    /**
     * The width of the stroke, which can be a number representing the width in pixels or undefined for a default width.
     * If the width is undefined, the rendering logic may choose a default stroke width based on the node's properties or theme.
     */
    width?: number;

    /**
     * The dash pattern of the stroke, which can be a string representing a predefined pattern ('solid', 'dashed', 'dotted', 'dashdot') or an array of numbers for a custom pattern.
     * If the dash pattern is undefined, the rendering logic may choose a default pattern based on the node's properties or theme.
     */
    dash?: string | number[];

    /**
     * The type of arrowhead at the start of the stroke, which can be one of the predefined ArrowType values or undefined for no arrowhead.
     * If the arrow type is undefined, the rendering logic may choose a default arrow type based on the node's properties or theme.
     */
    arrow_start?: ArrowType;

    /**
     * The type of arrowhead at the end of the stroke, which can be one of the predefined ArrowType values or undefined for no arrowhead.
     * If the arrow type is undefined, the rendering logic may choose a default arrow type based on the node's properties or theme.
     */
    arrow_end?: ArrowType;
}

export interface FillStyle {
    /**
     * The color of the fill, which can be a CSS color string (e.g., '#000000' for black) or undefined for a default color.
     * If the color is undefined, the rendering logic may choose a default fill color based on the node's properties or theme.
     */
    color?: string;

    /**
     * The gradient value of the fill, which can be a GradientValue object or undefined for no gradient.
     * If the gradient value is undefined, the rendering logic may choose a default gradient based on the node's properties or theme.
     */
    gradient?: IGradient;
}

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
