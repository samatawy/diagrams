import { DiagramKeyboard } from "../keyboard/diagram.keyboard";
import type { DiagramView } from "./diagram.view";

export class DiagramViewKeyboard<T extends DiagramView = DiagramView> extends DiagramKeyboard<T> {

    constructor() {
        super();
        this.initialize();
    }

    protected initialize(): void {
        const kb = this;

        kb.setShortcut(['Ctrl+F', 'Cmd+F'], (d: T) => {
            d.fitToNodes();
        }, 'Fit to nodes');

        kb.setShortcut(['Ctrl+W', 'Cmd+W'], (d: T) => {
            d.fitToWidth();
        }, 'Fit to width');

        kb.setShortcut(['Ctrl+0', 'Cmd+0'], (d: T) => {
            d.zoomTo(1);
        }, 'Reset zoom');

        kb.setShortcut(['Ctrl+Plus', 'Ctrl+=', 'Cmd+Plus', 'Cmd+='], (d: T) => {
            d.zoomBy(1.01);
        }, 'Zoom in');

        kb.setShortcut(['Ctrl+Minus', 'Cmd+Minus'], (d: T) => {
            d.zoomBy(0.99);
        }, 'Zoom out');

        kb.setShortcut(['ArrowUp'], (d: T) => {
            const dy = (d.grid.forced) ? d.grid.width : 4;
            d.panBy(0, -dy);
            d.render();
        }, 'Pan up');

        kb.setShortcut(['ArrowDown'], (d: T) => {
            const dy = (d.grid.forced) ? d.grid.width : 4;
            d.panBy(0, dy);
            d.render();
        }, 'Pan down');

        kb.setShortcut(['ArrowLeft'], (d: T) => {
            const dx = (d.grid.forced) ? d.grid.width : 4;
            d.panBy(-dx, 0);
            d.render();
        }, 'Pan left');

        kb.setShortcut(['ArrowRight'], (d: T) => {
            const dx = (d.grid.forced) ? d.grid.width : 4;
            d.panBy(dx, 0);
            d.render();
        }, 'Pan right');
    }
}