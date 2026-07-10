import type { INode, IConnection } from "../../interfaces";
import type { IPoint } from "../../types";
import { NodeBasics } from "../node.basics";

type ErCardinality = "one" | "many";

export class ERDBasics {
    public static renderRelationMarkers(
        node: INode,
        context: CanvasRenderingContext2D,
        points: IPoint[]
    ): void {
        if (points.length < 2) return;

        const startFrom = points[1]!;
        const startTo = points[0]!;
        const endFrom = points[points.length - 2]!;
        const endTo = points[points.length - 1]!;

        switch (node.type) {
            case "erd_one_to_one":
                this.renderMarker("one", startFrom, startTo, context);
                this.renderMarker("one", endFrom, endTo, context);
                break;
            case "erd_one_to_many":
                this.renderMarker("one", startFrom, startTo, context);
                this.renderMarker("many", endFrom, endTo, context);
                break;
            case "erd_many_to_many":
                this.renderMarker("many", startFrom, startTo, context);
                this.renderMarker("many", endFrom, endTo, context);
                break;
        }
    }

    private static renderMarker(
        cardinality: ErCardinality,
        from: IPoint,
        to: IPoint,
        context: CanvasRenderingContext2D
    ): void {
        if (cardinality === "one") {
            this.renderOne(from, to, context);
        } else {
            this.renderMany(from, to, context);
        }
    }

    private static renderOne(from: IPoint, to: IPoint, context: CanvasRenderingContext2D): void {
        const angle = NodeBasics.calculateAngle(from, to);
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        const px = -uy;
        const py = ux;

        const inset = 8;
        const half = 5;

        const cx = to.x - ux * inset;
        const cy = to.y - uy * inset;

        context.save();
        context.setLineDash([]);
        context.beginPath();
        context.moveTo(cx + px * half, cy + py * half);
        context.lineTo(cx - px * half, cy - py * half);
        context.stroke();
        context.restore();
    }

    private static renderMany(from: IPoint, to: IPoint, context: CanvasRenderingContext2D): void {
        const hingeInset = 9;
        const tipInset = 1;
        const sideInset = 1;
        const spread = 5;

        /* Support sloped lines */
        const angle = NodeBasics.calculateAngle(from, to);
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        const px = -uy;
        const py = ux;

        /* hinge point */
        const hx = to.x - ux * hingeInset;
        const hy = to.y - uy * hingeInset;

        /* center talon */
        const cx = to.x - ux * tipInset;
        const cy = to.y - uy * tipInset;

        /* left talon */
        const lx = to.x - ux * sideInset + px * spread;
        const ly = to.y - uy * sideInset + py * spread;

        /* right talon */
        const rx = to.x - ux * sideInset - px * spread;
        const ry = to.y - uy * sideInset - py * spread;

        context.save();
        context.setLineDash([]);
        context.beginPath();
        context.moveTo(hx, hy);
        context.lineTo(cx, cy);
        context.moveTo(hx, hy);
        context.lineTo(lx, ly);
        context.moveTo(hx, hy);
        context.lineTo(rx, ry);
        context.stroke();
        context.restore();
    }
}