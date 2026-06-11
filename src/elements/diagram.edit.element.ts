import type { Diagram } from "../model/diagram";
import { DiagramEditView } from "../control/diagram.edit.view";

export const DIAGRAM_EDIT_TAG = 'pz-diagram-edit';

export class DiagramEditElement extends HTMLElement {

    static get observedAttributes(): string[] {
        return ['diagram-id'];
    }

    private editInstance?: DiagramEditView;

    private editId = 'diagram';

    private initialState?: Partial<Omit<Diagram, 'id'>>;

    public get edit(): DiagramEditView | undefined {
        return this.editInstance;
    }

    public get diagramId(): string {
        return this.editId;
    }

    public set diagramId(value: string) {
        const nextId = value?.trim() || 'diagram';
        if (nextId === this.editId) return;
        this.editId = nextId;
        this.recreateEdit();
    }

    public get diagram(): Partial<Omit<Diagram, 'id'>> | undefined {
        return this.initialState;
    }

    public set diagram(value: Partial<Omit<Diagram, 'id'>> | undefined) {
        this.initialState = value;
        this.recreateEdit();
    }

    connectedCallback(): void {
        if (!this.style.display) {
            this.style.display = 'block';
        }
        this.ensureEdit();
    }

    disconnectedCallback(): void {
        this.destroyEdit();
    }

    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
        if (name === 'diagram-id') {
            this.diagramId = newValue || 'diagram';
        }
    }

    private recreateEdit(): void {
        if (!this.isConnected) return;
        this.destroyEdit();
        this.ensureEdit();
    }

    private ensureEdit(): void {
        if (this.editInstance) return;
        this.editInstance = new DiagramEditView(this.editId, this, this.initialState);
    }

    private destroyEdit(): void {
        this.editInstance?.destroy();
        this.editInstance = undefined;
    }
}

export function registerDiagramEditElement(tagName: string = DIAGRAM_EDIT_TAG): typeof DiagramEditElement {
    if (typeof customElements === 'undefined') {
        throw new Error('Custom elements are not available in this environment.');
    }

    const existing = customElements.get(tagName);
    if (existing) {
        return existing as typeof DiagramEditElement;
    }

    customElements.define(tagName, DiagramEditElement);
    return DiagramEditElement;
}
