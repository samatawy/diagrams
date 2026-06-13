import {
    DIAGRAM_BACKGROUND_CLICK_EVENT,
    DIAGRAM_CHANGED_EVENT,
    DIAGRAM_CONNECTION_CONNECTED_EVENT,
    DIAGRAM_CONNECTION_DISCONNECTED_EVENT,
    DIAGRAM_DELETE_REQUEST_EVENT,
    DIAGRAM_EDIT_CONTEXT_MENU_EVENT,
    DIAGRAM_NODE_CLICK_EVENT,
    DIAGRAM_NODE_ADDED_EVENT,
    DIAGRAM_NODE_DELETED_EVENT,
    DIAGRAM_NODE_MOVED_EVENT,
    DIAGRAM_NODE_POINTS_CHANGED_EVENT,
    DIAGRAM_NODE_RESIZED_EVENT,
    DIAGRAM_SELECTION_EVENT,
    DIAGRAM_TOOL_CHANGED_EVENT,
    DIAGRAM_VIEWPORT_EVENT,
    type DiagramBackgroundClick,
    type DiagramChanged,
    type DiagramChangeScope,
    type DiagramConnectionChange,
    type DiagramDeleteRequest,
    type DiagramEditContextMenu,
    type DiagramNodeChange,
    type DiagramSelectionChange,
    type DiagramToolChange,
    type DiagramViewportChange,
} from "./diagram.events";

export class EventDispatcher {

    private readonly host: HTMLElement;

    constructor(host: HTMLElement) {
        this.host = host;
    }

    public selectionChanged(detail: DiagramSelectionChange): void {
        this.dispatchInternal(DIAGRAM_SELECTION_EVENT, detail);
    }

    public nodeClicked(detail: DiagramSelectionChange): void {
        this.dispatchInternal(DIAGRAM_NODE_CLICK_EVENT, detail);
    }

    public backgroundClicked(detail: DiagramBackgroundClick): void {
        this.dispatchInternal(DIAGRAM_BACKGROUND_CLICK_EVENT, detail);
    }

    public viewportChanged(detail: DiagramViewportChange): void {
        this.dispatchInternal(DIAGRAM_VIEWPORT_EVENT, detail);
    }

    public deleteRequested(detail: DiagramDeleteRequest): boolean {
        return this.dispatchInternal(DIAGRAM_DELETE_REQUEST_EVENT, detail, true);
    }

    public nodeAdded(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_ADDED_EVENT, detail);
    }

    public nodeDeleted(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_DELETED_EVENT, detail);
    }

    public nodeMoved(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_MOVED_EVENT, detail);
    }

    public nodeResized(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_RESIZED_EVENT, detail);
    }

    public nodePointsChanged(detail: DiagramNodeChange): void {
        this.dispatchInternal(DIAGRAM_NODE_POINTS_CHANGED_EVENT, detail);
    }

    public connectionConnected(detail: DiagramConnectionChange): void {
        this.dispatchInternal(DIAGRAM_CONNECTION_CONNECTED_EVENT, detail);
    }

    public connectionDisconnected(detail: DiagramConnectionChange): void {
        this.dispatchInternal(DIAGRAM_CONNECTION_DISCONNECTED_EVENT, detail);
    }

    public editContextMenu(detail: DiagramEditContextMenu): void {
        this.dispatchInternal(DIAGRAM_EDIT_CONTEXT_MENU_EVENT, detail);
    }

    public toolChanged(detail: DiagramToolChange): void {
        this.dispatchInternal(DIAGRAM_TOOL_CHANGED_EVENT, detail);
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
            case DIAGRAM_NODE_POINTS_CHANGED_EVENT:
            case DIAGRAM_CONNECTION_CONNECTED_EVENT:
            case DIAGRAM_CONNECTION_DISCONNECTED_EVENT:
                return "model";
            case DIAGRAM_SELECTION_EVENT:
            case DIAGRAM_VIEWPORT_EVENT:
                return "view";
            case DIAGRAM_TOOL_CHANGED_EVENT:
                return "style";
            default:
                return undefined;
        }
    }
}
