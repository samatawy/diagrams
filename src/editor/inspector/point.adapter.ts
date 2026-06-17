import type { IPoint } from "../../types";
import type { InspectorAdapterInit, EditableRecord } from "./inspector";
import { InspectorAdapter } from "./inspector";

export interface PointAdapterConfig {
    /**
     * Whether to render small X/Y labels next to the coordinate inputs.
     */
    showLabels?: boolean;
    /**
     * Label text used for the X coordinate input.
     */
    xLabel?: string;
    /**
     * Label text used for the Y coordinate input.
     */
    yLabel?: string;
    /**
     * Number of decimal places used when formatting and normalizing coordinates.
     */
    precision?: number;
}

/**
 * Inspector adapter for editing point values as paired X/Y numeric inputs.
 */
export class PointAdapter extends InspectorAdapter {

    private readonly inputX: HTMLInputElement;
    private readonly inputY: HTMLInputElement;
    private readonly config: Required<PointAdapterConfig>;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        this.config = {
            showLabels: true,
            xLabel: 'X',
            yLabel: 'Y',
            precision: 2,
            ...(initial.def.editorOptions || {} as PointAdapterConfig),
        };

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '4px';
        row.style.width = '100%';
        cell.appendChild(row);

        if (this.config.showLabels) {
            const xLabel = document.createElement('span');
            xLabel.textContent = this.config.xLabel;
            xLabel.style.fontSize = '10px';
            xLabel.style.lineHeight = '1';
            xLabel.style.opacity = '0.8';
            row.appendChild(xLabel);

            const yLabel = document.createElement('span');
            yLabel.textContent = this.config.yLabel;
            yLabel.style.fontSize = '10px';
            yLabel.style.lineHeight = '1';
            yLabel.style.opacity = '0.8';
            yLabel.dataset['pointLabel'] = 'y';
            row.appendChild(yLabel);
        }

        this.inputX = document.createElement('input');
        this.inputX.type = 'number';
        this.inputX.step = '1'; // this.stepFromPrecision();
        this.inputX.readOnly = initial.readonly;
        this.inputX.style.flex = '1';
        this.inputX.style.minWidth = '56px';
        this.inputX.style.padding = '1px 4px';
        this.inputX.style.fontSize = '11px';
        this.inputX.style.height = '22px';
        this.inputX.dataset['pointInput'] = 'x';
        this.inputX.addEventListener('input', () => {
            this.propagateInputChange();
        });

        this.inputY = document.createElement('input');
        this.inputY.type = 'number';
        this.inputY.step = '1'; // this.stepFromPrecision();
        this.inputY.readOnly = initial.readonly;
        this.inputY.style.flex = '1';
        this.inputY.style.minWidth = '56px';
        this.inputY.style.padding = '1px 4px';
        this.inputY.style.fontSize = '11px';
        this.inputY.style.height = '22px';
        this.inputY.dataset['pointInput'] = 'y';
        this.inputY.addEventListener('input', () => {
            this.propagateInputChange();
        });

        const yLabel = row.querySelector<HTMLElement>('[data-point-label="y"]');
        if (this.config.showLabels && yLabel) {
            row.insertBefore(this.inputX, yLabel);
            row.insertBefore(this.inputY, yLabel.nextSibling);
        } else {
            row.appendChild(this.inputX);
            row.appendChild(this.inputY);
        }
    }

    private propagateInputChange(): void {
        if (this.isTransientNumberInput(this.inputX.value) || this.isTransientNumberInput(this.inputY.value)) {
            return;
        }

        const parsedX = Number(this.inputX.value);
        const parsedY = Number(this.inputY.value);
        const complete = this.inputX.value !== ''
            && this.inputY.value !== ''
            && Number.isFinite(parsedX)
            && Number.isFinite(parsedY);

        if (!complete) {
            this.setUnset(true);
            this.notifyChange(undefined);
            return;
        }

        this.setUnset(false);
        this.notifyChange({ x: this.normalizeValue(parsedX), y: this.normalizeValue(parsedY) });
    }

    override showValue(editable: EditableRecord): void {
        const { key, value } = this.extractValueFrom(editable);
        this.returnKey = key;
        const point = value as IPoint | undefined;
        if (!point) {
            this.setUnset(true);
            this.inputX.value = '';
            this.inputY.value = '';
            return;
        }

        this.setUnset(false);
        this.inputX.value = this.formatValue(this.normalizeValue(Number(point.x)));
        this.inputY.value = this.formatValue(this.normalizeValue(Number(point.y)));
    }

    override getValue(): EditableRecord {
        const parsedX = Number(this.inputX.value);
        const parsedY = Number(this.inputY.value);
        if (!Number.isFinite(parsedX) || !Number.isFinite(parsedY)) {
            return { [this.returnKey ?? '']: undefined };
        }

        return { [this.returnKey ?? '']: { x: this.normalizeValue(parsedX), y: this.normalizeValue(parsedY) } };
    }

    private normalizeValue(value: number): number {
        const p = this.normalizedPrecision();
        if (p === undefined) {
            return value;
        }

        const factor = Math.pow(10, p);
        return Math.round(value * factor) / factor;
    }

    private formatValue(value: number): string {
        const p = this.normalizedPrecision();
        if (p === undefined) {
            return String(value);
        }

        if (p === 0) {
            return String(Math.round(value));
        }

        return value.toFixed(p).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }

    // private stepFromPrecision(): string {
    //     const p = this.normalizedPrecision();
    //     if (p === undefined) {
    //         return 'any';
    //     }

    //     return p === 0 ? '1' : String(Math.pow(10, -p));
    // }

    private normalizedPrecision(): number | undefined {
        if (typeof this.config.precision !== 'number') {
            return undefined;
        }

        return Math.max(0, Math.floor(this.config.precision));
    }

    private isTransientNumberInput(raw: string): boolean {
        return raw === '-' || raw === '.' || raw === '-.' || raw.endsWith('.') || /[eE][+-]?$/.test(raw);
    }
}
