import type { ShadowStyle, StrokeStyle, TextStyle } from "../style.interfaces";

export interface NodeStyle {
    // id: string;

    textStyle: TextStyle;

    strokeStyle: StrokeStyle;

    fillStyle: string;

    shadowStyle: ShadowStyle;
}

export interface EmbeddedSheet {
    /**
     * The unique identifier of the spec sheet. Optional if embedded, required for Spec Sheets.
     */
    id?: string;
    /**
     * The name of the spec sheet. Optional if embedded, required for Spec Sheets.
     */
    name?: string;
    /**
     * The version of the spec sheet. Always optional.
     */
    version?: string;
    /**
     * The description of the spec sheet. Always optional.
     */
    description?: string;

    /**
     * The styles defined for the diagram itself, such as background color.
     */
    diagram: {
        background?: string;
    };
    /**
     * The styles defined for each node type.
     */
    types: Record<string, NodeStyle>;
    /**
     * The styles defined for each class name.
     */
    classes: Record<string, NodeStyle>;
}

export interface SpecSheet extends EmbeddedSheet {
    /**
     * The unique identifier of the spec sheet.
     */
    id: string;

    /**
     * The name of the spec sheet.
     */
    name: string;
}
