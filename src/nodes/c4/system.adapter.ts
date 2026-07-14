import type { INode } from "../../interfaces";
import { RoundRectangleAdapter } from "../rectangle/round.rectangle.adapter";

export class C4SystemAdapter extends RoundRectangleAdapter {

    static readonly TYPE = 'c4_system';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_system',
            points: [{ x: 0, y: 0 }, { x: 104, y: 80 }],

            text: 'System',
            // fillStyle: '#1168bd',
            fillStyle: {
                color: '#1168bd',
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
