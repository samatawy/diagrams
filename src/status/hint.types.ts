import type { DiagramActionId } from "../editor/diagram.actions";
import type { INode } from "../interfaces";

export type DiagramHintPoolCategory =
    | 'interaction'
    | 'shortcut'
    | 'view'
    | 'clipboard'
    | 'layout'
    | 'text'
    | 'tool';

export type DiagramHintAccessSurface =
    | 'shortcut'
    | 'toolbar'
    | 'inspector'
    | 'palette'
    | 'canvas';

export interface DiagramHintPoolItem {
    id: string;
    message?: string;
    fallbackMessage?: string;
    category: DiagramHintPoolCategory;
    tool?: string;
    actionId?: DiagramActionId;
    shortcut?: string | string[];
    access?: DiagramHintAccessSurface[];
    minSelectionCount?: number;
    requiresConnectionSelection?: boolean;
    requiresTextCapableSelection?: boolean;
}

export interface DiagramHintPoolFilter {
    category?: DiagramHintPoolCategory;
    tool?: string;
    selection?: INode[];
}
