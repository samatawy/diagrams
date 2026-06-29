import type { ShadowStyle } from "../style.interfaces";
import type { ITextAlign, ITextBaseline, ITextOrientation } from "../types";

// ========= Zoom ==========

export const MIN_ZOOM = 'MIN_ZOOM';
export const MAX_ZOOM = 'MAX_ZOOM';

// ========= Grid and Guides ==========

export const GRID_LINE_COLOR = 'GRID_LINE_COLOR';
export const GRID_CELL_WIDTH = 'GRID_CELL_WIDTH';
export const GRID_CELL_HEIGHT = 'GRID_CELL_HEIGHT';
export const GUIDE_STROKE_STYLE = 'GUIDE_STROKE_STYLE';

// ======== Layout ==========

export const FIT_IMAGE_PADDING = 'FIT_IMAGE_PADDING';
export const EXPORT_IMAGE_PADDING = 'EXPORT_IMAGE_PADDING';
export const EXPORT_IMAGE_BACKGROUND_COLOR = 'EXPORT_IMAGE_BACKGROUND_COLOR';
export const CANVAS_BACKGROUND_COLOR = 'CANVAS_BACKGROUND_COLOR';

// ========= Selection ==========

export const SELECTION_ANCHOR_STROKESTYLE = 'SELECTION_ANCHOR_STROKESTYLE';
export const SELECTION_ANCHOR_FILLSTYLE = 'SELECTION_ANCHOR_FILLSTYLE';
export const SELECTION_RECT_STROKESTYLE = 'SELECTION_RECT_STROKESTYLE';
export const SELECTION_RECT_FILLSTYLE = 'SELECTION_RECT_FILLSTYLE';
export const SELECTION_RECT_LINEWIDTH = 'SELECTION_RECT_LINEWIDTH';
export const SELECTION_HANDLE_SIZE = 'SELECTION_HANDLE_SIZE';
export const PATH_HIT_PADDING = 'PATH_HIT_PADDING';
export const HANDLE_HIT_EPSILON = 'HANDLE_HIT_EPSILON';

// ========= Node Defaults ==========

export const DEFAULT_STROKE_STYLE = 'DEFAULT_STROKE_STYLE';
export const DEFAULT_FILL_STYLE = 'DEFAULT_FILL_STYLE';
export const DEFAULT_NODE_TEXT_COLOR = 'DEFAULT_NODE_TEXT_COLOR';
export const DEFAULT_NODE_TEXT_ALIGN = 'DEFAULT_NODE_TEXT_ALIGN';
export const DEFAULT_NODE_TEXT_BASELINE = 'DEFAULT_NODE_TEXT_BASELINE';
export const DEFAULT_NODE_CORNER_RADIUS = 'DEFAULT_NODE_CORNER_RADIUS';
export const DEFAULT_NODE_FONT_FACE = 'DEFAULT_NODE_FONT_FACE';
export const DEFAULT_NODE_FONT_SIZE = 'DEFAULT_NODE_FONT_SIZE';
export const DEFAULT_TEXT_PADDING = 'DEFAULT_TEXT_PADDING';
export const DEFAULT_NODE_LINE_WIDTH = 'DEFAULT_NODE_LINE_WIDTH';
export const DEFAULT_NODE_TRANSPARENT = 'DEFAULT_NODE_TRANSPARENT';
export const DEFAULT_TEXT_ORIENTATION = 'DEFAULT_TEXT_ORIENTATION';

// ========= Shadows ==========

export const ICON_SIZE = 'ICON_SIZE';

/**
 * DiagramConstants is a utility class that provides access to various constants used throughout the diagramming application.
 * It allows for getting and setting constant values, as well as resetting them to their default values.
 * Constants include settings for zoom, grid, layout, selection, node defaults, shadows, and icons.
 * The class supports overrides for specific constants while maintaining default values for others.
 */
export class DiagramConstants {

    protected static overrides: Record<string, any> = {};

    protected static defaults: Record<string, any> = {
        // ========== Zoom ==========

        MIN_ZOOM: 0.2,
        MAX_ZOOM: 4,

        // ========== Grid and Guides ==========

        GRID_LINE_COLOR: '#c0c0c0',
        GRID_CELL_WIDTH: 16,
        GRID_CELL_HEIGHT: 16,
        GUIDE_STROKE_STYLE: 'rgba(0, 0, 255, 0.8)',

        // ========== Layout ==========

        FIT_IMAGE_PADDING: 32,
        EXPORT_IMAGE_PADDING: 16,
        EXPORT_IMAGE_BACKGROUND_COLOR: '#ffffff',
        CANVAS_BACKGROUND_COLOR: '#faf8f2',

        // ========== Selection ==========

        SELECTION_ANCHOR_STROKESTYLE: 'rgba(0, 0, 0, 0.5)',
        SELECTION_ANCHOR_FILLSTYLE: 'rgba(0, 0, 0, 0.05)',
        SELECTION_RECT_STROKESTYLE: 'rgba(0, 0, 0, 0.5)',
        SELECTION_RECT_FILLSTYLE: 'rgba(0, 0, 0, 0.05)',
        SELECTION_RECT_LINEWIDTH: 1,
        SELECTION_HANDLE_SIZE: 8,
        PATH_HIT_PADDING: 8,
        HANDLE_HIT_EPSILON: 4,

        // ========== Node Defaults ==========

        DEFAULT_STROKE_STYLE: '#000000',
        DEFAULT_FILL_STYLE: '#e8e8e864',
        DEFAULT_NODE_TEXT_COLOR: '#000000',
        DEFAULT_NODE_TEXT_ALIGN: 'center',
        DEFAULT_NODE_TEXT_BASELINE: 'middle',
        DEFAULT_NODE_CORNER_RADIUS: 5,
        DEFAULT_NODE_FONT_FACE: 'system-ui',
        DEFAULT_NODE_FONT_SIZE: 14,
        DEFAULT_TEXT_PADDING: 4,
        DEFAULT_NODE_LINE_WIDTH: 1,
        DEFAULT_NODE_TRANSPARENT: false,
        DEFAULT_TEXT_ORIENTATION: 'horizontal',

        // ========== Shadows ==========
        NO_SHADOW: { name: 'No Shadow', color: 'transparent', blur: 0, offset: { x: 0, y: 0 } },
        // DEFAULT_SHADOW: { name: 'Shadow', color: 'inherit', blur: 8, offset: { x: 4, y: 4 } },

        LOW_SHADOW: { name: 'Low Shadow', color: 'rgba(0, 0, 0, 0.3)', blur: 4, offset: { x: 4, y: 4 } },
        MEDIUM_SHADOW: { name: 'Medium Shadow', color: 'rgba(0, 0, 0, 0.4)', blur: 7, offset: { x: 6, y: 6 } },
        HIGH_SHADOW: { name: 'High Shadow', color: 'rgba(0, 0, 0, 0.5)', blur: 10, offset: { x: 8, y: 8 } },

        LOW_COLOR_SHADOW: { name: 'Low Shadow', color: 'inherit', blur: 4, offset: { x: 4, y: 4 } },
        MEDIUM_COLOR_SHADOW: { name: 'Medium Shadow', color: 'inherit', blur: 7, offset: { x: 6, y: 6 } },
        HIGH_COLOR_SHADOW: { name: 'High Shadow', color: 'inherit', blur: 10, offset: { x: 8, y: 8 } },

        // ========== Icons ==========
        ICON_SIZE: 18,
    };

    public static set(key: string, value: any): void {
        this.overrides[key] = value;
    }

    public static unset(key: string): void {
        delete this.overrides[key];
    }

    public static reset(): void {
        this.overrides = {};
    }

    public static get(key: string): any {
        return this.overrides[key] ?? this.getDefault(key);
    }

    public static getDefault(key: string): any {
        return this.defaults[key];
    }

    // ========== Zoom ==========

    public static get MIN_ZOOM(): number {
        return this.get(MIN_ZOOM);
    }

    public static get MAX_ZOOM(): number {
        return this.get(MAX_ZOOM);
    }

    // ========== Grid and Guides ==========

    public static get GRID_LINE_COLOR(): string {
        return this.get(GRID_LINE_COLOR);
    }

    public static get GRID_CELL_WIDTH(): number {
        return this.get(GRID_CELL_WIDTH);
    }

    public static get GRID_CELL_HEIGHT(): number {
        return this.get(GRID_CELL_HEIGHT);
    }

    public static get GUIDE_STROKE_STYLE(): string {
        return this.get(GUIDE_STROKE_STYLE);
    }

    // ========== Layout ==========

    public static get FIT_IMAGE_PADDING(): number {
        return this.get(FIT_IMAGE_PADDING);
    }

    public static get EXPORT_IMAGE_PADDING(): number {
        return this.get(EXPORT_IMAGE_PADDING);
    }

    public static get EXPORT_IMAGE_BACKGROUND_COLOR(): string {
        return this.get(EXPORT_IMAGE_BACKGROUND_COLOR);
    }

    public static get CANVAS_BACKGROUND_COLOR(): string {
        return this.get(CANVAS_BACKGROUND_COLOR);
    }

    // ========== Selection ==========

    public static get SELECTION_ANCHOR_STROKESTYLE(): string {
        return this.get(SELECTION_ANCHOR_STROKESTYLE);
    }

    public static get SELECTION_ANCHOR_FILLSTYLE(): string {
        return this.get(SELECTION_ANCHOR_FILLSTYLE);
    }

    public static get SELECTION_RECT_STROKESTYLE(): string {
        return this.get(SELECTION_RECT_STROKESTYLE);
    }

    public static get SELECTION_RECT_FILLSTYLE(): string {
        return this.get(SELECTION_RECT_FILLSTYLE);
    }

    public static get SELECTION_RECT_LINEWIDTH(): number {
        return this.get(SELECTION_RECT_LINEWIDTH);
    }

    public static get SELECTION_HANDLE_SIZE(): number {
        return this.get(SELECTION_HANDLE_SIZE);
    }

    public static get PATH_HIT_PADDING(): number {
        return this.get(PATH_HIT_PADDING);
    }

    public static get HANDLE_HIT_EPSILON(): number {
        return this.get(HANDLE_HIT_EPSILON);
    }

    // ========== Node Defaults ==========

    public static get DEFAULT_STROKE_STYLE(): string {
        return this.get(DEFAULT_STROKE_STYLE);
    }

    public static get DEFAULT_FILL_STYLE(): string {
        return this.get(DEFAULT_FILL_STYLE);
    }

    public static get DEFAULT_NODE_TEXT_COLOR(): string {
        return this.get(DEFAULT_NODE_TEXT_COLOR);
    }

    public static get DEFAULT_NODE_TEXT_ALIGN(): ITextAlign {
        return this.get(DEFAULT_NODE_TEXT_ALIGN);
    }

    public static get DEFAULT_NODE_TEXT_BASELINE(): ITextBaseline {
        return this.get(DEFAULT_NODE_TEXT_BASELINE);
    }

    public static get DEFAULT_NODE_CORNER_RADIUS(): number {
        return this.get(DEFAULT_NODE_CORNER_RADIUS);
    }

    public static get DEFAULT_NODE_FONT_FACE(): string {
        return this.get(DEFAULT_NODE_FONT_FACE);
    }

    public static get DEFAULT_NODE_FONT_SIZE(): number {
        return this.get(DEFAULT_NODE_FONT_SIZE);
    }

    public static get DEFAULT_TEXT_PADDING(): number {
        return this.get(DEFAULT_TEXT_PADDING);
    }

    public static get DEFAULT_NODE_LINE_WIDTH(): number {
        return this.get(DEFAULT_NODE_LINE_WIDTH);
    }

    public static get DEFAULT_NODE_TRANSPARENT(): boolean {
        return this.get(DEFAULT_NODE_TRANSPARENT);
    }

    public static get DEFAULT_TEXT_ORIENTATION(): ITextOrientation {
        return this.get(DEFAULT_TEXT_ORIENTATION);
    }

    // ========== Shadows ==========

    public static get NO_SHADOW(): ShadowStyle {
        return this.get('NO_SHADOW') as ShadowStyle;
    }

    // public static get DEFAULT_SHADOW(): ShadowStyle {
    //     return this.get('DEFAULT_SHADOW') as ShadowStyle;
    // }

    public static get LOW_SHADOW(): ShadowStyle {
        return this.get('LOW_SHADOW') as ShadowStyle;
    }

    public static get MEDIUM_SHADOW(): ShadowStyle {
        return this.get('MEDIUM_SHADOW') as ShadowStyle;
    }

    public static get HIGH_SHADOW(): ShadowStyle {
        return this.get('HIGH_SHADOW') as ShadowStyle;
    }

    public static get LOW_COLOR_SHADOW(): ShadowStyle {
        return this.get('LOW_COLOR_SHADOW') as ShadowStyle;
    }

    public static get MEDIUM_COLOR_SHADOW(): ShadowStyle {
        return this.get('MEDIUM_COLOR_SHADOW') as ShadowStyle;
    }

    public static get HIGH_COLOR_SHADOW(): ShadowStyle {
        return this.get('HIGH_COLOR_SHADOW') as ShadowStyle;
    }

    // ========== Icons ==========

    public static get ICON_SIZE(): number {
        return this.get(ICON_SIZE);
    }

}