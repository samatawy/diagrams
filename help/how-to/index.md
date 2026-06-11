# How To

## Start with a typed document

Create a diagram document, add nodes and edges, then keep renderer concerns outside the core package.

```ts
import { connectNodes, createDiagram, upsertNode } from '@samatawy/diagrams';

let document = createDiagram('flow');

document = upsertNode(document, {
  id: 'start',
  width: 120,
  height: 48,
  position: { x: 40, y: 80 },
  label: 'Start',
});

document = upsertNode(document, {
  id: 'review',
  width: 160,
  height: 48,
  position: { x: 280, y: 80 },
  label: 'Review',
});

document = connectNodes(document, {
  id: 'start-review',
  from: 'start',
  to: 'review',
  label: 'next',
});
```

## Keep viewport math separate from your renderer

Use the viewport helpers to convert between world coordinates and screen coordinates while handling pan and zoom in the browser.
