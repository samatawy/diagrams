// export * from './component.adapter';
// export * from './container.adapter';
// export * from './system.adapter';
// export * from './database.adapter';

import { C4SystemAdapter } from './system.adapter';
import { C4ContainerAdapter } from './container.adapter';
import { C4ComponentAdapter } from './component.adapter';
import { C4DatabaseAdapter } from "./database.adapter";
import { C4StoreAdapter } from "./store.adapter";
import { C4PersonAdapter } from "./person.adapter";
import { NodeRegistry } from '../../factory/node.registry';
import { C4RelationshipAdapter } from './relationship.adapter';
import { C4AsyncRelationshipAdapter } from './async.relationship.adapter';
import { C4DependencyAdapter } from './dependency.adapter';


export function registerC4Adapters(): void {
    C4SystemAdapter.register();
    C4ContainerAdapter.register();
    C4ComponentAdapter.register();
    C4DatabaseAdapter.register();
    C4StoreAdapter.register();
    C4PersonAdapter.register();

    C4RelationshipAdapter.register();
    C4AsyncRelationshipAdapter.register();
    C4DependencyAdapter.register();

    NodeRegistry.registerTransferables([
        C4SystemAdapter.TYPE,
        C4ContainerAdapter.TYPE,
        C4ComponentAdapter.TYPE,
        C4DatabaseAdapter.TYPE,
        C4StoreAdapter.TYPE,
    ]);

    NodeRegistry.registerTransferables([
        C4RelationshipAdapter.TYPE,
        C4AsyncRelationshipAdapter.TYPE,
        C4DependencyAdapter.TYPE,
    ]);
}


export const C4_TOOL_LAYOUT = [
    'c4_system', 'c4_container', 'c4_database', 'c4_component', 'c4_store', 'c4_person', 'text',
    'c4_relationship', 'c4_async_relationship', 'c4_dependency',
];