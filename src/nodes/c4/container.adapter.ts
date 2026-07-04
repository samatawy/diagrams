import type { INode } from "../../interfaces";
import { RoundRectangleAdapter } from "../rectangle/round.rectangle.adapter";

export class C4ContainerAdapter extends RoundRectangleAdapter {

    static readonly TYPE = 'c4_container';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_container',
            points: [{ x: 0, y: 0 }, { x: 104, y: 80 }],

            text: 'Container',
            fillStyle: '#438dd5',
            strokeStyle: {
                color: 'white',
            },
            textStyle: {
                color: 'white',
                size: 12,
                fontFace: 'system-ui',
                baseline: 'bottom',
            },
        }
    }
}
