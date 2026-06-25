import type { ILayer, INode } from "../interfaces";
import type { Diagram } from "../model/diagram";
import type { DiagramView } from "../view";

export type ZOrderAction = 'bringForward' | 'bringToFront' | 'sendBackward' | 'sendToBack';

// export interface ZOrderHost {
//     layers: ILayer[];
//     selection(): INode[];
//     layer(id: string): ILayer | undefined;
//     addUndo(): void;
//     render(what?: 'nodes' | 'selection' | 'all'): void;
//     renderPreview(layer?: ILayer): void;
// }

/**
 * Handles z-ordering of nodes and layers in the diagram. This class is used by DiagramEditView to implement the z-ordering methods.
 * The ZOrder class provides methods to reorder nodes and layers based on a specified action (bring forward, send backward, bring to front, send to back). 
 * It operates on the current selection of nodes or a specific layer/node as needed.
 * The class ensures that any changes to the z-ordering are properly tracked for undo functionality and that the diagram is re-rendered to reflect the changes.
 */
export class ZOrder {

    private host: DiagramView;

    /**
        * Creates an instance of ZOrder and attaches it to a DiagramView (e.g., DiagramEditView).
        * This allows the ZOrder instance to manipulate the layers and nodes of the host diagram when reordering.
        * @param host The DiagramView instance to attach to, which provides access to the diagram's layers, selection, and rendering methods.
        */
    constructor(host: DiagramView) {
        this.host = host;
    }

    /**
     * Reorders the currently selected nodes based on the specified action.
     * Changes are made to the attached host's layers and nodes, and the diagram is re-rendered to reflect the new z-ordering.
     * @param action The z-order action to perform (bring forward, send backward, bring to front, send to back).
     */
    public reorderSelection(action: ZOrderAction): void {
        const selected = new Set(this.host.selection().map(node => node.id));
        if (!selected.size) {
            return;
        }

        let changed = false;
        for (const layer of this.host.layers) {
            const next = this.reorderSelected(layer.nodes, selected, action);
            if (this.hasChanged(layer.nodes, next)) {
                if (!changed) {
                    (this.host as any).addUndo();
                }
                layer.nodes = next;
                changed = true;
            }
        }

        if (changed) {
            (this.host as any).render('all');
            (this.host as any).renderPreview();
        }
    }

    /**
     * Reorders the specified layer based on the given action.
     * Changes are made to the attached host's layers, and the diagram is re-rendered to reflect the new z-ordering.
     * @param layer The target layer or layer ID to reorder.
     * @param action The z-order action to perform (bring forward, send backward, bring to front, send to back).
     */
    public reorderLayer(layer: string | ILayer, action: ZOrderAction): void {
        const targetId = typeof layer === 'string' ? layer : layer.id;
        if (!this.host.layer(targetId)) {
            return;
        }

        const current = this.host.layers.map(one => one.id);
        const next = this.reorderSelected(current, new Set([targetId]), action);
        const changed = this.hasChanged(current, next);
        if (changed) {
            (this.host as any).addUndo();
            this.host.layers = next.map(id => this.host.layer(id)!);
            // .splice(0, this.host.layers.length, ...next.map(id => this.host.layer(id)!).filter((one): one is ILayer => !!one));
            // this.layers = next.map(id => this.host.layer(id)!);
        } else {
            return;
        }

        // const byId = new Map(this.host.layers.map(one => [one.id, one]));
        // (this.host as any).addUndo();
        // this.host.layers.splice(0, this.host.layers.length, ...next.map(id => byId.get(id)!).filter((one): one is ILayer => !!one));
        if (changed) {
            (this.host as any).render('all');
            (this.host as any).renderPreview();
        }
    }

    /**
     * Reorders the specified node based on the given action, confined within its layer.
     * Changes are made to the attached host's layers, and the diagram is re-rendered to reflect the new z-ordering.
     * @param node The target node or node ID to reorder.
     * @param action The z-order action to perform (bring forward, send backward, bring to front, send to back).
     */
    public reorderNode(node: string | INode, action: ZOrderAction): void {
        const targetId = typeof node === 'string' ? node : node.id;

        for (const layer of this.host.layers) {
            if (!layer.nodes.includes(targetId)) {
                continue;
            }

            const next = this.reorderSelected(layer.nodes, new Set([targetId]), action);
            const changed = this.hasChanged(layer.nodes, next);
            if (changed) {
                (this.host as any).addUndo();
                layer.nodes = next;
            } else {
                continue;
            }

            // layer.nodes = next;
            if (changed) {
                (this.host as any).render('all');
                (this.host as any).renderPreview();
                return;
            }
        }
    }

    private reorderSelected(ids: string[], selected: Set<string>, action: ZOrderAction): string[] {
        if (!selected.size) {
            return ids;
        }

        switch (action) {
            case 'bringToFront': {
                const picked = ids.filter(id => selected.has(id));
                const rest = ids.filter(id => !selected.has(id));
                return [...rest, ...picked];
            }
            case 'sendToBack': {
                const picked = ids.filter(id => selected.has(id));
                const rest = ids.filter(id => !selected.has(id));
                return [...picked, ...rest];
            }
            case 'bringForward': {
                const next = [...ids];
                for (let i = next.length - 2; i >= 0; i--) {
                    if (selected.has(next[i]!) && !selected.has(next[i + 1]!)) {
                        const current = next[i]!;
                        next[i] = next[i + 1]!;
                        next[i + 1] = current;
                    }
                }
                return next;
            }
            case 'sendBackward': {
                const next = [...ids];
                for (let i = 1; i < next.length; i++) {
                    if (selected.has(next[i]!) && !selected.has(next[i - 1]!)) {
                        const current = next[i]!;
                        next[i] = next[i - 1]!;
                        next[i - 1] = current;
                    }
                }
                return next;
            }
        }
    }

    private hasChanged(current: string[], next: string[]): boolean {
        return current.length !== next.length || current.some((id, index) => id !== next[index]);
    }

}