import type { DiagramEditView } from "../../editview";
import { injectStyles, setClasses } from "../editor.utils";
import { BASIC_TOOL_LAYOUT, DiagramToolset, type ToolsetConfig } from "./diagram.toolset";
import { BPMN_TOOL_LAYOUT } from "../../nodes/bpmn";
import { C4_TOOL_LAYOUT } from "../../nodes/c4";

import DEFAULT_STYLES from '../../css_generated/editor/toolbox/diagram.toolbox.css';
const STYLE_ID = 'toolbox-defaults';

function ensureDefaultStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

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
        layout: BPMN_TOOL_LAYOUT,
    }, {
        name: 'C4',
        layout: C4_TOOL_LAYOUT,
    }],
    hostClassName: 'toolbox',
    sectionClassName: 'toolbox-section',
    headingClassName: 'toolbox-heading',
    gridClassName: 'toolbox-grid',
};

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