import type { ArrowType } from '../../types';
import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

export interface ArrowTypeSelectConfig {
    arrows?: ArrowType[];
    strokeColor?: string;
    hostClassName?: string;
    triggerClassName?: string;
    menuClassName?: string;
    optionClassName?: string;
    swatchClassName?: string;
    selectedClassName?: string;
    openClassName?: string;
}

const DEFAULT_ARROWS: ArrowType[] = [
    'solid_triangle',
    'hollow_triangle',
    'solid_spear',
    'hollow_spear',
    'solid_diamond',
    'hollow_diamond',
    'solid_circle',
    'hollow_circle',
    'none',
];

const DEFAULT_CONFIG: Required<Omit<ArrowTypeSelectConfig, 'arrows'>> & { arrows: ArrowType[] } = {
    arrows: DEFAULT_ARROWS,
    strokeColor: '#1f2937',
    hostClassName: 'arrow-select-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    swatchClassName: 'arrow-width-swatch',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

const STYLE_ID = 'arrow-select-defaults';

const DEFAULT_STYLES = `
.arrow-select-control {
    position: relative;
    min-width: 90px;
    max-width: 130px;
    font-size: var(--diagram-ui-font-size, 12px);
    font-family: var(--diagram-ui-font-family, system-ui);
    line-height: 1.2;
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
    font-weight: 600;
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

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

export class ArrowTypeSelect {

    protected host: HTMLElement;
    protected config: Required<Omit<ArrowTypeSelectConfig, 'arrows'>> & { arrows: ArrowType[] };
    protected selected: ArrowType;
    protected trigger: HTMLButtonElement;
    protected triggerSwatch: HTMLDivElement;
    protected menu: HTMLDivElement;

    constructor(target: HTMLElement, config: ArrowTypeSelectConfig = {}) {
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

    public destroy(): void {
        this.trigger.removeEventListener('click', this.onTriggerClick);
        this.menu.removeEventListener('click', this.onOptionClick);
        if (typeof document !== 'undefined') {
            document.removeEventListener('click', this.onDocumentClick);
        }
        this.host.innerHTML = '';
    }

    public get value(): string {
        return this.selected;
    }

    public set value(arrow: ArrowType) {
        this.selectArrow(arrow);
    }

    public setOptions(arrows: ArrowType[], selectedArrow?: ArrowType): void {
        const normalized = arrows.map((arrow) => this.normalizeArrow(arrow));
        this.config.arrows = normalized;
        this.rebuildOptions(normalized);
        this.selectArrow(selectedArrow ?? normalized[0] ?? 'none', false);
    }

    protected readonly onTriggerClick = (): void => {
        if (this.host.classList.contains(DEFAULT_CONFIG.openClassName)) {
            this.closeMenu();
            return;
        }
        this.openMenu();
    };

    protected readonly onDocumentClick = (event: Event): void => {
        const target = event.target as Node | null;
        if (target && !this.host.contains(target)) {
            this.closeMenu();
        }
    };

    protected readonly onOptionClick = (event: Event): void => {
        const target = event.target as HTMLElement | null;
        const option = target?.closest<HTMLElement>('[data-arrow]');
        const value = option?.dataset.arrow as ArrowType | undefined;
        if (!value) return;

        this.selectArrow(value);
        this.closeMenu();
    };

    protected rebuildOptions(arrows: ArrowType[]): void {
        this.menu.innerHTML = '';
        for (const arrow of arrows) {
            this.menu.appendChild(this.buildOption(arrow));
        }
        this.syncSelectedOption();
        this.syncTrigger();
    }

    protected buildOption(arrow: ArrowType): HTMLButtonElement {
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

    protected createArrowSvg(arrow: ArrowType): SVGElement {
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

        const marker = this.createArrowMarker(normalized);
        if (marker) {
            svg.appendChild(marker);
        }

        return svg;
    }

    protected createArrowMarker(arrow: ArrowType): SVGElement | null {
        const stroke = this.config.strokeColor;
        const ns = 'http://www.w3.org/2000/svg';

        const makePoly = (points: string, fill: string, outline = false): SVGPolygonElement => {
            const p = document.createElementNS(ns, 'polygon');
            p.setAttribute('points', points);
            p.setAttribute('fill', fill);
            if (outline) {
                p.setAttribute('stroke', stroke);
                p.setAttribute('stroke-width', '2');
                p.setAttribute('stroke-linejoin', 'round');
            }
            return p;
        };

        switch (arrow) {
            case 'solid_triangle':
                return makePoly('90,10 82,6 82,14', stroke);
            case 'hollow_triangle':
                return makePoly('90,10 82,6 82,14', 'white', true);
            case 'solid_spear':
                return makePoly('90,10 82,5 85,10 82,15', stroke);
            case 'hollow_spear':
                return makePoly('90,10 82,5 85,10 82,15', 'white', true);
            case 'solid_diamond':
                return makePoly('90,10 84,6 78,10 84,14', stroke);
            case 'hollow_diamond':
                return makePoly('90,10 84,6 78,10 84,14', 'white', true);
            case 'solid_circle': {
                const c = document.createElementNS(ns, 'circle');
                c.setAttribute('cx', '84');
                c.setAttribute('cy', '10');
                c.setAttribute('r', '4');
                c.setAttribute('fill', stroke);
                return c;
            }
            case 'hollow_circle': {
                const c = document.createElementNS(ns, 'circle');
                c.setAttribute('cx', '84');
                c.setAttribute('cy', '10');
                c.setAttribute('r', '4');
                c.setAttribute('fill', 'white');
                c.setAttribute('stroke', stroke);
                c.setAttribute('stroke-width', '2');
                return c;
            }
            default:
                return null;
        }
    }

    protected normalizeArrow(arrow: ArrowType | string | undefined): ArrowType {
        if (arrow === 'solid_triangle' || arrow === 'hollow_triangle'
            || arrow === 'solid_spear' || arrow === 'hollow_spear'
            || arrow === 'solid_diamond' || arrow === 'hollow_diamond'
            || arrow === 'solid_circle' || arrow === 'hollow_circle'
            || arrow === 'none') {
            return arrow;
        }
        return 'none';
    }

    protected selectArrow(arrow: ArrowType, emit = true): void {
        const next = this.normalizeArrow(arrow);
        this.selected = next;
        this.syncTrigger();
        this.syncSelectedOption();

        if (!emit) {
            return;
        }
        this.host.dispatchEvent(new CustomEvent<ArrowType>('arrowtypechange', { detail: next }));
    }

    protected syncTrigger(): void {
        this.triggerSwatch.innerHTML = '';
        this.triggerSwatch.appendChild(this.createArrowSvg(this.selected));
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
