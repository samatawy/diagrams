import {
    DiagramEditor,
    ThemeRegistry,
    DIAGRAM_VIEW_ACTION_LAYOUT,
    DIAGRAM_ZOOM_ACTION_LAYOUT,
    DIAGRAM_HISTORY_ACTION_LAYOUT,
    DIAGRAM_ZORDER_ACTION_LAYOUT,
    DIAGRAM_CLIPBOARD_ACTION_LAYOUT,
    DIAGRAM_ALIGN_ACTION_LAYOUT,
    DIAGRAM_TEXT_ALIGN_ACTION_LAYOUT,
} from '../../dist/index.js';
import { registerAdapters, normalizeDemoDiagram } from '../demo-common.js';

registerAdapters();

ThemeRegistry.registerTheme('indigo', {
    accent: '#4338ca',
    accentContrast: '#ffffff',
    borderStrong: 'rgba(67, 56, 202, 0.65)',
    hoverBg: 'rgba(67, 56, 202, 0.08)',
    surface: 'rgba(238, 236, 255, 0.92)',
    surfaceElevated: '#f0eeff',
    text: '#1e1b4b',
    textMuted: '#4f4a7a',
    border: 'rgba(67, 56, 202, 0.28)',
    borderWidth: '1.5px',
    shadowColor: 'rgba(30, 27, 74, 0.28)',
    controlRadius: '12px',
    panelRadius: '14px',
    controlHeight: '34px',
    paletteButtonSize: '44px',
    paletteButtonPadding: '10px',
    controlGap: '8px',
    groupGap: '6px',
    toolbarGap: '8px',
    controlPaddingX: '10px',
    controlPaddingY: '7px',
    panelPadding: '8px',
    labelFontSize: '12px',
});

const toolbarLayout = [
    ...DIAGRAM_VIEW_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_ZOOM_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_HISTORY_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_ZORDER_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_CLIPBOARD_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_ALIGN_ACTION_LAYOUT,
    '|',
    ...DIAGRAM_TEXT_ALIGN_ACTION_LAYOUT,
];

const host = document.getElementById('diagram-editor-host');
if (!host) throw new Error('Host element not found');

ThemeRegistry.apply(host, 'indigo');

const editor = new DiagramEditor(host, {
    toolbars: [
        {
            layout: toolbarLayout,
        },
    ],
});

const view = editor.getDiagramView();

async function loadThemedDemo() {
    const [diagramResponse, sheetResponse] = await Promise.all([
        fetch('../editor_simple/data/identity-access.diagram.json'),
        fetch('../editor_simple/data/identity-access.sheet.json'),
    ]);

    if (!diagramResponse.ok) {
        throw new Error(`Failed to load themed diagram: ${diagramResponse.status} ${diagramResponse.statusText}`);
    }
    if (!sheetResponse.ok) {
        throw new Error(`Failed to load themed stylesheet: ${sheetResponse.status} ${sheetResponse.statusText}`);
    }

    const diagramJson = await diagramResponse.json();
    const sheetJson = await sheetResponse.json();

    await editor.loadDiagram(normalizeDemoDiagram(diagramJson));
    await editor.loadStylesheet(sheetJson, {
        applyAfterLoad: true,
        preferId: 'demo-identity-sheet-v1',
    });

    view.fitToNodes({
        padding: 48,
        alignment: { horizontal: 'center', vertical: 'center' },
    });
}

loadThemedDemo().catch((error) => {
    console.error('Failed to initialize themed demo editor:', error);
});
