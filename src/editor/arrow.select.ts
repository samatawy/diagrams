/**
 * Configuration options for the ArrowSelect component.
 */
export interface ArrowSelectConfig {
    /**
     * An array of arrow types to display in the dropdown. Each type is represented as a string.
     * The default arrow types are: 'start', 'end', 'both', and 'none'.
     * You can change their order but not add new types without updating the component logic.
     */
    arrows?: ArrowDirection[];
    /**
     * The stroke color to use for the width swatch in the dropdown and trigger button.
     */
    strokeColor?: string;
    // /**
    //  * Indicates whether to show the width label (e.g., "1px", "2px") next to the swatch in the trigger button and options.
    //  */
    // showLabel?: boolean;
    /**
     * Optional CSS class name to apply to the host element of the ArrowSelect component. This allows for custom styling of the component.
     */
    hostClassName?: string;
    /**
     * Optional CSS class name to apply to the trigger button of the ArrowSelect component. This allows for custom styling of the trigger button.
     */
    triggerClassName?: string;
    /**
     * Optional CSS class name to apply to the dropdown menu of the ArrowSelect component. This allows for custom styling of the dropdown menu.
     */
    menuClassName?: string;
    /**
     * Optional CSS class name to apply to each option in the dropdown menu. This allows for custom styling of the options.
     */
    optionClassName?: string;
    /**
     * Optional CSS class name to apply to the swatch element of the ArrowSelect component. This allows for custom styling of the swatch.
     */
    swatchClassName?: string;
    // /**
    //  * Optional CSS class name to apply to the label element of the ArrowSelect component. This allows for custom styling of the label.
    //  */
    // labelClassName?: string;
    /**
     * Optional CSS class name to apply to the selected option of the ArrowSelect component. This allows for custom styling of the selected option.
     */
    selectedClassName?: string;
    /**
     * Optional CSS class name to apply when the ArrowSelect component is open. This allows for custom styling when the component is open.
     */
    openClassName?: string;
}

const DEFAULT_ARROWS: ArrowDirection[] = ['end', 'start', 'both', 'none'];

const DEFAULT_CONFIG: Required<Omit<ArrowSelectConfig, 'arrows'>> & { arrows: ArrowDirection[] } = {
    arrows: DEFAULT_ARROWS,
    strokeColor: '#1f2937',
    // showLabel: true,
    hostClassName: 'arrow-select-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    swatchClassName: 'arrow-width-swatch',
    // labelClassName: 'color-preset-label',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

const STYLE_ID = 'arrow-select-defaults';

const DEFAULT_STYLES = `
.arrow-select-control {
	position: relative;
	min-width: 90px;
	max-width: 130px;
}
.arrow-select-control .color-preset-trigger,
.arrow-select-control button[aria-haspopup='listbox'] {
	width: 100%;
	display: grid;
	grid-template-columns: 1fr auto auto;
	align-items: center;
	gap: var(--diagram-ui-control-gap, 8px);
	padding: var(--diagram-ui-control-padding-y, 6px) var(--diagram-ui-control-padding-x, 8px);
	cursor: pointer;
	appearance: none;
	border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
	border-radius: var(--diagram-ui-control-radius, 10px);
	background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
	color: var(--diagram-ui-text, #1f2937);
	font: 600 var(--diagram-ui-font-size, 12px)/1.2 var(--diagram-ui-font-family, system-ui);
}
.arrow-select-control .color-preset-trigger::after {
	content: '▾';
	font-size: var(--diagram-ui-font-size, 12px);
	color: var(--diagram-ui-text-muted, #334155);
}
.arrow-select-control .color-preset-trigger:hover,
.arrow-select-control .color-preset-trigger:focus-visible,
.arrow-select-control button[aria-haspopup='listbox']:hover,
.arrow-select-control button[aria-haspopup='listbox']:focus-visible {
	border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.arrow-width-swatch {
	width: 100%;
	min-height: 20px;
	display: flex;
	align-items: center;
}
.arrow-width-swatch svg {
	width: 100%;
	display: block;
	overflow: visible;
}
.arrow-select-control .color-preset-label {
	font: 600 var(--diagram-ui-label-font-size, 11px)/1.1 var(--diagram-ui-font-family, system-ui);
	color: var(--diagram-ui-text-muted, #334155);
	text-transform: lowercase;
	justify-self: end;
}
.arrow-select-control .color-preset-menu {
	position: absolute;
	left: 0;
	right: 0;
	top: calc(100% + var(--diagram-ui-control-gap, 6px));
	z-index: 40;
	border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
	border-radius: var(--diagram-ui-panel-radius, 10px);
	background: var(--diagram-ui-surface-elevated, #ffffff);
	padding: var(--diagram-ui-panel-padding, 6px);
	display: none;
	max-height: 220px;
	overflow: auto;
	box-shadow: 0 10px 24px var(--diagram-ui-shadow-color, rgba(15, 23, 42, 0.18));
}
.arrow-select-control.is-open .color-preset-menu {
	display: grid;
	gap: var(--diagram-ui-group-gap, 6px);
}
.arrow-select-control .color-preset-option {
	width: 100%;
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
	gap: var(--diagram-ui-group-gap, 8px);
	border: none;
	border-radius: var(--diagram-ui-control-radius, 6px);
	background: transparent;
	padding: var(--diagram-ui-group-gap, 4px) var(--diagram-ui-control-padding-x, 6px);
	cursor: pointer;
	font: inherit;
}
.arrow-select-control .color-preset-option:hover,
.arrow-select-control .color-preset-option.is-selected {
	background: var(--diagram-ui-hover-bg, rgba(15, 118, 110, 0.1));
}
`;

import type { ArrowDirection } from '../types';
import { injectStyles, setClasses, toggleClasses, removeClasses } from './editor.utils';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}


/**
 * A dropdown component for selecting line widths.
 * It displays a list of predefined widths and allows the user to select one.
 * The selected width is reflected in the trigger button and can be accessed via the `value` property.
 * The component emits a 'widthchange' event when the selected width changes.
 */
export class ArrowSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<ArrowSelectConfig, 'arrows'>> & { arrows: ArrowDirection[] };

    protected selected: ArrowDirection;

    protected trigger: HTMLButtonElement;

    protected triggerSwatch: HTMLDivElement;

    protected triggerLabel?: HTMLSpanElement;

    protected menu: HTMLDivElement;

    constructor(target: HTMLElement, config: ArrowSelectConfig = {}) {
        ensureDefaultStyles();

        this.host = target;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            arrows: config.arrows || DEFAULT_CONFIG.arrows,
        };
        this.selected = this.config.arrows[0] || 'none';

        this.host.innerHTML = '';
        setClasses(this.host, 'arrow-select-control', DEFAULT_CONFIG.hostClassName, this.config.hostClassName);

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        setClasses(this.trigger, DEFAULT_CONFIG.triggerClassName, this.config.triggerClassName);
        this.trigger.setAttribute('aria-haspopup', 'listbox');
        this.trigger.setAttribute('aria-expanded', 'false');

        this.triggerSwatch = document.createElement('div');
        setClasses(this.triggerSwatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        this.trigger.appendChild(this.triggerSwatch);

        // if (this.config.showLabel) {
        //     this.triggerLabel = document.createElement('span');
        //     setClasses(this.triggerLabel, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
        //     this.trigger.appendChild(this.triggerLabel);
        // }

        this.menu = document.createElement('div');
        setClasses(this.menu, DEFAULT_CONFIG.menuClassName, this.config.menuClassName);
        this.menu.setAttribute('role', 'listbox');

        this.host.appendChild(this.trigger);
        this.host.appendChild(this.menu);

        this.trigger.addEventListener('click', this.onTriggerClick);
        this.menu.addEventListener('click', this.onOptionClick);
        if (typeof document !== 'undefined') {
            document.addEventListener('click', this.onDocumentClick);
        }

        this.rebuildOptions(this.config.arrows);
    }

    /**
     * Releases DOM/event resources owned by the control.
     */
    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        if (typeof document !== 'undefined') {
            document.removeEventListener('click', this.onDocumentClick);
        }
        this.host.innerHTML = '';
    }

    /**
     * Gets the currently selected width value.
     */
    public get value(): string {
        return this.selected;
    }

    /**
     * Sets the currently selected width value.
     */
    public set value(arrow: ArrowDirection) {
        this.selectArrow(arrow);
    }

    /**
     * Sets the available arrow options and optionally selects one.
     * @param arrows - An array of arrow directions.
     * @param selectedArrow - The arrow direction to select. Defaults to the first option.
     */
    public setOptions(arrows: ArrowDirection[], selectedArrow?: ArrowDirection): void {
        const normalized = arrows.map(arrow => this.normalizeArrow(arrow));
        this.config.arrows = normalized;
        this.rebuildOptions(normalized);
        this.selectArrow(selectedArrow ?? normalized[0] ?? 'none', false);
    }

    /**
     * Handles the click event on the trigger button. Toggles the open/closed state of the dropdown menu.
     */
    protected readonly onTriggerClick = (): void => {
        if (this.host.classList.contains(DEFAULT_CONFIG.openClassName)) {
            this.closeMenu();
            return;
        }
        this.openMenu();
    };

    /**
     * Handles the click event on the document. Closes the dropdown menu if the click is outside the host element.
     * @param event - The click event.
     */
    protected readonly onDocumentClick = (event: Event): void => {
        const target = event.target as Node | null;
        if (target && !this.host.contains(target)) {
            this.closeMenu();
        }
    };

    /**
     * Handles the click event on an option. Selects the clicked width and closes the dropdown menu.
     * @param event - The click event.
     */
    protected readonly onOptionClick = (event: Event): void => {
        const target = event.target as HTMLElement | null;
        const option = target?.closest<HTMLElement>('[data-arrow]');
        const value = option?.dataset.arrow as ArrowDirection | undefined;
        const arrow = this.normalizeArrow(value);
        if (!value) return;
        // if (!Number.isFinite(value)) {
        //     return;
        // }

        this.selectArrow(value);
        this.closeMenu();
    };

    protected rebuildOptions(arrows: ArrowDirection[]): void {
        this.menu.innerHTML = '';
        for (const arrow of arrows) {
            this.menu.appendChild(this.buildOption(arrow));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

    protected buildOption(arrow: ArrowDirection): HTMLButtonElement {
        const option = document.createElement('button');
        option.type = 'button';
        setClasses(option, DEFAULT_CONFIG.optionClassName, this.config.optionClassName);
        option.setAttribute('role', 'option');
        option.dataset.arrow = arrow;

        const swatch = document.createElement('div');
        setClasses(swatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        swatch.appendChild(this.createArrowSvg(arrow));
        option.appendChild(swatch);

        // if (this.config.showLabel) {
        //     const label = document.createElement('span');
        //     setClasses(label, DEFAULT_CONFIG.labelClassName, this.config.labelClassName);
        //     label.textContent = `${width}px`;
        //     option.appendChild(label);
        // }

        return option;
    }

    protected createArrowSvg(arrow: ArrowDirection): SVGElement {
        const normalized = this.normalizeArrow(arrow);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 20');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '20');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '10');
        line.setAttribute('y1', '10');
        line.setAttribute('x2', '90');
        line.setAttribute('y2', '10');
        line.setAttribute('stroke', this.config.strokeColor);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');

        svg.appendChild(line);

        if (normalized === 'start' || normalized === 'both') {
            svg.appendChild(this.createArrowHead(10, 10, 'backward'));
        }

        if (normalized === 'end' || normalized === 'both') {
            svg.appendChild(this.createArrowHead(90, 10, 'forward'));
        }

        return svg;
    }

    protected createArrowHead(x: number, y: number, direction: 'forward' | 'backward'): SVGPolygonElement {
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        if (direction === 'forward') {
            head.setAttribute('points', `${x},${y} ${x - 6},${y - 4} ${x - 6},${y + 4}`);
        } else {
            head.setAttribute('points', `${x},${y} ${x + 6},${y - 4} ${x + 6},${y + 4}`);
        }
        head.setAttribute('fill', this.config.strokeColor);
        return head;
    }

    protected normalizeArrow(arrow: ArrowDirection | string | undefined): ArrowDirection {
        if (arrow === 'start' || arrow === 'end' || arrow === 'both' || arrow === 'none') {
            return arrow;
        }
        return 'none';
    }

    protected selectArrow(arrow: ArrowDirection, emit = true): void {
        const next = this.normalizeArrow(arrow);
        this.selected = next;
        this.syncTrigger();
        this.syncSelectedOption();

        if (!emit) {
            return;
        }
        this.host.dispatchEvent(new CustomEvent<ArrowDirection>('arrowchange', { detail: next }));
    }

    protected syncTrigger(): void {
        this.triggerSwatch.innerHTML = '';
        this.triggerSwatch.appendChild(this.createArrowSvg(this.selected));
        // if (this.triggerLabel) {
        //     this.triggerLabel.textContent = `${this.selected}px`;
        // }
    }

    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-arrow]');
        options.forEach((option) => {
            const isSelected = option.dataset.arrow === this.selected;
            toggleClasses(option, isSelected, DEFAULT_CONFIG.selectedClassName, this.config.selectedClassName);
            option.setAttribute('aria-selected', String(isSelected));
        });
    }

    protected openMenu(): void {
        setClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    protected closeMenu(): void {
        removeClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'false');
    }
}
