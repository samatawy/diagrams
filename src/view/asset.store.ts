export class AssetStore {

    private assetsById = new Map<string, string>();

    private assetIdBySource = new Map<string, string>();

    public register(source: string, preferredId?: string): string {
        const normalizedSource = source.trim();
        if (!normalizedSource) {
            return '';
        }

        const existingId = this.assetIdBySource.get(normalizedSource);
        if (existingId) {
            return existingId;
        }

        const candidateId = preferredId?.trim();
        const generatedId = this.looksLikeRemoteUrl(normalizedSource)
            ? normalizedSource
            : this.createHashedAssetId(normalizedSource);
        const assetId = candidateId && !this.assetsById.has(candidateId)
            ? candidateId
            : generatedId;

        this.assetsById.set(assetId, normalizedSource);
        this.assetIdBySource.set(normalizedSource, assetId);
        return assetId;
    }

    public resolve(imageId?: string): string | undefined {
        if (!imageId) {
            return undefined;
        }

        return this.assetsById.get(imageId);
    }

    public load(assets?: Record<string, string>): void {
        this.clear();

        if (!assets) {
            return;
        }

        for (const [id, source] of Object.entries(assets)) {
            const key = id.trim();
            const value = source?.trim();
            if (!key || !value) {
                continue;
            }

            this.assetsById.set(key, value);
            this.assetIdBySource.set(value, key);
        }
    }

    public snapshot(): Record<string, string> | undefined {
        if (!this.assetsById.size) {
            return undefined;
        }

        return Object.fromEntries(this.assetsById.entries());
    }

    public clear(): void {
        this.assetsById.clear();
        this.assetIdBySource.clear();
    }

    public destroy(): void {
        this.clear();
    }

    private createHashedAssetId(source: string): string {
        const base = `asset_${this.hashString(source)}`;

        if (!this.assetsById.has(base)) {
            return base;
        }

        const existing = this.assetsById.get(base);
        if (existing === source) {
            return base;
        }

        let suffix = 1;
        while (this.assetsById.has(`${base}_${suffix}`)) {
            if (this.assetsById.get(`${base}_${suffix}`) === source) {
                return `${base}_${suffix}`;
            }
            suffix++;
        }

        return `${base}_${suffix}`;
    }

    private hashString(value: string): string {
        let hash = 0x811c9dc5;
        for (let i = 0; i < value.length; i++) {
            hash ^= value.charCodeAt(i)!;
            hash = Math.imul(hash, 0x01000193);
        }

        return (hash >>> 0).toString(16).padStart(8, '0');
    }

    private looksLikeRemoteUrl(value: string): boolean {
        return /^https?:\/\//i.test(value);
    }
}
