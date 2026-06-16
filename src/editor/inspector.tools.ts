// import { ArrowSelect, type ArrowSelectConfig } from "./arrow.select";
// import { ColorSelect, type ColorSelectConfig } from "./color.select";
// import type { InspectorEditorInit, EditableRecord } from "./inspector/inspector";
// import { FontSelect, type FontSelectConfig } from "./font.select";
// import { InspectorValueEditor } from "./inspector/inspector";
// import { SizeSelect, type SizeSelectConfig } from "./size.select";
// import { WidthSelect, type WidthSelectConfig } from "./width.select";

// export type EnumSelectOption = string | { value: string; label?: string };

// export interface EnumSelectEditorConfig {
//     options: EnumSelectOption[];
//     placeholder?: string;
// }

// export class ColorSelectEditor extends InspectorValueEditor {

//     private readonly editor: ColorSelect;

//     constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
//         super(cell, mixedClassName);
//         const host = document.createElement('div');
//         host.style.width = '100%';
//         cell.appendChild(host);
//         const options: ColorSelectConfig = {
//             showLabel: true,
//             showNativeInput: 'option',
//             ...(initial.def.editorOptions as ColorSelectConfig),
//         };
//         this.editor = new ColorSelect(host, options);
//         host.addEventListener('colorchange', (e) => this.notifyChange((e as CustomEvent<string>).detail));
//     }

//     public setColors(colors: string[]): void {
//         this.editor.clearOptions();
//         this.editor.addOptions(colors);
//     }

//     override showValue(editable: EditableRecord): void {
//         const { key, value } = this.extractValueFrom(editable);
//         this.returnKey = key;
//         this.editor.value = value !== undefined && value !== null ? String(value) : 'transparent';
//     }

//     override getValue(): EditableRecord {
//         return { [this.returnKey ?? '']: this.editor.value };
//     }

//     override destroy(): void {
//         super.destroy();
//         this.editor.destroy();
//     }
// }

// export class WidthSelectEditor extends InspectorValueEditor {

//     private readonly editor: WidthSelect;

//     constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
//         super(cell, mixedClassName);
//         const host = document.createElement('div');
//         host.style.width = '100%';
//         cell.appendChild(host);
//         const options: WidthSelectConfig = {
//             ...(initial.def.editorOptions as WidthSelectConfig),
//         };
//         this.editor = new WidthSelect(host, options);
//         host.addEventListener('widthchange', (e) => this.notifyChange((e as CustomEvent<number>).detail));
//     }

//     override showValue(editable: EditableRecord): void {
//         const { key, value } = this.extractValueFrom(editable);
//         this.returnKey = key;
//         const width = Number(value);
//         this.editor.value = Number.isFinite(width) ? width : 1;
//     }

//     override getValue(): EditableRecord {
//         return { [this.returnKey ?? '']: this.editor.value };
//     }

//     override destroy(): void {
//         super.destroy();
//         this.editor.destroy();
//     }
// }

// export class ArrowSelectEditor extends InspectorValueEditor {

//     private readonly editor: ArrowSelect;

//     constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
//         super(cell, mixedClassName);
//         const host = document.createElement('div');
//         host.style.width = '100%';
//         cell.appendChild(host);
//         const options: ArrowSelectConfig = {
//             ...(initial.def.editorOptions as ArrowSelectConfig),
//         };
//         this.editor = new ArrowSelect(host, options);
//         host.addEventListener('arrowchange', (e) => this.notifyChange((e as CustomEvent<string>).detail));
//     }

//     override showValue(editable: EditableRecord): void {
//         // refresh() passes the already-derived direction string under the row key ('arrow').
//         // extractValueFrom() handles deriving direction from startArrow/endArrow in the full record.
//         const explicit = editable['arrow'] ? String(editable['arrow'] ?? 'none') : undefined;
//         if (explicit) {
//             this.editor.value = explicit as any;
//             return;
//         }

//         // If not, derive direction from startArrow/endArrow properties in the record.
//         const start = Boolean(editable['startArrow']);
//         const end = Boolean(editable['endArrow']);
//         const direction = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';
//         this.editor.value = direction;
//     }

//     override getValue(): EditableRecord {
//         const value = this.editor.value;

//         return {
//             startArrow: value === 'start' || value === 'both',
//             endArrow: value === 'end' || value === 'both',
//         };
//     }

//     override extractValueFrom(record: EditableRecord): { key: string; value: unknown } {
//         const start = Boolean(record['startArrow']);
//         const end = Boolean(record['endArrow']);
//         const value = start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';
//         return { key: '_', value };
//     }

//     override destroy(): void {
//         super.destroy();
//         this.editor.destroy();
//     }
// }

// export class FontSelectEditor extends InspectorValueEditor {

//     private readonly editor: FontSelect;

//     constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
//         super(cell, mixedClassName);
//         const host = document.createElement('div');
//         host.style.width = '100%';
//         cell.appendChild(host);
//         const options: FontSelectConfig = {
//             showPreview: true,
//             ...(initial.def.editorOptions as FontSelectConfig),
//         };
//         this.editor = new FontSelect(host, options);
//         host.addEventListener('fontchange', (e) => this.notifyChange((e as CustomEvent<string>).detail));
//     }

//     override showValue(editable: EditableRecord): void {
//         const { key, value } = this.extractValueFrom(editable);
//         this.returnKey = key;
//         this.editor.value = String(value ?? 'Tahoma');
//     }

//     override getValue(): EditableRecord {
//         return { [this.returnKey ?? '']: this.editor.value };
//     }

//     override destroy(): void {
//         super.destroy();
//         this.editor.destroy();
//     }
// }

// export class SizeSelectEditor extends InspectorValueEditor {

//     private readonly editor: SizeSelect;

//     constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
//         super(cell, mixedClassName);
//         const host = document.createElement('div');
//         host.style.width = '100%';
//         cell.appendChild(host);
//         const options: SizeSelectConfig = {
//             ...(initial.def.editorOptions as SizeSelectConfig),
//         };
//         this.editor = new SizeSelect(host, options);
//         host.addEventListener('sizechange', (e) => this.notifyChange((e as CustomEvent<number>).detail));
//     }

//     override showValue(editable: EditableRecord): void {
//         const { key, value } = this.extractValueFrom(editable);
//         this.returnKey = key;
//         const size = Number(value);
//         this.editor.value = Number.isFinite(size) ? size : 1;
//     }

//     override getValue(): EditableRecord {
//         return { [this.returnKey ?? '']: this.editor.value };
//     }

//     override destroy(): void {
//         super.destroy();
//         this.editor.destroy();
//     }
// }

// export class AngleEditor extends InspectorValueEditor {

//     private readonly input: HTMLInputElement;

//     constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
//         super(cell, mixedClassName);
//         this.input = document.createElement('input');
//         this.input.type = 'number';
//         this.input.step = '1';
//         this.input.readOnly = initial.readonly;
//         this.input.title = 'Angle in degrees';
//         cell.appendChild(this.input);
//         this.input.addEventListener('input', () => {
//             const parsed = Number(this.input.value);
//             if (this.input.value === '') {
//                 this.notifyChange(undefined);
//                 return;
//             }
//             if (Number.isFinite(parsed)) {
//                 this.notifyChange(parsed);
//             }
//         });
//     }

//     override showValue(editable: EditableRecord): void {
//         const { key, value } = this.extractValueFrom(editable);
//         this.returnKey = key;
//         const radians = Number(value);
//         if (!Number.isFinite(radians)) {
//             this.input.value = '';
//             return;
//         }

//         const degrees = radians * (180 / Math.PI);
//         this.input.value = String(Math.round(degrees * 100) / 100);
//     }

//     override getValue(): EditableRecord {
//         const parsed = Number(this.input.value);
//         if (!Number.isFinite(parsed)) {
//             return { [this.returnKey ?? '']: undefined };
//         }

//         const radians = parsed * (Math.PI / 180);
//         return { [this.returnKey ?? '']: radians };
//     }
// }

// export class EnumSelectEditor extends InspectorValueEditor {

//     private readonly host: HTMLDivElement;
//     private readonly trigger: HTMLButtonElement;
//     private readonly menu: HTMLDivElement;
//     private readonly options: Array<{ value: string; label: string }>;
//     private value: string = '';
//     private isOpen: boolean = false;
//     private readonly onDocumentPointerDown: (event: PointerEvent) => void;

//     constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorEditorInit) {
//         super(cell, mixedClassName);

//         const cfg = (initial.def.editorOptions as EnumSelectEditorConfig | undefined) || { options: [] };
//         this.options = (cfg.options || []).map((option) => {
//             if (typeof option === 'string') {
//                 return { value: option, label: option };
//             }
//             return { value: option.value, label: option.label || option.value };
//         });

//         this.host = document.createElement('div');
//         this.host.className = 'enum-select-control';
//         this.host.style.position = 'relative';
//         this.host.style.width = '100%';

//         this.trigger = document.createElement('button');
//         this.trigger.type = 'button';
//         this.trigger.className = 'color-preset-trigger';
//         this.trigger.disabled = initial.readonly;
//         this.trigger.style.width = '100%';
//         this.trigger.style.justifyContent = 'space-between';
//         this.trigger.addEventListener('click', () => {
//             this.setOpen(!this.isOpen);
//         });

//         this.menu = document.createElement('div');
//         this.menu.className = 'color-preset-menu';
//         this.menu.style.position = 'absolute';
//         this.menu.style.insetInlineStart = '0';
//         this.menu.style.insetBlockStart = 'calc(100% + 4px)';
//         this.menu.style.minWidth = '100%';
//         this.menu.style.display = 'none';
//         this.menu.style.zIndex = '20';

//         if (cfg.placeholder) {
//             const placeholder = document.createElement('button');
//             placeholder.type = 'button';
//             placeholder.className = 'color-preset-option';
//             placeholder.dataset['value'] = '';
//             placeholder.textContent = cfg.placeholder;
//             placeholder.addEventListener('click', () => this.selectValue(''));
//             this.menu.appendChild(placeholder);
//         }

//         for (const option of this.options) {
//             const el = document.createElement('button');
//             el.type = 'button';
//             el.className = 'color-preset-option';
//             el.dataset['value'] = option.value;
//             el.textContent = option.label;
//             el.addEventListener('click', () => this.selectValue(option.value));
//             this.menu.appendChild(el);
//         }

//         this.host.appendChild(this.trigger);
//         this.host.appendChild(this.menu);
//         cell.appendChild(this.host);

//         this.onDocumentPointerDown = (event: PointerEvent) => {
//             const target = event.target as Node | null;
//             if (target && !this.host.contains(target)) {
//                 this.setOpen(false);
//             }
//         };
//         document.addEventListener('pointerdown', this.onDocumentPointerDown);

//         this.updateTriggerLabel();
//     }

//     override showValue(editable: EditableRecord): void {
//         const { key, value } = this.extractValueFrom(editable);
//         this.returnKey = key;
//         this.value = value !== undefined && value !== null ? String(value) : '';
//         this.syncOptionSelection();
//         this.updateTriggerLabel();
//     }

//     override getValue(): EditableRecord {
//         return { [this.returnKey ?? '']: this.value };
//     }

//     override destroy(): void {
//         super.destroy();
//         document.removeEventListener('pointerdown', this.onDocumentPointerDown);
//     }

//     private setOpen(open: boolean): void {
//         this.isOpen = open;
//         this.menu.style.display = open ? 'flex' : 'none';
//         this.menu.style.flexDirection = 'column';
//         this.trigger.setAttribute('aria-expanded', String(open));
//     }

//     private selectValue(value: string): void {
//         this.value = value;
//         this.syncOptionSelection();
//         this.updateTriggerLabel();
//         this.notifyChange(this.value);
//         this.setOpen(false);
//     }

//     private syncOptionSelection(): void {
//         const options = this.menu.querySelectorAll<HTMLButtonElement>('.color-preset-option');
//         for (const option of options) {
//             const isSelected = (option.dataset['value'] || '') === this.value;
//             option.classList.toggle('is-selected', isSelected);
//             option.setAttribute('aria-selected', String(isSelected));
//         }
//     }

//     private updateTriggerLabel(): void {
//         const selected = this.options.find((option) => option.value === this.value);
//         this.trigger.textContent = selected ? selected.label : (this.value || 'Select');
//     }
// }
