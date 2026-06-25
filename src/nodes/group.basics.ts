import { isContainer, isContainerNode } from "../guards";
import type { IContainer, INode } from "../interfaces";
import type { Diagram } from "../model/diagram";

/**
 * Provides basic operations for manipulating groups, such as moving, resizing, rotating, and checking for overlaps or containment.
 * These utilities are designed to work with groups in a diagram editor, allowing for transformations and hit testing 
 * based on the group's geometry and the diagram's coordinate system.
 * The methods take into account the group's points, angle, and bounding rectangle to perform accurate calculations 
 * for movement, resizing, and selection.
 * This class can be used as a foundation for implementing more complex group behaviors in a diagram editing application.
 */
export class GroupBasics {


    public static relatedNodes(node: string | INode, diagram: Diagram): INode[] {
        if (typeof node === 'string') node = diagram.node(node) as INode;

        const ids: string[] = [];
        if (isContainer(node)) {
            // The node owns a group
            const group = diagram.group(node.owns_group);
            if (group) {
                ids.push(...group.nodes.filter(n => n !== node.id));
            }
        }
        else {
            // The node may be a member of a group
            const group = diagram.groups.find(g => g.nodes.includes(node.id));
            if (group) {
                ids.push(...group.nodes.filter(n => n !== node.id));

                const owner = diagram.nodes.find(n => (n as any as IContainer).owns_group === group.id);
                if (owner) ids.push(owner.id);
            }
        }

        return ids.map(id => diagram.node(id) as INode).filter(n => !!n);
    }
}
