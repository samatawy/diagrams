import type { INode } from "../../interfaces";
import type { NodeHandle, IPoint } from "../../types";
import { OrthogonalAdapter } from "../polyline/orthogonal.adapter";

/**
 * Abstract adapter for all UML relation connections.
 */
export abstract class AbstractUmlRelationAdapter extends OrthogonalAdapter {

    public canConnectTo(node: INode, handle: NodeHandle, direction: "from" | "to" | "any", target?: Partial<INode>, point?: IPoint): boolean {
        if (target && !target.type?.startsWith('uml')) {
            return false;
        }
        return true;
    }
}