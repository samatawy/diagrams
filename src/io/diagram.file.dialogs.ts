import { isBrowserRuntime } from "./browser.support";
import type { DiagramExportFormat, DiagramExportOptions, DiagramExportResult, DiagramOpenOptions, DiagramOpenResult, DiagramSaveOptions, DiagramSaveResult } from "./export.types";

export type DiagramOpenHandler = (options?: DiagramOpenOptions) => Promise<DiagramOpenResult | undefined> | DiagramOpenResult | undefined;

export type DiagramSaveHandler = (options?: DiagramSaveOptions) => Promise<DiagramSaveResult | undefined> | DiagramSaveResult | undefined;

export type DiagramExportHandler = (options?: DiagramExportOptions) => Promise<DiagramExportResult | undefined> | DiagramExportResult | undefined;

export class DiagramFileDialogs {

    public onOpenDiagram?: DiagramOpenHandler;

    public onSaveDiagram?: DiagramSaveHandler;

    public onExportDiagram?: DiagramExportHandler;

    public async openDiagram(options?: DiagramOpenOptions): Promise<DiagramOpenResult | undefined> {
        if (options?.source) {
            return { source: options.source };
        }

        if (this.onOpenDiagram) {
            return await this.onOpenDiagram(options);
        }

        return await this.openDiagramDefault();
    }

    public async saveDiagram(options: DiagramSaveOptions = {}): Promise<DiagramSaveResult | undefined> {
        if (this.onSaveDiagram) {
            return await this.onSaveDiagram(options);
        }

        return await this.saveDiagramDefault(options);
    }

    public async exportDiagram(options: DiagramExportOptions = {}): Promise<DiagramExportResult | undefined> {
        if (this.onExportDiagram) {
            return await this.onExportDiagram(options);
        }

        return await this.exportDiagramDefault(options);
    }

    public async openDiagramDefault(): Promise<DiagramOpenResult | undefined> {
        return await this.openFromBrowserDialog();
    }

    public async saveDiagramDefault(options: DiagramSaveOptions = {}): Promise<DiagramSaveResult | undefined> {
        return await this.resolveSaveTarget({
            ...options,
            fileName: options.fileName ?? 'diagram.json',
            mimeType: options.mimeType ?? 'application/json',
        });
    }

    public async exportDiagramDefault(options: DiagramExportOptions = {}): Promise<DiagramExportResult | undefined> {
        const format = options.format ?? 'json';
        const mimeType = options.mimeType ?? 'application/json';
        return await this.resolveSaveTarget({
            ...options,
            format,
            mimeType,
            fileName: options.fileName ?? this.defaultExportFileName(format, mimeType),
        });
    }

    private async openFromBrowserDialog(): Promise<DiagramOpenResult | undefined> {
        if (!isBrowserRuntime()) {
            return undefined;
        }

        const picker = (window as any).showOpenFilePicker;
        if (typeof picker === 'function') {
            const [handle] = await picker({
                multiple: false,
                types: [{
                    description: 'Diagram JSON',
                    accept: { 'application/json': ['.json'] },
                }],
            });

            if (!handle) {
                return undefined;
            }

            const file = await handle.getFile();
            return {
                source: await file.text(),
                handle,
            };
        }

        return await new Promise<DiagramOpenResult | undefined>((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.style.display = 'none';

            const cleanup = () => {
                input.remove();
            };

            input.addEventListener('change', async () => {
                const file = input.files?.[0];
                if (!file) {
                    cleanup();
                    resolve(undefined);
                    return;
                }

                try {
                    resolve({ source: await file.text() });
                } finally {
                    cleanup();
                }
            }, { once: true });

            document.body.appendChild(input);
            input.click();
        });
    }

    private async resolveSaveTarget<T extends { fileName?: string; mimeType?: string }>(options: T): Promise<T & { handle?: FileSystemFileHandle }> {
        if (!isBrowserRuntime()) {
            return { ...options };
        }

        const picker = (window as any).showSaveFilePicker;
        if (typeof picker !== 'function') {
            return { ...options };
        }

        const fileName = options.fileName ?? 'diagram.json';
        const mimeType = options.mimeType ?? 'application/json';
        const handle = await picker({
            suggestedName: fileName,
            types: [{
                description: 'Diagram file',
                accept: { [mimeType]: [this.extensionFor(fileName)] },
            }],
        });

        if (!handle) {
            return { ...options };
        }

        return {
            ...options,
            fileName,
            mimeType,
            handle,
        };
    }

    private extensionFor(fileName: string): string {
        const match = /\.[^.]+$/.exec(fileName);
        return match?.[0] ?? '.json';
    }

    private defaultExportFileName(format?: DiagramExportFormat, mimeType?: string): string {
        if (format === 'blob' && mimeType?.startsWith('image/')) {
            const ext = mimeType.split('/')[1] || 'bin';
            return `diagram.${ext}`;
        }

        return 'diagram.json';
    }
}