export function isNodeRuntime(): boolean {
    return typeof process !== 'undefined' && !!process.versions?.node;
}

export async function writeTextFile(path: string, content: string): Promise<string> {
    const fs = await import('node:fs/promises');
    await fs.writeFile(path, content, 'utf8');
    return path;
}

export async function writeBinaryFile(path: string, content: Uint8Array): Promise<string> {
    const fs = await import('node:fs/promises');
    await fs.writeFile(path, content);
    return path;
}
