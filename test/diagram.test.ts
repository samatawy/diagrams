import { Diagram, type ILayer, type INode, type ISerializedDiagram } from '../src/index';
import { jsonSerializer } from '../src/io/json.serializer';

function createNode(id: string, text: string, x: number, y: number): INode {
    return {
        id,
        type: 'rectangle',
        points: [
            { x, y },
            { x: x + 120, y: y + 48 },
        ],
        text,
        strokeStyle: '#000000',
        owner: {} as Diagram,
    };
}

describe('Diagram', () => {
    it('upserts nodes in place and assigns the owning diagram', () => {
        const diagram = new Diagram('demo');
        const node = createNode('node-1', 'Input', 20, 40);

        const inserted = diagram.upsertNode(node);
        const updated = diagram.upsertNode({
            ...createNode('node-1', 'Updated', 35, 30),
            fillStyle: '#dbeafe',
        });

        expect(inserted.owner).toBe(diagram);
        expect(updated.owner).toBe(diagram);
        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.nodes[0]?.text).toBe('Updated');
        expect(diagram.nodes[0]?.points).toEqual([
            { x: 35, y: 30 },
            { x: 155, y: 78 },
        ]);
    });

    it('reads a persisted json object and writes the same structure back', async () => {
        const source = {
            id: 'persisted-demo',
            nodes: [
                {
                    id: 'source',
                    type: 'rectangle',
                    points: [
                        { x: 20, y: 40 },
                        { x: 140, y: 88 },
                    ],
                    hollow: false,
                    text: 'Source',
                    textAlign: 'center',
                    textBaseline: 'middle',
                    font: '16px Tahoma',
                    img_mode: 'none',
                    ready: false,
                    transparent: false,
                    strokeStyle: '#000000',
                    fillStyle: '#ffffff',
                    textColor: '#000000',
                    lineWidth: 1,
                    angle: 0,
                },
                {
                    id: 'target',
                    type: 'rectangle',
                    points: [
                        { x: 260, y: 40 },
                        { x: 380, y: 88 },
                    ],
                    hollow: false,
                    text: 'Target',
                    textAlign: 'center',
                    textBaseline: 'middle',
                    fontFace: 'Tahoma',
                    fontSize: 16,
                    // font: '16px Tahoma',
                    img_mode: 'none',
                    ready: false,
                    transparent: false,
                    strokeStyle: '#000000',
                    fillStyle: '#ffffff',
                    textColor: '#000000',
                    lineWidth: 1,
                    angle: 0,
                },
                {
                    id: 'link',
                    type: 'line',
                    points: [
                        { x: 140, y: 64 },
                        { x: 260, y: 64 },
                    ],
                    hollow: true,
                    text: '',
                    textAlign: 'center',
                    textBaseline: 'middle',
                    fontFace: 'Tahoma',
                    fontSize: 16,
                    // font: '16px Tahoma',
                    img_mode: 'none',
                    ready: false,
                    transparent: true,
                    strokeStyle: '#2563eb',
                    fillStyle: 'transparent',
                    textColor: '#000000',
                    lineWidth: 2,
                    angle: 0,
                    from: { node: 'source', handle: 8 },
                    to: { node: 'target', handle: 4 },
                    endArrow: true,
                },
            ],
            layers: [
                {
                    id: 'main',
                    name: 'Main',
                    visible: true,
                    nodes: ['source', 'target', 'link'],
                },
            ],
            meta: { title: 'Persisted Demo' },
        } as ISerializedDiagram;

        const restored = await new Diagram('empty').read(source, jsonSerializer);

        expect(restored.id).toBe('persisted-demo');
        expect(restored.node('source')?.owner).toBe(restored);
        expect(restored.layer('main')?.nodes).toEqual(['source', 'target', 'link']);
        expect(JSON.parse(restored.write(jsonSerializer))).toEqual(source);
    });

    it('supports string and object layer upserts', () => {
        const diagram = new Diagram('demo');

        const created = diagram.upsertLayer('main');
        const replacement: ILayer = { id: 'main', name: 'Main Layer', visible: false, nodes: [] };
        const updated = diagram.upsertLayer(replacement);

        expect(created.id).toBe('main');
        expect(created.name).toBe('main');
        expect(created.visible).toBe(true);

        expect(updated).toBe(replacement);
        expect(diagram.layers).toHaveLength(1);
        expect(diagram.layer('main')).toBe(replacement);
        expect(diagram.layer('main')?.name).toBe('Main Layer');
        expect(diagram.layer('main')?.visible).toBe(false);
    });

    it('roundtrips persisted diagrams without runtime-only fields', async () => {
        const diagram = new Diagram('demo');
        const source = createNode('source', 'Source', 20, 40);
        const target = createNode('target', 'Target', 260, 40);
        const connection = {
            ...createNode('link', '', 0, 0),
            type: 'line',
            points: [
                { x: 140, y: 64 },
                { x: 260, y: 64 },
            ],
            from: { node: source, handle: 8 },
            to: { node: 'target', handle: 4 },
            endArrow: true,
        } as INode & { from: { node: INode; handle: number }; to: { node: string; handle: number }; endArrow: boolean };

        diagram.upsertNode(source);
        diagram.upsertNode(target);
        diagram.upsertNode(connection);
        diagram.upsertLayer({ id: 'main', name: 'Main', visible: true, nodes: ['source', 'target', 'link'] });

        const serialized = JSON.parse(diagram.write(jsonSerializer));

        expect(serialized.nodes).toHaveLength(3);
        expect(serialized.nodes.find((node: any) => node.id === 'source')?.owner).toBeUndefined();
        expect(serialized.nodes.find((node: any) => node.id === 'link')).toMatchObject({
            from: { node: 'source', handle: 8 },
            to: { node: 'target', handle: 4 },
            endArrow: true,
        });
        expect(serialized.layers).toEqual([
            {
                id: 'main',
                name: 'Main',
                visible: true,
                nodes: ['source', 'target', 'link'],
            },
        ]);

        const restored = await new Diagram('empty').read(serialized, jsonSerializer);

        expect(restored.nodes).toHaveLength(3);
        expect(restored.node('source')?.owner).toBe(restored);
        expect(restored.layer('main')?.nodes).toEqual(['source', 'target', 'link']);
        expect((restored.node('link') as any)?.from).toEqual({ node: 'source', handle: 8 });
        expect((restored.node('link') as any)?.to).toEqual({ node: 'target', handle: 4 });
        expect(JSON.parse(restored.write(jsonSerializer))).toEqual(serialized);
    });

    it('disconnects remaining connectors when a referenced node is removed', () => {
        const diagram = new Diagram('demo');
        const source = createNode('source', 'Source', 20, 40);
        const target = createNode('target', 'Target', 260, 40);
        const connection = {
            ...createNode('link', '', 0, 0),
            type: 'line',
            points: [
                { x: 140, y: 64 },
                { x: 260, y: 64 },
            ],
            from: { node: source, handle: 8 },
            to: { node: target, handle: 4 },
        } as INode & { from: { node: INode; handle: number }; to: { node: INode; handle: number } };

        diagram.upsertNode(source);
        diagram.upsertNode(target);
        diagram.upsertNode(connection);
        diagram.upsertLayer({ id: 'main', name: 'Main', visible: true, nodes: ['source', 'target', 'link'] });

        diagram.deleteNode('source');

        expect(diagram.node('source')).toBeUndefined();
        expect(diagram.layer('main')?.nodes).toEqual(['target', 'link']);
        expect((diagram.node('link') as any)?.from).toBeUndefined();
        expect((diagram.node('link') as any)?.to).toEqual({ node: target, handle: 4 });
    });

    it('sets and clears node image backgrounds at model level', () => {
        const diagram = new Diagram('demo');
        const node = createNode('node-1', 'Node', 20, 40);
        diagram.upsertNode(node);

        diagram.setNodeImageSource('node-1', 'https://example.com/bg.png', 'pattern', 'bg-1');

        expect(diagram.node('node-1')?.img_mode).toBe('pattern');
        expect(diagram.node('node-1')?.image_id).toBe('bg-1');
        expect(diagram.resolveNodeImageSource('node-1')).toBe('https://example.com/bg.png');

        diagram.clearNodeImageSource('node-1');

        expect(diagram.node('node-1')?.image_id).toBeUndefined();
        expect(diagram.node('node-1')?.img_mode).toBe('none');
        expect(diagram.resolveNodeImageSource('node-1')).toBeUndefined();
    });

    it('reuses one asset id for identical image sources across nodes', () => {
        const diagram = new Diagram('demo');
        const nodeA = createNode('node-a', 'A', 20, 40);
        const nodeB = createNode('node-b', 'B', 120, 40);
        diagram.upsertNode(nodeA);
        diagram.upsertNode(nodeB);

        const src = 'data:image/png;base64,AAAA';
        diagram.setNodeImageSource('node-a', src, 'frame');
        diagram.setNodeImageSource('node-b', src, 'pattern');

        expect(diagram.node('node-a')?.image_id).toBeDefined();
        expect(diagram.node('node-a')?.image_id).toBe(diagram.node('node-b')?.image_id);
        expect(diagram.resolveNodeImageSource('node-a')).toBe(src);
        expect(diagram.resolveNodeImageSource('node-b')).toBe(src);

        const payload = JSON.parse(diagram.write(jsonSerializer));
        const serializedA = payload.nodes.find((n: any) => n.id === 'node-a');
        const serializedB = payload.nodes.find((n: any) => n.id === 'node-b');

        expect(serializedA.image_id).toBeDefined();
        expect(serializedB.image_id).toBeDefined();
    });

    it('serializes and restores the shared image asset dictionary', async () => {
        const diagram = new Diagram('demo');
        const node = createNode('node-1', 'Node', 20, 40);
        diagram.upsertNode(node);

        const src = 'data:image/png;base64,BBBB';
        diagram.setNodeImageSource('node-1', src, 'frame', 'img-1');

        const payload = JSON.parse(diagram.write(jsonSerializer));
        expect(payload.image_assets).toEqual({ 'img-1': src });
        expect(payload.nodes[0].image_id).toBe('img-1');

        const restored = await new Diagram('empty').read(payload, jsonSerializer);
        expect(restored.node('node-1')?.image_id).toBe('img-1');
        expect(restored.resolveNodeImageSource('node-1')).toBe(src);
    });

    it('converts SVG markup to data URL for node background images', () => {
        const diagram = new Diagram('demo');
        const node = createNode('node-1', 'Node', 20, 40);
        diagram.upsertNode(node);

        diagram.setNodeSvgSource('node-1', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>');
        const src = diagram.resolveNodeImageSource('node-1') || '';

        expect(src.startsWith('data:image/svg+xml;utf8,')).toBe(true);
        expect(diagram.node('node-1')?.img_mode).toBe('frame');
    });
});
