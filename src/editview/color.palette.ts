import type { Diagram } from "../model/diagram";

/**
 * A class that manages colors frequently used in a diagram.
 * It can be used to support building adaptive editor UIs.
 */
export class ColorPalette {

    private diagram: Diagram;

    private colors_used: Map<string, number> = new Map();

    /**
     * Creates an instance of ColorPalette and attaches it to a diagram model.
     * The ColorPalettte will be based on colors used in the given Diagram.
     * @param diagram The diagram model to read colors from.
     */
    constructor(diagram: Diagram) {
        this.diagram = diagram;
    }

    /**
     * List colors in descending order of their frequency.
     * @returns An array of color strings sorted by their usage frequency.
     */
    public frequentColors(): string[] {
        if (this.colors_used.size === 0) {
            this.refresh();
        }
        return Array.from(this.colors_used).sort((a, b) => b[1] - a[1]).map(c => c[0]);
    }

    /**
     * Refreshes the color palette by scanning the diagram for all colors currently in use.
     * This method should be called whenever there are changes to the diagram that may affect color usage.
     * It updates the internal count of colors used in the diagram, which can then be retrieved using `frequentColors()`.
     */
    public refresh(): void {
        this.colors_used.clear();
        for (const node of this.diagram.nodes) {
            if (node.lineWidth > 0 || node.text?.length) {
                this.addColor(node.strokeStyle);
            }
            if (!node.transparent) {
                this.addColor(node.fillStyle);
            }
        }
    }

    /**
     * Manually adds a color to the palette's tracking. 
     * This can be used to populate the palette with known colors.
     * @param style The color string to add to the palette.
     */
    public addColor(style: string): void {
        style = style.trim();
        if (this.isColor(style)) {
            const used = this.colors_used.get(style) || 0;
            this.colors_used.set(style, used + 1);
        }
    }

    private isColor(style: string): boolean {
        if (style.match(/^(#[0-9A-Fa-f]{3,8})$/)) return true;
        return false;
    }
}