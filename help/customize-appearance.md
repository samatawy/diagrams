---
title: Customize Appearance
group: Guides
category: Integration Paths
---

# Customize appearance

## Navigation

- [Documentation](index.md)
- [Use the model](use-model.md)
- [Use the view](use-view.md)
- [Use the editor](use-editor.md)
- [Build your own editor](build-your-own-editor.md)
- [Operate the editor](operate-the-editor.md)

You can customize appearance at three levels:

1. Diagram constants (canvas/grid defaults for viewing and editing)
2. Theme tokens (`ThemeRegistry` + CSS variables)
3. Advanced class-based styling (component class names)

## 1. Define constants for canvas defaults (viewing/editing)

Use `DiagramConstants` when you want global defaults for every `DiagramView` / `DiagramEditView` instance.

```ts
import { DiagramConstants } from '@samatawy/diagrams';

// Applies to all new views/editors unless overridden per instance.
DiagramConstants.set('CANVAS_BACKGROUND_COLOR', '#f8f5ee');
DiagramConstants.set('GRID_LINE_COLOR', '#c2c2c2');

// Example views:
// new DiagramView('v1', host)
// new DiagramEditView('e1', host)
```

Notes:

- `CANVAS_BACKGROUND_COLOR` controls the render backdrop.
- Set it to `'transparent'` if you want the host page background to show through.
- `GRID_LINE_COLOR` is used whenever grid color is not explicitly set on the diagram.

## 2. Use themes and CSS variables

Use `ThemeRegistry` to set CSS custom properties on a host element. Everything inside inherits them.

```ts
import { DiagramEditor, ThemeRegistry } from '@samatawy/diagrams';

ThemeRegistry.registerTheme('brand', {
  accent: '#0f766e',
  surface: 'rgba(252, 250, 245, 0.94)',
  border: 'rgba(15, 23, 42, 0.2)',
  borderStrong: 'rgba(15, 118, 110, 0.55)',
  controlRadius: '12px',
  panelRadius: '14px',
  paletteButtonSize: '44px',
});

const host = document.getElementById('editor-host')!;
ThemeRegistry.apply(host, 'brand');

const editor = new DiagramEditor(host);
```

This works the same for hand-wired layouts: apply the theme to your wrapper `div`, then mount `ToolPalette`, `DiagramToolBar`, `ColorSelect`, etc. under that wrapper.

## 3. Advanced CSS manipulation via class names

When you need deeper control, pass custom class names into components and style them directly.

```ts
import { DiagramEditView, ToolPalette, DiagramToolBar, ColorSelect } from '@samatawy/diagrams';

const edit = new DiagramEditView('custom', document.getElementById('canvas-host')!);

new ToolPalette(document.getElementById('tools-host')!, edit, {
  hostClassName: 'acme-tools',
});

new DiagramToolBar(document.getElementById('toolbar-host')!, edit, {
  hostClassName: 'acme-toolbar',
  buttonClassName: 'acme-toolbar-button',
});

new ColorSelect(document.getElementById('stroke-color')!, {
  hostClassName: 'acme-color',
  triggerClassName: 'acme-color-trigger',
  menuClassName: 'acme-color-menu',
  optionClassName: 'acme-color-option',
});
```

Then in your stylesheet:

```css
.acme-toolbar-button {
  border-radius: 999px;
}

.acme-tools button {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}
```

Use this level when tokenized theming is not enough (custom spacing systems, unusual shapes, brand-specific effects).
