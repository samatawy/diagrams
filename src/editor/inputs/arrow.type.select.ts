import type { ArrowType } from '../../types';
import { injectStyles, setClasses, toggleClasses, removeClasses } from '../editor.utils';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/arrow.type.select.css';
const STYLE_ID = 'arrow-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

export interface ArrowTypeSelectConfig {
    tooltip?: string;
    arrows?: ArrowType[];
    direction?: 'start' | 'end';
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
    tooltip: '',
    arrows: DEFAULT_ARROWS,
    direction: 'end',
    strokeColor: 'var(--diagram-ui-text, #1f2937)',
    hostClassName: 'arrow-select-control',
    triggerClassName: 'color-preset-trigger',
    menuClassName: 'color-preset-menu',
    optionClassName: 'color-preset-option',
    swatchClassName: 'arrow-width-swatch',
    selectedClassName: 'is-selected',
    openClassName: 'is-open',
};

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
        this.trigger.title = this.config.tooltip;

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
        if (this.config.direction === 'start') {
            // const transform = 'scale(-1, 1)' translate(-100%, 0)';
            svg?.setAttribute('transform', 'scale(-1, 1)');
        }

        return svg;
    }

    protected createArrowMarker(arrow: ArrowType): SVGElement | null {
        const stroke = this.config.strokeColor;
        const hollow_fill = `var(--diagram-ui-surface, #ffffff)`;
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
                return makePoly('90,10 82,6 82,14', hollow_fill, true);
            case 'solid_spear':
                return makePoly('90,10 82,5 85,10 82,15', stroke);
            case 'hollow_spear':
                return makePoly('90,10 82,5 85,10 82,15', hollow_fill, true);
            case 'solid_diamond':
                return makePoly('90,10 84,6 78,10 84,14', stroke);
            case 'hollow_diamond':
                return makePoly('90,10 84,6 78,10 84,14', hollow_fill, true);
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
                c.setAttribute('fill', hollow_fill);
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
