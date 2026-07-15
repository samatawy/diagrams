import type { INode } from "../../interfaces";
import { AbstractUmlRelationAdapter } from "./abstract.uml.relation.adapter";

/**
 * Adapter for UML Template Binding connections.
 * This looks visually identical to a UML Dependency connection, but labelled with '<<bind>>'.
 */
export class UmlTemplateBindingAdapter extends AbstractUmlRelationAdapter {

    public static TYPE = 'uml_template_binding';

    public override onCreateDraft(tool: string): Partial<INode> | undefined {
        return {
            type: UmlTemplateBindingAdapter.TYPE,
            text: '<<bind>>',
            strokeStyle: {
                color: '#000000',
                arrow_at: 'end',
                arrow_type: 'solid_spear',
                dash: [6, 4],
            }
        }
    }
}