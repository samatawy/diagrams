import type { Diagram } from "../model/diagram";
import { DiagramView } from "../view/diagram.view";
import type { DiagramViewOptions } from "../view/dto";

export const DIAGRAM_VIEW_TAG = 'pz-diagram-view';

export class DiagramViewElement extends HTMLElement {

    static get observedAttributes(): string[] {
        return ['diagram-id'];
    }

    private viewInstance?: DiagramView;

    private viewId = 'diagram';

    private initialState?: Partial<Omit<Diagram, 'id'>>;

    private initialOptions?: DiagramViewOptions;

    public get view(): DiagramView | undefined {
        return this.viewInstance;
    }

    public get diagramId(): string {
        return this.viewId;
    }

    public set diagramId(value: string) {
        const nextId = value?.trim() || 'diagram';
        if (nextId === this.viewId) return;
        this.viewId = nextId;
        this.recreateView();
    }

    public get diagram(): Partial<Omit<Diagram, 'id'>> | undefined {
        return this.initialState;
    }

    public set diagram(value: Partial<Omit<Diagram, 'id'>> | undefined) {
        this.initialState = value;
        this.recreateView();
    }

    public get options(): DiagramViewOptions | undefined {
        return this.initialOptions;
    }

    public set options(value: DiagramViewOptions | undefined) {
        this.initialOptions = value;
        this.recreateView();
    }

    connectedCallback(): void {
        if (!this.style.display) {
            this.style.display = 'block';
        }
        this.ensureView();
    }

    disconnectedCallback(): void {
        this.destroyView();
    }

    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
        if (name === 'diagram-id') {
            this.diagramId = newValue || 'diagram';
        }
    }

    private recreateView(): void {
        if (!this.isConnected) return;
        this.destroyView();
        this.ensureView();
    }

    private ensureView(): void {
        if (this.viewInstance) return;
        this.viewInstance = new DiagramView(this.viewId, this, this.initialState, this.initialOptions);
    }

    private destroyView(): void {
        this.viewInstance?.destroy();
        this.viewInstance = undefined;
    }
}

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