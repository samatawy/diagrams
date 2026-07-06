import { injectStyles } from '../../editor.utils';
import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from '../inspector.adapter';

import DEFAULT_STYLES from '../../../css_generated/editor/inspector/native/meta.kv.adapters.css';
const STYLE_ID = 'meta-kv-adapters-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

export interface MetaAddAdapterConfig {
    basePath: string;
    keyPlaceholder?: string;
    buttonLabel?: string;
}

export type MetaAddChange = {
    kind: 'add';
    path: string;
};

export type MetaDeleteChange = {
    kind: 'delete';
    path: string;
};

function parsePrimitive(input: string): string | number | boolean {
    const trimmed = input.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    if (trimmed.length > 0 && /^-?(?:\d+|\d*\.\d+)$/.test(trimmed)) {
        const num = Number(trimmed);
        if (Number.isFinite(num)) {
            return num;
        }
    }

    return input;
}

function primitiveToString(value: unknown): string {
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
        return String(value);
    }
    if (typeof value === 'string') {
        return value;
    }
    return '';
}

export class MetaValueAdapter extends InspectorAdapter {

    private readonly input: HTMLInputElement;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        ensureDefaultStyles();

        const wrap = document.createElement('div');
        wrap.className = 'meta-kv-value';

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.readOnly = initial.readonly;
        this.input.addEventListener('change', () => this.notifyChange(this.input.value));

        const del = document.createElement('button');
        del.type = 'button';
        del.textContent = '×';
        del.disabled = initial.readonly;
        del.title = 'Delete key';
        del.setAttribute('aria-label', 'Delete key');
        del.addEventListener('click', () => {
            if (!this.returnKey) return;
            const change: MetaDeleteChange = { kind: 'delete', path: this.returnKey };
            this.notifyChange(change);
        });

        wrap.appendChild(this.input);
        wrap.appendChild(del);
        cell.appendChild(wrap);
    }

    public override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.setUnset(value === undefined || value === null);
        this.input.value = primitiveToString(value);
    }

    public override getValue(): EditableRecord {
        if (!this.returnKey) {
            return {};
        }
        return { [this.returnKey]: parsePrimitive(this.input.value) };
    }

    public override setMixed(mixed: boolean): void {
        super.setMixed(mixed);
        if (mixed) {
            this.input.value = '';
            this.input.placeholder = 'Multiple';
        } else {
            this.input.placeholder = '';
        }
    }
}

export class MetaAddAdapter extends InspectorAdapter {

    private readonly keyInput: HTMLInputElement;
    private readonly addButton: HTMLButtonElement;
    private readonly config: MetaAddAdapterConfig;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        ensureDefaultStyles();

        this.config = {
            basePath: 'meta',
            keyPlaceholder: 'key',
            buttonLabel: '+',
            ...(initial.def.editorOptions as MetaAddAdapterConfig | undefined),
        };

        const wrap = document.createElement('div');
        wrap.className = 'meta-kv-add';

        this.keyInput = document.createElement('input');
        this.keyInput.type = 'text';
        this.keyInput.placeholder = this.config.keyPlaceholder || 'key';
        this.keyInput.readOnly = initial.readonly;

        this.addButton = document.createElement('button');
        this.addButton.type = 'button';
        this.addButton.textContent = this.config.buttonLabel ?? '+';
        this.addButton.disabled = initial.readonly;
        this.addButton.title = 'Add key';
        this.addButton.setAttribute('aria-label', 'Add key');

        this.addButton.addEventListener('click', () => this.commitAdd());
        this.keyInput.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() !== 'enter') return;
            event.preventDefault();
            this.commitAdd();
        });

        wrap.appendChild(this.keyInput);
        wrap.appendChild(this.addButton);
        cell.appendChild(wrap);
    }

    public override showValue(editable: EditableRecord): void {
        const { key } = this.extractValueFrom(editable);
        this.returnKey = key;
        this.setUnset(false);
    }

    public override getValue(): EditableRecord {
        return {};
    }

    private commitAdd(): void {
        const key = this.keyInput.value.trim();
        if (!key.length) {
            return;
        }

        const path = `${this.config.basePath}.${key}`;
        const change: MetaAddChange = { kind: 'add', path };
        this.notifyChange(change);

        this.keyInput.value = '';
        this.keyInput.focus();
    }
}
