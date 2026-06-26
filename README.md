# @samatawy/diagrams

Browser-first TypeScript toolkit for diagram editing, model manipulation, and viewport operations.

It includes a reusable diagram model, node adapters, Canvas-based rendering primitives, and an embeddable editor shell that you can extend for your own application.

## Status

This package is being published as an experimental tool for web developers.

- Ready for evaluation, prototyping, and internal tooling.
- Not yet recommended for production workloads.
- Expect API refinements while customization points stabilize.

## Documentation And Demo

- API docs (GitHub Pages): https://samatawy.github.io/diagrams/
- Hosted demos: https://samatawy.github.io/diagrams/demo/

## Install

```bash
npm install @samatawy/diagrams
```

## What This Package Is

- A typed diagram model with nodes, connections, layers, styles, and serialization.
- A browser editor runtime (`DiagramEditView`, `DiagramEditor`, toolbars, controls).
- Viewport helpers for zoom, pan, and fit operations.
- Extension points via node adapters and registries.

## Core Features

- Diagram create/open/save/export flows.
- Selection, move, resize, rotate, align, distribute.
- Stroke/fill/font/shadow editing controls.
- Connection anchors and arrow support.
- Grid visibility and snap-to-grid support.
- Undo/redo history.
- SVG/Canvas-friendly data model and rendering pipeline.

## Typical Use Cases

- Workflow or process editors.
- Architecture and topology sketching tools.
- Domain-specific visual designers.
- Internal operational dashboards that need lightweight diagram editing.

## Browser Usage

```ts
import { DiagramEditor } from '@samatawy/diagrams';

const host = document.getElementById('editor-host')!;
const editor = new DiagramEditor(host);

const diagram = editor.getDiagramView();
diagram.setTool('rectangle');
diagram.newNode(40, 40);
```

## Node Usage (Model/Transforms)

The model and transform utilities can be used in Node.js workflows (for generation, conversion, tests, or automation) without mounting the browser editor UI.

```ts
import { createDiagram, upsertNode, connectNodes } from '@samatawy/diagrams';

let doc = createDiagram('pipeline');

doc = upsertNode(doc, {
  id: 'start',
  label: 'Start',
  width: 140,
  height: 52,
  position: { x: 24, y: 24 },
});

doc = upsertNode(doc, {
  id: 'next',
  label: 'Next',
  width: 140,
  height: 52,
  position: { x: 240, y: 24 },
});

doc = connectNodes(doc, { id: 'start-next', from: 'start', to: 'next' });
```

## Customization

You can tailor the editor for your own product:

- Register custom node adapters and icons.
- Override toolbar layouts and actions.
- Provide custom file dialog handlers for open/save/export.
- Style and wire custom UI controls around `DiagramEditView`.

## Version History

- Since version `0.5.0`
  - Groups and Containers.
  - Improved snapping to grids/guides.
- Since version `0.4.0`
  - Status bar with dynamic hints and a minimap.
  - Quality metrics and best-attempt layout fixer.
  - Bug fixes and UX improvements.
- Since version `0.3.0`
  - Improved Inspector layout with added features
  - Added text styling capabilities
  - Context menu
- Since version `0.2.0`
  - Improved in-place editing for nodes and connections
  - A full Inspector panel was added to the editor, including Identity, Geometry, Text, Line, Fill, Shadow, and Metadata sections
  - Keyboard handling was hardened so global editor shortcuts do not interfere with other page controls

## Development Scripts

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run docs`
- `npm run site`

