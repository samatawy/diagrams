import { mountView, makeBox, makeLine, NodeHandle } from '../demo-common.js';

mountView('state-machine-demo', {
    id: 'state-machine-demo',
    populate(view) {
        const layer = view.upsertLayer('main');

        const idle = makeBox(view, 'idle', 'ellipse', 70, 90, 150, 84, {
            text: 'Idle',
            fillStyle: '#e0f2fe',
            strokeStyle: { color: '#0369a1' },
        });
        const running = makeBox(view, 'running', 'ellipse', 310, 90, 180, 84, {
            text: 'Running',
            fillStyle: '#dcfce7',
            strokeStyle: { color: '#15803d' },
        });
        const waiting = makeBox(view, 'waiting', 'ellipse', 560, 90, 180, 84, {
            text: 'Waiting For Input',
            fillStyle: '#fef3c7',
            strokeStyle: { color: '#a16207' },
        });
        const failed = makeBox(view, 'failed', 'ellipse', 310, 260, 180, 84, {
            text: 'Failed',
            fillStyle: '#fee2e2',
            strokeStyle: { color: '#b91c1c' },
        });

        const edges = [
            makeLine(view, 'idle-running', [{ x: 220, y: 130 }, { x: 310, y: 130 }], {
                from: { node: 'idle', handle: NodeHandle.E },
                to: { node: 'running', handle: NodeHandle.W },
            }),
            makeLine(view, 'running-waiting', [{ x: 490, y: 130 }, { x: 560, y: 130 }], {
                from: { node: 'running', handle: NodeHandle.E },
                to: { node: 'waiting', handle: NodeHandle.W },
            }),
            makeLine(view, 'waiting-running', [{ x: 650, y: 180 }, { x: 520, y: 245 }, { x: 400, y: 180 }], {
                from: { node: 'waiting', handle: NodeHandle.S },
                to: { node: 'running', handle: NodeHandle.S },
            }),
            makeLine(view, 'running-failed', [{ x: 400, y: 174 }, { x: 400, y: 260 }], {
                from: { node: 'running', handle: NodeHandle.S },
                to: { node: 'failed', handle: NodeHandle.N },
            }),
            makeLine(view, 'failed-idle', [{ x: 310, y: 300 }, { x: 180, y: 245 }, { x: 140, y: 174 }], {
                from: { node: 'failed', handle: NodeHandle.W },
                to: { node: 'idle', handle: NodeHandle.S },
            }),
        ];

        for (const node of [idle, running, waiting, failed, ...edges]) {
            view.upsertNode(node);
            layer.nodes.push(node.id);
        }
    },
});
