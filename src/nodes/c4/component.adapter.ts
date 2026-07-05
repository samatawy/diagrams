import type { INode } from "../../interfaces";
import { RoundRectangleAdapter } from "../rectangle/round.rectangle.adapter";

export class C4ComponentAdapter extends RoundRectangleAdapter {

    static readonly TYPE = 'c4_component';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: 'c4_component',
            points: [{ x: 0, y: 0 }, { x: 104, y: 80 }],

            text: 'Component',
            fillStyle: '#85bbf0',
            strokeStyle: {
                color: '#1f77b4',   // 'white', // '#1f77b4',
                width: 2,
                dash: [],
            },
            textStyle: {
                color: 'white',
                halo: 'inherit',
                size: 12,
                fontFace: 'system-ui',
                baseline: 'bottom',
            },
        }
    }
}
