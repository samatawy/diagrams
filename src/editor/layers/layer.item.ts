import type { ILayer } from '../../interfaces';
import { DiagramEditView } from '../../editview/diagram.edit.view';
import type { DiagramView } from '../../view/diagram.view';
import { injectStyles, setClasses } from '../editor.utils';

import LAYER_ITEM_DEFAULT_STYLES from '../../css_generated/editor/layers/layer.item.css';

const LAYER_ITEM_STYLE_ID = 'diagram-layers-item-defaults';

function ensureLayerItemStyles(): void {
    injectStyles(LAYER_ITEM_STYLE_ID, LAYER_ITEM_DEFAULT_STYLES);
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
        nameInput.addEventListener('focus', (event) => {
            event.stopPropagation();
            nameInput.select();
            this.setCurrentLayer(this.layer);
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
                this.host.closest('.diagram-layer-row')?.remove();
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

    private setCurrentLayer(layer: ILayer): void {
        if (this.diagram instanceof DiagramEditView) {
            this.diagram.setCurrentLayer(layer);
            const parentList = this.host.closest('.diagram-layers-list');
            const siblings = parentList?.querySelectorAll('.diagram-layer-item');
            siblings?.forEach(sibling => {
                sibling.classList.toggle('is-active', sibling === this.host);
            });
            // this.host.classList.toggle('is-active', this.diagram.currentLayer?.id === layer.id);
        }
    }
}
