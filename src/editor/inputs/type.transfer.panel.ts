import { NodeRegistry } from '../../factory/node.registry';
import { IconRegistry } from '../../factory/icon.registry';
import { humanize } from '../../value.utils';
import { injectStyles, setClasses, toggleClasses } from '../editor.utils';

const STYLE_ID = 'type-transfer-panel-defaults';

const DEFAULT_STYLES = `
.type-transfer-panel {
    display: block;
}
.type-transfer-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: none;
    border-radius: 6px;
    margin: 1px 4px;
    padding: 6px 10px 6px 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
}
.type-transfer-toggle:hover {
    background: var(--diagram-ui-hover-bg, rgba(15, 118, 110, 0.1));
}
.type-transfer-icon {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.type-transfer-label {
    flex: 1 1 auto;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.type-transfer-caret {
    display: block;
    align-self: center;
    box-sizing: border-box;
    flex: 0 0 6px;
    width: 6px;
    height: 6px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    margin-inline-end: 0;
    margin-inline-start: 8px;
    opacity: .7;
    transform: rotate(-45deg);
    transform-origin: 50% 50%;
    transition: transform 0.26s cubic-bezier(0.2, 0.75, 0.25, 1);
}
.type-transfer-panel.is-open .type-transfer-caret {
    transform: rotate(45deg);
}
.type-transfer-body {
    display: none;
    padding: 4px 9px 6px 9px;
}
.type-transfer-panel.is-open .type-transfer-body {
    display: block;
}
.type-transfer-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.type-transfer-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 7px;
    border: 1px solid var(--diagram-ui-border, rgba(15, 23, 42, 0.15));
    background: var(--diagram-ui-surface-elevated, #fff);
    cursor: pointer;
}
`;

function ensureStyles(): void {
    injectStyles(STYLE_ID, DEFAULT_STYLES);
}

export interface TypeTransferPanelConfig {
    className?: string;
    currentType?: string;
    transferables?: string[];
    onSelect: (type: string) => void;
}

/**
 * Expandable icon-button panel for changing node type using NodeRegistry transferables.
 */
export class TypeTransferPanel {

    protected readonly host: HTMLElement;
    protected readonly root: HTMLDivElement;
    protected readonly toggle: HTMLButtonElement;
    protected readonly iconSlot: HTMLSpanElement;
    protected readonly labelEl: HTMLSpanElement;
    protected readonly body: HTMLDivElement;
    protected readonly grid: HTMLDivElement;

    protected currentType = '';
    protected transferables: string[] = [];

    constructor(host: HTMLElement, config: TypeTransferPanelConfig) {
        ensureStyles();

        this.host = host;

        this.root = document.createElement('div');
        setClasses(this.root, 'type-transfer-panel', config.className || '');

        this.toggle = document.createElement('button');
        this.toggle.type = 'button';
        setClasses(this.toggle, 'type-transfer-toggle');

        this.iconSlot = document.createElement('span');
        setClasses(this.iconSlot, 'type-transfer-icon');

        this.labelEl = document.createElement('span');
        setClasses(this.labelEl, 'type-transfer-label');

        const caret = document.createElement('span');
        setClasses(caret, 'type-transfer-caret');

        this.toggle.appendChild(this.iconSlot);
        this.toggle.appendChild(this.labelEl);
        this.toggle.appendChild(caret);

        this.body = document.createElement('div');
        setClasses(this.body, 'type-transfer-body');

        this.grid = document.createElement('div');
        setClasses(this.grid, 'type-transfer-grid');
        this.body.appendChild(this.grid);

        this.root.appendChild(this.toggle);
        this.root.appendChild(this.body);
        this.host.appendChild(this.root);

        this.toggle.addEventListener('click', (event) => {
            event.preventDefault();
            toggleClasses(this.root, !this.root.classList.contains('is-open'), 'is-open');
        });

        this.setState(config.currentType, config.transferables || []);

        this.grid.addEventListener('click', (event) => {
            const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-type]');
            if (!button) return;

            event.preventDefault();
            event.stopPropagation();

            const type = button.dataset['type'];
            if (!type) return;

            config.onSelect(type);
        });
    }

    public setState(currentType: string | undefined, transferables: string[]): void {
        this.currentType = currentType || '';
        this.transferables = [...transferables];

        this.iconSlot.innerHTML = '';
        if (this.currentType) {
            const icon = IconRegistry.createElement(this.currentType);
            if (icon) {
                this.iconSlot.appendChild(icon);
            }
            this.labelEl.textContent = humanize(this.currentType);
        } else {
            this.labelEl.textContent = 'Change Type';
        }

        this.renderButtons();
    }

    public destroy(): void {
        this.host.removeChild(this.root);
    }

    private renderButtons(): void {
        this.grid.innerHTML = '';

        const candidates = this.transferables
            .filter((type) => type !== this.currentType)
            .filter((type) => !!NodeRegistry.adapter(type));

        for (const type of candidates) {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset['type'] = type;
            button.title = humanize(type);
            button.setAttribute('aria-label', `Change type to ${humanize(type)}`);
            setClasses(button, 'type-transfer-button');

            const icon = IconRegistry.createElement(type);
            if (icon) {
                button.appendChild(icon);
            } else {
                button.textContent = humanize(type).charAt(0);
            }

            this.grid.appendChild(button);
        }
    }
}
