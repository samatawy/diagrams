
/**
 * Available built-in diagram actions. These can be used in the toolbar layout.
 */
export type DiagramToolBarLayoutItem = '|' | 'new' | 'open' | 'save' | 'export' |
    'show-grid' | 'snap-grid' | 'show-guides' | 'snap-guides' |
    'zoom-in' | 'zoom-out' | 'fit-width' | 'fit-all' |
    'undo' | 'redo' |
    'front' | 'back' |
    'delete' | 'duplicate' | 'cut' | 'copy' | 'paste' |
    'align-left' | 'align-center' | 'align-right' | 'align-top' | 'align-middle' | 'align-bottom' | 'distribute-h' | 'distribute-v' |
    'text-left' | 'text-center' | 'text-right' | 'text-top' | 'text-middle' | 'text-bottom';

export const DIAGRAM_FILE_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    'new',
    'open',
    'save',
    'export',
];

export const DIAGRAM_VIEW_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    'show-grid',
    'snap-grid',
    'show-guides',
    'snap-guides',
];

export const DIAGRAM_ZOOM_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    'zoom-in',
    'zoom-out',
    'fit-width',
    'fit-all',
];

export const DIAGRAM_HISTORY_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    'undo',
    'redo',
];

export const DIAGRAM_ZORDER_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    'front',
    'back',
];

export const DIAGRAM_CLIPBOARD_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    'delete',
    'duplicate',
    'cut',
    'copy',
    'paste',
];

export const DIAGRAM_ALIGN_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    'align-left',
    'align-center',
    'align-right',
    'align-top',
    'align-middle',
    'align-bottom',
    'distribute-h',
    'distribute-v',
];

export const DIAGRAM_TEXT_ALIGN_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    'text-left',
    'text-center',
    'text-right',
    'text-top',
    'text-middle',
    'text-bottom',
];

export const DIAGRAM_FULL_TOOLBAR_LAYOUT: DiagramToolBarLayoutItem[] = [
    ...DIAGRAM_FILE_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_VIEW_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_ZOOM_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_HISTORY_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_ZORDER_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_CLIPBOARD_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_ALIGN_TOOLBAR_LAYOUT,
    '|',
    ...DIAGRAM_TEXT_ALIGN_TOOLBAR_LAYOUT,
];

export const DEFAULT_DIAGRAM_TOOLBAR_LAYOUT = DIAGRAM_FULL_TOOLBAR_LAYOUT;
