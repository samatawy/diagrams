// Logic tools

import { IconRegistry } from "../../factory/icon.registry";
import { sym } from "../../factory/icon.registry";

export function registerLogicIcons(): void {
    IconRegistry.registerSymbol('logic_and_gate', 'tool-logic-and',
        sym('tool-logic-and', `
        <path d="M5 5h6a8 7 0 0 1 0 14H5Z"/>
        <line x1="2" y1="9" x2="5" y2="9"/>
        <line x1="2" y1="15" x2="5" y2="15"/>
        <line x1="19" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_or_gate', 'tool-logic-or',
        sym('tool-logic-or', `
        <path d="M4 5Q8 12 4 19Q11 19 19 12Q11 5 4 5Z"/>
        <line x1="2" y1="9" x2="5" y2="9"/>
        <line x1="2" y1="15" x2="5" y2="15"/>
        <line x1="19" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_not_gate', 'tool-logic-not',
        sym('tool-logic-not', `
        <path d="M5 5L5 19L17 12Z"/>
        <circle cx="19" cy="12" r="2"/>
        <line x1="2" y1="12" x2="5" y2="12"/>
        <line x1="21" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_nand_gate', 'tool-logic-nand',
        sym('tool-logic-nand', `
        <path d="M5 5h6a8 7 0 0 1 0 14H5Z"/>
        <circle cx="19" cy="12" r="2"/>
        <line x1="2" y1="9" x2="5" y2="9"/>
        <line x1="2" y1="15" x2="5" y2="15"/>
        <line x1="21" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_nor_gate', 'tool-logic-nor',
        sym('tool-logic-nor', `
        <path d="M4 5Q8 12 4 19Q11 19 19 12Q11 5 4 5Z"/>
        <circle cx="19" cy="12" r="2"/>
        <line x1="2" y1="9" x2="5" y2="9"/>
        <line x1="2" y1="15" x2="5" y2="15"/>
        <line x1="21" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_xor_gate', 'tool-logic-xor',
        sym('tool-logic-xor', `
    <path d="M1.8 5Q5.8 12 1.8 19"/>
    <path d="M5.8 5Q9.8 12 5.8 19Q12.4 19 19 12Q12.4 5 5.8 5Z"/>
    <line x1="2.5" y1="9" x2="5.8" y2="9"/>
    <line x1="2.5" y1="15" x2="5.8" y2="15"/>
    <line x1="19" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_xnor_gate', 'tool-logic-xnor',
        sym('tool-logic-xnor', `
    <path d="M1.8 5Q5.8 12 1.8 19"/>
    <path d="M5.8 5Q9.8 12 5.8 19Q12.4 19 18 12Q12.4 5 5.8 5Z"/>
    <circle cx="19.5" cy="12" r="1.5"/>
    <line x1="2.5" y1="9" x2="5.8" y2="9"/>
    <line x1="2.5" y1="15" x2="5.8" y2="15"/>
    <line x1="21" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_xand_gate', 'tool-logic-xand',
        sym('tool-logic-xand', `
    <path d="M1.8 5Q5.8 12 1.8 19"/>
    <path d="M5.8 5h5.6a7.6 7 0 0 1 0 14H5.8Z"/>
    <line x1="2.5" y1="9" x2="5.8" y2="9"/>
    <line x1="2.5" y1="15" x2="5.8" y2="15"/>
    <line x1="19" y1="12" x2="22" y2="12"/>`));




    IconRegistry.registerSymbol('logic_buffer', 'tool-logic-buffer',
        sym('tool-logic-buffer', `
        <path d="M5 5L5 19L17 12Z"/>
        <line x1="2" y1="12" x2="5" y2="12"/>
        <line x1="17" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_tristate_buffer', 'tool-logic-tristate-buffer',
        sym('tool-logic-tristate-buffer', `
        <path d="M5 5L5 17L17 11Z"/>
        <line x1="2" y1="11" x2="5" y2="11"/>
        <line x1="17" y1="11" x2="22" y2="11"/>
        <line x1="8" y1="22" x2="8" y2="16"/>`));


    IconRegistry.registerSymbol('logic_d_flipflop', 'tool-logic-d-flipflop',
        sym('tool-logic-d-flipflop', `
    <rect x="6" y="4" width="12" height="16" rx="1"/>
    <polyline points="6 12 9 10 9 14 6 12"/>  <!-- clock notch -->
    <line x1="2" y1="8" x2="6" y2="8"/>
    <line x1="2" y1="16" x2="6" y2="16"/>
    <line x1="18" y1="8" x2="22" y2="8"/>
    <line x1="18" y1="16" x2="22" y2="16"/>
    <text x="12.6" y="14" font-family="sans-serif" font-size="6" text-anchor="middle" fill="currentColor" stroke="none">D</text>`));


    IconRegistry.registerSymbol('logic_jk_flipflop', 'tool-logic-jk-flipflop',
        sym('tool-logic-jk-flipflop', `
        <rect x="6" y="4" width="12" height="16" rx="1"/>
        <line x1="2" y1="7" x2="6" y2="7"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="2" y1="17" x2="6" y2="17"/>
        <polyline points="6 12 9 10 9 14 6 12"/>
        <line x1="18" y1="8" x2="22" y2="8"/>
        <line x1="18" y1="16" x2="22" y2="16"/>`));


    IconRegistry.registerSymbol('logic_sr_flipflop', 'tool-logic-sr-flipflop',
        sym('tool-logic-sr-flipflop', `
    <rect x="6" y="4" width="12" height="16" rx="1"/>
    <polyline points="6 12 9 10 9 14 6 12"/>  <!-- clock notch -->
    <line x1="2" y1="8" x2="6" y2="8"/>
    <line x1="2" y1="16" x2="6" y2="16"/>
    <line x1="18" y1="8" x2="22" y2="8"/>
    <line x1="18" y1="16" x2="22" y2="16"/>
    <text x="12.8" y="14" font-family="sans-serif" font-size="5.2" text-anchor="middle" fill="currentColor" stroke="none">SR</text>`));

    IconRegistry.registerSymbol('logic_d_latch', 'tool-logic-d-latch',
        sym('tool-logic-d-latch', `
    <rect x="6" y="4" width="12" height="16" rx="1"/>
    <line x1="2" y1="8" x2="6" y2="8"/>
    <line x1="2" y1="16" x2="6" y2="16"/>
    <line x1="18" y1="8" x2="22" y2="8"/>
    <line x1="18" y1="16" x2="22" y2="16"/>
    <text x="12" y="14" font-family="sans-serif" font-size="6" text-anchor="middle" fill="currentColor" stroke="none">D</text>`));


    IconRegistry.registerSymbol('logic_sr_latch', 'tool-logic-sr-latch',
        sym('tool-logic-sr-latch', `
    <rect x="6" y="4" width="12" height="16" rx="1"/>
    <line x1="2" y1="8" x2="6" y2="8"/>
    <line x1="2" y1="16" x2="6" y2="16"/>
    <line x1="18" y1="8" x2="22" y2="8"/>
    <line x1="18" y1="16" x2="22" y2="16"/>
    <text x="12" y="14" font-family="sans-serif" font-size="5.2" text-anchor="middle" fill="currentColor" stroke="none">SR</text>`));

    IconRegistry.registerSymbol('logic_multiplexer_2_1', 'tool-logic-mux-2-1',
        sym('tool-logic-mux-2-1', `
        <polygon points="7 4 17 7 17 17 7 20"/>
        <line x1="2" y1="9" x2="7" y2="9"/>
        <line x1="2" y1="15" x2="7" y2="15"/>
        <line x1="12" y1="22" x2="12" y2="18"/>
        <line x1="17" y1="12" x2="22" y2="12"/>`));

    IconRegistry.registerSymbol('logic_demultiplexer_1_2', 'tool-logic-demux-1-2',
        sym('tool-logic-demux-1-2', `
        <polygon points="7 7 17 4 17 20 7 17"/>
        <line x1="2" y1="12" x2="7" y2="12"/>
        <line x1="12" y1="22" x2="12" y2="18"/>
        <line x1="17" y1="9" x2="22" y2="9"/>
        <line x1="17" y1="15" x2="22" y2="15"/>`));

    IconRegistry.registerSymbol('logic_decoder_2_4', 'tool-logic-decoder-2-4',
        sym('tool-logic-decoder-2-4', `
        <rect x="7" y="4" width="10" height="16" rx="1"/>
        <line x1="2" y1="8" x2="7" y2="8"/>
        <line x1="2" y1="16" x2="7" y2="16"/>
        <line x1="17" y1="6.5" x2="22" y2="6.5"/>
        <line x1="17" y1="10.5" x2="22" y2="10.5"/>
        <line x1="17" y1="14.5" x2="22" y2="14.5"/>
        <line x1="17" y1="18.5" x2="22" y2="18.5"/>`));

    IconRegistry.registerSymbol('logic_encoder_4_2', 'tool-logic-encoder-4-2',
        sym('tool-logic-encoder-4-2', `
        <rect x="7" y="4" width="10" height="16" rx="1"/>
        <line x1="2" y1="6.5" x2="7" y2="6.5"/>
        <line x1="2" y1="10.5" x2="7" y2="10.5"/>
        <line x1="2" y1="14.5" x2="7" y2="14.5"/>
        <line x1="2" y1="18.5" x2="7" y2="18.5"/>
        <line x1="17" y1="9" x2="22" y2="9"/>
        <line x1="17" y1="15" x2="22" y2="15"/>`));

    IconRegistry.registerSymbol('logic_half_adder', 'tool-logic-half-adder',
        sym('tool-logic-half-adder', `
        <rect x="6" y="5" width="12" height="14" rx="2"/>
        <line x1="2" y1="9" x2="6" y2="9"/>
        <line x1="2" y1="15" x2="6" y2="15"/>
        <line x1="18" y1="9" x2="22" y2="9"/>
        <line x1="18" y1="15" x2="22" y2="15"/>
        <text x="12" y="14" font-family="sans-serif" font-size="6" text-anchor="middle" fill="currentColor" stroke="none">+</text>`));

    IconRegistry.registerSymbol('logic_full_adder', 'tool-logic-full-adder',
        sym('tool-logic-full-adder', `
        <rect x="6" y="4" width="12" height="16" rx="2"/>
        <line x1="2" y1="7" x2="6" y2="7"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="2" y1="17" x2="6" y2="17"/>
        <line x1="18" y1="9" x2="22" y2="9"/>
        <line x1="18" y1="15" x2="22" y2="15"/>
        <text x="12" y="14" font-family="sans-serif" font-size="6" text-anchor="middle" fill="currentColor" stroke="none">+</text>`));

}
