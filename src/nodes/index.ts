import { NodeRegistry } from '../factory/node.registry';
import { ToolsetRegistry } from '../factory/toolset.registry';

import { CurveAdapter } from './polyline/curve.adapter';
import { LineAdapter } from './polyline/line.adapter';
import { OrthogonalAdapter } from './polyline/orthogonal.adapter';
import { PolygonAdapter } from './polyline/polygon.adapter';
import { PolylineAdapter } from './polyline/polyline.adapter';
import { DocumentAdapter } from './rectangle/document.adapter';
import { EllipseAdapter } from './rectangle/ellipse.adapter';
import { CircleAdapter } from './rectangle/circle.adapter';
import { ParallelogramAdapter } from './rectangle/parallelogram.adapter';
import { RectangleAdapter } from './rectangle/rectangle.adapter';
import { RhombusAdapter } from './rectangle/rhombus.adapter';
import { RoundRectangleAdapter } from './rectangle/round.rectangle.adapter';
import { TextAdapter } from './rectangle/text.adapter';
import { TrapezoidAdapter } from './rectangle/trapezoid.adapter';
import { CylinderAdapter } from './rectangle/cylinder.adapter';
import { ArrowTriangleAdapter } from './rectangle/arrow.triangle.adapter';
import { ArrowChevronAdapter } from './rectangle/arrow.chevron.adapter';
import { SpeechBubbleAdapter } from './rectangle/speech.bubble.adapter';

import { HorizontalPoolAdapter } from './container/horizontal.pool.adapter';
import { VerticalPoolAdapter } from './container/vertical.pool.adapter';

import { SvgAdapter } from './rectangle/svg.adapter';
import { FreehandAdapter } from './free/freehand.adapter';
import type { StringDecoder } from 'string_decoder';

export * from './node.basics';
export * from './connection.basics';
export * from './group.basics';
export * from './render.basics';
export * from './selection.basics';

export * from './container/index';
export * from './rectangle/index';

export * from './polyline/index';

export * from './bpmn/index';
export * from './c4/index';
export * from './erd/index';
export * from './logic/index';
export * from './uml/index';

export function registerBasicAdapters(): void {

    FreehandAdapter.register();

    RectangleAdapter.register();
    RoundRectangleAdapter.register();
    EllipseAdapter.register();
    CircleAdapter.register();
    TextAdapter.register();
    SpeechBubbleAdapter.register();
    ArrowTriangleAdapter.register();
    ArrowChevronAdapter.register();

    LineAdapter.register();
    PolylineAdapter.register();
    OrthogonalAdapter.register();
    CurveAdapter.register();

    VerticalPoolAdapter.register();
    HorizontalPoolAdapter.register();

    RhombusAdapter.register();
    ParallelogramAdapter.register();
    TrapezoidAdapter.register();
    DocumentAdapter.register();
    CylinderAdapter.register();

    PolygonAdapter.register();
    SvgAdapter.register();

    NodeRegistry.registerTransferables([
        RectangleAdapter.TYPE,
        RoundRectangleAdapter.TYPE,
        EllipseAdapter.TYPE,
        CircleAdapter.TYPE,
        TextAdapter.TYPE,
        RhombusAdapter.TYPE,
        ParallelogramAdapter.TYPE,
        TrapezoidAdapter.TYPE,
        DocumentAdapter.TYPE,
        CylinderAdapter.TYPE,
        SpeechBubbleAdapter.TYPE,
        ArrowTriangleAdapter.TYPE,
        ArrowChevronAdapter.TYPE,
    ]);

    NodeRegistry.registerTransferables([
        PolylineAdapter.TYPE,
        OrthogonalAdapter.TYPE,
        CurveAdapter.TYPE,
    ]);
}

export const BASIC_TOOL_LAYOUT: string[] = [
    'select',
    'freehand',
    'rectangle',
    'round_rectangle',
    'ellipse',
    'circle',
    'text',
    'speech_bubble',
    'arrow_triangle',
    'arrow_chevron',
    'line',
    'polyline',
    'orthogonal',
    'curve',
    'rhombus',
    'parallelogram',
    'trapezoid',
    'document',
    'cylinder',
    'polygon',
];

export function registerBasicToolset(): void {
    registerBasicAdapters();

    ToolsetRegistry.global.register({
        name: 'Basic',
        layout: BASIC_TOOL_LAYOUT,
    });
}
