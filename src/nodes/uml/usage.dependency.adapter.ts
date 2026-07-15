import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

/**
 * Adapter for UML Usage Dependency connections.
 * This looks visually identical to a UML Dependency connection, but labelled with '<<use>>'.
 */
export class UmlUsageDependencyAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_usage_dependency';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlUsageDependencyAdapter.TYPE,
            text: '<<use>>',
            strokeStyle: {
                color: '#000000',
                arrow_at: 'end',
                arrow_type: 'solid_spear',
                dash: [6, 4],
            }
        }
    }
}