export function isBrowserRuntime(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function createCanvas2D(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
    if (!isBrowserRuntime()) {
        throw new Error('Canvas creation is available only in browser-like runtimes');
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width));
    canvas.height = Math.max(1, Math.ceil(height));

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Unable to create 2d context for export canvas');
    }

    return { canvas, context };
}

export function unwrapCanvas(source: HTMLCanvasElement | { canvas: HTMLCanvasElement }): HTMLCanvasElement {
    if (source instanceof HTMLCanvasElement) {
        return source;
    }

    return source.canvas;
}

export function supportsCanvasMimeType(canvas: HTMLCanvasElement, mimeType: string): boolean {
    const dataUrl = canvas.toDataURL(mimeType);
    return dataUrl.startsWith(`data:${mimeType}`);
}

export function supportedCanvasMimeTypes(canvas: HTMLCanvasElement): string[] {
    const mimeTypes: string[] = [];
    const candidates: string[] = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

    for (const mimeType of candidates) {
        if (supportsCanvasMimeType(canvas, mimeType)) {
            mimeTypes.push(mimeType);
        }
    }

    return mimeTypes;
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [meta, payload] = dataUrl.split(',');
    if (!meta || !payload) {
        throw new Error('Invalid data URL generated from canvas');
    }

    const mimeMatch = /data:(.*?);base64/.exec(meta);
    const mimeType = mimeMatch?.[1] || 'application/octet-stream';
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mimeType });
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, mimeType: string, quality?: number): string {
    return canvas.toDataURL(mimeType, quality);
}

export async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
    if (typeof canvas.toBlob === 'function') {
        const blob = await new Promise<Blob | null>(resolve => {
            canvas.toBlob(resolve, mimeType, quality);
        });

        if (blob) {
            return blob;
        }
    }

    return dataUrlToBlob(canvas.toDataURL(mimeType, quality));
}

export function exportTextBlob(content: string, mimeType: string = 'application/json'): Blob {
    if (typeof Blob === 'undefined') {
        throw new Error('Blob API is not available in this runtime');
    }

    return new Blob([content], { type: mimeType });
}

export function downloadTextFile(content: string, fileName: string, mimeType: string = 'application/json'): string {
    if (!isBrowserRuntime() || typeof URL === 'undefined') {
        throw new Error('Browser download APIs are not available in this runtime');
    }

    const blob = exportTextBlob(content, mimeType);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    return fileName;
}

export function downloadBlob(blob: Blob, fileName: string): string {
    if (!isBrowserRuntime() || typeof URL === 'undefined') {
        throw new Error('Browser download APIs are not available in this runtime');
    }

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    return fileName;
}
