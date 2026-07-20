import type { ArrowDirection } from '../../types';
import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/arrow.direction.select.css';
const STYLE_ID = 'arrow-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * Configuration options for the ArrowDirectionSelect component.
 */
export interface ArrowDirectionSelectConfig {
    tooltip?: string;
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
    /**
     * Optional CSS class name to apply to the host element of the ArrowDirectionSelect component. This allows for custom styling of the component.
     */
    hostClassName?: string;
    /**
     * Optional CSS class name to apply to the trigger button of the ArrowDirectionSelect component. This allows for custom styling of the trigger button.
     */
    triggerClassName?: string;
    /**
     * Optional CSS class name to apply to the dropdown menu of the ArrowDirectionSelect component. This allows for custom styling of the dropdown menu.
     */
    menuClassName?: string;
    /**
     * Optional CSS class name to apply to each option in the dropdown menu of the ArrowDirectionSelect component. This allows for custom styling of the options.
     */
    optionClassName?: string;
    /**
     * Optional CSS class name to apply to the swatch element of the ArrowDirectionSelect component. This allows for custom styling of the swatch.
     */
    swatchClassName?: string;
    /**
     * Optional CSS class name to apply to the selected option of the ArrowDirectionSelect component. This allows for custom styling of the selected option.
     */
    selectedClassName?: string;
    /**
     * Optional CSS class name to apply when the ArrowDirectionSelect component is open. This allows for custom styling when the component is open.
     */
    openClassName?: string;
}

const DEFAULT_ARROWS: ArrowDirection[] = ['end', 'start', 'both', 'none'];

const DEFAULT_CONFIG: Required<Omit<ArrowDirectionSelectConfig, 'arrows'>> & { arrows: ArrowDirection[] } = {
    tooltip: '',
    arrows: DEFAULT_ARROWS,
    strokeColor: 'var(--diagram-ui-text, #1f2937)',
    hostClassName: 'arrow-select-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    swatchClassName: 'arrow-width-swatch',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

/**
 * A dropdown component for selecting arrow direction presets.
 * It displays predefined directions and reflects the selected direction in the trigger button.
 * The selected direction is exposed through the `value` property.
 * The component emits an `arrowchange` event when the direction changes.
 */
export class ArrowDirectionSelect {

    protected host: HTMLElement;

    protected config: Required<Omit<ArrowDirectionSelectConfig, 'arrows'>> & { arrows: ArrowDirection[] };

    protected selected: ArrowDirection;

    protected trigger: HTMLButtonElement;

    protected triggerSwatch: HTMLDivElement;

    protected triggerLabel?: HTMLSpanElement;

    protected menu: HTMLDivElement;

    /**
     * Creates an ArrowDirectionSelect component inside the given element.
     * @param target The host element that will contain the arrow picker.
     * @param config Optional display and behaviour configuration.
     */
    constructor(target: HTMLElement, config: ArrowDirectionSelectConfig = {}) {
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
        this.trigger.title = 'Select Arrow Direction…';

        this.triggerSwatch = document.createElement('div');
        setClasses(this.triggerSwatch, DEFAULT_CONFIG.swatchClassName, this.config.swatchClassName);
        this.trigger.appendChild(this.triggerSwatch);

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

    /**
     * Replaces the current option list with a new set of arrow directions.
     * @param arrows The arrow directions to render.
     */
    protected rebuildOptions(arrows: ArrowDirection[]): void {
        this.menu.innerHTML = '';
        for (const arrow of arrows) {
            this.menu.appendChild(this.buildOption(arrow));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

    /**
     * Builds a single option button containing an SVG arrow preview.
     * @param arrow The arrow direction value for this option.
     * @returns The constructed option button element.
     */
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

        return option;
    }

    /**
     * Creates an SVG element visualising the given arrow direction with an optional arrowhead.
     * @param arrow The arrow direction to draw.
     * @returns The SVG element.
     */
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

    /**
     * Creates an SVG polygon representing a single arrowhead at the given position.
     * @param x Horizontal position of the arrowhead tip.
     * @param y Vertical position of the arrowhead tip.
     * @param direction 'forward' points right; 'backward' points left.
     * @returns The SVG polygon element.
     */
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

    /**
     * Normalises any value into a valid ArrowDirection, falling back to 'none'.
     * @param arrow Raw value to normalise.
     * @returns A valid ArrowDirection string.
     */
    protected normalizeArrow(arrow: ArrowDirection | string | undefined): ArrowDirection {
        if (arrow === 'start' || arrow === 'end' || arrow === 'both' || arrow === 'none') {
            return arrow;
        }
        return 'none';
    }

    /**
     * Updates the internal selection state, syncs the trigger and option list, and optionally emits 'arrowchange'.
     * @param arrow The new arrow direction to select.
     * @param emit Whether to dispatch the change event. Defaults to true.
     */
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

    /**
     * Updates the trigger button's swatch to show the current arrow direction.
     */
    protected syncTrigger(): void {
        this.triggerSwatch.innerHTML = '';
        this.triggerSwatch.appendChild(this.createArrowSvg(this.selected));
    }

    /**
     * Toggles the selected CSS class and aria-selected attribute on all arrow option buttons.
     */
    protected syncSelectedOption(): void {
        const options = this.menu.querySelectorAll<HTMLElement>('[data-arrow]');
        options.forEach((option) => {
            const isSelected = option.dataset.arrow === this.selected;
            toggleClasses(option, isSelected, DEFAULT_CONFIG.selectedClassName, this.config.selectedClassName);
            option.setAttribute('aria-selected', String(isSelected));
        });
    }

    /**
     * Adds the open CSS class and updates aria-expanded on the trigger button.
     */
    protected openMenu(): void {
        setClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'true');
    }

    /**
     * Removes the open CSS class and updates aria-expanded on the trigger button.
     */
    protected closeMenu(): void {
        removeClasses(this.host, DEFAULT_CONFIG.openClassName, this.config.openClassName);
        this.trigger.setAttribute('aria-expanded', 'false');
    }
}

// export class ArrowDirectionSelect extends ArrowDirectionSelect { }
