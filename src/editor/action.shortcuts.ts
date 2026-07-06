import type { DiagramActionId } from './diagram.actions';
import { DiagramEditViewKeyboard } from '../editview/edit.keyboard';

const keyboard = new DiagramEditViewKeyboard();
let actionShortcutIndex: Map<DiagramActionId, string[]> | undefined;

function isMacPlatform(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform || navigator.userAgent);
}

function keyName(key: string): string {
    const normalized = key.toLowerCase();
    if (normalized === '+') {
        return 'Plus';
    }
    if (normalized === '-') {
        return 'Minus';
    }
    if (normalized.startsWith('arrow')) {
        return `Arrow${normalized.slice(5, 6).toUpperCase()}${normalized.slice(6)}`;
    }
    if (normalized.length === 1 && /[a-z]/.test(normalized)) {
        return normalized.toUpperCase();
    }
    return normalized.slice(0, 1).toUpperCase() + normalized.slice(1);
}

function toShortcutSyntax(shortcut: { key: string, shift?: boolean, ctrl?: boolean, alt?: boolean, meta?: boolean }): string {
    const parts: string[] = [];
    if (shortcut.ctrl) {
        parts.push('Ctrl');
    }
    if (shortcut.meta) {
        parts.push('Cmd');
    }
    if (shortcut.alt) {
        parts.push('Alt');
    }
    if (shortcut.shift) {
        parts.push('Shift');
    }
    parts.push(keyName(shortcut.key));
    return parts.join('+');
}

function buildActionShortcutIndex(): Map<DiagramActionId, string[]> {
    const index = new Map<DiagramActionId, string[]>();

    for (const shortcut of keyboard.getShortcuts()) {
        if (!shortcut.action_id) {
            continue;
        }

        const actionId = shortcut.action_id;
        const nextSyntax = toShortcutSyntax(shortcut);
        const existing = index.get(actionId) || [];

        if (!existing.includes(nextSyntax)) {
            existing.push(nextSyntax);
            index.set(actionId, existing);
        }
    }

    return index;
}

function getActionShortcutCandidates(actionId: DiagramActionId): string[] {
    if (!actionShortcutIndex) {
        actionShortcutIndex = buildActionShortcutIndex();
    }

    return actionShortcutIndex.get(actionId) || [];
}

function normalizeShortcut(shortcut: string, isMac: boolean): string {
    if (isMac) {
        return shortcut.replace(/Ctrl/g, 'Cmd').replace(/Alt/g, 'Option');
    }

    return shortcut.replace(/Cmd/g, 'Ctrl').replace(/Option/g, 'Alt');
}

export function getActionShortcut(actionId?: DiagramActionId): string | undefined {
    if (!actionId) {
        return undefined;
    }

    const candidates = getActionShortcutCandidates(actionId);

    if (!candidates.length) {
        return undefined;
    }

    const isMac = isMacPlatform();
    const preferred = candidates.find((one) => (isMac ? one.includes('Cmd') : one.includes('Ctrl')));
    const selected = preferred || candidates[0];

    return selected ? normalizeShortcut(selected, isMac) : undefined;
}

export function appendShortcutSuffix(text: string, actionId?: DiagramActionId): string {
    const base = (text || '').trim();
    if (!base) {
        return base;
    }

    // Keep existing explicit shortcut formatting intact.
    if (/\([^)]*(Cmd|Ctrl|Option|Alt|Delete|Backspace)[^)]*\)$/.test(base)) {
        return base;
    }

    const shortcut = getActionShortcut(actionId);
    return shortcut ? `${base} (${shortcut})` : base;
}
