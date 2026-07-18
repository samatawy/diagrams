import { injectStyles } from '../../editor.utils';
import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from '../inspector.adapter';
import type { DiagramEditView } from '../../../editview';
import { DIAGRAM_CHANGED_EVENT, type DiagramChanged } from '../../../events';
import { DiagramConstants } from '../../../model/diagram.constants';
import type { NodeStyle } from '../../../sheets/spec.sheet';

import DEFAULT_STYLES from '../../../css_generated/editor/inspector/adapters/class.actions.adapter.css';
const STYLE_ID = 'class-actions-adapter-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

export interface StyleClassActionsAdapterConfig {
    diagram: DiagramEditView;
}

export class StyleClassActionsAdapter extends InspectorAdapter {

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

        const config = initial.def.editorOptions as StyleClassActionsAdapterConfig;
        this.diagram = config.diagram;

        this.wrap = document.createElement('div');
        this.wrap.className = 'class-actions is-idle';

        // ── Add button ────────────────────────────────────────────────────
        this.addBtn = document.createElement('button');
        this.addBtn.type = 'button';
        this.addBtn.title = 'Add a new style';
        this.addBtn.setAttribute('aria-label', 'Add style');
        this.addBtn.disabled = initial.readonly;
        this.addBtn.innerHTML = '<span aria-hidden="true">+</span><span>Add</span>';

        // ── Rename button ─────────────────────────────────────────────────
        this.renameBtn = document.createElement('button');
        this.renameBtn.type = 'button';
        this.renameBtn.title = 'Rename current style';
        this.renameBtn.setAttribute('aria-label', 'Rename style');
        this.renameBtn.disabled = true;
        this.renameBtn.innerHTML = '<span aria-hidden="true">✎</span><span>Rename</span>';

        // ── Inline input ──────────────────────────────────────────────────
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = 'Style name…';

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
        this.input.placeholder = 'New style name…';
        this.renderEditing();
        this.input.focus();
    }

    private startRenaming(): void {
        if (!this.currentClassName) return;
        this.mode = 'renaming';
        this.input.value = this.currentClassName;
        this.input.placeholder = 'New style name…';
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

    private addClass(styleClass: string): void {
        this.diagram.ensureCustomSheet();
        const sheet = this.diagram.currentSheet;
        const repo = this.diagram.sheetRepository;
        if (!sheet || !repo) {
            return;
        }

        const style = this.captureStyle();
        repo.upsertClassStyle(styleClass, style, sheet.id);

        const edit = this.diagram as any;
        if (typeof edit.applyNodePatch === 'function') {
            edit.applyNodePatch({ style_class: styleClass }, 'style_class');
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
            if (node.style_class === oldName) {
                node.style_class = newName;
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
                fillStyle: { ...(s.fillStyle || {}) },
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
            fillStyle: { ...(node?.fillStyle || {}) },
            shadowStyle: {
                ...(node?.shadowStyle || DiagramConstants.NO_SHADOW),
                offset: { ...(node?.shadowStyle?.offset || DiagramConstants.NO_SHADOW.offset) },
            },
        };
    }

    private emitChanged(sourceEvent: string): void {
        this.diagram.eventDispatcher.sheetChanged({
            action: sourceEvent,
            sheetId: this.diagram.currentSheet?.id || '',
            sheetNames: this.diagram.sheetRepository?.sheetNames || [],
        });
        // const host = (this.diagram as any).host as HTMLElement | undefined;
        // host?.dispatchEvent(new CustomEvent<DiagramChanged>(DIAGRAM_CHANGED_EVENT, {
        //     detail: {
        //         scope: 'model',
        //         sourceEvent,
        //     },
        // }));
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
        // because 'style_class.__actions' is not a real node path.
        const selected = this.diagram.selection();
        const first = selected[0];
        this.currentClassName = first?.style_class ?? undefined;

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
