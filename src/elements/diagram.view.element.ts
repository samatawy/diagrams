import type { Diagram } from "../model/diagram";
import { DiagramView } from "../view/diagram.view";
import type { DiagramViewOptions } from "../view/view.options";

/** Default custom element tag name for the view-only diagram host. */
export const DIAGRAM_VIEW_TAG = 'pz-diagram-view';

/**
 * Custom element wrapper that hosts a {@link DiagramView} instance.
 *
 * The element recreates its internal view when input properties change,
 * allowing declarative usage through attributes/properties.
 */
export class DiagramViewElement extends HTMLElement {

    /** Attributes observed by the custom element runtime. */
    static get observedAttributes(): string[] {
        return ['diagram-id'];
    }

    private viewInstance?: DiagramView;

    private viewId = 'diagram';

    private initialState?: Partial<Omit<Diagram, 'id'>>;

    private initialOptions?: DiagramViewOptions;

    /** Returns the current DiagramView instance when initialized. */
    public get view(): DiagramView | undefined {
        return this.viewInstance;
    }

    /** Gets the diagram identifier used to initialize the internal view. */
    public get diagramId(): string {
        return this.viewId;
    }

    /**
     * Sets the diagram identifier and recreates the internal view when changed.
     * @param value New diagram id.
     */
    public set diagramId(value: string) {
        const nextId = value?.trim() || 'diagram';
        if (nextId === this.viewId) return;
        this.viewId = nextId;
        this.recreateView();
    }

    /** Gets the initial diagram state used when creating the internal view. */
    public get diagram(): Partial<Omit<Diagram, 'id'>> | undefined {
        return this.initialState;
    }

    /**
     * Sets initial diagram data and recreates the internal view when connected.
     * @param value Initial diagram state.
     */
    public set diagram(value: Partial<Omit<Diagram, 'id'>> | undefined) {
        this.initialState = value;
        this.recreateView();
    }

    /** Gets initial view options used when creating the internal view. */
    public get options(): DiagramViewOptions | undefined {
        return this.initialOptions;
    }

    /**
     * Sets view options and recreates the internal view when connected.
     * @param value Initial view options.
     */
    public set options(value: DiagramViewOptions | undefined) {
        this.initialOptions = value;
        this.recreateView();
    }

    /**
     * Lifecycle callback fired when the element is attached to the DOM.
     */
    public connectedCallback(): void {
        if (!this.style.display) {
            this.style.display = 'block';
        }
        this.ensureView();
    }

    /**
     * Lifecycle callback fired when the element is detached from the DOM.
     */
    public disconnectedCallback(): void {
        this.destroyView();
    }

    /**
     * Reacts to observed attribute changes.
     * @param name Attribute name.
     * @param _oldValue Previous attribute value.
     * @param newValue New attribute value.
     */
    public attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
        if (name === 'diagram-id') {
            this.diagramId = newValue || 'diagram';
        }
    }

    /** Recreates the internal view when the element is connected. */
    private recreateView(): void {
        if (!this.isConnected) return;
        this.destroyView();
        this.ensureView();
    }

    /** Creates the internal view if it does not yet exist. */
    private ensureView(): void {
        if (this.viewInstance) return;
        this.viewInstance = new DiagramView(this.viewId, this, this.initialState, this.initialOptions);
    }

    /** Destroys and clears the internal view instance. */
    private destroyView(): void {
        this.viewInstance?.destroy();
        this.viewInstance = undefined;
    }
}

/**
 * Registers the diagram view custom element if not already registered.
 * @param tagName The custom element tag name to register.
 * @returns The DiagramViewElement constructor.
 */
export function registerDiagramViewElement(tagName: string = DIAGRAM_VIEW_TAG): typeof DiagramViewElement {
    if (typeof customElements === 'undefined') {
        throw new Error('Custom elements are not available in this environment.');
    }

    const existing = customElements.get(tagName);
    if (existing) {
        return existing as typeof DiagramViewElement;
    }

    customElements.define(tagName, DiagramViewElement);
    return DiagramViewElement;
}