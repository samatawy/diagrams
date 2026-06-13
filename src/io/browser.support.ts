/**
 * Detects whether browser globals are available.
 * @returns True when running in a browser-like runtime.
 */
export function isBrowserRuntime(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Creates an offscreen 2D canvas with safe minimum dimensions.
 * @param width Requested width.
 * @param height Requested height.
 * @returns A canvas/context pair.
 */
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

/**
 * Resolves a canvas from either a raw canvas or an object containing one.
 * @param source Canvas source value.
 * @returns The underlying HTMLCanvasElement.
 */
export function unwrapCanvas(source: HTMLCanvasElement | { canvas: HTMLCanvasElement }): HTMLCanvasElement {
    if (source instanceof HTMLCanvasElement) {
        return source;
    }

    return source.canvas;
}

/**
 * Checks whether a canvas encoder supports a given MIME type.
 * @param canvas Source canvas.
 * @param mimeType MIME type to test.
 * @returns True when the MIME type is supported.
 */
export function supportsCanvasMimeType(canvas: HTMLCanvasElement, mimeType: string): boolean {
    const dataUrl = canvas.toDataURL(mimeType);
    return dataUrl.startsWith(`data:${mimeType}`);
}

/**
 * Lists supported export MIME types for a canvas.
 * @param canvas Source canvas.
 * @returns Supported MIME types.
 */
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

/**
 * Converts a base64 data URL into a Blob.
 * @param dataUrl Data URL string.
 * @returns Blob decoded from the data URL.
 */
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

/**
 * Exports a canvas to a data URL.
 * @param canvas Source canvas.
 * @param mimeType Target MIME type.
 * @param quality Optional quality for lossy formats.
 * @returns Encoded data URL.
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement, mimeType: string, quality?: number): string {
    return canvas.toDataURL(mimeType, quality);
}

/**
 * Exports a canvas to a Blob.
 * @param canvas Source canvas.
 * @param mimeType Target MIME type.
 * @param quality Optional quality for lossy formats.
 * @returns A Blob containing the encoded image.
 */
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

/**
 * Creates a text blob for export/download operations.
 * @param content Text content.
 * @param mimeType Blob MIME type.
 * @returns The generated Blob.
 */
export function exportTextBlob(content: string, mimeType: string = 'application/json'): Blob {
    if (typeof Blob === 'undefined') {
        throw new Error('Blob API is not available in this runtime');
    }

    return new Blob([content], { type: mimeType });
}

/**
 * Downloads text content as a file in browser runtimes.
 * @param content File content.
 * @param fileName Download file name.
 * @param mimeType File MIME type.
 * @returns The file name used for download.
 */
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

/**
 * Downloads an existing blob as a file in browser runtimes.
 * @param blob Blob to download.
 * @param fileName Download file name.
 * @returns The file name used for download.
 */
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
