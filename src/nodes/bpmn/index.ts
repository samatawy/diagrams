
import { BpmnStartEventAdapter } from './start.event.adapter';
import { BpmnIntermediateEventAdapter } from './intermediate.event.adapter';
import { BpmnEndEventAdapter } from './end.event.adapter';
import { BpmnGatewayAdapter } from './gateway.adapter';
import { NodeRegistry } from '../../factory/node.registry';
import { BpmnTaskAdapter } from './task.adapter';
import { BpmnDataStoreAdapter } from './data.store.adapter';
import { BpmnDataObjectAdapter } from './data.object.adapter';

// export * from './Bpmn.Basics';
// export * from './start.event.adapter';
// export * from './intermediate.event.adapter';
// export * from './end.event.adapter';
// export * from './gateway.adapter';
// export * from './task.adapter';
// export * from './data.store.adapter';
// export * from './data.object.adapter';


export function registerBpmnAdapters(): void {
    BpmnTaskAdapter.register();

    BpmnStartEventAdapter.register();
    BpmnIntermediateEventAdapter.register();
    BpmnEndEventAdapter.register();

    BpmnGatewayAdapter.register();

    BpmnDataStoreAdapter.register();
    BpmnDataObjectAdapter.register();

    NodeRegistry.registerTransferables([
        BpmnStartEventAdapter.TYPE,
        BpmnIntermediateEventAdapter.TYPE,
        BpmnEndEventAdapter.TYPE,
    ]);
}

export const BPMN_TOOL_LAYOUT = [
    'bpmn_task',
    'bpmn_start_event', 'bpmn_intermediate_event', 'bpmn_end_event',
    'bpmn_gateway', 'text',
    'bpmn_data_store', 'bpmn_data_object',
    'vertical_pool', 'horizontal_pool',
];
