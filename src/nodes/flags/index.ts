import { IconRegistry } from "../../factory/icon.registry";
import type { INodeAdapter } from "../../factory/node.adapter";
import { NodeRegistry } from "../../factory/node.registry";
import { ToolsetRegistry } from "../../factory/toolset.registry";
import { ICON_NAMES as FLAG_ICON_NAMES, ICON_REGISTRY as FLAG_ICON_REGISTRY } from '../../icons_generated/flag.icons';
import { SvgAdapter } from "../rectangle/svg.adapter";

export function registerFlagIcons(): string[] {

    for (const name of FLAG_ICON_NAMES) {
        const def = (FLAG_ICON_REGISTRY as any)[name];
        if (name === 'select' || def.name === 'select') continue;

        const tool = 'svg:' + name;
        const aspect_ratio = def.defaultWidth / def.defaultHeight;
        const height = Math.min(def.defaultWidth, 40);
        const width = height * aspect_ratio;

        IconRegistry.registerSymbol(tool, def.name, def.svg);

        const adapter = new SvgAdapter();
        adapter.drag_create = true;
        adapter.onCreateDraft = (name) => {
            return {
                type: tool,
                image: { image_id: tool },
                locked_aspect: true,
                points: [{ x: 0, y: 0 }, { x: width, y: height }],
            };
        };
        NodeRegistry.register(tool, adapter as INodeAdapter);
        FLAG_ICON_NAMES.splice(FLAG_ICON_NAMES.indexOf(name), 1, tool);
    }
    return FLAG_ICON_NAMES;
}

export function registerFlagToolset(): void {
    registerFlagIcons();

    ToolsetRegistry.global.register({
        name: 'Flags',
        layout: FLAG_ICON_NAMES,
    });
}