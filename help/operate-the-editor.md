---
title: Operate The Editor
group: Guides
category: End User
---

# Operate the editor

## Navigation

- [Documentation](index.md)
- [Use the model](use-model.md)
- [Use the view](use-view.md)
- [Use the editor](use-editor.md)
- [Build your own editor](build-your-own-editor.md)

This page is for end users of applications built with the diagrams editor.

## Pointer interactions

- Left click on shape: select it.
- Left click on empty canvas: clear selection.
- Shift + left click shape: additive selection.
- Ctrl/Cmd + left click shape: toggle selection.
- Ctrl/Cmd + click through overlapping shapes: cycles to the next hit candidate.
- Right click: open editor context menu.

### Pan and navigation by pointer

- Mouse wheel or trackpad scroll: pan canvas.
- Ctrl/Cmd + wheel: zoom at pointer.
- Hold Space + drag: pan mode.
- Drag empty canvas (select tool): pan canvas.

### Selection rectangle and forced rectangle mode

- Drag on empty canvas: rectangle selection.
- Shift + rectangle drag: add rectangle hits to current selection.
- Ctrl/Cmd + rectangle drag: toggle/add by rectangle.
- Hold R while dragging: force rectangle selection even when starting over a node.

### Connection editing

- Drag a connection point: move point.
- Drag a connection endpoint/anchor: reconnect to another node handle.
- Alt + drag on connection segment (move handle): insert a new point, then drag it.
- Alt + click/drag an existing internal point: remove that point.

### Move, resize, rotate, alter

- Drag move handle: move current selection.
- Drag resize handles (N, S, E, W, NE, NW, SE, SW): resize.
- Shift while resizing: preserve aspect ratio.
- Hold A while resizing: apply resize to all selected nodes.
- Drag rotate handle: rotate.
- Shift while rotating: snap rotation to 15 degree increments.
- Drag alter handle (shape specific): alter geometry.

### Grid and guide behavior while dragging

- Guide preview/snap is used during move/resize when guides are enabled.
- If grid snapping is forced, release with Ctrl/Cmd pressed to skip final grid snap.
- Dropping a moved/created node over a container can assign it to that container group.

### Create tools

- Left down with a create tool: start draft.
- Move pointer: updates draft geometry.
- Left up: finalize one-step create tools.
- Multi-step tools: additional left clicks add points/segments; Esc or Enter finalizes current draft.
- Drag-create from toolbox/palette:
	- Drag over a node handle to preview auto-connect.
	- Drop over valid handle to create node and connector.
	- Drop elsewhere to create an unconnected node.
	- Releasing outside canvas cancels drag-create.

### Text editing by pointer

- Double click a text-capable node: open inline text editor.
- Blur (click away) commits text edits.

## Keyboard shortcuts

Keyboard shortcuts are active when focus is not inside input, textarea, or contenteditable fields.

### View shortcuts (also available in edit view)

- Ctrl/Cmd + Alt + F: fit horizontally and vertically.
- Ctrl/Cmd + Alt + H: fit to horizontal size.
- Ctrl/Cmd + 0: reset zoom to 100 percent.
- Ctrl/Cmd + Plus or Ctrl/Cmd + =: zoom in.
- Ctrl/Cmd + Minus: zoom out.
- Arrow keys: pan canvas.

### File and document

- Ctrl/Cmd + N: new diagram.
- Ctrl/Cmd + O: open diagram.
- Ctrl/Cmd + S: save diagram.
- Ctrl/Cmd + Alt + E: export image.

### Selection, clipboard, history

- Ctrl/Cmd + A: select all.
- Delete or Backspace: delete selection.
- Ctrl/Cmd + C: copy.
- Ctrl/Cmd + X: cut.
- Ctrl/Cmd + V: paste.
- Ctrl/Cmd + D: duplicate selection.
- Ctrl/Cmd + Shift + C: copy styles.
- Ctrl/Cmd + Shift + V: paste styles.
- Ctrl/Cmd + Z: undo.
- Ctrl/Cmd + Shift + Z: redo.
- Ctrl/Cmd + Y: redo.

### Grouping

- Ctrl/Cmd + G: group selected.
- Ctrl/Cmd + Shift + G: ungroup selected.

### Layer order

- Ctrl/Cmd + ]: bring forward.
- Ctrl/Cmd + [: send backward.
- Ctrl/Cmd + Shift + ]: bring to front.
- Ctrl/Cmd + Shift + [: send to back.

### Grid and guides

- Ctrl/Cmd + Alt + L: Toggle guides (visible and snapping).
- Ctrl/Cmd + Alt + G: Toggle snapping grid.
- Ctrl/Cmd + Alt + Shift + G: Toggle visual-only grid.

### Arrow-key editing and panning

- Shift + Arrow keys:
	- with selection: move selected nodes by a large step.
	- without selection: pan canvas by a large step.
- Ctrl/Cmd + Alt + Arrow keys: nudge selection by a small step.

### Text style shortcuts

- Ctrl/Cmd + B: toggle bold for selected text.
- Ctrl/Cmd + I: toggle italic for selected text.

### Character-based hold modifiers

- Hold Space: temporary pan mode.
- Hold R: force rectangle selection mode.
- Hold A: apply resize operation to all selected nodes.

### Enter and Escape behavior

- Enter:
	- if one text-capable node is selected in select mode, opens text editor.
	- while drawing, finalizes current draft and may then open text editor for the resulting selected node.
- Escape:
	- exits drawing/create mode by finalizing current draft.
	- closes inline text editor (cancel from editor, commit from some blur/flow paths).

### Inline text editor keys

- Enter:
	- single-line nodes: commit edit.
	- multi-line nodes: commit edit when pressed alone.
- Ctrl/Cmd/Shift + Enter in multi-line editor: insert newline.
- Escape: cancel text edit and restore original text.

## Tips

- Use layer visibility controls to focus on parts of complex diagrams.
- Use fit actions after major edits to reframe the viewport.
- Keep related nodes aligned before adding connections for cleaner routing.
