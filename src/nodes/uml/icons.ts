import { IconRegistry, sym } from "../../factory/icon.registry";

export function registerUmlIcons(): void {

    // ── Node types ──────────────────────────────────────────────────────────

    // Three-compartment class box (name | attributes | methods)
    IconRegistry.registerSymbol('uml_class', 'tool-uml-class',
        sym('tool-uml-class', `<rect x="3" y="4" width="18" height="16" rx="1"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="14" x2="21" y2="14"/>`));

    // Attribute row with + (public) visibility marker on left
    IconRegistry.registerSymbol('uml_property', 'tool-uml-property',
        sym('tool-uml-property', `<rect x="3" y="8" width="18" height="8" rx="1"/>
        <line x1="6" y1="12" x2="10" y2="12"/>
        <line x1="8" y1="10" x2="8" y2="14"/>
        <line x1="12" y1="12" x2="19" y2="12"/>`));

    // Method row with () parentheses indicator on left
    IconRegistry.registerSymbol('uml_method', 'tool-uml-method',
        sym('tool-uml-method', `<rect x="3" y="8" width="18" height="8" rx="1"/>
        <path d="M7 10.5 C5.5 11 5.5 13 7 13.5"/>
        <path d="M9 10.5 C10.5 11 10.5 13 9 13.5"/>
        <line x1="12" y1="12" x2="19" y2="12"/>`));

    // ── Relationship types ───────────────────────────────────────────────────

    // Association — solid line, open arrowhead (navigability)
    IconRegistry.registerSymbol('uml_association', 'tool-uml-association',
        sym('tool-uml-association', `<line x1="3" y1="12" x2="18" y2="12"/>
        <polyline points="14,8.5 20,12 14,15.5"/>`));

    // Generalization — solid line, hollow triangle (inheritance)
    IconRegistry.registerSymbol('uml_generalization', 'tool-uml-generalization',
        sym('tool-uml-generalization', `<line x1="3" y1="12" x2="15" y2="12"/>
        <polyline points="15,7.5 21,12 15,16.5 15,7.5"/>`));

    // Realization — dashed line, hollow triangle (interface implementation)
    IconRegistry.registerSymbol('uml_realization', 'tool-uml-realization',
        sym('tool-uml-realization', `<line x1="3" y1="12" x2="15" y2="12" stroke-dasharray="3 2"/>
        <polyline points="15,7.5 21,12 15,16.5 15,7.5"/>`));

    // Aggregation — hollow diamond at source, line to target (shared whole-part)
    IconRegistry.registerSymbol('uml_aggregation', 'tool-uml-aggregation',
        sym('tool-uml-aggregation', `<polyline points="3,12 7,8.5 11,12 7,15.5 3,12"/>
        <line x1="11" y1="12" x2="21" y2="12"/>`));

    // Composition — filled diamond at source, line to target (exclusive whole-part)
    IconRegistry.registerSymbol('uml_composition', 'tool-uml-composition',
        sym('tool-uml-composition', `<polygon points="3,12 7,8.5 11,12 7,15.5" fill="currentColor"/>
        <line x1="11" y1="12" x2="21" y2="12"/>`));

    // Dependency — dashed line, open arrowhead («uses»)
    IconRegistry.registerSymbol('uml_dependency', 'tool-uml-dependency',
        sym('tool-uml-dependency', `<line x1="3" y1="12" x2="18" y2="12" stroke-dasharray="3 2"/>
        <polyline points="14,8.5 20,12 14,15.5"/>`));

    // Usage dependency — dashed arrow with « guillemets at source (stereotype «use»)
    IconRegistry.registerSymbol('uml_usage_dependency', 'tool-uml-usage-dep',
        sym('tool-uml-usage-dep', `<line x1="9" y1="12" x2="18" y2="12" stroke-dasharray="3 2"/>
        <polyline points="14,8.5 20,12 14,15.5"/>
        <polyline points="5,9 3,12 5,15"/>
        <polyline points="7,9 5,12 7,15"/>`));

    // Template binding — dashed parameter box at source, dashed arrow to template
    IconRegistry.registerSymbol('uml_template_binding', 'tool-uml-template',
        sym('tool-uml-template', `<rect x="3" y="5" width="9" height="6" stroke-dasharray="2 2"/>
        <line x1="3" y1="14" x2="18" y2="14" stroke-dasharray="3 2"/>
        <polyline points="14,10.5 20,14 14,17.5"/>`));

}