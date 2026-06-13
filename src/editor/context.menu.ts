import { setClasses } from "./editor.utils";

export class ContextMenu {

    protected host: HTMLElement;

    protected menuElement: HTMLElement;

    protected menuItems: HTMLElement[] = [];

    constructor(host: HTMLElement) {
        this.host = host;
        this.menuElement = document.createElement('div');
        setClasses(this.menuElement, 'context-menu');
        this.host.appendChild(this.menuElement);
    }

    public get visible(): boolean {
        return this.menuElement.style.display !== 'none';
    }

    public set visible(value: boolean) {
        this.menuElement.style.display = value ? 'block' : 'none';
    }

    public addMenuItem(label: string, onClick: () => void): HTMLElement {
        const item = document.createElement('div');
        item.classList.add('context-menu-item');
        item.textContent = label;
        item.addEventListener('click', () => {
            onClick();
            this.close();
        });
        if (this.menuElement) {
            this.menuElement.appendChild(item);
        }
        return item;
    }

    public open(x: number, y: number, content: HTMLElement): void {
        this.close();
        const menu = document.createElement('div');
        menu.classList.add('context-menu');
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.appendChild(content);
        document.body.appendChild(menu);
        this.menuElement = menu;
    }

    public close(): void {
        if (this.menuElement) {
            this.menuElement.remove();
        }
    }
}