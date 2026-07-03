import {
    DiagramView,
    DiagramEditView,
    DiagramContextMenu,
    DIAGRAM_CLIPBOARD_EVENT,
    DIAGRAM_CHANGED_EVENT,
    NodeHandle,
    // RectangleAdapter,
    // RoundRectangleAdapter,
    // ParallelogramAdapter,
    // EllipseAdapter,
    // RhombusAdapter,
    // TextAdapter,
    // SvgAdapter,
    // PolylineAdapter,
    // ManhattanAdapter,
    // PolygonAdapter,
    // CurveAdapter,
    // LineAdapter,
    // TrapezoidAdapter,
    // DocumentAdapter,
    registerBasicAdapters,
} from '../dist/index.js';

let registered = false;

// export const EDITOR_TOOL_DEFS = [
//     { key: 'select', label: 'Select' },
//     { key: 'rectangle', label: 'Rectangle' },
//     { key: 'round_rectangle', label: 'Round Rect' },
//     { key: 'ellipse', label: 'Ellipse' },
//     { key: 'parallelogram', label: 'Parallelogram' },
//     { key: 'rhombus', label: 'Rhombus' },
//     { key: 'text', label: 'Text' },
//     { key: 'svg', label: 'Svg' },
//     { key: 'line', label: 'Line' },
//     { key: 'polyline', label: 'Polyline' },
//     { key: 'manhattan', label: 'Manhattan' },
//     { key: 'polygon', label: 'Polygon' },
//     { key: 'curve', label: 'Curve' },
//     { key: 'trapezoid', label: 'Trapezoid' },
//     { key: 'document', label: 'Document' },
// ];

export function registerAdapters() {
    if (registered) return;
    registered = true;

    registerBasicAdapters();
    /*
    RectangleAdapter.register();
    RoundRectangleAdapter.register();
    ParallelogramAdapter.register();
    TrapezoidAdapter.register();
    RhombusAdapter.register();
    EllipseAdapter.register();
    TextAdapter.register();
    SvgAdapter.register();
    LineAdapter.register();
    PolylineAdapter.register();
    ManhattanAdapter.register();
    // PolygonAdapter.register();
    // CurveAdapter.register();

    // new RectangleAdapter().register();
    // new RoundRectangleAdapter().register();
    // new EllipseAdapter().register();
    // new RhombusAdapter().register();
    // new TextAdapter().register();
    // new SvgAdapter().register();
    // new PolylineAdapter().register();
    new PolygonAdapter().register();
    new CurveAdapter().register();
    new DocumentAdapter().register();
    */
}

export function makeBox(owner, id, type, left, top, width, height, options = {}) {
    const strokeStyle = options.strokeStyle ? { ...options.strokeStyle } : undefined;
    const textStyle = {
        align: 'center',
        baseline: 'middle',
        fontFace: 'Georgia',
        size: 16,
        color: strokeStyle?.color ?? '#1f2937',
        ...(options.textStyle || {}),
    };

    return {
        id,
        type,
        points: [
            { x: left, y: top },
            { x: left + width, y: top + height },
        ],
        hollow: options.hollow ?? false,
        text: options.text ?? '',
        textStyle,
        image_id: undefined,
        image_mode: 'none',
        ready: options.ready ?? true,
        strokeStyle,
        fillStyle: options.fillStyle ?? '#ffffff',
        shadowStyle: options.shadowStyle,
        angle: options.angle ?? 0,
        owner,
    };
}

export function makeLine(owner, id, points, options = {}) {
    const strokeStyle = {
        arrow: 'end',
        ...(options.strokeStyle || {}),
    };

    const textStyle = {
        align: 'center',
        baseline: 'middle',
        fontFace: 'Georgia',
        size: 16,
        color: strokeStyle.color ?? '#334155',
        ...(options.textStyle || {}),
    };

    return {
        id,
        type: 'line',
        points,
        from: options.from,
        to: options.to,
        hollow: true,
        text: options.text ?? '',
        textStyle,
        image_id: undefined,
        image_mode: 'none',
        ready: options.ready ?? true,
        strokeStyle,
        fillStyle: 'transparent',
        shadowStyle: options.shadowStyle,
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
            view.contextMenu = new DiagramContextMenu(view);
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
