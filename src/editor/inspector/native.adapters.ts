import { CheckboxAdapter } from "./native/checkbox.adapter";
import type { InspectorAdapterClass } from "./inspector";
import { NumberInputAdapter } from "./native/number.input.adapter";
import { TextInputAdapter } from "./native/text.input.adapter";

export function registerNativeInspectorAdapters(registerAdapter: (name: string, adapterClass: InspectorAdapterClass) => void) {
    registerAdapter('string', TextInputAdapter);
    registerAdapter('text', TextInputAdapter);
    registerAdapter('number', NumberInputAdapter);
    registerAdapter('boolean', CheckboxAdapter);
}

export const DefaultInspectorAdapter = TextInputAdapter;
