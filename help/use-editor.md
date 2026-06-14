---
title: Use The Editor
group: Guides
category: Integration Paths
---

# Use the editor

## Navigation

- [Documentation](index.md)
- [Use the model](use-model.md)
- [Use the view](use-view.md)
- [Build your own editor](build-your-own-editor.md)
- [Operate the editor](operate-the-editor.md)

Use `DiagramEditor` for a quick, batteries-included editing experience.

It wires:

- tool palette
- action toolbar
- style controls
- prompts and file dialogs
- `DiagramEditView` orchestration

## Quick setup

```ts
import { DiagramEditor } from '@samatawy/diagrams';

const host = document.getElementById('editor-host')!;

const editor = new DiagramEditor(host, {
  prompts: {
    onUnsavedChanges: async () => 'save',
    onNoChangesSave: async () => true,
  },
});

const diagram = editor.getDiagramView();
diagram.setTool('rectangle');
```

## Load, save, export

```ts
await editor.openDiagram();
await editor.saveDiagram();
await editor.exportDiagram({ format: 'png' });
```

## Configure handlers (optional)

```ts
const editor = new DiagramEditor(host, {
  fileDialogs: {
    onOpenDiagram: async () => ({
      content: '{"id":"demo","nodes":[],"layers":[]}',
      source: 'memory',
      name: 'demo.json',
      mimeType: 'application/json',
    }),
  },
});
```

Use this when you want to ship quickly and keep customization incremental.
