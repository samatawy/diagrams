import { DiagramEditView } from '../../editview/diagram.edit.view';

import { ACTION_MAP, type DiagramAction, type DiagramActionId } from '../diagram.actions';
import { TopMenu, type DropDownMenu, type TopMenuConfig, type TopMenuItem } from './top.menu';
import { DiagramConstants } from '../../model';
import type { ShadowStyle } from '../../style.interfaces';
import type { DiagramEditor } from '../diagram.editor';
import { DIAGRAM_SHEET_CHANGED_EVENT, DIAGRAM_SHEET_LOADED_EVENT } from '../../events/diagram.events';
import { registerEditorIcons } from '../../editview/editor.icons';
import type { EditorFile } from '../../io/editor.files';
import type { ILayer } from '../../interfaces';


/**
 * Configuration options for DiagramTopMenu.
 */
export interface DiagramTopMenuConfig extends TopMenuConfig {
    editor?: DiagramEditor;
}

interface DiagramTopMenuItem extends TopMenuItem {
    action?: DiagramAction;
}

/**
 * A context menu pre-populated with diagram editing actions.
 *
 * Wire it to a DiagramView by assigning to `view.contextMenu`.
 * The view will call open() when a right-click event fires.
 *
 * @example
 * ```ts
 * const menu = new DiagramTopMenu(editorView);
 * editorView.contextMenu = menu;
 * ```
 */
export class DiagramTopMenu extends TopMenu {

    private readonly diagram: DiagramEditView;

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
        this.bindDiagramEventListeners();

        /* Duplicate registration of icons to ensure they are available for the menu. */
        registerEditorIcons();
    }

    public destroy(): void {
        this.unbindDiagramEventListeners();
        super.destroy();
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
                this.recentFileMenu(),
                this.actionMenuItem('save', 'S'),
                this.actionMenuItem('export', 'E'),
                // this.actionMenuItem('export-svg', 'X'),
                '-',
                this.actionMenuItem('load-stylesheet', 'L'),
                this.actionMenuItem('save-stylesheet', 'V'),
            ],
        } as DropDownMenu);

        // this.addDropDownMenu(this.recentFileMenu()),

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
                this.actionMenuItem('copy-styles', 'A'),
                this.actionMenuItem('paste-styles', 'S'),
                '-',
                this.actionMenuItem('delete', 'E'),
                this.actionMenuItem('duplicate', 'P'),
            ],
        } as DropDownMenu);

        const config = this.config as DiagramTopMenuConfig;
        const editorViewItems = config.editor ? [
            '-',
            {
                label: 'Toolbars',
                altKey: 'T',
                toggle: true,
                isActive: () => config.editor?.isHeaderVisible() ?? false,
                onClick: () => {
                    config.editor?.showHeader(!config.editor.isHeaderVisible());
                }
            },
            {
                label: 'Inspector',
                altKey: 'I',
                toggle: true,
                isActive: () => config.editor?.isInspectorVisible() ?? false,
                onClick: () => {
                    config.editor?.showInspector(!config.editor.isInspectorVisible());
                }
            },
            {
                label: 'Light Theme',
                altKey: 'L',
                toggle: true,
                isActive: () => config.editor?.theme === 'light',
                onClick: () => config.editor ? config.editor.theme = 'light' : undefined
            },
            {
                label: 'Dark Theme',
                altKey: 'D',
                toggle: true,
                isActive: () => config.editor?.theme === 'dark',
                onClick: () => config.editor ? config.editor.theme = 'dark' : undefined
            }
        ] : [];

        this.addDropDownMenu({
            label: 'View',
            altKey: 'V',
            items: [
                this.actionMenuItem('toggle-guides', 'L'),
                this.actionMenuItem('toggle-grid', 'G'),
                this.actionMenuItem('toggle-visual-grid', 'V'),
                '-',
                this.actionMenuItem('zoom-in', 'Z'),
                this.actionMenuItem('zoom-out', 'O'),
                this.actionMenuItem('fit-horizontally', 'H'),
                this.actionMenuItem('fit-all', 'F'),

                ...editorViewItems
            ],
        } as DropDownMenu);

        this.addDropDownMenu({
            label: 'Selection',
            altKey: 'N',
            items: [
                this.actionMenuItem('select-all', 'A'),
                '-',
                this.actionMenuItem('group-nodes', 'G'),
                this.actionMenuItem('ungroup-nodes', 'U'),
                '-',
                this.actionMenuItem('move-to-new-layer', 'N'),
                this.moveToLayerMenu(),
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
            label: 'Layout',
            altKey: 'L',
            items: [
                this.actionMenuItem('autolayout', 'A'),
                this.actionMenuItem('autolayout-circuit', 'C'),
                this.actionMenuItem('autolayout-force', 'Y'),
                // this.actionMenuItem('autolayout-radial', 'D'),   // Poor results. To be evaluated before deployment.
                '-',
                this.actionMenuItem('autolayout-flow-left-right', 'F'),
                this.actionMenuItem('autolayout-flow-right-left', 'I'),
                this.actionMenuItem('autolayout-flow-top-down', 'W'),
                this.actionMenuItem('autolayout-flow-bottom-up', 'U'),
                '-',
                this.actionMenuItem('autolayout-tree-top-down', 'T'),
                this.actionMenuItem('autolayout-tree-bottom-up', 'B'),
                this.actionMenuItem('autolayout-tree-left-right', 'L'),
                this.actionMenuItem('autolayout-tree-right-left', 'R'),
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

        this.updateStyleMenu();
    }

    private bindDiagramEventListeners(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_SHEET_LOADED_EVENT, this.updateStyleMenu.bind(this));
        source?.addEventListener(DIAGRAM_SHEET_CHANGED_EVENT, this.updateStyleMenu.bind(this));
    }

    private unbindDiagramEventListeners(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_SHEET_CHANGED_EVENT, this.updateStyleMenu.bind(this));
        source?.removeEventListener(DIAGRAM_SHEET_LOADED_EVENT, this.updateStyleMenu.bind(this));
    }

    private updateStyleMenu(): void {
        let styleMenu = this.dropDownMenus.find(menu => menu.label === 'Style');
        if (styleMenu) {
            /* Remove the existing style menu before re-adding it with updated items. */
            this.menuElement?.removeChild(styleMenu.element!);
            this.topLevel = this.topLevel.filter(item => item !== styleMenu);
            this.dropDownMenus = this.dropDownMenus.filter(menu => menu.label !== 'Style');
        }

        /* Populate the style menu with items for each style class in the current sheet. */
        const styleClasses = this.diagram.sheet_id ? this.diagram.sheetRepository?.sheetClasses(this.diagram.sheet_id) : [];
        let i = 0;
        const styleItems: (TopMenuItem | '-')[] = styleClasses.map(cls => {
            i++;
            const altKey = i > 9 ? '~' : i.toString();

            return {
                label: `${i}. ${cls}`,
                altKey: altKey,
                isEnabled: () => !!this.diagram.selection().length,
                onClick: () => {
                    this.diagram.applyNodePatch({ 'style_class': cls }, 'style_class');
                }
            } as DiagramTopMenuItem;
        });

        if (styleItems.length > 0) {
            styleItems.push('-');
        }

        /* Add new style menu. */
        this.addDropDownMenu({
            label: 'Style',
            altKey: 'S',
            items: [
                ...styleItems,
                this.actionShadowItem(DiagramConstants.NO_SHADOW, 'N'),
                this.actionShadowItem(DiagramConstants.LOW_SHADOW, 'L'),
                this.actionShadowItem(DiagramConstants.MEDIUM_SHADOW, 'M'),
                this.actionShadowItem(DiagramConstants.HIGH_SHADOW, 'H'),
                this.actionShadowItem(DiagramConstants.LOW_COLOR_SHADOW, 'C'),
                this.actionShadowItem(DiagramConstants.MEDIUM_COLOR_SHADOW, 'D'),
                this.actionShadowItem(DiagramConstants.HIGH_COLOR_SHADOW, 'E'),
            ],
        } as DropDownMenu);
    }

    public updateRecentFiles(): void {
        const recentMenu = this.dropDownMenus.find(menu => menu.label === 'Recent');
        if (!recentMenu) return;

        const fileMenu = this.topLevel.find(menu => menu.label === 'File') as DropDownMenu | undefined;
        if (fileMenu && fileMenu.element) {
            const recentMenuIndex = fileMenu.items.findIndex(item => (item as DropDownMenu)?.label === recentMenu.label);
            if (recentMenuIndex >= 0) {
                fileMenu.items.splice(recentMenuIndex, 1, this.recentFileMenu());
            }

            this.menuElement?.removeChild(fileMenu.element!);
            // this.addDropDownMenu(fileMenu, undefined, 0);
            this.addDropDownMenu(fileMenu, this.menuElement!, 0);
        }
    }

    public updateLayers(): void {
        const layerMenu = this.dropDownMenus.find(menu => menu.label === 'Move to Layer');
        if (!layerMenu) return;

        const selectionMenu = this.topLevel.find(menu => menu.label === 'Selection') as DropDownMenu | undefined;
        if (selectionMenu && selectionMenu.element) {
            const layerMenuIndex = selectionMenu.items.findIndex(item => (item as DropDownMenu)?.label === layerMenu.label);
            if (layerMenuIndex >= 0) {
                selectionMenu.items.splice(layerMenuIndex, 1, this.moveToLayerMenu());
            }

            const index = this.menuElement?.children ? Array.from(this.menuElement.children).indexOf(selectionMenu.element!) : -1;
            if (index >= 0) {
                this.menuElement?.removeChild(selectionMenu.element!);
                // this.addDropDownMenu(selectionMenu, undefined, 0);
                this.addDropDownMenu(selectionMenu, this.menuElement!, index);
            }
        }
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

    private actionShadowItem(style: ShadowStyle, altKey: string): DiagramTopMenuItem {
        return {
            label: style.name,
            altKey: altKey,
            isEnabled: () => !!this.diagram.selection().length,
            onClick: () => {
                this.diagram.applyNodePatch({ 'shadowStyle': style }, 'shadowStyle');
            }
        };
    }

    private recentFileMenu(): DropDownMenu {
        return {
            label: 'Recent',
            altKey: 'R',
            icon: 'open',
            items: [
                ...this.diagram.editorFiles.mru.map(item => this.recentFileItem(item))
            ]
        } as DropDownMenu
    }

    private recentFileItem(file: EditorFile): DiagramTopMenuItem {
        return {
            label: file.filename,
            altKey: '',
            isEnabled: () => file.exists,
            onClick: () => {
                this.diagram.openDiagram({ path: file.path })
            }
        }
    }

    private moveToLayerMenu(): DropDownMenu {
        return {
            label: 'Move to Layer',
            altKey: 'M',
            icon: 'layer',
            items: [
                ...this.diagram.layers.slice().reverse().map(layer => this.moveToLayerItem(layer))
            ]
        } as DropDownMenu
    }

    private moveToLayerItem(layer: ILayer): DiagramTopMenuItem {
        return {
            label: layer.name,
            altKey: '',
            isEnabled: () => !!this.diagram.selection().length,
            onClick: () => {
                this.diagram.moveSelectedToLayer(layer);
            }
        }
    }

}

