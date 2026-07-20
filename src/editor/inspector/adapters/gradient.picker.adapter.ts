import { GradientPicker } from '../../gradient/gradient.picker';
import type { IGradient } from '../../../color.types';
import { CHECKER_CSS_IMAGE } from '../../../color.types';
import { buildGradientCss } from '../../gradient/color.utils';
import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from '../inspector.adapter';
import { injectStyles } from '../../editor.utils';

import DEFAULT_STYLES from '../../../css_generated/editor/gradient/gradient.adapter.css';
const STYLE_ID = 'gp-defaults';

/**
 * Inspector adapter for `fillStyle.gradient`.
 *
 * Renders a full-width swatch button (class `gp-trigger`) that opens
 * {@link GradientPicker} as an anchored popup when clicked.  The gradient
 * preview is painted as the button's `background-image`.
 *
 * Mixed / unset states are handled by the inspector's existing CSS rules for
 * `.is-mixed` and `.is-unset` cells — `.gp-trigger` is included in those
 * selectors so "Multiple" appears automatically via `::after`.
 */
export class GradientPickerAdapter extends InspectorAdapter {

    private readonly trigger: HTMLButtonElement;
    /** Inner swatch div — gradient background lives here so CSS `>* opacity:0` hides it during mixed/unset. */
    private readonly swatch: HTMLDivElement;
    private _value: IGradient | null = null;
    private _picker: GradientPicker | null = null;

    constructor(cell: HTMLElement, mixedClassName: string, _initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        injectStyles(STYLE_ID, DEFAULT_STYLES);

        // Trigger styled to match .color-preset-trigger exactly.
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'gp-trigger';
        this.trigger.title = 'Edit gradient…';

        // Inner swatch — mirrors .color-preset-swatch structure.
        // backgroundImage and backgroundSize are always set together in syncSwatch().
        this.swatch = document.createElement('div');
        this.swatch.className = 'gp-swatch';

        this.trigger.appendChild(this.swatch);
        this.trigger.addEventListener('click', () => this.openPicker());
        cell.appendChild(this.trigger);
    }

    // ---- InspectorAdapter protocol ------------------------------------

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const gradient = value as IGradient | undefined | null;
        const hasValue = gradient != null && Array.isArray(gradient.stops) && gradient.stops.length > 0;
        this.setUnset(!hasValue);
        this._value = hasValue ? gradient : null;
        this.syncSwatch();
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? 'fillStyle.gradient']: this._value ?? undefined };
    }

    override destroy(): void {
        this._picker?.destroy();
        this._picker = null;
        super.destroy();
    }

    // ---- Private helpers ----------------------------------------------

    private openPicker(): void {
        this._picker?.destroy();
        this._picker = null;

        this._picker = GradientPicker.open(this.trigger, this._value ?? undefined, (v) => {
            this._value = v;
            this.setUnset(false);
            this.syncSwatch();
            this.notifyChange(v);
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
