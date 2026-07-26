import { IconRegistry, sym } from "../../factory/icon.registry";

export function registerC4Icons(): void {

    // C4 system: system boundary with a title strip and two inner building blocks.
    IconRegistry.registerSymbol('c4_system', 'tool-c4-system',
        sym('tool-c4-system', `<rect x="3" y="4" width="18" height="16" rx="2"/>
        <line x1="3" y1="8" x2="21" y2="8"/>
        <rect x="6" y="11" width="5" height="5" rx="1"/>
        <rect x="13" y="11" width="5" height="5" rx="1"/>`));

    // C4 container: one bounded deployable unit inside a boundary.
    IconRegistry.registerSymbol('c4_container', 'tool-c4-container',
        sym('tool-c4-container', `<rect x="3" y="4" width="18" height="16" rx="2"/>
        <rect x="7" y="9" width="10" height="8" rx="1.5"/>
        <line x1="9" y1="12" x2="15" y2="12"/>`));

    // C4 component: UML-style component block with side tabs.
    IconRegistry.registerSymbol('c4_component', 'tool-c4-component',
        sym('tool-c4-component', `<rect x="6" y="6" width="14" height="12" rx="2"/>
        <rect x="3" y="8" width="3" height="3" rx="0.6"/>
        <rect x="3" y="13" width="3" height="3" rx="0.6"/>
        <line x1="10" y1="11" x2="16" y2="11"/>`));

    // C4 database: canonical cylinder shape.
    IconRegistry.registerSymbol('c4_database', 'tool-c4-database',
        sym('tool-c4-database', `<ellipse cx="12" cy="6" rx="8.5" ry="2.8"/>
        <path d="M3.5 6v10.8c0 1.55 3.8 2.8 8.5 2.8s8.5-1.25 8.5-2.8V6"/>`));

    // C4 store: bucket silhouette (wide rim, tapered body, rounded small base).
    IconRegistry.registerSymbol('c4_store', 'tool-c4-store',
        sym('tool-c4-store', `<ellipse cx="12" cy="6" rx="8.5" ry="2.8"/>
        <path d="M4.4 6.7 L7.2 18.2"/>
        <path d="M19.6 6.7 L16.8 18.2"/>
        <ellipse cx="12" cy="18.2" rx="4.8" ry="1.5"/>`));

    // C4 person: head plus rounded shoulders silhouette.
    IconRegistry.registerSymbol('c4_person', 'tool-c4-person',
        sym('tool-c4-person', `<circle cx="12" cy="7" r="3"/>
        <path d="M5 19a7 5 0 0 1 14 0"/>`));

    // C4 relationship: solid directed relationship.
    IconRegistry.registerSymbol('c4_relationship', 'tool-c4-relationship',
        sym('tool-c4-relationship', `<line x1="4" y1="18" x2="17" y2="7"/>
        <polyline points="14 5 19 5 19 10"/>`));

    // C4 async relationship: dashed directed relationship.
    IconRegistry.registerSymbol('c4_async_relationship', 'tool-c4-async-relationship',
        sym('tool-c4-async-relationship', `<line x1="4" y1="18" x2="17" y2="7" stroke-dasharray="4 3"/>
        <polyline points="14 5 19 5 19 10"/>`));

    // C4 dependency: lighter/thinner directed relationship.
    IconRegistry.registerSymbol('c4_dependency', 'tool-c4-dependency',
        sym('tool-c4-dependency', `<line x1="4" y1="18" x2="17" y2="7" stroke-width="1.25"/>
        <polyline points="14 5 19 5 19 10"/>`));

}