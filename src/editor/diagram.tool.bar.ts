import type { DiagramEditView } from '../editview/diagram.edit.view';
import { DIAGRAM_CHANGED_EVENT } from '../events/diagram.events';
import { IconRegistry } from '../factory/icon.registry';
import { ToolBar, type ToolBarConfig } from './tool.bar';

export interface DiagramAction {
    id: DiagramToolBarLayoutItem;
    label: string;
    tooltip?: string;
    icon?: string | Element;
    /** True if this button reflects an on/off toggle state */
    toggle?: boolean;
    /** Called when the button is clicked; receives the diagram view */
    execute: (diagram: DiagramEditView) => void | Promise<void>;
    /** Returns true when the button should be enabled; defaults to always enabled */
    isEnabled?: (diagram: DiagramEditView) => boolean;
    /** Returns true when the button should appear active/pressed */
    isActive?: (diagram: DiagramEditView) => boolean;
}

export interface DiagramToolBarConfig extends ToolBarConfig {
    /** Ordered toolbar layout mixing action IDs and separators. */
    layout?: DiagramToolBarLayoutItem[];
}

export type DiagramToolBarLayoutItem = '|' | 'undo' | 'redo' | 'front' | 'back' | 'delete' | 'duplicate' | 'cut' | 'copy' | 'paste' |
    'align-left' | 'align-center' | 'align-right' | 'align-top' | 'align-middle' | 'align-bottom' | 'distribute-h' | 'distribute-v' |
    'zoom-in' | 'zoom-out' | 'fit-width' | 'fit-all' | 'show-grid' | 'snap-grid';

export const DEFAULT_LAYOUT: DiagramToolBarLayoutItem[] = [
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
    'zoom-in',
    'zoom-out',
    'fit-width',
    'fit-all',
    '|',
    'show-grid',
    'snap-grid',
];

/** Full catalogue of built-in diagram actions. */
export const DIAGRAM_ACTIONS: DiagramAction[] = [
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
        execute: (d) => d.fitToWidth(48),
    },
    {
        id: 'fit-all',
        label: 'Fit All',
        tooltip: 'Fit all nodes',
        execute: (d) => d.fitToNodes(48),
    },
    {
        id: 'show-grid',
        label: 'Show Grid',
        tooltip: 'Toggle grid visibility',
        toggle: true,
        execute: (d) => d.updateGrid({ visible: !(d.grid as any)?.visible }),
        isActive: (d) => !!(d.grid as any)?.visible,
    },
    {
        id: 'snap-grid',
        label: 'Snap to Grid',
        tooltip: 'Toggle snap to grid',
        toggle: true,
        execute: (d) => d.updateGrid({ forced: !(d.grid as any)?.forced }),
        isActive: (d) => !!(d.grid as any)?.forced,
    },
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

export class DiagramToolBar extends ToolBar {

    protected diagram: DiagramEditView;

    protected actions: DiagramAction[] = [];

    protected readonly onDiagramChanged = (): void => {
        this.refresh();
    };

    constructor(
        target: HTMLElement,
        diagram: DiagramEditView,
        config: DiagramToolBarConfig = {}
    ) {
        super(target, config);
        this.diagram = diagram;
        this.bindDiagramEvents();
        this.build(config);
        this.refresh();
    }

    public destroy(): void {
        this.unbindDiagramEvents();
        super.destroy();
    }

    /** Re-evaluates enabled and active state for all registered actions. */
    public refresh(): void {
        for (const action of this.actions) {
            this.setEnabled(action.id, action.isEnabled ? action.isEnabled(this.diagram) : true);
            this.setActive(action.id, action.isActive ? action.isActive(this.diagram) : false);
        }
    }

    /** Swap the underlying diagram view (e.g. after remounting). */
    public setDiagramView(diagram: DiagramEditView): void {
        this.unbindDiagramEvents();
        this.diagram = diagram;
        this.bindDiagramEvents();
        this.refresh();
    }

    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
    }

    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
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
