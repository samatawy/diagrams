import type { INode } from "../../interfaces";
import type { ArrowDirection, ArrowType } from "../../types";
import { PolylineAdapter } from "../polyline/polyline.adapter";

export class C4RelationshipAdapter extends PolylineAdapter {

    static readonly TYPE = 'c4_relationship';

    public onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_relationship',

            text: 'Relationship',
            fillStyle: {
                color: '#ffffff00',
            },
            strokeStyle: {
                arrow_type: 'solid_spear' as ArrowType,
                arrow_at: 'end' as ArrowDirection,
                color: '#1f77b4',
                width: 2,
                dash: [],
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