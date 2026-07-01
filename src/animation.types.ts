export interface AnimationConfig {
    enabled: boolean;
    animate: boolean;
    fps: number;
    dashOffset: number;
    lastFrame?: number;
    lastTimestamp?: number;
}

export type AnimationMode = 'instant' | 'animate';
