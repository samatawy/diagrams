import {
    mountEditor,
    makeBox,
    makeLine,
    NodeHandle,
    DIAGRAM_CHANGED_EVENT,
} from '../demo-common.js';

import {
    ColorSelect,
    WidthSelect,
    FontSelect,
    SizeSelect,
    ToolPalette,
    DiagramToolBar,
} from '../../dist/index.js';

const host = document.getElementById('editor-components-demo');
const toolListHost = document.getElementById('component-tool-list');
const actionToolbarHost = document.getElementById('component-action-toolbar');

const fontFaceHost = document.getElementById('font-face-select');
const fontSizeHost = document.getElementById('font-size-select');

const textPresetHost = document.getElementById('text-preset-select');
const strokePresetHost = document.getElementById('stroke-preset-select');
const fillPresetHost = document.getElementById('fill-preset-select');
const lineWidthHost = document.getElementById('line-width-select');

const FONT_FACES = [
    'Tahoma',
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Trebuchet MS',
    'Verdana',
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40];
const LINE_WIDTHS = [1, 2, 3, 4, 5, 6, 7, 8];

function toHexColor(value, fallback = '#111827') {
    if (typeof value !== 'string') {
        return fallback;
    }

    const color = value.trim();
    const shortMatch = /^#([0-9a-fA-F]{3})$/;
    const longMatch = /^#([0-9a-fA-F]{6})$/;

    if (longMatch.test(color)) {
        return color.toLowerCase();
    }

    const short = color.match(shortMatch);
    if (short) {
        const [r, g, b] = short[1].split('');
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    return fallback;
}

function normalizeColorPreset(value, fallback = '#111827') {
    if (typeof value === 'string' && value.trim().toLowerCase() === 'transparent') {
        return 'transparent';
    }

    return toHexColor(value, fallback);
}

function setColorOptions(control, colors, selected) {
    const unique = Array.from(new Set(colors.map((value) => normalizeColorPreset(value, selected))));
    const selectedColor = normalizeColorPreset(selected, selected);
    const ordered = ['transparent', ...unique.filter((value) => value !== 'transparent')];

    if (!ordered.includes(selectedColor)) {
        ordered.push(selectedColor);
    }

    control.clearOptions();
    control.addOptions(ordered);
    control.value = selectedColor;
}

const editor = mountEditor('editor-components-demo', {
    id: 'editor-components-demo',
    populate(view) {
        const layer = view.upsertLayer('main');
        view.setCurrentLayer(layer);

        const headline = makeBox(view, 'headline', 'text', 70, 40, 220, 48, {
            text: 'Edit me with Enter',
            strokeStyle: '#111827',
            fillStyle: 'transparent',
            hollow: true,
            font: '24px Georgia',
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
            text: 'Try selection, marquee, space-pan,\\nAlt point editing, and text editing.',
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
    },
});

const actionToolbar = actionToolbarHost
    ? new DiagramToolBar(actionToolbarHost, editor, {
        hostClassName: 'editor-top-toolbar',
    })
    : null;

const toolPalette = toolListHost ? new ToolPalette(toolListHost, editor) : null;

const textPreset = textPresetHost ? new ColorSelect(textPresetHost, {
    showNativeInput: 'start',
    nativeInputAriaLabel: 'Custom text color',
}) : null;
const strokePreset = strokePresetHost ? new ColorSelect(strokePresetHost, {
    showNativeInput: 'end',
    nativeInputAriaLabel: 'Custom line color',
}) : null;
const fillPreset = fillPresetHost ? new ColorSelect(fillPresetHost, {
    showNativeInput: 'option',
    nativeInputAriaLabel: 'Custom fill color',
}) : null;
const lineWidthPreset = lineWidthHost ? new WidthSelect(lineWidthHost, { widths: LINE_WIDTHS }) : null;
const fontFacePreset = fontFaceHost ? new FontSelect(fontFaceHost, { fonts: FONT_FACES }) : null;
const fontSizePreset = fontSizeHost ? new SizeSelect(fontSizeHost, { sizes: FONT_SIZES }) : null;

let syncingControls = false;
let refreshQueued = false;

function scheduleRefreshState() {
    if (refreshQueued) {
        return;
    }

    refreshQueued = true;
    requestAnimationFrame(() => {
        refreshQueued = false;
        refreshState();
    });
}

textPresetHost?.addEventListener('colorchange', (event) => {
    if (syncingControls) {
        return;
    }
    const color = normalizeColorPreset(event.detail, '#111827');
    editor.setTextColor(color);
    scheduleRefreshState();
});

strokePresetHost?.addEventListener('colorchange', (event) => {
    if (syncingControls) {
        return;
    }
    const color = normalizeColorPreset(event.detail, '#111827');
    editor.setStrokeColor(color);
    scheduleRefreshState();
});

fillPresetHost?.addEventListener('colorchange', (event) => {
    if (syncingControls) {
        return;
    }
    const color = normalizeColorPreset(event.detail, '#ffffff');
    editor.setFillColor(color);
    scheduleRefreshState();
});

lineWidthHost?.addEventListener('widthchange', (event) => {
    if (syncingControls) {
        return;
    }
    const width = Number(event.detail);
    if (Number.isFinite(width) && width > 0) {
        editor.setLineWidth(width);
        scheduleRefreshState();
    }
});

fontFaceHost?.addEventListener('fontchange', (event) => {
    if (syncingControls) {
        return;
    }
    const next = event.detail;
    if (next) {
        editor.setFontFace(next);
        scheduleRefreshState();
    }
});

fontSizeHost?.addEventListener('sizechange', (event) => {
    if (syncingControls) {
        return;
    }
    const next = Number(event.detail);
    if (Number.isFinite(next) && next > 0) {
        editor.setFontSize(next);
        scheduleRefreshState();
    }
});

function syncStyleControls() {
    syncingControls = true;
    try {
        if (fontFacePreset) {
            fontFacePreset.value = editor.fontFace;
        }
        if (fontSizePreset) {
            fontSizePreset.value = editor.fontSize;
        }

        const stroke = normalizeColorPreset(editor.strokeColor, '#111827');
        const fill = normalizeColorPreset(editor.fillColor, '#ffffff');
        const text = normalizeColorPreset(editor.textColor, '#111827');

        const frequentColors = editor.getFrequentColors();
        const frequent = Array.isArray(frequentColors) ? frequentColors : [];

        if (textPreset) {
            setColorOptions(textPreset, [text, ...frequent], text);
        }
        if (strokePreset) {
            setColorOptions(strokePreset, [stroke, ...frequent], stroke);
        }
        if (fillPreset) {
            setColorOptions(fillPreset, [fill, ...frequent], fill);
        }
        if (lineWidthPreset) {
            lineWidthPreset.value = editor.lineWidth ?? 1;
        }
    } finally {
        syncingControls = false;
    }
}

function refreshState() {
    actionToolbar?.refresh();
    syncStyleControls();
}

syncStyleControls();
actionToolbar?.refresh();

requestAnimationFrame(() => {
    refreshState();
});

host?.addEventListener(DIAGRAM_CHANGED_EVENT, refreshState);

toolListHost?.addEventListener('tool-selected', () => {
    scheduleRefreshState();
});

window.addEventListener('pointerup', scheduleRefreshState);
window.addEventListener('keyup', scheduleRefreshState);

window.addEventListener('beforeunload', () => {
    actionToolbar?.destroy();
    toolPalette?.destroy();
    textPreset?.destroy();
    strokePreset?.destroy();
    fillPreset?.destroy();
    lineWidthPreset?.destroy();
    fontFacePreset?.destroy();
    fontSizePreset?.destroy();
});
