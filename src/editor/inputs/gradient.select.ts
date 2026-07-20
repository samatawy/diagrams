import { injectStyles, setClasses } from '../editor.utils';
import { CHECKER_CSS_IMAGE, type IGradient } from '../../color.types';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/gradient.select.css';
import { GradientPicker } from '../gradient/gradient.picker';
import { buildGradientCss } from '../gradient/color.utils';
const STYLE_ID = 'color-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * Configuration options for the ColorSelect control.
 * Provide only the properties you want to override; defaults will be used for the rest.
 */
export interface GradientSelectConfig {
    tooltip?: string;
    /**
     * Optional class name for the host element.
     */
    hostClassName?: string;
    /**
     * Optional class name for the trigger button.
     */
    triggerClassName?: string;
    /**
     * Optional class name for the color swatch elements.
     */
    swatchClassName?: string;
}

const DEFAULT_CONFIG: Required<GradientSelectConfig> = {
    tooltip: '',
    hostClassName: 'color-preset-control',
    triggerClassName: 'color-preset-trigger',
    swatchClassName: 'color-preset-swatch',
};

/**
 * A gradient selection control that supports the gradient picker dialog.
 * It dispatches a 'gradientchange' event with the selected gradient whenever the selection changes.
 */
export class GradientSelect {

    protected host: HTMLElement;

    protected config: Required<GradientSelectConfig>;

    private readonly trigger: HTMLButtonElement;

    /** Inner swatch div — gradient background lives here so CSS `>* opacity:0` hides it during mixed/unset. */
    private readonly swatch: HTMLDivElement;

    private _value: IGradient | null = null;

    private _picker: GradientPicker | null = null;

    /**
     * Creates a GradientSelect component inside the given element.
     * @param target The host element that will contain the color picker.
     * @param config Optional display and behaviour configuration.
     */
    constructor(target: HTMLElement, config: GradientSelectConfig = {}) {
        ensureDefaultStyles();

        this.host = target;

        this.config = { ...DEFAULT_CONFIG, ...config };

        this.host.innerHTML = '';
        setClasses(this.host, DEFAULT_CONFIG.hostClassName, this.config.hostClassName);

        // Trigger styled to match .color-preset-trigger exactly.
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        setClasses(this.trigger, 'gp-trigger', this.config.triggerClassName);
        this.trigger.title = this.config.tooltip ?? '';

        // Inner swatch — mirrors .color-preset-swatch structure.
        // backgroundImage and backgroundSize are always set together in syncSwatch().
        this.swatch = document.createElement('div');
        setClasses(this.swatch, 'gp-swatch', this.config.swatchClassName);

        this.trigger.appendChild(this.swatch);
        this.trigger.addEventListener('click', () => this.openPicker());

        this.host.appendChild(this.trigger);
    }

    /**
     * Releases DOM/event resources owned by the control.
     */
    public destroy(): void {
        this._picker?.destroy();
        this._picker = null;
        this.host.innerHTML = '';
    }

    /**
     * Gets the currently selected color value.
     */
    public get value(): IGradient | null {
        return this._value;
    }

    /**
     * Sets the selected color value.
     */
    public set value(gradient: IGradient | null | undefined) {
        this._value = gradient ?? null;
        this.syncSwatch();
        this.host.dispatchEvent(new CustomEvent('gradientchange', { detail: gradient }));
    }

    // ---- Private helpers ----------------------------------------------

    private openPicker(): void {
        this._picker?.destroy();
        this._picker = null;

        this._picker = GradientPicker.open(this.trigger, this._value ?? undefined, (v) => {
            this._value = v;
            this.syncSwatch();
            this.host.dispatchEvent(new CustomEvent('gradientchange', { detail: v }));
            // this.setUnset(false);
            // this.syncSwatch();
            // this.notifyChange(v);
        });
    }

    private syncSwatch(): void {
        if (!this._value) {
            // No gradient — show checker alone.
            this.swatch.style.backgroundImage = CHECKER_CSS_IMAGE;
            this.swatch.style.backgroundSize = '8px 8px';
            return;
        }
        // Use the canonical CSS string (same as the picker preview and canvas renderer).
        const gradientCss = buildGradientCss(this._value);
        // Gradient on top, checker underneath for transparent stops.
        this.swatch.style.backgroundImage = `${gradientCss}, ${CHECKER_CSS_IMAGE}`;
        this.swatch.style.backgroundSize = 'auto, 8px 8px';
    }

}