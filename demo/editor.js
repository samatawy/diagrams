import {
    mountEditor,
    makeBox,
    makeLine,
    NodeHandle,
    EDITOR_TOOL_DEFS,
    DIAGRAM_TOOL_CHANGED_EVENT,
} from './demo-common.js';

const host = document.getElementById('editor-demo');
const toolList = document.getElementById('editor-tool-list');
const actionButtons = document.querySelectorAll('button[data-action]');
const fontFaceSelect = document.getElementById('font-face-select');
const fontSizeSelect = document.getElementById('font-size-select');
const strokePresetSelect = document.getElementById('stroke-preset-select');
const fillPresetSelect = document.getElementById('fill-preset-select');
const strokeColorInput = document.getElementById('stroke-color-input');
const fillColorInput = document.getElementById('fill-color-input');
const lineWidthPresetSelect = document.getElementById('line-width-select');
const showGridButton = document.querySelector('button[data-action="show-grid"]');
const snapGridButton = document.querySelector('button[data-action="snap-grid"]');
const actionButtonMap = new Map();

for (const button of actionButtons) {
    actionButtonMap.set(button.getAttribute('data-action'), button);
}

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

function colorStyleForSwatch(color) {
    const normalized = normalizeColorPreset(color, '#ffffff');
    if (normalized === 'transparent') {
        return 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 6px, #e2e8f0 6px, #e2e8f0 12px)';
    }

    return normalized;
}

const LINE_WIDTHS = [1, 2, 3, 4, 5, 6, 7, 8];

function makeLineWidthSvg(width) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '20');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '4');
    line.setAttribute('y1', '10');
    line.setAttribute('x2', '96%');
    line.setAttribute('y2', '10');
    line.setAttribute('stroke', '#1f2937');
    line.setAttribute('stroke-width', String(width));
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
    return svg;
}

function createLineWidthControl(hostElement, widths, onChange) {
    if (!hostElement) {
        return { setValue() { } };
    }

    hostElement.classList.add('color-preset-control', 'line-width-control');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'color-preset-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const triggerSwatch = document.createElement('div');
    triggerSwatch.className = 'line-width-swatch';
    const triggerText = document.createElement('span');
    triggerText.className = 'color-preset-label';
    trigger.appendChild(triggerSwatch);
    trigger.appendChild(triggerText);

    const menu = document.createElement('div');
    menu.className = 'color-preset-menu';
    menu.setAttribute('role', 'listbox');

    hostElement.innerHTML = '';
    hostElement.appendChild(trigger);
    hostElement.appendChild(menu);

    let selectedValue = widths[0] ?? 1;

    const closeMenu = () => {
        hostElement.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        hostElement.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
    };

    const setDisplayValue = (width) => {
        selectedValue = width;
        triggerSwatch.innerHTML = '';
        triggerSwatch.appendChild(makeLineWidthSvg(width));
        triggerText.textContent = `${width}px`;
    };

    trigger.addEventListener('click', () => {
        if (hostElement.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (!hostElement.contains(event.target)) {
            closeMenu();
        }
    });

    for (const width of widths) {
        const optionButton = document.createElement('button');
        optionButton.type = 'button';
        optionButton.className = 'color-preset-option';
        optionButton.setAttribute('role', 'option');
        optionButton.dataset.value = String(width);

        const swatch = document.createElement('div');
        swatch.className = 'line-width-swatch';
        swatch.appendChild(makeLineWidthSvg(width));
        optionButton.appendChild(swatch);

        const label = document.createElement('span');
        label.className = 'color-preset-label';
        label.textContent = `${width}px`;
        optionButton.appendChild(label);

        optionButton.addEventListener('click', () => {
            api.setValue(width);
            closeMenu();
            onChange(width);
        });

        menu.appendChild(optionButton);
    }

    const api = {
        setValue(width) {
            selectedValue = width;
            setDisplayValue(width);
            for (const btn of menu.querySelectorAll('.color-preset-option')) {
                const isSelected = Number(btn.dataset.value) === width;
                btn.classList.toggle('is-selected', isSelected);
                btn.setAttribute('aria-selected', String(isSelected));
            }
        },
    };

    setDisplayValue(selectedValue);
    return api;
}

function createColorPresetControl(hostElement, onChange) {
    if (!hostElement) {
        return {
            setOptions() { },
            setValue() { },
        };
    }

    hostElement.classList.add('color-preset-control');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'color-preset-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const triggerSwatch = document.createElement('div');
    triggerSwatch.className = 'color-preset-swatch';
    const triggerText = document.createElement('span');
    triggerText.className = 'color-preset-label';
    trigger.appendChild(triggerSwatch);
    trigger.appendChild(triggerText);

    const menu = document.createElement('div');
    menu.className = 'color-preset-menu';
    menu.setAttribute('role', 'listbox');

    hostElement.innerHTML = '';
    hostElement.appendChild(trigger);
    hostElement.appendChild(menu);

    let selectedValue = 'transparent';

    const closeMenu = () => {
        hostElement.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        hostElement.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
    };

    const setDisplayValue = (value) => {
        selectedValue = normalizeColorPreset(value);
        triggerSwatch.style.background = colorStyleForSwatch(selectedValue);
        triggerText.textContent = selectedValue === 'transparent' ? 'transparent' : selectedValue;
    };

    trigger.addEventListener('click', () => {
        if (hostElement.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (!hostElement.contains(event.target)) {
            closeMenu();
        }
    });

    const api = {
        setOptions(colors, selectedColor) {
            const normalizedSelected = normalizeColorPreset(selectedColor);
            const unique = Array.from(new Set(colors.map((one) => normalizeColorPreset(one))));
            const withoutTransparent = unique.filter((one) => one !== 'transparent');
            const ordered = ['transparent', ...withoutTransparent];

            if (!ordered.includes(normalizedSelected)) {
                ordered.push(normalizedSelected);
            }

            menu.innerHTML = '';
            for (const color of ordered) {
                const optionButton = document.createElement('button');
                optionButton.type = 'button';
                optionButton.className = 'color-preset-option';
                optionButton.setAttribute('role', 'option');
                optionButton.dataset.value = color;

                const swatch = document.createElement('div');
                swatch.className = 'color-preset-swatch';
                swatch.style.background = colorStyleForSwatch(color);
                optionButton.appendChild(swatch);

                const label = document.createElement('span');
                label.className = 'color-preset-label';
                label.textContent = color === 'transparent' ? 'transparent' : color;
                optionButton.appendChild(label);

                if (color === normalizedSelected) {
                    optionButton.classList.add('is-selected');
                    optionButton.setAttribute('aria-selected', 'true');
                } else {
                    optionButton.setAttribute('aria-selected', 'false');
                }

                optionButton.addEventListener('click', () => {
                    setDisplayValue(color);
                    closeMenu();
                    onChange(color);
                });

                menu.appendChild(optionButton);
            }

            setDisplayValue(normalizedSelected);
        },
        setValue(value) {
            setDisplayValue(value);
        },
    };

    setDisplayValue('transparent');
    return api;
}

function fillSelect(select, values, selectedValue) {
    if (!select) {
        return;
    }

    select.innerHTML = '';
    for (const value of values) {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = String(value);
        option.selected = String(value) === String(selectedValue);
        select.appendChild(option);
    }
}

const strokePresetControl = createColorPresetControl(strokePresetSelect, (color) => {
    if (!editor) {
        return;
    }

    const normalized = normalizeColorPreset(color);
    editor.setStrokeColor(normalized);
    if (strokeColorInput) {
        strokeColorInput.value = normalized === 'transparent' ? '#111827' : normalized;
    }
});

const fillPresetControl = createColorPresetControl(fillPresetSelect, (color) => {
    if (!editor) {
        return;
    }

    const normalized = normalizeColorPreset(color, '#ffffff');
    editor.setFillColor(normalized);
    if (fillColorInput) {
        fillColorInput.value = normalized === 'transparent' ? '#ffffff' : normalized;
    }
});

const lineWidthPresetControl = createLineWidthControl(lineWidthPresetSelect, LINE_WIDTHS, (width) => {
    if (!editor) {
        return;
    }

    editor.setLineWidth(width);
});

function syncStyleControls() {
    if (!editor) {
        return;
    }

    fillSelect(fontFaceSelect, FONT_FACES, editor.fontFace);
    fillSelect(fontSizeSelect, FONT_SIZES, String(editor.fontSize));

    const stroke = normalizeColorPreset(editor.strokeColor, '#111827');
    const fill = normalizeColorPreset(editor.fillColor, '#ffffff');
    if (strokeColorInput) {
        strokeColorInput.value = stroke === 'transparent' ? '#111827' : stroke;
    }
    if (fillColorInput) {
        fillColorInput.value = fill === 'transparent' ? '#ffffff' : fill;
    }

    const frequentColors = editor.getFrequentColors();
    const frequent = Array.isArray(frequentColors) ? frequentColors : [];
    strokePresetControl.setOptions([stroke, ...frequent], stroke);
    fillPresetControl.setOptions([fill, ...frequent], fill);
    lineWidthPresetControl.setValue(editor.lineWidth ?? 1);
    // Reflect current grid toggle state
    showGridButton?.classList.toggle('is-active', !!editor.grid?.visible);
    snapGridButton?.classList.toggle('is-active', !!editor.grid?.forced);
}

function setActionEnabled(action, enabled) {
    const button = actionButtonMap.get(action);
    if (!button) {
        return;
    }

    button.disabled = !enabled;
    button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
}

function historyDepth(key) {
    if (!editor || !editor.history) {
        return 0;
    }

    const list = editor.history[key];
    return Array.isArray(list) ? list.length : 0;
}

function refreshActionState() {
    if (!editor) {
        return;
    }

    const hasSelection = editor.selection().length > 0;
    const hasMultiSelection = editor.selection().length > 1;
    setActionEnabled('undo', historyDepth('undoList') > 0);
    setActionEnabled('redo', historyDepth('redoList') > 0);
    setActionEnabled('front', hasSelection);
    setActionEnabled('back', hasSelection);
    setActionEnabled('duplicate', hasSelection);
    setActionEnabled('delete', hasSelection);
    setActionEnabled('cut', hasSelection);
    setActionEnabled('copy', hasSelection);
    setActionEnabled('paste', editor.canPaste);
    setActionEnabled('align-left', hasMultiSelection);
    setActionEnabled('align-center', hasMultiSelection);
    setActionEnabled('align-right', hasMultiSelection);
    setActionEnabled('align-top', hasMultiSelection);
    setActionEnabled('align-middle', hasMultiSelection);
    setActionEnabled('align-bottom', hasMultiSelection);
    setActionEnabled('distribute-h', editor.selection().length >= 3);
    setActionEnabled('distribute-v', editor.selection().length >= 3);
}

function highlightActiveTool(tool) {
    if (!toolList) {
        return;
    }

    for (const button of toolList.querySelectorAll('button[data-tool]')) {
        const isActive = button.getAttribute('data-tool') === tool;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
}

const editor = mountEditor('editor-demo', {
    id: 'editor-demo',
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
            text: 'Try selection, marquee, space-pan,\nAlt point editing, and text editing.',
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

for (const button of actionButtons) {
    button.addEventListener('click', async () => {
        if (!editor) {
            return;
        }

        const action = button.getAttribute('data-action');
        switch (action) {
            case 'undo':
                await editor.undo();
                break;
            case 'redo':
                await editor.redo();
                break;
            case 'front':
                editor.bringSelectionToFront();
                break;
            case 'back':
                editor.sendSelectionToBack();
                break;
            case 'zoom-in':
                editor.zoomBy(1.15);
                break;
            case 'zoom-out':
                editor.zoomBy(1 / 1.15);
                break;
            case 'fit-width':
                editor.fitToWidth(48, 'center');
                break;
            case 'fit-all':
                editor.fitToNodes(48, 'center');
                break;
            case 'show-grid':
                editor.updateGrid({ visible: !editor.grid?.visible });
                showGridButton?.classList.toggle('is-active', !!editor.grid?.visible);
                break;
            case 'snap-grid':
                editor.updateGrid({ forced: !editor.grid?.forced });
                snapGridButton?.classList.toggle('is-active', !!editor.grid?.forced);
                break;
            case 'duplicate':
                editor.cloneSelected();
                break;
            case 'delete':
                editor.deleteSelected();
                break;
            case 'cut':
                editor.cutSelected();
                break;
            case 'copy':
                editor.copySelected();
                break;
            case 'paste':
                editor.pasteNodes();
                break;
            case 'align-left':
                editor.alignSelected('left');
                break;
            case 'align-center':
                editor.alignSelected('center');
                break;
            case 'align-right':
                editor.alignSelected('right');
                break;
            case 'align-top':
                editor.alignSelected('top');
                break;
            case 'align-middle':
                editor.alignSelected('middle');
                break;
            case 'align-bottom':
                editor.alignSelected('bottom');
                break;
            case 'distribute-h':
                editor.spreadSelected('row');
                break;
            case 'distribute-v':
                editor.spreadSelected('column');
                break;
            default:
                break;
        }

        refreshActionState();
        syncStyleControls();
    });
}

fontFaceSelect?.addEventListener('change', () => {
    if (!editor) {
        return;
    }

    const next = fontFaceSelect.value;
    if (next) {
        editor.setFontFace(next);
    }
});

fontSizeSelect?.addEventListener('change', () => {
    if (!editor) {
        return;
    }

    const next = Number(fontSizeSelect.value);
    if (Number.isFinite(next) && next > 0) {
        editor.setFontSize(next);
    }
});

strokeColorInput?.addEventListener('input', () => {
    if (!editor) {
        return;
    }

    const color = toHexColor(strokeColorInput.value);
    editor.setStrokeColor(color);
    strokePresetControl.setValue(color);
});

fillColorInput?.addEventListener('input', () => {
    if (!editor) {
        return;
    }

    const color = toHexColor(fillColorInput.value);
    editor.setFillColor(color);
    fillPresetControl.setValue(color);
});

const TOOL_ICONS = {
    select: 'icon-tool-select',
    rectangle: 'icon-tool-rectangle',
    round_rectangle: 'icon-tool-round-rect',
    ellipse: 'icon-tool-ellipse',
    rhombus: 'icon-tool-rhombus',
    text: 'icon-tool-text',
    svg: 'icon-tool-svg',
    line: 'icon-tool-line',
    polyline: 'icon-tool-polyline',
    polygon: 'icon-tool-polygon',
    curve: 'icon-tool-curve',
};

if (toolList) {
    for (const entry of EDITOR_TOOL_DEFS) {
        const button = document.createElement('button');
        button.type = 'button';
        button.title = entry.label;
        button.setAttribute('data-tool', entry.key);
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', entry.label);

        const iconId = TOOL_ICONS[entry.key];
        if (iconId) {
            button.innerHTML = `<svg width="18" height="18" aria-hidden="true"><use href="#${iconId}"/></svg>`;
        } else {
            button.textContent = entry.label;
        }

        button.addEventListener('click', async () => {
            if (!editor) {
                return;
            }

            await editor.setTool(entry.key);
        });
        toolList.appendChild(button);
    }
}

highlightActiveTool(editor?.currentTool || 'select');
syncStyleControls();
refreshActionState();

requestAnimationFrame(() => {
    syncStyleControls();
});

host?.addEventListener(DIAGRAM_TOOL_CHANGED_EVENT, (event) => {
    const nextTool = event instanceof CustomEvent && event.detail?.tool
        ? event.detail.tool
        : editor?.currentTool || 'select';
    highlightActiveTool(nextTool);
});

for (const eventName of [
    'selection',
    'node-added',
    'node-deleted',
    'node-moved',
    'node-resized',
    'node-points-changed',
]) {
    host?.addEventListener(eventName, () => {
        refreshActionState();
        syncStyleControls();
    });
}
