import { DiagramEditor } from '../../dist/index.js';
import { registerAdapters, normalizeDemoDiagram } from '../demo-common.js';

registerAdapters();

const host = document.getElementById('diagram-editor-host');
if (!host) throw new Error('Host element not found');

const editor = new DiagramEditor(host, {
    showInputs: false,
    showInspector: true,
});

const view = editor.getDiagramView();

async function loadDemo() {
    const [diagramResponse, sheetResponse] = await Promise.all([
        fetch('./data/identity-access.diagram.json'),
        fetch('./data/identity-access.sheet.json'),
    ]);

    if (!diagramResponse.ok) {
        throw new Error(`Failed to load demo diagram: ${diagramResponse.status} ${diagramResponse.statusText}`);
    }
    if (!sheetResponse.ok) {
        throw new Error(`Failed to load demo stylesheet: ${sheetResponse.status} ${sheetResponse.statusText}`);
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

loadDemo().catch((error) => {
    console.error('Failed to initialize demo editor:', error);
});
