// export * from './component.adapter';
// export * from './container.adapter';
// export * from './system.adapter';
// export * from './database.adapter';

import { C4SystemAdapter } from './system.adapter';
import { C4ContainerAdapter } from './container.adapter';
import { C4ComponentAdapter } from './component.adapter';
import { C4DatabaseAdapter } from "./database.adapter";
import { C4StoreAdapter } from "./store.adapter";
import { NodeRegistry } from '../../factory/node.registry';


export function registerC4Adapters(): void {
    C4SystemAdapter.register();
    C4ContainerAdapter.register();
    C4ComponentAdapter.register();
    C4DatabaseAdapter.register();
    C4StoreAdapter.register();

    NodeRegistry.registerTransferables([
        C4SystemAdapter.TYPE,
        C4ContainerAdapter.TYPE,
        C4ComponentAdapter.TYPE,
        C4DatabaseAdapter.TYPE,
        C4StoreAdapter.TYPE,
    ]);
}


export const C4_TOOL_LAYOUT = [
    'c4_system', 'c4_container', 'c4_database', 'c4_component', 'c4_store', 'text',
];