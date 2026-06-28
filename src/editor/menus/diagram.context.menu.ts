import type { DiagramView } from '../../view/diagram.view';
import type { INode } from '../../interfaces';
import { DiagramEditView } from '../../editview/diagram.edit.view';
import {
    DIAGRAM_VIEW_ACTION_LAYOUT,
    DIAGRAM_ZOOM_ACTION_LAYOUT,
    DIAGRAM_ZORDER_ACTION_LAYOUT,
    DIAGRAM_CLIPBOARD_ACTION_LAYOUT,
    DIAGRAM_ALIGN_ACTION_LAYOUT,
} from '../diagram.action.layouts';

import { ACTION_MAP, type DiagramActionId } from '../diagram.actions';
import { IconRegistry } from '../../factory/icon.registry';
import { NodeRegistry } from '../../factory/node.registry';
import { ContextMenu, type ContextMenuConfig } from './context.menu';
import { humanize } from '../../value.utils';

/**
 * Layout shown when nothing is selected: grid/guides toggles, zoom/fit, and paste.
 */
const EMPTY_SELECTION_LAYOUT: DiagramActionId[] = [
    'paste',
    '|',
    ...DIAGRAM_VIEW_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_ZOOM_ACTION_LAYOUT,
];

/**
 * Layout shown when one or more nodes are selected.
 * Actions are filtered to only those enabled for the current selection.
 */
const HAS_SELECTION_LAYOUT: DiagramActionId[] = [
    ...DIAGRAM_CLIPBOARD_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_ZORDER_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_ALIGN_ACTION_LAYOUT,
];

/**
 * Configuration options for {@link DiagramContextMenu}.
 */
export interface DiagramContextMenuConfig extends ContextMenuConfig {
    /**
     * Layout used when nothing is selected. Defaults to view, zoom, and paste actions.
     */
    emptyLayout?: DiagramActionId[];
    /**
     * Layout used when one or more nodes are selected.
     * Only enabled actions are shown. Defaults to clipboard, z-order, align, and text-align actions.
     */
    selectionLayout?: DiagramActionId[];
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
    private readonly emptyLayout: DiagramActionId[];
    private readonly selectionLayout: DiagramActionId[];

    /**
     * Creates a new DiagramContextMenu.
     * @param diagram The diagram view this menu operates on.
     * @param config Optional configuration overriding the default action layouts.
     */
    constructor(diagram: DiagramView, config?: DiagramContextMenuConfig) {
        // Pass the diagram's host so the menu inherits its CSS-variable theme.
        super((diagram as unknown as { host: HTMLElement }).host, config);
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

            if (editView && this.addTypeTransferSection(selection[0]!, editView)) {
                this.addSeparator();
            }
        }

        this.addActions(hasSelection ? this.selectionLayout : this.emptyLayout, editView);
    }

    /**
     * Appends an expandable row that allows changing the selected node type
     * using transferables registered in NodeRegistry.
     * @returns True when the section is rendered.
     */
    private addTypeTransferSection(node: INode, editView: DiagramEditView): boolean {
        if (!this.menuElement) return false;

        const transferables = NodeRegistry.getTransferables(node.type)
            .filter(type => type !== node.type && !!NodeRegistry.adapter(type));

        if (!transferables.length) return false;

        const row = document.createElement('div');
        row.className = 'context-menu-item';
        row.style.cursor = 'pointer';

        const iconSlot = document.createElement('span');
        iconSlot.className = 'context-menu-item-icon';
        const icon = IconRegistry.createElement(node.type);
        if (icon) {
            iconSlot.appendChild(icon);
        }
        row.appendChild(iconSlot);

        const label = document.createElement('span');
        label.className = 'context-menu-item-label';
        label.textContent = humanize(node.type);
        // label.style.fontWeight = '600';
        row.appendChild(label);

        const caret = document.createElement('span');
        caret.style.cssText = [
            'display:block',
            'align-self:center',
            'box-sizing:border-box',
            'flex:0 0 6px',
            'width:6px',
            'height:6px',
            'border-right:2px solid currentColor',
            'border-bottom:2px solid currentColor',
            'margin-inline-end:0',
            'margin-inline-start:8px',
            'opacity:.7',
            'transform:rotate(-45deg)',
            'transform-origin:50% 50%',
            'transition:transform 0.26s cubic-bezier(0.2, 0.75, 0.25, 1)',
        ].join(';');
        row.appendChild(caret);

        const panel = document.createElement('div');
        panel.style.cssText = 'display:none;padding:4px 8px 6px 32px';

        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';

        for (const type of transferables) {
            const button = document.createElement('button');
            button.type = 'button';
            button.title = humanize(type);
            button.setAttribute('aria-label', `Change type to ${humanize(type)}`);
            button.style.cssText = [
                'display:inline-flex',
                'align-items:center',
                'justify-content:center',
                'width:30px',
                'height:30px',
                'border-radius:7px',
                'border:1px solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15))',
                'background:var(--diagram-ui-surface-elevated, #fff)',
                'cursor:pointer',
            ].join(';');

            const typeIcon = IconRegistry.createElement(type);
            if (typeIcon) {
                button.appendChild(typeIcon);
            } else {
                button.textContent = humanize(type).charAt(0);
            }

            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                editView.changeNodeType(node, type);
                this.close();
            });

            toolbar.appendChild(button);
        }

        panel.appendChild(toolbar);

        row.addEventListener('click', (e) => {
            e.preventDefault();
            const expanded = panel.style.display !== 'none';
            panel.style.display = expanded ? 'none' : 'block';
            caret.style.transform = expanded ? 'rotate(-45deg)' : 'rotate(45deg)';
        });

        this.menuElement.appendChild(row);
        this.menuElement.appendChild(panel);
        return true;
    }

    /**
     * Renders a list of action IDs into menu items, collapsing redundant separators
     * and skipping disabled actions.
     */
    private addActions(layout: DiagramActionId[], editView: DiagramEditView | null): void {
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
