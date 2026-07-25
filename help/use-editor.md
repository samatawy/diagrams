---
title: Use The Editor
group: Guides
category: Integration Paths
---

# Use the editor

Use `DiagramEditor` for a quick, batteries-included editing experience.

It wires:

- tool box containing one or more tool sets
- top menu
- action toolbar
- property inspector
- status bar and minimap
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
await editor.exportDiagram({ filename: 'flow-01.png' });
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
