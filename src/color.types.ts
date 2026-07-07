export type GradientType = 'linear' | 'radial' | 'conic';

export interface GradientStop {
    id: string;
    /** 
     * Any CSS colour string; stored normalised as `rgba(r,g,b,a)` internally. 
     */
    color: string;
    /** 
     * Position in the gradient, 0–100.
     * N.B. When applying to HTML Canvas, we deivide by 100.
     */
    position: number;
}

/**
 * Represents a gradient fill, with type, angle, centre, and stops.
 * This is how gradients are stored in the diagram model, and is not the industry standard.
 */
export interface IGradient {
    /**
     * Gradient type, one of 'linear', 'radial', or 'conic'.
     */
    type: GradientType;
    /** 
     * Rotation angle in degrees. Used by linear and conic. 
     */
    angle: number;
    /** 
     * Horizontal centre, 0–100 %. Used by radial and conic.
     */
    centerX: number;
    /** 
     * Vertical centre, 0–100 %. Used by radial and conic.
     */
    centerY: number;
    /**
     * Gradient stops, in order of increasing position. Must have at least 2 stops.
     */
    stops: GradientStop[];
}

// ---- Internal colour types ---------------------------------------------

export interface RGBA {
    r: number; // 0–255
    g: number; // 0–255
    b: number; // 0–255
    a: number; // 0–1
}

export interface HSL {
    h: number; // 0–360
    s: number; // 0–100
    l: number; // 0–100
}

/**
 * Represents a colour stop in a gradient, with a position and an RGBA colour.
 * This is not the industry standard and currently not used.
 */
export const TRANSPARENT_CSS_PATTERN = 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 6px, #e2e8f0 6px, #e2e8f0 12px)';

/** 
 * Checkerboard gradient image (no size). Use in `background-image` with a separate `background-size`.
 */
export const CHECKER_CSS_IMAGE = 'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%)';

/** 
 * Checkerboard shorthand (image + 8×8 px tile). Use in `background` shorthand only. 
 */
export const CHECKER_CSS_PATTERN = `${CHECKER_CSS_IMAGE} 0 0 / 8px 8px`;