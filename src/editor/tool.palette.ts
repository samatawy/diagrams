import { DiagramEditView } from '../editview/diagram.edit.view';
import { NodeRegistry } from '../factory/node.registry';
import { IconRegistry } from '../factory/icon.registry';
import { DIAGRAM_TOOL_CHANGED_EVENT, type DiagramToolChange } from '../events/diagram.events';

export const TOOL_PALETTE_TOOL_SELECTED_EVENT = 'tool-selected';

export type ToolPaletteLayoutItem = string | '*';

/**
 * Configuration options for the ToolPalette component.
 * Provide only the properties you want to customize. All other properties will use default values.
 */
export interface ToolPaletteConfig {
    /**
     * Ordered layout of tools in the palette. '*' means insert all remaining tools at this position.
     */
    layout?: ToolPaletteLayoutItem[];
    /**
     * Optional CSS class name to apply to the host element of the tool palette. This allows for custom styling of the entire palette.
     */
    hostClassName?: string;
}

export const DEFAULT_TOOL_LAYOUT: ToolPaletteLayoutItem[] = [
    'select',
    'rectangle',
    'round_rectangle',
    'ellipse',
    'rhombus',
    'text',
    'svg',
    '*',
];

const STYLE_ID = 'tool-palette-defaults';

const DEFAULT_STYLES = `
.editor-tool-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
}

.editor-tool-list button {
    appearance: none;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.88);
    padding: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    font: 600 13px/1.2 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #334155;
    cursor: pointer;
    transition: border-color 100ms ease, background-color 100ms ease, color 100ms ease;
}

.editor-tool-list button svg {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.editor-tool-list button:hover,
.editor-tool-list button:focus-visible {
    border-color: rgba(15, 118, 110, 0.45);
    color: #0f766e;
}

.editor-tool-list button.is-active {
    background: #0f766e;
    border-color: #0f766e;
    color: #ffffff;
}
`;

import { injectStyles, setClasses } from './editor.utils';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

/**
 * Converts a tool key into a display label.
 * @param name The raw tool key.
 * @returns A human-readable tool label.
 */
function prettyToolName(name: string): string {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * A toolbar component that displays a list of tools for the diagram editor.
 * It allows users to select a tool, and the selected tool is highlighted.
 * The component emits a 'tool-selected' event when a tool is selected.
 * The layout of the tools can be customized via the configuration options.
 */
export class ToolPalette {

    protected host: HTMLElement;

    protected diagram: DiagramEditView;

    protected config: ToolPaletteConfig;

    protected manualTools = new Map<string, string>();

    protected renderedTools: string[] = [];

    constructor(host: HTMLElement, diagram: DiagramEditView, config: ToolPaletteConfig = {}) {
        ensureDefaultStyles();
        this.host = host;
        this.diagram = diagram;
        this.config = config;
        if (config.hostClassName) {
            setClasses(this.host, 'editor-tool-list', config.hostClassName);
        } else {
            setClasses(this.host, 'editor-tool-list');
        }

        this.bindDiagramEvents();
        this.refresh();
    }

    /**
     * Cleans up the palette and detaches diagram listeners.
     */
    public destroy(): void {
        this.unbindDiagramEvents();
        this.host.innerHTML = '';
        this.manualTools.clear();
        this.renderedTools = [];
    }

    /**
     * Rebuilds and re-renders the tool list from the current registry and layout.
     */
    public refresh(): void {
        this.host.innerHTML = '';
        this.renderedTools = [];

        const registryTools = NodeRegistry.registeredTypes();
        const allTools = ['select', ...registryTools.filter((t) => t !== 'select')];

        for (const [tool, label] of this.manualTools.entries()) {
            if (!allTools.includes(tool)) {
                allTools.push(tool);
            }
            this.manualTools.set(tool, label || prettyToolName(tool));
        }

        for (const tool of this.resolveLayout(allTools)) {
            this.renderTool(tool, this.manualTools.get(tool) || prettyToolName(tool));
        }

        this.highlight(this.diagram.currentTool || 'select');
    }

    /** Adds a tool entry manually (useful for custom/non-registered tools). */
    public addTool(tool: string, label?: string): void {
        this.manualTools.set(tool, label || prettyToolName(tool));
        this.refresh();
    }

    /**
     * Removes all manually added tools and clears the rendered palette.
     */
    public clearTools(): void {
        this.manualTools.clear();
        this.host.innerHTML = '';
        this.renderedTools = [];
    }

    /** Swap the underlying diagram view (e.g. after remounting). */
    public setDiagramView(diagram: DiagramEditView): void {
        this.unbindDiagramEvents();
        this.diagram = diagram;
        this.bindDiagramEvents();
        this.refresh();
    }

    /**
     * Handles the diagram tool change event.
     * @param event The event object containing the tool change details.
     */
    protected readonly onDiagramToolChanged = (event: Event): void => {
        const nextTool = event instanceof CustomEvent
            ? ((event as CustomEvent<DiagramToolChange>).detail?.tool || this.diagram.currentTool)
            : this.diagram.currentTool;
        this.highlight(nextTool || 'select');
    };

    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_TOOL_CHANGED_EVENT, this.onDiagramToolChanged);
    }

    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_TOOL_CHANGED_EVENT, this.onDiagramToolChanged);
    }

    protected resolveLayout(allTools: string[]): string[] {
        const layout = this.config.layout?.length ? this.config.layout : DEFAULT_TOOL_LAYOUT;
        const remaining = allTools.filter((tool) => tool !== '');
        const used = new Set<string>();
        const result: string[] = [];
        let consumedWildcard = false;

        for (const item of layout) {
            if (item === '*') {
                consumedWildcard = true;
                for (const tool of remaining) {
                    if (!used.has(tool)) {
                        used.add(tool);
                        result.push(tool);
                    }
                }
                continue;
            }

            if (allTools.includes(item) && !used.has(item)) {
                used.add(item);
                result.push(item);
            }
        }

        if (!consumedWildcard) {
            for (const tool of remaining) {
                if (!used.has(tool)) {
                    used.add(tool);
                    result.push(tool);
                }
            }
        }

        return result;
    }

    protected renderTool(tool: string, label: string): void {
        const button = document.createElement('button');
        button.type = 'button';
        button.title = label;
        button.setAttribute('data-tool', tool);
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', label);

        const iconEl = IconRegistry.createElement(tool);
        if (iconEl) {
            button.appendChild(iconEl);
        } else {
            button.textContent = label;
        }

        button.addEventListener('click', async () => {
            const previousTool = this.diagram.currentTool;
            await this.diagram.setTool(tool);
            this.highlight(this.diagram.currentTool || tool);
            this.host.dispatchEvent(new CustomEvent(TOOL_PALETTE_TOOL_SELECTED_EVENT, {
                detail: {
                    tool,
                    previousTool,
                },
            }));
        });

        this.host.appendChild(button);
        this.renderedTools.push(tool);
    }

    protected highlight(tool: string): void {
        for (const button of this.host.querySelectorAll<HTMLButtonElement>('button[data-tool]')) {
            const isActive = button.getAttribute('data-tool') === tool;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        }
    }
}