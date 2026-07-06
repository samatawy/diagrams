import { DiagramKeyboard } from "../keyboard/diagram.keyboard";
import type { DiagramView } from "./diagram.view";

export class DiagramViewKeyboard<T extends DiagramView = DiagramView> extends DiagramKeyboard<T> {

    constructor() {
        super();
        this.initialize();
    }

    protected initialize(): void {
        const kb = this;

        kb.setShortcut(['Ctrl+Alt+F', 'Cmd+Alt+F'], (d: T) => {
            d.fitToNodes();
        }, 'Fit to nodes (horizontally and vertically)', 'fit-all');

        kb.setShortcut(['Ctrl+Alt+H', 'Cmd+Alt+H'], (d: T) => {
            d.fitHorizontally();
        }, 'Fit to horizontal size', 'fit-horizontally');

        kb.setShortcut(['Ctrl+0', 'Cmd+0'], (d: T) => {
            d.zoomTo(1, undefined, undefined, 'animate');
        }, 'Reset zoom');

        kb.setShortcut(['Ctrl+Plus', 'Ctrl+=', 'Cmd+Plus', 'Cmd+='], (d: T) => {
            d.zoomBy(1.01, undefined, undefined, 'animate');
        }, 'Zoom in', 'zoom-in');

        kb.setShortcut(['Ctrl+Minus', 'Cmd+Minus'], (d: T) => {
            d.zoomBy(0.99, undefined, undefined, 'animate');
        }, 'Zoom out', 'zoom-out');

        kb.setShortcut(['ArrowUp'], (d: T) => {
            const dy = (d.grid.forced) ? d.grid.width : 4;
            d.panBy(0, dy, 'animate');      // or -dy?
            d.render();
        }, 'Pan up');

        kb.setShortcut(['ArrowDown'], (d: T) => {
            const dy = (d.grid.forced) ? d.grid.width : 4;
            d.panBy(0, -dy, 'animate');     // or dy?
            d.render();
        }, 'Pan down');

        kb.setShortcut(['ArrowLeft'], (d: T) => {
            const dx = (d.grid.forced) ? d.grid.width : 4;
            d.panBy(dx, 0, 'animate');      // or -dx?
            d.render();
        }, 'Pan left');

        kb.setShortcut(['ArrowRight'], (d: T) => {
            const dx = (d.grid.forced) ? d.grid.width : 4;
            d.panBy(-dx, 0, 'animate');     // or dx?
            d.render();
        }, 'Pan right');
    }
}