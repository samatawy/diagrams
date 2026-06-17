import type { DiagramView } from '../../view/diagram.view';
import { DiagramEditView } from '../../editview/diagram.edit.view';
import {
    type DiagramToolBarLayoutItem,
    DIAGRAM_VIEW_TOOLBAR_LAYOUT,
    DIAGRAM_ZOOM_TOOLBAR_LAYOUT,
    DIAGRAM_ZORDER_TOOLBAR_LAYOUT,
    DIAGRAM_CLIPBOARD_TOOLBAR_LAYOUT,
    DIAGRAM_ALIGN_TOOLBAR_LAYOUT,
} from '../buttons/diagram.toolbar.layouts';
import { ACTION_MAP } from '../buttons/diagram.actions';
import { IconRegistry } from '../../factory/icon.registry';
import { ContextMenu } from './context.menu';

/**
 * Layout shown when nothing is selected: grid/guides toggles, zoom/fit, and paste.
 */
const EMPTY_SELECTION_LAYOUT: DiagramToolBarLayoutItem[] = [
    'paste',
    '|',
    ...DIAGRAM_VIEW_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_ZOOM_TOOLBAR_LAYOUT,
];

/**
 * Layout shown when one or more nodes are selected.
 * Actions are filtered to only those enabled for the current selection.
 */
const HAS_SELECTION_LAYOUT: DiagramToolBarLayoutItem[] = [
    ...DIAGRAM_CLIPBOARD_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_ZORDER_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_ALIGN_TOOLBAR_LAYOUT,
    // '|',
    // ...DIAGRAM_TEXT_ALIGN_TOOLBAR_LAYOUT,
];

/**
 * Configuration options for {@link DiagramContextMenu}.
 */
export interface DiagramContextMenuConfig {
    /**
     * Layout used when nothing is selected. Defaults to view, zoom, and paste actions.
     */
    emptyLayout?: DiagramToolBarLayoutItem[];
    /**
     * Layout used when one or more nodes are selected.
     * Only enabled actions are shown. Defaults to clipboard, z-order, align, and text-align actions.
     */
    selectionLayout?: DiagramToolBarLayoutItem[];
}

/**
 * A context menu pre-populated with diagram editing actions.
 *
 * Wire it to a {@link DiagramView} by assigning to `view.contextMenu`.
 * The view will call {@link open} when a right-click event fires.
 *
 * @example
 * ```ts
 * const menu = new DiagramContextMenu(editorView);
 * editorView.contextMenu = menu;
 * ```
 */
export class DiagramContextMenu extends ContextMenu {

    private readonly diagram: DiagramView;
    private readonly emptyLayout: DiagramToolBarLayoutItem[];
    private readonly selectionLayout: DiagramToolBarLayoutItem[];

    /**
     * Creates a new DiagramContextMenu.
     * @param diagram The diagram view this menu operates on.
     * @param config Optional configuration overriding the default action layouts.
     */
    constructor(diagram: DiagramView, config?: DiagramContextMenuConfig) {
        super();
        this.diagram = diagram;
        this.emptyLayout = config?.emptyLayout ?? EMPTY_SELECTION_LAYOUT;
        this.selectionLayout = config?.selectionLayout ?? HAS_SELECTION_LAYOUT;
    }

    /**
     * Populates and displays the context menu at the event coordinates.
     * Called automatically by `DiagramView.contextmenu()`.
     * @param event The mouse event from the context-menu trigger.
     */
    public override open(event: MouseEvent): void {
        this.show(event.clientX, event.clientY);

        const selection = this.diagram.selection();
        const editView = this.diagram instanceof DiagramEditView ? this.diagram : null;
        const hasSelection = selection.length > 0;

        // Info row for a single selected node with text.
        if (selection.length === 1) {
            const label = selection[0]!.text?.trim();
            if (label) {
                this.addInfoRow(label);
                this.addSeparator();
            }
        }

        this.addActions(hasSelection ? this.selectionLayout : this.emptyLayout, editView);
    }

    /**
     * Renders a list of action IDs into menu items, collapsing redundant separators
     * and skipping disabled actions.
     */
    private addActions(layout: DiagramToolBarLayoutItem[], editView: DiagramEditView | null): void {
        let pendingSeparator = false;
        let anyAdded = false;

        for (const id of layout) {
            if (id === '|') {
                if (anyAdded) pendingSeparator = true;
                continue;
            }
            const action = ACTION_MAP.get(id);
            if (!action) continue;
            const enabled = editView
                ? (action.isEnabled ? action.isEnabled(editView) : true)
                : false;
            if (!enabled) continue;

            if (pendingSeparator) { this.addSeparator(); pendingSeparator = false; }

            const icon = action.icon
                ? (action.icon instanceof Element ? action.icon.cloneNode(true) as Element : null)
                : IconRegistry.createElement(id);
            const active = action.toggle && editView ? (action.isActive?.(editView) ?? false) : false;

            this.addMenuItem(action.label, () => { editView && action.execute(editView); }, { icon, active });
            anyAdded = true;
        }
    }

    /**
     * Appends a read-only info row showing the node's text label.
     * The icon slot is left empty so text aligns with menu items below.
     * @param label The node text.
     */
    private addInfoRow(label: string): void {
        if (!this.menuElement) return;
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;margin:1px 4px';

        // Empty icon slot to align with menu items.
        const iconSlot = document.createElement('span');
        iconSlot.style.cssText = 'flex:0 0 auto;padding:3px';
        const spacer = document.createElement('span');
        spacer.style.cssText = 'display:block;width:18px;height:18px';
        iconSlot.appendChild(spacer);
        row.appendChild(iconSlot);

        const labelEl = document.createElement('div');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px';
        row.appendChild(labelEl);

        this.menuElement.appendChild(row);
    }
}
