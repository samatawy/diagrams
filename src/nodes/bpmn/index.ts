import { NodeRegistry } from '../../factory/node.registry';
import { ToolsetRegistry } from '../../factory/toolset.registry';

import { BpmnStartEventAdapter } from './start.event.adapter';
import { BpmnIntermediateEventAdapter } from './intermediate.event.adapter';
import { BpmnEndEventAdapter } from './end.event.adapter';
import { BpmnGatewayAdapter } from './gateway.adapter';
import { BpmnTaskAdapter } from './task.adapter';
import { BpmnDataStoreAdapter } from './data.store.adapter';
import { BpmnDataObjectAdapter } from './data.object.adapter';
import { BpmnDataAssociationAdapter } from './data.association.adapter';
import { BpmnAssociationAdapter } from './association.adapter';
import { BpmnMessageFlowAdapter } from './message.flow.adapter';
import { BpmnSequenceFlowAdapter } from './sequence.flow.adapter';

export function registerBpmnAdapters(): void {
    BpmnTaskAdapter.register();

    BpmnStartEventAdapter.register();
    BpmnIntermediateEventAdapter.register();
    BpmnEndEventAdapter.register();

    BpmnGatewayAdapter.register();

    BpmnDataStoreAdapter.register();
    BpmnDataObjectAdapter.register();

    BpmnSequenceFlowAdapter.register();
    BpmnMessageFlowAdapter.register();
    BpmnAssociationAdapter.register();
    BpmnDataAssociationAdapter.register();

    NodeRegistry.registerTransferables([
        BpmnStartEventAdapter.TYPE,
        BpmnIntermediateEventAdapter.TYPE,
        BpmnEndEventAdapter.TYPE,
    ]);

    NodeRegistry.registerTransferables([
        BpmnSequenceFlowAdapter.TYPE,
        BpmnMessageFlowAdapter.TYPE,
        BpmnAssociationAdapter.TYPE,
        BpmnDataAssociationAdapter.TYPE,
    ]);
}

export const BPMN_TOOL_LAYOUT = [
    'bpmn_task',
    'bpmn_start_event', 'bpmn_intermediate_event', 'bpmn_end_event',
    'bpmn_gateway', 'text',
    'bpmn_data_store', 'bpmn_data_object',
    'vertical_pool', 'horizontal_pool',
    'bpmn_sequence_flow', 'bpmn_message_flow',
    'bpmn_association', 'bpmn_data_association',
];


export function registerBpmnToolset(): void {
    registerBpmnAdapters();

    ToolsetRegistry.global.register({
        name: 'BPMN',
        layout: BPMN_TOOL_LAYOUT,
    });
}

