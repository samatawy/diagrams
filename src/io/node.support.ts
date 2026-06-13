/**
 * Detects whether the current runtime is Node.js.
 * @returns True when Node.js APIs are available.
 */
export function isNodeRuntime(): boolean {
    return typeof process !== 'undefined' && !!process.versions?.node;
}

/**
 * Writes UTF-8 text content to a file path.
 * @param path Destination path.
 * @param content Text content.
 * @returns The written path.
 */
export async function writeTextFile(path: string, content: string): Promise<string> {
    const fs = await import('node:fs/promises');
    await fs.writeFile(path, content, 'utf8');
    return path;
}

/**
 * Writes binary content to a file path.
 * @param path Destination path.
 * @param content Binary payload.
 * @returns The written path.
 */
export async function writeBinaryFile(path: string, content: Uint8Array): Promise<string> {
    const fs = await import('node:fs/promises');
    await fs.writeFile(path, content);
    return path;
}
