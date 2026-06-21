import type { DiagramEditView } from '../editview/diagram.edit.view';
import { NodeRegistry } from '../factory';
import { isConnection, isConnectionNode } from '../guards';

/**
 * Available built-in diagram actions. These can be used in the toolbar layout, context menu, etc.
 */
export type DiagramActionId = '|' | 'new' | 'open' | 'save' | 'export' |
    'show-grid' | 'snap-grid' | 'show-guides' | 'snap-guides' |
    'zoom-in' | 'zoom-out' | 'fit-width' | 'fit-all' |
    'undo' | 'redo' |
    'front' | 'back' |
    'delete' | 'duplicate' | 'cut' | 'copy' | 'paste' | 'copy-styles' | 'paste-styles' |
    'align-left' | 'align-center' | 'align-right' | 'align-top' | 'align-middle' | 'align-bottom' | 'distribute-h' | 'distribute-v' |
    'text-left' | 'text-center' | 'text-right' | 'text-top' | 'text-middle' | 'text-bottom';

export interface DiagramAction {
    /**
     * Unique identifier for the action. This is used to reference the action in the toolbar.
     */
    id: DiagramActionId;
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
        execute: async (d) => { await d.saveImageDiagram(); },
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
        isEnabled: (d) => d.selection().some((n) => !isConnection(n)),
    },
    {
        id: 'back',
        label: 'Send to Back',
        tooltip: 'Send to back',
        execute: (d) => d.sendSelectionToBack(),
        isEnabled: (d) => d.selection().some((n) => !isConnection(n)),
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
        id: 'copy-styles',
        label: 'Copy Styles',
        tooltip: 'Copy Styles (Ctrl+Shift+C)',
        execute: (d) => d.copyStyles(),
        isEnabled: (d) => d.selection().length === 1,
    },
    {
        id: 'paste-styles',
        label: 'Paste Styles',
        tooltip: 'Paste Styles (Ctrl+Shift+V)',
        execute: (d) => d.pasteStyles(),
        isEnabled: (d) => d.canPasteStyles && d.selection().length > 0,
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
        isActive: (d) => d.selection().length > 0 && d.selection().every((n) => n.textAlign === 'left'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some((n) => NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-center',
        label: 'Align Text Center',
        tooltip: 'Align text to horizontal centers',
        toggle: true,
        execute: (d) => d.setTextAlign('center'),
        isActive: (d) => d.selection().length > 0 && d.selection().every((n) => n.textAlign === 'center'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some((n) => NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-right',
        label: 'Align Text Right',
        tooltip: 'Align text to right edges',
        toggle: true,
        execute: (d) => d.setTextAlign('right'),
        isActive: (d) => d.selection().length > 0 && d.selection().every((n) => n.textAlign === 'right'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some((n) => NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-top',
        label: 'Align Text Top',
        tooltip: 'Align text to top edges',
        toggle: true,
        execute: (d) => d.setTextBaseline('top'),
        isActive: (d) => d.selection().length > 0 && d.selection().every((n) => !isConnectionNode(n) && n.textBaseline === 'top'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some((n) => !isConnectionNode(n) && NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-middle',
        label: 'Align Text Middle',
        tooltip: 'Align text to vertical centers',
        toggle: true,
        execute: (d) => d.setTextBaseline('middle'),
        isActive: (d) => d.selection().length > 0 && d.selection().every((n) => !isConnectionNode(n) && n.textBaseline === 'middle'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some((n) => !isConnectionNode(n) && NodeRegistry.adapter(n.type)?.has_text),
    },
    {
        id: 'text-bottom',
        label: 'Align Text Bottom',
        tooltip: 'Align text to bottom edges',
        toggle: true,
        execute: (d) => d.setTextBaseline('bottom'),
        isActive: (d) => d.selection().length > 0 && d.selection().every((n) => !isConnectionNode(n) && n.textBaseline === 'bottom'),
        isEnabled: (d) => d.selection().length > 0 && d.selection().some((n) => !isConnectionNode(n) && NodeRegistry.adapter(n.type)?.has_text),
    },

    // Align nodes
    {
        id: 'align-left',
        label: 'Align Left',
        tooltip: 'Align left edges',
        execute: (d) => d.alignSelected('left'),
        isEnabled: (d) => d.selection().filter((n) => !isConnectionNode(n)).length > 1,
    },
    {
        id: 'align-center',
        label: 'Align Center',
        tooltip: 'Align horizontal centers',
        execute: (d) => d.alignSelected('center'),
        isEnabled: (d) => d.selection().filter((n) => !isConnectionNode(n)).length > 1,
    },
    {
        id: 'align-right',
        label: 'Align Right',
        tooltip: 'Align right edges',
        execute: (d) => d.alignSelected('right'),
        isEnabled: (d) => d.selection().filter((n) => !isConnectionNode(n)).length > 1,
    },
    {
        id: 'align-top',
        label: 'Align Top',
        tooltip: 'Align top edges',
        execute: (d) => d.alignSelected('top'),
        isEnabled: (d) => d.selection().filter((n) => !isConnectionNode(n)).length > 1,
    },
    {
        id: 'align-middle',
        label: 'Align Middle',
        tooltip: 'Align vertical centers',
        execute: (d) => d.alignSelected('middle'),
        isEnabled: (d) => d.selection().filter((n) => !isConnectionNode(n)).length > 1,
    },
    {
        id: 'align-bottom',
        label: 'Align Bottom',
        tooltip: 'Align bottom edges',
        execute: (d) => d.alignSelected('bottom'),
        isEnabled: (d) => d.selection().filter((n) => !isConnectionNode(n)).length > 1,
    },
    {
        id: 'distribute-h',
        label: 'Distribute Horizontally',
        tooltip: 'Distribute spacing horizontally',
        execute: (d) => d.spreadSelected('row'),
        isEnabled: (d) => d.selection().filter((n) => !isConnectionNode(n)).length >= 3,
    },
    {
        id: 'distribute-v',
        label: 'Distribute Vertically',
        tooltip: 'Distribute spacing vertically',
        execute: (d) => d.spreadSelected('column'),
        isEnabled: (d) => d.selection().filter((n) => !isConnectionNode(n)).length >= 3,
    },
];

/**
 * Lookup map built once from the catalogue.
 */
export const ACTION_MAP = new Map<string, DiagramAction>(
    DIAGRAM_ACTIONS.map((a) => [a.id, a])
);

