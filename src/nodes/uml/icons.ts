import { IconRegistry, sym } from "../../factory/icon.registry";

export function registerErdIcons(): void {

    IconRegistry.registerSymbol('table', 'tool-table',
        sym('table', `<rect x="3" y="4" width="18" height="16" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="13" x2="21" y2="13"/>
        <line x1="9" y1="9" x2="9" y2="20"/>`));

    IconRegistry.registerSymbol('field', 'tool-field',
        sym('tool-field', `<rect x="3" y="8" width="18" height="8" rx="1.5"/>
        <line x1="8" y1="8" x2="8" y2="16"/>
        <line x1="12" y1="8" x2="12" y2="16"/>`));

    IconRegistry.registerSymbol('table_row', 'tool-table-row',
        sym('tool-table-row', `<rect x="3" y="8" width="18" height="8" rx="1.5"/>
        <line x1="8" y1="8" x2="8" y2="16"/>
        <line x1="12" y1="8" x2="12" y2="16"/>`));

    IconRegistry.registerSymbol('erd_one_to_one', 'tool-erd-1-1',
        sym('tool-erd-1-1', `<line x1="6" y1="12" x2="18" y2="12"/>
        <line x1="6" y1="8.5" x2="6" y2="15.5"/>
        <line x1="18" y1="8.5" x2="18" y2="15.5"/>`));

    IconRegistry.registerSymbol('erd_one_to_many', 'tool-erd-1-n',
        sym('tool-erd-1-n', `<line x1="6" y1="12" x2="15" y2="12"/>
        <line x1="6" y1="8.5" x2="6" y2="15.5"/>
        <line x1="15" y1="12" x2="20" y2="8"/>
        <line x1="15" y1="12" x2="20" y2="12"/>
        <line x1="15" y1="12" x2="20" y2="16"/>`));

    IconRegistry.registerSymbol('erd_many_to_many', 'tool-erd-n-n',
        sym('tool-erd-n-n', `<line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="12" x2="4" y2="8"/>
        <line x1="9" y1="12" x2="4" y2="12"/>
        <line x1="9" y1="12" x2="4" y2="16"/>
        <line x1="15" y1="12" x2="20" y2="8"/>
        <line x1="15" y1="12" x2="20" y2="12"/>
        <line x1="15" y1="12" x2="20" y2="16"/>`));

}