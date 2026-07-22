import { NodeRegistry } from '../../factory/node.registry';
import { ToolsetRegistry } from '../../factory/toolset.registry';

import { UmlClassAdapter } from './class.adapter';
import { UmlPropertyAdapter } from './property.adapter';
import { UmlMethodAdapter } from './method.adapter';

import { UmlAssociationAdapter } from './association.adapter';
import { UmlAggregationAdapter } from './aggregation.adapter';
import { UmlCompositionAdapter } from './composition.adapter';
import { UmlDependencyAdapter } from './dependency.adapter';
import { UmlUsageDependencyAdapter } from './usage.dependency.adapter';
import { UmlTemplateBindingAdapter } from './template.binding.adapter';
import { UmlRealizationAdapter } from './realization.adapter';
import { UmlGeneralizationAdapter } from './generalization.adapter';

import { registerUmlIcons } from './icons';

export function registerUmlAdapters(): void {
    UmlClassAdapter.register();
    UmlPropertyAdapter.register();
    UmlMethodAdapter.register();

    UmlAssociationAdapter.register();
    UmlAggregationAdapter.register();
    UmlCompositionAdapter.register();
    UmlDependencyAdapter.register();
    UmlUsageDependencyAdapter.register();
    UmlTemplateBindingAdapter.register();
    UmlRealizationAdapter.register();
    UmlGeneralizationAdapter.register();

    registerUmlIcons();

    NodeRegistry.registerTransferables([
        UmlAssociationAdapter.TYPE,
        UmlAggregationAdapter.TYPE,
        UmlCompositionAdapter.TYPE,
        UmlDependencyAdapter.TYPE,
        UmlUsageDependencyAdapter.TYPE,
        UmlTemplateBindingAdapter.TYPE,
        UmlRealizationAdapter.TYPE,
        UmlGeneralizationAdapter.TYPE,
    ]);
}

export const UML_TOOL_LAYOUT = [
    'uml_class',
    'uml_property',
    'uml_method',

    'uml_association',
    'uml_generalization',
    'uml_realization',
    'uml_aggregation',
    'uml_composition',

    'uml_dependency',
    'uml_usage_dependency',
    'uml_template_binding',
];

export function registerUmlToolset(): void {
    registerUmlAdapters();

    ToolsetRegistry.global.register({
        name: 'UML',
        layout: UML_TOOL_LAYOUT,
    });
}
