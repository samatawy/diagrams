import { Diagram } from "../model/diagram";
import type { IConnection, IConnectionAnchor, IContainer, IGrid, IGroup, ILayer, INode } from "../interfaces";
import { DiagramView, type RenderMode, type RenderScope } from "../view/diagram.view";
import { NodeHandle, type IPoint, type IRect, type ITextAlign, type ITextBaseline, type ArrowDirection, type ImageMode, type ImageAlign, type ITextOrientation, type IFontWeight } from "../types";
import { HistoryStack } from "./history";
import { NORMAL_FONT_WEIGHT, type ShadowStyle, type TextStyle } from "../style.interfaces";

import { isConnection, isContainer, isNode } from "../guards";

import { NodeBasics } from "../nodes/node.basics";
import { ConnectionBasics } from "../nodes/connection.basics";
import { SelectionBasics } from "../nodes/selection.basics";
import { downloadBlob, exportTextBlob, jsonSerializer, writeBlobToFileHandle, writeTextToFileHandle } from "../io";
import type {
    DiagramExportOptions,
    DiagramExportResult,
    DiagramFileDialogs,
    DiagramOpenOptions,
    DiagramOpenSource,
    DiagramSaveOptions,
    DiagramSaveResult,
} from "../io";

import { NodeRegistry } from "../factory/node.registry";
import { ZOrder } from "../layout/z.order";
import { Guides, type SnapGuideResult } from "../layout";
import { ColorPalette } from "./color.palette";
import {
    DIAGRAM_CHANGED_EVENT,
    type DiagramChanged,
    type DiagramDeleteRequest,
    type DiagramClipboardOperation,
    type DiagramEditContextMenu,
} from "../events/diagram.events";
import type { ISerializedNode } from "../io";

interface DiagramClipboardEnvelope {
    nodes: ISerializedNode[];
    image_assets?: Record<string, string>;
}
import { humanize, isInvisible, isLocked, lineWidth, nodeAngle, nodeOpacity, nodeText, strokeStyle, textAlign, textBaseline, textOrientation } from "../value.utils";
import { DiagramConstants } from "../model/diagram.constants";
import { DiagramEditViewKeyboard } from "./edit.keyboard";
import { GroupBasics } from "../nodes/group.basics";
import { RenderBasics } from "../nodes";


export { DIAGRAM_EDIT_CONTEXT_MENU_EVENT } from "../events/diagram.events";

export type DiagramEditViewUnsavedAction = 'save' | 'discard' | 'cancel';

export type DiagramEditViewPromptReason = 'new' | 'open' | 'load';

export type DiagramEditViewPrompts = {
    onUnsavedChanges?: (context: { reason: DiagramEditViewPromptReason }) => DiagramEditViewUnsavedAction | Promise<DiagramEditViewUnsavedAction>;
    onNoChangesSave?: () => boolean | Promise<boolean>;
};

/**
 * A class representing a diagram in edit mode.
 * It provides tools for selection of nodes as well as mutation of the diagram's structure by user actions.
 */
export class DiagramEditView extends DiagramView {

    protected history: HistoryStack;

    private zOrder: ZOrder;

    private color_palette: ColorPalette;

    // private zOrderHost: ZOrderHost = {
    //     layers: this.layers,
    //     selection: () => this.selection(),
    //     layer: (id: string) => this.layer(id),
    //     addUndo: () => this.addUndo(),
    //     render: (what?: 'nodes' | 'selection' | 'all') => this.render(what ?? 'all'),
    //     renderPreview: (layer?: ILayer) => this.renderPreview(layer),
    // };

    private editKeyboard: DiagramEditViewKeyboard;

    protected current: {
        layer?: ILayer,
        tool?: string,
        toolOptions?: { url?: string },
        draft?: INode,
        zoom_factor: number
    } = {
            layer: undefined,
            toolOptions: undefined,
            draft: undefined,
            tool: 'select',
            zoom_factor: 1
        }

    protected settings: {
        opacity: number;
        lineWidth: number;
        arrow: ArrowDirection;
        strokeColor: string;
        fillColor: string;
        shadowColor: string;
        shadowBlur: number;
        shadowOffsetX: number;
        shadowOffsetY: number;
        fontFace: string;
        fontSize: number;
        textColor: string;
        textWeight: IFontWeight;
        textItalic: boolean;
        textHalo: string;
        textAlign: ITextAlign;
        textBaseline: ITextBaseline;
        textOrientation?: ITextOrientation;
        nodeText?: string;
        imageMode?: ImageMode;
        imageAlign?: ImageAlign;
        imagePadding?: number;
    } = {
            opacity: 100,
            lineWidth: DiagramConstants.DEFAULT_NODE_LINE_WIDTH,
            arrow: 'end',
            strokeColor: DiagramConstants.DEFAULT_STROKE_STYLE,
            fillColor: DiagramConstants.DEFAULT_FILL_STYLE,
            shadowColor: DiagramConstants.NO_SHADOW.color ?? 'transparent',
            shadowBlur: DiagramConstants.NO_SHADOW.blur,
            shadowOffsetX: DiagramConstants.NO_SHADOW.offset.x,
            shadowOffsetY: DiagramConstants.NO_SHADOW.offset.y,
            fontFace: DiagramConstants.DEFAULT_NODE_FONT_FACE,
            fontSize: DiagramConstants.DEFAULT_NODE_FONT_SIZE,
            textColor: DiagramConstants.DEFAULT_NODE_TEXT_COLOR,
            textAlign: DiagramConstants.DEFAULT_NODE_TEXT_ALIGN,
            textBaseline: DiagramConstants.DEFAULT_NODE_TEXT_BASELINE,
            textWeight: NORMAL_FONT_WEIGHT,
            textItalic: false,
            textHalo: 'transparent',
            nodeText: undefined,
            imageMode: 'none',
            imageAlign: 'center',
            imagePadding: 0,
        };

    protected palette_mode: 'stroke' | 'fill' = 'stroke';

    protected modified: boolean = false;

    protected can_paste: boolean = false;

    protected can_paste_styles: boolean = false;

    private clipboardSnapshot: string = '';

    private movedNodes = new Set<INode>();

    private resizedNodes = new Set<INode>();

    private pointChangedNodes = new Set<INode>();

    private alteredNodes = new Set<INode>();

    private pendingGuideSnap?: SnapGuideResult;

    private interactionHint?: string;

    private connectionBeforeEdit?: { node: INode & IConnection; from?: string; to?: string };

    protected activeTextEditor?: {
        element: HTMLTextAreaElement;
        nodeId: string;
        originalText: string;
        singleLine: boolean;
    };

    private dragCreateDraft?: INode;

    private dragDraftConnector?: INode;

    protected readonly handleWindowPointerUp = (event: PointerEvent) => this.windowPointerUp(event);

    protected readonly handleWindowPointerCancel = (_event: PointerEvent) => this.cancelDragCreateDraft();

    public fileDialogs?: DiagramFileDialogs;

    public prompts?: DiagramEditViewPrompts;

    /**
     * Creates an instance of DiagramEditView.
     * @param id The unique identifier for the diagram.
     * @param target The HTML element or canvas where the diagram will be rendered.
     * @param initial Optional initial properties for the diagram.
     */
    constructor(id: string, target: HTMLElement | HTMLCanvasElement, initial?: Partial<Omit<Diagram, 'id'>>) {
        super(id, target, initial, {
            selection: {
                enable_select: true,
                enable_multi: true,
                enable_rect: true,
                rect_mode: 'touch',
            },
        });
        this.history = new HistoryStack(this);
        this.zOrder = new ZOrder(this);
        this.color_palette = new ColorPalette(this);
        this.editKeyboard = new DiagramEditViewKeyboard();

        window.addEventListener('pointerup', this.handleWindowPointerUp, true);
        window.addEventListener('pointercancel', this.handleWindowPointerCancel, true);
    }

    /**
     * Cleans up resources used by the diagram, such as event listeners and active text editors.
     */
    public override destroy(): void {
        window.removeEventListener('pointerup', this.handleWindowPointerUp, true);
        window.removeEventListener('pointercancel', this.handleWindowPointerCancel, true);
        this.clear();
        super.destroy();
    }

    public override clear(): void {
        this.setInteractionHint(undefined);
        this.closeTextEditor(true);
        this.clearDragCreateDraft();
        this.guides = [];
        this.pendingGuideSnap = undefined;

        super.clear();
        this.history.clear();
        this.color_palette.refresh();
        this.modified = false;

        this.ensureCurrentLayer();

        this.render('all');
        this.renderPreview();
        this.emitDiagramModelChanged('clear');
    }

    // ===================================================
    // ========== File methods ==========
    // ===================================================

    public get canOpenDiagram(): boolean {
        return !!this.fileDialogs;
    }

    /**
     * Clears the current diagram after resolving any unsaved-change prompt.
     * A prompt will be shown if the diagram has unsaved changes.
     * @returns True when a new empty diagram was created; otherwise false.
     */
    public async newDiagram(): Promise<boolean> {
        if (!(await this.confirmReplaceIfNeeded('new'))) {
            return false;
        }

        this.clear();
        this.id = `diagram-${Date.now()}`;
        return true;
    }

    /**
     * Loads a diagram from a live diagram instance, a serialized JSON string, or a deserialized payload.
     * A prompt will be shown if the diagram has unsaved changes.
     * @param source The diagram source to load.
     * @returns True when the source was loaded; otherwise false when loading was canceled.
     */
    public async loadDiagram(source: DiagramOpenSource): Promise<boolean> {
        if (!(await this.confirmReplaceIfNeeded('load'))) {
            return false;
        }

        await this.applyDiagramSource(source);
        return true;
    }

    /**
     * Opens a diagram using configured file dialog behavior after resolving unsaved-change prompts.
     * @param options Optional open options or source overrides.
     * @returns True when a diagram was opened; otherwise false.
     */
    public async openDiagram(options?: DiagramOpenOptions): Promise<boolean> {
        if (options?.source) {
            return await this.loadDiagram(options.source);
        }

        if (!(await this.confirmReplaceIfNeeded('open'))) {
            return false;
        }

        const resolved = options?.source
            ? { source: options.source }
            : await this.fileDialogs?.openDiagram(options);
        if (!resolved) {
            return false;
        }

        await this.applyDiagramSource(resolved.source);
        return true;
    }

    public async saveDiagram(options: DiagramSaveOptions = {}): Promise<string | undefined> {
        if (!(await this.confirmSaveWithoutChangesIfNeeded())) {
            return undefined;
        }

        const resolvedOptions: DiagramSaveOptions = {
            ...options,
            fileName: options.fileName ?? `${this.id}.json`,
        };

        const resolved: DiagramSaveResult | undefined = this.fileDialogs
            ? await this.fileDialogs.saveDiagram(resolvedOptions)
            : { ...resolvedOptions };
        if (!resolved) {
            return undefined;
        }

        const content = this.export('json', resolved.pretty ?? true, resolved.serializer ?? jsonSerializer) as string;
        if (resolved.handle) {
            return await writeTextToFileHandle(resolved.handle, content, resolved.mimeType ?? 'application/json');
        }

        return this.save(resolved);
    }

    public async saveImageDiagram(options: { fileName?: string; mimeType?: string; quality?: number; padding?: number } = {}): Promise<string | undefined> {
        const mimeType = options.mimeType ?? 'image/png';
        const fileName = options.fileName ?? (() => {
            switch (mimeType) {
                case 'image/jpeg': return `${this.id}.jpg`;
                case 'image/webp': return `${this.id}.webp`;
                case 'image/avif': return `${this.id}.avif`;
                case 'image/png':
                default:
                    return `${this.id}.png`;
            }
        })();

        const resolved: DiagramSaveResult | undefined = this.fileDialogs
            ? await this.fileDialogs.saveDiagram({ fileName, mimeType })
            : { fileName, mimeType };
        if (!resolved) {
            return undefined;
        }

        const blob = await this.exportImage({
            mimeType: mimeType as any,
            quality: options.quality,
            padding: options.padding,
        });

        if (resolved.handle) {
            return await writeBlobToFileHandle(resolved.handle, blob);
        }

        return this.saveImage({
            fileName: resolved.fileName,
            mimeType: mimeType as any,
            quality: options.quality,
            padding: options.padding,
        });
    }

    // public async exportDiagram(options: DiagramExportOptions = {}): Promise<string | Uint8Array | Blob | undefined> {
    //     const resolved: DiagramExportResult | undefined = this.fileDialogs
    //         ? await this.fileDialogs.exportDiagram(options)
    //         : { ...options };
    //     if (!resolved) {
    //         return undefined;
    //     }

    //     const format = resolved.format ?? 'json';
    //     const mimeType = resolved.mimeType ?? 'application/json';
    //     const payload = this.export(format, resolved.pretty ?? true, resolved.serializer ?? jsonSerializer);

    //     if (resolved.handle) {
    //         if (typeof payload === 'string') {
    //             return await writeTextToFileHandle(resolved.handle, payload, mimeType);
    //         }

    //         if (payload instanceof Blob) {
    //             return await writeBlobToFileHandle(resolved.handle, payload);
    //         }

    //         const bytes = new Uint8Array(payload.byteLength);
    //         bytes.set(payload);
    //         const blob = new Blob([bytes], { type: mimeType });
    //         return await writeBlobToFileHandle(resolved.handle, blob);
    //     }

    //     if (format === 'json') {
    //         return this.save({
    //             fileName: resolved.fileName,
    //             mimeType: mimeType,
    //             pretty: resolved.pretty,
    //             serializer: resolved.serializer,
    //         });
    //     }

    //     if (payload instanceof Blob) {
    //         return downloadBlob(payload, resolved.fileName ?? 'diagram.bin');
    //     }

    //     if (typeof payload === 'string') {
    //         const blob = exportTextBlob(payload, mimeType);
    //         return downloadBlob(blob, resolved.fileName ?? 'diagram.json');
    //     }

    //     const bytes = new Uint8Array(payload.byteLength);
    //     bytes.set(payload);
    //     return downloadBlob(new Blob([bytes], { type: mimeType }), resolved.fileName ?? 'diagram.bin');
    // }

    private async applyDiagramSource(source: DiagramOpenSource): Promise<void> {
        this.clear();
        if (source instanceof Diagram) {
            await this.read(source.write(jsonSerializer), jsonSerializer);
        } else if (typeof source === 'string') {
            await this.read(source, jsonSerializer);
        } else {
            await this.read(source, jsonSerializer);
        }

        this.modified = false;
        this.history.clear();
        this.ensureCurrentLayer();
        this.fitToNodes();
        this.render('all');
        this.renderPreview();
        this.emitDiagramModelChanged('load');
    }

    private emitDiagramModelChanged(sourceEvent: string): void {
        const host = (this as any).host as HTMLElement | undefined;
        host?.dispatchEvent(new CustomEvent<DiagramChanged>(DIAGRAM_CHANGED_EVENT, {
            detail: { scope: 'model', sourceEvent },
            bubbles: true,
        }));
    }

    private async confirmReplaceIfNeeded(reason: DiagramEditViewPromptReason): Promise<boolean> {
        if (!this.modified) {
            return true;
        }

        const action = this.prompts?.onUnsavedChanges
            ? await this.prompts.onUnsavedChanges({ reason })
            : undefined;

        if (!action || action === 'discard') {
            return true;
        }

        if (action === 'cancel') {
            return false;
        }

        const saved = await this.saveDiagram();
        return typeof saved === 'string' && saved.length > 0;
    }

    private async confirmSaveWithoutChangesIfNeeded(): Promise<boolean> {
        if (this.modified) {
            return true;
        }

        if (!this.prompts?.onNoChangesSave) {
            return true;
        }

        return await this.prompts.onNoChangesSave();
    }

    // ==================================================
    // ========== Getters and Setters ==========
    // ==================================================

    /**
     * Gets the active render mode for this view.
     * - 'view': optimized for static viewing of diagrams, with limited interactivity and simplified rendering.
     * - 'editing': optimized for user interaction and mutation of the diagram.
     */
    public get render_mode(): RenderMode {
        return 'editing';
    }

    /**
     * Gets the opacity of the first selected node, or the current default if nothing is selected.
     * Returns a value in the range [0, 100].
     */
    public get opacity(): number {
        const sel = this.selection();
        if (sel.length) {
            return nodeOpacity(sel[0] as any);
        }
        return this.settings.opacity;
    }

    /**
     * Sets the default opacity and applies it to the current selection.
     * @param value Opacity value in the range [0, 1].
     */
    public set opacity(value: number) {
        this.setOpacity(value);
    }

    /**
     * Gets the current default line width for borders and connections.
     */
    public get lineWidth(): number {
        return this.settings.lineWidth;
    }

    /**
     * Sets the default line width and applies it to current selection.
     * @param value Line width value.
     */
    public set lineWidth(value: number) {
        this.setLineWidth(value);
    }

    /**
     * Gets the current arrow direction derived from the settings flags.
     */
    public get arrow(): ArrowDirection {
        return this.settings.arrow || 'end';
    }

    /**
     * Sets the default arrow direction and applies it to current selection.
     * @param value Arrow direction value.
     */
    public set arrow(value: ArrowDirection) {
        this.setArrow(value);
    }

    /**
     * Gets the current default stroke color.
     */
    public get strokeColor(): string {
        return this.settings.strokeColor;
    }

    /**
     * Sets the default stroke color and applies it to current selection.
     * @param value Stroke color value.
     */
    public set strokeColor(value: string) {
        this.setStrokeColor(value);
    }

    /**
     * Gets the current fill color.
     */
    public get fillColor(): string {
        return this.settings.fillColor;
    }

    /**
     * Sets the default fill color and applies it to current selection.
     * @param value Fill color value.
     */
    public set fillColor(value: string) {
        this.setFillColor(value);
    }

    /**
     * Gets the current default shadow style.
     */
    public get shadowStyle(): ShadowStyle {
        return {
            name: 'Custom',
            color: this.settings.shadowColor,
            blur: this.settings.shadowBlur,
            offset: { x: this.settings.shadowOffsetX, y: this.settings.shadowOffsetY },
        };
    }

    /**
     * Sets the default shadow style and applies it to current selection.
     * @param value Shadow style value.
     */
    public set shadowStyle(value: ShadowStyle) {
        this.setShadowStyle(value);
    }

    /**
     * Gets the current default text style as a composed object.
     */
    public get textStyle(): TextStyle {
        return {
            color: this.settings.textColor,
            fontFace: this.settings.fontFace,
            size: this.settings.fontSize,
            align: this.settings.textAlign,
            baseline: this.settings.textBaseline,
            orientation: this.settings.textOrientation,
            weight: this.settings.textWeight,
            italic: this.settings.textItalic,
            halo: this.settings.textHalo || undefined,
        };
    }

    /**
     * Sets the default text style and applies it to current selection.
     * @param value Text style value.
     */
    public set textStyle(value: TextStyle) {
        this.setTextStyle(value);
    }

    /**
     * Gets the default node text for newly created text-capable nodes.
     */
    public get nodeText(): string | undefined {
        return this.settings.nodeText;
    }

    /**
     * Sets the default node text for newly created text-capable nodes.
     * @param value Text value.
     */
    public set nodeText(value: string | undefined) {
        this.setNodeText(value || '');
    }

    /**
     * Gets the currently active tool identifier.
     */
    public get currentTool(): string {
        return this.current.tool || 'select';
    }

    /**
     * Gets whether the diagram has put nodes in the clipboard.
     */
    public get canPaste(): boolean {
        return this.can_paste;
    }

    /**
     * Gets whether the diagram has styles in the clipboard that can be pasted onto selected nodes.
     */
    public get canPasteStyles(): boolean {
        return this.can_paste_styles;
    }

    /**
     * Sets the current tool for the diagram. 
     * The default tool is 'select', which allows for selection and manipulation of existing nodes.
     * @param tool The name of the tool to set.
     * @param options Optional parameters for the tool.
     * @returns A promise that resolves when the tool is set.
     */
    public async setTool(tool: string, options?: any): Promise<void> {
        const previousTool = this.current.tool || 'select';
        const nextTool = tool || 'select';

        this.current.tool = nextTool;
        this.current.toolOptions = options;
        this.current.draft = undefined;

        if (nextTool === 'select') {
            this.clearDragCreateDraft();
        }

        if (previousTool !== nextTool) {
            this.eventDispatcher.toolChanged({
                tool: nextTool,
                previousTool,
            });
        }

        if (this.current.tool == 'select') return;
    }

    /**
     * Creates a draft node for the current tool, if applicable. This is used for tools that create new nodes.
     * @param draft Partial node data to initialize the draft.
     */
    public createDragDraft(draft: Partial<INode>): void {
        if (!draft || !draft.type || draft.type === 'select' || !NodeRegistry.adapter(draft.type)) {
            return;
        }

        void this.setTool(draft.type, this.current.toolOptions);
        const center = this.coordinates.getPoint(this.canvas.width / 2, this.canvas.height / 2, this.grid);
        const node = this.createDraftFromCurrent(draft.type, this.current.toolOptions, center);

        // Let adapters define drag-draft geometry and optional draft properties.
        const { owner: _owner, id: _id, ready: _ready, points, ...rest } = draft;
        Object.assign(node, rest);
        if (Array.isArray(points) && points.length > 0) {
            node.points = points.map((pt) => ({ x: pt.x, y: pt.y }));
        }

        this.centerNodeAt(node, center);
        node.ready = false;
        this.dragCreateDraft = node;
        this.render('all');

        // Prepare for potential autoconnecting
        this.createDragDraftConnector(node);
    }

    private createDragDraftConnector(draft: Partial<INode>): void {
        if (!draft || !draft.type || draft.type === 'select' || !NodeRegistry.adapter(draft.type)) {
            return;
        }

        this.dragDraftConnector = {
            owner: this,
            id: 'drag-draft-connector',
            type: 'polyline',
            points: [],
            strokeStyle: this.settings.strokeColor,
            lineWidth: this.settings.lineWidth,
            arrow: this.settings.arrow,
            hollow: true,
            invisible: true,
            ready: false,
            to: { node: draft },
        } as any as INode & IConnection;
    }

    /**
     * Sets the stroke color for the selected nodes and new nodes to be created.
     * @param color The stroke color to set.
     */
    public setStrokeColor(color: string): void {
        if (this.selection().length) {
            this.addUndo();
        }

        this.settings.strokeColor = color;

        for (let node of this.selection()) {
            node.strokeStyle = color;
        }
        this.color_palette.refresh();

        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-stroke-color');
    }

    /**
     * Sets the fill color for the selected nodes and new nodes to be created.
     * @param color The fill color to set.
     */
    public setFillColor(color: string): void {
        if (this.selection().length) {
            this.addUndo();
        }

        this.settings.fillColor = color;

        for (let node of this.selection()) {
            node.fillStyle = color;
            if (NodeRegistry.adapter(node.type)?.hollow_mode == 'if_transparent') {
                node.hollow = color == 'transparent';
            }
        }
        this.color_palette.refresh();

        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-fill-color');
    }

    /**
     * Gets the image asset id shared by the current selection.
     * Returns the common id when all selected nodes agree, or an empty string
     * when the selection is empty, no node has an image, or nodes have different ids.
     */
    public get imageId(): string {
        const nodes = this.selection().filter(n => isNode(n));
        if (!nodes.length) return '';
        const first = nodes[0]?.image_id ?? '';
        return nodes.every(n => (n.image_id ?? '') === first) ? first : '';
    }

    /** Returns the shared image_mode of the selection, or '' when mixed. */
    public get imageMode(): string {
        const nodes = this.selection().filter(n => isNode(n));
        if (!nodes.length) return '';
        const first = nodes[0]?.image_mode ?? 'contain';
        return nodes.every(n => (n.image_mode ?? 'contain') === first) ? first : '';
    }

    /** Returns the shared image_align of the selection, or '' when mixed. */
    public get imageAlign(): string {
        const nodes = this.selection().filter(n => isNode(n));
        if (!nodes.length) return '';
        const first = nodes[0]?.image_align ?? 'center';
        return nodes.every(n => (n.image_align ?? 'center') === first) ? first : '';
    }

    /** Returns the shared image_padding of the selection, or -1 when mixed. */
    public get imagePadding(): number {
        const nodes = this.selection().filter(n => isNode(n));
        if (!nodes.length) return 0;
        const first = nodes[0]?.image_padding ?? 0;
        return nodes.every(n => (n.image_padding ?? 0) === first) ? first : -1;
    }

    public setBackground(color: string): void {
        this.addUndo();
        this.background = color;
        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-background');
    }

    /**
     * Sets or clears the image asset id on all selected nodes.
     * @param id Asset id to apply, or undefined / empty string to clear the image.
     */
    public setImageId(id: string | undefined): void {
        const nodes = this.selection().filter(n => isNode(n));
        if (!nodes.length) return;

        this.addUndo();
        const value = id || undefined;
        for (const node of nodes) {
            node.image_id = value;
        }

        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-image-id');
    }

    /**
     * Sets the opacity for the selected nodes and the default for new nodes.
     * @param value Opacity in the range [0, 100].
     */
    public setOpacity(value: number): void {
        const clamped = Math.min(100, Math.max(0, value));
        if (this.selection().length) {
            this.addUndo();
        }
        this.settings.opacity = clamped;
        for (const node of this.selection()) {
            node.opacity = clamped;
        }
        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-opacity');
    }

    /**
     * Sets the line width for the selected nodes and new nodes to be created.
     * @param width The line width to set.
     */
    public setLineWidth(width: number): void {
        if (this.selection().length) {
            this.addUndo();
        }

        this.settings.lineWidth = width;

        for (let node of this.selection()) {
            node.lineWidth = width;
        }
        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-line-width');
    }

    /**
     * Sets the arrow direction for the selected nodes and new nodes to be created.
     * @param arrow The arrow direction to set.
     */
    public setArrow(arrow: ArrowDirection): void {
        if (this.selection().length) {
            this.addUndo();
        }

        this.settings.arrow = arrow;

        for (let node of this.selection()) {
            node.arrow = arrow;
        }
        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-arrow');
    }

    /**
     * Sets the shadow style for the selected nodes and new nodes to be created.
     * @param style The shadow style to set.
     */
    public setShadowStyle(style: Partial<ShadowStyle>): void {
        if (this.selection().length) {
            this.addUndo();
        }

        if (style.color !== undefined) this.settings.shadowColor = style.color;
        if (style.blur !== undefined) this.settings.shadowBlur = style.blur;
        if (style.offset !== undefined) {
            this.settings.shadowOffsetX = style.offset.x;
            this.settings.shadowOffsetY = style.offset.y;
        }

        const merged: ShadowStyle = {
            name: style.name ?? 'Custom',
            color: this.settings.shadowColor,
            blur: this.settings.shadowBlur,
            offset: { x: this.settings.shadowOffsetX, y: this.settings.shadowOffsetY },
        };

        for (let node of this.selection()) {
            node.shadowStyle = merged;
        }
        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-shadow-style');
    }

    /**
     * Sets the text style for the selected nodes and new nodes to be created.
     * @param style The text style to set.
     */
    public setTextStyle(style: Partial<TextStyle>): void {
        if (this.selection().length) {
            this.addUndo();
        }

        // 'inherit' resets the node's text color to follow the stroke color (see textColor() in value.utils).
        // It is a per-node signal and intentionally does not update the editor default (settings.textColor).
        const colorIsInherit = style.color === 'inherit';
        if (style.color !== undefined && !colorIsInherit) this.settings.textColor = style.color;
        if (style.fontFace !== undefined) this.settings.fontFace = style.fontFace;
        if (style.size !== undefined) this.settings.fontSize = style.size;
        if (style.weight !== undefined) this.settings.textWeight = style.weight;
        if (style.italic !== undefined) this.settings.textItalic = style.italic;
        if (style.align !== undefined) this.settings.textAlign = style.align;
        if (style.baseline !== undefined) this.settings.textBaseline = style.baseline;
        if (style.halo !== undefined) this.settings.textHalo = style.halo;

        for (let node of this.selection()) {
            const styleToApply = { ...style, color: colorIsInherit ? undefined : style.color };
            if (styleToApply.orientation !== undefined) {
                const allowed = NodeRegistry.adapter(node.type)?.text_orientations;
                if (allowed && !allowed.includes(styleToApply.orientation)) {
                    delete styleToApply.orientation;
                }
            }
            node.textStyle = { ...node.textStyle, ...styleToApply };
        }
        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged('set-text-style');
    }

    /**
     * Sets the text for the selected nodes and new nodes to be created.
     * @param text The text to set.
     */
    public setNodeText(text: string): void {
        this.settings.nodeText = text;

        this.applyText(this.settings.nodeText);
        this.eventDispatcher.styleChanged('set-node-text');
    }

    /**
     * Applies a flat patch record to all currently selected nodes, adding an undo step.
     * Intended for use by inspector-style editors that produce a key-value diff.
     * Also mirrors patch values into diagram default settings where applicable.
     * @param patch The key-value changes to apply.
     * @param sourceKey The originating property key, used for the styleChanged event.
     */
    public applyNodePatch(patch: Record<string, unknown>, sourceKey: string): void {
        const selected = this.selection();
        if (!selected.length) return;

        this.addUndo();

        for (const node of selected) {
            this.applyPatchToNode(node as unknown as Record<string, unknown>, patch);
        }

        // Mirror into diagram defaults so new nodes inherit changes.
        if (patch['opacity'] !== undefined) this.settings.opacity = Math.min(100, Math.max(0, Number(patch['opacity'])));

        if (patch['text'] !== undefined) this.settings.nodeText = String(patch['text']);
        if (patch['textStyle.fontFace'] !== undefined) this.settings.fontFace = String(patch['textStyle.fontFace']);
        if (patch['textStyle.size'] !== undefined) this.settings.fontSize = Number(patch['textStyle.size']);
        if (patch['textStyle.color'] !== undefined) this.settings.textColor = String(patch['textStyle.color']);
        if (patch['textStyle.align'] !== undefined) this.settings.textAlign = patch['textStyle.align'] as ITextAlign;
        if (patch['textStyle.baseline'] !== undefined) this.settings.textBaseline = patch['textStyle.baseline'] as ITextBaseline;
        if (patch['textStyle.orientation'] !== undefined) this.settings.textOrientation = patch['textStyle.orientation'] as ITextOrientation;
        if (patch['textStyle.weight'] !== undefined) this.settings.textWeight = patch['textStyle.weight'] as IFontWeight;
        if (patch['textStyle.italic'] !== undefined) this.settings.textItalic = Boolean(patch['textStyle.italic']);
        if (patch['textStyle.halo'] !== undefined) this.settings.textHalo = String(patch['textStyle.halo']);

        if (patch['strokeStyle'] !== undefined) this.settings.strokeColor = String(patch['strokeStyle']);
        if (patch['lineWidth'] !== undefined) this.settings.lineWidth = Number(patch['lineWidth']);
        if (patch['arrow'] !== undefined) this.settings.arrow = patch['arrow'] as ArrowDirection;
        // if (patch['labelOrientation'] !== undefined) this.settings.labelOrientation = patch['labelOrientation'] as IConnectionLabelOrientation;

        if (patch['fillStyle'] !== undefined) this.settings.fillColor = String(patch['fillStyle']);
        if (patch['shadowStyle.color'] !== undefined) this.settings.shadowColor = String(patch['shadowStyle.color']);
        if (patch['shadowStyle.blur'] !== undefined) this.settings.shadowBlur = Number(patch['shadowStyle.blur']);
        if (patch['shadowStyle.offset.x'] !== undefined) this.settings.shadowOffsetX = Number(patch['shadowStyle.offset.x']);
        if (patch['shadowStyle.offset.y'] !== undefined) this.settings.shadowOffsetY = Number(patch['shadowStyle.offset.y']);

        this.color_palette.refresh();

        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged(sourceKey as any);
    }

    /**
     * Applies a flat patch record to the diagram itself, adding an undo step.
     * Intended for inspector-style editors that produce diagram.* key-value diffs.
     * @param patch The key-value changes to apply.
     * @param sourceKey The originating property key, used for the styleChanged event.
     */
    public applyDiagramPatch(patch: Record<string, unknown>, sourceKey: string): void {
        if (!Object.keys(patch).length) return;

        this.addUndo();

        for (const [rawPath, value] of Object.entries(patch)) {
            const path = rawPath.startsWith('diagram.') ? rawPath.slice('diagram.'.length) : rawPath;
            const segments = path.split('.').filter(s => s.length > 0);
            if (!segments.length) continue;

            let current: any = this;
            for (let i = 0; i < segments.length - 1; i++) {
                const key = segments[i] as string;
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            current[segments[segments.length - 1] as string] = value;
        }

        this.color_palette.refresh();

        this.render('all');
        this.renderPreview();
        this.eventDispatcher.styleChanged(sourceKey as any);
    }

    /**
     * Applies a flat key-value patch directly onto a node object, traversing dot-separated paths.
     * @param target The node object to mutate.
     * @param patch The key-value pairs to apply.
     */
    private applyPatchToNode(target: Record<string, unknown>, patch: Record<string, unknown>): void {
        for (const [path, value] of Object.entries(patch)) {
            const segments = path.split('.').filter(s => s.length > 0);
            if (!segments.length) continue;

            // Guard: silently skip orientation values not supported by this node's adapter.
            if (path === 'textStyle.orientation') {
                const allowed = NodeRegistry.adapter((target as any).type as string)?.text_orientations;
                if (allowed && !allowed.includes(value as ITextOrientation)) continue;
            }

            if (segments[0] === 'shadowStyle') {
                const cur = (target as any)['shadowStyle'];
                (target as any)['shadowStyle'] = DiagramEditView.normalizeShadowStyle(cur);
            }

            let current: any = target;
            for (let i = 0; i < segments.length - 1; i++) {
                const key = segments[i] as string;
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
            current[segments[segments.length - 1] as string] = value;
        }
    }

    /**
     * Normalizes a raw shadow style value into the canonical shadow object shape.
     */
    private static normalizeShadowStyle(style: any): ShadowStyle {
        const base = DiagramConstants.NO_SHADOW;
        const next = style && typeof style === 'object' ? style : {};
        const offset = next.offset && typeof next.offset === 'object' ? next.offset : {};
        const blur = Number(next.blur);
        const ox = Number(offset.x);
        const oy = Number(offset.y);
        return {
            name: typeof next.name === 'string' && next.name.length > 0 ? next.name : base.name,
            color: typeof next.color === 'string' ? next.color : base.color,
            blur: Number.isFinite(blur) ? blur : base.blur,
            offset: {
                x: Number.isFinite(ox) ? ox : base.offset.x,
                y: Number.isFinite(oy) ? oy : base.offset.y,
            },
        };
    }

    /**
     * List colors used in this diagram in descending order of their usage frequency.
     * @returns Colors as an array of strings.
     */
    public getFrequentColors(): string[] {
        return this.color_palette.frequentColors();
    }

    // ==================================================
    // ======== Undo/Redo methods ==========
    // ==================================================

    /**
     * Indicates whether the diagram contains unsaved modifications.
     */
    public isModified(): boolean {
        return this.modified;
    }

    /**
     * Take a snapshot of the current diagram state and push it onto the undo stack. 
     * This should be called before making any changes to the diagram that should be undoable. 
     * After calling this method, the `canUndo` property will return true, indicating that there is now an action in the undo stack that can be undone.
     */
    protected addUndo(): void {
        this.history?.addUndo();

        this.modified = true;
    }

    /**
     * Returns true if there are actions in the undo stack that can be undone, false otherwise.
     * @returns A boolean indicating whether an undo operation can be performed.
     */
    public get canUndo(): boolean {
        return this.history?.canUndo ?? false;
    }

    /**
     * Returns true if there are actions in the redo stack that can be redone, false otherwise.
     * @returns A boolean indicating whether a redo operation can be performed.
     */
    public get canRedo(): boolean {
        return this.history?.canRedo ?? false;
    }

    /**
     * Undoes the last action performed on the diagram, reverting it to the previous state.
     */
    public async undo(): Promise<void> {
        await this.history?.undo();

        if (!this.current.layer || !this.layer(this.current.layer.id)) {
            this.current.layer = this.layers[0];
        }

        this.render('all');
        this.renderPreview();
    }

    /**
     * Redoes the last undone action on the diagram, restoring it to the state before the undo was performed.
     */
    public async redo(): Promise<void> {
        await this.history?.redo();

        if (!this.current.layer || !this.layer(this.current.layer.id)) {
            this.current.layer = this.layers[0];
        }

        this.render('all');
        this.renderPreview();
    }

    // ===================================================
    // ========== Clipboard methods ==========
    // ===================================================

    public copyStyles(): void {
        const selected = this.selection();
        if (selected.length !== 1) return;

        const style = selected[0]!;
        const serialized = {
            opacity: style.opacity,
            strokeStyle: style.strokeStyle,
            fillStyle: style.fillStyle,
            textStyle: style.textStyle,
            // textColor: style.textColor,
            // lineWidth: style.lineWidth,
            // fontFace: style.fontFace,
            // fontSize: style.fontSize,
            // textAlign: style.textAlign,
            // textBaseline: style.textBaseline,
            shadowStyle: style.shadowStyle,
            image_id: isNode(style) ? style.image_id : undefined,
            image_mode: isNode(style) ? style.image_mode : undefined,
            image_align: isNode(style) ? style.image_align : undefined,
            image_padding: isNode(style) ? style.image_padding : undefined,
        };

        this.can_paste_styles = true;

        void this.writeClipboardText(jsonSerializer.write(serialized));
    }

    public pasteStyles(): void {
        const selected = this.selection();
        if (selected.length === 0) return;

        void this.readClipboardText()
            .then(async (json) => {
                const style = JSON.parse(json);
                if (!style || typeof style !== 'object') return;

                this.addUndo();

                for (const node of selected) {
                    if (style.opacity !== undefined) node.opacity = style.opacity;
                    if (style.strokeStyle) node.strokeStyle = style.strokeStyle;
                    if (style.fillStyle) node.fillStyle = style.fillStyle;
                    if (style.textStyle) node.textStyle = style.textStyle;
                    // if (style.textColor) node.textColor = style.textColor;
                    if (style.lineWidth) node.lineWidth = style.lineWidth;
                    // if (style.fontFace) node.fontFace = style.fontFace;
                    // if (style.fontSize) node.fontSize = style.fontSize;
                    // if (style.textAlign) node.textAlign = style.textAlign;
                    // if (style.textBaseline) node.textBaseline = style.textBaseline;
                    if (style.shadowStyle) node.shadowStyle = style.shadowStyle;
                    if (isNode(node)) {
                        if (style.image_id !== undefined) node.image_id = style.image_id;
                        if (style.image_mode !== undefined) node.image_mode = style.image_mode;
                        if (style.image_align !== undefined) node.image_align = style.image_align;
                        if (style.image_padding !== undefined) node.image_padding = style.image_padding;
                    }
                }

                this.render('all');
                this.renderPreview();
                this.eventDispatcher.styleChanged('paste-styles');
            })
    }

    /**
     * Checks if the clipboard contains styles that can be pasted into selected nodes.
     */
    public clipboardHasStyles(): void {
        void this.readClipboardText()
            .then(async (json) => {
                this.can_paste_styles = false;

                const style = JSON.parse(json);
                if (!style || typeof style !== 'object') return;

                if (style.strokeStyle || style.fillStyle || style.textColor || style.lineWidth
                    || style.fontFace || style.fontSize || style.textAlign || style.textBaseline
                    || style.shadowStyle
                    || style.image_id || style.image_mode || style.image_align || style.image_padding) {
                    this.can_paste_styles = true;
                }
            })
    }

    /**
     * Cuts the selected nodes, copying them to the clipboard and then deleting them from the diagram.
     */
    public cutSelected(): void {
        this.copySelected('cut');
        this.deleteSelected();
    }

    /**
     * Copies the selected nodes to the clipboard in JSON format. 
     * The copied data includes all properties of the nodes, allowing for accurate reconstruction when pasted. 
     * After copying, the `canPaste` flag is set to true, indicating that there is data available in the clipboard that can be pasted into the diagram.
     */
    public copySelected(operation: DiagramClipboardOperation = 'copy'): void {
        const nodes = this.selection();
        if (!nodes.length) {
            return;
        }

        const serialized = nodes.map(node => this.serializeNode(node));

        // Collect only the assets referenced by the copied nodes.
        const allAssets = this.assetStore.snapshot();
        let image_assets: Record<string, string> | undefined;
        if (allAssets) {
            for (const node of serialized) {
                if (node.image_id && allAssets[node.image_id]) {
                    image_assets ??= {};
                    image_assets[node.image_id] = allAssets[node.image_id]!;
                }
            }
        }

        const envelope: DiagramClipboardEnvelope = { nodes: serialized, image_assets };

        this.can_paste = true;
        this.emitClipboardChange(operation, nodes);

        void this.writeClipboardText(jsonSerializer.write(envelope));
    }

    /**
     * Pastes nodes from the clipboard into the diagram.
     */
    public pasteNodes(): void {
        void this.readClipboardText()
            .then(async (json) => {
                const envelope = this.parseClipboardEnvelope(json)
                    || this.parseClipboardEnvelope(this.clipboardSnapshot);

                if (!envelope || !envelope.nodes.length) {
                    return;
                }

                // Merge referenced assets into this diagram's store before hydrating.
                if (envelope.image_assets) {
                    this.assetStore.merge(envelope.image_assets);
                }

                this.addUndo();
                const pastedNodes: INode[] = [];
                const layer = this.ensureCurrentLayer();

                // First pass: assign new IDs so connection anchors within this
                // paste batch can be remapped before any node is inserted.
                const idMap = new Map<string, string>();
                for (const node of envelope.nodes) {
                    const newId = `${node.type}-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    idMap.set(node.id, newId);
                }

                const remapAnchor = (anchor: IConnectionAnchor | undefined): IConnectionAnchor | undefined => {
                    if (!anchor) return undefined;
                    const oldId = typeof anchor.node === 'string' ? anchor.node : anchor.node.id;
                    const newId = idMap.get(oldId);
                    return newId ? { ...anchor, node: newId } : { ...anchor };
                };

                // Second pass: remap group memberships
                // creating new cloned groups if there was a container node in the paste batch.
                const groupMap: Map<string, IGroup> = new Map();
                for (let node of envelope.nodes) {
                    const group_id = (node as IContainer & INode)?.owns_group;
                    if (group_id) {
                        const group = this.group(group_id);
                        if (group) {
                            // create a clone group from selected nodes
                            let cloned_group_id = `group-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                            let new_members = group.nodes.filter(id => idMap.has(id));
                            new_members = new_members.map(id => idMap.get(id)!);
                            const new_group = { id: cloned_group_id, nodes: new_members };
                            groupMap.set(group.id, new_group);

                            this.upsertGroup(new_group);
                        }
                    }
                }

                // Finally, clone the nodes into the diagram.
                for (let node of envelope.nodes) {
                    const clone = this.cloneNode(node, idMap.get(node.id));
                    const conn = clone as INode & IConnection;
                    conn.from = remapAnchor(conn.from);
                    conn.to = remapAnchor(conn.to);
                    if ((node as any).owns_group) (node as any).owns_group = groupMap.get((node as any).owns_group)?.id;
                    this.upsertNode(clone);
                    layer.nodes.push(clone.id);

                    NodeBasics.moveBy(clone, 24, 24, 'ignore_scale');
                    this.select(clone, 'isolated');
                    pastedNodes.push(clone);
                }

                this.can_paste = true;
                this.emitClipboardChange('paste', pastedNodes);

                this.render('all');
                this.renderPreview();
            })
    }

    /**
     * Checks if the clipboard contains nodes that can be pasted into the diagram.
     */
    public clipboardHasNodes(): void {
        void this.readClipboardText()
            .then(async (json) => {
                this.can_paste = false;

                const envelope = this.parseClipboardEnvelope(json)
                    || this.parseClipboardEnvelope(this.clipboardSnapshot);

                if (envelope?.nodes.length) {
                    this.can_paste = true;
                }
            })
    }

    private async writeClipboardText(value: string): Promise<void> {
        this.clipboardSnapshot = value;

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            }
        } catch (e) {
            console.error('Failed to write clipboard text', e);
        }
    }

    private async readClipboardText(): Promise<string> {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
                const value = await navigator.clipboard.readText();
                if (typeof value === 'string' && value.length) {
                    return value;
                }
            }
        } catch (e) {
            console.error('Failed to read clipboard text', e);
        }

        return this.clipboardSnapshot || '';
    }

    private emitClipboardChange(operation: DiagramClipboardOperation, nodes: INode[] = []): void {
        this.eventDispatcher.clipboardChanged({
            operation,
            canPaste: this.can_paste,
            node: nodes[0],
            nodeId: nodes[0]?.id,
            nodes,
            nodeIds: nodes.map(node => node.id),
        });
    }

    private parseClipboardEnvelope(json: string): DiagramClipboardEnvelope | undefined {
        if (!json?.length) return undefined;
        try {
            const payload = JSON.parse(json);
            // New envelope format: { nodes: [...], image_assets?: {...} }
            if (payload && typeof payload === 'object' && !Array.isArray(payload) && Array.isArray(payload.nodes)) {
                return payload as DiagramClipboardEnvelope;
            }
            // Legacy format: bare ISerializedNode[]
            if (Array.isArray(payload)) {
                return { nodes: payload as ISerializedNode[] };
            }
        } catch {
            // ignore
        }
        return undefined;
    }

    // ================================================
    // ========== Layer management methods ==========
    // ================================================

    /**
     * Select a layer to be the target for new nodes and operations.
     * @param layer The layer to set as the current layer.
     */
    public setCurrentLayer(layer: ILayer): void {
        this.current.layer = layer;
    }

    /**
     * Adds a new layer to the diagram at the specified position.
     * @param id The layer ID.
     * @param place The position to add the new layer ('top' or 'bottom').
     */
    public addLayer(id: string, place: 'top' | 'bottom' = 'top'): void {
        this.addUndo();
        this.current.layer = this.createLayerAt(place, id);
        this.render('all');
    }

    /**
     * Moves the selected nodes to a new layer.
     */
    public moveToNewLayer(): void {
        if (this.selection().length > 0) {
            this.addUndo();

            const newLayer = this.createLayerAt('top');
            if (this.current.layer) {
                for (let id of this.current.layer.nodes) {
                    newLayer.nodes.push(id);
                }
                this.current.layer.nodes = this.current.layer.nodes.filter(id => !this.selection().some(s => s.id === id));
            }
            this.current.layer = newLayer;

            // render after initialization..
            setTimeout(() => {
                this.render('all');
                this.renderPreview();
            }, 100);
        }
    }

    /**
     * Selects all nodes within the specified layer.
     * @param layer The layer whose nodes should be selected.
     */
    public selectLayer(layer: ILayer): void {
        this.clearSelection();
        for (let id of layer.nodes) {
            this.select(this.node(id)!, 'isolated');
        }
        this.render('all');
    }

    /**
     * Shows the specified layer, making it visible in the diagram.
     * @param layer The layer to show.
     */
    public showLayer(layer: ILayer): void {
        this.addUndo();

        layer.visible = true;
        this.render('all');
        this.renderPreview(layer);
    }

    /**
     * Hides the specified layer, making it invisible in the diagram. 
     * Hidden layers are not rendered and their nodes cannot be interacted with until they are shown again.
     * @param layer The layer to hide.
     */
    public hideLayer(layer: ILayer): void {
        this.addUndo();

        layer.visible = false;
        this.render('all');
    }

    /**
     * Deletes the specified layer from the diagram.
     * @param layerId The ID of the layer to delete.
     */
    public override deleteLayer(layerId: string): void {
        this.addUndo();

        let all = this.layers;
        let index = all.findIndex(l => l.id === layerId);

        super.deleteLayer(layerId);

        if (layerId == this.current.layer?.id) {
            if (index >= 0) {
                if (all.length == 0) {
                    this.addLayer(this.generateLayerId())
                } else {
                    index = (index == all.length) ? all.length - 1 : index;
                }
                this.current.layer = this.layers[index];
            }
        }
        // Just for sanity..
        if (!this.layers.length) {
            this.addLayer(this.generateLayerId());
        }

        this.render('all');
    }

    // ==================================================
    // ========== Z-order methods ==========
    // ==================================================

    /**
     * Moves selected nodes one step toward the front, confined within their layers.
     */
    public bringSelectionForward(): void {
        this.zOrder.reorderSelection('bringForward');
    }

    /**
     * Moves selected nodes one step toward the back, confined within their layers.
     */
    public sendSelectionBackward(): void {
        this.zOrder.reorderSelection('sendBackward');
    }

    /**
     * Moves selected nodes to the front, confined within their layers.
     */
    public bringSelectionToFront(): void {
        this.zOrder.reorderSelection('bringToFront');
    }

    /**
     * Moves selected nodes to the back, confined within their layers.
     */
    public sendSelectionToBack(): void {
        this.zOrder.reorderSelection('sendToBack');
    }

    /**
     * Moves a node one step toward the front, confined within its layer.
     * @param node The target node or node ID.
     */
    public bringNodeForward(node: string | INode): void {
        this.zOrder.reorderNode(node, 'bringForward');
    }

    /**
     * Moves a node one step toward the back, confined within its layer.
     * @param node The target node or node ID.
     */
    public sendNodeBackward(node: string | INode): void {
        this.zOrder.reorderNode(node, 'sendBackward');
    }

    /**
     * Moves a node to the front, confined within its layer.
     * @param node The target node or node ID.
     */
    public bringNodeToFront(node: string | INode): void {
        this.zOrder.reorderNode(node, 'bringToFront');
    }

    /**
     * Moves a node to the back, confined within its layer.
     * @param node The target node or node ID.
     */
    public sendNodeToBack(node: string | INode): void {
        this.zOrder.reorderNode(node, 'sendToBack');
    }

    /**
     * Moves a layer one step toward the front.
     * @param layer The target layer or layer ID.
     */
    public bringLayerForward(layer: string | ILayer): void {
        this.zOrder.reorderLayer(layer, 'bringForward');
    }

    /**
     * Moves a layer one step toward the back.
     * @param layer The target layer or layer ID.
     */
    public sendLayerBackward(layer: string | ILayer): void {
        this.zOrder.reorderLayer(layer, 'sendBackward');
    }

    /**
     * Moves a layer to the front.
     * @param layer The target layer or layer ID.
     */
    public bringLayerToFront(layer: string | ILayer): void {
        this.zOrder.reorderLayer(layer, 'bringToFront');
    }

    /**
     * Moves a layer to the back.
     * @param layer The target layer or layer ID.
     */
    public sendLayerToBack(layer: string | ILayer): void {
        this.zOrder.reorderLayer(layer, 'sendToBack');
    }

    // ==================================================
    // ========== Node manipulation methods ==========
    // ==================================================

    /**
     * Deletes the currently selected nodes from the diagram.
     */
    public deleteSelected(): void {
        const selected = this.selection();
        if (!selected.length) {
            return;
        }

        const request = {
            node: selected[0],
            nodeId: selected[0]?.id,
            nodes: [...selected],
            nodeIds: selected.map(node => node.id),
        } satisfies DiagramDeleteRequest;

        if (!this.eventDispatcher.deleteRequested(request)) {
            return;
        }

        const affectedConnections = this.nodes
            .filter((node): node is INode & IConnection => isConnection(node) && !selected.some(deleted => deleted.id === node.id))
            .filter(node => selected.some(deleted => this.connectionTargetsNode(node.from, deleted.id) || this.connectionTargetsNode(node.to, deleted.id)));

        this.addUndo();

        this.clearSelection();

        for (const node of selected) {
            this.getCache().deleteNode(node);
            this.deleteNode(node.id);
            this.emitNodeDeleted(node);
        }

        for (const node of affectedConnections) {
            this.emitConnectionDisconnected(node);
        }

        this.render('all');
        this.renderPreview();
    }

    /**
     * Clones the currently selected nodes in the diagram.
     * The cloned nodes are offset by 24 pixels in both x and y directions.
     * // TODO: Support groups cloning
     */
    public async cloneSelected(): Promise<void> {
        this.addUndo();

        const layer = this.ensureCurrentLayer();
        for (let node of this.selection()) {
            const clone = this.cloneNode(node);

            NodeBasics.moveBy(clone, 24, 24, 'ignore_scale');
            this.nodes.push(clone);
            layer.nodes.push(clone.id);

            this.deselect(node, 'isolated');
            this.select(clone, 'isolated');
        }
        this.render('all');
        this.renderPreview();
    }

    protected cloneNode(node: INode | ISerializedNode, id?: string): INode {
        return {
            ...node,
            id: id || `${node.type}-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            points: node.points.map(p => ({ ...p })),
            ...(node.textStyle && { textStyle: { ...node.textStyle } }),
            ...(node.shadowStyle && { shadowStyle: { ...node.shadowStyle } }),
            ...(node.geometry && { geometry: { ...node.geometry } }),
            ...(node.meta && { meta: { ...node.meta } }),
        } as INode;
    }

    /**
     * Creates a new group from the currently selected nodes, assigning them a unique group ID.
     */
    public groupSelected(): void {
        const selected = this.selection();
        if (selected.length < 2) return;

        this.addUndo();

        const groupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        this.upsertGroup(groupId);

        for (const node of selected) {
            this.setNodeGroup(node, groupId);
        }

        this.render('all');
        this.renderPreview();
    }

    /**
     * Ungroups the currently selected nodes, removing them from any group they belong to.
     */
    public ungroupSelected(): void {
        const selected = this.selection();
        if (!selected.length) return;

        this.addUndo();

        for (const node of selected) {
            this.setNodeGroup(node, undefined);
        }

        this.render('all');
        this.renderPreview();
    }

    /**
     * Sets the arrow type for the currently selected connection.
     * @param where Specifies which end(s) of the connection should have arrows.
     */
    public pickArrow(where: 'start' | 'end' | 'both' | 'none'): void {
        if (this.selection().length == 1) {
            let node = this.selection()[0]!;
            node.arrow = where;
        }
        this.render('all');
        this.renderPreview();
    }

    /**
     * Changes the type of the specified node.
     * @param node The node or node ID to change the type of.
     * @param type The new type to assign to the node.
     */
    public changeType(node: string | INode, type: string): void {
        // let node = (this.selection().length == 1) ? this.selection()[0] : null;
        const _node = (typeof node === 'string') ? this.node(node) : node;
        if (_node) {
            this.addUndo();

            _node.type = type;
            setTimeout(() => {
                this.render('all');
                this.renderPreview();
            }, 100);
        }
    }

    /**
     * Aligns the currently selected nodes in the specified direction.
     * @param dir The direction to align the nodes ('left', 'right', 'center', 'top', 'bottom', 'middle').
     */
    public alignSelected(dir: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle'): void {
        let nodes = this.selection().filter(n => !isConnection(n));
        if (nodes.length < 2) return;

        this.addUndo();

        // Compute the union bounding rect across all selected nodes.
        const rects = nodes.map(n => this.coordinates.getBoundingRect(n, true));
        const unionLeft = Math.min(...rects.map(r => r.left));
        const unionTop = Math.min(...rects.map(r => r.top));
        const unionRight = Math.max(...rects.map(r => r.left + r.width));
        const unionBottom = Math.max(...rects.map(r => r.top + r.height));

        switch (dir) {
            case 'left':
                for (let i = 0; i < nodes.length; i++) {
                    let byX = unionLeft - rects[i]!.left;
                    NodeBasics.moveBy(nodes[i]!, byX, 0, 'ignore_scale');
                }
                break;

            case 'right':
                for (let i = 0; i < nodes.length; i++) {
                    let byX = unionRight - (rects[i]!.left + rects[i]!.width);
                    NodeBasics.moveBy(nodes[i]!, byX, 0, 'ignore_scale');
                }
                break;

            case 'top':
                for (let i = 0; i < nodes.length; i++) {
                    let byY = unionTop - rects[i]!.top;
                    NodeBasics.moveBy(nodes[i]!, 0, byY, 'ignore_scale');
                }
                break;

            case 'bottom':
                for (let i = 0; i < nodes.length; i++) {
                    let byY = unionBottom - (rects[i]!.top + rects[i]!.height);
                    NodeBasics.moveBy(nodes[i]!, 0, byY, 'ignore_scale');
                }
                break;

            case 'center': {
                let center = unionLeft + (unionRight - unionLeft) / 2;
                for (let i = 0; i < nodes.length; i++) {
                    let byX = center - (rects[i]!.left + rects[i]!.width / 2);
                    NodeBasics.moveBy(nodes[i]!, byX, 0, 'ignore_scale');
                }
                break;
            }

            case 'middle': {
                let middle = unionTop + (unionBottom - unionTop) / 2;
                for (let i = 0; i < nodes.length; i++) {
                    let byY = middle - (rects[i]!.top + rects[i]!.height / 2);
                    NodeBasics.moveBy(nodes[i]!, 0, byY, 'ignore_scale');
                }
                break;
            }
        }
        this.render('all');
    }

    /**
     * Spreads the currently selected nodes evenly in the specified direction.
     * @param dir The direction to spread the nodes ('row' or 'column').
     */
    public spreadSelected(dir: 'row' | 'column'): void {
        let nodes = this.selection().filter(n => !isConnection(n));
        if (nodes.length < 3) return;

        this.addUndo();

        let sum, available, space;
        let rects = new Map<INode, IRect>();

        switch (dir) {
            case 'row': {
                sum = 0;
                let leftmost = -1;
                let rightmost = -1;
                for (let node of nodes) {
                    let rect = this.coordinates.getBoundingRect(node, true);
                    rects.set(node, rect);

                    sum += rect.width;
                    leftmost = (leftmost == -1) ? rect.left : Math.min(leftmost, rect.left);
                    rightmost = (rightmost == -1) ? rect.left + rect.width : Math.max(rightmost, rect.left + rect.width);
                }
                available = rightmost - leftmost;
                space = (available - sum) / (nodes.length - 1);

                nodes = nodes.slice().sort((a, b) => {
                    let ra = rects.get(a), rb = rects.get(b);
                    if (!ra || !rb) return 0;

                    return (ra.left == rb.left) ? 0 : (ra.left > rb.left) ? 1 : -1;
                })

                let newX = leftmost;
                for (let node of nodes) {
                    let rect = rects.get(node);
                    if (rect) {
                        let byX = newX - rect.left;
                        NodeBasics.moveBy(node, byX, 0, 'ignore_scale');
                        newX += rect.width + space;
                    }
                }

                break;
            }

            case 'column': {
                sum = 0;
                let topmost = -1;
                let bottommost = -1;
                for (let node of nodes) {
                    let rect = this.coordinates.getBoundingRect(node, true);
                    rects.set(node, rect);

                    sum += rect.height;
                    topmost = (topmost == -1) ? rect.top : Math.min(topmost, rect.top);
                    bottommost = (bottommost == -1) ? rect.top + rect.height : Math.max(bottommost, rect.top + rect.height);
                }
                available = bottommost - topmost;
                space = (available - sum) / (nodes.length - 1);

                nodes = nodes.slice().sort((a, b) => {
                    let ra = rects.get(a), rb = rects.get(b);
                    if (!ra || !rb) return 0;

                    return (ra.top == rb.top) ? 0 : (ra.top > rb.top) ? 1 : -1;
                })

                let newY = topmost;
                for (let node of nodes) {
                    let rect = rects.get(node);
                    if (rect) {
                        let byY = newY - rect.top;
                        NodeBasics.moveBy(node, 0, byY, 'ignore_scale');
                        newY += rect.height + space;
                    }
                }
            }
        }
        this.render('all');
    }

    // ==================================================
    // ========== Rendering methods ==========
    // ==================================================

    public override render(what: RenderScope = 'all'): void {
        super.render(what);

        if (!this.dragCreateDraft || !this.context) {
            return;
        }

        if (what === 'selection' || what === 'grid' || what === 'guides') {
            // Already handled by parent.
            return;
        }

        this.context.save();
        this.coordinates.applyViewportTransform(this.context);
        this.context.globalAlpha = 0.65;

        if (this.dragDraftConnector && this.dragDraftConnector.ready) {
            NodeRegistry.adapter(this.dragDraftConnector.type)?.render(this.dragDraftConnector, this.context);
        }
        NodeRegistry.adapter(this.dragCreateDraft.type)?.render(this.dragCreateDraft, this.context);
        this.context.restore();
    }

    /**
     * Renders the selection markers for the specified node or all selected nodes if no node is specified.
     * @param node The node to render selection markers for. If not provided, all selected nodes are rendered.
     */
    public renderSelection(node?: INode): void {
        if (!this.context) return;

        const coordinates = this.getCoordinates();

        this.context.save();
        coordinates.applyViewportTransform(this.context);

        if (node) {
            // render just this node
            NodeRegistry.adapter(node.type)?.renderSelection(node, this.context);
        } else {
            // render all selections..
            for (const node of this.selection()) {
                NodeRegistry.adapter(node.type)?.renderSelection(node, this.context);
            }

            if (this.current.draft) {
                NodeRegistry.adapter(this.current.draft.type)?.renderSelection(this.current.draft, this.context);
            }
        }
        this.context.restore();
    }

    // ==================================================
    // ========== Event handling and interactions ==========
    // ==================================================

    /**
     * Respond to pointer down events on the canvas, handling selection, panning, creation, and modification based on the event properties and current selection options.
     * @param event The pointer event.
     */
    protected override pointerDown(event: PointerEvent): void {
        if (!this.canvas) return;

        if (this.dragCreateDraft && event.button === 0) {
            // This could never happen!
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }

        if (this.current.tool == 'select' && event.button === 0) {
            this.selectDown(event);
            return;
        }

        if (event.button === 2) {
            this.contextmenu(event);
            return;
        }

        if (this.hasCreateTool() && event.button === 0) {
            this.createDown(event);
            return;
        }

        super.pointerDown(event);
    }

    /**
     * Respond to pointer move events on the canvas, handling selection, panning, creation, and modification based on the event properties and current selection options.
     * @param event The pointer event.
     */
    protected override pointerMove(event: PointerEvent): void {
        if (!this.canvas) return;

        if (this.dragCreateDraft) {
            // Creating by dragging from the palette; just update the draft position.
            this.dragOver(event);
            return;
        }

        if (this.current.tool == 'select') {
            this.selectMove(event);
            return;
        }

        if (!this.current.draft && this.hasCreateTool() && NodeRegistry.isConnection(this.current.tool!)) {
            // just preview connector targets while creating a new connection
            this.previewConnectorTargets(event.offsetX, event.offsetY);
            return;
        }

        if (this.current.draft) {
            this.createMove(event);
            return;
        }

        super.pointerMove(event);
    }

    /**
     * Respond to pointer up events on the canvas, handling selection, panning, creation, and modification based on the event properties and current selection options.
     * @param event The pointer event.
     */
    protected override pointerUp(event: PointerEvent): void {
        if (!this.canvas) return;

        if (this.dragCreateDraft) {
            // DiagramView routes pointerleave with pressed buttons into pointerUp;
            // do not treat leaving canvas as release/cancel.
            if (event.type === 'pointerleave') {
                return;
            }

            if (!this.isPointerInsideCanvas(event)) {
                this.cancelDragCreateDraft();
                return;
            }

            if (event.button === 0) {
                this.dragDrop(event);
            }
            return;
        }

        if (this.current.tool == 'select') {
            this.selectUp(event);
            return;
        }

        if (this.current.draft) {
            this.createUp(event);
            return;
        }

        super.pointerUp(event);
    }

    protected override dblClick(event: MouseEvent): void {
        if (this.current.tool === 'select') {
            const hit = this.hitNode(event.offsetX, event.offsetY);
            if (this.double_click_listener) {
                this.double_click_listener(hit ?? undefined, event as unknown as PointerEvent);
            } else if (hit && NodeRegistry.hasText(hit.type)) {
                this.editText(hit);
            }
        }
    }

    /**
     * Respond to key down events, handling deletion, copying, pasting, cutting, undoing, and exiting drawing mode based on the event properties and current selection state.
     * @param event The keyboard event.
     */
    protected override keydown(event: KeyboardEvent): void {
        const consumeEvent = () => {
            event.preventDefault();
            event.stopImmediatePropagation();
        };

        const key = event.key.toLowerCase();

        if (this.activeTextEditor) {
            const editingNode = this.node(this.activeTextEditor.nodeId);
            const singleLine = this.activeTextEditor.singleLine || (editingNode ? NodeRegistry.isConnection(editingNode.type) : false);

            if (key === 'enter' && (singleLine || (!event.ctrlKey && !event.metaKey && !event.shiftKey))) {
                consumeEvent();
                this.closeTextEditor(true);

            } else if (key === 'escape') {
                consumeEvent();
                this.closeTextEditor(false);

            } else {
                this.activeTextEditor.element.focus();
            }
            return;
        }

        if (this.shouldIgnoreGlobalKeydown(event)) {
            return;
        }

        if (this.editKeyboard.invokeEvent(this, event)) {
            this.exitDrawing();
            return;
        }

        if (key === 'escape') {
            this.exitDrawing();
            return;
        }

        if (key === 'enter') {
            consumeEvent();

            const selected = this.selection().length === 1 ? this.selection()[0] : undefined;
            if (selected && this.current.tool === 'select' && NodeRegistry.hasText(selected.type)) {
                this.editText(selected);
                return;
            }

            // In draw/create states finish the gesture first, then open editor.
            if (this.exitDrawing()) {
                const next = this.selection();
                const afterExit = next.length == 1 ? next[0]! : undefined;
                if (afterExit && this.current.tool === 'select' && NodeRegistry.hasText(afterExit.type)) {
                    this.editText(afterExit);
                }
                return;
            }

            if (selected) {
                this.editText(selected);
            }
            return;
        }

        // if (key === 'delete' || key === 'backspace') {
        //     consumeEvent();
        //     this.exitDrawing();
        //     this.deleteSelected();
        //     return;
        // }

        // if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
        //     if (this.selection().length) {
        //         consumeEvent();
        //         this.exitDrawing();

        //         let step = 1;
        //         if (event.shiftKey) {
        //             if (key === 'arrowup' || key === 'arrowdown') {
        //                 step = this.grid.height || 10;
        //             } else {
        //                 step = this.grid.width || 10;
        //             }
        //         } else if (event.altKey) {
        //             step = 0.5;
        //         }

        //         let byX = 0;
        //         let byY = 0;
        //         if (key === 'arrowleft') byX = -step;
        //         if (key === 'arrowright') byX = step;
        //         if (key === 'arrowup') byY = -step;
        //         if (key === 'arrowdown') byY = step;

        //         this.addUndo();
        //         this.moveSelected(byX, byY);
        //         for (const node of this.selection()) {
        //             if (!isLocked(node)) {
        //                 this.movedNodes.add(node);
        //             }
        //         }
        //         this.render('all');
        //         this.renderPreview();
        //         this.emitPendingMutationEvents();
        //     }
        //     return;
        // }

        // if (event.ctrlKey || event.metaKey) {
        //     if (key === 'n') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         void this.newDiagram();
        //         return;
        //     }
        //     if (key === 'o') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         void this.openDiagram();
        //         return;
        //     }
        //     if (key === 's') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         void this.saveDiagram();
        //         return;
        //     }
        //     if (key === 'e') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         void this.saveImageDiagram({ mimeType: 'image/png' });
        //         return;
        //     }
        //     if (key === 'c') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         this.copySelected();
        //         return;
        //     }
        //     if (key === 'v') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         this.pasteNodes();
        //         return;
        //     }
        //     if (key === 'x') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         this.cutSelected();
        //         return;
        //     }
        //     if (key === 'z') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         if (event.shiftKey) {
        //             void this.redo();
        //         } else {
        //             void this.undo();
        //         }
        //         return;
        //     }
        //     if (key === 'y') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         void this.redo();
        //         return;
        //     }
        //     if (key === 'a') {
        //         consumeEvent();
        //         this.exitDrawing();
        //         this.selectAll();
        //         return;
        //     }
        // }

        super.keydown(event);
    }

    protected override keyup(event: KeyboardEvent): void {
        super.keyup(event);
    }

    /**
     * Respond to context menu events on the canvas, preventing the default context menu from appearing.
     * @param event The pointer event.
     */
    protected override contextmenu(event: PointerEvent): void {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (this.exitDrawing()) {
            return;
        }

        if (this.current.tool === 'select') {
            this.selectDown(event);
        }

        this.eventDispatcher.editContextMenu({
            event,
            canvas: { x: event.offsetX, y: event.offsetY },
            world: this.getCoordinates().getPoint(event.offsetX, event.offsetY, 'ignore_grid'),
            node: this.downShape,
            nodeId: this.downShape?.id,
            nodes: this.selection(),
            nodeIds: this.selection().map(node => node.id),
        } satisfies DiagramEditContextMenu);

        this.contextMenu?.open(event);
    }

    // ==================================================
    // ========== Private Selection methods ==========
    // ==================================================

    private downPos?: IPoint;
    private downShape?: INode;
    private downHandle?: NodeHandle;

    private downRect?: IRect;
    private inSelectGesture = false;

    private selectDown(event: PointerEvent): void {
        if (!this.canvas) return;

        if (event.buttons != 1 && event.buttons != 2) return;
        const localNodes = this.hitNodes(event.offsetX, event.offsetY);
        // const nonConnections = localNodes.filter(node => !isConnection(node));

        const toggleSelectionGesture = event.ctrlKey || event.metaKey;
        const rectSelectionGesture = !this.isSpacePanning
            && !event.ctrlKey
            && !event.metaKey
            && (event.shiftKey || localNodes.length === 0);

        // Record this point since we may want to move or resize?
        this.inSelectGesture = true;
        this.downPos = { x: event.offsetX, y: event.offsetY }

        if (this.isSpacePanning) {
            this.downShape = undefined;
            this.downRect = undefined;
            this.downHandle = NodeHandle.NONE;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (rectSelectionGesture) {
            this.downShape = event.shiftKey && localNodes.length > 0
                ? localNodes[0]
                : undefined;

        } else if (!toggleSelectionGesture) {
            // Don't alter selection of a shape is already selected..
            if (localNodes.length == 0) {
                this.downShape = undefined;
            } else {
                this.downShape = undefined;
                for (let shape of localNodes) {
                    if (this.isSelected(shape)) {
                        this.downShape = shape;
                        break;
                    }
                }
                // this.downShape = this.downShape ?? nonConnections[0] ?? localNodes[0];
                this.downShape = this.downShape ?? localNodes[0];
            }

        } else {
            if (localNodes.length == 0) {
                this.downShape = undefined;
            } else {
                this.downShape = localNodes[0];

                // Use ctrl to iterate between overlaying shapes..
                if (event.ctrlKey || event.metaKey) {
                    let next: INode | 'ready' | undefined;
                    // find the first unselected shape after a selected shape..
                    for (let one of localNodes) {
                        if (next == 'ready') next = one;
                        if (this.isSelected(one)) next = 'ready';
                    }
                    this.downShape = isNode(next) ? next : localNodes[0];
                }
            }
        }

        if (this.downShape) {
            this.reflectStyles(this.downShape);
        }

        // We need the handle for move operations.. (maybe select as well)
        this.downHandle = this.hitHandle(event.offsetX, event.offsetY, this.downShape);

        // Alt+MOVE = insert new point on the segment (then it can be dragged).
        // Alt+POINT = remove that inner point immediately (no drag).
        const insertPointGesture = !!this.downShape
            && this.downHandle == NodeHandle.MOVE
            && event.altKey
            && ConnectionBasics.supportsMutablePoints(this.downShape);

        const removePointGesture = !!this.downShape
            && this.downHandle == NodeHandle.POINT
            && event.altKey
            && ConnectionBasics.supportsMutablePoints(this.downShape);

        if (rectSelectionGesture) this.downHandle = NodeHandle.NONE;

        if (this.selectionOptions.enable_rect && rectSelectionGesture) {
            // begin selection rect..
            let canvasPos = this.getCoordinates().getPoint(this.downPos.x, this.downPos.y, 'ignore_grid');
            this.downRect = { left: canvasPos.x, top: canvasPos.y, width: 1, height: 1 }
            this.setInteractionHint('Dragging selection rectangle');
        } else {
            // don't use selection rect..
            this.downRect = undefined;
        }

        if (isConnection(this.downShape) && this.downHandle == NodeHandle.POINT) {
            this.connectionBeforeEdit = this.captureConnectionState(this.downShape);
            // Prepare to move the anchor point..
            ConnectionBasics.disconnect(this.downShape, event.offsetX, event.offsetY);
            this.emitConnectionChanges(this.downShape, this.connectionBeforeEdit);
        }

        let removedPoint = false;

        if (removePointGesture && this.downShape) {
            const beforeCount = this.downShape.points.length;
            ConnectionBasics.removePoint(this.downShape, event.offsetX, event.offsetY);
            removedPoint = this.downShape.points.length < beforeCount;
            if (removedPoint) {
                this.pointChangedNodes.add(this.downShape);
                // Suppress any drag gesture after removal.
                this.downHandle = NodeHandle.NONE;
            }
        }

        if (insertPointGesture && this.downShape && (!removePointGesture || !removedPoint)) {
            ConnectionBasics.insertPoint(this.downShape, event.offsetX, event.offsetY);
            this.pointChangedNodes.add(this.downShape);
            // After insertion the new point is at the cursor; treat it as a POINT drag.
            this.downHandle = NodeHandle.POINT;
        }

        // Check for shiftKey since we will not add an Undo step if we are selecting a rect..
        if (this.downShape && this.isSelected(this.downShape) && !rectSelectionGesture && !toggleSelectionGesture) {
            // If we are clicking on an already selected item, only get the handle..
            // the rest will be done by SelectMove..
            this.addUndo();

            this.guides = [];
            this.pendingGuideSnap = undefined;
            const useGuides = !!(this.guideOptions.render || this.guideOptions.snap);
            if (useGuides) {

                if (this.downHandle === NodeHandle.MOVE || this.downHandle === NodeHandle.N || this.downHandle === NodeHandle.S
                    || this.downHandle === NodeHandle.E || this.downHandle === NodeHandle.W || this.downHandle === NodeHandle.NE
                    || this.downHandle === NodeHandle.NW || this.downHandle === NodeHandle.SE || this.downHandle === NodeHandle.SW) {

                    const guideResult = Guides.computeResult({
                        diagram: this,
                        nodes: [this.downShape],
                        byX: 0,
                        byY: 0,
                        downShapeId: this.downShape?.id,
                    });

                    if (guideResult) {
                        this.guides = this.guideOptions.render ? guideResult.guides : [];
                        this.pendingGuideSnap = this.guideOptions.snap ? guideResult : undefined;
                        this.render('all');
                    }
                }
            }
            return;
        }

        if (toggleSelectionGesture && this.downShape) {
            // Toggle select of downShape..
            if (this.downShape && this.isSelected(this.downShape)) {
                this.deselect(this.downShape, 'isolated');
            } else if (this.downShape) {
                this.select(this.downShape, 'isolated');
            }
        }
        if (!toggleSelectionGesture && !rectSelectionGesture) {
            this.clearSelection();
            this.current.draft = undefined;
        }

        // select the local shape only..
        if (this.downShape && !toggleSelectionGesture && !rectSelectionGesture) {
            this.select(this.downShape, 'in_group');
        }

        if (this.downHandle != NodeHandle.NONE) {
            this.addUndo();
        }

        if (this.downHandle == NodeHandle.MOVE) {
            // Special cursor..
            this.canvas.style.cursor = 'grabbing';
        } else if (!this.downShape && !this.downRect) {
            this.canvas.style.cursor = 'grabbing';
        }

        const handleAllowsGuidePreview = this.downHandle === NodeHandle.MOVE || this.downHandle === NodeHandle.N || this.downHandle === NodeHandle.S
            || this.downHandle === NodeHandle.E || this.downHandle === NodeHandle.W || this.downHandle === NodeHandle.NE
            || this.downHandle === NodeHandle.NW || this.downHandle === NodeHandle.SE || this.downHandle === NodeHandle.SW;
        const shiftToggleGuidePreview = !!event.shiftKey && !!this.downShape;

        this.guides = [];
        this.pendingGuideSnap = undefined;
        const useGuides = !!(this.guideOptions.render || this.guideOptions.snap);
        if (useGuides) {

            if (handleAllowsGuidePreview || shiftToggleGuidePreview) {
                const guideResult = Guides.computeResult({
                    diagram: this,
                    nodes: shiftToggleGuidePreview ? [this.downShape!] : this.selection(),
                    byX: 0,
                    byY: 0,
                    downShapeId: this.downShape?.id,
                });

                if (guideResult) {
                    this.guides = this.guideOptions.render ? guideResult.guides : [];
                    this.pendingGuideSnap = this.guideOptions.snap ? guideResult : undefined;
                }
            }
        }

        this.render('all');

        // Don't overwrite the rect-gesture hint that was already set above.
        if (!this.downRect) {
            this.updateInteractionHintForHandle(this.downHandle);
        }
    }

    private selectMove(event: PointerEvent): void {
        if (!this.canvas) return;

        if (event.buttons == 1 && this.downPos) {
            switch (this.downHandle) {
                case NodeHandle.MOVE: {
                    let movePos = { x: event.offsetX, y: event.offsetY }

                    this.moveSelected(movePos.x - this.downPos.x, movePos.y - this.downPos.y);

                    const containers = this.hitNodes(event.offsetX, event.offsetY).filter(n => !isConnection(n));
                    if (containers.length > 0) {
                        for (const container of containers) {
                            if (!isInvisible(container)) {
                                this.renderSelection(container);
                            }
                        }
                    }

                    this.downPos = movePos;

                    // this.render('all');
                    this.setInteractionHint('Dragging selection');
                    break;
                }
                case NodeHandle.N:
                case NodeHandle.S:
                case NodeHandle.E:
                case NodeHandle.W:
                case NodeHandle.NE:
                case NodeHandle.NW:
                case NodeHandle.SE:
                case NodeHandle.SW: {
                    let movePos = { x: event.offsetX, y: event.offsetY }

                    let preserveAspect = event.altKey;

                    this.resizeSelected(this.downHandle,
                        movePos.x - this.downPos.x,
                        movePos.y - this.downPos.y,
                        this.downShape!,
                        preserveAspect
                    );
                    for (const node of this.selection()) {
                        if (!isLocked(node)) {
                            this.resizedNodes.add(node);
                        }
                    }
                    this.downPos = movePos;

                    this.render('all');
                    this.setInteractionHint('Resizing selection');
                    break;
                }
                case NodeHandle.POINT: {
                    if (this.downShape) {
                        if (isLocked(this.downShape)) break;

                        let movePos = { x: event.offsetX, y: event.offsetY }

                        this.moveSelectedPoint(this.downShape,
                            this.downPos.x, this.downPos.y,
                            movePos.x - this.downPos.x,
                            movePos.y - this.downPos.y);

                        this.pointChangedNodes.add(this.downShape);

                        this.downPos = movePos;

                        this.render('all');
                    }
                    if (this.downShape && isConnection(this.downShape)) {
                        this.renderConnectorTargets(this.downShape, event.offsetX, event.offsetY);
                    }

                    this.setInteractionHint('Dragging point');

                    break;
                }
                case NodeHandle.ROTATE:
                    if (this.downShape) {
                        if (isLocked(this.downShape)) break;

                        let movePos = { x: event.offsetX, y: event.offsetY }

                        let rect = this.coordinates.getBoundingRect(this.downShape);
                        let center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                        let canvasPos = this.coordinates.getPoint(movePos.x, movePos.y, 'ignore_grid');
                        let angle = Math.atan((canvasPos.y - center.y) / (canvasPos.x - center.x));

                        if (event.altKey) {
                            angle = angle * 180 / Math.PI;
                            let snap = 15;
                            let diff = angle % snap;
                            angle = (diff < (snap / 2)) ? angle - diff : angle + (snap - diff);
                            NodeBasics.rotateTo(this.downShape, angle, 'degrees');
                        } else {
                            NodeBasics.rotateTo(this.downShape, angle, 'radians');
                        }
                        this.downPos = movePos;

                        this.render('all');
                        this.setInteractionHint('Rotating selection');
                    }
                    break;

                case NodeHandle.ALTER:
                    if (this.downShape) {
                        if (isLocked(this.downShape)) break;

                        const movePos = { x: event.offsetX, y: event.offsetY };
                        NodeRegistry.adapter(this.downShape.type)?.onAlterMove?.(this.downShape, movePos);
                        this.alteredNodes.add(this.downShape);
                        this.render('all');
                        this.setInteractionHint('Altering shape geometry');
                    }
                    break;

                case NodeHandle.NONE:
                    if (this.downRect) {
                        // Dragging a selection rectangle..
                        let movePos = { x: event.offsetX, y: event.offsetY }
                        let moveRect = this.normalizeRect(this.downPos, movePos);

                        this.render('all');

                        const included = SelectionBasics.nodesForRect(this.selectionAdapter(), moveRect, this.selectionOptions.rect_mode);
                        for (const node of included) {
                            if (!this.isSelected(node)) {
                                this.renderSelection(node);
                            }
                        }
                        this.renderSelectionRect(moveRect);
                    } else if (!this.downShape) {
                        // Panning the canvas..
                        let movePos = { x: event.offsetX, y: event.offsetY }

                        this.panBy(movePos.x - this.downPos.x, movePos.y - this.downPos.y);
                        this.downPos = movePos;

                        this.render('all');
                        this.setInteractionHint('Panning canvas');
                    }
            }
        } else {

            // Simply moving, the cursor can change with possible actions..
            const handle = this.hitHandle(event.offsetX, event.offsetY, this.downShape);

            if (event.altKey) {
                const hoverNode = this.hitNode(event.offsetX, event.offsetY);
                if (hoverNode && ConnectionBasics.supportsMutablePoints(hoverNode)) {
                    if (handle == NodeHandle.POINT) {
                        this.canvas.style.cursor = 'not-allowed'; // indicate remove
                    } else if (handle == NodeHandle.MOVE) {
                        this.canvas.style.cursor = 'copy';  // indicate add
                    } else {
                        this.canvas.style.cursor = this.getCursor(handle) || 'default';
                    }
                    return;
                }
            }

            this.canvas.style.cursor = this.getCursor(handle) || 'default';
        }
    }

    private selectUp(event: PointerEvent): void {
        if (!this.canvas) return;
        if (!this.inSelectGesture) return;
        this.inSelectGesture = false;

        if (this.downRect && this.downPos) {
            // Dragging a selection rectangle.. finalizing
            const movePos = { x: event.offsetX, y: event.offsetY }
            const selectionRect = this.normalizeRect(this.downPos, movePos);
            const moveDistance = Math.hypot(movePos.x - this.downPos.x, movePos.y - this.downPos.y);
            const isNearClick = moveDistance <= 8;
            const stillOnDownShape = !!this.downShape
                && this.hitNodes(event.offsetX, event.offsetY).some(node => node.id === this.downShape!.id);

            if (event.shiftKey && this.downShape && isNearClick && stillOnDownShape) {
                if (this.isSelected(this.downShape)) {
                    this.deselect(this.downShape, 'in_group');
                } else {
                    this.select(this.downShape, 'in_group');
                }
            } else {
                this.applyRectSelection(selectionRect, event.shiftKey || event.ctrlKey || event.metaKey);
            }
        }

        if (this.downPos && isConnection(this.downShape)) {
            if (this.downHandle == NodeHandle.POINT) {
                ConnectionBasics.reconnect(this.downShape, this.downPos.x, this.downPos.y);
                this.emitConnectionChanges(this.downShape, this.connectionBeforeEdit);
            }
        }

        // removePoint is handled on pointerDown; nothing to do here for points.

        if (this.downHandle === NodeHandle.MOVE || this.downHandle === NodeHandle.N || this.downHandle === NodeHandle.S
            || this.downHandle === NodeHandle.E || this.downHandle === NodeHandle.W || this.downHandle === NodeHandle.NE
            || this.downHandle === NodeHandle.NW || this.downHandle === NodeHandle.SE || this.downHandle === NodeHandle.SW) {

            const group = this.downShape ? this.nodeGroup(this.downShape) : undefined;
            if (group && this.downShape) {
                this.applyPendingGuideSnap([this.downShape], this.downHandle, event.altKey);
                if (this.groupOwner(group) === this.downShape) {
                    // When snapping the owner, we need to snap all members of the group with the same dx,dy.
                    this.applyPendingGuideGroupSnap(group, this.downShape);
                    // const dx = this.pendingGuideSnap?.dx ?? 0;
                    // const dy = this.pendingGuideSnap?.dy ?? 0;
                    // for (const member_id of group.nodes) {
                    //     const member = (member_id !== this.downShape.id) ? this.node(member_id) : undefined;
                    //     if (member) {
                    //         NodeBasics.moveBy(member, dx, dy);
                    //         this.movedNodes.add(member);
                    //     }
                    // }
                }

            } else {
                this.applyPendingGuideSnap(this.selection(), this.downHandle, event.altKey);
            }
        }

        if (this.grid && this.grid.forced && !event.ctrlKey) {
            if (this.downHandle != NodeHandle.ROTATE) {
                for (let shape of this.selection()) {
                    NodeRegistry.adapter(shape.type)?.snapToGrid(shape, this.grid, this.downHandle ?? NodeHandle.MOVE);
                }
            }
            // this.render('all');
        }

        this.guides = [];
        this.pendingGuideSnap = undefined;

        // Handle groups (containers)
        if (this.downHandle == NodeHandle.MOVE) {
            const overlaying = this.hitNodes(event.offsetX, event.offsetY)
                .filter(node => node.id !== this.downShape?.id);
            for (const one of overlaying) {
                if (isContainer(one)) {
                    for (const shape of this.selection()) {
                        this.setNodeGroup(shape, one.owns_group);
                    }
                    break;
                }
            }
        }

        this.render('all');

        this.downHandle = NodeHandle.NONE;
        this.connectionBeforeEdit = undefined;

        this.emitPendingMutationEvents();

        let handle = this.hitHandle(event.offsetX, event.offsetY);
        this.canvas.style.cursor = this.getCursor(handle) || 'default';

        this.renderPreview();
        this.setInteractionHint(undefined);

        // Double-click is handled in dblClick() override.
    }

    // ==================================================
    // ========== Private creation methods ==========
    // ==================================================

    private createPos?: IPoint;

    private createDown(event: PointerEvent): void {
        if (!this.current.tool || this.current.tool === 'select' || event.button !== 0) return;

        this.createPos = { x: event.offsetX, y: event.offsetY }

        const layer = this.ensureCurrentLayer();

        const point = this.getCoordinates().getPointFromEvent(event, this.grid);

        if (!this.current.draft) {
            this.addUndo();

            const draft = this.createDraftFromCurrent(
                this.current.tool,
                this.current.toolOptions,
                point,
            );

            this.current.draft = draft;
            this.upsertNode(draft);

            if (NodeRegistry.isConnection(draft.type)) {
                ConnectionBasics.reconnect(draft as INode & IConnection, event.offsetX, event.offsetY);
                this.updateConnectorDraftReadiness(draft as INode & IConnection);
            }

            if (!layer.nodes.includes(draft.id)) {
                layer.nodes.push(draft.id);
            }

            this.canvas.style.cursor = 'crosshair';
            this.render('all');
            this.setInteractionHint(`Drawing ${draft.type}`);
            if (NodeRegistry.isConnection(draft.type)) {
                this.renderConnectorTargets(draft as INode & IConnection, event.offsetX, event.offsetY);
            }
            return;
        }

        if (NodeRegistry.isConnection(this.current.draft.type)) {
            const draft = this.current.draft as INode & IConnection;
            const movingIndex = draft.points.length - 1;
            draft.points[movingIndex] = { ...point };

            ConnectionBasics.reconnect(draft, event.offsetX, event.offsetY);
            this.updateConnectorDraftReadiness(draft);

            if (!draft.ready && NodeRegistry.isMultistepCreate(draft.type)) {
                draft.points.push({ ...point });
            } else if (!draft.ready) {
                draft.ready = true;
            }

            this.render('all');
            this.renderConnectorTargets(draft, event.offsetX, event.offsetY);
            this.setInteractionHint(`Drawing ${draft.type}`);
            this.finishDraftIfReady();
            return;
        }

        if (NodeRegistry.isMultistepCreate(this.current.draft.type)) {
            const movingIndex = this.current.draft.points.length - 1;
            this.current.draft.points[movingIndex] = { ...point };
            this.current.draft.points.push({ ...point });
            this.render('all');
            this.setInteractionHint(`Drawing ${this.current.draft.type}`);
        }
    }

    private createMove(event: PointerEvent): void {
        if (!this.current.draft) return;

        const point = this.getCoordinates().getPointFromEvent(event, this.grid);
        const draft = this.current.draft;

        NodeRegistry.adapter(draft.type)?.onCreateMove(draft, point);

        this.render('all');
        this.setInteractionHint(`Drawing ${draft.type}`);

        if (NodeRegistry.isConnection(draft.type)) {
            this.renderConnectorTargets(draft as INode & IConnection, event.offsetX, event.offsetY);
        } else {
            this.finishDraftIfReady();
        }
    }

    private createUp(event: PointerEvent): void {
        if (!this.current.draft) return;

        // TODO: Why is the line here? Must understand.
        // this.createMove(event);

        if (NodeRegistry.isConnection(this.current.draft.type)) {
            this.renderConnectorTargets(this.current.draft as INode & IConnection, event.offsetX, event.offsetY);
            return;
        }

        if (!NodeRegistry.isMultistepCreate(this.current.draft.type)) {
            this.current.draft.ready = true;
        }

        // Handle groups
        if (this.current.draft.ready) {
            const overlaying_start = this.hitNodes(this.createPos?.x ?? 0, this.createPos?.y ?? 0);
            const overlaying_end = this.hitNodes(event.offsetX, event.offsetY);
            const overlaying = Array.from(new Set([...overlaying_start, ...overlaying_end]))
                .filter(node => node.id !== this.current.draft!.id);
            for (const one of overlaying) {
                if (isContainer(one)) {
                    this.setNodeGroup(this.current.draft, one.owns_group);
                    break;
                }
            }
        }

        this.render('all');
        this.finishDraftIfReady();
    }

    // ==================================================
    // ========== Private drag create methods ==========
    // ==================================================

    private dragOver(event: PointerEvent): void {
        if (!this.dragCreateDraft) {
            return;
        }

        let overlaying = this.hitNode(event.offsetX, event.offsetY);

        if (overlaying) {
            // The dragged node is over another node.
            // Position the created node relative to the connector's end point
            // so we can find the nearest anchor
            let from_handle = this.hitHandle(event.offsetX, event.offsetY);
            let from_point = this.coordinates.getPointFromEvent(event, this.grid);
            let to_handle = NodeHandle.MOVE;
            let to_point = from_point;

            // The dragged node is over another node.
            // Position the dragged node relative to the connector's end point.
            if (overlaying && from_handle === NodeHandle.MOVE) {
                // Try to find a better anchor
                const from_nearest = NodeBasics.nearestHandle(overlaying, from_point);
                if (from_nearest) {
                    from_handle = from_nearest.handle;
                    from_point = from_nearest.point;
                }
            }
            this.positionDraftConnectedTo(this.dragCreateDraft, from_point, from_handle);
            const to_nearest = NodeBasics.nearestHandle(this.dragCreateDraft, from_point);
            if (to_nearest) {
                to_handle = to_nearest.handle;
                to_point = to_nearest.point;
            }

            if (from_handle === NodeHandle.N || from_handle === NodeHandle.S ||
                from_handle === NodeHandle.E || from_handle === NodeHandle.W ||
                from_handle === NodeHandle.NE || from_handle === NodeHandle.NW ||
                from_handle === NodeHandle.SE || from_handle === NodeHandle.SW) {

                this.canvas.style.cursor = 'copy';  // indicate Adding to existing node

                this.connectDragDraftTo(this.dragCreateDraft, from_point, from_handle, to_point);
                this.render('all');

                // Provide visual feedback indicating potential anchor points.
                this.renderSelection(overlaying);

                const target_label = overlaying?.text || 'existing ' + humanize(overlaying?.type || 'node');
                this.setInteractionHint(`Drop to connect to ${target_label}`);

                return;
            } else {
                // Should this be handled?
                // console.warn('Drag over node with no anchor handle?', overlaying, from_handle);
            }
        }
        // } else {
        // The dragged node is not over another node.
        this.canvas.style.cursor = 'default';

        const point = this.coordinates.getPointFromEvent(event, this.grid);
        this.centerNodeAt(this.dragCreateDraft, point);
        this.render('all');

        if (this.dragDraftConnector) {
            this.dragDraftConnector.invisible = true;
            this.dragDraftConnector.ready = false;
        }
        // }
        if (overlaying) {
            this.renderSelection(overlaying);
        }
    }

    private dragDrop(event: PointerEvent): void {
        if (!this.dragCreateDraft) {
            return;
        }

        this.addUndo();

        const created = {
            ...this.dragCreateDraft,
            id: `${this.dragCreateDraft.type}-drop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        };
        const point = this.coordinates.getPointFromEvent(event, this.grid);
        let connected_to: string | undefined = undefined;

        if (this.dragDraftConnector?.ready) {
            // The created node is over another node.
            // Position the created node relative to the connector's end point
            // so we can find the nearest anchor
            const overlaying = this.hitNode(event.offsetX, event.offsetY);
            let from_handle = this.hitHandle(event.offsetX, event.offsetY);
            let from_point = this.coordinates.getPointFromEvent(event, this.grid);
            let to_handle = NodeHandle.MOVE;
            let to_point = from_point;

            if (overlaying && from_handle === NodeHandle.MOVE) {
                const from_nearest = NodeBasics.nearestHandle(overlaying, from_point);
                if (from_nearest) {
                    from_handle = from_nearest.handle;
                    from_point = from_nearest.point;
                }
            }
            this.positionDraftConnectedTo(created, from_point, from_handle);
            const to_nearest = NodeBasics.nearestHandle(created, from_point);
            if (to_nearest) {
                to_handle = to_nearest.handle;
                to_point = to_nearest.point;
            }

            // Insert the connector into the diagram
            const connector = {
                ...this.dragDraftConnector,
                from: { node: overlaying?.id, handle: from_handle },
                to: { node: created.id, handle: to_handle },
                id: `auto-line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
            } as INode & IConnection;

            this.upsertNode(connector);
            this.current.layer?.nodes.push(connector.id);

            // and place it as expected
            this.positionDraftConnectedTo(created, from_point, from_handle);
            connected_to = overlaying?.id;

        } else {
            // The created node is not over another node.
            this.centerNodeAt(created, point);
        }

        created.ready = true;

        const layer = this.ensureCurrentLayer();

        // this.addUndo();

        this.upsertNode(created);
        layer.nodes.push(created.id);
        // if (!layer.nodes.includes(created.id)) {
        //     layer.nodes.push(created.id);
        // }

        // Handle groups
        const overlaying = this.hitNodes(event.offsetX, event.offsetY).filter(node => node.id !== created.id);
        for (const one of overlaying) {
            // Don't become a memebr of a container you connected to; that would be confusing.
            if (one.id === connected_to) {
                continue;
            }

            if (isContainer(one)) {
                this.setNodeGroup(created, one.owns_group);
                break;
            }
        }

        NodeRegistry.adapter(created.type)?.snapToGrid(created, this.grid, NodeHandle.MOVE);

        this.clearSelection();
        this.select(created, 'isolated');
        this.clearDragCreateDraft();
        this.render('all');
        this.renderPreview();
        this.emitNodeAdded(created);
        void this.setTool('select');
    }

    private centerNodeAt(node: INode, center: IPoint): void {
        const rect = this.coordinates.getBoundingRect(node);
        const deltaX = center.x - (rect.left + rect.width / 2);
        const deltaY = center.y - (rect.top + rect.height / 2);
        NodeBasics.moveBy(node, deltaX, deltaY, 'ignore_scale');
    }

    private positionDraftConnectedTo(draft: INode, point: IPoint, handle: NodeHandle): void {
        if (!this.dragCreateDraft) return;

        const rect = this.coordinates.getBoundingRect(draft);
        let offsetX = 0, offsetY = 0, stub = 24 * 2, w = rect.width / 2, h = rect.height / 2;

        switch (handle) {
            case NodeHandle.N: offsetY = - stub - h; break;
            case NodeHandle.S: offsetY = stub + h; break;
            case NodeHandle.E: offsetX = stub + w; break;
            case NodeHandle.W: offsetX = - stub - w; break;
            case NodeHandle.NE: offsetX = stub + w; offsetY = - stub - h; break;
            case NodeHandle.NW: offsetX = - stub - w; offsetY = - stub - h; break;
            case NodeHandle.SE: offsetX = stub + w; offsetY = stub + h; break;
            case NodeHandle.SW: offsetX = - stub - w; offsetY = stub + h; break;
        }

        this.centerNodeAt(draft, { x: point.x + offsetX, y: point.y + offsetY });
    }

    private connectDragDraftTo(draft: INode, from_point: IPoint, from_handle: NodeHandle, to_point: IPoint): void {
        if (!this.dragCreateDraft) return;

        // const rect = this.coordinates.getBoundingRect(draft);
        // let to_point = { x: point.x, y: point.y };
        // switch (to_handle) {
        //     case NodeHandle.N: to_point = { x: rect.left + rect.width / 2, y: rect.top }; break;
        //     case NodeHandle.S: to_point = { x: rect.left + rect.width / 2, y: rect.top + rect.height }; break;
        //     case NodeHandle.E: to_point = { x: rect.left + rect.width, y: rect.top + rect.height / 2 }; break;
        //     case NodeHandle.W: to_point = { x: rect.left, y: rect.top + rect.height / 2 }; break;
        //     case NodeHandle.NE: to_point = { x: rect.left + rect.width, y: rect.top }; break;
        //     case NodeHandle.NW: to_point = { x: rect.left, y: rect.top }; break;
        //     case NodeHandle.SE: to_point = { x: rect.left + rect.width, y: rect.top + rect.height }; break;
        //     case NodeHandle.SW: to_point = { x: rect.left, y: rect.top + rect.height }; break;
        // }

        this.positionDraftConnectedTo(draft, from_point, from_handle);
        if (this.dragDraftConnector) {
            this.dragDraftConnector.invisible = false;
            this.dragDraftConnector.ready = true;
            this.dragDraftConnector.points = [
                { x: from_point.x, y: from_point.y },
                { x: to_point.x, y: to_point.y }
            ];
        }

        // const rect = this.coordinates.getBoundingRect(draft);
        // let offsetX = 0, offsetY = 0, stub = 24 * 2, w = rect.width / 2, h = rect.height / 2;

        // switch (handle) {
        //     case NodeHandle.N: offsetY = - stub - h; break;
        //     case NodeHandle.S: offsetY = stub + h; break;
        //     case NodeHandle.E: offsetX = stub + w; break;
        //     case NodeHandle.W: offsetX = - stub - w; break;
        //     case NodeHandle.NE: offsetX = stub + w; offsetY = - stub - h; break;
        //     case NodeHandle.NW: offsetX = - stub - w; offsetY = - stub - h; break;
        //     case NodeHandle.SE: offsetX = stub + w; offsetY = stub + h; break;
        //     case NodeHandle.SW: offsetX = - stub - w; offsetY = stub + h; break;
        // }

        // if (this.dragDraftConnector) {
        //     this.dragDraftConnector.invisible = false;
        //     this.dragDraftConnector.ready = true;
        //     this.dragDraftConnector.points = [
        //         { x: point.x, y: point.y },
        //         { x: point.x + offsetX, y: point.y + offsetY }
        //     ];
        // }

        // this.centerNodeAt(draft, { x: point.x + offsetX, y: point.y + offsetY });
    }

    private clearDragCreateDraft(): void {
        this.dragCreateDraft = undefined;
        this.dragDraftConnector = undefined;
    }

    private cancelDragCreateDraft(): void {
        if (!this.dragCreateDraft) return;
        this.clearDragCreateDraft();
        this.setInteractionHint(undefined);
        this.render('all');
        void this.setTool('select');
    }

    private isPointerInsideCanvas(event: PointerEvent): boolean {
        if (!this.canvas) return false;

        const rect = this.canvas.getBoundingClientRect();
        return event.clientX >= rect.left
            && event.clientX <= rect.right
            && event.clientY >= rect.top
            && event.clientY <= rect.bottom;
    }

    private windowPointerUp(event: PointerEvent): void {
        if (!this.dragCreateDraft) return;
        if (this.isPointerInsideCanvas(event)) return;
        this.cancelDragCreateDraft();
    }

    // ===================================================
    // ========== Private methods ==========
    // ==========================================================

    private hasCreateTool(): boolean {
        if (!this.current.tool || this.current.tool === 'select') {
            return false;
        }

        return !!NodeRegistry.adapter(this.current.tool);
    }

    // private isMultistepCreate(type: string): boolean {
    //     return NodeRegistry.isMultistepCreate(type);
    // }

    // private isConnectorType(type: string): boolean {
    //     return !!NodeRegistry.adapter(type)?.is_connector;
    // }

    // private hasTextInput(type: string): boolean {
    //     return !!NodeRegistry.adapter(type)?.has_text;
    // }

    private updateConnectorDraftReadiness(draft: INode & IConnection): void {
        draft.ready = !!draft.from && !!draft.to;
    }

    private resolveAnchorNode(anchor?: IConnection['from']): INode | undefined {
        if (!anchor) {
            return undefined;
        }

        if (typeof anchor.node !== 'string') {
            return anchor.node;
        }

        const target = this.node(anchor.node);
        if (target) {
            anchor.node = target;
        }
        return target;
    }

    private renderConnectorTargets(node: INode & IConnection, canvasX: number, canvasY: number): void {
        const targets = new Map<string, INode>();

        // Select existing connection anchors
        const fromNode = this.resolveAnchorNode(node.from);
        if (fromNode && fromNode.id !== node.id) {
            targets.set(fromNode.id, fromNode);
        }

        const toNode = this.resolveAnchorNode(node.to);
        if (toNode && toNode.id !== node.id) {
            targets.set(toNode.id, toNode);
        }

        // Start with the cursor for creating..
        this.canvas!.style.cursor = (this.current.draft) ? 'crosshair' : 'default';

        // Select potential connection targets
        for (const hover of this.hitNodes(canvasX, canvasY)) {
            if (hover.id === node.id) continue;

            if (hover.id !== node.id) {
                targets.set(hover.id, hover);
            }
            const handle = this.hitHandle(canvasX, canvasY, hover);
            if (handle !== NodeHandle.MOVE && handle !== NodeHandle.ROTATE) {
                this.canvas!.style.cursor = 'pointer';
            }
        }

        for (const target of targets.values()) {
            this.renderSelection(target);
        }
    }

    private previewConnectorTargets(canvasX: number, canvasY: number): void {
        this.render('all');

        // Start with the cursor for creating..
        this.canvas!.style.cursor = (this.current.draft) ? 'crosshair' : 'default';

        // Highlight potential connection targets
        for (const hover of this.hitNodes(canvasX, canvasY)) {
            this.renderSelection(hover);

            const handle = this.hitHandle(canvasX, canvasY, hover);
            if (handle !== NodeHandle.MOVE && handle !== NodeHandle.ROTATE) {
                this.canvas!.style.cursor = 'pointer';
            }
        }
    }

    private createDraftFromCurrent(
        toolName?: string,
        options?: { url?: string },
        start: { x: number; y: number } = { x: 0, y: 0 },
    ): INode {
        const tool = toolName || this.current.tool || 'rectangle';
        const points = (tool === 'polygon')
            ? [{ ...start }, { ...start }, { ...start }, { ...start }]
            : [{ ...start }, { ...start }];
        const fillStyle = NodeRegistry.isConnection(tool) ? 'transparent' : this.fillColor;
        const hollow_mode = NodeRegistry.adapter(tool)?.hollow_mode || 'if_transparent';
        const hollow = (hollow_mode === 'always')
            || (hollow_mode === 'if_transparent' && fillStyle === 'transparent');

        const template = NodeRegistry.adapter(tool)?.onCreateDraft?.(tool) || {};
        const draft: INode = {
            ...template,
            id: `${tool}-draft-${Date.now()}`,
            type: tool,
            points,
            hollow,
            text: tool === 'text' ? 'Text' : '',
            textStyle: { ...this.textStyle },
            ready: false,
            strokeStyle: this.strokeColor,
            fillStyle,
            lineWidth: this.lineWidth,
            shadowStyle: { ...this.shadowStyle },
            owner: this,
        };

        if (NodeRegistry.isConnection(tool)) {
            draft.arrow = this.settings.arrow;
            draft.textStyle = {
                ...(draft.textStyle || {}),
                orientation: 'horizontal',
                halo: 'inherit',
            };
        }

        if (tool === 'svg' && options?.url) {
            this.applyNodeImageSource(draft, options.url, 'contain');
        }

        return draft;
    }

    // ==================================================
    // ========== Private drag create methods ==========
    // ==================================================

    private finishDraftIfReady(): void {
        if (!this.current.draft?.ready) {
            return;
        }

        const created = this.current.draft;

        NodeRegistry.adapter(created.type)?.snapToGrid(created, this.grid, NodeHandle.MOVE);

        this.clearSelection();
        this.select(created, 'isolated');
        this.current.draft = undefined;
        this.render('all');
        this.renderPreview();

        this.emitNodeAdded(created);
        if (NodeRegistry.isConnection(created.type) && (created as INode & IConnection).from || (created as INode & IConnection).to) {
            this.emitConnectionConnected(created as INode & IConnection);
        }

        this.setTool('select');
        this.canvas.style.cursor = 'default';
        this.setInteractionHint(undefined);
    }

    async init() {
        if (!this.canvas) {
            setTimeout(() => {
                console.warn('NOT yet ready !!!');
                this.init();
            }, 100)
            return;
        }

        if (this.layers.length == 0) {
            this.createLayerAt('top');
        }

        this.current.layer = this.layers[0];

        this.modified = false;
    }

    /**
     * Renders preview output for the provided layer.
     * @param layer Optional layer to preview.
     */
    public renderPreview(layer?: ILayer): void {
    }

    private applyText(event: string): void {
        for (let node of this.selection()) {
            node.text = event;
        }
        this.render('all');
        this.renderPreview();
    }

    private createLayerAt(place: 'top' | 'bottom' = 'top', id?: string): ILayer {
        const layerId = id || this.generateLayerId();
        const existing = this.layer(layerId);
        if (existing) {
            return this.upsertLayer(existing);
        }

        const created = this.createLayer(layerId);
        if (place === 'bottom') {
            this.layers.unshift(created);
        } else {
            this.layers.push(created);
        }
        return created;
    }

    private ensureCurrentLayer(): ILayer {
        const active = this.current.layer ? this.layer(this.current.layer.id) : undefined;

        if (!active) {
            if (!this.layers.length) {
                this.createLayerAt('top');
            }
            this.current.layer = this.layers[0]!;
        } else {
            // Keep the current layer reference synchronized with the live layer
            // object because some operations rebuild this.layers with new instances.
            this.current.layer = active;
        }

        return this.current.layer;
    }

    private generateLayerId(prefix: string = 'layer'): string {
        let index = this.layers.length + 1;
        let id = `${prefix}-${index}`;

        while (this.layer(id)) {
            index += 1;
            id = `${prefix}-${index}`;
        }

        return id;
    }

    // private generateNodeId(seed: string): string {
    //     const base = (seed || 'node').replace(/-clone-\d+-[a-z0-9]+$/i, '');
    //     let id = `${base}-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    //     while (this.node(id)) {
    //         id = `${base}-clone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    //     }

    //     return id;
    // }

    protected exitDrawing(): boolean {
        this.guides = [];
        this.pendingGuideSnap = undefined;

        // End drawing polylines..
        if (this.current.draft && !this.current.draft.ready) {
            this.current.draft.ready = true;

            this.finishDraftIfReady();
            return true;
        }

        if (this.closeTextEditor(true)) {
            return true;
        }

        return false;
    }

    public override zoomTo(zoom: number, centerX?: number, centerY?: number): void {
        this.closeTextEditor(false);
        super.zoomTo(zoom, centerX, centerY);
    }

    public override panBy(byX: number, byY: number): void {
        this.closeTextEditor(false);
        super.panBy(byX, byY);
    }

    private editText(node: INode): void {
        if (!this.canvas || !node) {
            return;
        }
        if (!NodeRegistry.hasText(node.type)) {
            return;
        }

        this.closeTextEditor(true);
        this.setInteractionHint('Editing text');

        // Prepare shortcuts and rrequired data for all cases:

        const canvasRect = this.canvas.getBoundingClientRect();
        const zoom = this.coordinates.zoom;
        const pan = this.coordinates.pan;
        const singleLine = NodeRegistry.isConnection(node.type);

        const textPadding = Math.max(DiagramConstants.DEFAULT_TEXT_PADDING, lineWidth(node));
        const baseline = textBaseline(node);

        const fontFace = node.textStyle?.fontFace || this.textStyle.fontFace || DiagramConstants.DEFAULT_NODE_FONT_FACE;
        const fontSize = node.textStyle?.size || this.textStyle.size || DiagramConstants.DEFAULT_NODE_FONT_SIZE;
        const fontItalic = node.textStyle?.italic ? 'italic' : '';
        const rawWeight = node.textStyle?.weight;
        const fontWeight = (typeof rawWeight === 'number' && Number.isFinite(rawWeight))
            ? Math.min(900, Math.max(100, Math.round(rawWeight / 100) * 100))
            : 400;
        const scaledFontSize = Math.max(1, fontSize * zoom);
        const scaledLineHeight = Math.max(scaledFontSize * 1.25, 1);

        let rect = this.coordinates.getBoundingRect(node);
        const screenRect: IRect = {
            left: canvasRect.left + ((rect.left + textPadding) * zoom) - pan.x,
            top: canvasRect.top + ((rect.top + textPadding) * zoom) - pan.y,
            width: Math.max(1, (rect.width - (textPadding * 2)) * zoom),
            height: Math.max(scaledLineHeight, (rect.height - (textPadding * 2)) * zoom),
        };

        let editorWidth: number;
        let editorHeight: number;
        let left: number;
        let top: number;
        let transform = '';

        // const textRectLeftScreen = canvasRect.left + ((rect.left + textPadding) * zoom) - pan.x;
        // const textRectTopScreen = canvasRect.top + ((rect.top + textPadding) * zoom) - pan.y;
        // const textRectWidthScreen = Math.max(1, (rect.width - (textPadding * 2)) * zoom);
        // const textRectHeightScreen = Math.max(scaledLineHeight, (rect.height - (textPadding * 2)) * zoom);

        // const rectTopScreen = canvasRect.top + (rect.top * zoom) - pan.y;
        // const rectHeightScreen = rect.height * zoom;
        // const baseline = textBaseline(node);
        // let textRectTopScreen = rectTopScreen;
        // let textRectHeightScreen = rectHeightScreen;

        // const rect = this.coordinates.getBoundingRect(node);
        // const canvasRect = this.canvas.getBoundingClientRect();
        // const zoom = this.coordinates.zoom;
        // const pan = this.coordinates.pan;
        // const fontFace = node.fontFace || this.fontFace;
        // const fontSize = node.fontSize || this.fontSize;
        // const scaledFontSize = Math.max(1, fontSize * zoom);
        // const scaledLineHeight = Math.max(scaledFontSize * 1.25, 1);
        // const singleLine = this.isConnectorType(node.type);
        // const textPadding = Math.max(DiagramConstants.DEFAULT_TEXT_PADDING, lineWidth(node));

        // const worldToScreen = (x: number, y: number): IPoint => ({
        //     x: canvasRect.left + (x * zoom) - pan.x,
        //     y: canvasRect.top + (y * zoom) - pan.y,
        // });

        // let editorWidth = Math.max(24, rect.width * zoom);
        // let editorHeight = Math.max(scaledLineHeight, rect.height * zoom);
        // let left = canvasRect.left + (rect.left * zoom) - pan.x;
        // let top = canvasRect.top + (rect.top * zoom) - pan.y;
        // let transform = '';

        // const rectTopScreen = canvasRect.top + (rect.top * zoom) - pan.y;
        // const rectHeightScreen = rect.height * zoom;
        // const baseline = textBaseline(node);
        // let textRectTopScreen = rectTopScreen;
        // let textRectHeightScreen = rectHeightScreen;

        // For non-sloped text, place the editor from the same line-box anchor model used by render text,
        // so top/middle/bottom baselines are visually distinct.
        // if (!singleLine) {
        //     const textRectLeftScreen = canvasRect.left + ((rect.left + textPadding) * zoom) - pan.x;
        //     textRectTopScreen = canvasRect.top + ((rect.top + textPadding) * zoom) - pan.y;
        //     const textRectWidthScreen = Math.max(1, (rect.width - (textPadding * 2)) * zoom);
        //     textRectHeightScreen = Math.max(scaledLineHeight, (rect.height - (textPadding * 2)) * zoom);

        //     left = textRectLeftScreen;
        //     editorWidth = Math.max(24, textRectWidthScreen);

        //     const text = nodeText(node);
        //     const measureContext = this.context;
        //     measureContext.save();
        //     measureContext.font = fontFace.replace(/\d+(?:\.\d+)?px/, `${scaledFontSize}px`);
        //     const wrapped = this.wrapEditorTextLines(text, editorWidth, measureContext);
        //     measureContext.restore();

        //     const lineCount = Math.max(1, wrapped.length);
        //     const textBlockHeight = lineCount * scaledLineHeight;

        //     const startline = baseline === 'top'
        //         ? textRectTopScreen + (scaledFontSize / 2)
        //         : baseline === 'bottom'
        //             ? textRectTopScreen + textRectHeightScreen - (scaledLineHeight * (lineCount - 1))
        //             : textRectTopScreen + (scaledFontSize / 4) + (textRectHeightScreen / 2) - (scaledLineHeight * (lineCount - 1) / 2);

        //     const firstLineTop = baseline === 'top'
        //         ? startline
        //         : baseline === 'bottom'
        //             ? startline - scaledLineHeight
        //             : startline - (scaledLineHeight / 2);

        //     editorHeight = Math.max(scaledLineHeight, textBlockHeight);
        //     top = firstLineTop;
        // }

        // if (singleLine && node.points.length >= 2) {
        //     const seg = NodeBasics.longestSegment(node.points)!;
        //     // Normalise direction the same way the renderer does, so the normal always points "above" the line.
        //     const { from, to } = NodeBasics.normalizeLine(seg.from, seg.to);
        //     const angle = NodeBasics.calculateAngle(from, to);
        //     const fromScreen = worldToScreen(from.x, from.y);
        //     const toScreen = worldToScreen(to.x, to.y);
        //     const midScreen = { x: (fromScreen.x + toScreen.x) / 2, y: (fromScreen.y + toScreen.y) / 2 };

        //     // After normalisation the line is left-to-right, so (sin, -cos) points upward in canvas Y-down coords.
        //     const nx = Math.sin(angle);
        //     const ny = -Math.cos(angle);
        //     const offset = scaledLineHeight / 2;

        //     editorWidth = Math.max(24, NodeBasics.calculateLength(fromScreen, toScreen));
        //     editorHeight = scaledLineHeight;
        //     left = midScreen.x + nx * offset - editorWidth / 2;
        //     top = midScreen.y + ny * offset - editorHeight / 2;
        //     transform = `rotate(${angle}rad)`;
        // }

        // Decide where text should be placed:

        const placement = NodeRegistry.adapter(node.type)?.textPlacement(node);
        if (placement?.rect) {
            // Lines in a bounded rect

            rect = placement.rect;
            left = screenRect.left;
            editorWidth = Math.max(24, screenRect.width);

            const text = nodeText(node);
            const measureContext = this.context;
            measureContext.save();
            measureContext.font = [fontItalic, fontWeight, `${scaledFontSize}px`, fontFace].filter(Boolean).join(' ');
            const wrapped = this.wrapEditorTextLines(text, editorWidth, measureContext);
            measureContext.restore();

            const lineCount = Math.max(1, wrapped.length);
            const textBlockHeight = lineCount * scaledLineHeight;

            const startline = baseline === 'top'
                ? screenRect.top + (scaledFontSize / 2)
                : baseline === 'bottom'
                    ? screenRect.top + screenRect.height - (scaledLineHeight * (lineCount - 1))
                    : screenRect.top + (scaledFontSize / 4) + (screenRect.height / 2) - (scaledLineHeight * (lineCount - 1) / 2);

            const firstLineTop = baseline === 'top'
                ? startline
                : baseline === 'bottom'
                    ? startline - scaledLineHeight
                    : startline - (scaledLineHeight / 2);

            editorHeight = Math.max(scaledLineHeight, textBlockHeight);
            top = firstLineTop;

        } else if (placement?.segment) {
            // Text along a line segment

            rect = this.coordinates.getBoundingRect(node);

            // Normalise direction the same way the renderer does.
            const { from, to } = NodeBasics.normalizeLine(placement.segment.from, placement.segment.to);

            const worldToScreen = (x: number, y: number): IPoint => ({
                x: canvasRect.left + (x * zoom) - pan.x,
                y: canvasRect.top + (y * zoom) - pan.y,
            });

            const fromScreen = worldToScreen(from.x, from.y);
            const toScreen = worldToScreen(to.x, to.y);
            const midScreen = { x: (fromScreen.x + toScreen.x) / 2, y: (fromScreen.y + toScreen.y) / 2 };

            if (textOrientation(node) === 'path') {
                // Path label: rotate the textarea to follow the segment angle.
                const angle = NodeBasics.calculateAngle(from, to);
                const nx = Math.sin(angle);
                const ny = -Math.cos(angle);
                const offset = scaledLineHeight / 2;

                editorWidth = Math.max(24, NodeBasics.calculateLength(fromScreen, toScreen));
                editorHeight = scaledLineHeight;
                left = midScreen.x + nx * offset - editorWidth / 2;
                top = midScreen.y + ny * offset - editorHeight / 2;
                transform = `rotate(${angle}rad)`;

            } else if (textOrientation(node) === 'horizontal') {
                // Horizontal label: anchor at segment midpoint shifted up by half a line, no rotation.
                editorWidth = Math.max(80, NodeBasics.calculateLength(fromScreen, toScreen));
                editorHeight = scaledLineHeight;
                left = midScreen.x - editorWidth / 2;
                top = midScreen.y - editorHeight / 2;
                // transform stays undefined — no rotation on the textarea.

            } else {
                // Unknown orientation: fallback to horizontal.
                editorWidth = Math.max(80, NodeBasics.calculateLength(fromScreen, toScreen));
                editorHeight = scaledLineHeight;
                left = midScreen.x - editorWidth / 2;
                top = midScreen.y - editorHeight / 2;
            }
        } else {
            return;
        }

        // Now we have the data so we can create the textarea:

        const textarea = document.createElement('textarea');
        textarea.value = nodeText(node);
        textarea.rows = 1;
        textarea.spellcheck = false;
        textarea.autocomplete = 'off';
        textarea.wrap = singleLine ? 'off' : 'soft';
        textarea.style.position = 'fixed';
        textarea.style.left = `${left}px`;
        textarea.style.top = `${top}px`;
        textarea.style.width = `${editorWidth}px`;
        textarea.style.height = `${editorHeight}px`;
        textarea.style.boxSizing = 'border-box';
        textarea.style.margin = '0';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.overflow = 'hidden';
        textarea.style.whiteSpace = singleLine ? 'nowrap' : 'pre-wrap';
        textarea.style.background = 'transparent';
        textarea.style.color = strokeStyle(node);
        textarea.style.caretColor = 'currentColor';
        textarea.style.font = [fontItalic, fontWeight, `${scaledFontSize}px`, fontFace].filter(Boolean).join(' ');
        textarea.style.lineHeight = `${scaledLineHeight}px`;
        textarea.style.textAlign = textAlign(node);
        textarea.style.zIndex = '2147483647';
        textarea.style.cursor = 'text';

        // Rotate the textarea if required:

        if (transform) {
            // Sloped connector: textarea is already centered on the midpoint so center-center is correct.
            textarea.style.transformOrigin = 'center center';
            textarea.style.transform = transform;
        } else if (node.angle) {
            // Non-sloped rotated node: the textarea is inset from the node rect, so its center ≠ the node's
            // visual center. Set transform-origin explicitly to the node center in textarea-local coords so
            // rotation pivots on the right point.
            const nodeCenterX = canvasRect.left + ((rect.left + rect.width / 2) * zoom) - pan.x;
            const nodeCenterY = canvasRect.top + ((rect.top + rect.height / 2) * zoom) - pan.y;
            textarea.style.transformOrigin = `${nodeCenterX - left}px ${nodeCenterY - top}px`;
            textarea.style.transform = `rotate(${node.angle}rad)`;
        } else {
            textarea.style.transformOrigin = 'center center';
        }

        const originalText = textarea.value;
        node.text = ' ';
        this.render('all');
        this.canvas.style.cursor = 'text';

        document.body.appendChild(textarea);
        this.activeTextEditor = {
            element: textarea,
            nodeId: node.id,
            originalText,
            singleLine,
        };

        // Add behaviour to the textarea:

        const autosizeEditor = (): void => {
            if (singleLine) {
                return;
            }

            textarea.style.height = 'auto';
            const nextHeight = Math.max(scaledLineHeight, textarea.scrollHeight);
            textarea.style.height = `${nextHeight}px`;

            if (baseline === 'top') {
                textarea.style.top = `${screenRect.top + (scaledFontSize / 2)}px`;
            } else if (baseline === 'bottom') {
                textarea.style.top = `${screenRect.top + screenRect.height - nextHeight}px`;
            } else {
                textarea.style.top = `${screenRect.top + (scaledFontSize / 4) + (screenRect.height / 2) - (nextHeight / 2)}px`;
            }

            if (node.angle) {
                const nextTop = parseFloat(textarea.style.top);
                const nodeCenterX = canvasRect.left + ((rect.left + rect.width / 2) * zoom) - pan.x;
                const nodeCenterY = canvasRect.top + ((rect.top + rect.height / 2) * zoom) - pan.y;
                textarea.style.transformOrigin = `${nodeCenterX - left}px ${nodeCenterY - nextTop}px`;
            }
        };

        textarea.addEventListener('keydown', (event) => {
            event.stopPropagation();

            if (event.key === 'Enter' && (singleLine || (!event.ctrlKey && !event.metaKey && !event.shiftKey))) {
                event.preventDefault();
                this.closeTextEditor(true);
                return;
            }

            if (!singleLine && event.key === 'Enter' && (event.ctrlKey || event.metaKey || event.shiftKey)) {
                event.preventDefault();
                const start = textarea.selectionStart ?? textarea.value.length;
                const end = textarea.selectionEnd ?? textarea.value.length;
                const value = textarea.value;
                textarea.value = `${value.slice(0, start)}\n${value.slice(end)}`;
                const next = start + 1;
                textarea.selectionStart = next;
                textarea.selectionEnd = next;
                autosizeEditor();
                return;
            }

            if (singleLine && event.key === 'Enter') {
                event.preventDefault();
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                this.closeTextEditor(false);
            }
        });

        if (singleLine) {
            textarea.addEventListener('input', () => {
                const normalized = textarea.value.replace(/[\r\n]+/g, ' ');
                if (normalized !== textarea.value) {
                    textarea.value = normalized;
                }
            });
        } else {
            textarea.addEventListener('input', () => {
                autosizeEditor();
            });
        }

        textarea.addEventListener('blur', () => {
            this.closeTextEditor(true);
        });

        setTimeout(() => {
            autosizeEditor();
            textarea.focus();
            textarea.select();
        }, 50);
    }

    private closeTextEditor(commit: boolean): boolean {
        const editor = this.activeTextEditor;
        if (!editor) {
            return false;
        }

        this.activeTextEditor = undefined;

        if (commit) {
            const node = this.node(editor.nodeId);
            const nextText = editor.element.value;

            if (node) {
                if (editor.originalText !== nextText) {
                    this.addUndo();
                }
                node.text = nextText;
                this.settings.nodeText = nextText;
                this.render('all');
                this.renderPreview();
            }
        } else {
            const node = this.node(editor.nodeId);
            if (node) {
                node.text = editor.originalText;
                this.settings.nodeText = editor.originalText;
                this.render('all');
                this.renderPreview();
            }
        }

        editor.element.remove();
        this.canvas.focus?.();
        this.canvas.style.cursor = 'default';
        this.setInteractionHint(undefined);

        return true;
    }

    private updateInteractionHintForHandle(handle: NodeHandle): void {
        switch (handle) {
            case NodeHandle.MOVE:
                this.setInteractionHint('Dragging selection');
                break;
            case NodeHandle.POINT:
                this.setInteractionHint('Dragging point');
                break;
            case NodeHandle.ALTER:
                this.setInteractionHint('Altering shape geometry');
                break;
            case NodeHandle.ROTATE:
                this.setInteractionHint('Rotating selection');
                break;
            case NodeHandle.N:
            case NodeHandle.S:
            case NodeHandle.E:
            case NodeHandle.W:
            case NodeHandle.NE:
            case NodeHandle.NW:
            case NodeHandle.SE:
            case NodeHandle.SW:
                this.setInteractionHint('Resizing selection');
                break;
            default:
                this.setInteractionHint(undefined);
                break;
        }
    }

    private setInteractionHint(hint: string | undefined): void {
        if (this.interactionHint === hint) {
            return;
        }

        this.interactionHint = hint;
        this.eventDispatcher.hintChanged({
            source: 'diagram-interaction',
            hint,
            active: !!hint,
        });
    }

    private wrapEditorTextLines(text: string, maxWidth: number, context: CanvasRenderingContext2D): string[] {
        const sourceLines = (text || '').split('\n');
        const lines: string[] = [];

        for (const src of sourceLines) {
            const words = src.split(' ');
            let currentLine = words[0] ?? '';

            for (let i = 1; i < words.length; i++) {
                const word = words[i] ?? '';
                const trial = `${currentLine} ${word}`;
                if (context.measureText(trial).width < maxWidth) {
                    currentLine = trial;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }

            lines.push(currentLine);
        }

        return lines;
    }

    private normalizeRect(start: IPoint, end: IPoint): IRect {
        let from = this.getCoordinates().getPoint(start.x, start.y, 'ignore_grid');
        let to = this.getCoordinates().getPoint(end.x, end.y, 'ignore_grid');

        let topleft = {
            x: Math.min(from.x, to.x),
            y: Math.min(from.y, to.y)
        }
        let bottomright = {
            x: Math.max(from.x, to.x),
            y: Math.max(from.y, to.y)
        }
        return {
            left: topleft.x,
            top: topleft.y,
            width: bottomright.x - topleft.x,
            height: bottomright.y - topleft.y
        }
    }

    private renderSelectionRect(rect: IRect): void {
        let context = this.context;
        const coordinates = this.getCoordinates();

        context.save();
        coordinates.applyViewportTransform(context);
        context.strokeStyle = DiagramConstants.SELECTION_RECT_STROKESTYLE;  //  'rgba(0,0,0,.5)';
        context.fillStyle = DiagramConstants.SELECTION_RECT_FILLSTYLE;  //  'rgba(0,0,0,.05)';
        context.lineWidth = 1 / coordinates.zoom;
        // context.setLineDash([2,2,1,2]);
        context.setLineDash([4, 4]);
        let path = new Path2D();
        path.rect(rect.left, rect.top, rect.width, rect.height);
        context.fill(path);
        context.stroke(path);
        context.restore();
    }

    private applyRectSelection(rect: IRect, additive: boolean): void {
        const selected = SelectionBasics.nodesForRect(this.selectionAdapter(), rect, this.selectionOptions.rect_mode);

        if (additive) {
            const distinct = new Set([...this.selection(), ...selected]);
            // Handle groups
            for (const node of selected) {
                const group_nodes = GroupBasics.relatedNodes(node, this);
                for (const related of group_nodes) {
                    distinct.add(related);
                }
            }
            this.setSelection([...distinct]);

            // Without considering groups, we can just do this:
            // this.setSelection([...this.selection(), ...selected]);

        } else {
            const distinct = new Set(selected);
            // Handle groups
            for (const node of selected) {
                const group_nodes = GroupBasics.relatedNodes(node, this);
                for (const related of group_nodes) {
                    distinct.add(related);
                }
            }
            this.setSelection([...distinct]);

            // Without considering groups, we can just do this:
            // this.setSelection(selected);
        }
    }

    private selectionAdapter() {
        return {
            layers: this.layers,
            grid: this.grid,
            node: (id: string) => this.node(id),
            hitNodes: (x: number, y: number) => this.hitNodes(x, y),
            getCoordinates: () => this.getCoordinates(),
        };
    }

    public moveSelected(byX: number, byY: number): void {
        const nodes = this.selection();
        if (!nodes.length) {
            this.guides = [];
            this.pendingGuideSnap = undefined;
            return;
        }

        for (const node of nodes) {
            NodeBasics.moveBy(node, byX, byY);
        }

        this.guides = [];
        this.pendingGuideSnap = undefined;
        const useGuides = this.guideOptions?.render || this.guideOptions?.snap;
        if (useGuides) {

            const guideResult = Guides.computeResult({
                diagram: this,
                nodes,
                byX,
                byY,
                downShapeId: this.downShape?.id,
            });

            if (guideResult) {
                this.pendingGuideSnap = this.guideOptions.snap ? guideResult : undefined;
                this.guides = this.guideOptions.render ? guideResult.guides : [];
            }
        }

        // Store the moved nodes so we can emit events later. We only want to emit events for nodes that are not locked.
        for (const node of this.selection()) {
            if (!isLocked(node)) {
                this.movedNodes.add(node);
            }
        }
        this.render('all');
        this.renderPreview();
    }

    public moveSelectedWithUndo(byX: number, byY: number): void {
        if (!this.selection().length) {
            return;
        }

        this.addUndo();
        this.moveSelected(byX, byY);

        this.emitPendingMutationEvents();
    }

    private resizeSelected(handle: NodeHandle, byX: number, byY: number, reference_node: INode, preserveAspect?: boolean): void {
        const nodes = this.selection();
        if (!nodes.length) {
            this.guides = [];
            this.pendingGuideSnap = undefined;
            return;
        }

        // Handle groups

        const group = this.nodeGroup(reference_node);
        if (group) {
            const owner = this.groupOwner(group);
            if (owner !== reference_node) {
                // Resizing a node inside a container only resizes that node, not the whole group.
                // The group will resize when the container node is resized. 
                NodeBasics.resizeHandle(reference_node, handle, byX, byY, preserveAspect);
                NodeRegistry.adapter(reference_node.type)?.afterResize?.(reference_node, handle);
                return;
            }
        }

        // Resize nodes proportionally

        const baseRect = this.coordinates.getBoundingRect(reference_node);

        for (const node of nodes) {
            let relX = byX;
            let relY = byY;
            if (node !== reference_node) {
                // calculate relative resize amounts based on the reference node's bounding rect
                const nodeRect = this.coordinates.getBoundingRect(node);
                relX = byX * (nodeRect.width / baseRect.width);
                relY = byY * (nodeRect.height / baseRect.height);
            }

            NodeBasics.resizeHandle(node, handle, relX, relY, preserveAspect);
            NodeRegistry.adapter(node.type)?.afterResize?.(node, handle);
        }

        this.guides = [];
        this.pendingGuideSnap = undefined;
        const useGuides = this.guideOptions?.render || this.guideOptions?.snap;
        if (useGuides) {

            const guideResult = Guides.computeResult({
                diagram: this,
                nodes,
                byX,
                byY,
                downShapeId: this.downShape?.id,
            });

            if (guideResult) {
                this.pendingGuideSnap = this.guideOptions.snap ? guideResult : undefined;
                this.guides = this.guideOptions.render ? guideResult.guides : [];
            }
        }
    }

    private applyPendingGuideSnap(nodes: INode[], handle: NodeHandle, preserveAspect?: boolean): void {
        if (!this.guideOptions.snap) {
            return;
        }
        void Guides.applyPendingToNodes({
            diagram: this,
            snap: this.pendingGuideSnap,
            handle,
            nodes: nodes,   // this.selection(),
            preserveAspect,
        });
    }

    private applyPendingGuideGroupSnap(group: IGroup, owner: INode): void {
        const dx = this.pendingGuideSnap?.dx ?? 0;
        const dy = this.pendingGuideSnap?.dy ?? 0;
        for (const member_id of group.nodes) {
            const member = (member_id !== owner.id) ? this.node(member_id) : undefined;
            if (member) {
                NodeBasics.moveBy(member, dx, dy);
                this.movedNodes.add(member);
            }
        }
    }

    private moveSelectedPoint(node: INode, x: number, y: number, byX: number, byY: number): void {
        const rect = this.coordinates.getBoundingRect(node);
        const cached = this.getCache().getNode(node);
        const hit = this.coordinates.getHitPoint({ x, y }, rect, nodeAngle(node), cached?.cos, cached?.sin);
        const deltaX = byX / this.coordinates.zoom;
        const deltaY = byY / this.coordinates.zoom;

        for (const point of node.points) {
            if (Math.abs(point.x - hit.x) <= 4 && Math.abs(point.y - hit.y) <= 4) {
                point.x += deltaX;
                point.y += deltaY;
                return;
            }
        }
    }

    private emitPendingMutationEvents(): void {
        for (const node of this.movedNodes) {
            this.emitNodeMoved(node);
        }
        for (const node of this.resizedNodes) {
            this.emitNodeResized(node);
        }
        for (const node of this.pointChangedNodes) {
            this.emitNodePointsChanged(node);
        }
        for (const node of this.alteredNodes) {
            this.emitNodeGeometryAltered(node);
        }

        this.movedNodes.clear();
        this.resizedNodes.clear();
        this.pointChangedNodes.clear();
        this.alteredNodes.clear();
    }

    private emitNodeAdded(node: INode): void {
        this.eventDispatcher.nodeAdded({
            node,
            nodeId: node.id,
        });
    }

    private emitNodeDeleted(node: INode): void {
        this.eventDispatcher.nodeDeleted({
            node,
            nodeId: node.id,
        });
    }

    private emitNodeMoved(node: INode): void {
        this.eventDispatcher.nodeMoved({
            node,
            nodeId: node.id,
        });
    }

    private emitNodeResized(node: INode): void {
        this.eventDispatcher.nodeResized({
            node,
            nodeId: node.id,
        });
    }

    private emitNodeGeometryAltered(node: INode): void {
        this.eventDispatcher.nodeGeometryAltered({
            node,
            nodeId: node.id,
        });
    }

    private emitNodePointsChanged(node: INode): void {
        this.eventDispatcher.nodePointsChanged({
            node,
            nodeId: node.id,
        });
    }

    private emitConnectionConnected(node: INode & IConnection): void {
        this.eventDispatcher.connectionConnected({
            node,
            nodeId: node.id,
            from: node.from,
            to: node.to,
        });
    }

    private emitConnectionDisconnected(node: INode & IConnection): void {
        this.eventDispatcher.connectionDisconnected({
            node,
            nodeId: node.id,
            from: node.from,
            to: node.to,
        });
    }

    private emitConnectionChanges(node: INode & IConnection, before?: { from?: string; to?: string }): void {
        const after = this.captureConnectionState(node);
        if (!before || (before.from === after.from && before.to === after.to)) {
            return;
        }

        if (before.from || before.to) {
            this.emitConnectionDisconnected(node);
        }
        if (node.from || node.to) {
            this.emitConnectionConnected(node);
        }
    }

    private captureConnectionState(node: INode & IConnection): { node: INode & IConnection; from?: string; to?: string } {
        return {
            node,
            from: this.anchorSignature(node.from),
            to: this.anchorSignature(node.to),
        };
    }

    private anchorSignature(anchor?: IConnectionAnchor): string | undefined {
        if (!anchor) {
            return undefined;
        }

        const nodeId = typeof anchor.node === 'string' ? anchor.node : anchor.node.id;
        return [nodeId, anchor.handle, anchor.point ?? '', anchor.xOffset ?? '', anchor.yOffset ?? ''].join(':');
    }

    private connectionTargetsNode(anchor: IConnectionAnchor | undefined, nodeId: string): boolean {
        if (!anchor) {
            return false;
        }

        return (typeof anchor.node === 'string' ? anchor.node : anchor.node.id) === nodeId;
    }

    private reflectStyles(shape: INode): void {
        if (shape) {
            this.settings.lineWidth = shape.lineWidth || 1;
            this.settings.strokeColor = shape.strokeStyle;
            this.settings.fillColor = shape.fillStyle || 'transparent';
            this.settings.textColor = shape.textStyle?.color || shape.strokeStyle || '#111827';
            this.settings.textOrientation = textOrientation(shape);
            this.settings.textWeight = shape.textStyle?.weight || NORMAL_FONT_WEIGHT;
            this.settings.textItalic = shape.textStyle?.italic || false;
            this.settings.textHalo = shape.textStyle?.halo || 'transparent';

            const default_font = DiagramConstants.DEFAULT_NODE_FONT_FACE;
            const default_size = DiagramConstants.DEFAULT_NODE_FONT_SIZE;
            this.settings.fontFace = shape.textStyle?.fontFace || default_font;
            this.settings.fontSize = shape.textStyle?.size || default_size;

            this.settings.nodeText = shape.text || '';

            this.settings.shadowColor = (shape.shadowStyle ?? DiagramConstants.NO_SHADOW).color ?? 'transparent';
            this.settings.shadowBlur = (shape.shadowStyle ?? DiagramConstants.NO_SHADOW).blur;
            this.settings.shadowOffsetX = (shape.shadowStyle ?? DiagramConstants.NO_SHADOW).offset.x;
            this.settings.shadowOffsetY = (shape.shadowStyle ?? DiagramConstants.NO_SHADOW).offset.y;

            if (isConnection(shape)) {
                this.settings.arrow = shape.arrow || 'end';
            }
            // this.settings.labelOrientation = labelOrientation(shape);
        }
    }

    // ========================================
    // ====== Image management methods ======
    // ========================================

    // /**
    //  * Exports the diagram image data.
    //  * @returns Image payload with data URL and dimensions, or null when unavailable.
    //  */
    // public getImage(): { dataurl: string, width: number, height: number } | null {

    //     if (!this.model || !this.canvas) return null;

    //     let target = this.canvas? this.canvas.nativeElement : null;
    //     if (!target) return null;

    //     let w = target.width;
    //     let h = target.height;

    //     // Draw all layers on one canvas..
    //     let full = new FullPreview();
    //     let ok = full.renderFull(this.model, target);

    //     if (!ok) return null;
    //     // let context = target.getContext('2d');
    //     // this.model.render(context);
    //     let src = target.toDataURL();

    //     // Clear after export..
    //     target.width = w;
    //     target.height = h;

    //     return {dataurl: src, width: full.width || 400, height: full.height || 300};
    // }

    /**
     * Opens SVG tool/image selection workflow.
     */
    public pickSVG(): void {
        // let ref = this.dialog.open(StencilDialog, {});
        // ref.afterClosed().subscribe(choice => {
        //     if (choice && choice.tool) {
        //         // let src = (choice.tool as StencilTool).url;
        //         this.pickTool('svg', choice.tool);
        //         // if (this.current.shape) {
        //         //     this.current.shape.setImage(src, 'contain');
        //         // }
        //     } else {
        //         this.pickTool('select');
        //     }
        // })
    }

    /**
     * Opens image selection workflow for the current node selection.
     */
    public pickNodeImage(): void {
        if (!this.current.layer) return;

        // if (this.imageFileInput && this.imageFileInput.nativeElement) {
        //     this.imageFileInput.nativeElement.click();
        // }
    }

    /**
     * Applies a selected image file to the current node selection.
     * @param event File input event or undefined to trigger picker flow.
     */
    public setNodeImage(event?: any): void {
        if (!event) {
            this.pickNodeImage();
            return;
        }
        const file: File = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (!this.current.layer) return;

                if (this.current.tool === 'svg') {
                    this.current.toolOptions = {
                        ...this.current.toolOptions,
                        url: reader.result + '',
                    };
                }

                this.setSelectedNodeImageSource(reader.result + '', 'contain', undefined);

                this.renderPreview();
            };
        }
    }

    /**
     * Applies an image source to all currently selected nodes.
     */
    public setSelectedNodeImageSource(imageSrc: string, mode: ImageMode = 'contain', imageId?: string): void {
        if (!imageSrc) {
            return;
        }

        const selected = this.selection();
        if (!selected.length) {
            return;
        }

        this.addUndo();

        for (const node of selected) {
            this.setNodeImageSource(node, imageSrc, mode, imageId);
        }
    }

    /**
     * Applies SVG markup or source URL/data URL to all currently selected nodes.
     */
    public setSelectedNodeSvgSource(svgOrSrc: string, mode: ImageMode = 'contain', imageId?: string): void {
        if (!svgOrSrc) {
            return;
        }

        const selectedSvg = this.selection().find(node => node.type === 'svg');
        if (!selectedSvg) {
            return;
        }

        this.addUndo();

        this.setNodeSvgSource(selectedSvg, svgOrSrc, mode, imageId);
    }

    /**
     * Clears image source configuration from all currently selected nodes.
     */
    public clearSelectedNodeImageSource(): void {
        const selected = this.selection();
        if (!selected.length) {
            return;
        }

        this.addUndo();
        for (const node of selected) {
            this.clearNodeImageSource(node);
        }
    }


    // =========================================
    // ====== Preview and export methods ======
    // =========================================

    /*public async getPreviewNode(): Promise<HTMLElement | null> {
        if (!this.model)
            return new Promise<null>(resolve => resolve(null));

        // async getNode(node: HTMLElement, expr: FormulaExpression): Promise<HTMLElement> {
        let capture = this.canvas_parent ? this.canvas_parent.nativeElement : null;
        if (!capture)
            return new Promise<null>(resolve => resolve(null));

        let outer = document.createElement('div');
        outer.className = 'illustration-view';

        let inner = document.createElement('div');
        inner.className = 'source';
        inner.style.display = 'none';
        inner.innerText = JSON.stringify(this.model.toJson('include_assets'));
        outer.appendChild(inner);

        let img = document.createElement('img');
        // let rect = capture.getBoundingClientRect();
        let data = this.getImage();
        if (!data) return null;     // Invalid image..

        img.width = data.width;
        img.height = data.height;
        // let svg = await this.getImageSVG(node, rect.width, rect.height);
        // img.src = svg;
        // let png = await this.getImagePNG(capture, rect.width, rect.height);
        img.src = data.dataurl;   //png;

        // let blob = await toBlob(node);
        // if (blob && blob.size) {
        //     img.src = await this.toDataURL(blob);
        // }
        // let canvas = await html2canvas.default(node, {backgroundColor: 'rgba(0,0,0,0)', allowTaint: true});
        // if (canvas) img.src = canvas.toDataURL('image/png');
        // .then(canvas => {
        //     img.src = canvas.toDataURL('image/png', {});
        // })
        // toPng(node, {bgcolor: 'transparent'}).then(str => {
        //     img.src = str;
        // })
        outer.appendChild(img);

        return outer;
    }
        */

    /*async getImagePNG(node: HTMLElement, w: number, h: number): Promise<string> {
        // return await toPng(node, {bgcolor: 'transparent', width: w, height: h})
        let scale = 2;
        return await toPng(node, {bgcolor: 'transparent', 
            height: node.offsetHeight * scale,
            width: node.offsetWidth * scale,
            style: {
                transform: "scale(" + scale + ")",
                transformOrigin: "top left",
                width: node.offsetWidth + "px",
                height: node.offsetHeight + "px"
            }
        })
    }*/



    /* doOpen(event) {
        const file: File = event.target.files[0];

        if (file) {
            // let mime = this.fileProvider.getMimeType(file.name);
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = async () => {
                try {
                    if (!this.canvas) return;

                    let json = JSON.parse('' + reader.result);

                    if (this.model) this.model.clearLayers();

                    this.model = await new StateDiagram(this.canvas.nativeElement).fromJson(json) as StateDiagram;

                    if (this.model.layers.length == 0) {
                        this.addLayer();        //model.addLayer('top');
                    }
                    this.colorPalette.extractColors(this.model);
                    this.current.layer = this.model.layers[0];

                    this.modified = false;
                    this.history?.clear();
                    // this.undoList = [];
                    // this.redoList = [];

                    setTimeout(() => {
                        this.reposition();
                        this.model?.render(null);
                        this.model?.renderSelection();
                        this.renderPreview();

                    }, 100)

                } catch (err) { }
            };
        }
    }

    download(content: string | Blob, fileName: string, contentType: string, anchor: string) {
        const a: HTMLAnchorElement = document.getElementById(anchor) as HTMLAnchorElement;
        const file = (content instanceof Blob) ? content : new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    doSave() {
        if (!this.model) return;

        let data = JSON.stringify(this.model?.toJson('include_assets'));

        if (!this.onSave.observed) {

            this.download(data,
                'Illustration' + '.json',
                'application/json',
                'ied_jsondownload');
        }

        this.onSave.emit(this.model);
    }

    doExportPng(): void {
        // if (!this.model) return;

        // let target = document.createElement('canvas');  // this.canvas.nativeElement;

        // // Draw all layers on one canvas..
        // let full = new FullPreview();
        // let ok = full.renderFull(this.model, target);

        // if (!ok) return;
        // // let context = target.getContext('2d');
        // // this.model.render(context);
        // target.toBlob((blob) => {
        //     if (!blob) return;

        //     this.download(blob,
        //         'Illustration' + '.png', 
        //         'image/png', 
        //         'ied_pngdownload');
        // });

        // target.remove();
    }


    is_fullscreen: boolean = false;

    fullScreen() {
        let studio = this.elementRef.nativeElement;
        studio.requestFullscreen();
    }

    exitFullScreen() {
        document.exitFullscreen();
    }
    */


    // ==========================================
    // ======== Animation methods (experimental) ==========
    // ==========================================

    /*animateLayer(layer: ILayer, visible_class: string, hidden_class: string) {
        if (layer && layer.animation) {
            layer.animation.visible_class = visible_class;
            layer.animation.hidden_class = hidden_class || 'out';

            layer.show();
        }

        // if (layer && layer.canvas) {
        //     for(let type in LayerAnimationType) {
        //         layer.canvas.classList.remove(type.toLowerCase());
        //     }
        //     layer.canvas.classList.add('normal-speed');
        //     layer.canvas.classList.add(visible_class);
        // }
    }

    setLayerStep(layer: ILayer, step: number) {
        layer.playStep = step;
    }

    playing: boolean = false;
    play_step: number = 0;

    play() {
        if (!this.model) return;

        if (this.playing) {
            this.stop();
        } else {
            this.reposition();
            // if (this.player_parent && this.canvas) try {
            //     let h = this.canvas.nativeElement.getBoundingClientRect().height;
            //     this.player_parent.nativeElement.style.height.px = h;
            // } catch(e) {}

            // if (this.player_preview) {
            //     this.player_preview.load( this.model.toJson('include_assets') );
            //     setTimeout(() => {
            //         this.player_preview?.play();
            //     })
            //     this.play_step = 0;
            //     this.playing = true;
            // }
        }
    }

    stop() {
        this.play_step = 0;
        this.playing = false;
    }

    /**
     * Opens the actions dialog for the currently selected node.
     */
    public showActions(): void {
        // if (!this.model) return;

        // let selected = this.model.selection();
        // if (selected.length != 1) return;

        // let ref = this.dialog.open(IllustrationActionDialog, {
        //     data: {
        //         model: this.model,
        //         shape: selected[0],
        //     },
        //     autoFocus: false,
        //     panelClass: 'illustration-action-dialog'
        // })
        // ref.afterClosed().subscribe((result) => {
        //     if (result && result.shape) {
        //         // copy actions from shape to selection if necessary..
        //         this.model?.render(null);
        //         this.model?.renderSelection();
        //     }
        // })
    }

    // editState(shape: StateRect | any) {
    //     if (!this.model) return;

    //     if (!shape.state) {
    //         let selected = this.model.selection();
    //         if (selected.length != 1) return;
    //         if (selected[0]['state']) shape = selected[0] as StateRect;
    //     }

    //     let ref = this.dialog.open(StateDialog, {
    //         data: {
    //             diagram: this.model,
    //             shape: shape,
    //         },
    //         autoFocus: false,
    //         panelClass: 'state-dialog'
    //     })
    //     ref.afterClosed().subscribe((result) => {
    //         if (result && result.state) {
    //             // copy actions from shape to selection if necessary..

    //             this.model?.render(null);
    //             this.model?.renderSelection();
    //         }
    //     })
    // }

    // editTransition(shape: TransitionLine | any) {
    //     if (!this.model) return;

    //     if (!shape.transition) {
    //         let selected = this.model.selection();
    //         if (selected.length != 1) return;
    //         if (selected[0]['transition']) shape = selected[0] as TransitionLine;
    //     }


    //     let ref = this.dialog.open(TransitionDialog, {
    //         data: {
    //             diagram: this.model,
    //             shape: shape,
    //         },
    //         autoFocus: false,
    //         panelClass: 'transition-dialog'
    //     })
    //     ref.afterClosed().subscribe((result) => {
    //         if (result && result.transition) {
    //             // copy actions from shape to selection if necessary..
    //             this.model?.render(null);
    //             this.model?.renderSelection();
    //         }
    //     })
    // }

    // previewLink(event: { uri: string, html?: string }) {
    //     if (event && event.uri) {
    //         if (event.uri.includes('://')) {
    //             // AppComponent.instance.openUrl(event.uri);
    //         } else if (event.html) {
    //             this.snackbar.open(event.html);
    //         }
    //     }
    // }

}