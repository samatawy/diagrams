import {
    DIAGRAM_BACKGROUND_CLICK_EVENT,
    DIAGRAM_CLIPBOARD_EVENT,
    DIAGRAM_CHANGED_EVENT,
    DIAGRAM_CONNECTION_CONNECTED_EVENT,
    DIAGRAM_CONNECTION_DISCONNECTED_EVENT,
    DIAGRAM_DELETE_REQUEST_EVENT,
    DIAGRAM_EDIT_CONTEXT_MENU_EVENT,
    DIAGRAM_HINT_EVENT,
    DIAGRAM_NODE_CLICK_EVENT,
    DIAGRAM_NODE_ADDED_EVENT,
    DIAGRAM_NODE_DELETED_EVENT,
    DIAGRAM_NODE_MOVED_EVENT,
    DIAGRAM_NODE_POINTS_CHANGED_EVENT,
    DIAGRAM_NODE_RESIZED_EVENT,
    DIAGRAM_NODE_GEOMETRY_ALTERED_EVENT,
    DIAGRAM_SELECTION_EVENT,
    DIAGRAM_TOOL_CHANGED_EVENT,
    DIAGRAM_VIEWPORT_EVENT,
    type DiagramBackgroundClick,
    type DiagramClipboardEventDetail,
    type DiagramChanged,
    type DiagramChangeScope,
    type DiagramConnectionChange,
    type DiagramDeleteRequest,
    type DiagramEditContextMenu,
    type DiagramHintChange,
    type DiagramNodeChange,
    type DiagramSelectionChange,
    type DiagramToolChange,
    type DiagramViewportChange,
} from "./diagram.events";

/**
 * Dispatches typed diagram events from a host element and emits a companion
 * diagram-changed event for high-level change tracking.
 */
export class EventDispatcher {

    private readonly host: HTMLElement;

    /**
     * Creates an EventDispatcher bound to a host element.
     * @param host The element that will emit diagram events.
     */
    constructor(host: HTMLElement) {
        this.host = host;
    }

    /**
     * Emits the diagram selection change event.
     * @param detail Selection payload.
     */
    public selectionChanged(detail: DiagramSelectionChange): void {
        this.dispatchInternal(DIAGRAM_SELECTION_EVENT, detail);
    }

    /**
     * Emits the node-click event.
     * @param detail Node-click payload.
     */
    public nodeClicked(detail: DiagramSelectionChange): void {
        this.dispatchInternal(DIAGRAM_NODE_CLICK_EVENT, detail);
    }

    /**
     * Emits the background-click event.
     * @param detail Background-click payload.
     */
    public backgroundClicked(detail: DiagramBackgroundClick): void {
        this.dispatchInternal(DIAGRAM_BACKGROUND_CLICK_EVENT, detail);
    }

    /**
     * Emits the viewport-change event.
     * @param detail Viewport payload.
     */
    public viewportChanged(detail: DiagramViewportChange): void {
        this.dispatchInternal(DIAGRAM_VIEWPORT_EVENT, detail);
    }

    /**
     * Emits the delete-request event as cancelable.
     * @param detail Delete-request payload.
     * @returns True when the request was not canceled.
     */
    public deleteRequested(detail: DiagramDeleteRequest): boolean {
        return this.dispatchInternal(DIAGRAM_DELETE_REQUEST_EVENT, detail, true);
    }

    /**
     * Emits the node-added event.
     * @param detail Node change payload.
     */
    public nodeAdded(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_ADDED_EVENT, detail);
    }

    /**
     * Emits the node-deleted event.
     * @param detail Node change payload.
     */
    public nodeDeleted(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_DELETED_EVENT, detail);
    }

    /**
     * Emits the node-moved event.
     * @param detail Node change payload.
     */
    public nodeMoved(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_MOVED_EVENT, detail);
    }

    /**
     * Emits the node-resized event.
     * @param detail Node change payload.
     */
    public nodeResized(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_RESIZED_EVENT, detail);
    }

    /**
     * Emits the node-geometry-altered event.
     * @param detail Node change payload.
     */
    public nodeGeometryAltered(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_GEOMETRY_ALTERED_EVENT, detail);
    }

    /**
     * Emits the node-points-changed event.
     * @param detail Node change payload.
     */
    public nodePointsChanged(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_POINTS_CHANGED_EVENT, detail);
    }

    /**
     * Emits the connection-connected event.
     * @param detail Connection change payload.
     */
    public connectionConnected(detail: DiagramConnectionChange): void {
        this.dispatchInternal(DIAGRAM_CONNECTION_CONNECTED_EVENT, detail);
    }

    /**
     * Emits the connection-disconnected event.
     * @param detail Connection change payload.
     */
    public connectionDisconnected(detail: DiagramConnectionChange): void {
        this.dispatchInternal(DIAGRAM_CONNECTION_DISCONNECTED_EVENT, detail);
    }

    /**
     * Emits the diagram edit context-menu event.
     * @param detail Context-menu payload.
     */
    public editContextMenu(detail: DiagramEditContextMenu): void {
        this.dispatchInternal(DIAGRAM_EDIT_CONTEXT_MENU_EVENT, detail);
    }

    /**
     * Emits the tool-changed event.
     * @param detail Tool-change payload.
     */
    public toolChanged(detail: DiagramToolChange): void {
        this.dispatchInternal(DIAGRAM_TOOL_CHANGED_EVENT, detail);
    }

    /**
     * Emits a style-scope diagram change event.
     * @param sourceEvent The name of the triggering event. 
     */
    public styleChanged(sourceEvent: string): void {
        this.dispatchInternal(DIAGRAM_CHANGED_EVENT, {
            scope: 'style',
            sourceEvent,
        }, false);
    }

    /**
     * Emits the clipboard-change event.
     * @param detail Clipboard payload.
     */
    public clipboardChanged(detail: DiagramClipboardEventDetail): void {
        this.dispatchInternal(DIAGRAM_CLIPBOARD_EVENT, detail);
    }

    /**
     * Emits the diagram-hint event.
     * @param detail Hint payload.
     */
    public hintChanged(detail: DiagramHintChange): void {
        this.dispatchInternal(DIAGRAM_HINT_EVENT, detail);
    }

    private dispatchInternal<T>(eventName: string, detail: T, cancelable: boolean = false): boolean {
        const dispatched = this.host.dispatchEvent(new CustomEvent<T>(eventName, {
            detail,
            bubbles: true,
            cancelable,
        }));

        if (eventName !== DIAGRAM_CHANGED_EVENT) {
            const scope = this.resolveDiagramChangeScope(eventName);
            if (scope) {
                this.host.dispatchEvent(new CustomEvent<DiagramChanged>(DIAGRAM_CHANGED_EVENT, {
                    detail: { scope, sourceEvent: eventName },
                    bubbles: true,
                }));
            }
        }

        return dispatched;
    }

    private resolveDiagramChangeScope(eventName: string): DiagramChangeScope | undefined {
        switch (eventName) {
            case DIAGRAM_NODE_ADDED_EVENT:
            case DIAGRAM_NODE_DELETED_EVENT:
            case DIAGRAM_NODE_MOVED_EVENT:
            case DIAGRAM_NODE_RESIZED_EVENT:
            case DIAGRAM_NODE_GEOMETRY_ALTERED_EVENT:
            case DIAGRAM_NODE_POINTS_CHANGED_EVENT:
            case DIAGRAM_CONNECTION_CONNECTED_EVENT:
            case DIAGRAM_CONNECTION_DISCONNECTED_EVENT:
                return "model";
            case DIAGRAM_SELECTION_EVENT:
            case DIAGRAM_VIEWPORT_EVENT:
            case DIAGRAM_CLIPBOARD_EVENT:
                return "view";
            case DIAGRAM_TOOL_CHANGED_EVENT:
                return "style";
            case DIAGRAM_HINT_EVENT:
            default:
                return undefined;
        }
    }
}
