import type { IRect } from "../../types";

export class BpmnBasics {

    /**
     * Renders an "X" inside the rhombus for exclusive gateway.
     * Assumes the context is already prepared and the rhombus shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderExclusive(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {

        context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the cross

        const crossPath = new Path2D();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const crossSize = Math.min(rect.width, rect.height) / 8;

        crossPath.moveTo(centerX - crossSize, centerY - crossSize);
        crossPath.lineTo(centerX + crossSize, centerY + crossSize);
        crossPath.moveTo(centerX - crossSize, centerY + crossSize);
        crossPath.lineTo(centerX + crossSize, centerY - crossSize);

        context.stroke(crossPath);
    }

    /**
     * Renders a circle inside the rhombus for inclusive gateway.
     * Assumes the context is already prepared and the rhombus shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderInclusive(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {

        context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the ring

        const ringPath = new Path2D();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const ringRadius = Math.min(rect.width, rect.height) / 6;
        ringPath.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);

        context.stroke(ringPath);
    }

    /**
     * Renders a "+" inside the rhombus for parallel gateway.
     * Assumes the context is already prepared and the rhombus shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderParallel(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {

        context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the "+"

        const plusPath = new Path2D();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const plusSize = Math.min(rect.width, rect.height) / 8;

        plusPath.moveTo(centerX - plusSize, centerY);
        plusPath.lineTo(centerX + plusSize, centerY);
        plusPath.moveTo(centerX, centerY - plusSize);
        plusPath.lineTo(centerX, centerY + plusSize);

        context.stroke(plusPath);
    }

    /**
     * Renders a star inside the rhombus for complex gateway.
     * Assumes the context is already prepared and the rhombus shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderComplex(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {

        context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the star

        const starPath = new Path2D();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const starSize = Math.min(rect.width, rect.height) / 8;

        const numPoints = 6;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i * 2 * Math.PI) / numPoints;
            const x = centerX + starSize * Math.cos(angle);
            const y = centerY + starSize * Math.sin(angle);
            starPath.moveTo(centerX, centerY); // Move to the center for each line
            starPath.lineTo(x, y);
        }
        starPath.closePath();

        context.stroke(starPath);
    }

    /**
     * Renders a double circle inside the rhombus for event-based gateway.
     * Assumes the context is already prepared and the rhombus shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderEventBased(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {

        context.beginPath();
        context.arc(rect.left + rect.width / 2, rect.top + rect.height / 2, Math.min(rect.width, rect.height) * 0.2, 0, 2 * Math.PI);
        context.stroke();

        context.beginPath();
        context.arc(rect.left + rect.width / 2, rect.top + rect.height / 2, Math.min(rect.width, rect.height) * 0.3, 0, 2 * Math.PI);
        context.stroke();
    }

    /**
     * Renders a message envelope inside the circle for message events.
     * Assumes the context is already prepared and the circle shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderMessage(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Reduce line width for the envelope

        const envelopePath = new Path2D();
        const left = rect.left + rect.width * 0.3;
        const right = rect.left + rect.width * 0.7;
        const top = rect.top + rect.height * 0.35;
        const bottom = rect.top + rect.height * 0.65;

        envelopePath.moveTo(left, top);
        envelopePath.lineTo(right, top);
        envelopePath.lineTo(right, bottom);
        envelopePath.lineTo(left, bottom);
        envelopePath.closePath();

        // Draw the flap of the envelope
        envelopePath.moveTo(left, top);
        envelopePath.lineTo((left + right) / 2, (top + bottom) / 2);
        envelopePath.lineTo(right, top);

        context.stroke(envelopePath);
    }

    /**
     * Renders a clock inside the circle for timer events.
     * Assumes the context is already prepared and the circle shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderTimer(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Reduce line width for the clock

        const clockPath = new Path2D();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = Math.min(rect.width, rect.height) * 0.2;

        // Draw the clock circle
        clockPath.arc(centerX, centerY, radius, 0, 2 * Math.PI);

        // Draw the clock hands
        clockPath.moveTo(centerX, centerY);
        clockPath.lineTo(centerX, centerY - radius * 0.6); // Hour hand
        clockPath.moveTo(centerX, centerY);
        clockPath.lineTo(centerX + radius * 0.9, centerY); // Minute hand

        context.stroke(clockPath);
    }

    /**
     * Renders a signal inside the circle for signal events.
     * Assumes the context is already prepared and the circle shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderSignal(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Reduce line width for the triangle

        const trianglePath = new Path2D();
        const left = rect.left + rect.width * 0.3;
        const right = rect.left + rect.width * 0.7;
        const top = rect.top + rect.height * 0.25;
        const bottom = rect.top + rect.height * 0.65;

        trianglePath.moveTo((left + right) / 2, top); // Top vertex
        trianglePath.lineTo(right, bottom); // Bottom right vertex
        trianglePath.lineTo(left, bottom); // Bottom left vertex
        trianglePath.closePath();

        context.stroke(trianglePath);
    }

    /**
     * Renders an exclamation mark inside the circle for error events.
     * Assumes the context is already prepared and the circle shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderError(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Reduce line width for the exclamation mark

        const exclamationPath = new Path2D();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const height = Math.min(rect.width, rect.height) * 0.4;

        // Draw the vertical line of the exclamation mark
        exclamationPath.moveTo(centerX, centerY - height / 2);
        exclamationPath.lineTo(centerX, centerY + height / 4);

        // Draw the dot of the exclamation mark
        exclamationPath.moveTo(centerX, centerY + height / 2);
        exclamationPath.arc(centerX, centerY + height / 2, height / 20, 0, 2 * Math.PI);

        context.stroke(exclamationPath);
    }

    /**
     * Renders a cancel "X" inside the circle for cancel events.
     * Assumes the context is already prepared and the circle shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderCancel(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Reduce line width for the "X"

        const cancelPath = new Path2D();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const size = Math.min(rect.width, rect.height) * 0.2;

        cancelPath.moveTo(centerX - size, centerY - size);
        cancelPath.lineTo(centerX + size, centerY + size);
        cancelPath.moveTo(centerX - size, centerY + size);
        cancelPath.lineTo(centerX + size, centerY - size);

        context.stroke(cancelPath);
    }

    /**
     * Renders an upward arrow inside the circle for escalation events.
     * Assumes the context is already prepared and the circle shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderEscalation(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Keep marker strokes subtle inside events

        const path = new Path2D();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const h = Math.min(rect.width, rect.height) * 0.36;
        const headW = h * 0.46;
        const stemH = h * 0.34;
        const top = cy - h / 2;
        const shoulderY = top + h * 0.62;
        const bottom = shoulderY + stemH;

        // BPMN escalation marker: outlined arrowhead + short stem to avoid signal-like triangle look.
        path.moveTo(cx, top);
        path.lineTo(cx + headW / 2, shoulderY);
        path.lineTo(cx - headW / 2, shoulderY);
        path.closePath();
        path.moveTo(cx, shoulderY);
        path.lineTo(cx, bottom);

        context.stroke(path);
    }

    /**
     * Renders a rewind symbol inside the circle for compensation events.
     * Assumes the context is already prepared and the circle shape is drawn.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Indicates whether to render fully ('all') or quickly ('quick').
     */
    public static renderCompensation(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Keep marker strokes subtle inside events

        const path = new Path2D();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const h = Math.min(rect.width, rect.height) * 0.34;
        const w = h * 0.62;
        const gap = w * 0.18;

        // BPMN compensation marker: two left-pointing outlined triangles (rewind)
        const leftMost = cx - ((2 * w) + gap) / 1.6;
        const right1 = leftMost + w;
        path.moveTo(leftMost, cy);
        path.lineTo(right1, cy - h / 2);
        path.lineTo(right1, cy + h / 2);
        path.closePath();

        const left2 = right1 + gap;
        const right2 = left2 + w;
        path.moveTo(left2, cy);
        path.lineTo(right2, cy - h / 2);
        path.lineTo(right2, cy + h / 2);
        path.closePath();

        context.stroke(path);
    }

    // public static renderMultiple(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
    //     context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the multiple lines

    //     const multiplePath = new Path2D();
    //     const left = rect.left + rect.width * 0.3;
    //     const right = rect.left + rect.width * 0.7;
    //     const top = rect.top + rect.height * 0.3;
    //     const bottom = rect.top + rect.height * 0.7;

    //     // Draw three horizontal lines to represent multiple instances
    //     const lineSpacing = (bottom - top) / 4;
    //     for (let i = 0; i < 3; i++) {
    //         const y = top + i * lineSpacing;
    //         multiplePath.moveTo(left, y);
    //         multiplePath.lineTo(right, y);
    //     }

    //     context.stroke(multiplePath);
    // }

    // public static renderParallelMultiple(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
    //     context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the parallel multiple lines

    //     const parallelMultiplePath = new Path2D();
    //     const left = rect.left + rect.width * 0.3;
    //     const right = rect.left + rect.width * 0.7;
    //     const top = rect.top + rect.height * 0.3;
    //     const bottom = rect.top + rect.height * 0.7;

    //     // Draw three vertical lines to represent parallel multiple instances
    //     const lineSpacing = (right - left) / 4;
    //     for (let i = 0; i < 3; i++) {
    //         const x = left + i * lineSpacing;
    //         parallelMultiplePath.moveTo(x, top);
    //         parallelMultiplePath.lineTo(x, bottom);
    //     }

    //     context.stroke(parallelMultiplePath);
    // }

    // public static renderSignalMultiple(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
    //     context.lineWidth = Math.max(2, context.lineWidth); // Increase line width for the multiple triangles

    //     const signalMultiplePath = new Path2D();
    //     const left = rect.left + rect.width * 0.3;
    //     const right = rect.left + rect.width * 0.7;
    //     const top = rect.top + rect.height * 0.3;
    //     const bottom = rect.top + rect.height * 0.7;

    //     // Draw three triangles to represent multiple signals
    //     const triangleSpacing = (bottom - top) / 4;
    //     for (let i = 0; i < 3; i++) {
    //         const yOffset = i * triangleSpacing;
    //         signalMultiplePath.moveTo((left + right) / 2, top + yOffset); // Top vertex
    //         signalMultiplePath.lineTo(right, bottom - yOffset); // Bottom right vertex
    //         signalMultiplePath.lineTo(left, bottom - yOffset); // Bottom left vertex
    //         signalMultiplePath.closePath();
    //     }

    //     context.stroke(signalMultiplePath);
    // }

    /**
     * Renders a diamond shape for conditional events.
     * Assumes the context is already prepared and the bounding rectangle is provided.
     * @param rect The bounding rectangle of the node.
     * @param context The canvas rendering context.
     * @param show Optional parameter to control rendering detail ('all' | 'quick').
     */
    public static renderConditional(rect: IRect, context: CanvasRenderingContext2D, show?: 'all' | 'quick'): void {
        context.lineWidth = Math.min(2, context.lineWidth); // Reduce line width for the diamond

        const conditionalPath = new Path2D();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const diamondWidth = Math.min(rect.width, rect.height) * 0.4;
        const diamondHeight = Math.min(rect.width, rect.height) * 0.4;

        conditionalPath.moveTo(centerX, centerY - diamondHeight / 2); // Top vertex
        conditionalPath.lineTo(centerX + diamondWidth / 2, centerY); // Right vertex
        conditionalPath.lineTo(centerX, centerY + diamondHeight / 2); // Bottom vertex
        conditionalPath.lineTo(centerX - diamondWidth / 2, centerY); // Left vertex
        conditionalPath.closePath();

        context.stroke(conditionalPath);
    }

}