import { NodeRegistry } from '../../factory/node.registry';
// import { Many2ManyRelationAdapter } from './many2many.relation.adapter';
// import { One2ManyRelationAdapter } from './one2many.relation.adapter';
// import { One2OneRelationAdapter } from './one2one.relation.adapter';
import { UmlClassAdapter } from './class.adapter';
import { UmlPropertyAdapter } from './property.adapter';
import { UmlMethodAdapter } from './method.adapter';
// import { registerErdIcons } from './icons';

export function registerUmlAdapters(): void {
    UmlClassAdapter.register();
    UmlPropertyAdapter.register();
    UmlMethodAdapter.register();

    // registerUmlIcons();
}

export const UML_TOOL_LAYOUT = [
    'uml_class',
    'uml_property',
    'uml_method',
];
