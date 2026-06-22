import type { DiagramActionId } from "./diagram.actions";

export const DIAGRAM_FILE_ACTION_LAYOUT: DiagramActionId[] = [
    'new',
    'open',
    'save',
    'export',
];

export const DIAGRAM_VIEW_ACTION_LAYOUT: DiagramActionId[] = [
    'show-grid',
    'snap-grid',
    'show-guides',
    'snap-guides',
];

export const DIAGRAM_ZOOM_ACTION_LAYOUT: DiagramActionId[] = [
    'zoom-in',
    'zoom-out',
    'fit-width',
    'fit-all',
];

export const DIAGRAM_HISTORY_ACTION_LAYOUT: DiagramActionId[] = [
    'undo',
    'redo',
];

export const DIAGRAM_ZORDER_ACTION_LAYOUT: DiagramActionId[] = [
    'front',
    'back',
];

export const DIAGRAM_CLIPBOARD_ACTION_LAYOUT: DiagramActionId[] = [
    'delete',
    'duplicate',
    '|',
    'cut',
    'copy',
    'paste',
    '|',
    'copy-styles',
    'paste-styles',
];

export const DIAGRAM_ALIGN_ACTION_LAYOUT: DiagramActionId[] = [
    'align-left',
    'align-center',
    'align-right',
    'align-top',
    'align-middle',
    'align-bottom',
    'distribute-h',
    'distribute-v',
];

export const DIAGRAM_TEXT_ALIGN_ACTION_LAYOUT: DiagramActionId[] = [
    'text-left',
    'text-center',
    'text-right',
    'text-top',
    'text-middle',
    'text-bottom',
];

export const DIAGRAM_TEXT_FORMAT_ACTION_LAYOUT: DiagramActionId[] = [
    'text-bold',
    'text-italic',
];

export const DIAGRAM_TEXT_ORIENTATION_ACTION_LAYOUT: DiagramActionId[] = [
    'text-orientation-horizontal',
    'text-orientation-vertical',
];

export const DIAGRAM_LABEL_ORIENTATION_ACTION_LAYOUT: DiagramActionId[] = [
    'label-orientation-horizontal',
    'label-orientation-path',
];
