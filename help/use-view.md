---
title: Use The View
group: Guides
category: Integration Paths
---

# Use the view

## Navigation

- [Documentation](index.md)
- [Use the model](use-model.md)
- [Use the editor](use-editor.md)
- [Build your own editor](build-your-own-editor.md)
- [Operate the editor](operate-the-editor.md)

Use `DiagramView` when you want a read-only/interaction-light viewer with selection and viewport controls, without editing toolbars.

## Basic setup

```ts
import { DiagramView, type ISerializedDiagram } from '@samatawy/diagrams';

const host = document.getElementById('diagram-host')!;
const view = new DiagramView('viewer', host);

const source: ISerializedDiagram = await fetch('/data/diagram.json').then(r => r.json());
await view.read(source);

view.fitToNodes(32);
view.render('all');
```

## Common viewer actions

```ts
// Programmatic selection
const start = view.node('start');
if (start) {
  view.setSelection([start]);
  view.render('selection');
}

// Viewport controls
view.zoomBy(1.1);
view.panBy(40, 0);
view.fitToWidth(48);
view.resetView();
```

## Good fit for

- Dashboard viewers
- Read-only approval screens
- Embedded previews in browser apps

If you need mutation tools (draw, resize, style editing, undo/redo), use `DiagramEditView` or `DiagramEditor` instead.
