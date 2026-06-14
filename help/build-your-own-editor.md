---
title: Build Your Own Editor
group: Guides
category: Integration Paths
---

# Build your own editor

## Navigation

- [Documentation](index.md)
- [Use the model](use-model.md)
- [Use the view](use-view.md)
- [Use the editor](use-editor.md)
- [Operate the editor](operate-the-editor.md)

Use `DiagramEditView` when you want editing power with your own UI architecture.

This approach gives you full control over layout, branding, and workflows while reusing mutation logic.

## 1. Wire a custom shell around DiagramEditView

```ts
import {
  DiagramEditView,
  ToolPalette,
  DiagramToolBar,
  ColorSelect,
  WidthSelect,
  FontSelect,
  SizeSelect,
  ArrowSelect,
  IntegerRangeSelect,
} from '@samatawy/diagrams';

const canvasHost = document.getElementById('canvas-host')!;
const toolsHost = document.getElementById('tools-host')!;
const barHost = document.getElementById('toolbar-host')!;

const edit = new DiagramEditView('custom-editor', canvasHost);
new ToolPalette(toolsHost, edit);
new DiagramToolBar(barHost, edit);

// Example: custom control wiring
const strokeColor = new ColorSelect(document.getElementById('stroke-color')!);
document.getElementById('stroke-color')!.addEventListener('colorchange', (e: Event) => {
  edit.setStrokeColor((e as CustomEvent<string>).detail);
});
```

## 2. Available UI components

From `src/editor` exports:

- `ColorSelect`
- `WidthSelect`
- `FontSelect`
- `SizeSelect`
- `IntegerRangeSelect`
- `ArrowSelect`
- `PromptDialog`
- `ToolPalette`
- `ToolBar`
- `DiagramToolBar`
- `DiagramEditor` (prebuilt shell)

## 3. Add your own component

Create a DOM control, dispatch a typed custom event, and map it to `DiagramEditView` API methods.

```ts
const button = document.getElementById('my-bold-style')!;
button.addEventListener('click', () => {
  for (const node of edit.selection()) {
    node.strokeStyle = '#0ea5e9';
    node.lineWidth = 3;
  }
  edit.render('all');
});
```

Use this pattern for custom palettes, inspectors, property panels, and domain-specific tools.
