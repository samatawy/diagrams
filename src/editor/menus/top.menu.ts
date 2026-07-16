import { injectStyles, setClasses, toggleClasses } from "../editor.utils";
import DEFAULT_STYLES from '../../css_generated/editor/menus/top.menu.css';
import { IconRegistry } from "../../factory";
import { formatShortcut } from "../../keyboard/keyboard.shortcut";

const STYLE_ID = 'top-menu-defaults';

/**
 * Configuration options for {@link TopMenu}.
 */
export interface TopMenuConfig {
    /** Class applied to the menu container. Default: `top-menu`. */
    menuClassName?: string;
    /** Class applied to each action row. Default: `top-menu-item`. */
    itemClassName?: string;
    /** Class applied to the icon slot inside an action row. Default: `top-menu-item-icon`. */
    iconClassName?: string;
    /** Class applied to the label span inside an action row. Default: `top-menu-item-label`. */
    labelClassName?: string;
    /** Class added to an item row when its toggle is active. Default: `is-active`. */
    activeClassName?: string;
    /** Class added to an item row when it is disabled. Default: `is-disabled`. */
    disabledClassName?: string;
    /** Class applied to separator elements. Default: `top-menu-separator`. */
    separatorClassName?: string;
}

/**
 * Lightweight top menu that renders in the main menu bar or inside a dropdown menu.
 */
export interface TopMenuItem {
    /** The display label for the menu item. */
    label: string;
    /** The underlined keyboard shortcut for the menu item. */
    altKey: string;
    /** Optional keyboard shortcut for the menu item. */
    shortcut?: string[];
    /** Optional icon for the menu item. */
    icon?: string;
    /** Optional tooltip for the menu item. */
    hint?: string;
    /** Optional toggle state for the menu item. */
    toggle?: boolean;
    /** Optional callback to determine whether the item is active. Required if toggle is true. */
    isActive?: (target?: unknown) => boolean;
    /** Optional callback to determine whether the item is enabled. */
    isEnabled?: (target?: unknown) => boolean;
    /** Optional callback to determine whether the item is visible. */
    isVisible?: (target?: unknown) => boolean;
    /** Callback invoked when the item is clicked. */
    onClick: (target?: unknown) => void;
    /** Reference to the menu item element, set only after the item is rendered. */
    element?: HTMLElement;
}

/**
 * Lightweight dropdown menu that renders in the main menu bar.
 */
export interface DropDownMenu {
    /** The display label for the dropdown menu. */
    label: string;
    /** The underlined keyboard shortcut for the dropdown menu. */
    altKey: string;
    /** Optional icon for the dropdown menu. */
    icon?: string;
    /** The items in the dropdown menu. */
    items: (TopMenuItem | '-')[];
    /** Optional callback to determine whether the dropdown menu is enabled. */
    isEnabled?: (target?: unknown) => boolean;
    /** Optional callback to determine whether the dropdown menu is visible. */
    isVisible?: (target?: unknown) => boolean;
    /** Reference to the dropdown menu element, set only after the menu is rendered. */
    element?: HTMLElement;
}

/**
 * Lightweight context menu that renders at fixed viewport coordinates.
 */
export class TopMenu {

    protected readonly host: HTMLElement;

    protected target: unknown;

    protected menuElement: HTMLElement | null = null;

    protected topLevel: (TopMenuItem | DropDownMenu)[] = [];

    protected dropDownMenus: DropDownMenu[] = [];

    protected readonly config: TopMenuConfig;

    // private readonly onDocumentClick = (e: MouseEvent): void => {
    //     if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
    //         this.close();
    //     }
    // };

    /**
     * Creates a TopMenu. Styles are injected once.
     * @param host Element to append the menu into. Must establish a stacking context so CSS variables are inherited.
     * @param config Optional class-name overrides.
     */
    constructor(host: HTMLElement, target: unknown, config: TopMenuConfig = {}) {
        injectStyles(STYLE_ID, DEFAULT_STYLES);
        this.host = host;
        this.target = target;
        this.config = config;
        // Ensure host is a positioning context for position:absolute children.
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

        this.menuElement = document.createElement('div');
        setClasses(this.menuElement, 'top-menu', this.config.menuClassName || '');
        this.host.appendChild(this.menuElement);
    }

    /**
     * Returns true when the menu is currently visible.
     */
    public get visible(): boolean {
        return this.menuElement !== null;
    }

    public addDropDownMenu(menu: DropDownMenu): HTMLElement {
        const item = document.createElement('div');
        setClasses(item, 'top-menu-item', this.config.itemClassName || '');
        if (menu.isEnabled && !menu.isEnabled(this.target)) toggleClasses(item, true, 'is-disabled', this.config.disabledClassName || '');
        if (menu.isVisible && !menu.isVisible(this.target)) toggleClasses(item, true, 'is-hidden');

        if (menu.icon) {
            const iconSlot = document.createElement('span');
            setClasses(iconSlot, 'top-menu-item-icon', this.config.iconClassName || '');
            const iconEl = IconRegistry.createElement(menu.icon);
            if (iconEl) iconSlot.appendChild(iconEl);
            item.appendChild(iconSlot);
        }

        const labelEl = document.createElement('span');
        setClasses(labelEl, 'top-menu-item-label', this.config.labelClassName || '');
        labelEl.textContent = menu.label;
        item.appendChild(labelEl);

        // Create the dropdown container
        const dropdownContainer = document.createElement('div');
        setClasses(dropdownContainer, 'top-menu-dropdown', 'is-hidden', this.config.menuClassName || '');
        menu.items.forEach(subItem => {
            if (subItem === '-') {
                this.addSeparator(dropdownContainer);
            } else {
                this.addMenuItem(subItem, dropdownContainer);
            }
        });
        item.appendChild(dropdownContainer);

        // Show/hide dropdown on hover
        item.addEventListener('mouseenter', () => {
            for (const child of menu.items) {
                /* Recalculate based on current state */
                if (child !== '-' && child.element) {
                    const enabled = child.isEnabled ? child.isEnabled(this.target) : true;
                    toggleClasses(child.element, !enabled, 'is-disabled', this.config.disabledClassName || '');
                    const visible = child.isVisible ? child.isVisible(this.target) : true;
                    toggleClasses(child.element, !visible, 'is-hidden');
                }
            }
            dropdownContainer.style.display = 'block';
        });
        item.addEventListener('mouseleave', () => {
            dropdownContainer.style.display = 'none';
        });

        this.menuElement?.appendChild(item);
        this.topLevel.push(menu);
        this.dropDownMenus.push(menu);
        return item;
    }

    public addMenuItem(item: TopMenuItem, parent?: HTMLElement): HTMLElement {
        const menuItem = document.createElement('div');
        setClasses(menuItem, 'top-menu-item', this.config.itemClassName || '');
        if (item.isEnabled && !item.isEnabled(this.target)) toggleClasses(menuItem, true, 'is-disabled', this.config.disabledClassName || '');
        if (item.isVisible && !item.isVisible(this.target)) toggleClasses(menuItem, true, 'is-hidden');

        menuItem.setAttribute('aria-label', item.label);
        menuItem.setAttribute('title', item.hint || item.label);


        const iconSlot = document.createElement('span');
        setClasses(iconSlot, 'top-menu-item-icon', this.config.iconClassName || '');
        if (item.icon) {
            const iconEl = IconRegistry.createElement(item.icon);
            if (iconEl) {
                iconSlot.appendChild(iconEl);
            }
        }
        menuItem.appendChild(iconSlot);

        const labelEl = document.createElement('span');
        setClasses(labelEl, 'top-menu-item-label', this.config.labelClassName || '');
        labelEl.textContent = item.label;
        menuItem.appendChild(labelEl);

        // if (item.toggle) {
        //     const enabled = item.isEnabled ? item.isEnabled(this.target) : true;
        //     toggleClasses(menuItem, !enabled, 'is-disabled', this.config.disabledClassName || '');
        //     const visible = item.isVisible ? item.isVisible(this.target) : true;
        //     toggleClasses(menuItem, !visible, 'is-hidden');
        //     if (item.toggle && item.isActive) {
        //         const active = item.isActive(this.target);
        //         toggleClasses(menuItem, active, 'is-active', this.config.activeClassName || '');
        //     }
        //     // toggleClasses(menuItem, item.toggle, 'is-active', this.config.activeClassName || '');
        // }
        if (item.shortcut) {
            const shortcutText = formatShortcut(item.shortcut);
            if (shortcutText) {
                const shortcutEl = document.createElement('span');
                setClasses(shortcutEl, 'top-menu-item-shortcut', this.config.labelClassName || '');
                shortcutEl.textContent = shortcutText;
                menuItem.appendChild(shortcutEl);
            }
        }

        menuItem.addEventListener('click', () => {
            item.onClick();
            this.calculateMenuState();
            // this.close();
        });

        if (parent) {
            parent.appendChild(menuItem);
        } else {
            this.menuElement?.appendChild(menuItem);
            this.topLevel.push(item);
        }

        item.element = menuItem;
        this.calculateMenuItem(item);

        return menuItem;
    }

    // /**
    //  * Appends a labelled menu item that calls the given handler and closes the menu on click.
    //  * @param label Display text for the item.
    //  * @param onClick Callback invoked when the item is clicked.
    //  * @param options Optional icon element, active toggle state, and disabled flag.
    //  * @returns The created menu item element.
    //  */
    // public addMenuItem(
    //     label: string,
    //     onClick: () => void,
    //     options: { icon?: Element | null; active?: boolean; disabled?: boolean } = {},
    // ): HTMLElement {
    //     const item = document.createElement('div');
    //     setClasses(item, 'top-menu-item', this.config.itemClassName || '');
    //     if (options.disabled) toggleClasses(item, true, 'is-disabled', this.config.disabledClassName || '');
    //     if (options.active) toggleClasses(item, true, 'is-active', this.config.activeClassName || '');

    //     const iconSlot = document.createElement('span');
    //     setClasses(iconSlot, 'top-menu-item-icon', this.config.iconClassName || '');
    //     if (options.icon) iconSlot.appendChild(options.icon);
    //     item.appendChild(iconSlot);

    //     const labelEl = document.createElement('span');
    //     setClasses(labelEl, 'top-menu-item-label', this.config.labelClassName || '');
    //     labelEl.textContent = label;
    //     item.appendChild(labelEl);

    //     item.addEventListener('click', () => {
    //         onClick();
    //         this.close();
    //     });
    //     this.menuElement?.appendChild(item);
    //     return item;
    // }

    /**
     * Appends a visual separator line.
     */
    protected addSeparator(parent?: HTMLElement): void {
        const sep = document.createElement('div');
        setClasses(sep, 'top-menu-separator', this.config.separatorClassName || '');
        if (parent) {
            parent.appendChild(sep);
        } else {
            this.menuElement?.appendChild(sep);
        }
    }

    // /**
    //  * Positions and displays the menu at the given viewport coordinates.
    //  * Any previously open menu is closed first.
    //  * Call this from {@link open} after populating items.
    //  * @param x Horizontal position in viewport pixels.
    //  * @param y Vertical position in viewport pixels.
    //  */
    // protected show(x: number, y: number): void {
    //     this.close();
    //     const menu = document.createElement('div');
    //     setClasses(menu, 'top-menu', this.config.menuClassName || '');
    //     this.host.appendChild(menu);
    //     this.menuElement = menu;

    //     // Convert viewport coords to host-local coords so position:absolute lands correctly
    //     // regardless of whether an ancestor has a CSS transform.
    //     const hostRect = this.host.getBoundingClientRect();
    //     menu.style.left = `${x - hostRect.left}px`;
    //     menu.style.top = `${y - hostRect.top}px`;

    //     // Clamp against the viewport: getBoundingClientRect gives viewport coords so the
    //     // overflow delta is coordinate-system-independent and can be subtracted directly
    //     // from the host-local left/top values.
    //     requestAnimationFrame(() => {
    //         if (!this.menuElement || !hostRect) return;
    //         const rect = this.menuElement.getBoundingClientRect();
    //         const overRight = rect.right - hostRect.right;
    //         const overBottom = rect.bottom - hostRect.bottom;
    //         if (overRight > 0) this.menuElement.style.left = `${parseFloat(this.menuElement.style.left) - overRight - 1}px`;
    //         if (overBottom > 0) this.menuElement.style.top = `${parseFloat(this.menuElement.style.top) - overBottom - 1}px`;
    //     });

    //     document.addEventListener('click', this.onDocumentClick, { capture: true, once: true });
    // }

    // /**
    //  * Opens the context menu in response to a pointer event.
    //  * Override in subclasses to populate items and call {@link show}.
    //  * The base implementation does nothing.
    //  * @param _event The pointer event that triggered the context menu.
    //  */
    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // public open(_event: MouseEvent): void { /* override in subclass */ }


    private calculateMenuState(): void {

        const items = [
            ...this.topLevel.filter(i => !(i as DropDownMenu)?.items).map(i => i as TopMenuItem),
        ];
        this.dropDownMenus.forEach(menu => {
            items.push(...menu.items.filter(i => i !== '-').filter(i => i.element));
        });

        items.forEach(item => this.calculateMenuItem(item));
        // for (const item of items) {
        //     if (item.element) {
        //         const enabled = item.isEnabled ? item.isEnabled(this.target) : true;
        //         toggleClasses(item.element, !enabled, 'is-disabled', this.config.disabledClassName || '');
        //         const visible = item.isVisible ? item.isVisible(this.target) : true;
        //         toggleClasses(item.element, !visible, 'is-hidden');
        //         if (item.toggle && item.isActive) {
        //             const active = item.isActive(this.target);
        //             toggleClasses(item.element, active, 'is-active', this.config.activeClassName || '');
        //         }
        //     }
        // }
    }

    private calculateMenuItem(item: TopMenuItem): void {
        const menuItem = item.element;
        if (!menuItem) return;

        const enabled = item.isEnabled ? item.isEnabled(this.target) : true;
        toggleClasses(menuItem, !enabled, 'is-disabled', this.config.disabledClassName || '');
        const visible = item.isVisible ? item.isVisible(this.target) : true;
        toggleClasses(menuItem, !visible, 'is-hidden');
        if (item.toggle && item.isActive) {
            const active = item.isActive(this.target);
            toggleClasses(menuItem, active, 'is-active', this.config.activeClassName || '');
        }
    }

    /**
     * Hides any visible dropdown menus.
     */
    public close(): void {
        for (const dropdown of this.dropDownMenus) {
            if (dropdown.element) dropdown.element.style.display = 'none';
        }
        // this.menuElement?.remove();
        // this.menuElement = null;
        // document.removeEventListener('click', this.onDocumentClick, { capture: true });
    }

    /**
     * Permanently removes the menu and cleans up listeners.
     */
    public destroy(): void {
        this.close();
    }
}