import { injectStyles, setClasses } from "../editor.utils";

const STYLE_ID = 'context-menu-defaults';

const DEFAULT_STYLES = `
.context-menu {
    position: fixed;
    z-index: 1000;
    min-width: 180px;
    padding: 4px 0;
    background: var(--diagram-ui-surface-elevated, #ffffff);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-panel-radius, 10px);
    box-shadow: 0 8px 24px var(--diagram-ui-shadow-color, rgba(15, 23, 42, 0.18));
    font: var(--diagram-ui-font-size, 12px)/1.4 var(--diagram-ui-font-family, system-ui);
    color: var(--diagram-ui-text, #1f2937);
    user-select: none;
}
.context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px 6px 6px;
    cursor: pointer;
    border-radius: 6px;
    margin: 1px 4px;
}
.context-menu-item:hover {
    background: var(--diagram-ui-hover-bg, rgba(15, 118, 110, 0.1));
}
.context-menu-item.is-active .context-menu-item-icon {
    background: var(--diagram-ui-accent, #0f766e);
    color: var(--diagram-ui-accent-contrast, #ffffff);
    border-radius: 4px;
}
.context-menu-item.is-disabled {
    opacity: 0.45;
    pointer-events: none;
}
.context-menu-item-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    border-radius: 4px;
}
.context-menu-item-icon svg,
.context-menu-item-icon img {
    width: 18px;
    height: 18px;
    display: block;
    pointer-events: none;
}
.context-menu-item-label {
    flex: 1 1 auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.context-menu-separator {
    height: 1px;
    margin: 4px 8px;
    background: var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
}
`;

/**
 * Lightweight context menu that renders at fixed viewport coordinates.
 */
export class ContextMenu {

    protected menuElement: HTMLElement | null = null;

    private readonly onDocumentClick = (e: MouseEvent): void => {
        if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
            this.close();
        }
    };

    /**
     * Creates a ContextMenu. Styles are injected once.
     */
    constructor() {
        injectStyles(STYLE_ID, DEFAULT_STYLES);
    }

    /**
     * Returns true when the menu is currently visible.
     */
    public get visible(): boolean {
        return this.menuElement !== null;
    }

    /**
     * Appends a labelled menu item that calls the given handler and closes the menu on click.
     * @param label Display text for the item.
     * @param onClick Callback invoked when the item is clicked.
     * @param options Optional icon element, active toggle state, and disabled flag.
     * @returns The created menu item element.
     */
    public addMenuItem(
        label: string,
        onClick: () => void,
        options: { icon?: Element | null; active?: boolean; disabled?: boolean } = {},
    ): HTMLElement {
        const item = document.createElement('div');
        item.classList.add('context-menu-item');
        if (options.disabled) item.classList.add('is-disabled');
        if (options.active) item.classList.add('is-active');

        // Icon slot — always present so text stays aligned.
        const iconSlot = document.createElement('span');
        iconSlot.classList.add('context-menu-item-icon');
        if (options.icon) iconSlot.appendChild(options.icon);
        item.appendChild(iconSlot);

        const labelEl = document.createElement('span');
        labelEl.classList.add('context-menu-item-label');
        labelEl.textContent = label;
        item.appendChild(labelEl);

        item.addEventListener('click', () => {
            onClick();
            this.close();
        });
        this.menuElement?.appendChild(item);
        return item;
    }

    /**
     * Appends a visual separator line.
     */
    public addSeparator(): void {
        const sep = document.createElement('div');
        sep.classList.add('context-menu-separator');
        this.menuElement?.appendChild(sep);
    }

    /**
     * Positions and displays the menu at the given viewport coordinates.
     * Any previously open menu is closed first.
     * Call this from {@link open} after populating items.
     * @param x Horizontal position in viewport pixels.
     * @param y Vertical position in viewport pixels.
     */
    protected show(x: number, y: number): void {
        this.close();
        const menu = document.createElement('div');
        menu.classList.add('context-menu');
        document.body.appendChild(menu);
        this.menuElement = menu;

        // Position, then clamp so the menu stays within the viewport.
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        // After appending we can measure and adjust.
        requestAnimationFrame(() => {
            if (!this.menuElement) return;
            const rect = this.menuElement.getBoundingClientRect();
            if (rect.right > vw) this.menuElement.style.left = `${Math.max(0, vw - rect.width - 4)}px`;
            if (rect.bottom > vh) this.menuElement.style.top = `${Math.max(0, vh - rect.height - 4)}px`;
        });

        document.addEventListener('click', this.onDocumentClick, { capture: true, once: true });
    }

    /**
     * Opens the context menu in response to a pointer event.
     * Override in subclasses to populate items and call {@link show}.
     * The base implementation does nothing.
     * @param _event The pointer event that triggered the context menu.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public open(_event: MouseEvent): void { /* override in subclass */ }

    /**
     * Hides and removes the menu from the DOM.
     */
    public close(): void {
        this.menuElement?.remove();
        this.menuElement = null;
        document.removeEventListener('click', this.onDocumentClick, { capture: true });
    }

    /**
     * Permanently removes the menu and cleans up listeners.
     */
    public destroy(): void {
        this.close();
    }
}