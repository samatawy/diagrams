import type { DiagramEditView } from '../../editview/diagram.edit.view';
import { DIAGRAM_CHANGED_EVENT, DIAGRAM_CLIPBOARD_EVENT } from '../../events/diagram.events';
import { IconRegistry } from '../../factory/icon.registry';
import { Toolbar, type ToolbarConfig } from './toolbar';
import { DEFAULT_DIAGRAM_TOOLBAR_LAYOUT, type DiagramToolBarLayoutItem } from './diagram.toolbar.layouts';
import { type DiagramAction, ACTION_MAP, DIAGRAM_ACTIONS } from './diagram.actions';

/**
 * Configuration options for the diagram toolbar.
 * Provide only the properties you want to customize. All other properties will use default values.
 */
export interface DiagramToolBarConfig extends ToolbarConfig {
    /**
     * Ordered toolbar layout mixing action IDs and separators.
     * Example: ['undo', 'redo', '|', 'delete', 'copy', 'paste']
     * A default layout will be used if none is provided.
     */
    layout?: DiagramToolBarLayoutItem[];
}

export class DiagramToolBar extends Toolbar {

    protected diagram: DiagramEditView;

    protected actions: DiagramAction[] = [];

    protected readonly onDiagramChanged = (): void => {
        this.refresh();
    };

    // TODO: This may be redundant if we decide to keep clipboard events in DiagramChangedEvent.
    protected readonly onClipboardChanged = (): void => {
        this.setEnabled('paste', !!this.diagram.canPaste);
    };

    /**
     * Builds a diagram action toolbar attached to the given diagram view.
     * @param target The host element that will contain the toolbar buttons.
     * @param diagram The diagram view whose actions the toolbar controls.
     * @param config Optional layout and style configuration.
     */
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

    /**
     * Subscribes to diagram-level events that trigger toolbar state updates.
     */
    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);

        // TODO: This may be redundant if we decide to keep clipboard events in DiagramChangedEvent.
        source?.addEventListener(DIAGRAM_CLIPBOARD_EVENT, this.onClipboardChanged);
    }

    /**
     * Unsubscribes all diagram-level event listeners attached by {@link bindDiagramEvents}.
     */
    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);

        // TODO: This may be redundant if we decide to keep clipboard events in DiagramChangedEvent.
        source?.removeEventListener(DIAGRAM_CLIPBOARD_EVENT, this.onClipboardChanged);
    }

    /**
     * Instantiates buttons for each action in the resolved layout.
     * @param config The toolbar config used to determine the button layout.
     */
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

    /**
     * Returns the ordered list of layout items from config, or falls back to the default layout.
     * @param config The toolbar config.
     * @returns The resolved layout array.
     */
    protected resolveLayout(config: DiagramToolBarConfig): DiagramToolBarLayoutItem[] {
        return (config.layout?.length ? config.layout : DEFAULT_DIAGRAM_TOOLBAR_LAYOUT);
    }
}
