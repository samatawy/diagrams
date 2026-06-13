import type { Diagram } from "../model/diagram";
import type { ISerializedDiagram, ISerializer } from "./serialized.types";

export type DiagramExportFormat = 'json' | 'bytes' | 'blob';

export interface DiagramSaveOptions {
    path?: string;
    fileName?: string;
    serializer?: ISerializer;
    pretty?: boolean;
    mimeType?: string;
}

export type BrowserImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

export type BrowserImageSource = HTMLCanvasElement | { canvas: HTMLCanvasElement };

export interface ImageWriteOptions {
    mimeType?: BrowserImageMimeType;
    quality?: number;
    padding?: number;
}

export interface ImageSaveOptions extends ImageWriteOptions {
    path?: string;
    fileName?: string;
}

export interface ImageSerializer {
    write(source: BrowserImageSource, options?: ImageWriteOptions): Promise<Blob>;
}

export type DiagramOpenSource = string | ISerializedDiagram | Diagram;

export interface DiagramOpenOptions {
    source?: DiagramOpenSource;
}

export interface DiagramOpenResult {
    source: DiagramOpenSource;
    handle?: FileSystemFileHandle;
}

export interface DiagramSaveResult extends DiagramSaveOptions {
    handle?: FileSystemFileHandle;
}

export interface DiagramExportOptions {
    format?: DiagramExportFormat;
    pretty?: boolean;
    serializer?: ISerializer;
    fileName?: string;
    mimeType?: string;
}

export interface DiagramExportResult extends DiagramExportOptions {
    handle?: FileSystemFileHandle;
}
