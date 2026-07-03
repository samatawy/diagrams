import type { AnimationConfig, AnimationChannel, AnimationLineDash, AnimationChannelType, AnimationViewport, AnimationNodeCenter } from "../animation.types";
import type { INode } from "../interfaces";
import { NodeBasics } from "../nodes";
import type { IPoint, IRect } from "../types";
import type { DiagramView } from "../view";

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
            channel = this.newAnimation(type, id);
        }

        channel!.state = 'running';
        channel!.lastTimestamp = performance.now();

        switch (type) {
            case 'linedash':
                throw new Error('Line dash animation should be started using animateLineDash() method.');

            case 'node':
                throw new Error('Node animation should be started using animateNode() method.');

            case 'viewport':
                throw new Error('Viewport animation should be started using animateViewport() method.');

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
            channel = this.newAnimation('linedash', id) as AnimationLineDash;
        }
        channel.state = 'running';
        channel.lastTimestamp = performance.now();

        this.doAnimateLineDash(channel, func ?? (() => this.doAnimateLineDash(channel, func)));
    }

    public animateNodeCenter(node: INode, target: IPoint, func: () => void): void {
        let channel = this.map.get(node.id) as AnimationNodeCenter | undefined;
        if (!channel) {
            channel = this.newAnimation('node', node.id) as AnimationNodeCenter;
        }
        channel.target = target;

        this.doAnimateNodeCenter(channel, node, target, func);
    }

    public animateViewport(target: { zoom?: number, pan?: { x: number, y: number } }, func?: () => void): void {
        let channel = this.map.get('viewport') as AnimationViewport | undefined;
        if (!channel) {
            channel = this.newAnimation('viewport', 'viewport') as AnimationViewport;
        }
        channel.target = target;

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

    private newAnimation(type: AnimationChannelType, id?: string): AnimationChannel {
        id = id ?? type;

        let animation: AnimationChannel;
        if (type === 'linedash') {
            animation = {
                type: 'linedash',
                state: 'idle',
                dashOffset: 0,
            } as AnimationLineDash;

        } else if (type === 'viewport') {
            // Find the last viewport animation for this type, if it exists, to continue from its state
            const last = this.map.get(type) as AnimationViewport | undefined;
            animation = {
                type: 'viewport',
                state: 'idle',
                token: last ? last.token + 1 : 0,
            } as AnimationViewport;

        } else {
            animation = {
                type,
                state: 'idle',
            };
        }
        this.map.set(id, animation);
        return animation;
    }

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
            node.points[0] = { ...target };
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
            const currentPan = { ...coordinates.pan };

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
