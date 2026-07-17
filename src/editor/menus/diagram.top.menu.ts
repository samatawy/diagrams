import type { DiagramView } from '../../view/diagram.view';
import { DiagramEditView } from '../../editview/diagram.edit.view';

import { ACTION_MAP, type DiagramAction, type DiagramActionId } from '../diagram.actions';
import { TopMenu, type DropDownMenu, type TopMenuConfig, type TopMenuItem } from './top.menu';


/**
 * Configuration options for {@link DiagramTopMenu}.
 */
export interface DiagramTopMenuConfig extends TopMenuConfig {
}

interface DiagramTopMenuItem extends TopMenuItem {
    action?: DiagramAction;
}

/**
 * A context menu pre-populated with diagram editing actions.
 *
 * Wire it to a {@link DiagramView} by assigning to `view.contextMenu`.
 * The view will call {@link open} when a right-click event fires.
 *
 * @example
 * ```ts
 * const menu = new DiagramTopMenu(editorView);
 * editorView.contextMenu = menu;
 * ```
 */
export class DiagramTopMenu extends TopMenu {

    private readonly diagram: DiagramEditView;
    // private readonly emptyLayout: DiagramActionId[];
    // private readonly selectionLayout: DiagramActionId[];

    /**
     * Creates a new DiagramTopMenu.
     * @param diagram The diagram view this menu operates on.
     * @param config Optional configuration overriding the default action layouts.
     */
    constructor(host: HTMLElement, diagram: DiagramEditView, config?: DiagramTopMenuConfig) {
        // Pass the diagram's host so the menu inherits its CSS-variable theme.
        super(host, diagram, config);
        this.diagram = diagram;
        this.initialize();
    }

    private initialize(): void {
        if (!this.menuElement) return;

        this.addDropDownMenu({
            label: 'File',
            altKey: 'F',
            // icon: IconRegistry.createElement('view'),
            items: [
                this.actionMenuItem('new', 'N'),
                this.actionMenuItem('open', 'O'),
                this.actionMenuItem('save', 'S'),
                this.actionMenuItem('export', 'E'),
                '-',
                this.actionMenuItem('load-stylesheet', 'L'),
                this.actionMenuItem('save-stylesheet', 'V'),
            ],
        } as DropDownMenu);

        this.addDropDownMenu({
            label: 'Edit',
            altKey: 'E',
            items: [
                this.actionMenuItem('undo', 'U'),
                this.actionMenuItem('redo', 'R'),
                '-',
                this.actionMenuItem('cut', 'C'),
                this.actionMenuItem('copy', 'O'),
                this.actionMenuItem('paste', 'P'),
                '-',
                this.actionMenuItem('delete', 'E'),
                this.actionMenuItem('duplicate', 'P'),
            ],
        } as DropDownMenu);

        this.addDropDownMenu({
            label: 'View',
            altKey: 'V',
            items: [
                this.actionMenuItem('toggle-guides', 'L'),
                this.actionMenuItem('toggle-grid', 'G'),
                this.actionMenuItem('toggle-visual-grid', 'V'),
                '-',
                // this.actionMenuItem('show-grid', 'G'),
                // this.actionMenuItem('snap-grid', 'S'),
                // this.actionMenuItem('show-guides', 'I'),
                // this.actionMenuItem('snap-guides', 'A'),
                // '-',
                this.actionMenuItem('zoom-in', 'Z'),
                this.actionMenuItem('zoom-out', 'O'),
                this.actionMenuItem('fit-horizontally', 'H'),
                this.actionMenuItem('fit-all', 'F'),
            ],
        } as DropDownMenu);


        this.addDropDownMenu({
            label: 'Selection',
            altKey: 'S',
            items: [
                this.actionMenuItem('select-all', 'A'),
                '-',
                this.actionMenuItem('group-nodes', 'G'),
                this.actionMenuItem('ungroup-nodes', 'U'),
                '-',
                this.actionMenuItem('forward', 'R'),
                this.actionMenuItem('backward', 'W'),
                this.actionMenuItem('front', 'F'),
                this.actionMenuItem('back', 'K'),
            ],
        } as DropDownMenu);

        this.addDropDownMenu({
            label: 'Align',
            altKey: 'A',
            items: [
                this.actionMenuItem('align-left', 'L'),
                this.actionMenuItem('align-center', 'C'),
                this.actionMenuItem('align-right', 'R'),
                '-',
                this.actionMenuItem('align-top', 'T'),
                this.actionMenuItem('align-middle', 'M'),
                this.actionMenuItem('align-bottom', 'B'),
                '-',
                this.actionMenuItem('distribute-h', 'H'),
                this.actionMenuItem('distribute-v', 'V'),
            ],
        } as DropDownMenu);

        this.addDropDownMenu({
            label: 'Text',
            altKey: 'T',
            items: [
                this.actionMenuItem('text-bold', 'B'),
                this.actionMenuItem('text-italic', 'I'),
                this.actionMenuItem('text-underline', 'U'),
                '-',
                this.actionMenuItem('text-left', 'L'),
                this.actionMenuItem('text-center', 'C'),
                this.actionMenuItem('text-right', 'R'),
                '-',
                this.actionMenuItem('text-top', 'T'),
                this.actionMenuItem('text-middle', 'M'),
                this.actionMenuItem('text-bottom', 'B'),
                '-',
                this.actionMenuItem('text-orientation-horizontal', 'H'),
                this.actionMenuItem('text-orientation-vertical', 'V'),
                this.actionMenuItem('text-orientation-path', 'P')
            ],
        } as DropDownMenu);
    }

    private actionMenuItem(actionId: DiagramActionId, altKey: string): DiagramTopMenuItem {
        const action = ACTION_MAP.get(actionId);
        if (!action) throw new Error(`Action not found: ${actionId}`);
        return {
            label: action.label,
            altKey: altKey,
            shortcut: action.shortcut,
            hint: action.tooltip,
            icon: (typeof action.icon === 'string') ? action.icon : action.id,
            toggle: action.toggle,
            isActive: action.isActive as ((diagram: unknown) => boolean) | undefined,
            isEnabled: action.isEnabled as ((diagram: unknown) => boolean) | undefined,
            onClick: this.diagramAction(actionId),
        };
    }

    private diagramAction(actionId: DiagramActionId): () => void {
        const action = ACTION_MAP.get(actionId);
        if (!action) return () => { };
        return () => {
            if (action.isEnabled && !action.isEnabled(this.diagram)) return;
            action.execute(this.diagram);
        };
    }

}
