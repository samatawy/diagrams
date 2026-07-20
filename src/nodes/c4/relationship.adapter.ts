import type { INode } from "../../interfaces";
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
                color: '#1f77b4',
                width: 2,
                dash: [],
                arrow_start: 'none',
                arrow_end: 'solid_spear',
            },
            textStyle: {
                color: '#1f77b4',
                halo: 'inherit',
                size: 10,
                fontFace: 'system-ui',
                baseline: 'bottom',
            },
        }
    }
}