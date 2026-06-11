# @samatawy/diagrams

Browser-first TypeScript primitives for diagram documents, immutable graph updates, and viewport transforms.

The package is intentionally renderer-agnostic. It gives you a typed model layer for browser applications that render through SVG, Canvas, WebGL, or a framework-specific view layer.

## Installation

```bash
npm install @samatawy/diagrams
```

## Quick Start

```ts
import {
  connectNodes,
  createDiagram,
  DiagramEditorController,
  createViewportTransform,
  toViewportPoint,
  upsertNode,
} from '@samatawy/diagrams';

let document = createDiagram('workflow');

document = upsertNode(document, {
  id: 'capture',
  label: 'Capture',
  width: 160,
  height: 56,
  position: { x: 32, y: 48 },
});

document = upsertNode(document, {
  id: 'review',
  label: 'Review',
  width: 160,
  height: 56,
  position: { x: 280, y: 48 },
});

document = connectNodes(document, {
  id: 'capture-review',
  from: 'capture',
  to: 'review',
  label: 'next',
});

const viewport = createViewportTransform({
  scale: 1.25,
  offsetX: 24,
  offsetY: 16,
});

const screenPoint = toViewportPoint({ x: 32, y: 48 }, viewport);
```

## Headless Editor Core

The package also exposes a framework-agnostic editor controller for browser applications that want to build their own UI layer without depending on Angular or any other framework.

```ts
import { DiagramEditorController } from '@samatawy/diagrams';

const editor = DiagramEditorController.create('workflow');

editor.pickTool('node');
editor.upsertNode({
  id: 'capture',
  width: 160,
  height: 56,
  position: { x: 32, y: 48 },
  label: 'Capture',
});

editor.select(['capture']);
editor.moveSelection({ x: 24, y: 0 });
editor.zoomToFit({ width: 960, height: 640 });
```

The older Angular editor under `src/diagram/` is currently best treated as a reference implementation while the reusable editor core is extracted into plain TypeScript.

## Browser Focus

- No Node-only runtime APIs are used in the public source.
- The build is emitted for ESM and CommonJS consumers.
- The package is meant to sit under a browser renderer rather than dictate one.

## Scripts

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run docs`

## Documentation

Generated API documentation is produced with TypeDoc into `docs/`.
