---
title: Use The Model
group: Guides
category: Integration Paths
---

# Use the model

## Navigation

- [Documentation](index.md)
- [Use the view](use-view.md)
- [Use the editor](use-editor.md)
- [Build your own editor](build-your-own-editor.md)
- [Operate the editor](operate-the-editor.md)

Use this path when you only need diagram data manipulation in a Node.js environment (for generation, migration, validation, or automation) without rendering UI.

## 1. Create and load a diagram model

```ts
import { Diagram, type ISerializedDiagram, type ISerializedNode } from '@samatawy/diagrams';

function rectangleNode(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number,
  text: string,
): ISerializedNode {
  return {
    id,
    type: 'rectangle',
    points: [
      { x: left, y: top },
      { x: left + width, y: top + height },
    ],
    text,
    textAlign: 'center',
    textBaseline: 'middle',
    font: '16px Tahoma',
    ready: true,
    hollow: false,
    transparent: false,
    strokeStyle: '#0f172a',
    fillStyle: '#e2e8f0',
    textColor: '#0f172a',
    lineWidth: 1,
    angle: 0,
    img_mode: 'none',
  };
}

const serialized: ISerializedDiagram = {
  id: 'flow',
  nodes: [
    rectangleNode('start', 40, 80, 140, 52, 'Start'),
    rectangleNode('review', 280, 80, 160, 52, 'Review'),
  ],
  layers: [{ id: 'main', name: 'Main', visible: true, nodes: ['start', 'review'] }],
};

const diagram = await new Diagram('placeholder').read(serialized);
```

## 2. Mutate data in code

```ts
const review = diagram.node('review');
if (review) {
  review.text = 'Approve';
  review.fillStyle = '#bbf7d0';
}

diagram.meta = {
  owner: 'ops-team',
  updatedAt: new Date().toISOString(),
};
```

## 3. Save the model from Node.js

```ts
await diagram.save({ path: './flow.json', pretty: true });
```

`Diagram.save` writes to the filesystem in Node runtime and triggers download in browser runtime.

## 4. Export options

```ts
const json = diagram.export('json');
const bytes = diagram.export('bytes');
```

Use this for API responses, file pipelines, snapshots, and tests.
