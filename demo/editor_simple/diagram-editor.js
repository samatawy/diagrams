import { DiagramEditor } from '../../dist/index.js';
import { registerAdapters, makeBox, makeLine } from '../demo-common.js';
import { NodeHandle } from '../../dist/index.js';

registerAdapters();

const host = document.getElementById('diagram-editor-host');
if (!host) throw new Error('Host element not found');

const editor = new DiagramEditor(host);

const view = editor.getDiagramView();
const layer = view.upsertLayer('main');
view.setCurrentLayer(layer);

const headline = makeBox(view, 'headline', 'text', 70, 40, 220, 48, {
    text: 'DiagramEditor — default config',
    strokeStyle: '#111827',
    fillStyle: 'transparent',
    hollow: true,
    font: '20px Georgia',
    textBaseline: 'middle',
});
const service = makeBox(view, 'service', 'round_rectangle', 60, 130, 200, 84, {
    text: 'API Service',
    fillStyle: '#dbeafe',
    strokeStyle: '#1d4ed8',
});
const queue = makeBox(view, 'queue', 'rectangle', 340, 130, 180, 84, {
    text: 'Work Queue',
    fillStyle: '#ede9fe',
    strokeStyle: '#6d28d9',
});
const worker = makeBox(view, 'worker', 'ellipse', 620, 130, 180, 84, {
    text: 'Worker',
    fillStyle: '#dcfce7',
    strokeStyle: '#15803d',
});
const note = makeBox(view, 'note', 'rectangle', 340, 290, 240, 92, {
    text: 'No custom wiring needed.\nJust new DiagramEditor(host).',
    fillStyle: '#fff7ed',
    strokeStyle: '#c2410c',
    textBaseline: 'middle',
});

const edges = [
    makeLine(view, 'service-queue', [{ x: 260, y: 172 }, { x: 340, y: 172 }], {
        from: { node: 'service', handle: NodeHandle.E },
        to: { node: 'queue', handle: NodeHandle.W },
    }),
    makeLine(view, 'queue-worker', [{ x: 520, y: 172 }, { x: 620, y: 172 }], {
        from: { node: 'queue', handle: NodeHandle.E },
        to: { node: 'worker', handle: NodeHandle.W },
    }),
    makeLine(view, 'worker-note', [{ x: 700, y: 214 }, { x: 700, y: 320 }, { x: 580, y: 336 }], {
        from: { node: 'worker', handle: NodeHandle.S },
        to: { node: 'note', handle: NodeHandle.E },
    }),
];

for (const node of [headline, service, queue, worker, note, ...edges]) {
    view.upsertNode(node);
    layer.nodes.push(node.id);
}

view.fitToNodes(48, { horizontal: 'center', vertical: 'center' });
