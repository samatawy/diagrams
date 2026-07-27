import { isContainer } from "../guards";
import type { IContainer, IGroup, INode } from "../interfaces";
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
            const group = this.ownedGroup(node);    // diagram.group(node.owns_group);
            if (group) {
                ids.push(...group.nodes.filter(n => n !== node.id));
            }
        }
        else {
            // The node may be a member of a group
            const group = this.nodeGroup(node);     // diagram.groups.find(g => g.nodes.includes(node.id));
            if (group) {
                ids.push(...group.nodes.filter(n => n !== node.id));

                // const owner = diagram.nodes.find(n => (n as any as IContainer).owns_group === group.id);
                const owner = this.groupOwner(group, diagram);
                if (owner) ids.push(owner.id);
            }
        }

        return ids.map(id => diagram.node(id) as INode).filter(n => !!n);
    }

    public static groupOwner(group: string | IGroup, diagram: Diagram): INode | undefined {

        let _group = (typeof group === 'string') ? diagram.group(group) : group;
        if (_group) {
            if (_group.owner) {
                const owner = diagram.node(_group.owner);
                if (owner) return owner;
            }
            else {
                const owner = diagram.nodes.find(n => (n as any as IContainer).owns_group === _group!.id);
                if (owner) {
                    _group.owner = owner.id;
                    return owner;
                }
            }
        }
        return undefined;
    }

    public static ownedGroup(node: INode): IGroup | undefined {
        if (!isContainer(node)) return undefined;
        const diagram = node.owner;
        if (!diagram) return undefined;

        /* Find or create a group */
        let group = diagram.groups?.find(group => group.id === node.owns_group);
        if (!group) {
            group = {
                id: node.owns_group,
                owner: node.id,
                nodes: []
            };
            (diagram as Diagram).upsertGroup(group);
        }
        return group;

        // return diagram.groups?.find(group => group.id === node.owns_group);
    }

    public static nodeGroup(node: INode): IGroup | undefined {
        const diagram = node.owner;
        if (!diagram) return undefined;

        const targetNode = diagram.nodes.find(n => n.id === node.id);
        if (!targetNode) return undefined;

        if (targetNode?.in_group) {
            /* Find or create a group */
            let group = diagram.groups?.find(group => group.id === targetNode.in_group);
            if (!group) {
                group = {
                    id: targetNode.in_group,
                    nodes: [targetNode.id]
                };
                (diagram as Diagram).upsertGroup(group);
            }
            return group;
        }
        else {
            /* Find a group that includes the target node */
            const group = diagram.groups?.find(group => group.nodes.includes(targetNode.id));
            if (group) {
                targetNode.in_group = group.id;
                return group;
            }
        }
        // return diagram.groups?.find(group => group.nodes.includes(targetNode.id));
    }
}
