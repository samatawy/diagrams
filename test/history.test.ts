// import type { Illustration } from '../src/illustration/illustration';
import { HistoryStack } from '../src/control/history';
import type { ISerializer } from '../src/io/serialized.types';

interface LayerState {
    id: string;
    shapes: string[];
}

interface DiagramState {
    layers: LayerState[];
}

interface FakeNode {
    id: string;
}

class FakeLayer {
    id: string;
    name: string;
    visible: boolean;
    nodes: string[] = [];
    private shapes: string[];

    constructor(id: string, shapes: string[]) {
        this.id = id;
        this.name = id;
        this.visible = true;
        this.shapes = [...shapes];
        this.nodes = [...shapes];
    }

    write(serializer: ISerializer): string {
        return serializer.write({
            id: this.id,
            shapes: [...this.shapes],
        });
    }

    async read(state: string, serializer: ISerializer): Promise<FakeLayer> {
        const json = await serializer.read<LayerState>(state);

        this.id = json.id;
        this.name = json.id;
        this.shapes = [...json.shapes];
        this.nodes = [...json.shapes];
        return this;
    }

    shapeIds(): string[] {
        return [...this.shapes];
    }
}

class FakeDiagram {
    layers: FakeLayer[];
    grid = {
        forced: false,
        visible: true,
        color: 'lightgray',
        width: 20,
        height: 20,
    };
    private selectedIds = new Set<string>();

    constructor(layers: FakeLayer[]) {
        this.layers = layers;
    }

    selection(): FakeNode[] {
        return [...this.selectedIds].map(id => ({ id }));
    }

    clearSelection(): void {
        this.selectedIds.clear();
    }

    select(node: FakeNode | null): void {
        if (node) {
            this.selectedIds.add(node.id);
        }
    }

    node(id: string): FakeNode | undefined {
        return this.layers.some(layer => layer.shapeIds().includes(id)) ? { id } : undefined;
    }

    layer(id: string): FakeLayer | undefined {
        return this.layers.find(layer => layer.id === id);
    }

    upsertLayer(layer: string | FakeLayer): FakeLayer {
        const created = typeof layer === 'string'
            ? new FakeLayer(`layer-${this.layers.length + 1}`, [])
            : layer;

        const index = this.layers.findIndex(existing => existing.id === created.id);
        if (index >= 0) {
            this.layers[index] = created;
        } else {
            this.layers.push(created);
        }

        return created;
    }

    deleteLayer(id: string): void {
        this.layers = this.layers.filter(layer => layer.id !== id);
    }

    write(serializer: ISerializer): string {
        return serializer.write({
            layers: this.layers.map(layer => ({ id: layer.id, shapes: layer.shapeIds() })),
            selection: [...this.selectedIds],
        });
    }

    async read(state: string, serializer: ISerializer): Promise<this> {
        const json = await serializer.read<DiagramState>(state);
        this.layers = json.layers.map(layer => new FakeLayer(layer.id, layer.shapes));
        return this;
    }
}

function getShapeIds(model: FakeDiagram): string[] {
    return model.layers.flatMap(layer => layer.shapeIds());
}

describe('HistoryStack', () => {
    it('does not include image assets in history snapshots', () => {
        const model = new FakeDiagram([new FakeLayer('layer-a', ['shape-a'])]);
        const history = new HistoryStack(model as unknown as any);

        const baseWrite = model.write.bind(model);
        model.write = (serializer: ISerializer): string => {
            const payload = JSON.parse(baseWrite(serializer));
            payload.image_assets = { 'img-1': 'data:image/png;base64,AAAA' };
            return serializer.write(payload);
        };

        history.addUndo();
        const state = history.getState();
        expect(state).toBeDefined();

        const payload = JSON.parse(state!.document);
        expect(payload.image_assets).toBeUndefined();
    });

    it('deduplicates identical snapshots when addUndo is called repeatedly', async () => {
        const model = new FakeDiagram([new FakeLayer('layer-a', ['shape-a'])]);
        const history = new HistoryStack(model as unknown as any);

        history.addUndo();
        history.addUndo();
        history.addUndo();

        model.layers[0] = new FakeLayer('layer-a', ['shape-b']);
        history.addUndo();

        await history.undo();
        expect(getShapeIds(model)).toEqual(['shape-b']);

        await history.undo();
        expect(getShapeIds(model)).toEqual(['shape-a']);

        await history.undo();
        expect(getShapeIds(model)).toEqual(['shape-a']);
    });

    it('restores forward states correctly across undo and redo', async () => {
        const model = new FakeDiagram([new FakeLayer('layer-a', ['shape-a'])]);
        const history = new HistoryStack(model as unknown as any);

        history.addUndo();
        model.layers[0] = new FakeLayer('layer-a', ['shape-b']);
        model.clearSelection();
        model.select({ id: 'shape-b' });

        history.addUndo();
        model.layers[0] = new FakeLayer('layer-a', ['shape-c']);
        model.clearSelection();
        model.select({ id: 'shape-c' });

        await history.undo();
        expect(getShapeIds(model)).toEqual(['shape-b']);
        expect(model.selection()).toEqual([{ id: 'shape-b' }]);

        await history.undo();
        expect(getShapeIds(model)).toEqual(['shape-a']);
        expect(model.selection()).toEqual([]);

        await history.redo();
        expect(getShapeIds(model)).toEqual(['shape-b']);
        expect(model.selection()).toEqual([{ id: 'shape-b' }]);

        await history.redo();
        expect(getShapeIds(model)).toEqual(['shape-c']);
        expect(model.selection()).toEqual([{ id: 'shape-c' }]);
    });
});