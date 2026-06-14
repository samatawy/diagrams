import { DiagramEditor, ThemeRegistry, DEFAULT_LAYOUT } from '../../dist/index.js';
import { registerAdapters, makeBox, makeLine } from '../demo-common.js';
import { NodeHandle } from '../../dist/index.js';

registerAdapters();

// ── Theme definition ──────────────────────────────────────────────────────────
//
// A warm indigo theme. Accent is shifted to indigo-700, surfaces use a warm
// off-white, controls are slightly larger and more rounded than the defaults.
//
ThemeRegistry.registerTheme('indigo', {
    // Accent: indigo-700 family
    accent: '#4338ca',
    accentContrast: '#ffffff',
    borderStrong: 'rgba(67, 56, 202, 0.65)',
    hoverBg: 'rgba(67, 56, 202, 0.08)',

    // Surfaces: warm off-white
    // Surfaces: warm tinted lavender — noticeably different from plain white
    surface: 'rgba(238, 236, 255, 0.92)',
    surfaceElevated: '#f0eeff',

    // Text: warm dark slate
    text: '#1e1b4b',
    textMuted: '#4f4a7a',

    // Borders: slightly warmer than default
    // Borders: more prominent — higher opacity, slightly heavier
    border: 'rgba(67, 56, 202, 0.28)',
    borderWidth: '1.5px',

    // Shadow: indigo tinted
    // Shadow: indigo tinted, stronger
    shadowColor: 'rgba(30, 27, 74, 0.28)',

    // Shape: more rounded, slightly larger controls
    controlRadius: '12px',
    panelRadius: '14px',
    controlHeight: '34px',
    paletteButtonSize: '44px',
    paletteButtonPadding: '10px',

    // Spacing: a touch more breathing room
    controlGap: '8px',
    groupGap: '6px',
    toolbarGap: '8px',
    controlPaddingX: '10px',
    controlPaddingY: '7px',
    panelPadding: '8px',

    // Typography: unchanged family, slightly larger label size
    labelFontSize: '12px',
});

// ── Apply theme to host before mounting ───────────────────────────────────────
const host = document.getElementById('diagram-editor-host');
if (!host) throw new Error('Host element not found');

ThemeRegistry.apply(host, 'indigo');

// ── Mount editor ──────────────────────────────────────────────────────────────
const firstSeparatorIndex = DEFAULT_LAYOUT.indexOf('|');
const toolbarLayout = firstSeparatorIndex >= 0
    ? DEFAULT_LAYOUT.slice(firstSeparatorIndex + 1)
    : [...DEFAULT_LAYOUT];

const editor = new DiagramEditor(host, {
    toolbars: [
        {
            layout: toolbarLayout,
        },
    ],
});

const view = editor.getDiagramView();
const layer = view.upsertLayer('main');
view.setCurrentLayer(layer);

const headline = makeBox(view, 'headline', 'text', 70, 40, 260, 48, {
    text: 'DiagramEditor — indigo theme',
    strokeStyle: '#1e1b4b',
    fillStyle: 'transparent',
    hollow: true,
    font: '20px Georgia',
    textBaseline: 'middle',
});
const service = makeBox(view, 'service', 'round_rectangle', 60, 130, 200, 84, {
    text: 'API Service',
    fillStyle: '#e0e7ff',
    strokeStyle: '#4338ca',
});
const queue = makeBox(view, 'queue', 'rectangle', 340, 130, 180, 84, {
    text: 'Work Queue',
    fillStyle: '#ede9fe',
    strokeStyle: '#6d28d9',
});
const worker = makeBox(view, 'worker', 'ellipse', 620, 130, 180, 84, {
    text: 'Worker',
    fillStyle: '#fef3c7',
    strokeStyle: '#b45309',
});
const note = makeBox(view, 'note', 'rectangle', 340, 290, 240, 92, {
    text: 'Themed via ThemeRegistry.\nNo CSS class overrides needed.',
    fillStyle: '#fdf8f0',
    strokeStyle: '#a16207',
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
