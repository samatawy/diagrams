import { injectStyles, setClasses } from "./editor.utils";

import DEFAULT_STYLES from '../css_generated/editor/prompt.dialog.css';
const STYLE_ID = 'diagram-editor-prompt-dialog';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * A single action in a prompt dialog, consisting of a value, label, and optional primary flag.
 */
export type PromptDialogAction<T extends string> = {
    /**
     * The value associated with this action. This value will be returned when the action is selected.
     */
    value: T;
    /**
     * The label displayed on the button for this action.
     */
    label: string;
    /**
     * Whether this action is the primary action. Primary actions are typically highlighted.
     */
    primary?: boolean;
};

/**
 * Options for configuring a prompt dialog, including title, prompt message, optional icon, and a list of actions.
 */
export type PromptDialogOptions<T extends string> = {
    /**
     * The title of the prompt dialog.
     */
    title?: string;
    /**
     * The message or question to display in the prompt dialog.
     */
    prompt: string;
    /**
     * An optional icon to display in the prompt dialog.
     */
    icon?: string;
    /**
     * The list of actions available in the prompt dialog.
     */
    actions: PromptDialogAction<T>[];
};

/**
 * A simple prompt dialog component that can be used to display a message and a set of actions to the user.
 * It uses the native HTML <dialog> element if available, and falls back to a confirm dialog if not.
 * The component returns a promise that resolves with the value of the selected action.
 */
export class PromptDialog {

    /**
     * Displays a prompt dialog with the specified options.
     * @param input The options for configuring the prompt dialog.
     * @returns A promise that resolves with the value of the selected action.
     */
    public static show<T extends string>(input: PromptDialogOptions<T>): Promise<T> {
        if (!this.supportsDialog()) {
            return Promise.resolve(this.fallback(input));
        }

        ensureDefaultStyles();

        return new Promise<T>((resolve) => {
            const dialog = this.buildDialog(input);

            dialog.addEventListener('close', () => {
                const chosen = (dialog.dataset.result as T | undefined) ?? input.actions[0]!.value;
                dialog.remove();
                resolve(chosen);
            }, { once: true });

            document.body.appendChild(dialog);
            dialog.showModal();
        });
    }

    /**
     * Falls back to window.confirm when the HTMLDialogElement API is unavailable.
     * Returns the primary action value if the user confirms, the cancel value otherwise.
     * @param input The same options passed to {@link show}.
     * @returns The resolved action value.
     */
    private static fallback<T extends string>(input: PromptDialogOptions<T>): T {
        const primary = input.actions.find((a) => a.primary) ?? input.actions[0]!;
        const cancel = [...input.actions].reverse().find((a) => !a.primary) ?? input.actions[0]!;

        if (typeof window === 'undefined') {
            return primary.value;
        }

        return window.confirm(input.prompt) ? primary.value : cancel.value;
    }

    /**
     * Constructs the `<dialog>` element containing the prompt head and action buttons.
     * @param input The dialog options.
     * @returns The constructed dialog element.
     */
    private static buildDialog<T extends string>(input: PromptDialogOptions<T>): HTMLDialogElement {
        const dialog = document.createElement('dialog');
        setClasses(dialog, 'diagram-prompt-backdrop', 'diagram-prompt');

        dialog.appendChild(this.buildHead(input));
        dialog.appendChild(this.buildActions(input));

        return dialog;
    }

    /**
     * Builds the header section with an optional icon, title, and prompt message.
     * @param input The dialog options.
     * @returns The constructed header element.
     */
    private static buildHead<T extends string>(input: PromptDialogOptions<T>): HTMLElement {
        const head = document.createElement('div');
        setClasses(head, 'diagram-prompt-head');

        if (input.icon) {
            const icon = document.createElement('div');
            setClasses(icon, 'diagram-prompt-icon');
            icon.textContent = input.icon;
            head.appendChild(icon);
        }

        const body = document.createElement('div');

        if (input.title) {
            const title = document.createElement('h3');
            title.textContent = input.title;
            body.appendChild(title);
        }

        const message = document.createElement('p');
        message.textContent = input.prompt;
        body.appendChild(message);

        head.appendChild(body);

        return head;
    }

    /**
     * Builds the action button row, marking the primary action button with the 'primary' class.
     * @param input The dialog options.
     * @returns The constructed actions container element.
     */
    private static buildActions<T extends string>(input: PromptDialogOptions<T>): HTMLElement {
        const actions = document.createElement('div');
        setClasses(actions, 'diagram-prompt-actions');

        for (const option of input.actions) {
            const button = document.createElement('button');
            button.type = 'button';
            if (option.primary) {
                setClasses(button, 'primary');
            }
            button.textContent = option.label;
            button.addEventListener('click', (event) => {
                const dialog = (event.target as HTMLElement).closest('dialog') as HTMLDialogElement;
                dialog.dataset.result = option.value;
                dialog.close();
            });
            actions.appendChild(button);
        }

        return actions;
    }

    /**
     * Returns true when the browser supports the native HTMLDialogElement API.
     * @returns True when `<dialog>` is available.
     */
    private static supportsDialog(): boolean {
        return typeof document !== 'undefined' && typeof HTMLDialogElement !== 'undefined';
    }
}
