import { canvasToBlob, supportsCanvasMimeType, unwrapCanvas } from "./browser.support";
import type { BrowserImageMimeType, ImageSerializer, ImageWriteOptions } from "./export.types";

/**
 * Serializes browser canvas content to raster image blobs.
 * Supports PNG/JPEG/WebP/AVIF and falls back to PNG if the requested format is unsupported.
 */
export class CanvasImageSerializer implements ImageSerializer {

    /**
     * Serializes the given canvas or canvas wrapper to a Blob.
     * @param source The source canvas or an object containing a canvas.
     * @param options Optional image write options, including MIME type and quality.
     * @returns A promise that resolves to a Blob representing the serialized image.
     */
    public async write(source: HTMLCanvasElement | { canvas: HTMLCanvasElement }, options: ImageWriteOptions = {}): Promise<Blob> {
        const canvas = unwrapCanvas(source);
        const requestedMime = options.mimeType ?? 'image/png';
        const mimeType = this.resolveMimeType(canvas, requestedMime);
        const quality = this.normalizeQuality(options.quality);
        return canvasToBlob(canvas, mimeType, quality);
    }

    private resolveMimeType(canvas: HTMLCanvasElement, mimeType: BrowserImageMimeType): BrowserImageMimeType {
        if (supportsCanvasMimeType(canvas, mimeType)) {
            return mimeType;
        }

        return 'image/png';
    }

    private normalizeQuality(quality?: number): number | undefined {
        if (quality === undefined) {
            return undefined;
        }

        return Math.max(0, Math.min(1, quality));
    }
}

/**
 * Convenience PNG-only serializer.
 */
export class PngSerializer extends CanvasImageSerializer {

    public override async write(source: HTMLCanvasElement | { canvas: HTMLCanvasElement }): Promise<Blob> {
        return super.write(source, { mimeType: 'image/png' });
    }
}
