import { NodeRegistry } from '../factory';
import { VerticalSwimlaneAdapter } from './container/vertical.swimlane.adapter';
import { CurveAdapter } from './polyline/curve.adapter';
import { LineAdapter } from './polyline/line.adapter';
import { ManhattanAdapter } from './polyline/manhattan.adapter';
import { PolygonAdapter } from './polyline/polygon.adapter';
import { PolylineAdapter } from './polyline/polyline.adapter';
import { DocumentAdapter } from './rectangle/document.adapter';
import { EllipseAdapter } from './rectangle/ellipse.adapter';
import { ParallelogramAdapter } from './rectangle/parallelogram.adapter';
import { RectangleAdapter } from './rectangle/rectangle.adapter';
import { RhombusAdapter } from './rectangle/rhombus.adapter';
import { RoundRectangleAdapter } from './rectangle/round.rectangle.adapter';
import { SvgAdapter } from './rectangle/svg.adapter';
import { TextAdapter } from './rectangle/text.adapter';
import { TrapezoidAdapter } from './rectangle/trapezoid.adapter';

export * from './node.basics';
export * from './connection.basics';
export * from './group.basics';
export * from './render.basics';
export * from './selection.basics';

export * from './container/index';
export * from './rectangle/index';

export * from './polyline/index';

export function registerBasicAdapters(): void {
    RectangleAdapter.register();
    RoundRectangleAdapter.register();
    EllipseAdapter.register();
    TextAdapter.register();

    LineAdapter.register();
    PolylineAdapter.register();
    ManhattanAdapter.register();
    CurveAdapter.register();

    VerticalSwimlaneAdapter.register();

    RhombusAdapter.register();
    ParallelogramAdapter.register();
    TrapezoidAdapter.register();
    DocumentAdapter.register();

    PolygonAdapter.register();
    SvgAdapter.register();

    NodeRegistry.registerTransferables([
        RectangleAdapter.TYPE,
        RoundRectangleAdapter.TYPE,
        EllipseAdapter.TYPE,
        TextAdapter.TYPE,
        RhombusAdapter.TYPE,
        ParallelogramAdapter.TYPE,
        TrapezoidAdapter.TYPE,
        DocumentAdapter.TYPE,
    ]);

    NodeRegistry.registerTransferables([
        PolylineAdapter.TYPE,
        ManhattanAdapter.TYPE,
        CurveAdapter.TYPE,
    ]);

    NodeRegistry.registerTransferables([
        LineAdapter.TYPE,
    ]);

    NodeRegistry.registerTransferables([
        VerticalSwimlaneAdapter.TYPE,
    ]);

    NodeRegistry.registerTransferables([
        PolygonAdapter.TYPE,
    ]);

}
