import type { AnimationConfig, AnimationChannel, AnimationLineDash, AnimationChannelType, AnimationViewport, AnimationNodeCenter, AnimationNodeShutter, AnimationLayout } from "../animation.types";
import { withAlpha } from "../editor/gradient/color.utils";
import { NodeRegistry } from "../factory";
import type { INode } from "../interfaces";
import { DiagramConstants } from "../model";
import { NodeBasics, RenderBasics } from "../nodes";
import type { IPoint, IRect } from "../types";
import { deepClone, nodeFontSize } from "../value.utils";
import type { CoordinateSystem, DiagramView } from "../view";

export class DiagramAnimations {

    private diagram: DiagramView;

    private config: AnimationConfig;

    private map: Map<string, AnimationChannel> = new Map();

    constructor(diagram: DiagramView, options: AnimationConfig) {
        this.diagram = diagram;
        this.config = options;
    }

    public get enabled(): boolean {
        return this.config.enabled;
    }

    public set enabled(value: boolean) {
        this.config.enabled = value;
    }

    public get fps(): number {
        return this.config.fps;
    }

    public set fps(value: number) {
        this.config.fps = value;
    }

    public get lineDashOffset(): number {
        for (const channel of this.map.values()) {
            if (channel.type === 'linedash' && channel.state !== 'idle') {
                return (channel as AnimationLineDash).dashOffset;
            }
        }
        return 0;
    }

    public startAnimation(type: AnimationChannelType, id: string | undefined, func: () => void): void {
        id = id ?? type;

        this.stopAnimation(id);
        if (!this.config.enabled) {
            func();
            return;
        }

        let channel = this.map.get(id);
        if (!channel) {
            channel = this.addChannel({
                type,
                state: 'idle',
            }, id);
            // channel = this.newAnimation(type, id);
        }

        channel!.state = 'running';
        channel!.lastTimestamp = performance.now();

        switch (type) {
            case 'linedash':
                throw new Error('Line dash animation should be started using animateLineDash() method.');

            case 'node':
                throw new Error('Node animation should be started using animateNode() method.');

            case 'shutter':
                throw new Error('Shutter animation should be started using animateNodeShutter() method.');

            case 'viewport':
                throw new Error('Viewport animation should be started using animateViewport() method.');

            case 'layout':
                throw new Error('Layout animation should be started using animateLayout() method.');

            default:
                this.doAnimate(func);
                break;
        }
        // animation!.lastFrame = requestAnimationFrame(() => this.renderAnimated(func));
    }

    public stopAnimation(channel: string): void {
        const animation = this.map.get(channel);
        if (!animation) return;

        if (animation.lastFrame) {
            cancelAnimationFrame(animation.lastFrame);
            animation.lastFrame = undefined;
            animation.lastTimestamp = undefined;
        }
        animation.state = 'idle';
        // this.map.delete(channel);
    }

    public stopAnimationsByType(type: AnimationChannelType): void {
        for (const [id, animation] of this.map.entries()) {
            if (animation.type === type) {
                this.stopAnimation(id);
            }
        }
    }

    public animateLineDash(id: string, func: () => void): void {
        let channel = this.map.get(id) as AnimationLineDash | undefined;
        if (!channel) {
            channel = this.addChannel<AnimationLineDash>({
                type: 'linedash',
                state: 'idle',
                dashOffset: 0,
            }, id);
            // channel = this.newAnimation('linedash', id) as AnimationLineDash;
        }
        channel.state = 'running';
        channel.lastTimestamp = performance.now();

        this.doAnimateLineDash(channel, func ?? (() => this.doAnimateLineDash(channel, func)));
    }

    public animateNodeCenter(node: INode, target: IPoint, func: () => void): void {
        let channel = this.map.get(node.id) as AnimationNodeCenter | undefined;
        if (!channel) {
            channel = this.addChannel<AnimationNodeCenter>({
                type: 'node',
                state: 'idle',
                target: deepClone(target),
            }, node.id);
            // channel = this.newAnimation('node', node.id) as AnimationNodeCenter;
        }
        channel.target = target;

        this.doAnimateNodeCenter(channel, node, target, func);
    }

    public animateNodeShutter(node: INode, func: () => void): void {
        // let channel = this.map.get(`shutter-${node.id}`) as AnimationNodeShutter | undefined;
        // if (!channel) {
        //     channel = this.newAnimation('shutter', `shutter-${node.id}`) as AnimationNodeShutter;
        // }
        let channel = this.map.get(`shutter`) as AnimationNodeShutter | undefined;
        if (channel) {
            if (channel.node && channel.node !== node.id) {
                channel.cutout = { ...channel.target } as IRect;
                channel.target = undefined;
            }
        } else {
            channel = this.addChannel<AnimationNodeShutter>({
                type: 'shutter',
                state: 'idle',
                node: node.id,
            }, `shutter`);
            // channel = this.newAnimation('shutter', `shutter`) as AnimationNodeShutter;
        }
        channel.node = node.id;
        if (node.owner.background?.color) {
            channel.fillStyle = withAlpha(node.owner.background.color, 0.75);
        } else {
            channel.fillStyle = withAlpha(DiagramConstants.CANVAS_BACKGROUND_COLOR, 0.75);
        }
        // channel.strokeStyle = withAlpha('rgba(0, 0, 0, 0.25)', 0.25);
        channel.strokeStyle = withAlpha(DiagramConstants.GUIDE_STROKE_COLOR, 0.75);

        this.doAnimateNodeShutter(channel, node, func);
    }

    public animateLayout(nodes: INode[], func: () => void): void {
        let channel = this.map.get('layout') as AnimationLayout | undefined;
        if (channel) {
            this.applyLayoutProgress(channel, 1); /* Apply the current layout before starting a new one */
            channel.state = 'idle';
            channel.progress = 0;
            channel.nodes = nodes;
        } else {
            channel = this.addChannel<AnimationLayout>({
                type: 'layout',
                state: 'idle',
                nodes: nodes,
                progress: 0,
            }, 'layout');
        }
        // channel.nodes = nodes;

        this.doAnimateLayout(channel, func);
    }

    public animateViewport(target: { zoom?: number, pan?: { x: number, y: number } }, func?: () => void): void {
        let channel = this.map.get('viewport') as AnimationViewport | undefined;
        if (channel) {
            channel.target = target;
        }

        if (!channel) {
            const last = this.map.get('viewport') as AnimationViewport | undefined;
            channel = this.addChannel<AnimationViewport>({
                type: 'viewport',
                state: 'idle',
                token: last ? last.token + 1 : 0,
                target: target,
            }, 'viewport');
        }

        this.doAnimateCoordinates(channel, target, func);
    }

    public stopViewportAnimation(): void {
        const channel = this.map.get('viewport') as AnimationViewport | undefined;
        if (!channel) return;

        if (channel.lastFrame !== undefined) {
            cancelAnimationFrame(channel.lastFrame);
            channel.lastFrame = undefined;
            channel.lastTimestamp = undefined;
        }
        channel.state = 'idle';
    }

    private addChannel<T extends AnimationChannel>(channel: T, id?: string): T {
        this.map.set(id ?? channel.type, channel);
        return channel;
    }

    // private newAnimation(type: AnimationChannelType, id?: string): AnimationChannel {
    //     id = id ?? type;

    //     let animation: AnimationChannel;
    //     if (type === 'linedash') {
    //         animation = {
    //             type: 'linedash',
    //             state: 'idle',
    //             dashOffset: 0,
    //         } as AnimationLineDash;

    //     } else if (type === 'layout') {
    //         animation = {
    //             type: 'layout',
    //             state: 'idle',
    //             nodes: [],
    //             progress: 0,
    //         } as AnimationLayout;

    //     } else if (type === 'viewport') {
    //         // Find the last viewport animation for this type, if it exists, to continue from its state
    //         const last = this.map.get(type) as AnimationViewport | undefined;
    //         animation = {
    //             type: 'viewport',
    //             state: 'idle',
    //             token: last ? last.token + 1 : 0,
    //         } as AnimationViewport;

    //     } else {
    //         animation = {
    //             type,
    //             state: 'idle',
    //         };
    //     }
    //     this.map.set(id, animation);
    //     return animation;
    // }

    private doAnimate(func: () => void): void {
        if (!this.config.enabled) {
            func();
            return;
        }

        const now = performance.now();
        const channel = this.map.get('other');
        if (!channel) return;

        if (channel.state !== 'running' || !channel.lastTimestamp) {
            return;
        }

        const delta = (now - channel.lastTimestamp);
        const interval = 1000 / this.config.fps;

        if (delta >= interval) {
            func();
            channel.lastTimestamp = now;
        }

        channel.lastFrame = requestAnimationFrame(() => this.doAnimate(func));
    }

    private doAnimateLineDash(channel: AnimationLineDash, func: () => void): void {
        if (channel.state !== 'running' || !channel.lastTimestamp) {
            return;
        }

        const now = performance.now();
        const delta = (now - channel.lastTimestamp);
        const interval = 1000 / this.config.fps;
        const offset = (delta / interval) * 0.25;

        channel.dashOffset -= offset;
        // if (channel.dashOffset < -12) {
        //     channel.dashOffset = 0;
        // }

        if (func) {
            func();
        }

        channel.lastTimestamp = now;
        channel.lastFrame = requestAnimationFrame(() => this.doAnimateLineDash(channel, func));
    }

    private doAnimateNodeCenter(channel: AnimationNodeCenter, node: INode, target: IPoint, func: () => void): void {
        if (!this.config.enabled) {
            node.points[0] = deepClone(target);
            func();
            return;
        }

        this.stopAnimation(node.id);

        const animate = () => {
            const currentRect = this.diagram.getCoordinates().getBoundingRect(node);
            const currentCenter = {
                x: currentRect.left + currentRect.width / 2,
                y: currentRect.top + currentRect.height / 2
            };
            const dx = target.x - currentCenter.x;
            const dy = target.y - currentCenter.y;

            const attainedX = Math.abs(dx) < 0.5;
            const attainedY = Math.abs(dy) < 0.5;

            if (attainedX && attainedY) {
                channel.lastFrame = undefined;
                NodeBasics.moveBy(node, dx, dy); /* Move the node to the target position */
                func();
                return;
            }

            const step = 0.2; /* Adjust this value for smoother or faster animation */

            NodeBasics.moveBy(node, dx * step, dy * step);
            func();

            channel.lastFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    private doAnimateNodeShutter(channel: AnimationNodeShutter, node: INode, func: () => void): void {
        if (!this.config.enabled) {
            func();
            return;
        }
        /* If used, this line forces every shutter animation to start from scratch. So we cannot transfer shutter between nodes. */
        // channel.cutout = undefined;

        this.stopAnimation(`shutter`);

        const animate = () => {
            const canvas = this.diagram.getCanvas();
            const context = canvas.getContext('2d');
            if (!context) return;

            const shutterCanvas = document.createElement('canvas');
            const shutterContext = shutterCanvas.getContext('2d');
            if (!shutterContext) return;

            shutterCanvas.width = canvas.width;
            shutterCanvas.height = canvas.height;

            const coordinates = this.diagram.getCoordinates();

            const canvasFullRect: IRect = {
                left: 0,
                top: 0,
                width: canvas.width,
                height: canvas.height
            };

            /* We cannot use the cached target since the canvas may be panning/zooming during the animation */
            let nodeRect = this.getShutterRect(node, coordinates);

            /* Transform nodeRect to canvas coordinates so we can draw with identity transform */
            nodeRect.left = (nodeRect.left * coordinates.zoom - coordinates.pan.x) * coordinates.pixelRatio;
            nodeRect.top = (nodeRect.top * coordinates.zoom - coordinates.pan.y) * coordinates.pixelRatio;
            nodeRect.width = nodeRect.width * coordinates.zoom * coordinates.pixelRatio;
            nodeRect.height = nodeRect.height * coordinates.zoom * coordinates.pixelRatio;

            /* This MUST be kept to support moving shutter between nodes! */
            channel.target = { ...nodeRect };

            if (!channel.cutout) {
                channel.cutout = deepClone(canvasFullRect);
            }
            const cutout = channel.cutout!;

            const dLeft = nodeRect.left - channel.cutout!.left;
            const dTop = nodeRect.top - channel.cutout!.top;
            const dWidth = nodeRect.width - channel.cutout!.width;
            const dHeight = nodeRect.height - channel.cutout!.height;

            const attainedLeft = Math.abs(dLeft) < 0.5;
            const attainedTop = Math.abs(dTop) < 0.5;
            const attainedWidth = Math.abs(dWidth) < 0.5;
            const attainedHeight = Math.abs(dHeight) < 0.5;

            if (attainedLeft && attainedTop && attainedWidth && attainedHeight) {
                channel.lastFrame = undefined;
                channel.cutout = deepClone(nodeRect);
                func();
                return;
            }

            const step = 0.15; /* Adjust this value for smoother or faster animation */

            cutout.left += dLeft * step;
            cutout.top += dTop * step;
            cutout.width += dWidth * step;
            cutout.height += dHeight * step;

            this.diagram.render('all');

            // Draw with identity tranform since we already transformed the cutout to canvas coordinates
            shutterContext.transform(1, 0, 0, 1, 0, 0); // Reset any existing transformations
            // context.transform(coordinates.zoom * coordinates.pixelRatio, 0, 0, coordinates.zoom * coordinates.pixelRatio, -coordinates.pan.x * coordinates.zoom * coordinates.pixelRatio, -coordinates.pan.y * coordinates.zoom * coordinates.pixelRatio);

            const padding = DiagramConstants.HANDLE_HIT_EPSILON * 2 * coordinates.pixelRatio;

            if (channel.fillStyle) {
                shutterContext.save();
                // First, fill the entire canvas
                shutterContext.fillStyle = channel.fillStyle;   // 'rgba(0, 0, 0, 0.05)';
                shutterContext.clearRect(canvasFullRect.left, canvasFullRect.top, canvasFullRect.width, canvasFullRect.height);
                shutterContext.fillRect(canvasFullRect.left, canvasFullRect.top, canvasFullRect.width, canvasFullRect.height);

                // Punch hole for the shape
                shutterContext.globalCompositeOperation = 'destination-out';
                shutterContext.fillStyle = 'rgba(0, 0, 0, 1)';

                // Use bounding box (fast)
                const path = new Path2D();
                path.roundRect(
                    cutout.left - padding,
                    cutout.top - padding,
                    cutout.width + 2 * padding,
                    cutout.height + 2 * padding,
                    padding * 2
                );
                shutterContext.fill(path);
                shutterContext.restore();
            }

            // context.fillRect(channel.cutout.left, channel.cutout.top, channel.cutout.width, channel.cutout.height);

            // shutterContext.globalCompositeOperation = 'source-over';

            if (channel.strokeStyle) {
                shutterContext.save();
                shutterContext.strokeStyle = channel.strokeStyle;
                // shutterContext.fillStyle = 'rgba(0, 0, 0, 0)';
                // shutterContext.lineJoin = 'round';
                shutterContext.lineWidth = 1 * coordinates.pixelRatio;
                shutterContext.setLineDash([6 / coordinates.zoom, 4 / coordinates.zoom]);
                // shutterContext.filter = 'blur(3px)';
                // shutterContext.lineWidth = 2 * coordinates.pixelRatio;  // * shrink;
                // shutterContext.setLineDash([shrink, shrink]);
                const path = new Path2D();
                path.roundRect(
                    cutout.left - padding,
                    cutout.top - padding,
                    cutout.width + 2 * padding,
                    cutout.height + 2 * padding,
                    padding * 2
                );
                shutterContext.stroke(path);
                shutterContext.restore();
            }

            context.save();
            context.transform(1, 0, 0, 1, 0, 0); // Reset any existing transformations
            context.drawImage(shutterCanvas, 0, 0);
            context.restore();

            shutterCanvas.remove();

            // if (context) {
            //     context.save();
            //     context.beginPath();
            //     context.rect(channel.cutout.left, channel.cutout.top, channel.cutout.width, channel.cutout.height);
            //     context.clip();
            //     this.diagram.render('all');
            //     context.restore();
            // }

            func();

            channel.lastFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    private getShutterRect(node: INode, coordinates: CoordinateSystem): IRect {
        const minHeight = nodeFontSize(node) * 1.2;
        const minWidth = 10 * minHeight;
        let nodeRect = coordinates.getBoundingRect(node, true);

        let textPlacement = NodeRegistry.adapter(node.type)?.textPlacement(node);
        if (textPlacement?.segment) {

            const segmentWidth = Math.abs(textPlacement.segment.to.x - textPlacement.segment.from.x);
            const segmentHeight = Math.abs(textPlacement.segment.to.y - textPlacement.segment.from.y);
            nodeRect = {
                left: Math.min(textPlacement.segment.from.x, textPlacement.segment.to.x),
                top: Math.min(textPlacement.segment.from.y, textPlacement.segment.to.y),
                width: Math.max(minWidth, segmentWidth),
                height: Math.max(minHeight, segmentHeight)
            }
            if (segmentWidth < minWidth) {
                nodeRect.left = nodeRect.left - (minWidth - segmentWidth) / 2;
            }
            if (segmentHeight < minHeight) {
                nodeRect.top = nodeRect.top - (minHeight - segmentHeight) / 2;
            }
        }

        if (textPlacement?.rect) {
            // Get the default rect for the node type, which may include additional padding or adjustments
            nodeRect = NodeRegistry.adapter(node.type)?.getVisualRect(node, nodeRect) ?? nodeRect;

            // Constrain to minimum editable text size
            if (nodeRect.width < minWidth) {
                nodeRect.left = nodeRect.left - (minWidth - nodeRect.width) / 2;
                nodeRect.width = minWidth;
            }
            if (nodeRect.height < minHeight) {
                nodeRect.top = nodeRect.top - (minHeight - nodeRect.height) / 2;
                nodeRect.height = minHeight;
            }
        }
        return nodeRect;
    }

    private applyLayoutProgress(channel: AnimationLayout, delta: number): void {
        for (const node of channel.nodes) {
            const target = this.diagram.node(node.id);

            /* Rectangle-based */
            if (target && target.points.length === 2 && node.points.length === 2) {
                const planned_first = target.points[0]!;
                const planned_second = target.points[1]!;
                const original_first = node.points[0]!;
                const original_second = node.points[1]!;

                planned_first.x += (original_first.x - planned_first.x) * delta;
                planned_first.y += (original_first.y - planned_first.y) * delta;
                planned_second.x += (original_second.x - planned_second.x) * delta;
                planned_second.y += (original_second.y - planned_second.y) * delta;
            }

            /* Polyline-based */
            if (target && target.points.length > 2 && node.points.length === target.points.length) {
                for (let i = 0; i < node.points.length; i++) {
                    const planned = target.points[i]!;
                    const original = node.points[i]!;

                    planned.x += (original.x - planned.x) * delta;
                    planned.y += (original.y - planned.y) * delta;
                }
            }

            /* Simplified edges */
            if (target && target.points.length >= 2 && node.points.length < target.points.length) {
                const preserve = target.points.slice(0, node.points.length - 1);
                const last = target.points[target.points.length - 1];
                target.points = preserve.concat(last!);

                // const rect = this.diagram.getCoordinates().getBoundingRect(node);
                for (let i = 0; i < node.points.length; i++) {
                    const planned = target.points[i]!;
                    const original = node.points[i]!;

                    planned.x += (original.x - planned.x) * delta;
                    planned.y += (original.y - planned.y) * delta;
                }
            }
        }
        // this.diagram.fitToNodes(); /* Adjust the viewport to fit the nodes after applying the layout progress */
    }

    private doAnimateLayout(channel: AnimationLayout, func: () => void): void {
        if (!this.config.enabled) {
            this.applyLayoutProgress(channel, 1);
            func();
            return;
        }

        const animate = () => {

            channel.progress += 0.02; /* Adjust this value for smoother or faster animation */
            this.applyLayoutProgress(channel, channel.progress);

            const attained = channel.progress > 0.99;

            if (attained) {
                channel.lastFrame = undefined;
                this.applyLayoutProgress(channel, 1);
                func();
                return;
            }

            func();
            this.diagram.render('all');

            channel.lastFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    private doAnimateCoordinates(channel: AnimationViewport, target: { zoom?: number, pan?: { x: number, y: number } }, func?: () => void): void {
        if (!this.config.enabled) {
            this.diagram.setViewport(target);   /* sets and emits events */
            return;
        }

        this.stopViewportAnimation();
        const token = ++channel.token;

        const animate = () => {
            if (token !== channel.token) {
                return;
            }

            const coordinates = this.diagram.getCoordinates();
            const currentZoom = coordinates.zoom;
            const currentPan = deepClone(coordinates.pan);

            const zoomDiff = (target.zoom ?? currentZoom) - currentZoom;
            const panDiff = {
                x: (target.pan?.x ?? currentPan.x) - currentPan.x,
                y: (target.pan?.y ?? currentPan.y) - currentPan.y,
            };

            const attainedZoom = target.zoom === undefined || Math.abs(zoomDiff) < 0.01;
            const attainedPan = target.pan === undefined || (Math.abs(panDiff.x) < 0.5 && Math.abs(panDiff.y) < 0.5);

            if (attainedZoom && attainedPan) {
                channel.lastFrame = undefined;
                this.diagram.setViewport(target); /* Finalize the viewport to the target values */
                if (func) {
                    func();
                } else {
                    this.diagram.render('all');
                }
                return;
            }

            const step = 0.2; /* Adjust this value for smoother or faster animation */

            const nextZoom = currentZoom + (zoomDiff * step);
            const nextPan = {
                x: currentPan.x + (panDiff.x * step),
                y: currentPan.y + (panDiff.y * step),
            };

            coordinates.zoom = nextZoom;
            coordinates.pan = nextPan;

            if (func) {
                func();
            } else {
                this.diagram.render('all');
            }

            channel.lastFrame = requestAnimationFrame(animate);
        };
        animate();
    }

}
