import { NodeRegistry } from "../../factory";
import { LogicAndGateAdapter } from "./and.gate";
import { LogicOrGateAdapter } from "./or.gate";
import { LogicNotGateAdapter } from "./not.gate";
import { LogicNandGateAdapter } from "./nand.gate";
import { LogicNorGateAdapter } from "./nor.gate";
import { LogicXorGateAdapter } from "./xor.gate";
import { LogicXandGateAdapter } from "./xand.gate";
import { LogicXnorGateAdapter } from "./xnor.gate";

import { LogicBufferAdapter } from "./buffer";
import { LogicTristateBufferAdapter } from "./tristate.buffer";

import { LogicDFlipFlopAdapter } from "./d.flipflop";
import { LogicJKFlipFlopAdapter } from "./jk.flipflop";
import { LogicSRFlipFlopAdapter } from "./sr.flipflop";
import { LogicDLatchAdapter } from "./d.latch";
import { LogicSRLatchAdapter } from "./sr.latch";

import { LogicMultiplexer_2_1Adapter } from "./multiplexer.2_1";
import { LogicDemultiplexer_1_2Adapter } from "./demultiplexer.1_2";
import { LogicDecoder_2_4Adapter } from "./decoder.2_4";
import { LogicEncoder_4_2Adapter } from "./encoder.4_2";
import { LogicHalfAdderAdapter } from "./half.adder";
import { LogicFullAdderAdapter } from "./full.adder";
import { registerLogicIcons } from "./icons";

/**
 * Registers all logic gate adapters with the NodeRegistry.
 * This function should be called during the initialization of the diagramming library to ensure that all logic gate types are available for use in diagrams.
 */

export function registerLogicAdapters(): void {
    NodeRegistry.register('logic_and_gate', new LogicAndGateAdapter());
    NodeRegistry.register('logic_or_gate', new LogicOrGateAdapter());
    NodeRegistry.register('logic_not_gate', new LogicNotGateAdapter());
    NodeRegistry.register('logic_nand_gate', new LogicNandGateAdapter());
    NodeRegistry.register('logic_nor_gate', new LogicNorGateAdapter());
    NodeRegistry.register('logic_xor_gate', new LogicXorGateAdapter());
    NodeRegistry.register('logic_xand_gate', new LogicXandGateAdapter());
    NodeRegistry.register('logic_xnor_gate', new LogicXnorGateAdapter());

    NodeRegistry.register('logic_buffer', new LogicBufferAdapter());
    NodeRegistry.register('logic_tristate_buffer', new LogicTristateBufferAdapter());
    NodeRegistry.register('logic_d_flipflop', new LogicDFlipFlopAdapter());
    NodeRegistry.register('logic_jk_flipflop', new LogicJKFlipFlopAdapter());
    NodeRegistry.register('logic_sr_flipflop', new LogicSRFlipFlopAdapter());
    NodeRegistry.register('logic_d_latch', new LogicDLatchAdapter());
    NodeRegistry.register('logic_sr_latch', new LogicSRLatchAdapter());

    NodeRegistry.register('logic_multiplexer_2_1', new LogicMultiplexer_2_1Adapter());
    NodeRegistry.register('logic_demultiplexer_1_2', new LogicDemultiplexer_1_2Adapter());
    NodeRegistry.register('logic_decoder_2_4', new LogicDecoder_2_4Adapter());
    NodeRegistry.register('logic_encoder_4_2', new LogicEncoder_4_2Adapter());
    NodeRegistry.register('logic_half_adder', new LogicHalfAdderAdapter());
    NodeRegistry.register('logic_full_adder', new LogicFullAdderAdapter());

    registerLogicIcons();

    // One input, one output
    NodeRegistry.registerTransferables([
        LogicBufferAdapter.TYPE,
        LogicNotGateAdapter.TYPE,
    ]);

    // Two inputs, one output
    NodeRegistry.registerTransferables([
        LogicAndGateAdapter.TYPE,
        LogicOrGateAdapter.TYPE,
        LogicNandGateAdapter.TYPE,
        LogicNorGateAdapter.TYPE,
        LogicXorGateAdapter.TYPE,
        LogicXandGateAdapter.TYPE,
        LogicXnorGateAdapter.TYPE,
    ]);

    // Two inputs, one output, one selector
    NodeRegistry.registerTransferables([
        LogicTristateBufferAdapter.TYPE,
        LogicMultiplexer_2_1Adapter.TYPE,
    ]);

    // Two inputs, two outputs
    NodeRegistry.registerTransferables([
        LogicDLatchAdapter.TYPE,
        LogicSRLatchAdapter.TYPE,
        LogicDFlipFlopAdapter.TYPE,
        LogicSRFlipFlopAdapter.TYPE,
        LogicHalfAdderAdapter.TYPE,
        LogicFullAdderAdapter.TYPE,
    ]);

    // Three inputs, two ouptuts
    NodeRegistry.registerTransferables([
        LogicJKFlipFlopAdapter.TYPE,
    ]);

    // One input, two outputs, one selector
    NodeRegistry.registerTransferables([
        LogicDemultiplexer_1_2Adapter.TYPE,
    ]);

    // Four inputs, two outputs, one selector
    NodeRegistry.registerTransferables([
        LogicDecoder_2_4Adapter.TYPE,
    ]);

    // Two inputs, four outputs, one selector
    NodeRegistry.registerTransferables([
        LogicDemultiplexer_1_2Adapter.TYPE,
    ]);
}

export const LOGIC_TOOL_LAYOUT = [
    'logic_and_gate',
    'logic_or_gate',
    'logic_not_gate',
    'logic_nand_gate',
    'logic_nor_gate',
    'logic_xor_gate',
    'logic_xand_gate',
    'logic_xnor_gate',
    'logic_buffer',
    'logic_tristate_buffer',
    'logic_d_flipflop',
    'logic_jk_flipflop',
    'logic_sr_flipflop',
    'logic_d_latch',
    'logic_sr_latch',
    'logic_multiplexer_2_1',
    'logic_demultiplexer_1_2',
    'logic_decoder_2_4',
    'logic_encoder_4_2',
    'logic_half_adder',
    'logic_full_adder',
];