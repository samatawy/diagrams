import type { ILayer } from '../../interfaces';
import { DiagramEditView } from '../../editview/diagram.edit.view';
import { DIAGRAM_NODE_ADDED_EVENT, DIAGRAM_NODE_DELETED_EVENT, DIAGRAM_OPEN_EVENT } from '../../events/diagram.events';
import type { DiagramView } from '../../view/diagram.view';
import { injectStyles, setClasses } from '../editor.utils';
import { DiagramLayerItem } from './layer.item';

import LAYERS_EDITOR_DEFAULT_STYLES from '../../css_generated/editor/layers/layers.editor.css';

const LAYERS_EDITOR_STYLE_ID = 'diagram-layers-editor-defaults';

function ensureLayersEditorStyles(): void {
    injectStyles(LAYERS_EDITOR_STYLE_ID, LAYERS_EDITOR_DEFAULT_STYLES);
}

export interface DiagramLayersEditorConfig {
    allowAdd?: boolean;
    allowReorder?: boolean;
    allowRename?: boolean;
    allowDelete?: boolean;
    showTitle?: boolean;
}

export class DiagramLayersEditor {
    public readonly host: HTMLElement;

    protected readonly diagram: DiagramView | DiagramEditView;
    protected readonly config: Required<DiagramLayersEditorConfig>;
    protected draggedLayerId?: string;
    protected dropTargetLayerId?: string;
    protected dropPosition: 'before' | 'after' = 'before';
    protected collapsed = false;
    protected layerItems = new Map<string, DiagramLayerItem>();
    protected listHost?: HTMLElement;
    protected dragSlot?: HTMLElement;
    protected tailSlot?: HTMLElement;
    protected rowWrappers = new Map<string, HTMLElement>();
    protected draggedWrapper?: HTMLElement;
    protected draggedItemHeight = 40;
    protected dragWasDropped = false;

    protected readonly onDiagramChanged = (): void => {
        this.refresh();
    };

    protected readonly onDiagramOpened = (): void => {
        this.refresh();
    };

    constructor(host: HTMLElement, diagram: DiagramView | DiagramEditView, config: DiagramLayersEditorConfig = {}) {
        ensureLayersEditorStyles();
        this.host = host;
        this.diagram = diagram;
        this.config = {
            allowAdd: true,
            allowReorder: true,
            allowRename: true,
            allowDelete: true,
            showTitle: true,
            ...config,
        };

        setClasses(this.host, 'diagram-layers-editor');
        this.bindDiagramEvents();
        this.render();
    }

    public setCollapsed(collapsed: boolean): void {
        this.collapsed = collapsed;
        this.host.classList.toggle('is-collapsed', collapsed);

        if (this.listHost) {
            this.listHost.style.overflow = 'hidden';
            if (!collapsed) {
                this.listHost.addEventListener('transitionend', () => {
                    this.listHost!.style.overflow = '';
                }, { once: true });
            }
        }
    }

    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_OPEN_EVENT, this.onDiagramOpened);
        source?.addEventListener(DIAGRAM_NODE_ADDED_EVENT, this.onDiagramChanged);
        source?.addEventListener(DIAGRAM_NODE_DELETED_EVENT, this.onDiagramChanged);
    }

    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_OPEN_EVENT, this.onDiagramOpened);
        source?.removeEventListener(DIAGRAM_NODE_ADDED_EVENT, this.onDiagramChanged);
        source?.removeEventListener(DIAGRAM_NODE_DELETED_EVENT, this.onDiagramChanged);
    }

    public destroy(): void {
        this.unbindDiagramEvents();
        this.host.innerHTML = '';
        this.layerItems.clear();
    }

    protected getDisplayedLayers(): ILayer[] {
        return [...this.diagram.layers].reverse();
    }

    protected clearDropTarget(): void {
        for (const wrapper of this.rowWrappers.values()) {
            const slot = wrapper.querySelector('.diagram-layer-slot') as HTMLElement | null;
            slot?.classList.remove('is-visible');
        }
        this.tailSlot?.classList.remove('is-visible');
        this.dragSlot = undefined;
        this.dropTargetLayerId = undefined;
        this.dropPosition = 'before';
    }

    protected setDraggedWrapperState(collapsed: boolean): void {
        if (!this.draggedWrapper) {
            return;
        }

        this.draggedWrapper.classList.toggle('is-dragging', collapsed);
        const row = this.draggedWrapper.querySelector('.diagram-layer-item') as HTMLElement | null;
        row?.classList.toggle('is-dragging', collapsed);
    }

    protected getDraggedDropHeight(): number {
        return Math.max(this.draggedItemHeight || 40, 40);
    }

    protected getTailDropThreshold(): number {
        return Math.max(this.getDraggedDropHeight() + 8, 40);
    }

    protected ensureBeforeSlot(wrapper: HTMLElement, targetRow: HTMLElement): void {
        if (!this.draggedLayerId) {
            return;
        }

        const slotHeight = this.getDraggedDropHeight();
        const slot = wrapper.querySelector('.diagram-layer-slot') as HTMLElement | null;
        if (!slot) {
            return;
        }

        this.dragSlot = slot;
        this.dragSlot.style.setProperty('--diagram-layer-drop-height', `${Math.max(slotHeight, 20)}px`);
        this.dragSlot.dataset.layerId = targetRow.dataset.layerId ?? '';
        this.dragSlot.dataset.position = 'before';
        this.dropTargetLayerId = targetRow.dataset.layerId ?? undefined;
        this.dropPosition = 'before';
        this.dragSlot.classList.add('is-visible');
    }

    protected ensureTailSlot(slot: HTMLElement): void {
        if (!this.draggedLayerId) {
            return;
        }

        const slotHeight = this.getDraggedDropHeight();

        this.dragSlot = slot;
        this.dragSlot.style.setProperty('--diagram-layer-drop-height', `${Math.max(slotHeight, 20)}px`);
        this.dragSlot.dataset.layerId = '__tail__';
        this.dragSlot.dataset.position = 'after';
        this.dropTargetLayerId = '__tail__';
        this.dropPosition = 'after';
        this.dragSlot.classList.add('is-visible');
    }

    public refresh(): void {
        this.render();
    }

    public addLayer(): void {
        if (!(this.diagram instanceof DiagramEditView)) {
            return;
        }

        this.diagram.addLayer('', 'top');
        const layer = this.diagram.layers[this.diagram.layers.length - 1];
        if (!layer) {
            return;
        }

        if (layer.id === 'main') {
            layer.name = 'Main';
        }

        this.diagram.setCurrentLayer(layer);
        this.render();
    }

    public moveSelectedToLayer(layer: ILayer): void {
        if (!(this.diagram instanceof DiagramEditView)) {
            return;
        }

        const selection = this.diagram.selection();
        if (selection.length === 0) {
            return;
        }

        for (const node of selection) {
            this.diagram.setNodeLayer(node, layer.id);
        }
        this.diagram.setCurrentLayer(layer);
        this.render();
    }

    public promoteSelectionToNewLayer(): void {
        if (!(this.diagram instanceof DiagramEditView)) {
            return;
        }

        this.diagram.moveSelectedToLayer();
        this.render();
    }

    protected render(): void {
        this.host.innerHTML = '';
        this.host.classList.toggle('is-collapsed', this.collapsed);

        if (this.diagram instanceof DiagramEditView && this.diagram.layers.length === 0) {
            this.diagram.ensureCurrentLayer();
        }

        if (this.config.showTitle) {
            const header = document.createElement('div');
            header.className = 'diagram-layers-header';

            const title = document.createElement('h4');
            title.className = 'diagram-layers-title';
            title.textContent = 'Layers';
            header.appendChild(title);

            const actions = document.createElement('div');
            actions.className = 'diagram-layers-actions';

            if (this.config.allowAdd && this.diagram instanceof DiagramEditView) {
                const addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.className = 'diagram-layers-button';
                addButton.textContent = '+ Layer';
                addButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.addLayer();
                });
                actions.appendChild(addButton);
            }

            header.appendChild(actions);
            header.addEventListener('click', () => this.setCollapsed(!this.collapsed));
            this.host.appendChild(header);
        }

        const body = document.createElement('div');
        body.className = 'diagram-layers-body';
        this.listHost = body;

        const list = document.createElement('div');
        list.className = 'diagram-layers-list';

        list.addEventListener('dragover', (event) => {
            if (!this.draggedLayerId) {
                return;
            }

            const listRect = list.getBoundingClientRect();
            const tailThreshold = this.getTailDropThreshold();
            const isInTailRegion = event.clientY >= listRect.bottom - tailThreshold;
            if (!isInTailRegion) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            if (!this.tailSlot) {
                return;
            }
            this.ensureTailSlot(this.tailSlot);
        });

        list.addEventListener('dragleave', (event) => {
            const nextTarget = event.relatedTarget as Node | null;
            if (nextTarget && list.contains(nextTarget)) {
                return;
            }
            this.clearDropTarget();
        });

        list.addEventListener('drop', (event) => {
            if (!this.draggedLayerId) {
                this.clearDropTarget();
                return;
            }

            const listRect = list.getBoundingClientRect();
            const tailThreshold = this.getTailDropThreshold();
            const isInTailRegion = event.clientY >= listRect.bottom - tailThreshold;
            if (!isInTailRegion) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            this.reorderLayer(this.draggedLayerId, '__tail__', 'after');
            this.draggedLayerId = undefined;
            this.clearDropTarget();
            this.refresh();
        });

        const displayedLayers = this.getDisplayedLayers();

        if (displayedLayers.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'diagram-layers-empty';
            empty.textContent = 'No layers';
            list.appendChild(empty);
            body.appendChild(list);
            this.host.appendChild(body);
            return;
        }

        this.layerItems.clear();
        this.rowWrappers.clear();

        const tailSlot = document.createElement('div');
        tailSlot.className = 'diagram-layer-slot diagram-layer-slot--tail';
        tailSlot.dataset.layerId = '__tail__';
        this.tailSlot = tailSlot;

        for (const layer of displayedLayers) {
            const wrapper = document.createElement('div');
            wrapper.className = 'diagram-layer-row';
            const slot = document.createElement('div');
            slot.className = 'diagram-layer-slot';
            const row = document.createElement('div');
            const item = new DiagramLayerItem(row, this.diagram, layer, {
                readonly: !(this.diagram instanceof DiagramEditView),
                allowRename: this.config.allowRename,
                allowDelete: this.config.allowDelete,
                allowVisibilityToggle: true,
                showDragHandle: this.config.allowReorder,
            });

            this.layerItems.set(layer.id, item);
            this.rowWrappers.set(layer.id, wrapper);
            wrapper.appendChild(slot);
            wrapper.appendChild(row);
            list.appendChild(wrapper);

            if (this.config.allowReorder && this.diagram instanceof DiagramEditView) {
                wrapper.addEventListener('dragstart', (event) => {
                    const target = event.target as HTMLElement | null;
                    if (target && target.closest('.diagram-layer-delete, .diagram-layer-visibility, .diagram-layer-name')) {
                        return;
                    }
                    const row = wrapper.querySelector('.diagram-layer-item') as HTMLElement | null;
                    this.draggedItemHeight = Math.max(row?.getBoundingClientRect().height ?? 40, 40);
                    this.draggedLayerId = layer.id;
                    this.draggedWrapper = wrapper;
                    this.dragWasDropped = false;
                    this.clearDropTarget();
                    this.setDraggedWrapperState(true);
                });

                wrapper.addEventListener('dragenter', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!this.draggedLayerId || this.draggedLayerId === layer.id) {
                        return;
                    }
                    this.dropTargetLayerId = layer.id;
                    this.dropPosition = 'before';
                    this.ensureBeforeSlot(wrapper, row);
                });

                wrapper.addEventListener('dragover', (event) => {
                    if (!this.draggedLayerId || this.draggedLayerId === layer.id) {
                        return;
                    }
                    event.preventDefault();
                    event.stopPropagation();

                    this.dropTargetLayerId = layer.id;
                    this.dropPosition = 'before';
                    this.ensureBeforeSlot(wrapper, row);
                });

                wrapper.addEventListener('dragleave', (event) => {
                    const nextTarget = event.relatedTarget as Node | null;
                    if (nextTarget && wrapper.contains(nextTarget)) {
                        return;
                    }
                    this.clearDropTarget();
                });

                wrapper.addEventListener('drop', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!this.draggedLayerId || this.draggedLayerId === layer.id) {
                        this.dragWasDropped = false;
                        this.clearDropTarget();
                        return;
                    }

                    this.dragWasDropped = true;
                    this.reorderLayer(this.draggedLayerId, layer.id, 'before');
                    this.draggedLayerId = undefined;
                    this.clearDropTarget();
                    this.refresh();
                });

                wrapper.addEventListener('dragend', () => {
                    if (!this.dragWasDropped) {
                        this.setDraggedWrapperState(false);
                    }
                    this.draggedWrapper = undefined;
                    this.draggedLayerId = undefined;
                    this.dragWasDropped = false;
                    this.clearDropTarget();
                });

                wrapper.addEventListener('dragcancel', () => {
                    this.dragWasDropped = false;
                    this.setDraggedWrapperState(false);
                    this.draggedWrapper = undefined;
                    this.draggedLayerId = undefined;
                    this.clearDropTarget();
                });
            }
        }

        list.appendChild(tailSlot);
        body.appendChild(list);
        this.host.appendChild(body);
    }

    protected reorderLayer(fromLayerId: string, toLayerId: string, position: 'before' | 'after' = 'before'): void {
        const displayed = this.getDisplayedLayers();
        const fromIndex = displayed.findIndex(layer => layer.id === fromLayerId);

        if (fromIndex < 0) {
            return;
        }

        if (toLayerId === '__tail__') {
            if (fromIndex === displayed.length - 1) {
                return;
            }

            const nextDisplay = [...displayed];
            const [moved] = nextDisplay.splice(fromIndex, 1);
            if (!moved) {
                return;
            }

            nextDisplay.push(moved);
            this.diagram.layers = [...nextDisplay].reverse();
            this.diagram.render('all');
            return;
        }

        const toIndex = displayed.findIndex(layer => layer.id === toLayerId);
        if (toIndex < 0 || (fromIndex === toIndex && position === 'before')) {
            return;
        }

        const nextDisplay = [...displayed];
        const [moved] = nextDisplay.splice(fromIndex, 1);
        if (!moved) {
            return;
        }

        const targetIndex = nextDisplay.findIndex(layer => layer.id === toLayerId);
        const insertionIndex = position === 'before' ? targetIndex : targetIndex + 1;
        nextDisplay.splice(insertionIndex, 0, moved);

        this.diagram.layers = [...nextDisplay].reverse();
        this.diagram.render('all');
    }
}
