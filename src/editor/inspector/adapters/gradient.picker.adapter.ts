import { GradientPicker } from '../../gradient/gradient.picker';
import type { GradientValue } from '../../../color.types';
import { CHECKER_CSS_IMAGE } from '../../../color.types';
import { buildGradientCss } from '../../gradient/color.utils';
import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from '../inspector.adapter';

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
    private _value: GradientValue | null = null;
    private _picker: GradientPicker | null = null;

    constructor(cell: HTMLElement, mixedClassName: string, _initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        // Trigger styled to match .color-preset-trigger exactly.
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'gp-trigger';
        this.trigger.title = 'Edit gradient…';
        Object.assign(this.trigger.style, {
            display: 'block',
            width: '100%',
            padding: '6px 8px',
            cursor: 'pointer',
            appearance: 'none',
            border: '1px solid rgba(15,23,42,0.15)',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.88)',
            position: 'relative',
            boxSizing: 'border-box',
        });

        // Inner swatch — mirrors .color-preset-swatch structure.
        // backgroundImage and backgroundSize are always set together in syncSwatch().
        this.swatch = document.createElement('div');
        Object.assign(this.swatch.style, {
            width: '100%',
            minHeight: '18px',
            borderRadius: '5px',
            border: '1px solid rgba(15,23,42,0.2)',
        });

        this.trigger.appendChild(this.swatch);
        this.trigger.addEventListener('click', () => this.openPicker());
        cell.appendChild(this.trigger);
    }

    // ---- InspectorAdapter protocol ------------------------------------

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const gradient = value as GradientValue | undefined | null;
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
