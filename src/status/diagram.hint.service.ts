import type { DiagramEditView } from "../editview";
import type { DiagramEditor } from "../editor";
import { DIAGRAM_HINT_EVENT, DIAGRAM_TOOL_CHANGED_EVENT, type DiagramHintChange } from "../events";

type HintLayer = 'interaction' | 'focus' | 'hover' | 'base';

export class DiagramHintService {

    private readonly diagram: DiagramEditView;

    private readonly host: HTMLElement;

    private readonly hints = new Map<HintLayer, string>();

    private readonly hintListeners: Array<(hint: string) => void> = [];

    private readonly onDiagramToolChanged = (): void => {
        this.setHintLayer('base', `Tool: ${this.diagram.currentTool || 'select'}`);
    };

    private readonly onHintEvent = (event: Event): void => {
        const detail = (event as CustomEvent<DiagramHintChange>).detail;
        this.applyHintEvent(detail);
    };

    constructor(diagram: DiagramEditView, host: HTMLElement, editor?: DiagramEditor) {
        this.diagram = diagram;
        this.host = host;

        // The editor parameter is accepted for API continuity and future use.
        void editor;

        this.setHintLayer('base', `Tool: ${this.diagram.currentTool || 'select'}`);

        this.bind();
    }

    public destroy(): void {
        this.unbind();
        this.hintListeners.length = 0;
    }

    public get hint(): string {
        return this.hints.get('interaction')
            || this.hints.get('focus')
            || this.hints.get('hover')
            || this.hints.get('base')
            || '';
    }

    public onHintChanged(listener: (hint: string) => void): void {
        this.hintListeners.push(listener);
    }

    private bind(): void {
        this.host.addEventListener(DIAGRAM_TOOL_CHANGED_EVENT, this.onDiagramToolChanged);
        this.host.addEventListener(DIAGRAM_HINT_EVENT, this.onHintEvent as EventListener);
    }

    private unbind(): void {
        this.host.removeEventListener(DIAGRAM_TOOL_CHANGED_EVENT, this.onDiagramToolChanged);
        this.host.removeEventListener(DIAGRAM_HINT_EVENT, this.onHintEvent as EventListener);
    }

    private setHintLayer(layer: HintLayer, hint: string): void {
        const next = hint.trim();
        if (!next) {
            this.clearHintLayer(layer);
            return;
        }

        const previous = this.hints.get(layer);
        if (previous === next) {
            return;
        }

        this.hints.set(layer, next);
        this.updateHint();
    }

    private clearHintLayer(layer: HintLayer): void {
        if (this.hints.delete(layer)) {
            this.updateHint();
        }
    }

    private applyHintEvent(detail: DiagramHintChange): void {
        if (!detail) {
            return;
        }

        const layer = this.resolveLayer(detail.source);
        if (!layer) {
            return;
        }

        const next = (detail.hint || '').trim();
        const active = detail.active ?? next.length > 0;

        if (!active || !next) {
            this.clearHintLayer(layer);
            return;
        }

        this.setHintLayer(layer, next);
    }

    private resolveLayer(source: DiagramHintChange['source']): HintLayer | undefined {
        switch (source) {
            case 'diagram-interaction':
                return 'interaction';
            case 'editor-focus':
                return 'focus';
            case 'editor-hover':
                return 'hover';
            case 'editor-context':
                return 'base';
            default:
                return undefined;
        }
    }

    private updateHint(): void {
        const hint = this.hint;
        for (const listener of this.hintListeners) {
            listener(hint);
        }
    }

}