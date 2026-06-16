import type { DiagramEditView } from '../editview/diagram.edit.view';
import { DIAGRAM_CHANGED_EVENT, DIAGRAM_CLIPBOARD_EVENT } from '../events/diagram.events';
import { NodeRegistry } from '../factory';
import { IconRegistry } from '../factory/icon.registry';
import { isConnectionNode } from '../guards';
import { ToolBar, type ToolBarConfig } from './tool.bar';

/**
 * Configuration options for the diagram toolbar.
 * Provide only the properties you want to customize. All other properties will use default values.
 */
export interface DiagramAction {
    /**
     * Unique identifier for the action. This is used to reference the action in the toolbar.
     */
    id: DiagramToolBarLayoutItem;
    /**
     * Optional label for the action. This is used for accessibility and tooltips.
     */
    label: string;
    /**
     * Optional tooltip text for the action. This is displayed on hover.
     */
    tooltip?: string;
    /**
     * Optional icon for the action. This can be an SVG use href (e.g. '#icon-undo'), a URL string, or an Element.
     */
    icon?: string | Element;
    /**
     * Whether the action is a toggle action. Toggle actions can be in an active or inactive state.
     */
    toggle?: boolean;
    /**
     * Called when the button is clicked; receives the diagram view.
     */
    execute: (diagram: DiagramEditView) => void | Promise<void>;
    /** 
     * Returns true when the button should be enabled; defaults to always enabled.
     */
    isEnabled?: (diagram: DiagramEditView) => boolean;
    /**
     * Returns true when the button should appear active/pressed.
     */
    isActive?: (diagram: DiagramEditView) => boolean;
}

/**
 * Configuration options for the diagram toolbar.
 * Provide only the properties you want to customize. All other properties will use default values.
 */
export interface DiagramToolBarConfig extends ToolBarConfig {
    /**
     * Ordered toolbar layout mixing action IDs and separators.
     * Example: ['undo', 'redo', '|', 'delete', 'copy', 'paste']
     * A default layout will be used if none is provided.
     */
    layout?: DiagramToolBarLayoutItem[];
}

/**
 * Available built-in diagram actions. These can be used in the toolbar layout.
 */
export type DiagramToolBarLayoutItem = '|' | 'new' | 'open' | 'save' | 'export' | 'undo' | 'redo' | 'front' | 'back' | 'delete' | 'duplicate' | 'cut' | 'copy' | 'paste' |
    'align-left' | 'align-center' | 'align-right' | 'align-top' | 'align-middle' | 'align-bottom' | 'distribute-h' | 'distribute-v' |
    'text-left' | 'text-center' | 'text-right' | 'text-top' | 'text-middle' | 'text-bottom' |
    'zoom-in' | 'zoom-out' | 'fit-width' | 'fit-all' | 'show-grid' | 'snap-grid' | 'show-guides' | 'snap-guides';

export const DEFAULT_LAYOUT: DiagramToolBarLayoutItem[] = [
    'new',
    'open',
    'save',
    'export',
    '|',
    'show-grid',
    'snap-grid',
    'show-guides',
    'snap-guides',
    '|',
    'zoom-in',
    'zoom-out',
    'fit-width',
    'fit-all',
    '|',
    'undo',
    'redo',
    '|',
    'front',
    'back',
    '|',
    'delete',
    'duplicate',
    'cut',
    'copy',
    'paste',
    '|',
    'align-left',
    'align-center',
    'align-right',
    'align-top',
    'align-middle',
    'align-bottom',
    'distribute-h',
    'distribute-v',
    '|',
    'text-left',
    'text-center',
    'text-right',
    'text-top',
    'text-middle',
    'text-bottom',
];

/**
 * Full catalogue of built-in diagram actions.
 */
export const DIAGRAM_ACTIONS: DiagramAction[] = [
    {
        id: 'new',
        label: 'New Diagram',
        tooltip: 'Create a new diagram',
        execute: async (d) => { await d.newDiagram(); },
    },
    {
        id: 'open',
        label: 'Open Diagram',
        tooltip: 'Open an existing diagram',
        execute: async (d) => { await d.openDiagram(); },
        isEnabled: (d) => d.canOpenDiagram,
    },
    {
        id: 'save',
        label: 'Save Diagram',
        tooltip: 'Save the current diagram',
        execute: async (d) => { await d.saveDiagram(); },
    },
    {
        id: 'export',
        label: 'Export Diagram',
        tooltip: 'Export the diagram as an image or file',
        execute: async (d) => { await d.exportDiagram(); },
    },
    {
        id: 'undo',
        label: 'Undo',
        tooltip: 'Undo (Ctrl+Z)',
        execute: (d) => d.undo(),
        isEnabled: (d) => d.canUndo,
    },
    {
        id: 'redo',
        label: 'Redo',
        tooltip: 'Redo (Ctrl+Shift+Z)',
        execute: (d) => d.redo(),
        isEnabled: (d) => d.canRedo,
    },
    {
        id: 'front',
        label: 'Bring to Front',
        tooltip: 'Bring to front',
        execute: (d) => d.bringSelectionToFront(),
        isEnabled: (d) => d.selection().length > 0,
    },
    {
        id: 'back',
        label: 'Send to Back',
        tooltip: 'Send to back',
        execute: (d) => d.sendSelectionToBack(),
        isEnabled: (d) => d.selection().length > 0,
    },
    {
        id: 'duplicate',
        label: 'Duplicate',
        tooltip: 'Duplicate selection',
        execute: (d) => d.cloneSelected(),
        isEnabled: (d) => d.selection().length > 0,
    },
    {
        id: 'delete',
        label: 'Delete',
        tooltip: 'Delete selection',
        execute: (d) => d.deleteSelected(),
        isEnabled: (d) => d.selection().length > 0,
    },
    {
        id: 'cut',
        label: 'Cut',
        tooltip: 'Cut (Ctrl+X)',
        execute: (d) => d.cutSelected(),
        isEnabled: (d) => d.selection().length > 0,
    },
    {
        id: 'copy',
        label: 'Copy',
        tooltip: 'Copy (Ctrl+C)',
        execute: (d) => d.copySelected(),
        isEnabled: (d) => d.selection().length > 0,
    },
    {
        id: 'paste',
        label: 'Paste',
        tooltip: 'Paste (Ctrl+V)',
        execute: (d) => d.pasteNodes(),
        isEnabled: (d) => !!d.canPaste,
    },
    {
        id: 'zoom-in',
        label: 'Zoom In',
        tooltip: 'Zoom in',
        execute: (d) => d.zoomBy(1.15),
    },
    {
        id: 'zoom-out',
        label: 'Zoom Out',
        tooltip: 'Zoom out',
        execute: (d) => d.zoomBy(1 / 1.15),
    },
    {
        id: 'fit-width',
        label: 'Fit Width',
        tooltip: 'Fit to width',
        execute: (d) => d.fitToWidth(),
    },
    {
        id: 'fit-all',
        label: 'Fit All',
        tooltip: 'Fit all nodes',
        execute: (d) => d.fitToNodes(),
    },
    {
        id: 'show-grid',
        label: 'Show Grid',
        tooltip: 'Toggle grid visibility',
        toggle: true,
        execute: (d) => d.updateGrid({ visible: !d.grid?.visible }),
        isActive: (d) => !!d.grid?.visible,
    },
    {
        id: 'snap-grid',
        label: 'Snap to Grid',
        tooltip: 'Toggle snap to grid',
        toggle: true,
        execute: (d) => d.updateGrid({ forced: !d.grid?.forced }),
        isActive: (d) => !!d.grid?.forced,
    },
    {
        id: 'show-guides',
        label: 'Show Guides',
        tooltip: 'Toggle guide visibility',
        toggle: true,
        execute: (d) => d.updateGuides({ render: !d.guideOptions?.render }),
        isActive: (d) => !!d.guideOptions?.render,
    },
    {
        id: 'snap-guides',
        label: 'Snap to Guides',
        tooltip: 'Toggle snap to guides',
        toggle: true,
        execute: (d) => d.updateGuides({ snap: !d.guideOptions?.snap }),
        isActive: (d) => !!d.guideOptions?.snap,
    },

    // align text
    {
        id: 'text-left',
        label: 'Align Text Left',
        tooltip: 'Align text to left edges',
        toggle: true,
        execute: (d) => d.setTextAlign('left'),
        isActive: (d) => d.selection().length > 0 && d.selection().every(n => n.textAlign === 'left'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some(n => NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-center',
        label: 'Align Text Center',
        tooltip: 'Align text to horizontal centers',
        toggle: true,
        execute: (d) => d.setTextAlign('center'),
        isActive: (d) => d.selection().length > 0 && d.selection().every(n => n.textAlign === 'center'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some(n => NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-right',
        label: 'Align Text Right',
        tooltip: 'Align text to right edges',
        toggle: true,
        execute: (d) => d.setTextAlign('right'),
        isActive: (d) => d.selection().length > 0 && d.selection().every(n => n.textAlign === 'right'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some(n => NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-top',
        label: 'Align Text Top',
        tooltip: 'Align text to top edges',
        toggle: true,
        execute: (d) => d.setTextBaseline('top'),
        isActive: (d) => d.selection().length > 0 && d.selection().every(n => !isConnectionNode(n) && n.textBaseline === 'top'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some(n => !isConnectionNode(n) && NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-middle',
        label: 'Align Text Middle',
        tooltip: 'Align text to vertical centers',
        toggle: true,
        execute: (d) => d.setTextBaseline('middle'),
        isActive: (d) => d.selection().length > 0 && d.selection().every(n => !isConnectionNode(n) && n.textBaseline === 'middle'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some(n => !isConnectionNode(n) && NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-bottom',
        label: 'Align Text Bottom',
        tooltip: 'Align text to bottom edges',
        toggle: true,
        execute: (d) => d.setTextBaseline('bottom'),
        isActive: (d) => d.selection().length > 0 && d.selection().every(n => !isConnectionNode(n) && n.textBaseline === 'bottom'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some(n => !isConnectionNode(n) && NodeRegistry.adapter(n.type)?.has_text),
    },

    // Align nodes
    {
        id: 'align-left',
        label: 'Align Left',
        tooltip: 'Align left edges',
        execute: (d) => d.alignSelected('left'),
        isEnabled: (d) => d.selection().length > 1,
    },
    {
        id: 'align-center',
        label: 'Align Center',
        tooltip: 'Align horizontal centers',
        execute: (d) => d.alignSelected('center'),
        isEnabled: (d) => d.selection().length > 1,
    },
    {
        id: 'align-right',
        label: 'Align Right',
        tooltip: 'Align right edges',
        execute: (d) => d.alignSelected('right'),
        isEnabled: (d) => d.selection().length > 1,
    },
    {
        id: 'align-top',
        label: 'Align Top',
        tooltip: 'Align top edges',
        execute: (d) => d.alignSelected('top'),
        isEnabled: (d) => d.selection().length > 1,
    },
    {
        id: 'align-middle',
        label: 'Align Middle',
        tooltip: 'Align vertical centers',
        execute: (d) => d.alignSelected('middle'),
        isEnabled: (d) => d.selection().length > 1,
    },
    {
        id: 'align-bottom',
        label: 'Align Bottom',
        tooltip: 'Align bottom edges',
        execute: (d) => d.alignSelected('bottom'),
        isEnabled: (d) => d.selection().length > 1,
    },
    {
        id: 'distribute-h',
        label: 'Distribute Horizontally',
        tooltip: 'Distribute spacing horizontally',
        execute: (d) => d.spreadSelected('row'),
        isEnabled: (d) => d.selection().length >= 3,
    },
    {
        id: 'distribute-v',
        label: 'Distribute Vertically',
        tooltip: 'Distribute spacing vertically',
        execute: (d) => d.spreadSelected('column'),
        isEnabled: (d) => d.selection().length >= 3,
    },
];

/** Lookup map built once from the catalogue. */
const ACTION_MAP = new Map<string, DiagramAction>(
    DIAGRAM_ACTIONS.map((a) => [a.id, a])
);

/**
 * DiagramToolBar is a specialized toolbar for diagram editing, providing buttons for common actions like undo, redo, copy, paste, alignment, and zooming.
 * It automatically updates the enabled and active state of buttons based on the current state of the associated DiagramEditView.
 * The toolbar can be configured with a custom layout and styling options.
 * 
 * Example usage:
 * ```ts
 * const toolbar = new DiagramToolBar(toolbarContainer, diagramView, {
 *     layout: ['undo', 'redo', '|', 'copy', 'paste'],
 *     hostClassName: 'my-toolbar',
 * });
 * ```
 */
export class DiagramToolBar extends ToolBar {

    protected diagram: DiagramEditView;

    protected actions: DiagramAction[] = [];

    protected readonly onDiagramChanged = (): void => {
        this.refresh();
    };

    // TODO: This may be redundant if we decide to keep clipboard events in DiagramChangedEvent.
    protected readonly onClipboardChanged = (): void => {
        this.setEnabled('paste', !!this.diagram.canPaste);
    };

    constructor(target: HTMLElement, diagram: DiagramEditView, config: DiagramToolBarConfig = {}) {
        super(target, config);
        this.diagram = diagram;
        this.bindDiagramEvents();
        this.build(config);
        this.refresh();
    }

    /**
     * Cleans up toolbar resources and detaches diagram listeners.
     */
    public destroy(): void {
        this.unbindDiagramEvents();
        super.destroy();
    }

    /** 
     * Re-evaluates enabled and active state for all registered actions.
     */
    public refresh(): void {
        for (const action of this.actions) {
            this.setEnabled(action.id, action.isEnabled ? action.isEnabled(this.diagram) : true);
            this.setActive(action.id, action.isActive ? action.isActive(this.diagram) : false);
        }
    }

    /**
     * Swap the underlying diagram view (e.g. after remounting).
     */
    public setDiagramView(diagram: DiagramEditView): void {
        this.unbindDiagramEvents();
        this.diagram = diagram;
        this.bindDiagramEvents();
        this.refresh();
    }

    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);

        // TODO: This may be redundant if we decide to keep clipboard events in DiagramChangedEvent.
        source?.addEventListener(DIAGRAM_CLIPBOARD_EVENT, this.onClipboardChanged);
    }

    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);

        // TODO: This may be redundant if we decide to keep clipboard events in DiagramChangedEvent.
        source?.removeEventListener(DIAGRAM_CLIPBOARD_EVENT, this.onClipboardChanged);
    }

    protected build(config: DiagramToolBarConfig): void {
        for (const item of this.resolveLayout(config)) {
            if (item === '|') {
                this.addSeparator();
                continue;
            }

            const action = ACTION_MAP.get(item);
            if (!action) {
                continue;
            }

            this.actions.push(action);
            this.addButton({
                id: action.id,
                icon: action.icon || IconRegistry.createElement(action.id) || undefined,
                label: action.label,
                tooltip: action.tooltip,
                toggle: action.toggle,
                disabled: action.isEnabled ? !action.isEnabled(this.diagram) : false,
                onClick: async () => {
                    await action.execute(this.diagram);
                    this.refresh();
                },
            });

            if (action.isActive) {
                this.setActive(action.id, action.isActive(this.diagram));
            }
        }
    }

    protected resolveLayout(config: DiagramToolBarConfig): DiagramToolBarLayoutItem[] {
        return (config.layout?.length ? config.layout : DEFAULT_LAYOUT);
    }
}
