import type { KeyboardShortcut } from "./keyboard.shortcut";
import type { DiagramActionId } from "../editor/diagram.actions";

export class DiagramKeyboard<T> {

    protected readonly shortcuts: KeyboardShortcut<T>[] = [];

    protected register(shortcut: KeyboardShortcut<T>): void {
        this.shortcuts.push(shortcut);
    }

    protected unregister(shortcut: KeyboardShortcut<T>): void {
        const index = this.shortcuts.indexOf(shortcut);
        if (index >= 0) {
            this.shortcuts.splice(index, 1);
        }
    }

    public setShortcut(mappings: string | string[], action: (target: T) => void, help?: string, action_id?: DiagramActionId): void {
        if (!Array.isArray(mappings)) {
            mappings = [mappings];
        }
        for (const mapping of mappings) {
            const parsed = this.parseShortcutSyntax(mapping);
            if (parsed) {
                const { key, shift, ctrl, alt, meta } = parsed;

                // Keep Cmd/Meta bindings macOS-only to avoid accidental
                // Windows key shortcuts when both Ctrl and Cmd are declared.
                if (meta && !this.isMacPlatform()) {
                    continue;
                }

                this.register({ key, shift, ctrl, alt, meta, action, action_id, help });
            }
        }
    }

    private isMacPlatform(): boolean {
        if (typeof navigator === 'undefined') {
            return false;
        }
        return /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform || navigator.userAgent);
    }

    private parseShortcutSyntax(syntax: string): { key: string, shift?: boolean, ctrl?: boolean, alt?: boolean, meta?: boolean } | null {
        const parts = syntax.split('+');
        let key = '';
        let shift = false;
        let ctrl = false;
        let alt = false;
        let meta = false;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]!;

            // // Allow '+' itself to be the terminal key, e.g. 'Ctrl++' or 'Ctrl+Shift++'.
            // if (part === '' && i === parts.length - 1 && syntax.endsWith('+')) {
            //     key = '+';
            //     continue;
            // }

            const lowerPart = part.toLowerCase();
            switch (lowerPart) {
                case 'shift':
                    shift = true;
                    break;
                case 'ctrl':
                case 'control':
                    ctrl = true;
                    break;
                case 'alt':
                    alt = true;
                    break;
                case 'meta':
                case 'cmd':
                case 'command':
                    meta = true;
                    break;
                case 'plus':
                    key = '+';
                    break;
                case 'minus':
                    key = '-';
                    break;
                default:
                    if (part.length > 0) {
                        key = part.toLowerCase();
                    }
            }
        }

        if (key) {
            return { key, shift, ctrl, alt, meta };
        }
        return null;
    }

    public clear(): void {
        this.shortcuts.length = 0;
    }

    public getShortcuts(): KeyboardShortcut<T>[] {
        return [...this.shortcuts];
    }

    public getShortcut(key: string, modifiers: { shift?: boolean, ctrl?: boolean, alt?: boolean, meta?: boolean } = {}): KeyboardShortcut<T> | undefined {
        key = key.toLowerCase();
        const { shift, ctrl, alt, meta } = modifiers;
        return this.shortcuts.find(a =>
            (a.key === key) &&
            (shift === undefined || a.shift === shift) &&
            (ctrl === undefined || a.ctrl === ctrl) &&
            (alt === undefined || a.alt === alt) &&
            (meta === undefined || a.meta === meta)
        );
    }

    public getShortcutBySyntax(syntax: string): KeyboardShortcut<T> | undefined {
        const parsed = this.parseShortcutSyntax(syntax);
        if (!parsed) {
            return undefined;
        }

        const { key, shift, ctrl, alt, meta } = parsed;
        return this.getShortcut(key, { shift, ctrl, alt, meta });
    }

    public getEventShortcut(event: KeyboardEvent): KeyboardShortcut<T> | undefined {
        const key = event.key;
        const shift = event.shiftKey;
        const ctrl = event.ctrlKey;
        const alt = event.altKey;
        const meta = event.metaKey;

        const normalizedKey = key.toLowerCase();
        const candidates = new Set<string>([normalizedKey]);

        // On macOS, Option/Alt can transform event.key into a symbol.
        // Use hardware key code as a stable fallback for letter/digit shortcuts.
        const code = event.code;
        if (code.startsWith('Key') && code.length === 4) {
            candidates.add(code.slice(3).toLowerCase());
        } else if (code.startsWith('Digit') && code.length === 6) {
            candidates.add(code.slice(5));
        }

        for (const candidate of candidates) {
            const shortcut = this.getShortcut(candidate, { shift, ctrl, alt, meta });
            if (shortcut) {
                return shortcut;
            }
        }

        return undefined;
    }

    public invokeEvent(diagram: T, event: KeyboardEvent): boolean {
        const shortcut = this.getEventShortcut(event);
        if (shortcut) {
            console.log(`Invoking action for shortcut`);
            event.preventDefault();
            event.stopPropagation();
            shortcut.action(diagram);
            return true;
        }
        return false;
    }
}
