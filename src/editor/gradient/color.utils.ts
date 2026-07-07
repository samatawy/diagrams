import type { GradientValue, HSL, RGBA } from "../../color.types";
import type { IRect } from "../../types";


// ---- Colour utilities --------------------------------------------------

let _colorCanvas: HTMLCanvasElement | null = null;
let _colorCtx: CanvasRenderingContext2D | null = null;

export function getColorCtx(): CanvasRenderingContext2D | null {
    if (typeof document === 'undefined') return null;
    if (!_colorCanvas) {
        _colorCanvas = document.createElement('canvas');
        _colorCanvas.width = _colorCanvas.height = 1;
        _colorCtx = _colorCanvas.getContext('2d', { willReadFrequently: true });
    }
    return _colorCtx;
}

export function parseColor(css: string): RGBA {
    const ctx = getColorCtx();

    if (!ctx) return { r: 0, g: 0, b: 0, a: 1 };
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0]!, g: d[1]!, b: d[2]!, a: (d[3]!) / 255 };
}

export function rgbaToCss(c: RGBA): string {
    return `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${+c.a.toFixed(3)})`;
}

export function rgbaToHex(c: RGBA): string {
    const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    const base = `#${h(c.r)}${h(c.g)}${h(c.b)}`;
    return c.a >= 0.9999 ? base : `${base}${h(c.a * 255)}`;
}

export function rgbaToHsl(c: RGBA): HSL {
    const r = c.r / 255;
    const g = c.g / 255;
    const b = c.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgba(hsl: HSL, a = 1): RGBA {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    if (s === 0) {
        const v = Math.round(l * 255);
        return { r: v, g: v, b: v, a };
    }

    function hue2rgb(p: number, q: number, t: number): number {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
        r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
        a,
    };
}

// ---- Gradient CSS generator --------------------------------------------

export function buildGradientCss(v: GradientValue): string {
    const stops = [...v.stops]
        .sort((a, b) => a.position - b.position)
        .map(s => `${s.color} ${s.position}%`)
        .join(', ');

    switch (v.type) {
        case 'linear': return `linear-gradient(${v.angle}deg, ${stops})`;
        case 'radial': return `radial-gradient(circle at ${v.centerX}% ${v.centerY}%, ${stops})`;
        case 'conic': return `conic-gradient(from ${v.angle}deg at ${v.centerX}% ${v.centerY}%, ${stops})`;
    }
}

// ---- Gradient Canvas Generator -----------------------------------------------

export interface CanvasGradientArgs {
    type: 'linear' | 'radial' | 'conic';
    x0: number; y0: number;
    x1: number; y1: number;   // unused for conic
    r0: number; r1: number;   // unused for linear/conic
    angle: number;             // radians, for conic only
}

export function gradientArgsForBox(g: GradientValue, rect: IRect): CanvasGradientArgs {

    const { left: x, top: y, width: w, height: h } = rect;

    const cx = x + w / 2;
    const cy = y + h / 2;
    const rad = (g.angle * Math.PI) / 180;

    // Linear
    const halfLen = (Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))) / 2;
    const lx0 = cx - Math.sin(rad) * halfLen;
    const ly0 = cy - Math.cos(rad) * halfLen;
    const lx1 = cx + Math.sin(rad) * halfLen;
    const ly1 = cy + Math.cos(rad) * halfLen;

    // Radial / conic center
    const ox = x + w * (g.centerX / 100);
    const oy = y + h * (g.centerY / 100);
    const rx = Math.max(ox - x, x + w - ox);
    const ry = Math.max(oy - y, y + h - oy);
    const r1 = Math.sqrt(rx * rx + ry * ry);

    return {
        type: g.type,
        x0: g.type === 'linear' ? lx0 : ox,
        y0: g.type === 'linear' ? ly0 : oy,
        x1: g.type === 'linear' ? lx1 : ox,
        y1: g.type === 'linear' ? ly1 : oy,
        r0: 0,
        r1,
        angle: (g.angle - 90) * (Math.PI / 180), // CSS→canvas angle convention
    };
}