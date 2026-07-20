import { DiagramConstants } from '../../model/diagram.constants';
import type { ShadowStyle } from '../../style.interfaces';
import { injectStyles } from '../editor.utils';
import { EnumSelect, ENUM_SELECT_CHANGE_EVENT, type EnumSelectOption } from './enum.select';

import DEFAULT_STYLES from '../../css_generated/editor/inputs/shadow.preset.select.css';
const STYLE_ID = 'shadow-preset-select-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * A named shadow preset entry used by ShadowPresetSelect.
 */
export interface ShadowPreset {
    /** Display label shown in the dropdown. */
    label: string;
    /** Shadow style values applied when this preset is selected. */
    value: ShadowStyle;
}

/**
 * Built-in shadow presets drawn from DiagramConstants.
 */
const SHADOW_PRESETS: ShadowPreset[] = [
    { label: 'No Shadow', value: DiagramConstants.NO_SHADOW },
    { label: 'Low Shadow', value: DiagramConstants.LOW_SHADOW },
    { label: 'Medium Shadow', value: DiagramConstants.MEDIUM_SHADOW },
    { label: 'High Shadow', value: DiagramConstants.HIGH_SHADOW },
    { label: 'Low Color Drop', value: DiagramConstants.LOW_COLOR_SHADOW },
    { label: 'Medium Color Drop', value: DiagramConstants.MEDIUM_COLOR_SHADOW },
    { label: 'High Color Drop', value: DiagramConstants.HIGH_COLOR_SHADOW },
];

/**
 * Dispatched event name when the user selects a shadow preset.
 */
export const SHADOW_PRESET_CHANGE_EVENT = 'shadowpresetchange';

/**
 * Thin wrapper around EnumSelect configured for ShadowStyle presets.
 */
export class ShadowPresetSelect {

    protected readonly host: HTMLElement;
    protected readonly control: EnumSelect<ShadowStyle>;
    protected readonly onEnumChange: (event: Event) => void;

    constructor(host: HTMLElement, presets: ShadowPreset[] = SHADOW_PRESETS) {
        ensureDefaultStyles();

        this.host = host;

        const options: EnumSelectOption<ShadowStyle>[] = presets.map((preset) => ({
            label: preset.label,
            value: preset.value,
        }));

        this.control = new EnumSelect<ShadowStyle>(host, {
            options,
            equals: (left, right) =>
                left.color === right.color
                && left.blur === right.blur
                && left.offset.x === right.offset.x
                && left.offset.y === right.offset.y,

            tooltip: 'Select a shadow style for the selected node(s)',
            hostClassName: 'shadow-preset-select-control',
            triggerClassName: 'shadow-preset-trigger',
            menuClassName: 'shadow-preset-menu',
            optionClassName: 'shadow-preset-option',
            openClassName: 'is-open',
            selectedClassName: 'is-selected',
        });

        this.onEnumChange = (event: Event) => {
            const style = (event as CustomEvent<ShadowStyle>).detail;
            this.host.dispatchEvent(new CustomEvent<ShadowStyle>(SHADOW_PRESET_CHANGE_EVENT, {
                bubbles: true,
                detail: style,
            }));
        };

        this.host.addEventListener(ENUM_SELECT_CHANGE_EVENT, this.onEnumChange as EventListener);
    }

    public get value(): ShadowStyle {
        return this.control.value || SHADOW_PRESETS[0]!.value;
    }

    public set value(style: ShadowStyle) {
        this.control.value = style;
    }

    public destroy(): void {
        this.host.removeEventListener(ENUM_SELECT_CHANGE_EVENT, this.onEnumChange as EventListener);
        this.control.destroy();
    }
}
