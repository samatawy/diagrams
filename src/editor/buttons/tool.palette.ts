import { DiagramEditView } from '../../editview/diagram.edit.view';
import { NodeRegistry } from '../../factory/node.registry';
import { IconRegistry } from '../../factory/icon.registry';
import { DIAGRAM_TOOL_CHANGED_EVENT, type DiagramToolChange } from '../../events/diagram.events';

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
    'text',
    'line',
    'polyline',
    'manhattan',
    'curve',
    'rhombus',
    'parallelogram',
    'trapezoid',
    'document',
    'polygon',
    'svg',
    '*',
];

const STYLE_ID = 'tool-palette-defaults';

const DEFAULT_STYLES = `
.editor-tool-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--diagram-ui-toolbar-gap, 6px);
}

.editor-tool-list button {
    appearance: none;
    width: var(--diagram-ui-palette-button-size, 40px);
    height: var(--diagram-ui-palette-button-size, 40px);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.12));
    border-radius: var(--diagram-ui-control-radius, 10px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    padding: var(--diagram-ui-palette-button-padding, 9px);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    font: 600 var(--diagram-ui-font-size, 13px)/1.2 var(--diagram-ui-font-family, system-ui);
    color: var(--diagram-ui-text-muted, #334155);
    cursor: pointer;
    transition: border-color var(--diagram-ui-transition-fast, 100ms ease), background-color var(--diagram-ui-transition-fast, 100ms ease), color var(--diagram-ui-transition-fast, 100ms ease);
}

.editor-tool-list button svg {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.editor-tool-list button:hover,
.editor-tool-list button:focus-visible {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
    color: var(--diagram-ui-accent, #0f766e);
}

.editor-tool-list button.is-active {
    background: var(--diagram-ui-accent, #0f766e);
    border-color: var(--diagram-ui-accent, #0f766e);
    color: var(--diagram-ui-accent-contrast, #ffffff);
}
`;

import { injectStyles, setClasses } from '../editor.utils';

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

    /**
     * Creates a tool palette mounted inside the given host element.
     * @param host The element that will contain the tool buttons.
     * @param diagram The diagram view whose tool selection the palette controls.
     * @param config Optional layout and style configuration.
     */
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

    /**
     * Adds a tool entry manually, useful for custom or non-registered tools.
     * @param tool The tool identifier string.
     * @param label Optional display label; defaults to a prettified version of the tool name.
     */
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

    /**
     * Swaps the underlying diagram view, for example after remounting.
     * @param diagram The new diagram view to attach to.
     */
    public setDiagramView(diagram: DiagramEditView): void {
        this.unbindDiagramEvents();
        this.diagram = diagram;
        this.bindDiagramEvents();
        this.refresh();
    }

    /**
     * Handles diagram tool-change events and updates the highlighted tool button.
     * @param event The custom event carrying the new tool name.
     */
    protected readonly onDiagramToolChanged = (event: Event): void => {
        const nextTool = event instanceof CustomEvent
            ? ((event as CustomEvent<DiagramToolChange>).detail?.tool || this.diagram.currentTool)
            : this.diagram.currentTool;
        this.highlight(nextTool || 'select');
    };

    /**
     * Subscribes to DIAGRAM_TOOL_CHANGED_EVENT on the diagram host to track active tool changes.
     */
    protected bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_TOOL_CHANGED_EVENT, this.onDiagramToolChanged);
    }

    /**
     * Unsubscribes DIAGRAM_TOOL_CHANGED_EVENT listener attached by {@link bindDiagramEvents}.
     */
    protected unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_TOOL_CHANGED_EVENT, this.onDiagramToolChanged);
    }

    /**
     * Orders the available tools according to the configured layout, inserting wildcard tools as needed.
     * @param allTools The full list of tool identifiers to arrange.
     * @returns The ordered list of tool identifiers to render.
     */
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

    /**
     * Builds and appends a single tool button to the palette.
     * @param tool The tool identifier string.
     * @param label The display label and tooltip for the button.
     */
    protected renderTool(tool: string, label: string): void {
        const button = document.createElement('button');
        button.type = 'button';
        button.title = label;
        button.setAttribute('data-tool', tool);
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', label);

        const adapter = NodeRegistry.adapter(tool);
        if (adapter?.drag_create) {
            this.attachDragCreateBehavior(button, tool);
        }

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

    /**
     * Attaches pointer-based drag-to-create behavior to a tool button.
     * Does nothing when the tool's adapter does not produce a draft node.
     * @param button The button element to instrument.
     * @param tool The tool identifier whose adapter supplies the draft node.
     */
    protected attachDragCreateBehavior(button: HTMLButtonElement, tool: string): void {
        const adapter = NodeRegistry.adapter(tool);
        const draft = adapter?.onCreateDraft ? adapter.onCreateDraft(tool) : undefined;
        if (!draft) {
            // draft cannot be created, so do not attach drag behavior
            return;
        }

        let pointerArmed = false;
        let draftStarted = false;

        const releasePointerArm = () => {
            pointerArmed = false;
            window.removeEventListener('pointerup', releasePointerArm, true);
            window.removeEventListener('pointercancel', releasePointerArm, true);
        };

        button.addEventListener('pointerdown', (event: PointerEvent) => {
            if (event.button !== 0) return;
            pointerArmed = true;
            draftStarted = false;
            window.addEventListener('pointerup', releasePointerArm, true);
            window.addEventListener('pointercancel', releasePointerArm, true);
        });

        button.addEventListener('pointerleave', (event: PointerEvent) => {
            if (!pointerArmed || draftStarted) return;
            if ((event.buttons & 1) !== 1) return;

            draftStarted = true;
            const draft = adapter?.onCreateDraft ? adapter.onCreateDraft(tool) : undefined;
            if (draft) {
                this.diagram.createDragDraft(draft);
            }
        });
    }

    /**
     * Marks the given tool button as active and clears the active state from all others.
     * @param tool The tool identifier to highlight.
     */
    protected highlight(tool: string): void {
        for (const button of this.host.querySelectorAll<HTMLButtonElement>('button[data-tool]')) {
            const isActive = button.getAttribute('data-tool') === tool;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        }
    }
}