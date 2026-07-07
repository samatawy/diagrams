import type { INode } from "../../interfaces";
import type { ArrowDirection, ArrowType } from "../../types";
import { PolylineAdapter } from "../polyline/polyline.adapter";

export class C4AsyncRelationshipAdapter extends PolylineAdapter {

    static readonly TYPE = 'c4_async_relationship';

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_async_relationship',

            text: 'Async ~ Event',
            fillStyle: {
                color: '#ffffff00',
            },
            strokeStyle: {
                arrow_type: 'solid_spear' as ArrowType,
                arrow_at: 'end' as ArrowDirection,
                color: '#1f77b4',
                width: 1.5,
                dash: [6, 3],
            },
            textStyle: {
                color: '#1f77b4',
                halo: 'inherit',
                size: 12,
                fontFace: 'system-ui',
                baseline: 'bottom',
            },
        }
    }
}