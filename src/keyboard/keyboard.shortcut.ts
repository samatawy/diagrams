import type { DiagramActionId } from "../editor/diagram.actions";

export interface KeyboardShortcut<T extends any> {
    /**
     * The key code associated with the action, which can be a string representing a single character (e.g., 'A', 'B', 'C') 
     * or a special key identifier (e.g., 'Enter', 'Escape').
     */
    key: string;

    /**
     * Indicates whether the Shift key must be pressed for the action to be triggered.
     */
    shift?: boolean;

    /**
     * Indicates whether the Control key must be pressed for the action to be triggered.
     */
    ctrl?: boolean;

    /**
     * Indicates whether the Alt key must be pressed for the action to be triggered.
     */
    alt?: boolean;

    /**
     * Indicates whether the Meta key (Command on Mac, Windows key on Windows) must be pressed for the action to be triggered.
     */
    meta?: boolean;

    /**
     * A brief description of the action, which can be used for tooltips or documentation purposes.
     */
    help?: string;

    /**
     * An optional identifier for the action, which can be used to reference predefined actions in the system.
     * If provided, this ID should correspond to a valid action in the system's action registry.
     */
    action_id?: DiagramActionId;

    /**
     * The action to be performed when the specified key is pressed. This can be a function that executes the desired behavior or a string that references a predefined action.
     */
    action: (target: T) => void;
}

export function formatShortcut(shortcut?: string | string[]): string | undefined {
    if (!shortcut) {
        return undefined;
    }

    const options = Array.isArray(shortcut) ? shortcut : [shortcut];
    const preferred = options.filter((one) => isMacPlatform() ? one.includes("Cmd") : one.includes("Ctrl"));
    const candidate = (preferred[0] || options[0] || "").trim();
    if (!candidate) {
        return undefined;
    }

    return normalizeShortcut(candidate);
}

function normalizeShortcut(shortcut: string): string {
    let normalized = shortcut;

    if (isMacPlatform()) {
        normalized = normalized
            .replace(/Ctrl/g, "Cmd")
            .replace(/Alt/g, "Option");
    } else {
        normalized = normalized
            .replace(/Cmd/g, "Ctrl")
            .replace(/Option/g, "Alt");
    }

    return normalized;
}

export function isMacPlatform(): boolean {
    if (typeof navigator === "undefined") {
        return false;
    }

    return /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform || navigator.userAgent);
}