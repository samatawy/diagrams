import { IconRegistry, sym } from "../../factory/icon.registry";

export function registerBpmnIcons(): void {

    // BPMN start event: single thin ring.
    IconRegistry.registerSymbol('bpmn_start_event', 'tool-bpmn-start',
        sym('tool-bpmn-start', '<circle cx="12" cy="12" r="8"/>'));

    // BPMN intermediate event: double ring.
    IconRegistry.registerSymbol('bpmn_intermediate_event', 'tool-bpmn-intermediate',
        sym('tool-bpmn-intermediate', '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/>'));

    // BPMN end event: bold outer ring.
    IconRegistry.registerSymbol('bpmn_end_event', 'tool-bpmn-end',
        sym('tool-bpmn-end', '<circle cx="12" cy="12" r="8" stroke-width="4"/>'));

    IconRegistry.registerSymbol('bpmn_gateway', 'tool-bpmn-gateway',
        sym('tool-bpmn-gateway', '<polygon points="12 2 22 12 12 22 2 12"/>'));

    IconRegistry.registerSymbol('bpmn_task', 'tool-bpmn-task',
        sym('tool-bpmn-task', '<rect x="3" y="5" width="18" height="14" rx="3"/>'));

    // BPMN data store: cylinder with double bottom lines indicating a data store / database.
    IconRegistry.registerSymbol('bpmn_data_store', 'tool-bpmn-data-store',
        sym('tool-bpmn-data-store', `<ellipse cx="12" cy="6" rx="9" ry="3"/>
        <path d="M3 6v12c0 1.66 4.03 3 9 3s9-1.34 9-3V6"/>`));

    // BPMN data object: page with folded top-right corner.
    IconRegistry.registerSymbol('bpmn_data_object', 'tool-bpmn-data-object',
        sym('tool-bpmn-data-object', `<path d="M6 2h8l4 4v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
        <polyline points="14 2 14 6 18 6"/>`));

    // BPMN sequence flow: solid connector with filled arrowhead.
    IconRegistry.registerSymbol('bpmn_sequence_flow', 'tool-bpmn-sequence-flow',
        sym('tool-bpmn-sequence-flow', `<line x1="4" y1="18" x2="17" y2="7"/>
        <polyline points="14 5 19 5 19 10"/>`));

    // BPMN message flow: dashed connector with open arrowhead.
    IconRegistry.registerSymbol('bpmn_message_flow', 'tool-bpmn-message-flow',
        sym('tool-bpmn-message-flow', `<line x1="4" y1="18" x2="17" y2="7" stroke-dasharray="4 3"/>
        <polyline points="14 5 19 5 19 10"/>`));

    // BPMN association: dotted connector with no arrowhead.
    IconRegistry.registerSymbol('bpmn_association', 'tool-bpmn-association',
        sym('tool-bpmn-association', `<line x1="4" y1="18" x2="20" y2="6" stroke-dasharray="1.2 3"/>`));

    // BPMN data association: dotted connector with a spear-like pointed marker.
    IconRegistry.registerSymbol('bpmn_data_association', 'tool-bpmn-data-association',
        sym('tool-bpmn-data-association', `<line x1="4" y1="18" x2="17" y2="7" stroke-dasharray="1.2 3"/>
        <polyline points="14 5 19 5 19 10"/>`));

    // BPMN parallel gateway: diamond with X marker.
    IconRegistry.registerSymbol('bpmn_parallel_gateway', 'tool-bpmn-parallel-gateway',
        sym('tool-bpmn-parallel-gateway', '<polygon points="12 2 22 12 12 22 2 12"/><line x1="9.25" y1="9.25" x2="14.75" y2="14.75"/><line x1="14.75" y1="9.25" x2="9.25" y2="14.75"/>'));

    // BPMN inclusive gateway: diamond with inner ring.
    IconRegistry.registerSymbol('bpmn_inclusive_gateway', 'tool-bpmn-inclusive-gateway',
        sym('tool-bpmn-inclusive-gateway', '<polygon points="12 2 22 12 12 22 2 12"/><circle cx="12" cy="12" r="3.5"/>'));

    // BPMN exclusive gateway: diamond with plus marker.
    IconRegistry.registerSymbol('bpmn_exclusive_gateway', 'tool-bpmn-exclusive-gateway',
        sym('tool-bpmn-exclusive-gateway', '<polygon points="12 2 22 12 12 22 2 12"/><line x1="12" y1="8.5" x2="12" y2="15.5"/><line x1="8.5" y1="12" x2="15.5" y2="12"/>'));

    // BPMN complex gateway: diamond with star/asterisk marker.
    IconRegistry.registerSymbol('bpmn_complex_gateway', 'tool-bpmn-complex-gateway',
        sym('tool-bpmn-complex-gateway', '<polygon points="12 2 22 12 12 22 2 12"/><line x1="12" y1="8.25" x2="12" y2="15.75"/><line x1="8.75" y1="10.125" x2="15.25" y2="13.875"/><line x1="15.25" y1="10.125" x2="8.75" y2="13.875"/>'));

}