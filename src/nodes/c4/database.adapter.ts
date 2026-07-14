import { CylinderAdapter } from "../rectangle/cylinder.adapter";
import type { INode } from "../../interfaces";

export class C4DatabaseAdapter extends CylinderAdapter {

    static readonly TYPE = 'c4_database';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_database',
            points: [{ x: 0, y: 0 }, { x: 104, y: 80 }],

            text: 'Database',
            fillStyle: {
                color: '#438dd5',
            },
            strokeStyle: {
                color: 'white',
                width: 2,
                dash: [],
            },
            textStyle: {
                color: 'white',
                halo: 'inherit',
                size: 10,
                fontFace: 'system-ui',
                baseline: 'bottom',
            },
        }
    }
}
