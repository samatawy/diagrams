import { injectStyles } from '../editor.utils';
import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from './inspector.adapter';
import type { DiagramEditView } from '../../editview';
import { DIAGRAM_CHANGED_EVENT, type DiagramChanged } from '../../events';
import { DiagramConstants } from '../../model/diagram.constants';
import type { NodeStyle } from '../../sheets/spec.sheet';

export interface ClassActionsAdapterConfig {
    diagram: DiagramEditView;
}

const STYLE_ID = 'class-actions-adapter-defaults';

const DEFAULT_STYLES = `
.class-actions {
    display: grid;
    width: 100%;
    gap: 4px;
}
.class-actions.is-idle {
    grid-template-columns: 1fr 1fr;
}
.class-actions.is-editing {
    grid-template-columns: minmax(0, 1fr) 28px 28px;
}
.class-actions input {
    width: 100%;
    min-height: 24px;
    padding: 2px 6px;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    font-size: var(--diagram-ui-font-size, 12px);
    font-family: var(--diagram-ui-font-family, system-ui);
    outline: none;
    box-sizing: border-box;
}
.class-actions input:focus {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.class-actions button {
    width: 100%;
    min-height: 24px;
    padding: 0 6px;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    line-height: 1;
    font-size: var(--diagram-ui-font-size, 12px);
    font-family: var(--diagram-ui-font-family, system-ui);
    cursor: pointer;
    white-space: nowrap;
}
.class-actions button:hover,
.class-actions button:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.class-actions button:disabled {
    opacity: 0.4;
    cursor: default;
}
.class-actions-confirm {
    color: var(--diagram-ui-accent, #0f766e);
}
.class-actions-cancel {
    color: var(--diagram-ui-text-muted, #475569);
}
`;

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

export class ClassActionsAdapter extends InspectorAdapter {

    private readonly wrap: HTMLDivElement;
    private readonly addBtn: HTMLButtonElement;
    private readonly renameBtn: HTMLButtonElement;
    private readonly input: HTMLInputElement;
    private readonly confirmBtn: HTMLButtonElement;
    private readonly cancelBtn: HTMLButtonElement;
    private readonly diagram: DiagramEditView;

    private currentClassName: string | undefined;
    private mode: 'idle' | 'adding' | 'renaming' = 'idle';

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        ensureDefaultStyles();

        const config = initial.def.editorOptions as ClassActionsAdapterConfig;
        this.diagram = config.diagram;

        this.wrap = document.createElement('div');
        this.wrap.className = 'class-actions is-idle';

        // ── Add button ────────────────────────────────────────────────────
        this.addBtn = document.createElement('button');
        this.addBtn.type = 'button';
        this.addBtn.title = 'Add a new class';
        this.addBtn.setAttribute('aria-label', 'Add class');
        this.addBtn.disabled = initial.readonly;
        this.addBtn.innerHTML = '<span aria-hidden="true">+</span><span>Add</span>';

        // ── Rename button ─────────────────────────────────────────────────
        this.renameBtn = document.createElement('button');
        this.renameBtn.type = 'button';
        this.renameBtn.title = 'Rename current class';
        this.renameBtn.setAttribute('aria-label', 'Rename class');
        this.renameBtn.disabled = true;
        this.renameBtn.innerHTML = '<span aria-hidden="true">✎</span><span>Rename</span>';

        // ── Inline input ──────────────────────────────────────────────────
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = 'Class name…';

        // ── Confirm / cancel ──────────────────────────────────────────────
        this.confirmBtn = document.createElement('button');
        this.confirmBtn.type = 'button';
        this.confirmBtn.className = 'class-actions-confirm';
        this.confirmBtn.textContent = '✓';
        this.confirmBtn.title = 'Confirm';
        this.confirmBtn.setAttribute('aria-label', 'Confirm');

        this.cancelBtn = document.createElement('button');
        this.cancelBtn.type = 'button';
        this.cancelBtn.className = 'class-actions-cancel';
        this.cancelBtn.textContent = '✗';
        this.cancelBtn.title = 'Cancel';
        this.cancelBtn.setAttribute('aria-label', 'Cancel');

        // ── Events ────────────────────────────────────────────────────────
        this.addBtn.addEventListener('click', () => this.startAdding());
        this.renameBtn.addEventListener('click', () => this.startRenaming());
        this.confirmBtn.addEventListener('click', () => this.commit());
        this.cancelBtn.addEventListener('click', () => this.cancel());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.commit(); }
            if (e.key === 'Escape') { e.preventDefault(); this.cancel(); }
        });

        this.renderIdle();
        cell.appendChild(this.wrap);
    }

    // ── Mode transitions ──────────────────────────────────────────────────

    private startAdding(): void {
        this.mode = 'adding';
        this.input.value = '';
        this.input.placeholder = 'New class name…';
        this.renderEditing();
        this.input.focus();
    }

    private startRenaming(): void {
        if (!this.currentClassName) return;
        this.mode = 'renaming';
        this.input.value = this.currentClassName;
        this.input.placeholder = 'New name…';
        this.renderEditing();
        this.input.select();
    }

    private commit(): void {
        const name = this.input.value.trim();
        if (!name) { this.cancel(); return; }

        if (this.mode === 'adding') {
            this.addClass(name);
        } else if (this.mode === 'renaming' && this.currentClassName && name !== this.currentClassName) {
            this.renameClass(this.currentClassName, name);
        }

        this.mode = 'idle';
        this.renderIdle();
    }

    private cancel(): void {
        this.mode = 'idle';
        this.renderIdle();
    }

    // ── Rendering ─────────────────────────────────────────────────────────

    private renderIdle(): void {
        this.wrap.classList.replace('is-editing', 'is-idle');
        this.wrap.replaceChildren(this.addBtn, this.renameBtn);
        this.renameBtn.disabled = !this.currentClassName;
    }

    private renderEditing(): void {
        this.wrap.classList.replace('is-idle', 'is-editing');
        this.wrap.replaceChildren(this.input, this.confirmBtn, this.cancelBtn);
    }

    // ── Class operations ──────────────────────────────────────────────────

    private addClass(className: string): void {
        this.diagram.ensureCustomSheet();
        const sheet = this.diagram.currentSheet;
        const repo = this.diagram.sheetRepository;
        if (!sheet || !repo) {
            return;
        }

        const style = this.captureStyle();
        repo.upsertClassStyle(className, style, sheet.id);

        const edit = this.diagram as any;
        if (typeof edit.applyNodePatch === 'function') {
            edit.applyNodePatch({ class_name: className }, 'class_name');
        }
        this.emitChanged('class-add');
    }

    private renameClass(oldName: string, newName: string): void {
        this.diagram.ensureCustomSheet();
        const sheet = this.diagram.currentSheet;
        const repo = this.diagram.sheetRepository;
        if (!sheet || !repo) {
            return;
        }

        repo.renameClass(oldName, newName, sheet.id);

        for (const node of this.diagram.nodes) {
            if (node.class_name === oldName) {
                node.class_name = newName;
            }
        }

        const edit = this.diagram as any;
        edit.render?.('all');
        edit.renderPreview?.();
        this.emitChanged('class-rename');
    }

    private captureStyle(): NodeStyle {
        const sheet = this.diagram.currentSheet;

        // Prefer current class style as baseline when available.
        if (sheet && this.currentClassName && sheet.classes[this.currentClassName]) {
            const s = sheet.classes[this.currentClassName]!;
            return {
                textStyle: { ...(s.textStyle || {}) },
                strokeStyle: { ...(s.strokeStyle || {}) },
                fillStyle: s.fillStyle,
                shadowStyle: {
                    ...(s.shadowStyle || DiagramConstants.NO_SHADOW),
                    offset: { ...(s.shadowStyle?.offset || DiagramConstants.NO_SHADOW.offset) },
                },
            };
        }

        const node = this.diagram.selection()[0];
        return {
            textStyle: { ...(node?.textStyle || {}) },
            strokeStyle: { ...(node?.strokeStyle || {}) },
            fillStyle: node?.fillStyle ?? DiagramConstants.DEFAULT_FILL_STYLE,
            shadowStyle: {
                ...(node?.shadowStyle || DiagramConstants.NO_SHADOW),
                offset: { ...(node?.shadowStyle?.offset || DiagramConstants.NO_SHADOW.offset) },
            },
        };
    }

    private emitChanged(sourceEvent: string): void {
        const host = (this.diagram as any).host as HTMLElement | undefined;
        host?.dispatchEvent(new CustomEvent<DiagramChanged>(DIAGRAM_CHANGED_EVENT, {
            detail: {
                scope: 'model',
                sourceEvent,
            },
        }));
    }

    // ── InspectorAdapter contract ─────────────────────────────────────────

    public override setMixed(mixed: boolean): void {
        super.setMixed(mixed);
        if (mixed) {
            this.currentClassName = undefined;
            if (this.mode === 'idle') {
                this.renameBtn.disabled = true;
            }
        }
    }

    public override showValue(_editable: EditableRecord): void {
        // Read class name directly from selection — passed value is always undefined
        // because 'class_name.__actions' is not a real node path.
        const selected = this.diagram.selection();
        const first = selected[0];
        this.currentClassName = first?.class_name ?? undefined;

        if (this.mode === 'idle') {
            this.renameBtn.disabled = !this.currentClassName;
        }
    }

    public override getValue(): EditableRecord {
        return {};
    }

    public override destroy(): void {
        super.destroy();
    }
}
