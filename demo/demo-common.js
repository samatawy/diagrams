import {
    DiagramView,
    DiagramEditView,
    DIAGRAM_CLIPBOARD_EVENT,
    DIAGRAM_CHANGED_EVENT,
    NodeHandle,
    RectangleAdapter,
    RoundRectangleAdapter,
    ParallelogramAdapter,
    EllipseAdapter,
    RhombusAdapter,
    TextAdapter,
    SvgAdapter,
    PolylineAdapter,
    PolygonAdapter,
    CurveAdapter,
    LineAdapter,
    TrapezoidAdapter,
    DocumentAdapter,
} from '../dist/index.js';

let registered = false;

export const EDITOR_TOOL_DEFS = [
    { key: 'select', label: 'Select' },
    { key: 'rectangle', label: 'Rectangle' },
    { key: 'round_rectangle', label: 'Round Rect' },
    { key: 'ellipse', label: 'Ellipse' },
    { key: 'parallelogram', label: 'Parallelogram' },
    { key: 'rhombus', label: 'Rhombus' },
    { key: 'text', label: 'Text' },
    { key: 'svg', label: 'Svg' },
    { key: 'line', label: 'Line' },
    { key: 'polyline', label: 'Polyline' },
    { key: 'polygon', label: 'Polygon' },
    { key: 'curve', label: 'Curve' },
    { key: 'trapezoid', label: 'Trapezoid' },
    { key: 'document', label: 'Document' },
];

export function registerAdapters() {
    if (registered) return;
    registered = true;

    RectangleAdapter.register();
    RoundRectangleAdapter.register();
    ParallelogramAdapter.register();
    // EllipseAdapter.register();
    RhombusAdapter.register();
    TextAdapter.register();
    SvgAdapter.register();
    PolylineAdapter.register();
    // PolygonAdapter.register();
    CurveAdapter.register();
    // LineAdapter.register();

    // new RectangleAdapter().register();
    // new RoundRectangleAdapter().register();
    new EllipseAdapter().register();
    // new RhombusAdapter().register();
    // new TextAdapter().register();
    // new SvgAdapter().register();
    // new PolylineAdapter().register();
    new PolygonAdapter().register();
    // new CurveAdapter().register();
    new LineAdapter().register();
    new TrapezoidAdapter().register();
    new DocumentAdapter().register();
}

export function makeBox(owner, id, type, left, top, width, height, options = {}) {
    return {
        id,
        type,
        points: [
            { x: left, y: top },
            { x: left + width, y: top + height },
        ],
        hollow: options.hollow ?? false,
        text: options.text ?? '',
        textAlign: options.textAlign ?? 'center',
        textBaseline: options.textBaseline ?? 'middle',
        font: options.font ?? '16px Georgia',
        image_id: undefined,
        img_mode: 'none',
        ready: options.ready ?? true,
        transparent: options.transparent ?? false,
        strokeStyle: options.strokeStyle ?? '#1f2937',
        fillStyle: options.fillStyle ?? '#ffffff',
        textColor: options.textColor ?? (options.strokeStyle ?? '#1f2937'),
        lineWidth: options.lineWidth ?? 2,
        shadowStyle: options.shadowStyle,
        angle: options.angle ?? 0,
        owner,
    };
}

export function makeLine(owner, id, points, options = {}) {
    return {
        id,
        type: 'line',
        points,
        from: options.from,
        to: options.to,
        startArrow: options.startArrow,
        endArrow: options.endArrow ?? true,
        hollow: true,
        text: options.text ?? '',
        textAlign: 'center',
        textBaseline: 'middle',
        font: options.font ?? '14px Georgia',
        image_id: undefined,
        img_mode: 'none',
        ready: options.ready ?? true,
        transparent: false,
        strokeStyle: options.strokeStyle ?? '#334155',
        fillStyle: 'transparent',
        textColor: options.textColor ?? (options.strokeStyle ?? '#334155'),
        lineWidth: options.lineWidth ?? 2,
        shadowStyle: undefined,
        angle: 0,
        owner,
    };
}

function resolveHost(target) {
    if (typeof target === 'string') {
        return document.getElementById(target);
    }

    if (target instanceof HTMLCanvasElement || target instanceof HTMLElement) {
        return target;
    }

    return null;
}

function scheduleMountWhenReady(target, mountNow) {
    if (document.readyState !== 'loading') {
        return mountNow();
    }

    document.addEventListener(
        'DOMContentLoaded',
        () => {
            mountNow();
        },
        { once: true },
    );

    return undefined;
}

function mountBase(target, seed, createView, fitPadding) {
    const mountNow = () => {
        const host = resolveHost(target);
        if (!host) {
            console.error(`Demo mount target not found: ${String(target)}`);
            return undefined;
        }

        registerAdapters();
        const view = createView(seed.id, host);
        seed.populate(view);
        view.fitToNodes(fitPadding, 'center');
        return view;
    };

    return scheduleMountWhenReady(target, mountNow);
}

export function mountView(target, seed) {
    return mountBase(
        target,
        seed,
        (id, host) => new DiagramView(id, host),
        40,
    );
}

export function mountEditor(target, seed) {
    return mountBase(
        target,
        seed,
        (id, host) => {
            const view = new DiagramEditView(id, host);
            view.grid.visible = true;
            view.grid.width = 24;
            view.grid.height = 24;
            return view;
        },
        48,
    );
}

export {
    DiagramView,
    DiagramEditView,
    NodeHandle,
    DIAGRAM_CLIPBOARD_EVENT,
    DIAGRAM_CHANGED_EVENT,
};
