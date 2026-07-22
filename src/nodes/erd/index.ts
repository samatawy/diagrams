import { NodeRegistry } from '../../factory/node.registry';
import { ToolsetRegistry } from '../../factory/toolset.registry';

import { Many2ManyRelationAdapter } from './many2many.relation.adapter';
import { One2ManyRelationAdapter } from './one2many.relation.adapter';
import { One2OneRelationAdapter } from './one2one.relation.adapter';
import { TableAdapter } from './table.adapter';
import { FieldAdapter } from './field.adapter';
import { registerErdIcons } from './icons';

export function registerErdAdapters(): void {
    TableAdapter.register();
    FieldAdapter.register();
    One2OneRelationAdapter.register();
    One2ManyRelationAdapter.register();
    Many2ManyRelationAdapter.register();

    registerErdIcons();

    NodeRegistry.registerTransferables([
        One2OneRelationAdapter.TYPE,
        One2ManyRelationAdapter.TYPE,
        Many2ManyRelationAdapter.TYPE,
    ]);
}

export const ERD_TOOL_LAYOUT = [
    'table',
    'field',
    'erd_one_to_one',
    'erd_one_to_many',
    'erd_many_to_many',
];

export function registerErdToolset(): void {
    registerErdAdapters();

    ToolsetRegistry.global.register({
        name: 'ERD',
        layout: ERD_TOOL_LAYOUT,
    });
}

