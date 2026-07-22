// import { BASIC_TOOL_LAYOUT, type ToolsetConfig } from "./diagram.toolset";

// /**
//  * ToolsetRegistry is a holder of toolbox configurations for the diagram editor.
//  * It allows for registering, retrieving, and unregistering toolsets based on their name.
//  * This enables the diagram system to support various toolsets and their associated configurations in a modular way.
//  * 
//  * Toolsets should be registered with a unique name (will be used as a label) that identifies the toolset.
//  * The registry can then be used to customize diagram editor instances.
//  * 
//  * The global instance of the ToolsetRegistry can be accessed via ToolsetRegistry.global, which allows for registering toolsets 
//  * that are available across all diagram editor instances without explicitly passing them.
//  * 
//  * Example usage:
//  * 
//  * ToolsetRegistry.global.register({
//  *   name: 'Basic',
//  *   layout: ['select', 'rectangle', 'text', 'line']
//  * });
//  * const defaultEditor = new DiagramEditor({ 
//  *   host: document.getElementById('editor') 
//  * });
//  * 
//  * const bpmnToolset = new ToolsetRegistry();
//  * bpmnToolset.register([
//  *   { name: 'Basic', layout: ['select', 'rectangle', 'text', 'line'] },
//  *   { name: 'BPMN', layout: ['task', 'event', 'gateway'] },
//  * ])
//  * 
//  * const bpmnEditor = new DiagramEditor({ 
//  *   host: document.getElementById('editor'), 
//  *   toolsets: bpmnToolset.registeredToolsets() 
//  * });
//  */
// export class ToolsetRegistry {

//     private _sets: ToolsetConfig[] = [];

//     private static _global: ToolsetRegistry;

//     /**
//      * Gets the global instance of the ToolsetRegistry.
//      * @returns The global ToolsetRegistry instance.
//      */
//     public static get global(): ToolsetRegistry {
//         if (!this._global) {
//             this._global = new ToolsetRegistry();
//             this._global.register({
//                 name: 'Basic',
//                 layout: BASIC_TOOL_LAYOUT
//             });
//         }
//         return this._global;
//     }

//     /**
//      * Registers a toolset configuration.
//      * @param config The toolset configuration to register.
//      */
//     public register(config: ToolsetConfig): void {
//         this._sets.push(config);
//     }

//     /**
//      * Unregisters a toolset by its name.
//      * @param name The name of the toolset to unregister.
//      */
//     public unregister(name: string): void {
//         this._sets = this._sets.filter(set => set.name !== name);
//     }

//     /**
//      * Retrieves a list of all registered toolsets.
//      * @returns An array of ToolsetConfig objects representing the registered toolsets.
//      */
//     public registeredToolsets(): ToolsetConfig[] {
//         return this._sets;
//     }
// }
