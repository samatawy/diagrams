import { mountView, makeBox, makeLine, NodeHandle } from '../demo-common.js';

mountView('decision-tree-demo', {
    id: 'decision-tree-demo',
    populate(view) {
        const layer = view.upsertLayer('main');

        const start = makeBox(view, 'start', 'round_rectangle', 80, 40, 180, 64, {
            text: 'New Lead',
            fillStyle: '#e0f2fe',
            strokeStyle: { color: '#075985' },
        });
        const qualify = makeBox(view, 'qualify', 'rhombus', 110, 150, 140, 100, {
            text: 'Qualified?',
            fillStyle: '#fef3c7',
            strokeStyle: { color: '#92400e' },
        });
        const nurture = makeBox(view, 'nurture', 'rectangle', 360, 150, 200, 84, {
            text: 'Nurture Campaign',
            fillStyle: '#fae8ff',
            strokeStyle: { color: '#7e22ce' },
        });
        const demo = makeBox(view, 'demo', 'rectangle', 40, 300, 200, 84, {
            text: 'Schedule Demo',
            fillStyle: '#dcfce7',
            strokeStyle: { color: '#166534' },
        });
        const close = makeBox(view, 'close', 'rectangle', 300, 300, 220, 84, {
            text: 'Prepare Proposal',
            fillStyle: '#fee2e2',
            strokeStyle: { color: '#b91c1c' },
        });

        const edges = [
            makeLine(view, 'edge-start', [{ x: 170, y: 104 }, { x: 180, y: 150 }], {
                from: { node: 'start', handle: NodeHandle.S, relative: { x: 0, y: 0 } },
                to: { node: 'qualify', handle: NodeHandle.N, relative: { x: 0, y: 0 } },
            }),
            makeLine(view, 'edge-no', [{ x: 250, y: 200 }, { x: 360, y: 190 }], {
                from: { node: 'qualify', handle: NodeHandle.E, relative: { x: 0, y: 0 } },
                to: { node: 'nurture', handle: NodeHandle.W, relative: { x: 0, y: 0 } },
            }),
            makeLine(view, 'edge-yes', [{ x: 145, y: 250 }, { x: 140, y: 300 }], {
                from: { node: 'qualify', handle: NodeHandle.S, relative: { x: 0, y: 0 } },
                to: { node: 'demo', handle: NodeHandle.N, relative: { x: 0, y: 0 } },
            }),
            makeLine(view, 'edge-demo', [{ x: 240, y: 340 }, { x: 300, y: 340 }], {
                from: { node: 'demo', handle: NodeHandle.E, relative: { x: 0, y: 0 } },
                to: { node: 'close', handle: NodeHandle.W, relative: { x: 0, y: 0 } },
            }),
        ];

        for (const node of [start, qualify, nurture, demo, close, ...edges]) {
            view.upsertNode(node);
            layer.nodes.push(node.id);
        }
    },
});
