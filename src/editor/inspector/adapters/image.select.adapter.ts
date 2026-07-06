import { ImageSelect } from "../../inputs/image.select";
import { InspectorAdapter, type EditableRecord, type InspectorAdapterInit } from "../inspector.adapter";
import type { DiagramView } from "../../../view";

export interface ImageSelectAdapterConfig {
    diagram: DiagramView;
}

/**
 * Inspector adapter for the `image_id` property.
 * Wraps the standalone {@link ImageSelect} component and bridges it to the inspector
 * change/value protocol.
 */
export class ImageSelectAdapter extends InspectorAdapter {

    private readonly imageSelect: ImageSelect;
    private readonly onImageChange: (e: Event) => void;

    constructor(cell: HTMLElement, mixedClassName: string, initial: InspectorAdapterInit) {
        super(cell, mixedClassName);

        const config = (initial.def.editorOptions ?? {}) as ImageSelectAdapterConfig;
        const diagram = config.diagram;

        this.imageSelect = new ImageSelect(cell, {
            assetStore: (diagram as any).assetStore,
            readonly: initial.readonly,
        });

        this.onImageChange = (e: Event) => {
            const id = (e as CustomEvent<string>).detail;
            this.setUnset(!id);
            this.notifyChange(id || undefined);
        };
        cell.addEventListener('imagechange', this.onImageChange);
    }

    override showValue(editable: EditableRecord): void {
        const imageId = editable['image_id'] as string | undefined;
        this.imageSelect.value = imageId ?? '';
        this.setUnset(!imageId);
    }

    override getValue(): EditableRecord {
        return { image_id: this.imageSelect.value || undefined };
    }

    override destroy(): void {
        this.cell.removeEventListener('imagechange', this.onImageChange);
        this.imageSelect.destroy();
        super.destroy();
    }
}



