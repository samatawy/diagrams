import type { ShadowStyle, StrokeStyle, TextStyle } from "../style.interfaces";

export interface NodeStyle {
    id: string;

    textStyle: TextStyle;

    strokeStyle: StrokeStyle;

    fillStyle: string;

    shadowStyle: ShadowStyle;
}

export interface SpecSheet {
    /**
     * The unique identifier of the spec sheet.
     */
    id: string;

    /**
     * The name of the spec sheet.
     */
    name: string;

    /**
     * The version of the spec sheet.
     */
    version?: string;

    /**
     * The description of the spec sheet.
     */
    description?: string;

    diagram: {
        background?: string;
    }

    /**
     * The nodes defined in the spec sheet.
     */
    nodes: Record<string, NodeStyle>;

    /**
     * The classes defined in the spec sheet.
     */
    classes: Record<string, NodeStyle>;
}
