import type { DiagramEditView } from "../../editview";
import { injectStyles, setClasses } from "../editor.utils";
import { BASIC_TOOL_LAYOUT, DEFAULT_TOOL_LAYOUT, DiagramToolset, type ToolsetConfig } from "./diagram.toolset";

export interface DiagramToolBoxConfig {
    /**
     * Ordered toolbox layout mixing action IDs and separators.
     * Example: ['undo', 'redo', '|', 'delete', 'copy', 'paste']
     * A default layout will be used if none is provided.
     */
    toolsets?: ToolsetConfig[];
    /**
     * Optional class name for the host element.
     */
    hostClassName?: string;
    /**
     * Optional class name for each section element.
     */
    sectionClassName?: string;
    /**
     * Optional class name for each section heading element.
     */
    headingClassName?: string;
    /**
     * Optional class name for the properties grid element inside each section.
     */
    gridClassName?: string;
}


const DEFAULT_CONFIG: Required<DiagramToolBoxConfig> = {
    toolsets: [{
        name: 'Basic',
        layout: BASIC_TOOL_LAYOUT,
    }, {
        name: 'BPMN',
        layout: ['bpmn_task',
            'bpmn_start_event', 'bpmn_intermediate_event', 'bpmn_end_event',
            'bpmn_gateway',
            'vertical_pool', 'horizontal_pool',],
    }],
    hostClassName: 'toolbox',
    sectionClassName: 'toolbox-section',
    headingClassName: 'toolbox-heading',
    gridClassName: 'toolbox-grid',
};

const STYLE_ID = 'toolbox-defaults';

const DEFAULT_STYLES = `
.toolbox {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    /*
    width: var(--diagram-toolbox-width, 100px);
    min-width: var(--diagram-toolbox-width, 100px);
    */
   width: var(--diagram-toolbox-width, 120px);
   min-width: var(--diagram-toolbox-width, 120px);

    --inspector-base: 15, 118, 110;
    --inspector-header-bg: rgba(var(--inspector-base), 0.14);
    --inspector-header-border: rgba(var(--inspector-base), 0.34);
    --inspector-label-bg: rgba(var(--inspector-base), 0.08);
    --inspector-value-bg: rgba(var(--inspector-base), 0.03);
    --inspector-caret-ease: cubic-bezier(0.2, 0.75, 0.25, 1);
    gap: var(--diagram-ui-group-gap, 4px);
    padding: var(--diagram-ui-panel-padding, 6px);
    font: var(--diagram-ui-font-size, 12px)/1.4 var(--diagram-ui-font-family, system-ui);
    color: var(--diagram-ui-text, #1f2937);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    overflow-y: auto;
    box-sizing: border-box;
}

/* Section */
.toolbox .toolbox-section {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    gap: 0;
}

/* Collapsible body wrapper — uses grid-template-rows so overflow can be cleared after expand */
.toolbox .toolbox-section-body {
    display: grid;
    grid-template-rows: 1fr;
    // overflow: hidden;
    transition: grid-template-rows 0.26s var(--inspector-caret-ease);
}
.toolbox .toolbox-section.is-collapsed .toolbox-section-body {
    grid-template-rows: 0fr;
}

/* Section heading */
.toolbox .toolbox-heading {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, system-ui);
    color: rgba(var(--inspector-base), 1);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: var(--diagram-ui-border-width, 1px) solid var(--inspector-header-border);
    border-radius: var(--inspector-heading-radius, 5px);
    background: var(--inspector-header-bg);
    margin-bottom: 0;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.22s ease, border-color 0.22s ease, color 0.22s ease;
}
.toolbox .toolbox-heading::before {
    content: '';
    width: 3px;
    height: 3px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    margin-inline-end: 2px;
    transform: rotate(45deg);
    transform-origin: 50% 50%;
    transition: transform 0.26s var(--inspector-caret-ease);
}
.toolbox .toolbox-section.is-collapsed .toolbox-heading::before {
    transform: rotate(-45deg);
}

/* Two-column property grid */
.toolbox .toolbox-grid {
    display: grid;
    /*
    grid-template-columns: var(--inspector-label-width, 80px) minmax(0, 1fr);
    row-gap: 2px;
    column-gap: var(--diagram-ui-control-gap, 8px);
    */

    grid-template-columns: var(--toolbox-label-width, 40px) minmax(0, 1fr);
    row-gap: var(--diagram-ui-control-gap, 4px);
    column-gap: var(--diagram-ui-control-gap, 4px);

    align-items: start;
    padding: 6px 6px;
    background: color-mix(in srgb, var(--inspector-value-bg) 60%, white 40%);
    border-top: none;
    min-height: 0;
    opacity: 1;
    transition: opacity 0.22s ease, padding 0.26s var(--inspector-caret-ease);
}

.toolbox .toolbox-section.is-collapsed .toolbox-grid {
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
}

/* Row */
.toolbox .toolbox-row {
    display: contents;
}
.toolbox .toolbox-row.is-disabled .toolbox-label,
.toolbox .toolbox-row.is-disabled .toolbox-value {
    opacity: 0.45;
    pointer-events: none;
}
.toolbox .toolbox-row.is-readonly .toolbox-value {
    pointer-events: none;
}

/* Label */
.toolbox .toolbox-label {
    font: 600 var(--diagram-ui-label-font-size, 11px)/1.2 var(--diagram-ui-font-family, system-ui);
    color: color-mix(in srgb, rgba(var(--inspector-base), 1) 70%, #0f172a 30%);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 8px 6px;
    min-height: 26px;
    display: flex;
    align-items: center;
    border-radius: 6px;
    background: var(--inspector-label-bg);
}

/* Value / control cell */
.toolbox .toolbox-value {
    display: flex;
    align-items: stretch;
    min-height: 26px;
    position: relative;
    border-radius: 6px;
    background: var(--inspector-value-bg);
    padding: 2px;
}
.toolbox .toolbox-value input[type='text'],
.toolbox .toolbox-value input[type='number'],
.toolbox .toolbox-value textarea {
    width: 100%;
    box-sizing: border-box;
    padding: var(--diagram-ui-control-padding-y, 3px) var(--diagram-ui-control-padding-x, 6px);
    border: var(--diagram-ui-border-width, 1px) solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    border-radius: var(--diagram-ui-control-radius, 6px);
    background: var(--diagram-ui-surface, rgba(255, 255, 255, 0.88));
    color: var(--diagram-ui-text, #1f2937);
    font: var(--diagram-ui-font-size, 12px)/1.4 var(--diagram-ui-font-family, system-ui);
    outline: none;
    appearance: none;
}
.toolbox .toolbox-value input[type='text']:focus,
.toolbox .toolbox-value input[type='number']:focus,
.toolbox .toolbox-value textarea:focus {
    border-color: var(--diagram-ui-border-strong, rgba(15, 118, 110, 0.45));
}
.toolbox .toolbox-value input[type='text']:read-only,
.toolbox .toolbox-value input[type='number']:read-only,
.toolbox .toolbox-value textarea:read-only {
    background: transparent;
    border-color: transparent;
    color: var(--diagram-ui-text-muted, #334155);
    cursor: default;
}
.toolbox .toolbox-value input[type='checkbox'] {
    width: 14px;
    height: 14px;
    accent-color: var(--diagram-ui-accent, #0f766e);
    cursor: pointer;
}
.toolbox .toolbox-value.is-mixed input,
.toolbox .toolbox-value.is-mixed textarea {
    color: var(--diagram-ui-text-muted, #94a3b8);
    font-style: italic;
}
.toolbox .toolbox-value.is-mixed .color-preset-trigger,
.toolbox .toolbox-value.is-mixed .font-select-trigger,
.toolbox .toolbox-value.is-mixed .image-select-trigger {
    position: relative;
}
.toolbox .toolbox-value.is-unset .color-preset-trigger,
.toolbox .toolbox-value.is-unset .font-select-trigger,
.toolbox .toolbox-value.is-unset .image-select-trigger {
    position: relative;
}
.toolbox .toolbox-value.is-mixed .color-preset-trigger > *,
.toolbox .toolbox-value.is-mixed .font-select-trigger > *,
.toolbox .toolbox-value.is-mixed .image-select-trigger > * {
    opacity: 0;
}
.toolbox .toolbox-value.is-unset .color-preset-trigger > *,
.toolbox .toolbox-value.is-unset .font-select-trigger > *,
.toolbox .toolbox-value.is-unset .image-select-trigger > * {
    opacity: 0;
}
.toolbox .toolbox-value.is-mixed .color-preset-trigger::after,
.toolbox .toolbox-value.is-mixed .font-select-trigger::after,
.toolbox .toolbox-value.is-mixed .image-select-trigger::after {
    content: 'Multiple';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 8px;
    color: var(--diagram-ui-text-muted, #94a3b8);
    font-style: italic;
    pointer-events: none;
}
.toolbox .toolbox-value.is-unset .color-preset-trigger::after,
.toolbox .toolbox-value.is-unset .font-select-trigger::after,
.toolbox .toolbox-value.is-unset .image-select-trigger::after {
    content: '\\00A0';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 8px;
    pointer-events: none;
}
/* Row-level visibility controlled by isVisible() */
.toolbox [data-row-key].is-hidden {
    display: none;
}
/* Section auto-hide when all rows are hidden */
.toolbox .inspector-section.is-hidden {
    display: none;
}
/* Inspector-wide selection states */
.toolbox.toolbox-selection-mixed .inspector-heading {
    color: var(--diagram-ui-text, #0f172a);
}
`;

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

export class DiagramToolbox {

    protected diagram: DiagramEditView;

    protected config: Required<DiagramToolBoxConfig>;

    protected host: HTMLElement;

    protected toolsets: Map<string, DiagramToolset> = new Map();

    protected cells: Map<string, HTMLElement> = new Map();

    /**
     * Builds a diagram action toolbar attached to the given diagram view.
     * @param target The host element that will contain the toolbar buttons.
     * @param diagram The diagram view whose actions the toolbar controls.
     * @param config Optional layout and style configuration.
     */
    constructor(target: HTMLElement, diagram: DiagramEditView, config: DiagramToolBoxConfig = {}) {
        ensureDefaultStyles();
        this.diagram = diagram;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.host = target;
        this.build(this.config);
        this.refresh();
    }

    /**
     * Cleans up toolbar resources and detaches diagram listeners.
     */
    public destroy(): void {
        for (const toolset of this.toolsets.values()) {
            toolset.destroy();
        }
        this.toolsets.clear();
        this.host.innerHTML = '';
    }

    /**
     * Re-evaluates enabled and active state for all registered actions.
     */
    public refresh(): void {
        for (const toolset of this.toolsets.values()) {
            toolset.refresh();
        }
    }

    /**
     * Swap the underlying diagram view (e.g. after remounting).
     */
    public setDiagramView(diagram: DiagramEditView): void {
        for (const toolset of this.toolsets.values()) {
            toolset.setDiagramView(diagram);
        }
        // this.unbindDiagramEvents();
        // this.diagram = diagram;
        // this.bindDiagramEvents();
        // this.refresh();
    }

    public addToolSet(config: ToolsetConfig): void {
        this.config.toolsets = this.config.toolsets || [];
        this.config.toolsets.push(config);

        const section = document.createElement('div');
        section.className = 'diagram-toolset';
        this.host.appendChild(section);

        const toolset = new DiagramToolset(section, this.diagram, config);
        this.toolsets.set(config.name || 'default', toolset);
    }

    public expand(name?: string): void {
        for (const toolset of this.toolsets.values()) {
            if (!name || toolset.name === name) {
                this.cells.get(toolset.name)?.classList.remove('is-collapsed');
            }
        }
    }

    public collapse(name?: string): void {
        for (const toolset of this.toolsets.values()) {
            if (!name || toolset.name === name) {
                this.cells.get(toolset.name)?.classList.add('is-collapsed');
            }
        }
    }

    /**
     * Instantiates buttons for each action in the resolved layout.
     * @param config The toolbar config used to determine the button layout.
     */
    protected build(config: Required<DiagramToolBoxConfig>): void {
        setClasses(this.host, DEFAULT_CONFIG.hostClassName, config.hostClassName);

        for (const toolsetConfig of config.toolsets || []) {
            const { section, grid } = this.buildSection(toolsetConfig.name, 'expanded');
            // this.host.appendChild(section);

            const toolset = new DiagramToolset(grid, this.diagram, toolsetConfig);
            this.toolsets.set(toolsetConfig.name, toolset);
        }
    }

    /**
     * Creates a collapsible section element with a heading and a two-column property grid inside.
     * Returns the section root and the inner grid so rows can be appended to it.
     */
    protected buildSection(heading: string, state: 'expanded' | 'collapsed'): { section: HTMLElement; grid: HTMLElement } {
        const section = document.createElement('div');
        setClasses(section, DEFAULT_CONFIG.sectionClassName, this.config.sectionClassName);

        const h = document.createElement('div');
        setClasses(h, DEFAULT_CONFIG.headingClassName, this.config.headingClassName);
        h.textContent = heading;
        section.appendChild(h);

        if (state === 'collapsed') {
            section.classList.add('is-collapsed');
        }

        const body = document.createElement('div');
        body.className = 'toolbox-section-body';
        section.appendChild(body);

        const grid = document.createElement('div');
        setClasses(grid, DEFAULT_CONFIG.gridClassName, this.config.gridClassName);
        body.appendChild(grid);

        // Keep initially-collapsed content clipped so hidden controls cannot intercept heading clicks.
        if (state === 'collapsed') {
            body.style.overflow = 'hidden';
        }

        h.addEventListener('click', () => {
            const collapsing = !section.classList.contains('is-collapsed');
            if (collapsing) {
                body.style.overflow = 'hidden';
                section.classList.add('is-collapsed');
            } else {
                body.style.overflow = 'hidden';
                section.classList.remove('is-collapsed');
                body.addEventListener('transitionend', () => {
                    body.style.overflow = '';
                }, { once: true });
            }
        });

        this.host.appendChild(section);
        return { section, grid };
    }
}