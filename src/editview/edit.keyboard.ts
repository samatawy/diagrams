import { BOLD_FONT_WEIGHT, NORMAL_FONT_WEIGHT } from "../style.interfaces";
import { textBold } from "../value.utils";
import { DiagramViewKeyboard } from "../view/view.keyboard";
import type { DiagramEditView } from "./diagram.edit.view";

export class DiagramEditViewKeyboard extends DiagramViewKeyboard<DiagramEditView> {

    protected initialize(): void {
        super.initialize();

        const kb = this;

        // File operations

        kb.setShortcut(['Ctrl+N', 'Cmd+N'], (d: DiagramEditView) => {
            d.newDiagram();
        }, 'New diagram', 'new');
        kb.setShortcut(['Ctrl+O', 'Cmd+O'], (d: DiagramEditView) => {
            d.openDiagram();
        }, 'Open diagram', 'open');
        kb.setShortcut(['Ctrl+S', 'Cmd+S'], (d: DiagramEditView) => {
            d.saveDiagram();
        }, 'Save diagram', 'save');
        kb.setShortcut(['Ctrl+Alt+E', 'Cmd+Alt+E'], (d: DiagramEditView) => {
            d.saveImageDiagram();
        }, 'Export diagram', 'export');

        // View operations

        kb.setShortcut(['Ctrl+A', 'Cmd+A'], (d: DiagramEditView) => {
            d.selectAll();
        }, 'Select all');

        // Guides

        kb.setShortcut(['Ctrl+Alt+L', 'Cmd+Alt+L'], (d: DiagramEditView) => {
            const visible = d.guideOptions.visible;
            d.updateGuides({ visible: !visible, snap: !visible });
        }, 'Toggle guides (visible and snapping)');

        // Grid 

        kb.setShortcut(['Ctrl+Alt+G', 'Cmd+Alt+G'], (d: DiagramEditView) => {
            const visible = d.grid.visible;
            d.updateGrid({ visible: !visible, forced: !visible });
        }, 'Toggle snapping grid');
        kb.setShortcut(['Ctrl+Alt+Shift+G', 'Cmd+Alt+Shift+G'], (d: DiagramEditView) => {
            const visible = d.grid.visible;
            d.updateGrid({ visible: !visible, forced: false });
        }, 'Toggle visual-only grid');

        // History operations

        kb.setShortcut(['Ctrl+Z', 'Cmd+Z'], (d: DiagramEditView) => {
            d.undo();
        }, 'Undo', 'undo');
        kb.setShortcut(['Ctrl+Shift+Z', 'Cmd+Shift+Z'], (d: DiagramEditView) => {
            d.redo();
        }, 'Redo', 'redo');
        kb.setShortcut(['Ctrl+Y', 'Cmd+Y'], (d: DiagramEditView) => {
            d.redo();
        }, 'Redo', 'redo');

        // Clipboard operations

        kb.setShortcut(['Ctrl+C', 'Cmd+C'], (d: DiagramEditView) => {
            d.copySelected();
        }, 'Copy', 'copy');
        kb.setShortcut(['Ctrl+V', 'Cmd+V'], (d: DiagramEditView) => {
            d.pasteNodes();
        }, 'Paste', 'paste');
        kb.setShortcut(['Ctrl+X', 'Cmd+X'], (d: DiagramEditView) => {
            d.cutSelected();
        }, 'Cut', 'cut');
        kb.setShortcut(['Delete', 'Backspace'], (d: DiagramEditView) => {
            d.deleteSelected();
        }, 'Delete selection', 'delete');
        kb.setShortcut(['Ctrl+D', 'Cmd+D'], (d: DiagramEditView) => {
            d.cloneSelected();
        }, 'Duplicate selection', 'duplicate');

        // Clipboard for Styles

        kb.setShortcut(['Ctrl+Shift+C', 'Cmd+Shift+C'], (d: DiagramEditView) => {
            d.copyStyles();
        }, 'Copy styles', 'copy-styles');
        kb.setShortcut(['Ctrl+Shift+V', 'Cmd+Shift+V'], (d: DiagramEditView) => {
            d.pasteStyles();
        }, 'Paste styles', 'paste-styles');

        // Group operations

        kb.setShortcut(['Ctrl+G', 'Cmd+G'], (d: DiagramEditView) => {
            d.groupSelected();
        }, 'Group selection', 'group-nodes');
        kb.setShortcut(['Ctrl+Shift+G', 'Cmd+Shift+G'], (d: DiagramEditView) => {
            d.ungroupSelected();
        }, 'Ungroup selection', 'ungroup-nodes');

        // Layout operations

        kb.setShortcut(['Ctrl+]', 'Cmd+]'], (d: DiagramEditView) => {
            d.bringSelectionForward();
        }, 'Bring selection forward');
        kb.setShortcut(['Ctrl+[', 'Cmd+['], (d: DiagramEditView) => {
            d.sendSelectionBackward();
        }, 'Send selection backward');
        kb.setShortcut(['Ctrl+Shift+]', 'Cmd+Shift+]'], (d: DiagramEditView) => {
            d.bringSelectionToFront();
        }, 'Bring selection to front', 'front');
        kb.setShortcut(['Ctrl+Shift+[', 'Cmd+Shift+['], (d: DiagramEditView) => {
            d.sendSelectionToBack();
        }, 'Send selection to back', 'back');

        // Arrow operations - Nudge (large) 

        kb.setShortcut(['Shift+ArrowUp'], (d: DiagramEditView) => {
            const dy = (d.grid.forced) ? d.grid.width : 4;
            if (d.selection().length > 0) {
                d.moveSelectedWithUndo(0, -dy);
            } else {
                d.panBy(0, dy, 'animate');  // or -dy?
                d.render();
            }
        }, 'Move up');

        kb.setShortcut(['Shift+ArrowDown'], (d: DiagramEditView) => {
            const dy = (d.grid.forced) ? d.grid.width : 4;
            if (d.selection().length > 0) {
                d.moveSelectedWithUndo(0, dy);
            } else {
                d.panBy(0, -dy, 'animate'); // or dy?
                d.render();
            }
        }, 'Move down');

        kb.setShortcut(['Shift+ArrowLeft'], (d: DiagramEditView) => {
            const dx = (d.grid.forced) ? d.grid.width : 4;
            if (d.selection().length > 0) {
                d.moveSelectedWithUndo(-dx, 0);
            } else {
                d.panBy(dx, 0, 'animate');  // or -dx?
                d.render();
            }
        }, 'Move left');

        kb.setShortcut(['Shift+ArrowRight'], (d: DiagramEditView) => {
            const dx = (d.grid.forced) ? d.grid.width : 4;
            if (d.selection().length > 0) {
                d.moveSelectedWithUndo(dx, 0);
            } else {
                d.panBy(-dx, 0, 'animate');  // or dx?
                d.render();
            }
        }, 'Move right');

        // Arrow operations - Nudge (small)

        kb.setShortcut(['Ctrl+Alt+ArrowUp', 'Cmd+Alt+ArrowUp'], (d: DiagramEditView) => {
            if (d.selection().length > 0) {
                d.moveSelectedWithUndo(0, -0.5);
            }
        }, 'Nudge up');

        kb.setShortcut(['Ctrl+Alt+ArrowDown', 'Cmd+Alt+ArrowDown'], (d: DiagramEditView) => {
            if (d.selection().length > 0) {
                d.moveSelectedWithUndo(0, 0.5);
            }
        }, 'Nudge down');

        kb.setShortcut(['Ctrl+Alt+ArrowLeft', 'Cmd+Alt+ArrowLeft'], (d: DiagramEditView) => {
            if (d.selection().length > 0) {
                d.moveSelectedWithUndo(-0.5, 0);
            }
        }, 'Nudge left');

        kb.setShortcut(['Ctrl+Alt+ArrowRight', 'Cmd+Alt+ArrowRight'], (d: DiagramEditView) => {
            if (d.selection().length > 0) {
                d.moveSelectedWithUndo(0.5, 0);
            }
        }, 'Nudge right');

        // Text style operations

        kb.setShortcut(['Ctrl+B', 'Cmd+B'], (d: DiagramEditView) => {
            const isBold = d.selection().length > 0 && d.selection().every((n) => textBold(n));
            d.setTextStyle({ weight: isBold ? NORMAL_FONT_WEIGHT : BOLD_FONT_WEIGHT });
        }, 'Toggle bold', 'text-bold');
        kb.setShortcut(['Ctrl+I', 'Cmd+I'], (d: DiagramEditView) => {
            d.setTextStyle({ italic: !d.textStyle.italic });
        }, 'Toggle italic', 'text-italic');

        // Node style operations

        // kb.setShortcut('Ctrl+Alt+S', (d: DiagramEditView) => {
        //     if (!d.shadowStyle || d.shadowStyle.color === 'transparent') {
        //         d.setShadowStyle(DiagramConstants.DEFAULT_SHADOW);
        //     } else {
        //         d.setShadowStyle({ color: 'inherit' });
        //     }
        // });
        // kb.setShortcut('Ctrl+Alt+H', (d: DiagramEditView) => {
        //     if (!d.textStyle.halo || d.textStyle.halo === 'transparent') {
        //         d.setTextStyle({ halo: 'inherit' });
        //     } else {
        //         d.setTextStyle({ halo: 'transparent' });
        //     }
        // });
    }

}