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
     * The action to be performed when the specified key is pressed. This can be a function that executes the desired behavior or a string that references a predefined action.
     */
    action: (target: T) => void;
}