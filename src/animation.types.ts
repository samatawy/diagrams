import type { IPoint, IRect } from "./types";

export type AnimationMode = 'instant' | 'animate';

export type AnimationState = 'idle' | 'running';

export type AnimationChannelType = 'linedash' | 'node' | 'shutter' | 'viewport' | 'other';

export interface AnimationConfig {
    enabled: boolean;
    fps: number;
}

export interface AnimationChannel {
    type: AnimationChannelType;
    state: AnimationState;
    lastFrame?: number;
    lastTimestamp?: number;
}

export interface AnimationLineDash extends AnimationChannel {
    type: 'linedash';
    dashOffset: number;
}

export interface AnimationNodeCenter extends AnimationChannel {
    type: 'node';
    target: IPoint;
}

export interface AnimationNodeShutter extends AnimationChannel {
    type: 'shutter';
    node: string;
    target?: IRect;
    cutout?: IRect;
    fillStyle?: string;
    strokeStyle?: string;
}

export interface AnimationViewport extends AnimationChannel {
    type: 'viewport';
    token: number;
    target: {
        zoom?: number;
        pan?: { x: number, y: number };
    };
}
