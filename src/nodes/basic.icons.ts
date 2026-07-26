import { IconRegistry, sym } from "../factory/icon.registry";

export function registerBasicIcons(): void {

    IconRegistry.registerSymbol('freehand', 'tool-freehand',
        sym('tool-freehand',
            '<path d="M3 16C5.2 12.8 7.8 8.2 11.2 8.2C13.5 8.2 14.8 9.8 14.8 11.5C14.8 13.2 13.8 14.5 12.1 15.6L10.3 16.8C9 17.6 8.5 18.4 8.5 19.3C8.5 20.7 9.7 21.7 11.3 21.7C14.1 21.7 17.2 19.8 21 16.8" stroke-width="1.9" fill="none"/>'
        ));

    IconRegistry.registerSymbol('rectangle', 'tool-rectangle',
        sym('tool-rectangle', '<rect x="3" y="5" width="18" height="14" rx="1"/>'));

    IconRegistry.registerSymbol('round_rectangle', 'tool-round-rect',
        sym('tool-round-rect', '<rect x="3" y="5" width="18" height="14" rx="5"/>'));

    IconRegistry.registerSymbol('rhombus', 'tool-rhombus',
        sym('tool-rhombus', '<polygon points="12 2 22 12 12 22 2 12"/>'));

    IconRegistry.registerSymbol('parallelogram', 'tool-parallelogram',
        sym('tool-parallelogram', '<polygon points="6 5 21 5 18 19 3 19"/>'));

    IconRegistry.registerSymbol('ellipse', 'tool-ellipse',
        sym('tool-ellipse', '<ellipse cx="12" cy="12" rx="10" ry="7"/>'));

    IconRegistry.registerSymbol('circle', 'tool-circle',
        sym('tool-circle', '<circle cx="12" cy="12" r="8"/>'));

    IconRegistry.registerSymbol('text', 'tool-text',
        sym('tool-text', '<line x1="4" y1="6" x2="20" y2="6"/><line x1="12" y1="6" x2="12" y2="20"/>'));

    IconRegistry.registerSymbol('speech_bubble', 'tool-speech-bubble',
        sym('tool-speech-bubble',
            '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6l-3 2-1-2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'));

    IconRegistry.registerSymbol('arrow_triangle', 'tool-arrow-triangle',
        sym('tool-arrow-triangle',
            '<path d="M4 9H12V6L20 12L12 18V15H4Z"/>'));    //'<path d="M4 9H13V6L20 12L13 18V15H4Z"/>'));

    IconRegistry.registerSymbol('arrow_chevron', 'tool-arrow-chevron',
        sym('tool-arrow-chevron',
            '<path d="M4 6H13L20 12L13 18H4L8 12Z"/>'));    //'<path d="M4 9H13L20 12L13 15H4L8 12Z"/>'));

    IconRegistry.registerSymbol('svg', 'tool-svg',
        sym('tool-svg', '<path d="M4 14.5S4 18 8 18s4-7 8-7 4 3.5 4 3.5"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>'));

    IconRegistry.registerSymbol('line', 'tool-line',
        sym('tool-line', '<line x1="5" y1="19" x2="19" y2="5"/><polyline points="14 5 19 5 19 10"/>'));

    IconRegistry.registerSymbol('polyline', 'tool-polyline',
        sym('tool-polyline', '<polyline points="4 19 9 9 14 14 19 5"/>'));

    // IconRegistry.registerSymbol('manhattan', 'tool-manhattan',
    //     sym('tool-manhattan', '<polyline points="4 19 10 19 10 8 19 8"/>'));

    IconRegistry.registerSymbol('orthogonal', 'tool-orthogonal',
        sym('tool-orthogonal', '<polyline points="4 19 10 19 10 8 19 8"/>'));

    IconRegistry.registerSymbol('polygon', 'tool-polygon',
        sym('tool-polygon', '<polygon points="12 3 20 8 20 16 12 21 4 16 4 8"/>'));

    IconRegistry.registerSymbol('curve', 'tool-curve',
        sym('tool-curve', '<path d="M4 20 C4 4 20 4 20 20"/>'));

    IconRegistry.registerSymbol('trapezoid', 'tool-trapezoid',
        sym('tool-trapezoid', '<polygon points="6 5 18 5 21 19 3 19"/>'));

    IconRegistry.registerSymbol('document', 'tool-document',
        sym('tool-document', '<path d="M3 5 H21 V17 Q16 13 12 17 Q7 21 3 17 Z"/>'));

    IconRegistry.registerSymbol('cylinder', 'tool-cylinder',
        sym('tool-cylinder', `<ellipse cx="12" cy="6" rx="9" ry="3"/>
        <path d="M3 6v12c0 1.66 4.03 3 9 3s9-1.34 9-3V6"/>`));
}