
export type AnimationMode = 'instant' | 'animate';

export type AnimationState = 'idle' | 'running';

export type AnimationChannelType = 'linedash' | 'viewport' | 'other';

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
    // enabled: boolean;
    // animate: boolean;
    // fps: number;
    dashOffset: number;
    // lastFrame?: number;
    // lastTimestamp?: number;
}

export interface AnimationViewport extends AnimationChannel {
    type: 'viewport';
    token: number;
    target: {
        zoom?: number;
        pan?: { x: number, y: number };
    };
}
