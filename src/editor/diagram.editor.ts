import { DiagramEditView, type DiagramEditViewPrompts } from "../editview/diagram.edit.view";
import {
    DiagramFileDialogs,
    type DiagramExportOptions,
    type DiagramExportHandler,
    type DiagramOpenHandler,
    type DiagramOpenOptions,
    type DiagramSaveOptions,
    type DiagramSaveHandler,
    type ISerializedDiagram,
    type DiagramOpenStylesheetHandler,
    type DiagramSaveStylesheetHandler,
    type StylesheetOpenOptions,
    type StylesheetOpenSource,
    type StylesheetSaveOptions,
} from "../io";
import { Diagram } from "../model/diagram";
import { ColorSelect, type ColorSelectConfig } from "./inputs/color.select";
import { DiagramToolBar, type DiagramToolBarConfig } from "./buttons/diagram.toolbar";
import {
    DIAGRAM_TEXT_ALIGN_ACTION_LAYOUT,
    DIAGRAM_TEXT_FORMAT_ACTION_LAYOUT,
    DIAGRAM_TEXT_ORIENTATION_ACTION_LAYOUT,
} from "./diagram.action.layouts";
import { injectStyles, setClasses } from "./editor.utils";
import { FontSelect, type FontSelectConfig } from "./inputs/font.select";
import { PromptDialog } from "./prompt.dialog";
import { SizeSelect, type SizeSelectConfig } from "./inputs/size.select";
import { DIAGRAM_CHANGED_EVENT, type DiagramHintChange } from "../events/diagram.events";
import { EventDispatcher } from "../events/event.dispatcher";
import { WidthSelect, type WidthSelectConfig } from "./inputs/width.select";
import { ArrowDirectionSelect, type ArrowDirectionSelectConfig } from "./inputs/arrow.direction.select";
import { ArrowTypeSelect, type ArrowTypeSelectConfig } from "./inputs/arrow.type.select";
import { DashSelect, type DashSelectConfig, type LineDashValue } from "./inputs/dash.select";
import { ImageSelect, type ImageSelectConfig } from "./inputs/image.select";
import { ImageModeSelect } from "./inputs/image.mode.select";
import { ImageAlignSelect } from "./inputs/image.align.select";
import type { ArrowDirection, ArrowType } from "../types";
import { IntegerRangeSelect, type IntegerRangeSelectConfig } from "./inputs/integer.range.select";
import { DiagramInspector } from "./inspector/diagram.inspector";
import type { InspectorConfig } from "./inspector/inspector";
import { DiagramContextMenu } from "./menus/diagram.context.menu";
import { DiagramConstants } from "../model/diagram.constants";
import { DiagramStatusBar } from "../status/diagram.status.bar";
import { ShadowPresetSelect, SHADOW_PRESET_CHANGE_EVENT } from "./inputs/shadow.preset.select";
import type { ShadowStyle } from "../style.interfaces";
import { DiagramHintService } from "../status/diagram.hint.service";
import { SheetRepository } from "../sheets/sheet.repository";
import { DiagramToolbox, type DiagramToolBoxConfig } from "./toolbox";
import { registerBasicAdapters } from "../nodes";
import { registerBpmnAdapters } from "../nodes/bpmn";
import { registerC4Adapters } from "../nodes/c4";
import { registerErdAdapters } from "../nodes/erd";
import { registerUmlAdapters } from "../nodes/uml";
import { registerLogicAdapters } from "../nodes/logic";

import DIAGRAM_EDITOR_STYLES from '../css_generated/editor/diagram.editor.css';
import { DiagramTopMenu } from "./menus/diagram.top.menu";

const DIAGRAM_EDITOR_STYLE_ID = 'diagram-editor-layout';

function ensureEditorStyles(): void {
    injectStyles(DIAGRAM_EDITOR_STYLE_ID, DIAGRAM_EDITOR_STYLES);
}

export type DiagramEditorUnsavedAction = 'save' | 'discard' | 'cancel';

export type DiagramEditorPromptReason = 'new' | 'load' | 'close';

export type DiagramEditorPrompts = {
    onUnsavedChanges?: (context: { reason: DiagramEditorPromptReason }) => DiagramEditorUnsavedAction | Promise<DiagramEditorUnsavedAction>;
    onNoChangesSave?: () => boolean | Promise<boolean>;
};

export type DiagramEditorFileDialogsConfig = {
    onOpenDiagram?: DiagramOpenHandler;
    onSaveDiagram?: DiagramSaveHandler;
    onExportDiagram?: DiagramExportHandler;
    onOpenStylesheet?: DiagramOpenStylesheetHandler;
    onSaveStylesheet?: DiagramSaveStylesheetHandler;
};

export type DiagramEditorConfig = {
    hostClassName?: string;
    showInspector?: boolean;
    showInputs?: boolean;

    inspector?: InspectorConfig;
    toolbars?: DiagramToolBarConfig[];
    toolbox?: DiagramToolBoxConfig;

    fontSelect?: FontSelectConfig;
    fontSizeSelect?: SizeSelectConfig;
    textColor?: ColorSelectConfig;
    strokeColor?: ColorSelectConfig;
    strokeWidth?: WidthSelectConfig;
    dashSelect?: DashSelectConfig;
    arrowDirectionSelect?: ArrowDirectionSelectConfig;
    arrowTypeSelect?: ArrowTypeSelectConfig;
    shadowOffsetX?: IntegerRangeSelectConfig;
    shadowOffsetY?: IntegerRangeSelectConfig;
    shadowBlur?: IntegerRangeSelectConfig;
    fillColor?: ColorSelectConfig;
    imageSelect?: ImageSelectConfig;
    imagePadding?: IntegerRangeSelectConfig;

    prompts?: DiagramEditorPrompts;
    fileDialogs?: DiagramEditorFileDialogsConfig;
}

/**
 * A composed diagram editing component that wires a {@link DiagramEditView} together with
 * a tool palette, action toolbars, and style controls.
 * It provides a ready-to-mount editor surface with optional prompts for unsaved-change flows.
 */
export class DiagramEditor {

    protected host: HTMLElement;

    protected readonly eventDispatcher: EventDispatcher;

    protected config: DiagramEditorConfig;

    protected diagram: DiagramEditView;

    protected sheet_repository: SheetRepository;

    protected topMenuHost?: HTMLElement;
    protected topMenu?: DiagramTopMenu;

    protected headerHost?: HTMLElement;
    protected stageHost?: HTMLElement;
    protected statusBarHost?: HTMLElement;

    protected toolbarsHost?: HTMLElement;
    protected toolbars: DiagramToolBar[] = [];

    protected toolboxHost?: HTMLElement;
    protected toolbox?: DiagramToolbox;

    protected inspectorHost?: HTMLElement;
    protected inspector?: DiagramInspector;
    protected statusBar?: DiagramStatusBar;
    protected hintService?: DiagramHintService;

    protected freehandToolbar?: HTMLElement;
    protected freehandColorHost?: HTMLElement;
    protected freehandWidthHost?: HTMLElement;
    protected freehandColorSelect?: ColorSelect;
    protected freehandWidthSelect?: WidthSelect;

    protected textToolbar?: HTMLElement;
    protected fontSelectHost?: HTMLElement;
    protected fontSizeSelectHost?: HTMLElement;
    protected textColorSelectHost?: HTMLElement;
    protected fontSelect?: FontSelect;
    protected fontSizeSelect?: SizeSelect;
    protected textColorSelect?: ColorSelect;
    protected textAlignToolbar?: DiagramToolBar;
    protected textFormatToolbar?: DiagramToolBar;

    protected strokeToolbar?: HTMLElement;
    protected strokeColorSelectHost?: HTMLElement;
    protected strokeWidthSelectHost?: HTMLElement;
    protected dashSelectHost?: HTMLElement;
    protected arrowDirectionSelectHost?: HTMLElement;
    protected arrowTypeSelect?: ArrowTypeSelect;
    protected strokeColorSelect?: ColorSelect;
    protected strokeWidthSelect?: WidthSelect;
    protected dashSelect?: DashSelect;
    protected arrowDirectionSelect?: ArrowDirectionSelect;
    protected arrowTypeSelectHost?: HTMLElement;

    protected shadowToolbar?: HTMLElement;
    protected shadowPresetSelectHost?: HTMLElement;
    protected shadowPresetSelect?: ShadowPresetSelect;
    protected shadowEnableCheckbox?: HTMLInputElement;
    protected haloEnableCheckbox?: HTMLInputElement;
    protected shadowOffsetXHost?: HTMLElement;
    protected shadowOffsetYHost?: HTMLElement;
    protected shadowBlurHost?: HTMLElement;
    protected shadowOffsetXSelect?: IntegerRangeSelect;
    protected shadowOffsetYSelect?: IntegerRangeSelect;
    protected shadowBlurSelect?: IntegerRangeSelect;


    protected fillToolbar?: HTMLElement;
    protected fillStyleSelectHost?: HTMLElement;
    protected fillStyleSelect?: ColorSelect;

    protected imageSelectHost?: HTMLElement;
    protected imageSelect?: ImageSelect;

    protected imageModeSelectHost?: HTMLElement;
    protected imageModeSelect?: ImageModeSelect;
    protected imageAlignSelectHost?: HTMLElement;
    protected imageAlignSelect?: ImageAlignSelect;
    protected imagePaddingHost?: HTMLElement;
    protected imagePaddingSelect?: IntegerRangeSelect;

    protected listenerDisposers: Array<() => void> = [];

    protected syncingControls: boolean = false;

    private hoverHint?: string;

    private focusHint?: string;

    static {
        registerBasicAdapters();
        registerBpmnAdapters();
        registerC4Adapters();
        registerErdAdapters();
        registerUmlAdapters();
        registerLogicAdapters();
    }

    /**
     * Creates an instance of DiagramEditor.
     * @param host The container element that will receive the editor layout.
     * @param config Optional configuration for layout, controls, toolbars, and prompts.
     * @param diagram Optional initial diagram to load into the editor.
     */
    constructor(host: HTMLElement, config?: DiagramEditorConfig, diagram?: Diagram) {
        this.host = host;
        this.eventDispatcher = new EventDispatcher(host);
        this.config = config || {};

        if (diagram && diagram.sheetRepository) {
            this.sheet_repository = diagram.sheetRepository;
        } else {
            this.sheet_repository = this.getSheetRepository();
            if (diagram) diagram.sheetRepository = this.sheet_repository;
        }

        this.initialize(this.host, this.config, diagram);

        // Workaround to keep diagram required even if none was passed.
        this.diagram = this.getDiagramView();
        this.diagram.sheetRepository = this.sheet_repository;
    }

    /**
     * Cleans up the editor and all owned child controls.
     */
    public destroy(): void {
        this.detachListeners();
        this.hintService?.destroy();
        this.diagram.destroy();

        this.topMenu?.destroy();
        this.toolbox?.destroy();
        this.inspector?.destroy();
        this.statusBar?.destroy();
        for (const toolbar of this.toolbars) {
            toolbar.destroy();
        }

        this.fontSelect?.destroy();
        this.fontSizeSelect?.destroy();
        this.textColorSelect?.destroy();
        this.textAlignToolbar?.destroy();
        this.textFormatToolbar?.destroy();
        this.strokeColorSelect?.destroy();
        this.strokeWidthSelect?.destroy();
        this.dashSelect?.destroy();
        this.arrowDirectionSelect?.destroy();
        this.arrowTypeSelect?.destroy();
        this.shadowPresetSelect?.destroy();
        this.shadowOffsetXSelect?.destroy();
        this.shadowOffsetYSelect?.destroy();
        this.shadowBlurSelect?.destroy();
        this.fillStyleSelect?.destroy();
        this.imageSelect?.destroy();
        this.imageModeSelect?.destroy();
        this.imageAlignSelect?.destroy();
        this.imagePaddingSelect?.destroy();

        this.freehandColorSelect?.destroy();
        this.freehandWidthSelect?.destroy();

        this.host.innerHTML = '';
    }

    /**
     * Clears the current diagram after resolving any unsaved-change prompt.
     * A prompt will be shown if the diagram has unsaved changes.
     * @returns True when a new empty diagram was created; otherwise false.
     */
    public async newDiagram(): Promise<boolean> {
        const created = await this.diagram.newDiagram();
        if (created) {
            this.reflectStyles();
        }
        return created;
    }

    /**
     * Loads a diagram from a live diagram instance, a serialized JSON string, or a deserialized payload.
     * A prompt will be shown if the diagram has unsaved changes.
     * @param source The diagram source to load.
     * @returns True when the source was loaded; otherwise false when loading was canceled.
     */
    public async loadDiagram(source: string | ISerializedDiagram | Diagram): Promise<boolean> {
        const loaded = await this.diagram.loadDiagram(source);
        if (loaded) {
            this.reflectStyles();
        }
        return loaded;
    }

    /**
     * Opens a diagram using configured file dialog behavior after resolving unsaved-change prompts.
     * @param options Optional open options or source overrides.
     * @returns True when a diagram was opened; otherwise false.
     */
    public async openDiagram(options?: DiagramOpenOptions): Promise<boolean> {
        const opened = await this.diagram.openDiagram(options);
        if (opened) {
            this.reflectStyles();
        }
        return opened;
    }

    /**
     * Loads a stylesheet from a provided source object/string and applies it.
     * @param source Stylesheet source payload.
     * @param options Optional load behavior.
     * @returns True when loading succeeded; otherwise false.
     */
    public async loadStylesheet(source: StylesheetOpenSource, options?: Pick<StylesheetOpenOptions, 'applyAfterLoad' | 'preferId'>): Promise<boolean> {
        const loaded = await this.diagram.loadStylesheet(source, options);
        if (loaded) {
            this.reflectStyles();
        }
        return loaded;
    }

    /**
     * Opens a stylesheet using dialog integrations and applies it.
     * @param options Optional open/load behavior.
     * @returns True when loading succeeded; otherwise false.
     */
    public async openStylesheet(options?: StylesheetOpenOptions): Promise<boolean> {
        const opened = await this.diagram.openStylesheet(options);
        if (opened) {
            this.reflectStyles();
        }
        return opened;
    }

    /**
     * Saves the current diagram using the underlying {@link DiagramEditView}.
     * A prompt will be shown if the diagram has no changes to save.
     * @param options Optional serialization settings.
     * @returns The serialized diagram string, or undefined when saving was canceled.
     */
    public async saveDiagram(options?: DiagramSaveOptions): Promise<string | undefined> {
        return await this.diagram.saveDiagram(options);
    }

    /**
     * Saves the currently active stylesheet through the underlying {@link DiagramEditView}.
     * @param options Optional save behavior.
     * @returns The resolved filename, or undefined when saving was canceled.
     */
    public async saveStylesheet(options?: StylesheetSaveOptions): Promise<string | undefined> {
        return await this.diagram.saveStylesheet(options);
    }

    /**
     * Exports the current diagram using the underlying {@link DiagramEditView}.
     * @param options Optional export settings.
     * @returns The export result, or undefined when export was canceled.
     */
    public async exportDiagram(options?: DiagramExportOptions): Promise<string | Uint8Array | Blob | undefined> {
        return await this.diagram.saveImageDiagram(options);
    }

    /**
     * Closes the current diagram after resolving any unsaved-change prompt.
     * A prompt will be shown if the diagram has unsaved changes.
     * @returns True when the diagram was closed; otherwise false.
     */
    public async close(): Promise<boolean> {
        if (!(await this.confirmCloseIfNeeded())) {
            return false;
        }

        this.diagram.clear();
        this.reflectStyles();
        return true;
    }

    public get canvas(): HTMLCanvasElement {
        return this.diagram.getCanvas();
    }

    public get view(): DiagramEditView {
        return this.diagram;
    }

    /**
     * Returns the owned diagram editing view.
     * @returns The current diagram in this editor.
     */
    public getDiagramView(): DiagramEditView {
        // TODO: Should we create a new diagram if undefined (since this method is called in the constructor)?
        // Currently its not a single-liner.
        return this.diagram;
    }

    /**
     * Returns the current sheet repository, creating a default one if none exists.
     * @returns The sheet repository used by this editor.
     */
    public getSheetRepository(): SheetRepository {
        if (!this.sheet_repository) {
            const repo = new SheetRepository();
            repo.upsertSheet({
                id: 'default_sheet',
                name: 'Default',
                types: {},
                classes: {
                    'default': {
                        // id: 'default_node',
                        strokeStyle: {
                            color: 'red',
                            width: 2
                        },
                        fillStyle: {
                            color: 'white',
                        },
                        textStyle: {},
                        shadowStyle: DiagramConstants.LOW_SHADOW,
                    }
                },
                diagram: {
                    background: { color: 'transparent' },
                }
            });
            repo.upsertSheet({
                id: 'bw_sheet',
                name: 'Black and White',
                types: {},
                classes: {
                    'default': {
                        // id: 'default_node',
                        strokeStyle: {
                            color: 'black',
                            width: 2
                        },
                        fillStyle: {
                            color: 'white',
                        },
                        textStyle: {
                            weight: 700,
                        },
                        shadowStyle: DiagramConstants.MEDIUM_SHADOW,
                    }
                },
                diagram: {
                    background: { color: 'transparent' },
                }
            });

            this.sheet_repository = repo;
        }
        return this.sheet_repository;
    }

    /**
     * Returns the action toolbars created for this editor.
     */
    public getToolbars(): DiagramToolBar[] {
        return this.toolbars;
    }

    /**
     * Returns the tool palette instance when available.
     */
    public getToolbox(): DiagramToolbox | undefined {
        return this.toolbox;
    }

    /**
     * Returns the font family selector control when available.
     */
    public getFontSelect(): FontSelect | undefined {
        return this.fontSelect;
    }

    /**
     * Returns the font size selector control when available.
     */
    public getFontSizeSelect(): SizeSelect | undefined {
        return this.fontSizeSelect;
    }

    /**
     * Returns the text color selector control when available.
     */
    public getTextColorSelect(): ColorSelect | undefined {
        return this.textColorSelect;
    }

    /**
     * Returns the stroke color selector control when available.
     */
    public getStrokeColorSelect(): ColorSelect | undefined {
        return this.strokeColorSelect;
    }

    /**
     * Returns the stroke width selector control when available.
     */
    public getStrokeWidthSelect(): WidthSelect | undefined {
        return this.strokeWidthSelect;
    }

    /**
     * Returns the dash selector control when available.
     */
    public getDashSelect(): DashSelect | undefined {
        return this.dashSelect;
    }

    /**
     * Returns the arrow direction selector control when available.
     */
    public getArrowDirectionSelect(): ArrowDirectionSelect | undefined {
        return this.arrowDirectionSelect;
    }

    /**
      * Returns the arrow type selector control when available.
      */
    public getArrowTypeSelect(): ArrowTypeSelect | undefined {
        return this.arrowTypeSelect;
    }

    /**
     * Returns the fill color selector control when available.
     */
    public getFillStyleSelect(): ColorSelect | undefined {
        return this.fillStyleSelect;
    }

    /**
     * Builds the editor layout and initializes all owned controls.
     * @param host The editor host element.
     * @param config The editor configuration.
     * @param diagram Optional initial diagram to load.
     */
    protected initialize(host: HTMLElement, config: DiagramEditorConfig, diagram?: Diagram): void {
        ensureEditorStyles();

        if (config.hostClassName) {
            setClasses(host, 'diagram-editor', config.hostClassName);
        } else {
            setClasses(host, 'diagram-editor');
        }

        this.topMenuHost = document.createElement('div');
        // Defer this lone till AFTER the diagram is created so the menu can access the diagram view for action state.
        // this.topMenu = new DiagramTopMenu(this.topMenuHost, this.diagram);
        host.appendChild(this.topMenuHost);

        // Create overall layout structure: header for toolbars and stage for the diagram and toolbox

        this.headerHost = document.createElement('div');
        setClasses(this.headerHost, 'diagram-editor-header');
        host.appendChild(this.headerHost);

        this.stageHost = document.createElement('div');
        setClasses(this.stageHost, 'diagram-editor-stage');
        if (config.showInspector === false) {
            this.stageHost.classList.add('no-inspector');
        }
        host.appendChild(this.stageHost);

        this.statusBarHost = document.createElement('div');
        setClasses(this.statusBarHost, 'diagram-editor-status-host');
        host.appendChild(this.statusBarHost);

        this.toolbarsHost = document.createElement('div');
        setClasses(this.toolbarsHost, 'diagram-editor-toolbars');
        this.headerHost.appendChild(this.toolbarsHost);

        // Tool palette is the left column of the stage grid — must be first child
        this.toolboxHost = document.createElement('div');
        setClasses(this.toolboxHost, 'diagram-editor-toolbox');
        this.stageHost.appendChild(this.toolboxHost);

        // Canvas wrapper is the right column — DiagramEditView fills it
        const canvasHost = document.createElement('div');
        setClasses(canvasHost, 'diagram-editor-canvas');
        this.stageHost.appendChild(canvasHost);

        // Inspector is the right column of the stage grid when enabled.
        if (config.showInspector !== false) {
            this.inspectorHost = document.createElement('div');
            setClasses(this.inspectorHost, 'diagram-editor-inspector');
            this.stageHost.appendChild(this.inspectorHost);
        }

        // Create the local diagram edit view and load the provided diagram if any
        const id = diagram?.id || `diagram-${Date.now()}`;
        this.diagram = new DiagramEditView(id, canvasHost);
        this.diagram.sheetRepository = this.sheet_repository;
        this.diagram.fileDialogs = this.createFileDialogs();
        this.diagram.prompts = this.createDiagramPrompts();
        this.diagram.contextMenu = new DiagramContextMenu(this.diagram);

        if (this.topMenuHost) {
            this.topMenu = new DiagramTopMenu(this.topMenuHost, this.diagram);
        }

        if (this.inspectorHost) {
            this.inspector = new DiagramInspector(this.inspectorHost, this.diagram, config.inspector || {});
        }

        if (this.statusBarHost) {
            this.statusBar = new DiagramStatusBar(this.diagram, this.statusBarHost);
        }

        if (this.statusBar) {
            this.hintService = new DiagramHintService(this.diagram, this.host, this);
            this.statusBar.setHint(this.hintService.hint);
            this.hintService.onHintChanged((hint) => {
                this.statusBar?.setHint(hint);
            });
        }

        if (diagram) this.diagram.read(diagram);

        // Initialize the tool palette
        this.toolbox = new DiagramToolbox(this.toolboxHost, this.diagram, config.toolbox || {});

        // Load toolbars or the default toolbar if none are specified
        this.toolbars = [];
        if (config.toolbars) {
            for (const toolbarConfig of config.toolbars) {
                const barHost = this.createToolbar(this.toolbarsHost);
                const toolbar = new DiagramToolBar(barHost, this.diagram, toolbarConfig);
                this.toolbars.push(toolbar);
            }
        } else {
            const barHost = this.createToolbar(this.toolbarsHost);
            const defaultToolbar = new DiagramToolBar(barHost, this.diagram);
            this.toolbars.push(defaultToolbar);
        }

        if (config.showInputs !== false) {
            /* Initialize text toolbar */

            this.textToolbar = this.createGroupToolbar(this.toolbarsHost, 'diagram-editor-text-toolbar', 'Text');

            this.fontSelectHost = this.createControlHost(this.textToolbar, 'diagram-editor-font-face-select');
            this.fontSizeSelectHost = this.createControlHost(this.textToolbar, 'diagram-editor-font-size-select');
            this.textColorSelectHost = this.createControlHost(this.textToolbar, 'diagram-editor-text-color-select');

            this.fontSelect = new FontSelect(this.fontSelectHost, config.fontSelect || {});
            this.fontSizeSelect = new SizeSelect(this.fontSizeSelectHost, config.fontSizeSelect || {});
            this.textColorSelect = new ColorSelect(this.textColorSelectHost, config.textColor || {});

            const textFormatHost = document.createElement('div');
            this.textToolbar.appendChild(textFormatHost);
            this.textFormatToolbar = new DiagramToolBar(textFormatHost, this.diagram, {
                layout: DIAGRAM_TEXT_FORMAT_ACTION_LAYOUT,
            });

            const textAlignHost = document.createElement('div');
            this.textToolbar.appendChild(textAlignHost);
            this.textAlignToolbar = new DiagramToolBar(textAlignHost, this.diagram, {
                layout: [...DIAGRAM_TEXT_ALIGN_ACTION_LAYOUT, '|', ...DIAGRAM_TEXT_ORIENTATION_ACTION_LAYOUT],
            });

            /* Initialize stroke toolbar */
            this.strokeToolbar = this.createGroupToolbar(this.toolbarsHost, 'diagram-editor-stroke-toolbar', 'Line');

            this.strokeColorSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-stroke-color-select');
            this.strokeWidthSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-stroke-width-select');
            this.dashSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-dash-select');
            this.arrowDirectionSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-arrow-select');
            this.arrowTypeSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-arrow-select');

            this.strokeColorSelect = new ColorSelect(this.strokeColorSelectHost, config.strokeColor || {});
            this.strokeWidthSelect = new WidthSelect(this.strokeWidthSelectHost, config.strokeWidth || {});
            this.dashSelect = new DashSelect(this.dashSelectHost, config.dashSelect || {});
            this.arrowDirectionSelect = new ArrowDirectionSelect(this.arrowDirectionSelectHost, config.arrowDirectionSelect || {});
            this.arrowTypeSelect = new ArrowTypeSelect(this.arrowTypeSelectHost, config.arrowTypeSelect || {});

            // Initialize fill toolbar
            this.fillToolbar = this.createGroupToolbar(this.toolbarsHost, 'diagram-editor-fill-toolbar', 'Fill');

            this.fillStyleSelectHost = this.createControlHost(this.fillToolbar, 'diagram-editor-fill-color-select');
            this.fillStyleSelect = new ColorSelect(this.fillStyleSelectHost, config.fillColor || {});

            this.imageSelectHost = document.createElement('div');
            setClasses(this.imageSelectHost, 'diagram-editor-image-select');
            this.fillToolbar.appendChild(this.imageSelectHost);
            this.imageSelect = new ImageSelect(this.imageSelectHost, {
                ...(config.imageSelect || {}),
                assetStore: this.diagram.assetStore,
            });

            this.imageModeSelectHost = document.createElement('div');
            setClasses(this.imageModeSelectHost, 'diagram-editor-image-mode-select');
            this.fillToolbar.appendChild(this.imageModeSelectHost);
            this.imageModeSelect = new ImageModeSelect(this.imageModeSelectHost);

            this.imageAlignSelectHost = document.createElement('div');
            setClasses(this.imageAlignSelectHost, 'diagram-editor-image-align-select');
            this.fillToolbar.appendChild(this.imageAlignSelectHost);
            this.imageAlignSelect = new ImageAlignSelect(this.imageAlignSelectHost);

            /* TODO: image padding moved to inspector — re-enable if a compact toolbar control is designed
            this.imagePaddingHost = this.createControlHost(this.fillToolbar, 'diagram-editor-image-padding', 'Pad');
            this.imagePaddingSelect = new IntegerRangeSelect(this.imagePaddingHost, {
                min: 0,
                max: 40,
                step: 1,
                ...(config.imagePadding || {}),
                unit: 'px',
            });
            */

            /* Initialize shadow toolbar */
            // this.shadowToolbar = this.createToolbar(this.toolbarsHost, 'diagram-editor-shadow-toolbar');
            this.shadowToolbar = this.createGroupToolbar(this.toolbarsHost, 'diagram-editor-shadow-toolbar', 'Shadow');

            this.shadowPresetSelectHost = this.createControlHost(this.shadowToolbar, 'diagram-editor-shadow-preset');
            this.shadowPresetSelect = new ShadowPresetSelect(this.shadowPresetSelectHost);

            // Shadow enable checkbox — must be the first element in the group
            // const shadowEnableLabel = document.createElement('label');
            // setClasses(shadowEnableLabel, 'diagram-editor-shadow-enable-label');
            // this.shadowEnableCheckbox = document.createElement('input');
            // this.shadowEnableCheckbox.type = 'checkbox';
            // const shadowEnableText = document.createElement('span');
            // shadowEnableText.textContent = 'Shadow';
            // shadowEnableLabel.appendChild(shadowEnableText);
            // shadowEnableLabel.appendChild(this.shadowEnableCheckbox);
            // this.shadowToolbar.appendChild(shadowEnableLabel);

            /* Halo enable checkbox is currently disabled in the toolbar.
            // Halo enable checkbox — alongside Shadow
            const haloEnableLabel = document.createElement('label');
            setClasses(haloEnableLabel, 'diagram-editor-shadow-enable-label');
            this.haloEnableCheckbox = document.createElement('input');
            this.haloEnableCheckbox.type = 'checkbox';
            const haloEnableText = document.createElement('span');
            haloEnableText.textContent = 'Halo';
            haloEnableLabel.appendChild(haloEnableText);
            haloEnableLabel.appendChild(this.haloEnableCheckbox);
            this.shadowToolbar.appendChild(haloEnableLabel);
            */

            /* TODO: shadow sliders moved to inspector — re-enable if a compact toolbar control is designed
            this.shadowOffsetXHost = this.createControlHost(this.shadowToolbar, 'diagram-editor-shadow-offset-x', 'X');
            this.shadowOffsetYHost = this.createControlHost(this.shadowToolbar, 'diagram-editor-shadow-offset-y', 'Y');
            this.shadowBlurHost = this.createControlHost(this.shadowToolbar, 'diagram-editor-shadow-blur', 'Blur');
    
            this.shadowOffsetXSelect = new IntegerRangeSelect(this.shadowOffsetXHost, {
                min: -16,
                max: 16,
                step: 1,
                ...(config.shadowOffsetX || {}),
                unit: 'px',
            });
            this.shadowOffsetYSelect = new IntegerRangeSelect(this.shadowOffsetYHost, {
                min: -16,
                max: 16,
                step: 1,
                ...(config.shadowOffsetY || {}),
                unit: 'px',
            });
            this.shadowBlurSelect = new IntegerRangeSelect(this.shadowBlurHost, {
                min: 0,
                max: 32,
                step: 1,
                ...(config.shadowBlur || {}),
                unit: 'px',
            });
            */
        } else {
            /* No inputs, so show text actions.. */
            const textHost = document.createElement('div');
            this.toolbarsHost!.appendChild(textHost);
            this.textFormatToolbar = new DiagramToolBar(textHost, this.diagram, {
                layout: DIAGRAM_TEXT_FORMAT_ACTION_LAYOUT,
            });

            this.textAlignToolbar = new DiagramToolBar(textHost, this.diagram, {
                layout: [...DIAGRAM_TEXT_ALIGN_ACTION_LAYOUT, '|', ...DIAGRAM_TEXT_ORIENTATION_ACTION_LAYOUT],
            });
            this.toolbars.push(this.textFormatToolbar, this.textAlignToolbar);
        }

        /* Initialize freehand toolbar */

        this.freehandToolbar = this.createToolbar(this.toolbarsHost);
        this.freehandColorHost = this.createControlHost(this.freehandToolbar, 'diagram-editor-freehand-select');
        this.freehandColorSelect = new ColorSelect(this.freehandColorHost, config.strokeColor || {});

        this.freehandWidthHost = this.createControlHost(this.freehandToolbar, 'diagram-editor-freehand-width-select');
        this.freehandWidthSelect = new WidthSelect(this.freehandWidthHost, config.strokeWidth || {});

        this.attachListeners();
        this.reflectStyles();
    }

    /**
     * Connects editor controls to the underlying diagram view and change events.
     */
    protected attachListeners(): void {
        /* Following were added to support hint changes */

        this.addManagedEventListener(this.host, 'pointerover', (event) => {
            const pointer = event as PointerEvent;
            if (pointer.pointerType === 'touch') {
                return;
            }
            const hint = this.resolveTooltip(event.target);
            this.hoverHint = hint || undefined;
            this.emitEditorHint('editor-hover', hint, !!hint);
        });

        this.addManagedEventListener(this.host, 'pointerout', (event) => {
            const pointer = event as PointerEvent;
            if (pointer.pointerType === 'touch') {
                return;
            }

            const next = pointer.relatedTarget as Node | null;
            if (!next || !this.host.contains(next)) {
                this.hoverHint = undefined;
                this.emitEditorHint('editor-hover', undefined, false);
            }
        });

        this.addManagedEventListener(this.host, 'focusin', (event) => {
            const hint = this.resolveTooltip(event.target);
            this.focusHint = hint || undefined;
            this.emitEditorHint('editor-focus', hint, !!hint);
        });

        this.addManagedEventListener(this.host, 'focusout', () => {
            const active = document.activeElement;
            if (!active || !this.host.contains(active)) {
                this.focusHint = undefined;
                this.emitEditorHint('editor-focus', undefined, false);
            }
        });

        /* End of hint change support */

        if (this.fontSelectHost) {
            this.addManagedListener<string>(this.fontSelectHost, 'fontchange', (font) => {
                if (this.syncingControls) return;
                if (font) {
                    this.diagram.setTextStyle({ ...this.diagram.textStyle, fontFace: font });
                }
            });
        }

        if (this.fontSizeSelectHost) {
            this.addManagedListener<number>(this.fontSizeSelectHost, 'sizechange', (size) => {
                if (this.syncingControls) return;
                if (Number.isFinite(size) && size > 0) {
                    this.diagram.setTextStyle({ ...this.diagram.textStyle, size });
                }
            });
        }

        if (this.textColorSelectHost) {
            this.addManagedListener<string>(this.textColorSelectHost, 'colorchange', (color) => {
                if (this.syncingControls) return;
                if (color) {
                    this.diagram.setTextStyle({ ...this.diagram.textStyle, color });
                }
            });
        }

        if (this.strokeColorSelectHost) {
            this.addManagedListener<string>(this.strokeColorSelectHost, 'colorchange', (color) => {
                if (this.syncingControls) return;
                if (color) {
                    this.diagram.setStrokeColor(color);
                }
            });
        }

        if (this.strokeWidthSelectHost) {
            this.addManagedListener<number>(this.strokeWidthSelectHost, 'widthchange', (width) => {
                if (this.syncingControls) return;
                if (Number.isFinite(width) && width > 0) {
                    this.diagram.setLineWidth(width);
                }
            });
        }

        if (this.dashSelectHost) {
            this.addManagedListener<LineDashValue>(this.dashSelectHost, 'dashchange', (dash) => {
                if (this.syncingControls) return;
                this.diagram.setLineDash(dash);
            });
        }

        if (this.arrowDirectionSelectHost) {
            this.addManagedListener<ArrowDirection>(this.arrowDirectionSelectHost, 'arrowchange', (arrow) => {
                if (this.syncingControls) return;
                if (arrow) {
                    this.diagram.setArrowAt(arrow);
                }
            });
        }
        if (this.arrowTypeSelectHost) {
            this.addManagedListener<ArrowType>(this.arrowTypeSelectHost, 'arrowtypechange', (arrowType) => {
                if (this.syncingControls) return;
                if (arrowType) {
                    this.diagram.setArrowType(arrowType);
                }
            });
        }

        if (this.shadowEnableCheckbox) {
            this.addManagedEventListener(this.shadowEnableCheckbox, 'change', () => {
                if (this.syncingControls) return;
                this.applyShadowEnabledState(this.shadowEnableCheckbox!.checked);
            });
        }

        if (this.shadowPresetSelectHost) {
            this.addManagedListener<ShadowStyle>(this.shadowPresetSelectHost, SHADOW_PRESET_CHANGE_EVENT, (style) => {
                if (this.syncingControls) return;
                this.diagram.setShadowStyle(style);
            });
        }

        if (this.haloEnableCheckbox) {
            this.addManagedEventListener(this.haloEnableCheckbox, 'change', () => {
                if (this.syncingControls) return;
                this.diagram.setTextStyle({ ...this.diagram.textStyle, halo: this.haloEnableCheckbox!.checked ? 'inherit' : 'transparent' });
            });
        }

        /* TODO: shadow slider listeners — paired with commented-out construction above
        if (this.shadowOffsetXHost) {
            this.addManagedListener<number>(this.shadowOffsetXHost, 'valuechange', (value) => {
                if (this.syncingControls) return;
                this.diagram.setShadowStyle({
                    offset: { ...this.diagram.shadowStyle.offset, x: value },
                });
            });
        }

        if (this.shadowOffsetYHost) {
            this.addManagedListener<number>(this.shadowOffsetYHost, 'valuechange', (value) => {
                if (this.syncingControls) return;
                this.diagram.setShadowStyle({
                    offset: { ...this.diagram.shadowStyle.offset, y: value },
                });
            });
        }

        if (this.shadowBlurHost) {
            this.addManagedListener<number>(this.shadowBlurHost, 'valuechange', (value) => {
                if (this.syncingControls) return;
                this.diagram.setShadowStyle({ blur: value });
            });
        }
        */

        if (this.fillStyleSelectHost) {
            this.addManagedListener<string>(this.fillStyleSelectHost, 'colorchange', (color) => {
                if (this.syncingControls) return;
                if (color) {
                    this.diagram.setFillColor(color);
                }
            });
        }

        if (this.imageSelectHost) {
            this.addManagedListener<string>(this.imageSelectHost, 'imagechange', (id) => {
                if (this.syncingControls) return;
                this.diagram.setImageId(id || undefined);
            });
        }

        if (this.imageModeSelectHost) {
            this.addManagedListener<string>(this.imageModeSelectHost, 'imagemodechange', (mode) => {
                if (this.syncingControls) return;
                this.diagram.applyNodePatch({ image_mode: mode }, 'image-mode');
            });
        }

        if (this.imageAlignSelectHost) {
            this.addManagedListener<string>(this.imageAlignSelectHost, 'imagealignchange', (align) => {
                if (this.syncingControls) return;
                this.diagram.applyNodePatch({ image_align: align }, 'image-align');
            });
        }

        /* TODO: image padding listener — paired with commented-out construction above
        if (this.imagePaddingHost) {
            this.addManagedListener<number>(this.imagePaddingHost, 'valuechange', (value) => {
                if (this.syncingControls) return;
                this.diagram.applyNodePatch({ image_padding: value }, 'image-padding');
            });
        }
        */

        if (this.freehandColorHost) {
            this.addManagedListener<string>(this.freehandColorHost, 'colorchange', (color) => {
                if (this.syncingControls) return;
                if (color) {
                    this.diagram.freehandColor = color;
                }
            });
        }
        if (this.freehandWidthHost) {
            this.addManagedListener<number>(this.freehandWidthHost, 'widthchange', (width) => {
                if (this.syncingControls) return;
                if (Number.isFinite(width) && width > 0) {
                    this.diagram.freehandLineWidth = width;
                }
            });
        }

        this.addManagedEventListener(this.host, DIAGRAM_CHANGED_EVENT, () => {
            this.reflectStyles();
        });
    }

    /**
     * Removes all event listeners previously registered by the editor.
     */
    protected detachListeners(): void {
        for (const dispose of this.listenerDisposers) {
            dispose();
        }
        this.listenerDisposers = [];
    }

    /**
     * Synchronizes the style controls with the current style state of the diagram.
     */
    protected reflectStyles(): void {
        this.syncingControls = true;
        try {
            const frequent = this.diagram.getFrequentColors();

            if (this.fontSelect && this.fontSelectHost) {
                this.fontSelect.value = this.diagram.textStyle.fontFace ?? DiagramConstants.DEFAULT_NODE_FONT_FACE;
            }

            if (this.fontSizeSelect && this.fontSizeSelectHost) {
                this.fontSizeSelect.value = this.diagram.textStyle.size ?? DiagramConstants.DEFAULT_NODE_FONT_SIZE;
            }

            if (this.textColorSelect) {
                const color = this.diagram.textStyle.color ?? DiagramConstants.DEFAULT_NODE_TEXT_COLOR;
                this.textColorSelect.clearOptions();
                this.textColorSelect.addOptions([color, ...frequent]);
                this.textColorSelect.value = color;
            }

            if (this.strokeColorSelect) {
                const color = this.diagram.strokeColor;
                this.strokeColorSelect.clearOptions();
                this.strokeColorSelect.addOptions([color, ...frequent]);
                this.strokeColorSelect.value = color;
            }

            if (this.strokeWidthSelect && this.strokeWidthSelectHost) {
                this.strokeWidthSelect.value = this.diagram.lineWidth;
            }

            if (this.dashSelect) {
                this.dashSelect.value = this.normalizeLineDashValue(this.diagram.lineDash);
            }

            if (this.arrowDirectionSelect) {
                this.arrowDirectionSelect.value = this.diagram.arrowAt;
            }
            if (this.arrowTypeSelect) {
                this.arrowTypeSelect.value = this.diagram.arrowType;
            }

            if (this.shadowPresetSelect) {
                this.shadowPresetSelect.value = this.diagram.shadowStyle;
            }

            if (this.shadowEnableCheckbox) {
                const shadow = this.diagram.shadowStyle;
                const enabled = shadow.color !== 'transparent';
                this.shadowEnableCheckbox.checked = enabled;

                /* TODO: shadow slider sync — paired with commented-out construction above
                if (this.shadowOffsetXSelect) {
                    this.shadowOffsetXSelect.value = shadow.offset.x;
                    this.shadowOffsetXSelect.disabled = !enabled;
                }

                if (this.shadowOffsetYSelect) {
                    this.shadowOffsetYSelect.value = shadow.offset.y;
                    this.shadowOffsetYSelect.disabled = !enabled;
                }

                if (this.shadowBlurSelect) {
                    this.shadowBlurSelect.value = shadow.blur;
                    this.shadowBlurSelect.disabled = !enabled;
                }
                */
            }

            if (this.haloEnableCheckbox) {
                const halo = this.diagram.textStyle.halo;
                this.haloEnableCheckbox.checked = halo !== 'transparent';
            }

            if (this.fillStyleSelect) {
                const color = this.diagram.fillColor;
                this.fillStyleSelect.clearOptions();
                this.fillStyleSelect.addOptions([color, ...frequent]);
                this.fillStyleSelect.value = color;
            }

            if (this.imageSelect) {
                this.imageSelect.setAssetStore(this.diagram.assetStore);
                const imageId = this.diagram.imageId;
                const nodes = this.diagram.selection().filter(n => n.image_id !== undefined);
                const isMixed = !imageId && nodes.length > 0
                    && new Set(this.diagram.selection().map(n => n.image_id ?? '')).size > 1;
                this.imageSelect.setMixed(isMixed);
                if (!isMixed) {
                    this.imageSelect.value = imageId;
                }
            }

            if (this.imageModeSelect) {
                const hasImage = !!this.diagram.imageId;
                this.imageModeSelect.disabled = !hasImage;
                const mode = this.diagram.imageMode;
                if (mode) this.imageModeSelect.mode = mode as any;
            }

            if (this.imageAlignSelect) {
                const hasImage = !!this.diagram.imageId;
                const mode = this.diagram.imageMode;
                const alignable = hasImage && (mode === 'contain' || mode === 'fit' || !mode);
                this.imageAlignSelect.disabled = !alignable;
                const align = this.diagram.imageAlign;
                if (align) this.imageAlignSelect.align = align as any;
            }

            if (this.freehandToolbar) {
                this.freehandToolbar.style.display = this.diagram.currentTool === 'freehand' ? 'flex' : 'none';
            }
            if (this.freehandColorSelect) {
                const color = this.diagram.freehandColor;
                this.freehandColorSelect.clearOptions();
                this.freehandColorSelect.addOptions([color, ...frequent]);
                this.freehandColorSelect.value = color;
            }

            if (this.freehandWidthSelect) {
                this.freehandWidthSelect.value = this.diagram.freehandLineWidth;
            }

            /* TODO: image padding reflect — paired with commented-out construction above
            if (this.imagePaddingSelect) {
                const pad = this.diagram.imagePadding;
                if (pad >= 0) this.imagePaddingSelect.value = pad;
                this.imagePaddingSelect.disabled = !this.diagram.imageId;
            }
            */
        } finally {
            this.syncingControls = false;
        }
    }

    private normalizeLineDashValue(value: string | number[]): LineDashValue {
        if (Array.isArray(value)) {
            return value;
        }

        if (value === 'solid' || value === 'dashed' || value === 'dotted' || value === 'dashdot') {
            return value;
        }

        return 'solid';
    }

    /**
     * Creates a toolbar container div inside the given parent element.
     * @param parent The element to append the toolbar to.
     * @param className Optional extra CSS class for the toolbar.
     * @returns The toolbar wrapper element.
     */
    private createToolbar(parent: HTMLElement, className?: string): HTMLElement {
        const bar = document.createElement('div');
        className ? setClasses(bar, 'toolbar', className) : setClasses(bar, 'toolbar');
        parent.appendChild(bar);

        return bar;
    }

    /**
     * Creates a `<fieldset>` toolbar group with a `<legend>` label cutting into the border.
     */
    private createGroupToolbar(parent: HTMLElement, className: string, label: string): HTMLElement {
        const fieldset = document.createElement('fieldset');
        setClasses(fieldset, className);
        const legend = document.createElement('legend');
        legend.textContent = label;
        fieldset.appendChild(legend);
        parent.appendChild(fieldset);
        return fieldset;
    }

    /**
     * Creates a labelled host element for a single editor control inside a toolbar.
     * @param parent The toolbar element to append the control host to.
     * @param className CSS class applied to the inner host div.
     * @param labelText Optional visible label text; if provided a `<label>` wraps the host.
     * @returns The inner host element that should receive the control.
     */
    private createControlHost(parent: HTMLElement, className: string, labelText?: string): HTMLElement {
        const container = labelText ? document.createElement('label') : document.createElement('div');
        if (labelText) {
            setClasses(container, 'diagram-editor-control-label');
            container.textContent = labelText;
        }

        const host = document.createElement('div');
        setClasses(host, className);
        container.appendChild(host);
        parent.appendChild(container);
        return host;
    }

    /**
     * Enables or disables the shadow effect on the diagram, then syncs the shadow range controls.
     * @param enabled True to enable shadow, false to disable (sets color to transparent).
     */
    private applyShadowEnabledState(enabled: boolean): void {
        if (enabled) {
            // Only apply the default if the shadow is currently invisible (transparent / zero-blur)
            const current = this.diagram.shadowStyle;
            const isBlank = current.color === 'transparent' || (current.blur === 0 && current.offset.x === 0 && current.offset.y === 0);
            if (isBlank) {
                this.diagram.setShadowStyle(DiagramConstants.MEDIUM_SHADOW);
            }
        } else {
            this.diagram.setShadowStyle({ color: 'transparent' });
        }

        if (this.shadowOffsetXSelect) this.shadowOffsetXSelect.disabled = !enabled;
        if (this.shadowOffsetYSelect) this.shadowOffsetYSelect.disabled = !enabled;
        if (this.shadowBlurSelect) this.shadowBlurSelect.disabled = !enabled;
    }

    /**
     * Adds a CustomEvent listener on the element and registers a disposer so the listener
     * is automatically removed when {@link detachListeners} is called.
     * @param element The target element.
     * @param eventName The event name to listen for.
     * @param handler Callback receiving the CustomEvent detail payload.
     */
    private addManagedListener<T>(element: HTMLElement, eventName: string, handler: (detail: T) => void): void {
        const wrapped = (event: Event) => {
            handler((event as CustomEvent<T>).detail);
        };

        element.addEventListener(eventName, wrapped as EventListener);
        this.listenerDisposers.push(() => {
            element.removeEventListener(eventName, wrapped as EventListener);
        });
    }

    /**
     * Adds a plain DOM event listener on the element and registers a disposer so the listener
     * is automatically removed when {@link detachListeners} is called.
     * @param element The target element.
     * @param eventName The event name to listen for.
     * @param handler Callback invoked on each event.
     */
    private addManagedEventListener(element: HTMLElement, eventName: string, handler: (event: Event) => void): void {
        const wrapped = (event: Event) => {
            handler(event);
        };

        element.addEventListener(eventName, wrapped as EventListener);
        this.listenerDisposers.push(() => {
            element.removeEventListener(eventName, wrapped as EventListener);
        });
    }

    private resolveTooltip(target: EventTarget | null): string {
        if (!(target instanceof Element)) {
            return '';
        }

        const el = target.closest<HTMLElement>('[title], [aria-label], [data-tooltip], [data-title], [placeholder]');
        if (!el) {
            return '';
        }

        return (el.getAttribute('title')
            || el.getAttribute('aria-label')
            || el.getAttribute('data-tooltip')
            || el.getAttribute('data-title')
            || el.getAttribute('placeholder')
            || '').trim();
    }

    private emitEditorHint(source: DiagramHintChange['source'], hint?: string, active: boolean = true): void {
        const detail: DiagramHintChange = { source, hint, active };
        this.eventDispatcher.hintChanged(detail);
    }

    /**
     * Constructs a DiagramFileDialogs instance, merging any consumer-provided file dialog
     * overrides from the editor config.
     * @returns The configured DiagramFileDialogs object.
     */
    private createFileDialogs(): DiagramFileDialogs {
        const dialogs = new DiagramFileDialogs();

        const configured = this.config.fileDialogs;
        if (configured?.onOpenDiagram) {
            dialogs.onOpenDiagram = configured.onOpenDiagram;
        }
        if (configured?.onSaveDiagram) {
            dialogs.onSaveDiagram = configured.onSaveDiagram;
        }
        if (configured?.onExportDiagram) {
            dialogs.onExportDiagram = configured.onExportDiagram;
        }
        if (configured?.onOpenStylesheet) {
            dialogs.onOpenStylesheet = configured.onOpenStylesheet;
        }
        if (configured?.onSaveStylesheet) {
            dialogs.onSaveStylesheet = configured.onSaveStylesheet;
        }

        return dialogs;
    }

    /**
     * Constructs the DiagramEditViewPrompts bridge, routing calls through consumer-provided
     * prompt overrides or falling back to the built-in dialog implementations.
     * @returns The configured prompts object.
     */
    private createDiagramPrompts(): DiagramEditViewPrompts {
        return {
            onUnsavedChanges: async ({ reason }) => {
                const mappedReason: DiagramEditorPromptReason = reason === 'open' ? 'load' : reason;
                return this.config.prompts?.onUnsavedChanges
                    ? await this.config.prompts.onUnsavedChanges({ reason: mappedReason })
                    : await this.promptUnsavedChanges(mappedReason);
            },
            onNoChangesSave: async () => {
                return this.config.prompts?.onNoChangesSave
                    ? await this.config.prompts.onNoChangesSave()
                    : await this.promptNoChangesSave();
            },
        };
    }

    /**
     * If the diagram has unsaved changes, prompts the user to save or discard before closing.
     * @returns True when the close operation should proceed; false when the user cancels.
     */
    private async confirmCloseIfNeeded(): Promise<boolean> {
        if (!this.diagram.isModified()) {
            return true;
        }

        const action = this.config.prompts?.onUnsavedChanges
            ? await this.config.prompts.onUnsavedChanges({ reason: 'close' })
            : await this.promptUnsavedChanges('close');

        if (action === 'cancel') {
            return false;
        }

        if (action === 'save') {
            const saved = await this.saveDiagram();
            return typeof saved === 'string' && saved.length > 0;
        }

        return true;
    }

    /**
     * Shows the default prompt used when a save is requested without any pending changes.
     * @returns True when saving should continue; otherwise false.
     */
    protected async promptNoChangesSave(): Promise<boolean> {
        const choice = await PromptDialog.show<'save' | 'cancel'>({
            title: 'Nothing changed',
            prompt: 'There are no unsaved changes. Save anyway?',
            icon: 'i',
            actions: [
                { value: 'cancel', label: 'Cancel' },
                { value: 'save', label: 'Save anyway', primary: true },
            ],
        });

        return choice === 'save';
    }

    /**
     * Shows the default unsaved-changes prompt for the requested action.
     * @param reason The operation that triggered the prompt.
     * @returns The action selected by the user.
     */
    protected async promptUnsavedChanges(reason: DiagramEditorPromptReason): Promise<DiagramEditorUnsavedAction> {
        const reasonLabel = reason === 'new'
            ? 'starting a new diagram'
            : reason === 'load'
                ? 'loading another diagram'
                : 'closing this diagram';

        return PromptDialog.show<DiagramEditorUnsavedAction>({
            title: 'Unsaved changes',
            prompt: `You have unsaved changes before ${reasonLabel}.`,
            icon: '!',
            actions: [
                { value: 'cancel', label: 'Cancel' },
                { value: 'discard', label: 'Discard' },
                { value: 'save', label: 'Save', primary: true },
            ],
        });
    }

}