import type { DiagramEditView } from "../editview";
import { DIAGRAM_CHANGED_EVENT, DIAGRAM_TOOL_CHANGED_EVENT, type DiagramChanged } from "../events/diagram.events";
import { injectStyles, setClasses, toggleClasses } from "../editor/editor.utils";
import { IconRegistry } from "../factory/icon.registry";
import { AutoFixLayout } from "../layout/auto.fix";
import { DiagramQualityService, type DiagramQualityMetrics } from "./diagram.quality.service";
import { humanize } from "../value.utils";
import { MinimapView } from "../view/minimap.view";

import STATUS_BAR_STYLES from '../css_generated/status/diagram.status.bar.css';
const STATUS_BAR_STYLE_ID = 'diagram-status-bar-defaults';

function ensureStyles(): void {
    injectStyles(STATUS_BAR_STYLE_ID, STATUS_BAR_STYLES);
}

export class DiagramStatusBar {

    private static readonly QUALITY_UPDATE_DEBOUNCE_MS = 120;

    private readonly diagram: DiagramEditView;

    private readonly host: HTMLElement;

    private readonly statusBar: HTMLDivElement;

    private readonly sectionLeft: HTMLDivElement;

    private readonly sectionMiddle: HTMLDivElement;

    private readonly sectionButtons: HTMLDivElement;

    private readonly sectionQuality: HTMLDivElement;

    private readonly toolValue: HTMLSpanElement;

    private readonly hintValue: HTMLSpanElement;

    private readonly qualityTags: HTMLDivElement;

    private readonly qualityButton: HTMLButtonElement;

    private readonly qualityMenu: HTMLDivElement;

    private readonly minimapButton: HTMLButtonElement;

    private minimapView?: MinimapView;

    private minimapVisible = false;

    private qualityMenuOpen = false;

    private latestQualityMetrics: DiagramQualityMetrics | null = null;

    private qualityUpdateTimer?: ReturnType<typeof setTimeout>;

    private readonly onDiagramChanged = (event: Event): void => {
        this.updateStatus();

        const detail = (event as CustomEvent<DiagramChanged>).detail;
        const scope = detail?.scope;

        // Quality metrics are O(n) over nodes/connections; avoid recomputing on
        // high-frequency view events such as selection-rect dragging.
        if (scope === 'model' || scope === 'style' || !scope) {
            this.scheduleQualityMetricsUpdate();
        }
    };

    private readonly onToolChanged = (): void => {
        this.updateStatus();
    };

    private readonly onDocumentPointerDown = (event: PointerEvent): void => {
        if (!this.qualityMenuOpen) {
            return;
        }
        const target = event.target as Node | null;
        if (target && this.sectionQuality.contains(target)) {
            return;
        }
        this.closeQualityMenu();
    };

    private readonly onDocumentKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            this.closeQualityMenu();
        }
    };

    constructor(diagram: DiagramEditView, host: HTMLElement) {
        ensureStyles();

        this.diagram = diagram;
        this.host = host;
        this.statusBar = document.createElement('div');
        this.statusBar.className = 'diagram-status-bar';

        this.sectionLeft = document.createElement('div');
        setClasses(this.sectionLeft, 'diagram-status-section', 'diagram-status-section--left');

        this.sectionMiddle = document.createElement('div');
        setClasses(this.sectionMiddle, 'diagram-status-section', 'diagram-status-section--middle');

        this.sectionButtons = document.createElement('div');
        setClasses(this.sectionButtons, 'diagram-status-section', 'diagram-status-section--buttons');

        this.sectionQuality = document.createElement('div');
        setClasses(this.sectionQuality, 'diagram-status-section', 'diagram-status-section--quality');

        const toolLabel = document.createElement('span');
        toolLabel.className = 'diagram-status-label';
        toolLabel.textContent = '';
        this.toolValue = document.createElement('span');
        this.toolValue.className = 'diagram-status-value';
        this.sectionLeft.append(toolLabel, this.toolValue);

        this.hintValue = document.createElement('span');
        setClasses(this.hintValue, 'diagram-status-value', 'diagram-status-hint');
        this.sectionMiddle.append(this.buildHintLead(), this.hintValue);

        const buttonsWrap = document.createElement('div');
        buttonsWrap.className = 'diagram-status-buttons';
        this.minimapButton = document.createElement('button');
        this.minimapButton.type = 'button';
        this.minimapButton.className = 'diagram-status-button';
        this.minimapButton.setAttribute('title', 'Show or hide minimap');
        this.minimapButton.setAttribute('aria-label', 'Toggle minimap');
        this.minimapButton.textContent = 'Map';
        this.minimapButton.addEventListener('click', () => {
            this.setMinimapVisible(!this.minimapVisible);
        });
        buttonsWrap.appendChild(this.minimapButton);
        this.sectionButtons.appendChild(buttonsWrap);

        this.qualityButton = document.createElement('button');
        this.qualityButton.type = 'button';
        this.qualityButton.className = 'diagram-status-quality-button';
        this.qualityButton.setAttribute('aria-haspopup', 'menu');
        this.qualityButton.setAttribute('aria-expanded', 'false');
        this.qualityButton.setAttribute('title', 'Show quality metrics');
        this.qualityButton.addEventListener('click', () => {
            this.toggleQualityMenu();
        });

        const qualityLabel = document.createElement('span');
        qualityLabel.className = 'diagram-status-label';
        qualityLabel.textContent = 'Quality';
        this.qualityTags = document.createElement('div');
        this.qualityTags.className = 'diagram-status-tags';
        this.qualityButton.append(qualityLabel, this.qualityTags);

        this.qualityMenu = document.createElement('div');
        this.qualityMenu.className = 'diagram-status-quality-menu';
        this.qualityMenu.setAttribute('role', 'menu');
        this.qualityMenu.setAttribute('aria-label', 'Quality metrics');
        this.qualityMenu.hidden = true;
        this.sectionQuality.append(this.qualityButton, this.qualityMenu);

        this.statusBar.append(this.sectionLeft, this.sectionMiddle, this.sectionButtons, this.sectionQuality);
        this.host.appendChild(this.statusBar);

        this.bindDiagramEvents();

        this.updateStatus();
        this.updateQualityMetrics();
    }

    public destroy(): void {
        this.minimapView?.destroy();
        this.minimapView = undefined;
        this.closeQualityMenu();
        this.cancelScheduledQualityUpdate();
        this.unbindDiagramEvents();
        this.statusBar.remove();
    }

    public setHint(hint: string): void {
        this.hintValue.textContent = hint || '';
        this.hintValue.setAttribute('title', hint || '');
    }

    public setToolLabel(label: string): void {
        this.toolValue.textContent = label || 'Select';
        this.toolValue.setAttribute('title', this.toolValue.textContent);
    }

    public setQualityKeywords(tags: string[]): void {
        this.qualityTags.innerHTML = '';
        for (const tag of tags.slice(0, 5)) {
            if (!tag) {
                continue;
            }
            const el = document.createElement('span');
            el.className = 'diagram-status-tag';
            el.textContent = humanize(tag);
            this.qualityTags.appendChild(el);
        }
    }

    public setMinimapVisible(visible: boolean): void {
        this.minimapVisible = visible;
        toggleClasses(this.minimapButton, visible, 'is-active');
        this.minimapButton.setAttribute('aria-pressed', visible ? 'true' : 'false');
        this.minimapButton.textContent = visible ? 'Map On' : 'Map';

        if (visible) {
            const container = this.resolveMinimapContainer();
            if (!container) return;

            if (!this.minimapView) {
                this.minimapView = new MinimapView(this.diagram);
            }

            this.minimapView.show(container);
            return;
        }

        this.minimapView?.hide();
    }

    private updateStatus(): void {
        const tool = this.diagram.currentTool || 'select';
        this.setToolLabel(humanize(tool));
        if (!this.hintValue.textContent) {
            this.setHint('Ready');
        }
    }

    private updateQualityMetrics(): void {
        const metrics = DiagramQualityService.computeQualityMetrics(this.diagram);
        this.latestQualityMetrics = metrics;
        const tags = DiagramQualityService.computeQualityTags(metrics, 3);
        this.setQualityKeywords(tags);
        if (this.qualityMenuOpen) {
            this.renderQualityMenu(metrics);
        }
    }

    private scheduleQualityMetricsUpdate(): void {
        this.cancelScheduledQualityUpdate();

        this.qualityUpdateTimer = setTimeout(() => {
            this.qualityUpdateTimer = undefined;
            this.updateQualityMetrics();
        }, DiagramStatusBar.QUALITY_UPDATE_DEBOUNCE_MS);
    }

    private cancelScheduledQualityUpdate(): void {
        if (this.qualityUpdateTimer === undefined) {
            return;
        }

        clearTimeout(this.qualityUpdateTimer);
        this.qualityUpdateTimer = undefined;
    }

    private toggleQualityMenu(): void {
        if (this.qualityMenuOpen) {
            this.closeQualityMenu();
            return;
        }
        this.openQualityMenu();
    }

    private openQualityMenu(): void {
        if (!this.latestQualityMetrics) {
            this.latestQualityMetrics = DiagramQualityService.computeQualityMetrics(this.diagram);
        }
        this.renderQualityMenu(this.latestQualityMetrics);
        this.qualityMenu.hidden = false;
        this.qualityMenuOpen = true;
        this.qualityButton.setAttribute('aria-expanded', 'true');
        document.addEventListener('pointerdown', this.onDocumentPointerDown, { capture: true });
        document.addEventListener('keydown', this.onDocumentKeyDown);
    }

    private closeQualityMenu(): void {
        if (!this.qualityMenuOpen) {
            return;
        }
        this.qualityMenu.hidden = true;
        this.qualityMenuOpen = false;
        this.qualityButton.setAttribute('aria-expanded', 'false');
        document.removeEventListener('pointerdown', this.onDocumentPointerDown, { capture: true });
        document.removeEventListener('keydown', this.onDocumentKeyDown);
    }

    private renderQualityMenu(metrics: DiagramQualityMetrics): void {
        this.qualityMenu.innerHTML = '';

        const title = document.createElement('span');
        title.className = 'diagram-status-quality-menu-title';
        title.textContent = 'Distinct metrics';
        this.qualityMenu.appendChild(title);

        const separator = document.createElement('div');
        separator.className = 'diagram-status-quality-menu-separator';
        this.qualityMenu.appendChild(separator);

        const sharedColors = Math.max(0, (metrics.distinct_node_colors + metrics.distinct_connection_colors) - metrics.distinct_colors);

        this.appendQualityMetric('Node types', metrics.distinct_node_types);
        this.appendQualityMetric('Connection types', metrics.distinct_connection_types);
        this.appendQualityMetric('Used colors', metrics.distinct_colors);
        this.appendQualityMetric('Node colors', metrics.distinct_node_colors);
        this.appendQualityMetric('Connection colors', metrics.distinct_connection_colors);
        // this.appendQualityMetric('Shared node/connection colors', sharedColors);
        this.appendQualityMetric('Fonts', metrics.distinct_fonts);
        this.appendQualityMetric('Assets', metrics.distinct_assets);
        this.appendQualityMetric('Unlabeled Nodes', metrics.nodes_sans_text);
        this.appendQualityMetric('Unlabeled Connections', metrics.connections_sans_text);

        this.appendQualityMetric('Isolated Nodes', metrics.isolated_nodes);
        this.appendQualityMetric('Dangling Connections', metrics.dangling_connections);
        this.appendQualityMetric('Orphaned Connections', metrics.orphaned_connections);

        const fixSeparator = document.createElement('div');
        fixSeparator.className = 'diagram-status-quality-menu-separator';
        this.qualityMenu.appendChild(fixSeparator);

        const fixButton = document.createElement('button');
        fixButton.type = 'button';
        fixButton.className = 'diagram-status-fix-button';
        fixButton.setAttribute('title', 'Auto-fix: connect dangling connections, align near edges, equalize spacing');
        const fixIcon = IconRegistry.createElement('hint', 14);
        if (fixIcon) fixButton.appendChild(fixIcon as Node);
        fixButton.append(document.createTextNode('Auto Fix'));
        fixButton.addEventListener('click', () => {
            new AutoFixLayout(this.diagram).apply();
            this.updateQualityMetrics();
        });
        this.qualityMenu.appendChild(fixButton);
    }

    private appendQualityMetric(name: string, value: number): void {
        const row = document.createElement('div');
        row.className = 'diagram-status-quality-metric';

        const nameEl = document.createElement('span');
        nameEl.className = 'diagram-status-quality-metric-name';
        nameEl.textContent = name;

        const valueEl = document.createElement('span');
        valueEl.className = 'diagram-status-quality-metric-value';
        valueEl.textContent = String(value);

        row.append(nameEl, valueEl);
        this.qualityMenu.appendChild(row);
    }

    private bindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.addEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
        source?.addEventListener(DIAGRAM_TOOL_CHANGED_EVENT, this.onToolChanged);
    }

    private buildHintLead(): HTMLElement {
        const lead = document.createElement('span');
        lead.className = 'diagram-status-hint-lead';
        lead.setAttribute('aria-hidden', 'true');

        const icon = IconRegistry.createElement('info', 16);
        if (icon) {
            icon.classList.add('diagram-status-hint-icon');
            lead.appendChild(icon as Node);
        }
        return lead;
    }

    private unbindDiagramEvents(): void {
        const source = (this.diagram as any).host as HTMLElement | undefined;
        source?.removeEventListener(DIAGRAM_CHANGED_EVENT, this.onDiagramChanged);
        source?.removeEventListener(DIAGRAM_TOOL_CHANGED_EVENT, this.onToolChanged);
    }

    private resolveMinimapContainer(): HTMLElement | undefined {
        return (this.diagram as any).host as HTMLElement | undefined;
    }
}
