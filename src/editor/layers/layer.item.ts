import type { ILayer } from '../../interfaces';
import { DiagramEditView } from '../../editview/diagram.edit.view';
import type { DiagramView } from '../../view/diagram.view';
import { injectStyles, setClasses } from '../editor.utils';

const LAYER_ITEM_STYLE_ID = 'diagram-layers-item-defaults';

const LAYER_ITEM_STYLES = `
    .diagram-layer-item {
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        border: 1px solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
        border-radius: 8px;
        background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.82));
        color: var(--diagram-ui-text, inherit);
        cursor: pointer;
        user-select: none;
        transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
    }

    .diagram-layer-item:hover {
        border-color: var(--diagram-ui-border-strong, rgba(15, 23, 42, 0.24));
    }

    .diagram-layer-item.is-active {
        background: rgba(var(--diagram-inspector-base, 15, 23, 42), 0.08);
        border-color: rgba(var(--diagram-inspector-base, 15, 23, 42), 0.28);
    }

    .diagram-layer-item.is-hidden {
        opacity: 0.6;
    }

    .diagram-layer-visibility {
        width: 14px;
        height: 14px;
        margin: 0;
        accent-color: var(--diagram-ui-accent, #0f766e);
        cursor: pointer;
    }

    .diagram-layer-visibility:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    .diagram-layer-name {
        min-width: 0;
        max-width: 100%;
        border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
        background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
        color: var(--diagram-ui-text, #1f2937);
        padding: var(--diagram-ui-control-padding-y, 3px) var(--diagram-ui-control-padding-x, 6px);
        border-radius: var(--diagram-ui-control-radius, 6px);
        font: var(--diagram-ui-font-size, 12px)/1.4 var(--diagram-ui-font-family, system-ui);
        width: 100%;
        box-sizing: border-box;
    }

    .diagram-layer-name:focus {
        outline: none;
        border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
        background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    }

    .diagram-layer-count {
        min-width: 18px;
        padding: 2px 4px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.16);
        color: var(--diagram-ui-text-muted, #475569);
        text-align: center;
        font-size: 9px;
        line-height: 1.4;
    }

    .diagram-layer-delete {
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 1px solid transparent;
        border-radius: 5px;
        background: transparent;
        /* color: #b91c1c; */
        color: red;
        cursor: pointer;
    }

    .diagram-layer-delete:hover:not(:disabled) {
    /*
        border-color: rgba(239, 68, 68, 0.2);
        background: rgba(239, 68, 68, 0.08);
        color: #991b1b; */
        border-color: rgba(255, 0, 0, 0.2);
        background: rgba(255, 0, 0, 0.08);
        color: red;
    }

    .diagram-layer-delete:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .diagram-layer-drag-handle {
        width: 16px;
        height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--diagram-ui-text-muted, #475569);
        font-size: 11px;
        line-height: 1;
    }
`;

function ensureLayerItemStyles(): void {
    injectStyles(LAYER_ITEM_STYLE_ID, LAYER_ITEM_STYLES);
}

export interface DiagramLayerItemConfig {
    readonly?: boolean;
    allowRename?: boolean;
    allowDelete?: boolean;
    allowVisibilityToggle?: boolean;
    showDragHandle?: boolean;
}

export class DiagramLayerItem {
    public readonly host: HTMLElement;

    protected readonly diagram: DiagramView | DiagramEditView;
    protected readonly layer: ILayer;
    protected readonly config: Required<DiagramLayerItemConfig>;

    constructor(host: HTMLElement, diagram: DiagramView | DiagramEditView, layer: ILayer, config: DiagramLayerItemConfig = {}) {
        ensureLayerItemStyles();
        this.host = host;
        this.diagram = diagram;
        this.layer = layer;
        this.config = {
            readonly: false,
            allowRename: true,
            allowDelete: true,
            allowVisibilityToggle: true,
            showDragHandle: true,
            ...config,
        };

        setClasses(this.host, 'diagram-layer-item');
        this.render();
    }

    public refresh(): void {
        this.render();
    }

    public destroy(): void {
        this.host.innerHTML = '';
    }

    protected render(): void {
        const isActive = this.diagram instanceof DiagramEditView
            ? this.diagram.currentLayer?.id === this.layer.id
            : false;
        const canEdit = this.diagram instanceof DiagramEditView && !this.config.readonly;

        this.host.innerHTML = '';
        this.host.classList.remove('is-active', 'is-hidden');
        this.host.classList.add('diagram-layer-item');
        this.host.classList.toggle('is-active', !!isActive);
        this.host.classList.toggle('is-hidden', !this.layer.visible);
        this.host.setAttribute('data-layer-id', this.layer.id);
        this.host.setAttribute('draggable', String(canEdit && this.config.showDragHandle));

        if (this.config.showDragHandle) {
            const dragHandle = document.createElement('span');
            dragHandle.className = 'diagram-layer-drag-handle';
            dragHandle.textContent = '⋮⋮';
            dragHandle.title = 'Drag to reorder';
            this.host.appendChild(dragHandle);
        }

        const visibilityToggle = document.createElement('input');
        visibilityToggle.type = 'checkbox';
        visibilityToggle.className = 'diagram-layer-visibility';
        visibilityToggle.title = this.layer.visible ? 'Hide layer' : 'Show layer';
        visibilityToggle.checked = this.layer.visible;
        visibilityToggle.disabled = !canEdit || !this.config.allowVisibilityToggle;
        visibilityToggle.addEventListener('change', (event) => {
            event.stopPropagation();
            if (!(this.diagram instanceof DiagramEditView)) return;
            this.layer.visible ? this.diagram.hideLayer(this.layer) : this.diagram.showLayer(this.layer);
            this.refresh();
        });
        this.host.appendChild(visibilityToggle);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'diagram-layer-name';
        nameInput.value = this.layer.name;
        nameInput.title = this.layer.name;
        nameInput.disabled = !canEdit || !this.config.allowRename;
        nameInput.addEventListener('change', () => {
            const value = nameInput.value.trim() || this.layer.id;
            const target = this.diagram.layer(this.layer.id);
            if (!target) return;
            target.name = value;
            this.render();
        });
        this.host.appendChild(nameInput);

        if (canEdit && this.config.allowDelete && this.layer.nodes.length === 0) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'diagram-layer-delete';
            deleteButton.textContent = '×';
            deleteButton.title = 'Delete layer';
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.diagram.deleteLayer(this.layer.id);
                this.host.remove();
            });
            this.host.appendChild(deleteButton);
        } else {
            const count = document.createElement('span');
            count.className = 'diagram-layer-count';
            count.title = `${this.layer.nodes.length} node${this.layer.nodes.length === 1 ? '' : 's'}`;
            count.textContent = String(this.layer.nodes.length);
            this.host.appendChild(count);
        }

        this.host.addEventListener('click', (event) => {
            if (event.target instanceof HTMLElement && event.target.closest('button, input')) {
                return;
            }
            if (this.diagram instanceof DiagramEditView) {
                this.diagram.setCurrentLayer(this.layer);
            }
            this.refresh();
        });
    }
}
