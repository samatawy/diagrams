import type { ILayer } from '../../interfaces';
import { DiagramEditView } from '../../editview/diagram.edit.view';
import { DIAGRAM_NODE_ADDED_EVENT, DIAGRAM_NODE_DELETED_EVENT, DIAGRAM_OPEN_EVENT } from '../../events/diagram.events';
import type { DiagramView } from '../../view/diagram.view';
import { injectStyles, setClasses } from '../editor.utils';
import { DiagramLayerItem } from './layer.item';

const LAYERS_EDITOR_STYLE_ID = 'diagram-layers-editor-defaults';

const LAYERS_EDITOR_STYLES = `
    .diagram-layers-editor {
        /* margin-block-start: auto; */
        padding-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 180px;
        max-width: var(--diagram-inspector-width, 300px);
        width: 100%;
        box-sizing: border-box;
        color: var(--diagram-ui-text, inherit);
        --diagram-layers-caret-ease: cubic-bezier(0.2, 0.75, 0.25, 1);
    }

    .diagram-layers-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
        padding: 6px 8px;
        font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, system-ui);
        color: rgba(var(--diagram-inspector-base, 15, 118, 110), 1);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border: var(--diagram-ui-border-width, 1px) solid rgba(var(--diagram-inspector-base, 15, 118, 110), 0.34);
        border-radius: var(--diagram-ui-panel-radius, 5px);
        background: rgba(var(--diagram-inspector-base, 15, 118, 110), 0.14);
        cursor: pointer;
        user-select: none;
        transition: background-color 0.22s ease, border-color 0.22s ease, color 0.22s ease;
    }

    .diagram-layers-header::before {
        content: '';
        width: 3px;
        height: 3px;
        border-right: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        margin-inline-end: 2px;
        transform: rotate(45deg);
        transform-origin: 50% 50%;
        transition: transform 0.26s var(--diagram-layers-caret-ease);
    }

    .diagram-layers-editor.is-collapsed .diagram-layers-header::before {
        transform: rotate(-45deg);
    }

    .diagram-layers-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        font: inherit;
        color: inherit;
        flex: 1;
    }

    .diagram-layers-actions {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .diagram-layers-button {
        border: 1px solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
        background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.82));
        color: inherit;
        border-radius: 6px;
        padding: 4px 8px;
        font: inherit;
        cursor: pointer;
    }

    .diagram-layers-button:hover {
        border-color: var(--diagram-ui-border-strong, rgba(15, 23, 42, 0.22));
    }

    .diagram-layers-body {
        display: grid;
        grid-template-rows: 1fr;
        transition: grid-template-rows 0.26s var(--diagram-layers-caret-ease);
        overflow: hidden;
    }

    .diagram-layers-editor.is-collapsed .diagram-layers-body {
        grid-template-rows: 0fr;
    }

    .diagram-layers-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-height: 0;
        opacity: 1;
        transition: opacity 0.22s ease, padding 0.26s var(--diagram-layers-caret-ease);
        overflow: hidden;
    }

    .diagram-layers-editor.is-collapsed .diagram-layers-list {
        opacity: 0;
        padding-top: 0;
        padding-bottom: 0;
    }

    .diagram-layers-empty {
        border: 1px dashed var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
        border-radius: 8px;
        padding: 10px 8px;
        color: var(--diagram-ui-text-muted, #475569);
        font-size: 11px;
        text-align: center;
        background: rgba(148, 163, 184, 0.03);
    }
`;

function ensureLayersEditorStyles(): void {
    injectStyles(LAYERS_EDITOR_STYLE_ID, LAYERS_EDITOR_STYLES);
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
    protected collapsed = false;
    protected layerItems = new Map<string, DiagramLayerItem>();
    protected listHost?: HTMLElement;

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

        this.diagram.moveToNewLayer();
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

        for (const layer of displayedLayers) {
            const row = document.createElement('div');
            const item = new DiagramLayerItem(row, this.diagram, layer, {
                readonly: !(this.diagram instanceof DiagramEditView),
                allowRename: this.config.allowRename,
                allowDelete: this.config.allowDelete,
                allowVisibilityToggle: true,
                showDragHandle: this.config.allowReorder,
            });

            this.layerItems.set(layer.id, item);
            list.appendChild(row);

            if (this.config.allowReorder && this.diagram instanceof DiagramEditView) {
                row.addEventListener('dragstart', () => {
                    this.draggedLayerId = layer.id;
                    row.classList.add('is-dragging');
                });

                row.addEventListener('dragend', () => {
                    this.draggedLayerId = undefined;
                    row.classList.remove('is-dragging');
                });

                row.addEventListener('dragover', (event) => {
                    event.preventDefault();
                    if (!this.draggedLayerId || this.draggedLayerId === layer.id) {
                        return;
                    }
                    row.classList.add('is-drop-target');
                });

                row.addEventListener('dragleave', () => {
                    row.classList.remove('is-drop-target');
                });

                row.addEventListener('drop', (event) => {
                    event.preventDefault();
                    row.classList.remove('is-drop-target');
                    if (!this.draggedLayerId || this.draggedLayerId === layer.id) {
                        return;
                    }
                    this.reorderLayer(this.draggedLayerId, layer.id);
                    this.draggedLayerId = undefined;
                    this.refresh();
                });
            }
        }

        body.appendChild(list);
        this.host.appendChild(body);
    }

    protected reorderLayer(fromLayerId: string, toLayerId: string): void {
        const displayed = this.getDisplayedLayers();
        const fromIndex = displayed.findIndex(layer => layer.id === fromLayerId);
        const toIndex = displayed.findIndex(layer => layer.id === toLayerId);

        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
            return;
        }

        const nextDisplay = [...displayed];
        const [moved] = nextDisplay.splice(fromIndex, 1);
        if (!moved) {
            return;
        }

        nextDisplay.splice(toIndex, 0, moved);
        this.diagram.layers = [...nextDisplay].reverse();
        this.diagram.render('all');
    }
}
