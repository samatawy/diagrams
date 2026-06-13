import { DiagramEditView } from "../editview/diagram.edit.view";
import { jsonSerializer, type DiagramSaveOptions, type ISerializedDiagram } from "../io";
import { Diagram } from "../model/diagram";
import { ColorSelect, type ColorSelectConfig } from "./color.select";
import { DiagramToolBar, type DiagramToolBarConfig } from "./diagram.tool.bar";
import { injectStyles, setClasses } from "./editor.utils";
import { FontSelect, type FontSelectConfig } from "./font.select";
import { PromptDialog } from "./prompt.dialog";
import { SizeSelect, type SizeSelectConfig } from "./size.select";
import { ToolPalette, type ToolPaletteConfig } from "./tool.palette";
import { DIAGRAM_CHANGED_EVENT } from "../events/diagram.events";
import { WidthSelect, type WidthSelectConfig } from "./width.select";

export type DiagramEditorUnsavedAction = 'save' | 'discard' | 'cancel';

export type DiagramEditorPromptReason = 'new' | 'load' | 'close';

export type DiagramEditorPrompts = {
    onUnsavedChanges?: (context: { reason: DiagramEditorPromptReason }) => DiagramEditorUnsavedAction | Promise<DiagramEditorUnsavedAction>;
    onNoChangesSave?: () => boolean | Promise<boolean>;
};

export type DiagramEditorConfig = {
    hostClassName?: string;
    toolPalette?: ToolPaletteConfig;
    toolbars?: DiagramToolBarConfig[];
    prompts?: DiagramEditorPrompts;
    fontSelect?: FontSelectConfig;
    fontSizeSelect?: SizeSelectConfig;
    textColor?: ColorSelectConfig;
    strokeColor?: ColorSelectConfig;
    strokeWidth?: WidthSelectConfig;
    fillColor?: ColorSelectConfig;
}

const DIAGRAM_EDITOR_STYLE_ID = 'diagram-editor-layout';

const DIAGRAM_EDITOR_STYLES = `
.diagram-editor {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    background: rgba(255, 255, 255, 0.82);
}
.diagram-editor-header {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 8px 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.12);
}
.diagram-editor-toolbars {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: flex-start;
    padding-bottom: 8px;
}
.diagram-editor-stage {
    flex: 1 1 0;
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    min-height: 0;
    overflow: hidden;
}
.diagram-editor-tool-palette {
    border-right: 1px solid rgba(15, 23, 42, 0.12);
    padding: 8px 6px;
    overflow-y: auto;
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
.diagram-editor-font-toolbar,
.diagram-editor-stroke-toolbar,
.diagram-editor-fill-toolbar {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 12px;
}
.diagram-editor-control-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-inline-start: 4px;
    font: 600 12px/1.2 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #475569;
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

    protected config: DiagramEditorConfig;

    protected diagram: DiagramEditView;

    protected headerHost?: HTMLElement;
    protected stageHost?: HTMLElement;

    protected toolbarsHost?: HTMLElement;
    protected toolbars: DiagramToolBar[] = [];

    protected toolboxHost?: HTMLElement;
    protected toolbox?: ToolPalette;

    protected fontToolbar?: HTMLElement;
    protected fontSelectHost?: HTMLElement;
    protected fontSizeSelectHost?: HTMLElement;
    protected textColorSelectHost?: HTMLElement;
    protected fontSelect?: FontSelect;
    protected fontSizeSelect?: SizeSelect;
    protected textColorSelect?: ColorSelect;

    protected strokeToolbar?: HTMLElement;
    protected strokeColorSelectHost?: HTMLElement;
    protected strokeWidthSelectHost?: HTMLElement;
    protected strokeColorSelect?: ColorSelect;
    protected strokeWidthSelect?: WidthSelect;

    protected fillToolbar?: HTMLElement;
    protected fillStyleSelectHost?: HTMLElement;
    protected fillStyleSelect?: ColorSelect;

    protected listenerDisposers: Array<() => void> = [];

    protected syncingControls: boolean = false;

    /**
     * Creates an instance of DiagramEditor.
     * @param host The container element that will receive the editor layout.
     * @param config Optional configuration for layout, controls, toolbars, and prompts.
     * @param diagram Optional initial diagram to load into the editor.
     */
    constructor(host: HTMLElement, config?: DiagramEditorConfig, diagram?: Diagram) {
        this.host = host;
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
        this.diagram.destroy();

        this.toolbox?.destroy();
        for (const toolbar of this.toolbars) {
            toolbar.destroy();
        }

        this.fontSelect?.destroy();
        this.fontSizeSelect?.destroy();
        this.textColorSelect?.destroy();
        this.strokeColorSelect?.destroy();
        this.strokeWidthSelect?.destroy();
        this.fillStyleSelect?.destroy();

        this.host.innerHTML = '';
    }

    /**
     * Clears the current diagram after resolving any unsaved-change prompt.
     * @returns True when a new empty diagram was created; otherwise false.
     */
    public async newDiagram(): Promise<boolean> {
        if (!(await this.confirmUnsavedIfNeeded('new'))) {
            return false;
        }

        this.diagram.clear();
        this.reflectStyles();
        return true;
    }

    /**
     * Loads a diagram from a live diagram instance, a serialized JSON string, or a deserialized payload.
     * @param source The diagram source to load.
     * @returns True when the source was loaded; otherwise false when loading was canceled.
     */
    public async loadDiagram(source: string | ISerializedDiagram | Diagram): Promise<boolean> {
        if (!(await this.confirmUnsavedIfNeeded('load'))) {
            return false;
        }

        if (source instanceof Diagram) {
            // Populate this diagram with the data from the source diagram
            const serialized = source.write(jsonSerializer);
            await this.diagram.read(serialized, jsonSerializer);
            this.reflectStyles();
            return true;

        } else if (typeof source === 'string') {
            // Assume it's a serialized diagram in JSON format
            await this.diagram.read(source, jsonSerializer);
            this.reflectStyles();
            return true;

        } else {
            // Assume its been already deserialized but not yet loaded into the diagram view (e.g. from a file input or other source)
            await this.diagram.read(source, jsonSerializer);
            this.reflectStyles();
            return true;
        }
    }

    /**
     * Saves the current diagram using the underlying {@link DiagramEditView}.
     * @param options Optional serialization settings.
     * @returns The serialized diagram string, or undefined when saving was canceled.
     */
    public async saveDiagram(options?: DiagramSaveOptions): Promise<string | undefined> {
        if (!this.diagram.isModified()) {
            const proceed = this.config.prompts?.onNoChangesSave
                ? await this.config.prompts.onNoChangesSave()
                : await this.promptNoChangesSave();
            if (!proceed) {
                return undefined;
            }
        }
        return this.diagram.save(options);
    }

    /**
     * Closes the current diagram after resolving any unsaved-change prompt.
     * @returns True when the diagram was closed; otherwise false.
     */
    public async close(): Promise<boolean> {
        if (!(await this.confirmUnsavedIfNeeded('close'))) {
            return false;
        }

        this.diagram.clear();
        this.reflectStyles();
        return true;
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
        host.appendChild(this.stageHost);

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

        // Create the local diagram edit view and load the provided diagram if any
        const id = diagram?.id || `diagram-${Date.now()}`;
        this.diagram = new DiagramEditView(id, canvasHost);
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

        // Initialize font toolbar
        this.fontToolbar = this.createToolbar(this.toolbarsHost, 'diagram-editor-font-toolbar');

        this.fontSelectHost = this.createControlHost(this.fontToolbar, 'diagram-editor-font-face-select', 'Font');
        this.fontSizeSelectHost = this.createControlHost(this.fontToolbar, 'diagram-editor-font-size-select');
        this.textColorSelectHost = this.createControlHost(this.fontToolbar, 'diagram-editor-text-color-select');

        this.fontSelect = new FontSelect(this.fontSelectHost, config.fontSelect || {});
        this.fontSizeSelect = new SizeSelect(this.fontSizeSelectHost, config.fontSizeSelect || {});
        this.textColorSelect = new ColorSelect(this.textColorSelectHost, config.textColor || {});

        // Initialize stroke toolbar
        this.strokeToolbar = this.createToolbar(this.toolbarsHost, 'diagram-editor-stroke-toolbar');

        this.strokeColorSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-stroke-color-select', 'Line');
        this.strokeWidthSelectHost = this.createControlHost(this.strokeToolbar, 'diagram-editor-stroke-width-select');

        this.strokeColorSelect = new ColorSelect(this.strokeColorSelectHost, config.strokeColor || {});
        this.strokeWidthSelect = new WidthSelect(this.strokeWidthSelectHost, config.strokeWidth || {});

        // Initialize fill toolbar
        this.fillToolbar = this.createToolbar(this.toolbarsHost, 'diagram-editor-fill-toolbar');

        this.fillStyleSelectHost = this.createControlHost(this.fillToolbar, 'diagram-editor-fill-color-select', 'Fill');
        this.fillStyleSelect = new ColorSelect(this.fillStyleSelectHost, config.fillColor || {});

        this.attachListeners();
        this.reflectStyles();
    }

    /**
     * Connects editor controls to the underlying diagram view and change events.
     */
    protected attachListeners(): void {
        if (this.fontSelectHost) {
            this.addManagedListener<string>(this.fontSelectHost, 'fontchange', (font) => {
                if (this.syncingControls) return;
                if (font) {
                    this.diagram.setFontFace(font);
                }
            });
        }

        if (this.fontSizeSelectHost) {
            this.addManagedListener<number>(this.fontSizeSelectHost, 'sizechange', (size) => {
                if (this.syncingControls) return;
                if (Number.isFinite(size) && size > 0) {
                    this.diagram.setFontSize(size);
                }
            });
        }

        if (this.textColorSelectHost) {
            this.addManagedListener<string>(this.textColorSelectHost, 'colorchange', (color) => {
                if (this.syncingControls) return;
                if (color) {
                    this.diagram.setTextColor(color);
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

        if (this.fillStyleSelectHost) {
            this.addManagedListener<string>(this.fillStyleSelectHost, 'colorchange', (color) => {
                if (this.syncingControls) return;
                if (color) {
                    this.diagram.setFillColor(color);
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
                this.fontSelect.value = this.diagram.fontFace;
            }

            if (this.fontSizeSelect && this.fontSizeSelectHost) {
                this.fontSizeSelect.value = this.diagram.fontSize;
            }

            if (this.textColorSelect) {
                const color = this.diagram.textColor;
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

            if (this.fillStyleSelect) {
                const color = this.diagram.fillColor;
                this.fillStyleSelect.clearOptions();
                this.fillStyleSelect.addOptions([color, ...frequent]);
                this.fillStyleSelect.value = color;
            }
        } finally {
            this.syncingControls = false;
        }
    }

    private createToolbar(parent: HTMLElement, className?: string): HTMLElement {
        const bar = document.createElement('div');
        className ? setClasses(bar, 'toolbar', className) : setClasses(bar, 'toolbar');
        parent.appendChild(bar);

        return bar;
    }

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

    private addManagedListener<T>(element: HTMLElement, eventName: string, handler: (detail: T) => void): void {
        const wrapped = (event: Event) => {
            handler((event as CustomEvent<T>).detail);
        };

        element.addEventListener(eventName, wrapped as EventListener);
        this.listenerDisposers.push(() => {
            element.removeEventListener(eventName, wrapped as EventListener);
        });
    }

    private addManagedEventListener(element: HTMLElement, eventName: string, handler: () => void): void {
        const wrapped = () => {
            handler();
        };

        element.addEventListener(eventName, wrapped as EventListener);
        this.listenerDisposers.push(() => {
            element.removeEventListener(eventName, wrapped as EventListener);
        });
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

    private async confirmUnsavedIfNeeded(reason: DiagramEditorPromptReason): Promise<boolean> {
        if (!this.diagram.isModified()) {
            return true;
        }

        const action = this.config.prompts?.onUnsavedChanges
            ? await this.config.prompts.onUnsavedChanges({ reason })
            : await this.promptUnsavedChanges(reason);

        if (action === 'cancel') {
            return false;
        }

        if (action === 'save') {
            const saved = await this.saveDiagram();
            return typeof saved === 'string' && saved.length > 0;
        }

        return true;
    }
}