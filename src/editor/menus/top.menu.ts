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
    items: MenuComponent[];
    /** Optional callback to determine whether the dropdown menu is enabled. */
    isEnabled?: (target?: unknown) => boolean;
    /** Optional callback to determine whether the dropdown menu is visible. */
    isVisible?: (target?: unknown) => boolean;
    /** Reference to the dropdown menu element, set only after the menu is rendered. */
    element?: HTMLElement;
}

export type MenuComponent = TopMenuItem | DropDownMenu | '-';

function isMenuItem(item: MenuComponent | unknown): item is TopMenuItem {
    return (item as TopMenuItem).onClick !== undefined;
}

function isDropDownMenu(item: MenuComponent | unknown): item is DropDownMenu {
    return (item as DropDownMenu).items !== undefined;
}

/**
 * Lightweight context menu that renders at fixed viewport coordinates.
 */
export class TopMenu {

    protected readonly host: HTMLElement;

    protected readonly config: TopMenuConfig;

    protected target: unknown;

    protected menuElement: HTMLElement | null = null;

    /** 
     * The top-level menu items, including both dropdowns and individual items. 
     */
    protected topLevel: (TopMenuItem | DropDownMenu)[] = [];

    /** 
     * All dropdown menus, extracted from the top-level items. 
     */
    protected dropDownMenus: DropDownMenu[] = [];

    /** 
     * The currently selected dropdown menu, if any. 
     */
    protected selectedDropDown?: DropDownMenu;

    /** 
     * The currently opened dropdown menu, if any. 
     */
    protected activeDropDown?: DropDownMenu;

    /**
     * The currently selected menu item, if any. This may be a top-level dropdown or a menu item inside a dropdown.
     */
    protected selectedMenuItem?: TopMenuItem | DropDownMenu;

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

        // TODO: This should not really do anything, consider removing it.
        this.bindEventListeners();
    }

    /**
     * Permanently removes the menu and cleans up listeners.
     */
    public destroy(): void {
        this.unbindEventListeners();
        this.close();
        if (this.menuElement) {
            this.menuElement.remove();
            this.menuElement = null;
        }
    }

    private bindEventListeners(): void {
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('keyup', this.onKeyup);
    }

    private unbindEventListeners(): void {
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('keyup', this.onKeyup);
    }

    private readonly onDocumentClick = (e: MouseEvent): void => {
        if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
            this.close();
        }
    }

    private readonly onKeydown = (e: KeyboardEvent): void => {
        const keyCode = e.code.toUpperCase();

        if (this.activeDropDown) {
            /* A menu is open, so find the item to be activated */
            for (const item of this.activeDropDown.items.filter(i => i !== '-')) {
                const altCode = 'KEY' + item.altKey.toUpperCase();
                if (altCode === keyCode) {
                    this.selectMenuItem(item);
                    if (isMenuItem(item)) {
                        this.close();
                        item.onClick();
                    }
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return;
                }
            }
        }
        else if (e.altKey || this.activeDropDown) {
            /* Fall back to top level if no dropdown is active or no match was found in the active dropdown. */
            for (const item of this.topLevel) {
                const altCode = 'KEY' + item.altKey.toUpperCase();
                if (altCode === keyCode) {
                    if ((isMenuItem(item))) {
                        this.close();
                        item.onClick();

                    } else if (isDropDownMenu(item)) {
                        this.close();
                        this.openDropdown(item);
                    }
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return;
                }
            }
        }

        if (this.selectedDropDown) {
            if (keyCode === 'ARROWLEFT') {
                /* Focus the previous top-level menu */
                const currentIndex = this.topLevel.indexOf(this.selectedDropDown);
                const prevIndex = (currentIndex - 1 + this.topLevel.length) % this.topLevel.length;
                const prevMenu = this.topLevel[prevIndex];
                if ((prevMenu as DropDownMenu).items) {
                    this.closeDropdown(this.selectedDropDown);
                    this.openDropdown(prevMenu as DropDownMenu);
                }
                e.preventDefault();
                e.stopImmediatePropagation();

            } else if (keyCode === 'ARROWRIGHT') {
                /* Focus the next top-level menu */
                const currentIndex = this.topLevel.indexOf(this.selectedDropDown);
                const nextIndex = (currentIndex + 1) % this.topLevel.length;
                const nextMenu = this.topLevel[nextIndex];
                if ((nextMenu as DropDownMenu).items) {
                    this.closeDropdown(this.selectedDropDown);
                    this.openDropdown(nextMenu as DropDownMenu);
                }
                e.preventDefault();
                e.stopImmediatePropagation();

            } else if (keyCode === 'ARROWDOWN' && !this.activeDropDown) {
                /* Open the selected dropdown */
                this.openDropdown(this.selectedDropDown);

                e.preventDefault();
                e.stopImmediatePropagation();

            } else if (keyCode === 'ARROWDOWN' && this.activeDropDown) {
                /* Focus the next item in the active dropdown. */
                if (this.selectedMenuItem) {
                    const index = this.activeDropDown.items.indexOf(this.selectedMenuItem);
                    if (index !== undefined && index >= 0) {
                        let nextIndex = (index + 1) % this.activeDropDown.items.length;
                        let nextItem = this.activeDropDown.items[nextIndex];
                        while (nextItem === '-') {
                            // Skip over separators.
                            nextIndex = (nextIndex + 1) % this.activeDropDown.items.length;
                            nextItem = this.activeDropDown.items[nextIndex];
                        }
                        this.selectMenuItem(nextItem);
                    }
                }

                e.preventDefault();
                e.stopImmediatePropagation();

            } else if (keyCode === 'ARROWUP' && this.activeDropDown) {
                /* Focus the prior item in the active dropdown. */
                if (this.selectedMenuItem) {
                    const index = this.activeDropDown.items.indexOf(this.selectedMenuItem);
                    if (index !== undefined && index >= 0) {
                        let prevIndex = (index - 1 + this.activeDropDown.items.length) % this.activeDropDown.items.length;
                        let prevItem = this.activeDropDown.items[prevIndex];
                        while (prevItem === '-') {
                            prevIndex = (prevIndex - 1 + this.activeDropDown.items.length) % this.activeDropDown.items.length;
                            prevItem = this.activeDropDown.items[prevIndex];
                        }
                        this.selectMenuItem(prevItem);
                    }
                }
            }
        }
        if (['ALT', 'ALTLEFT', 'ALTRIGHT', 'META', 'F10'].includes(keyCode) || (keyCode === 'F2' && e.ctrlKey)) {
            /* Select the first top-level item */
            this.selectDropdown(this.topLevel[0] as DropDownMenu);
        }
        if (keyCode === 'ENTER') {
            if (this.selectedMenuItem) {
                if (isMenuItem(this.selectedMenuItem)) {
                    this.selectedMenuItem.onClick();
                } else if (isDropDownMenu(this.selectedMenuItem)) {
                    this.openDropdown(this.selectedMenuItem);
                }
                this.close();
            }
        }
        if (keyCode === 'ESCAPE') {
            /* Close any open dropdowns and deselect the top-level item */
            this.close();
        }
    }

    private readonly onKeyup = (e: KeyboardEvent): void => {
        const keyCode = e.code.toUpperCase();
        if (['ALT', 'ALTLEFT', 'ALTRIGHT', 'META', 'F10'].includes(keyCode)) {
            if (!this.activeDropDown) {
                this.selectDropdown(undefined);
            }
        }
    }

    /**
     * Returns true when the menu is currently visible.
     */
    public get visible(): boolean {
        return this.menuElement !== null;
    }

    public addDropDownMenu(menu: DropDownMenu, parent?: HTMLElement, index: number = -1): HTMLElement {
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
        labelEl.innerHTML = this.labelHtml(menu);
        item.appendChild(labelEl);

        /* Create the dropdown container */
        const dropdownContainer = document.createElement('div');
        setClasses(dropdownContainer, 'top-menu-dropdown', 'is-hidden', this.config.menuClassName || '');
        menu.items.forEach(subItem => {
            if (subItem === '-') {
                this.addSeparator(dropdownContainer);
            } else if (isMenuItem(subItem)) {
                this.addMenuItem(subItem, dropdownContainer);
            }
        });
        item.appendChild(dropdownContainer);

        // Show/hide dropdown on hover
        item.addEventListener('mouseenter', () => {
            this.openDropdown(menu);
        });
        item.addEventListener('mouseleave', () => {
            this.closeDropdown(menu);
        });

        if (parent) {
            if (index >= 0 && index < parent.children.length) {
                parent.insertBefore(item, parent.children[index]!);
            } else {
                parent.appendChild(item);
            }
        } else {
            this.menuElement?.appendChild(item);
            if (index >= 0 && index < this.topLevel.length) {
                this.topLevel.splice(index, 0, menu);
            } else {
                this.topLevel.push(menu);
            }
        }
        this.dropDownMenus.push(menu);

        menu.element = item;

        return item;
    }

    public addMenuItem(item: TopMenuItem, parent?: HTMLElement): HTMLElement {
        const menuItem = document.createElement('div');
        setClasses(menuItem, 'top-menu-item', this.config.itemClassName || '');
        if (item.isEnabled && !item.isEnabled(this.target)) toggleClasses(menuItem, true, 'is-disabled', this.config.disabledClassName || '');
        if (item.isVisible && !item.isVisible(this.target)) toggleClasses(menuItem, true, 'is-hidden');

        let tooltip = item.hint || item.label;
        if (item.shortcut) {
            const shortcutText = formatShortcut(item.shortcut);
            if (shortcutText) {
                tooltip += ` (${shortcutText})`;
            }
        }

        menuItem.setAttribute('aria-label', item.label);
        menuItem.setAttribute('title', tooltip);


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
        labelEl.innerHTML = this.labelHtml(item);
        menuItem.appendChild(labelEl);

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
        });

        menuItem.addEventListener('mouseenter', () => {
            this.selectMenuItem(item);
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

    /* 
     * Update the state of all menu items based on their isEnabled, isVisible, and isActive callbacks.
     */
    private calculateMenuState(): void {
        const items = [
            ...this.topLevel.filter(i => !(i as DropDownMenu)?.items).map(i => i as TopMenuItem),
        ];
        this.dropDownMenus.forEach(menu => {
            items.push(...menu.items.filter(i => isMenuItem(i)));
        });

        items.forEach(item => this.calculateMenuItem(item));
    }

    /**
     * Update the state of a single menu item based on its isEnabled, isVisible, and isActive callbacks.
     * @param item The menu item to update.
     */
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
     * Builds the HTML for a menu item label, underlining the character that matches the altKey.
     * @param item The menu item or dropdown menu.
     * @returns The HTML string for the label.
     */
    private labelHtml(item: TopMenuItem | DropDownMenu): string {
        let label = item.label;
        let index = label.toUpperCase().indexOf(item.altKey.toUpperCase());
        if (index >= 0) {
            label = label.substring(0, index) + '<u>' + label.charAt(index) + '</u>' + label.substring(index + 1);
        }
        return label;
    }

    private dropDownContainer(menu: DropDownMenu): HTMLElement | null {
        return menu.element?.querySelector('.top-menu-dropdown') || null;
    }

    /**
     * Opens a dropdown menu and selects the first item in it. Closes any other open dropdowns.
     * @param menu The dropdown menu to open.
     */
    private openDropdown(menu: DropDownMenu): void {
        this.selectDropdown(menu);

        const dropdownContainer = this.dropDownContainer(menu);
        if (dropdownContainer) {
            for (const child of menu.items) {
                /* Recalculate based on current state */
                if (isMenuItem(child)) this.calculateMenuItem(child);
            }

            dropdownContainer.style.display = 'block';
            this.activeDropDown = menu;
            this.selectMenuItem(menu.items[0]);
        }
    }

    /**
     * Closes a dropdown menu and deselects any selected item in it. If the menu is not open, does nothing.
     * @param menu The dropdown menu to close.
     */
    private closeDropdown(menu: DropDownMenu): void {
        const dropdownContainer = this.dropDownContainer(menu);
        if (dropdownContainer) {
            dropdownContainer.style.display = 'none';
            if (this.activeDropDown === menu) {
                this.activeDropDown = undefined;
                this.selectDropdown(undefined);
            }
        }
    }

    /**
     * Selects a dropdown menu (without opening it), clearing any previously selected dropdown.
     * @param item The dropdown menu to select, or undefined to clear the selection.
     */
    private selectDropdown(item: DropDownMenu | undefined): void {
        /* Clear any previously selected item */
        for (const menu of this.topLevel) {
            if (isDropDownMenu(menu) && menu.element) {
                menu.element.classList.remove('selected');
            }
        }
        this.selectedDropDown = undefined;

        if (!item) return;

        /* Select the new item */
        if (item.element) {
            item.element.classList.add('selected');
            this.selectedDropDown = item;
        }
    }

    /**
     * Selects a menu item (without invoking its action), clearing any previously selected item.
     * @param item The menu item to select, or undefined to clear the selection.
     */
    private selectMenuItem(item: MenuComponent | undefined): void {
        /* Clear any previously selected item */
        for (const menu of this.dropDownMenus) {
            for (const subItem of menu.items) {
                if (subItem === '-') continue;
                if (isMenuItem(subItem) && subItem.element) {
                    subItem.element.classList.remove('selected');
                }
            }
        }
        this.selectedMenuItem = undefined;

        if (!item || item === '-') return;

        /* Select the new item */
        if (item.element) {
            item.element.classList.add('selected');
            this.selectedMenuItem = item;
        }
    }

    /**
     * Hides any visible dropdown menus.
     */
    public close(): void {
        for (const dropdown of this.dropDownMenus) {
            this.closeDropdown(dropdown);
        }
        this.selectDropdown(undefined);
        this.selectMenuItem(undefined);
    }
}