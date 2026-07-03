
import { BpmnStartEventAdapter } from './start.event.adapter';
import { BpmnIntermediateEventAdapter } from './intermediate.event.adapter';
import { BpmnEndEventAdapter } from './end.event.adapter';
import { BpmnGatewayAdapter } from './gateway.adapter';
import { NodeRegistry } from '../../factory/node.registry';
import { BpmnTaskAdapter } from './task.adapter';

export function registerBpmnAdapters(): void {
    BpmnTaskAdapter.register();
    BpmnStartEventAdapter.register();
    BpmnIntermediateEventAdapter.register();
    BpmnEndEventAdapter.register();
    BpmnGatewayAdapter.register();


    NodeRegistry.registerTransferables([
        BpmnStartEventAdapter.TYPE,
        BpmnIntermediateEventAdapter.TYPE,
        BpmnEndEventAdapter.TYPE,
    ]);
}
