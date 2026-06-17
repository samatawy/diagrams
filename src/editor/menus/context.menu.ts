import { injectStyles, setClasses, toggleClasses } from "../editor.utils";

const STYLE_ID = 'context-menu-defaults';

/**
 * Configuration options for {@link ContextMenu}.
 */
export interface ContextMenuConfig {
    /** Class applied to the menu container. Default: `context-menu`. */
    menuClassName?: string;
    /** Class applied to each action row. Default: `context-menu-item`. */
    itemClassName?: string;
    /** Class applied to the icon slot inside an action row. Default: `context-menu-item-icon`. */
    iconClassName?: string;
    /** Class applied to the label span inside an action row. Default: `context-menu-item-label`. */
    labelClassName?: string;
    /** Class added to an item row when its toggle is active. Default: `is-active`. */
    activeClassName?: string;
    /** Class added to an item row when it is disabled. Default: `is-disabled`. */
    disabledClassName?: string;
    /** Class applied to separator elements. Default: `context-menu-separator`. */
    separatorClassName?: string;
}

const DEFAULT_STYLES = `
.context-menu {
    position: absolute;
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

    protected readonly host: HTMLElement;

    protected menuElement: HTMLElement | null = null;

    protected readonly config: ContextMenuConfig;

    private readonly onDocumentClick = (e: MouseEvent): void => {
        if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
            this.close();
        }
    };

    /**
     * Creates a ContextMenu. Styles are injected once.
     * @param host Element to append the menu into. Must establish a stacking context so CSS variables are inherited.
     * @param config Optional class-name overrides.
     */
    constructor(host: HTMLElement, config: ContextMenuConfig = {}) {
        injectStyles(STYLE_ID, DEFAULT_STYLES);
        this.host = host;
        this.config = config;
        // Ensure host is a positioning context for position:absolute children.
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
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
        setClasses(item, 'context-menu-item', this.config.itemClassName || '');
        if (options.disabled) toggleClasses(item, true, 'is-disabled', this.config.disabledClassName || '');
        if (options.active) toggleClasses(item, true, 'is-active', this.config.activeClassName || '');

        const iconSlot = document.createElement('span');
        setClasses(iconSlot, 'context-menu-item-icon', this.config.iconClassName || '');
        if (options.icon) iconSlot.appendChild(options.icon);
        item.appendChild(iconSlot);

        const labelEl = document.createElement('span');
        setClasses(labelEl, 'context-menu-item-label', this.config.labelClassName || '');
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
        setClasses(sep, 'context-menu-separator', this.config.separatorClassName || '');
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
        setClasses(menu, 'context-menu', this.config.menuClassName || '');
        this.host.appendChild(menu);
        this.menuElement = menu;

        // Convert viewport coords to host-local coords so position:absolute lands correctly
        // regardless of whether an ancestor has a CSS transform.
        const hostRect = this.host.getBoundingClientRect();
        menu.style.left = `${x - hostRect.left}px`;
        menu.style.top = `${y - hostRect.top}px`;

        // Clamp against the viewport: getBoundingClientRect gives viewport coords so the
        // overflow delta is coordinate-system-independent and can be subtracted directly
        // from the host-local left/top values.
        requestAnimationFrame(() => {
            if (!this.menuElement || !hostRect) return;
            const rect = this.menuElement.getBoundingClientRect();
            const overRight = rect.right - hostRect.right;
            const overBottom = rect.bottom - hostRect.bottom;
            if (overRight > 0) this.menuElement.style.left = `${parseFloat(this.menuElement.style.left) - overRight - 1}px`;
            if (overBottom > 0) this.menuElement.style.top = `${parseFloat(this.menuElement.style.top) - overBottom - 1}px`;

            // const rect = this.menuElement.getBoundingClientRect();
            // const overRight = rect.right - window.innerWidth;
            // const overBottom = rect.bottom - window.innerHeight;
            // if (overRight > 0) this.menuElement.style.left = `${parseFloat(this.menuElement.style.left) - overRight - 4}px`;
            // if (overBottom > 0) this.menuElement.style.top = `${parseFloat(this.menuElement.style.top) - overBottom - 4}px`;
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