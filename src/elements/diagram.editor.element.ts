import { Diagram } from "../model/diagram";
import { DiagramEditor } from "../editor/diagram.editor";

/** Default custom element tag name for the diagram editor host. */
export const DIAGRAM_EDITOR_TAG = 'pz-diagram-editor';

/**
 * Custom element wrapper that hosts a {@link DiagramEditor} instance.
 *
 * The element recreates its internal view when input properties change,
 * allowing declarative usage through attributes/properties.
 */
export class DiagramEditorElement extends HTMLElement {

    /** Attributes observed by the custom element runtime. */
    static get observedAttributes(): string[] {
        return ['diagram-id'];
    }

    private editorInstance?: DiagramEditor;

    private editorId = 'diagram';

    private initialState?: Partial<Omit<Diagram, 'id'>>;

    /** Returns the current DiagramEditor instance when initialized. */
    public get editor(): DiagramEditor | undefined {
        return this.editorInstance;
    }

    /** Gets the diagram identifier used to initialize the internal editor view. */
    public get diagramId(): string {
        return this.editorId;
    }

    /**
     * Sets the diagram identifier and recreates the internal view when changed.
     * @param value New diagram id.
     */
    public set diagramId(value: string) {
        const nextId = value?.trim() || 'diagram';
        if (nextId === this.editorId) return;
        this.editorId = nextId;
        this.recreateEditor();
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
        this.recreateEditor();
    }

    /**
     * Lifecycle callback fired when the element is attached to the DOM.
     */
    public connectedCallback(): void {
        if (!this.style.display) {
            this.style.display = 'block';
        }
        this.ensureEditor();
    }

    /**
     * Lifecycle callback fired when the element is detached from the DOM.
     */
    public disconnectedCallback(): void {
        this.destroyEditor();
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

    /** Recreates the internal editor view when the element is connected. */
    private recreateEditor(): void {
        if (!this.isConnected) return;
        this.destroyEditor();
        this.ensureEditor();
    }

    /** Creates the internal editor view if it does not yet exist. */
    private ensureEditor(): void {
        if (this.editorInstance) return;
        const diagram = this.initialState
            ? new Diagram(this.editorId, this.initialState)
            : undefined;
        this.editorInstance = new DiagramEditor(this, undefined, diagram);
    }

    /** Destroys and clears the internal editor view instance. */
    private destroyEditor(): void {
        this.editorInstance?.destroy();
        this.editorInstance = undefined;
    }
}

/**
 * Registers the diagram editor custom element if not already registered.
 * @param tagName The custom element tag name to register.
 * @returns The DiagramEditorElement constructor.
 */
export function registerDiagramEditorElement(tagName: string = DIAGRAM_EDITOR_TAG): typeof DiagramEditorElement {
    if (typeof customElements === 'undefined') {
        throw new Error('Custom elements are not available in this environment.');
    }

    const existing = customElements.get(tagName);
    if (existing) {
        return existing as typeof DiagramEditorElement;
    }

    customElements.define(tagName, DiagramEditorElement);
    return DiagramEditorElement;
}
