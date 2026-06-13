import { injectStyles, setClasses } from "./editor.utils";

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

const STYLE_ID = 'diagram-editor-prompt-dialog';

const STYLES = `
.diagram-prompt-backdrop::backdrop {
    background: rgba(15, 23, 42, 0.36);
    backdrop-filter: blur(1.5px);
}
.diagram-prompt {
    border: 1px solid rgba(15, 23, 42, 0.16);
    border-radius: 14px;
    min-width: 320px;
    max-width: min(92vw, 420px);
    padding: 14px;
    background: #ffffff;
    color: #1f2937;
    box-shadow: 0 16px 48px rgba(15, 23, 42, 0.28);
    font: 500 13px/1.45 -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}
.diagram-prompt-head {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: 9px;
}
.diagram-prompt-icon {
    width: 22px;
    height: 22px;
    line-height: 22px;
    text-align: center;
    border-radius: 999px;
    font-size: 13px;
    background: rgba(15, 118, 110, 0.1);
    color: #0f766e;
}
.diagram-prompt h3 {
    margin: 0 0 6px;
    font: 700 15px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #0f172a;
}
.diagram-prompt p {
    margin: 0;
    color: #334155;
}
.diagram-prompt-actions {
    margin-top: 14px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
.diagram-prompt-actions button {
    border: 1px solid rgba(15, 23, 42, 0.18);
    border-radius: 9px;
    background: #ffffff;
    color: #334155;
    padding: 6px 11px;
    font: 600 12px/1.1 -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    cursor: pointer;
}
.diagram-prompt-actions button:hover {
    border-color: rgba(15, 118, 110, 0.45);
    color: #0f172a;
}
.diagram-prompt-actions button.primary {
    border-color: rgba(15, 118, 110, 0.5);
    background: rgba(15, 118, 110, 0.12);
    color: #0f766e;
}
`;

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

        this.ensureStyles();

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

    private static fallback<T extends string>(input: PromptDialogOptions<T>): T {
        const primary = input.actions.find((a) => a.primary) ?? input.actions[0]!;
        const cancel = [...input.actions].reverse().find((a) => !a.primary) ?? input.actions[0]!;

        if (typeof window === 'undefined') {
            return primary.value;
        }

        return window.confirm(input.prompt) ? primary.value : cancel.value;
    }

    private static buildDialog<T extends string>(input: PromptDialogOptions<T>): HTMLDialogElement {
        const dialog = document.createElement('dialog');
        setClasses(dialog, 'diagram-prompt-backdrop', 'diagram-prompt');

        dialog.appendChild(this.buildHead(input));
        dialog.appendChild(this.buildActions(input));

        return dialog;
    }

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

    private static supportsDialog(): boolean {
        return typeof document !== 'undefined' && typeof HTMLDialogElement !== 'undefined';
    }

    private static ensureStyles(): void {
        injectStyles(STYLE_ID, STYLES);
    }
}
