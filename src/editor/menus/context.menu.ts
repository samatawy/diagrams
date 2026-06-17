import { setClasses } from "../editor.utils";

/**
 * Lightweight context menu container that shows arbitrary menu content at screen coordinates.
 */
export class ContextMenu {

    protected host: HTMLElement;

    protected menuElement: HTMLElement;

    protected menuItems: HTMLElement[] = [];

    /**
     * Attaches a new context menu container to the given host element.
     * @param host The element that owns the menu.
     */
    constructor(host: HTMLElement) {
        this.host = host;
        this.menuElement = document.createElement('div');
        setClasses(this.menuElement, 'context-menu');
        this.host.appendChild(this.menuElement);
    }

    /**
     * Returns true when the menu is currently visible.
     */
    public get visible(): boolean {
        return this.menuElement.style.display !== 'none';
    }

    /**
     * Shows or hides the menu.
     * @param value True to show, false to hide.
     */
    public set visible(value: boolean) {
        this.menuElement.style.display = value ? 'block' : 'none';
    }

    /**
     * Appends a labelled menu item that calls the given handler and closes the menu on click.
     * @param label Display text for the item.
     * @param onClick Callback invoked when the item is clicked.
     * @returns The created menu item element.
     */
    public addMenuItem(label: string, onClick: () => void): HTMLElement {
        const item = document.createElement('div');
        item.classList.add('context-menu-item');
        item.textContent = label;
        item.addEventListener('click', () => {
            onClick();
            this.hide();
        });
        if (this.menuElement) {
            this.menuElement.appendChild(item);
        }
        return item;
    }

    /**
     * Positions and displays a menu element containing arbitrary content at the given coordinates.
     * Any previously open menu is closed first.
     * @param x Horizontal position in pixels relative to the document.
     * @param y Vertical position in pixels relative to the document.
     * @param content The element to place inside the menu container.
     */
    public show(x: number, y: number, content: HTMLElement): void {
        this.hide();
        const menu = document.createElement('div');
        menu.classList.add('context-menu');
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.appendChild(content);
        document.body.appendChild(menu);
        this.menuElement = menu;
    }

    /**
     * Removes the current menu element from the DOM.
     */
    public hide(): void {
        if (this.menuElement) {
            this.menuElement.remove();
        }
    }
}