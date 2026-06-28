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
import { ToolPalette, type ToolPaletteConfig } from "./buttons/tool.palette";
import { DIAGRAM_CHANGED_EVENT, type DiagramHintChange } from "../events/diagram.events";
import { EventDispatcher } from "../events/event.dispatcher";
import { WidthSelect, type WidthSelectConfig } from "./inputs/width.select";
import { ArrowSelect, type ArrowSelectConfig } from "./inputs/arrow.select";
import { DashSelect, type DashSelectConfig, type LineDashValue } from "./inputs/dash.select";
import { ImageSelect, type ImageSelectConfig } from "./inputs/image.select";
import { ImageModeSelect } from "./inputs/image.mode.select";
import { ImageAlignSelect } from "./inputs/image.align.select";
import type { ArrowDirection } from "../types";
import { IntegerRangeSelect, type IntegerRangeSelectConfig } from "./inputs/integer.range.select";
import { DiagramInspector } from "./inspector/diagram.inspector";
import type { InspectorConfig } from "./inspector/inspector";
import { DiagramContextMenu } from "./menus/diagram.context.menu";
import { DiagramConstants } from "../model/diagram.constants";
import { DiagramStatusBar } from "../status/diagram.status.bar";
import { ShadowPresetSelect, SHADOW_PRESET_CHANGE_EVENT } from "./inputs/shadow.preset.select";
import type { ShadowStyle } from "../style.interfaces";
import { DiagramHintService } from "../status/diagram.hint.service";

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
};

export type DiagramEditorConfig = {
    hostClassName?: string;
    showInspector?: boolean;
    toolPalette?: ToolPaletteConfig;
    toolbars?: DiagramToolBarConfig[];
    prompts?: DiagramEditorPrompts;
    fontSelect?: FontSelectConfig;
    fontSizeSelect?: SizeSelectConfig;
    textColor?: ColorSelectConfig;
    strokeColor?: ColorSelectConfig;
    strokeWidth?: WidthSelectConfig;
    dashSelect?: DashSelectConfig;
    arrowSelect?: ArrowSelectConfig;
    shadowOffsetX?: IntegerRangeSelectConfig;
    shadowOffsetY?: IntegerRangeSelectConfig;
    shadowBlur?: IntegerRangeSelectConfig;
    fillColor?: ColorSelectConfig;
    imageSelect?: ImageSelectConfig;
    imagePadding?: IntegerRangeSelectConfig;
    inspector?: InspectorConfig;

    fileDialogs?: DiagramEditorFileDialogsConfig;
}

const DIAGRAM_EDITOR_STYLE_ID = 'diagram-editor-layout';

const DIAGRAM_EDITOR_STYLES = `
.diagram-editor {
    --diagram-inspector-width: 300px;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    font-size: var(--diagram-ui-font-size, 12px);
    font-family: var(--diagram-ui-font-family, system-ui);
    line-height: 1.4;
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.82));
}
.diagram-editor-header {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--diagram-ui-control-gap, 4px);
    padding: 8px 8px 0;
    border-bottom: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
}
.diagram-editor-toolbars {
    display: flex;
    flex-wrap: wrap;
    gap: var(--diagram-ui-control-gap, 4px);
    align-items: stretch;
    justify-content: flex-start;
    padding-bottom: 8px;
}
.diagram-editor-stage {
    flex: 1 1 0;
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content;
    min-height: 0;
    overflow: hidden;
}
.diagram-editor-stage.no-inspector {
    grid-template-columns: max-content minmax(0, 1fr);
}
.diagram-editor-status-host {
    flex: 0 0 auto;
    min-height: 0;
}
.diagram-editor-tool-palette {
    border-right: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
    padding: 8px var(--diagram-ui-panel-padding, 6px);
    overflow-y: auto;
}
.diagram-editor-inspector {
    border-left: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
    padding: 8px var(--diagram-ui-panel-padding, 6px);
    overflow-y: auto;
    min-width: 180px;
}
.diagram-editor-canvas {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}
.diagram-editor-canvas canvas {
    display: block;
    width: 100%;
    height: 100%;
}

.diagram-editor-shadow-toolbar {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--diagram-ui-toolbar-gap, 6px);
    padding: var(--diagram-ui-control-padding-y, 6px) var(--diagram-ui-control-padding-x, 8px);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
    border-radius: var(--diagram-ui-panel-radius, 12px);
}
.diagram-editor-control-label {
    display: inline-flex;
    align-items: center;
    gap: var(--diagram-ui-toolbar-gap, 6px);
    margin-inline-start: 4px;
    font: 400 var(--diagram-ui-font-size, 11px)/1.2 var(--diagram-ui-font-family, system-ui);
    color: var(--diagram-ui-text-muted, #475569);
}
.diagram-editor-shadow-enable-label {
    display: inline-flex;
    align-items: normal;
    gap: var(--diagram-ui-control-gap, 4px);
    margin-inline-start: 4px;
    margin-inline-end: 4px;     // added when checkbox stands alone
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, system-ui);
    color: var(--diagram-ui-text-muted, #475569);
    cursor: pointer;
    user-select: none;
}
.diagram-editor-shadow-enable-label input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--diagram-ui-accent, #0f766e);
    margin: 0;
}
.diagram-editor-text-toolbar,
.diagram-editor-stroke-toolbar,
.diagram-editor-fill-toolbar {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--diagram-ui-toolbar-gap, 6px);
    margin: 0;
    padding: 4px var(--diagram-ui-control-padding-x, 8px) 6px;
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
    border-radius: var(--diagram-ui-panel-radius, 12px);
}
.diagram-editor-text-toolbar > legend,
.diagram-editor-stroke-toolbar > legend,
.diagram-editor-fill-toolbar > legend {
    padding: 0 4px;
    font: 600 10px/1 var(--diagram-ui-font-family, system-ui);
    color: var(--diagram-ui-text-muted, #475569);
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.diagram-editor-shadow-toolbar .diagram-editor-control-label {
    min-width: 30px;
    justify-content: flex-end;
    margin-inline-start: 6px;
    gap: var(--diagram-ui-control-gap, 4px);
}
`;

function ensureEditorStyles(): void {
    injectStyles(DIAGRAM_EDITOR_STYLE_ID, DIAGRAM_EDITOR_STYLES);
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

    protected headerHost?: HTMLElement;
    protected stageHost?: HTMLElement;
    protected statusBarHost?: HTMLElement;

    protected toolbarsHost?: HTMLElement;
    protected toolbars: DiagramToolBar[] = [];

    protected toolboxHost?: HTMLElement;
    protected toolbox?: ToolPalette;

    protected inspectorHost?: HTMLElement;
    protected inspector?: DiagramInspector;
    protected statusBar?: DiagramStatusBar;
    protected hintService?: DiagramHintService;

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
    protected arrowSelectHost?: HTMLElement;
    protected strokeColorSelect?: ColorSelect;
    protected strokeWidthSelect?: WidthSelect;
    protected dashSelect?: DashSelect;
    protected arrowSelect?: ArrowSelect;

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

        this.initialize(this.host, this.config, diagram);
        // Workaround to keep diagram required even if none was passed.
        this.diagram = this.getDiagramView();
    }

    /**
     * Cleans up the editor and all owned child controls.
     */
    public destroy(): void {
        this.detachListeners();
        this.hintService?.destroy();
        this.diagram.destroy();

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
        this.arrowSelect?.destroy();
        this.shadowPresetSelect?.destroy();
        this.shadowOffsetXSelect?.destroy();
        this.shadowOffsetYSelect?.destroy();
        this.shadowBlurSelect?.destroy();
        this.fillStyleSelect?.destroy();
        this.imageSelect?.destroy();
        this.imageModeSelect?.destroy();
        this.imageAlignSelect?.destroy();
        this.imagePaddingSelect?.destroy();

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
     * Saves the current diagram using the underlying {@link DiagramEditView}.
     * A prompt will be shown if the diagram has no changes to save.
     * @param options Optional serialization settings.
     * @returns The serialized diagram string, or undefined when saving was canceled.
     */
    public async saveDiagram(options?: DiagramSaveOptions): Promise<string | undefined> {
        return await this.diagram.saveDiagram(options);
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
     */
    public getDiagramView(): DiagramEditView {
        return this.diagram;
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
    public getToolbox(): ToolPalette | undefined {
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
     * Returns the arrow selector control when available.
     */
    public getArrowSelect(): ArrowSelect | undefined {
        return this.arrowSelect;
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
        setClasses(this.toolboxHost, 'diagram-editor-tool-palette');
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
        this.diagram.fileDialogs = this.createFileDialogs();
        this.diagram.prompts = this.createDiagramPrompts();
        this.diagram.contextMenu = new DiagramContextMenu(this.diagram);

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
        this.toolbox = new ToolPalette(this.toolboxHost, this.diagram, config.toolPalette || {});

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

        // Initialize text toolbar
        this.textToolbar = this.createGroupToolbar(this.toolbarsHost, 'diagram-editor-text-toolbar', 'Text');

        this.fontSelectHost = this.createControlHost(this.textToolbar, 'diagram-editor-font-face-select');
        this.fontSizeSelectHost = this.createControlHost(this.textToolbar, 'diagram-editor-font-size-select');
        this.textColorSelectHost = this.createControlHost(this.textToolbar, 'diagram-editor-text-color-select');

        this.fontSelect = new FontSelect(this.fontSelectHost, config.fontSelect || {});
        this.fontSizeSelect = new SizeSelect(this.fontSizeSelectHost, config.fontSizeSelect || {});
        this.textColorSelect = new ColorSelect(this.textColorSelectHost, config.textColor || {});

        const textAlignHost = document.createElement('div');
        this.textToolbar.appendChild(textAlignHost);
        this.textAlignToolbar = new DiagramToolBar(textAlignHost, this.diagram, {
            layout: DIAGRAM_TEXT_ALIGN_ACTION_LAYOUT,
        });

        const textFormatHost = document.createElement('div');
        this.textToolbar.appendChild(textFormatHost);
        this.textFormatToolbar = new DiagramToolBar(textFormatHost, this.diagram, {
            layout: [...DIAGRAM_TEXT_FORMAT_ACTION_LAYOUT, '|', ...DIAGRAM_TEXT_ORIENTATION_ACTION_LAYOUT],
        });

        // Initialize stroke toolbar
        this.strokeToolbar = this.createGroupToolbar(this.toolbarsHost, 'diagram-editor-stroke-toolbar', 'Line');

        this.strokeColorSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-stroke-color-select');
        this.strokeWidthSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-stroke-width-select');
        this.dashSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-dash-select');
        this.arrowSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-arrow-select');

        this.strokeColorSelect = new ColorSelect(this.strokeColorSelectHost, config.strokeColor || {});
        this.strokeWidthSelect = new WidthSelect(this.strokeWidthSelectHost, config.strokeWidth || {});
        this.dashSelect = new DashSelect(this.dashSelectHost, config.dashSelect || {});
        this.arrowSelect = new ArrowSelect(this.arrowSelectHost, config.arrowSelect || {});

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

        // Initialize shadow toolbar
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


        this.attachListeners();
        this.reflectStyles();
    }

    /**
     * Connects editor controls to the underlying diagram view and change events.
     */
    protected attachListeners(): void {
        // Following were added to support hint changes

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

        // End of hint change support

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

        if (this.arrowSelectHost) {
            this.addManagedListener<ArrowDirection>(this.arrowSelectHost, 'arrowchange', (arrow) => {
                if (this.syncingControls) return;
                if (arrow) {
                    this.diagram.setArrow(arrow);
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

            if (this.arrowSelect) {
                this.arrowSelect.value = this.diagram.arrow;
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