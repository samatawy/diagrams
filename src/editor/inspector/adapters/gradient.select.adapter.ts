import { GradientPicker } from '../../gradient/gradient.picker';
import type { IGradient } from '../../../color.types';
import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from '../inspector.adapter';

import { GradientSelect, type GradientSelectConfig } from '../../inputs/gradient.select';
const STYLE_ID = 'gp-defaults';

/**
 * Inspector adapter for `fillStyle.gradient` and similar properties.
 *
 * Renders a full-width swatch button (class `gp-trigger`) that opens
 * {@link GradientPicker} as an anchored popup when clicked.  The gradient
 * preview is painted as the button's `background-image`.
 *
 * Mixed / unset states are handled by the inspector's existing CSS rules for
 * `.is-mixed` and `.is-unset` cells — `.gp-trigger` is included in those
 * selectors so "Multiple" appears automatically via `::after`.
 */
export class GradientSelectAdapter extends InspectorAdapter {

    private readonly editor: GradientSelect;

    constructor(cell: HTMLElement, mixedClassName: string, _initial: InspectorAdapterInit) {
        super(cell, mixedClassName);
        const host = document.createElement('div');
        host.style.width = '100%';
        cell.appendChild(host);
        const options: GradientSelectConfig = {
            ...(_initial.def.editorOptions as GradientSelectConfig),
        };
        this.editor = new GradientSelect(host, options);
        host.addEventListener('gradientchange', (e) => {
            this.setUnset(false);
            this.notifyChange((e as CustomEvent<IGradient>).detail);
        });
    }

    // ---- InspectorAdapter protocol ------------------------------------

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const hasValue = value !== undefined && value !== null && String(value) !== '';
        this.setUnset(!hasValue);
        if (hasValue) {
            this.editor.value = value as IGradient;
        }
    }

    override getValue(): EditableRecord {
        return { [this.returnKey ?? 'fillStyle.gradient']: this.editor.value ?? undefined };
    }

    override destroy(): void {
        this.editor.destroy();
        super.destroy();
    }
}
