import { jsonSerializer } from "../io/json.serializer";
import type { HasSelection, IDiagram } from "../interfaces";
import type { ISerializer } from "../io/serialized.types";

export interface HistoryState {
    document: string,
    selection: string[],
}

/**
 * A class that manages the history of changes to a diagram, allowing for undo and redo functionality.
 * It tracks the state of the diagram at various points in time and provides methods to restore previous states.
 */
export class HistoryStack {

    private diagram: IDiagram & HasSelection;

    private undoList: HistoryState[] = [];

    private redoList: HistoryState[] = [];

    private readonly historySerializer: ISerializer = {
        write: (data: unknown): string => {
            if (!data || typeof data !== 'object') {
                return jsonSerializer.write(data);
            }

            const record = data as Record<string, unknown>;

            if (!Object.prototype.hasOwnProperty.call(record, 'image_assets') || record.image_assets === undefined) {
                return jsonSerializer.write(data);
            }

            const payload = { ...record };
            delete payload.image_assets;
            return jsonSerializer.write(payload);
        },
        read: <T>(data: string): Promise<T> => jsonSerializer.read<T>(data),
    };

    /**
     * Creates an instance of HistoryStack and attaches it to a diagram model that supports selection.
     * The HistoryStack will use the model's serialization and selection capabilities to manage history states.
     * @param diagram The diagram model to attach to the history stack.
     */
    constructor(diagram: IDiagram & HasSelection) {
        this.diagram = diagram;
    }

    /**
     * Retrieves the current state of the diagram, including its serialized document and selected nodes.
     * @returns the current history state or undefined if the diagram is not available.
     */
    public getState(): HistoryState | undefined {
        if (!this.diagram) return undefined;

        return {
            document: this.diagram.write(this.historySerializer),
            selection: this.diagram.selection().map(node => node.id),
        };
    }

    /**
     * Restores the diagram to a previous state.
     * @param state The history state to restore.
     * @returns A promise that resolves to true if the state was successfully restored, false otherwise.
     */
    public async restoreState(state: HistoryState): Promise<boolean> {
        if (!this.diagram || !state)
            return new Promise<boolean>(resolve => resolve(false));

        await this.diagram.read(state.document, jsonSerializer);
        this.diagram.clearSelection();
        state.selection.map(id => {
            let node = this.diagram.node(id);
            if (node) this.diagram.select(node, 'isolated');
        });
        return true;
    }

    /**
     * Indicates whether there are any states in the undo stack that can be undone. Returns true if there is at least one state in the undo stack, false otherwise.
     * @returns true if undo is possible, false otherwise.
     */
    public get canUndo(): boolean {
        return this.undoList.length > 0;
    }

    /**
     * Indicates whether there are any states in the redo stack that can be redone. Returns true if there is at least one state in the redo stack, false otherwise.
     * @returns true if redo is possible, false otherwise.
     */
    public get canRedo(): boolean {
        return this.redoList.length > 0;
    }

    /**
     * Clears the history stacks for both undo and redo, effectively resetting the history of changes.
     */
    public clear() {
        this.undoList = [];
        this.redoList = [];
    }

    /**
     * Adds the current state of the diagram to the undo stack.
     * This should be called whenever a change is made to the diagram that should be undoable.
     */
    public addUndo() {
        if (!this.diagram || !this.diagram.layers || !this.diagram.layers.length) return;

        let state = this.getState();

        if (state) {
            const latest = this.undoList[0];
            if (!latest || !this.isSameState(latest, state)) {
                this.undoList.splice(0, 0, state);
            }
        }
        this.redoList = [];
    }

    /**
     * Undoes the last change made to the diagram by restoring the previous state from the undo stack.
     * The current state is pushed onto the redo stack to allow for redo operations.
     * @returns A promise that resolves to true if the undo operation was successful, false otherwise.
     */
    public async undo(): Promise<boolean> {
        if (!this.undoList.length)
            return new Promise<boolean>(resolve => resolve(false));

        let state = this.undoList.shift();
        if (state) {
            let recent = this.getState();
            if (recent) this.redoList.splice(0, 0, recent);

            await this.restoreState(state);

            return true;
        } else {
            return false;
        }
    }

    /**
     * Redoes the last undone change by restoring the state from the redo stack.
     * The current state is pushed onto the undo stack to allow for undo operations.
     * @returns A promise that resolves to true if the redo operation was successful, false otherwise.
     */
    public async redo(): Promise<boolean> {
        if (!this.redoList.length)
            return new Promise<boolean>(resolve => resolve(false));

        let state = this.redoList.shift();
        if (state) {
            let recent = this.getState();
            if (recent) this.undoList.splice(0, 0, recent);

            await this.restoreState(state);
            return true;
        } else {
            return false;
        }
    }

    private isSameState(a: HistoryState, b: HistoryState): boolean {
        return JSON.stringify(a.document) === JSON.stringify(b.document);
    }
}