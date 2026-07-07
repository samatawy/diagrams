import { TRANSPARENT_CSS_PATTERN, CHECKER_CSS_IMAGE } from '../../color.types';
import { injectStyles, setClasses, toggleClasses } from '../editor.utils';
import DEFAULT_STYLES from '../../css_generated/editor/gradient/gradient.picker.css';
import type { GradientStop, GradientType, GradientValue } from '../../color.types';
import { buildGradientCss, hslToRgba, parseColor, rgbaToCss, rgbaToHex, rgbaToHsl } from './color.utils';

const STYLE_ID = 'gradient-picker-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

// ---- Colour utilities --------------------------------------------------


// ---- Helpers -----------------------------------------------------------

function uid(): string {
    return Math.random().toString(36).slice(2, 9);
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function defaultValue(): GradientValue {
    return {
        type: 'linear',
        angle: 90,
        centerX: 50,
        centerY: 50,
        stops: [
            { id: uid(), color: 'rgba(0,0,0,1)', position: 0 },
            { id: uid(), color: 'rgba(255,255,255,1)', position: 100 },
        ],
    };
}

// ---- GradientPicker ----------------------------------------------------

/**
 * A standalone gradient editor popup.
 *
 * Usage — inline into any container:
 * ```ts
 * const picker = new GradientPicker(hostEl, initialValue);
 * picker.onChange = (v) => console.log(v);
 * ```
 *
 * Usage — anchored popup (positions itself next to a trigger element):
 * ```ts
 * const picker = GradientPicker.open(triggerEl, initialValue, (v) => {
 *     console.log('changed', v);
 * });
 * ```
 */
export class GradientPicker {

    /** Fires whenever the gradient value changes. */
    public onChange: ((value: GradientValue) => void) | null = null;

    private readonly panel: HTMLElement;
    private _value: GradientValue;
    private _selectedStopId: string | null = null;
    private _colorMode: 'rgba' | 'hsla' | 'hex' = 'rgba';

    // Left column
    private preview!: HTMLElement;
    private typeTabEls!: HTMLButtonElement[];
    private angleRow!: HTMLElement;
    private angleSlider!: HTMLInputElement;
    private angleInput!: HTMLInputElement;
    private centerXRow!: HTMLElement;
    private centerXSlider!: HTMLInputElement;
    private centerXInput!: HTMLInputElement;
    private centerYRow!: HTMLElement;
    private centerYSlider!: HTMLInputElement;
    private centerYInput!: HTMLInputElement;

    // Right column
    private stopList!: HTMLElement;
    private noSelectionEl!: HTMLElement;
    private colorTabsWrap!: HTMLElement;
    private colorTabEls!: HTMLButtonElement[];
    private rgbaPanel!: HTMLElement;
    private hslPanel!: HTMLElement;
    private hexPanel!: HTMLElement;

    // RGBA refs
    private rSlider!: HTMLInputElement; private rInput!: HTMLInputElement;
    private gSlider!: HTMLInputElement; private gInput!: HTMLInputElement;
    private bSlider!: HTMLInputElement; private bInput!: HTMLInputElement;
    private aSlider!: HTMLInputElement; private aInput!: HTMLInputElement;

    // HSL refs
    private hSlider!: HTMLInputElement; private hInput!: HTMLInputElement;
    private sSlider!: HTMLInputElement; private sInput!: HTMLInputElement;
    private lSlider!: HTMLInputElement; private lInput!: HTMLInputElement;
    private haSlider!: HTMLInputElement; private haInput!: HTMLInputElement;

    // HEX ref
    private hexInput!: HTMLInputElement;

    private readonly _onDocClick: (e: Event) => void;

    constructor(container: HTMLElement, initial?: Partial<GradientValue>) {
        ensureDefaultStyles();

        const base = defaultValue();
        this._value = {
            ...base,
            ...initial,
            stops: (initial?.stops ?? base.stops).map(s => ({ ...s })),
        };
        this._selectedStopId = this._value.stops[0]?.id ?? null;

        this.panel = document.createElement('div');
        setClasses(this.panel, 'gp-popup');
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-label', 'Gradient editor');

        const body = document.createElement('div');
        setClasses(body, 'gp-body');
        body.appendChild(this.buildLeftColumn());
        body.appendChild(this.buildRightColumn());
        this.panel.appendChild(body);

        container.appendChild(this.panel);

        this._onDocClick = (e: Event) => {
            // Use composedPath() instead of e.target so that clicks which
            // trigger a DOM re-render (e.g. delete-stop) don't close the
            // panel: by the time the event bubbles to `document` the clicked
            // element may already be detached, making contains() return false.
            if (!e.composedPath().includes(this.panel)) {
                this.destroy();
            }
        };
        // Delay so the triggering click doesn't immediately close the panel.
        setTimeout(() => document.addEventListener('click', this._onDocClick), 0);

        this.syncAll();
    }

    // ---- Static factory ------------------------------------------------

    /**
     * Opens a gradient picker anchored to `anchor`, positioned below it (or above
     * if there is not enough room). Returns the picker instance so the caller can
     * destroy it programmatically if needed.
     */
    public static open(
        anchor: HTMLElement,
        initial?: GradientValue,
        onChange?: (v: GradientValue) => void,
    ): GradientPicker {
        const picker = new GradientPicker(document.body, initial);
        if (onChange) picker.onChange = onChange;

        const rect = anchor.getBoundingClientRect();
        const PW = 460;
        const PH = 390; // approximate

        let left = rect.left + window.scrollX;
        let top = rect.bottom + window.scrollY + 6;

        if (rect.left + PW > window.innerWidth - 8) {
            left = Math.max(8 + window.scrollX, window.innerWidth - PW - 8 + window.scrollX);
        }
        if (rect.bottom + PH + 6 > window.innerHeight) {
            top = rect.top + window.scrollY - PH - 6;
        }

        picker.panel.style.left = `${left}px`;
        picker.panel.style.top = `${top}px`;

        return picker;
    }

    // ---- Lifecycle -----------------------------------------------------

    /** Removes the panel from the DOM and releases event listeners. */
    public destroy(): void {
        document.removeEventListener('click', this._onDocClick);
        this.panel.remove();
    }

    // ---- Value ---------------------------------------------------------

    /** Returns a deep copy of the current gradient value. */
    public get value(): GradientValue {
        return { ...this._value, stops: this._value.stops.map(s => ({ ...s })) };
    }

    /** Replaces the current value and re-renders the panel. */
    public set value(v: GradientValue) {
        this._value = { ...v, stops: v.stops.map(s => ({ ...s })) };
        this.syncAll();
    }

    // ---- Build DOM — left column ---------------------------------------

    private buildLeftColumn(): HTMLElement {
        const col = document.createElement('div');
        setClasses(col, 'gp-left');

        // Preview — bleeds to the top/left/right edges of the panel
        this.preview = document.createElement('div');
        setClasses(this.preview, 'gp-preview');
        col.appendChild(this.preview);

        // Controls wrapper (padded below the preview)
        const controlsArea = document.createElement('div');
        setClasses(controlsArea, 'gp-left-controls');

        // Type tabs
        const tabsWrap = document.createElement('div');
        setClasses(tabsWrap, 'gp-type-tabs');

        const TYPES: GradientType[] = ['linear', 'radial', 'conic'];
        this.typeTabEls = TYPES.map(type => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            setClasses(btn, 'gp-type-tab');
            btn.addEventListener('click', () => this.setType(type));
            tabsWrap.appendChild(btn);
            return btn;
        });
        controlsArea.appendChild(tabsWrap);

        // Structural controls
        const controls = document.createElement('div');
        setClasses(controls, 'gp-controls');

        this.angleRow = this.buildControlRow('Angle', 0, 360, v => {
            this._value.angle = v;
            this.updatePreview();
            this.emitChange();
        });
        [this.angleSlider, this.angleInput] = this.sliderInputsOf(this.angleRow);
        controls.appendChild(this.angleRow);

        this.centerXRow = this.buildControlRow('Center X', 0, 100, v => {
            this._value.centerX = v;
            this.updatePreview();
            this.emitChange();
        });
        [this.centerXSlider, this.centerXInput] = this.sliderInputsOf(this.centerXRow);
        controls.appendChild(this.centerXRow);

        this.centerYRow = this.buildControlRow('Center Y', 0, 100, v => {
            this._value.centerY = v;
            this.updatePreview();
            this.emitChange();
        });
        [this.centerYSlider, this.centerYInput] = this.sliderInputsOf(this.centerYRow);
        controls.appendChild(this.centerYRow);

        controlsArea.appendChild(controls);
        col.appendChild(controlsArea);
        return col;
    }

    private buildControlRow(
        label: string,
        min: number,
        max: number,
        onChange: (v: number) => void,
    ): HTMLElement {
        const row = document.createElement('div');
        setClasses(row, 'gp-control-row');

        const lbl = document.createElement('span');
        setClasses(lbl, 'gp-control-label');
        lbl.textContent = label;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = String(min);
        slider.max = String(max);
        setClasses(slider, 'gp-range');

        const input = document.createElement('input');
        input.type = 'number';
        input.min = String(min);
        input.max = String(max);
        setClasses(input, 'gp-control-value');

        slider.addEventListener('input', () => {
            input.value = slider.value;
            onChange(+slider.value);
        });
        input.addEventListener('change', () => {
            const v = clamp(+input.value, min, max);
            slider.value = String(v);
            input.value = String(v);
            onChange(v);
        });

        row.appendChild(lbl);
        row.appendChild(slider);
        row.appendChild(input);
        return row;
    }

    private sliderInputsOf(row: HTMLElement): [HTMLInputElement, HTMLInputElement] {
        const inputs = row.querySelectorAll<HTMLInputElement>('input');
        return [inputs[0]!, inputs[1]!];
    }

    // ---- Build DOM — right column --------------------------------------

    private buildRightColumn(): HTMLElement {
        const col = document.createElement('div');
        setClasses(col, 'gp-right');

        // Stop list
        this.stopList = document.createElement('div');
        setClasses(this.stopList, 'gp-stops');
        col.appendChild(this.stopList);

        // Add-stop button
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        setClasses(addBtn, 'gp-add-stop');
        addBtn.textContent = '+ Add stop';
        addBtn.addEventListener('click', () => this.addStop());
        col.appendChild(addBtn);

        // Divider
        const divider = document.createElement('div');
        setClasses(divider, 'gp-divider');
        col.appendChild(divider);

        // No-selection placeholder
        this.noSelectionEl = document.createElement('div');
        setClasses(this.noSelectionEl, 'gp-no-selection');
        this.noSelectionEl.textContent = 'Select a stop to edit its colour';
        col.appendChild(this.noSelectionEl);

        // Colour mode tabs
        this.colorTabsWrap = document.createElement('div');
        setClasses(this.colorTabsWrap, 'gp-color-tabs');
        const COLOR_MODES = ['rgba', 'hsla', 'hex'] as const;
        this.colorTabEls = COLOR_MODES.map(mode => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = mode.toUpperCase();
            setClasses(btn, 'gp-color-tab');
            btn.addEventListener('click', () => this.setColorMode(mode));
            this.colorTabsWrap.appendChild(btn);
            return btn;
        });
        col.appendChild(this.colorTabsWrap);

        // RGBA channels
        this.rgbaPanel = document.createElement('div');
        setClasses(this.rgbaPanel, 'gp-channels');

        const RGBA_CHANNELS = [
            { label: 'R', min: 0, max: 255 },
            { label: 'G', min: 0, max: 255 },
            { label: 'B', min: 0, max: 255 },
            { label: 'A', min: 0, max: 100 },
        ] as const;

        for (const ch of RGBA_CHANNELS) {
            const row = this.buildChannelRow(ch.label, ch.min, ch.max, v => {
                const stop = this.selectedStop;
                if (!stop) return;
                const c = parseColor(stop.color);
                if (ch.label === 'R') c.r = v;
                else if (ch.label === 'G') c.g = v;
                else if (ch.label === 'B') c.b = v;
                else c.a = v / 100;
                stop.color = rgbaToCss(c);
                this.updateStopSwatch(stop.id);
                this.updatePreview();
                this.syncChannelTracks();
                this.emitChange();
            });
            const [slider, input] = this.sliderInputsOf(row);
            if (ch.label === 'R') { this.rSlider = slider; this.rInput = input; }
            else if (ch.label === 'G') { this.gSlider = slider; this.gInput = input; }
            else if (ch.label === 'B') { this.bSlider = slider; this.bInput = input; }
            else { this.aSlider = slider; this.aInput = input; }
            this.rgbaPanel.appendChild(row);
        }
        col.appendChild(this.rgbaPanel);

        // HSL channels
        this.hslPanel = document.createElement('div');
        setClasses(this.hslPanel, 'gp-channels');

        const HSL_CHANNELS = [
            { label: 'H', min: 0, max: 360 },
            { label: 'S', min: 0, max: 100 },
            { label: 'L', min: 0, max: 100 },
            { label: 'A', min: 0, max: 100 },
        ] as const;

        for (const ch of HSL_CHANNELS) {
            const row = this.buildChannelRow(ch.label, ch.min, ch.max, v => {
                const stop = this.selectedStop;
                if (!stop) return;
                const rgba = parseColor(stop.color);
                const hsl = rgbaToHsl(rgba);
                if (ch.label === 'H') hsl.h = v;
                else if (ch.label === 'S') hsl.s = v;
                else if (ch.label === 'L') hsl.l = v;
                else rgba.a = v / 100; // A channel — bypass HSL
                stop.color = rgbaToCss(ch.label === 'A' ? rgba : hslToRgba(hsl, rgba.a));
                this.updateStopSwatch(stop.id);
                this.updatePreview();
                this.syncChannelTracks();
                this.emitChange();
            });
            const [slider, input] = this.sliderInputsOf(row);
            if (ch.label === 'H') { this.hSlider = slider; this.hInput = input; }
            else if (ch.label === 'S') { this.sSlider = slider; this.sInput = input; }
            else if (ch.label === 'L') { this.lSlider = slider; this.lInput = input; }
            else { this.haSlider = slider; this.haInput = input; }
            this.hslPanel.appendChild(row);
        }
        col.appendChild(this.hslPanel);

        // HEX panel
        this.hexPanel = document.createElement('div');
        setClasses(this.hexPanel, 'gp-channels');

        const hexRow = document.createElement('div');
        setClasses(hexRow, 'gp-hex-row');

        const hexLbl = document.createElement('span');
        setClasses(hexLbl, 'gp-channel-label');
        hexLbl.textContent = '#';

        this.hexInput = document.createElement('input');
        this.hexInput.type = 'text';
        this.hexInput.placeholder = 'rrggbb / rrggbbaa';
        setClasses(this.hexInput, 'gp-hex-input');
        this.hexInput.addEventListener('change', () => {
            const stop = this.selectedStop;
            if (!stop) return;
            const rgba = parseColor(this.hexInput.value);
            stop.color = rgbaToCss(rgba);
            this.updateStopSwatch(stop.id);
            this.updatePreview();
            this.syncColorEditor();
            this.emitChange();
        });

        hexRow.appendChild(hexLbl);
        hexRow.appendChild(this.hexInput);
        this.hexPanel.appendChild(hexRow);
        col.appendChild(this.hexPanel);

        return col;
    }

    private buildChannelRow(
        label: string,
        min: number,
        max: number,
        onChange: (v: number) => void,
    ): HTMLElement {
        const row = document.createElement('div');
        setClasses(row, 'gp-channel-row');

        const lbl = document.createElement('span');
        setClasses(lbl, 'gp-channel-label');
        lbl.textContent = label;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = String(min);
        slider.max = String(max);
        setClasses(slider, 'gp-range');

        const input = document.createElement('input');
        input.type = 'number';
        input.min = String(min);
        input.max = String(max);
        setClasses(input, 'gp-channel-value');

        slider.addEventListener('input', () => {
            input.value = slider.value;
            onChange(+slider.value);
        });
        input.addEventListener('change', () => {
            const v = clamp(+input.value, min, max);
            slider.value = String(v);
            input.value = String(v);
            onChange(v);
        });

        row.appendChild(lbl);
        row.appendChild(slider);
        row.appendChild(input);
        return row;
    }

    // ---- Build stop row ------------------------------------------------

    private buildStopRow(stop: GradientStop): HTMLElement {
        const row = document.createElement('div');
        setClasses(row, 'gp-stop-row');
        if (stop.id === this._selectedStopId) setClasses(row, 'selected');
        row.dataset['stopId'] = stop.id;

        // Colour swatch
        const swatchWrap = document.createElement('div');
        setClasses(swatchWrap, 'gp-stop-swatch');

        const swatchFill = document.createElement('div');
        setClasses(swatchFill, 'gp-stop-swatch-fill');
        swatchFill.style.background = stop.color;
        swatchWrap.appendChild(swatchFill);

        // Position slider
        const posSlider = document.createElement('input');
        posSlider.type = 'range';
        posSlider.min = '0';
        posSlider.max = '100';
        posSlider.value = String(stop.position);
        setClasses(posSlider, 'gp-range');
        posSlider.style.background = 'linear-gradient(to right, #e2e8f0, #94a3b8)';

        // Position number input
        const posInput = document.createElement('input');
        posInput.type = 'number';
        posInput.min = '0';
        posInput.max = '100';
        posInput.value = String(stop.position);
        setClasses(posInput, 'gp-stop-pos-value');

        posSlider.addEventListener('input', () => {
            stop.position = +posSlider.value;
            posInput.value = posSlider.value;
            this.updatePreview();
            this.emitChange();
        });
        posInput.addEventListener('change', () => {
            const v = clamp(+posInput.value, 0, 100);
            stop.position = v;
            posSlider.value = String(v);
            posInput.value = String(v);
            this.updatePreview();
            this.emitChange();
        });

        // Delete button
        const del = document.createElement('button');
        del.type = 'button';
        del.textContent = '×';
        del.setAttribute('aria-label', 'Remove stop');
        setClasses(del, 'gp-stop-delete');
        del.addEventListener('click', e => {
            e.stopPropagation();
            this.deleteStop(stop.id);
        });

        row.addEventListener('click', () => this.selectStop(stop.id));

        row.appendChild(swatchWrap);
        row.appendChild(posSlider);
        row.appendChild(posInput);
        row.appendChild(del);

        return row;
    }

    // ---- Sync / render -------------------------------------------------

    private syncAll(): void {
        this.syncTypeTabs();
        this.syncControls();
        this.updatePreview();
        this.renderStopList();
        this.syncColorEditor();
        this.syncColorTabs();
    }

    private syncTypeTabs(): void {
        const TYPES: GradientType[] = ['linear', 'radial', 'conic'];
        this.typeTabEls.forEach((btn, i) => {
            toggleClasses(btn, this._value.type === TYPES[i], 'active');
        });
    }

    private syncControls(): void {
        const type = this._value.type;

        // Angle: shown for linear and conic
        this.angleRow.style.display = type === 'radial' ? 'none' : '';
        // Centre: shown for radial and conic
        this.centerXRow.style.display = type === 'linear' ? 'none' : '';
        this.centerYRow.style.display = type === 'linear' ? 'none' : '';

        this.angleSlider.value = String(this._value.angle);
        this.angleInput.value = String(this._value.angle);
        this.centerXSlider.value = String(this._value.centerX);
        this.centerXInput.value = String(this._value.centerX);
        this.centerYSlider.value = String(this._value.centerY);
        this.centerYInput.value = String(this._value.centerY);
    }

    private updatePreview(): void {
        const css = buildGradientCss(this._value);
        this.preview.style.backgroundImage =
            `${css}, ${CHECKER_CSS_IMAGE}`;
        this.preview.style.backgroundSize = 'auto, 10px 10px';
    }

    private renderStopList(): void {
        this.stopList.innerHTML = '';
        for (const stop of this._value.stops) {
            this.stopList.appendChild(this.buildStopRow(stop));
        }
    }

    /**
     * Updates only the swatch colour in an existing stop row, avoiding a full
     * re-render while the user drags a colour slider.
     */
    private updateStopSwatch(id: string): void {
        const stop = this._value.stops.find(s => s.id === id);
        if (!stop) return;
        const row = this.stopList.querySelector<HTMLElement>(`[data-stop-id="${id}"]`);
        const fill = row?.querySelector<HTMLElement>('.gp-stop-swatch-fill');
        if (fill) fill.style.background = stop.color;
    }

    private syncColorEditor(): void {
        const stop = this.selectedStop;
        const has = stop !== null;

        this.noSelectionEl.style.display = has ? 'none' : '';
        this.colorTabsWrap.style.display = has ? '' : 'none';
        this.rgbaPanel.style.display = 'none';
        this.hslPanel.style.display = 'none';
        this.hexPanel.style.display = 'none';

        if (!stop) return;

        if (this._colorMode === 'rgba') this.rgbaPanel.style.display = '';
        else if (this._colorMode === 'hsla') this.hslPanel.style.display = '';
        else this.hexPanel.style.display = '';

        const rgba = parseColor(stop.color);
        const hsl = rgbaToHsl(rgba);

        this.rSlider.value = String(Math.round(rgba.r)); this.rInput.value = this.rSlider.value;
        this.gSlider.value = String(Math.round(rgba.g)); this.gInput.value = this.gSlider.value;
        this.bSlider.value = String(Math.round(rgba.b)); this.bInput.value = this.bSlider.value;
        this.aSlider.value = String(Math.round(rgba.a * 100)); this.aInput.value = this.aSlider.value;

        this.hSlider.value = String(hsl.h); this.hInput.value = this.hSlider.value;
        this.sSlider.value = String(hsl.s); this.sInput.value = this.sSlider.value;
        this.lSlider.value = String(hsl.l); this.lInput.value = this.lSlider.value;
        this.haSlider.value = String(Math.round(rgba.a * 100)); this.haInput.value = this.haSlider.value;

        this.hexInput.value = rgbaToHex(rgba);

        this.syncChannelTracks();
    }

    private syncChannelTracks(): void {
        const stop = this.selectedStop;
        if (!stop) return;

        const { r, g, b, a } = parseColor(stop.color);
        const hsl = rgbaToHsl({ r, g, b, a });

        const checker = TRANSPARENT_CSS_PATTERN;
        // const checker = 'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 0 0 / 8px 8px';

        this.rSlider.style.background = `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}))`;
        this.gSlider.style.background = `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`;
        this.bSlider.style.background = `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`;

        this.aSlider.style.backgroundImage =
            `linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1)), ${checker}`;
        this.aSlider.style.backgroundSize = 'auto, 8px 8px';

        this.hSlider.style.background =
            `linear-gradient(to right, hsl(0,${hsl.s}%,${hsl.l}%), ` +
            `hsl(60,${hsl.s}%,${hsl.l}%), hsl(120,${hsl.s}%,${hsl.l}%), ` +
            `hsl(180,${hsl.s}%,${hsl.l}%), hsl(240,${hsl.s}%,${hsl.l}%), ` +
            `hsl(300,${hsl.s}%,${hsl.l}%), hsl(360,${hsl.s}%,${hsl.l}%))`;
        this.sSlider.style.background =
            `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))`;
        this.lSlider.style.background =
            `linear-gradient(to right, hsl(${hsl.h},${hsl.s}%,0%), ` +
            `hsl(${hsl.h},${hsl.s}%,50%), hsl(${hsl.h},${hsl.s}%,100%))`;
        // HSLA alpha track — same checkerboard ramp as RGBA
        const { r: hr, g: hg, b: hb } = hslToRgba(hsl, 1);
        this.haSlider.style.backgroundImage =
            `linear-gradient(to right, rgba(${hr},${hg},${hb},0), rgba(${hr},${hg},${hb},1)), ${checker}`;
        this.haSlider.style.backgroundSize = 'auto, 8px 8px';
    }

    private syncColorTabs(): void {
        const MODES = ['rgba', 'hsla', 'hex'] as const;
        this.colorTabEls.forEach((btn, i) => {
            toggleClasses(btn, this._colorMode === MODES[i], 'active');
        });
    }

    // ---- Actions -------------------------------------------------------

    private setType(type: GradientType): void {
        this._value.type = type;
        this.syncTypeTabs();
        this.syncControls();
        this.updatePreview();
        this.emitChange();
    }

    private setColorMode(mode: 'rgba' | 'hsla' | 'hex'): void {
        this._colorMode = mode;
        this.syncColorTabs();
        this.syncColorEditor();
    }

    private selectStop(id: string): void {
        this._selectedStopId = id;
        this.renderStopList();
        this.syncColorEditor();
    }

    private addStop(): void {
        const sorted = [...this._value.stops].sort((a, b) => a.position - b.position);

        // Place the new stop at the midpoint of the largest positional gap.
        let bestPos = 50;
        let maxGap = 0;
        for (let i = 0; i < sorted.length - 1; i++) {
            const gap = (sorted[i + 1]!.position) - (sorted[i]!.position);
            if (gap > maxGap) {
                maxGap = gap;
                bestPos = ((sorted[i]!.position) + (sorted[i + 1]!.position)) / 2;
            }
        }

        const newStop: GradientStop = {
            id: uid(),
            color: this.interpolateColor(bestPos),
            position: bestPos,
        };

        this._value.stops.push(newStop);
        this._selectedStopId = newStop.id;

        this.renderStopList();
        this.updatePreview();
        this.syncColorEditor();
        this.emitChange();
    }

    private deleteStop(id: string): void {
        if (this._value.stops.length <= 2) return; // minimum two stops
        this._value.stops = this._value.stops.filter(s => s.id !== id);
        if (this._selectedStopId === id) {
            this._selectedStopId = this._value.stops[0]?.id ?? null;
        }
        this.renderStopList();
        this.updatePreview();
        this.syncColorEditor();
        this.emitChange();
    }

    private interpolateColor(pos: number): string {
        const stops = [...this._value.stops].sort((a, b) => a.position - b.position);
        if (stops.length === 0) return 'rgba(128,128,128,1)';
        if (pos <= stops[0]!.position) return stops[0]!.color;
        if (pos >= stops[stops.length - 1]!.position) return stops[stops.length - 1]!.color;

        for (let i = 0; i < stops.length - 1; i++) {
            const a = stops[i]!;
            const b = stops[i + 1]!;
            if (pos >= a.position && pos <= b.position) {
                const t = (pos - a.position) / (b.position - a.position);
                const ca = parseColor(a.color);
                const cb = parseColor(b.color);
                return rgbaToCss({
                    r: ca.r + (cb.r - ca.r) * t,
                    g: ca.g + (cb.g - ca.g) * t,
                    b: ca.b + (cb.b - ca.b) * t,
                    a: ca.a + (cb.a - ca.a) * t,
                });
            }
        }
        return stops[stops.length - 1]!.color;
    }

    // ---- Helpers -------------------------------------------------------

    private get selectedStop(): GradientStop | null {
        return this._value.stops.find(s => s.id === this._selectedStopId) ?? null;
    }

    private emitChange(): void {
        this.onChange?.(this.value);
    }
}
