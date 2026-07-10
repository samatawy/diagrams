
// export * from './table.adapter';
// export * from './table.row.adapter';

import { NodeRegistry } from '../../factory/node.registry';
import { Many2ManyRelationAdapter } from './many2many.relation.adapter';
import { One2ManyRelationAdapter } from './one2many.relation.adapter';
import { One2OneRelationAdapter } from './one2one.relation.adapter';
import { TableAdapter } from './table.adapter';
import { TableRowAdapter } from './table.row.adapter';

export function registerErdAdapters(): void {
    TableAdapter.register();
    TableRowAdapter.register();
    One2OneRelationAdapter.register();
    One2ManyRelationAdapter.register();
    Many2ManyRelationAdapter.register();

    NodeRegistry.registerTransferables([
        One2OneRelationAdapter.TYPE,
        One2ManyRelationAdapter.TYPE,
        Many2ManyRelationAdapter.TYPE,
    ]);
}

export const ERD_TOOL_LAYOUT = [
    'table',
    'table_row',
    'erd_one_to_one',
    'erd_one_to_many',
    'erd_many_to_many',
];
