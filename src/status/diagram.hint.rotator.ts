import { NodeRegistry } from "../factory";
import { isConnection } from "../guards";
import { DIAGRAM_HINT_POOL } from "./diagram.hint.pool";
import { DiagramHintMessageResolver } from "./diagram.hint.message.resolver";
import type { DiagramHintPoolFilter, DiagramHintPoolItem } from "./hint.types";

export class DiagramHintRotator {

    private hints: DiagramHintPoolItem[] = [];

    private seen_hints: Map<string, number>;

    private attention_timer?: ReturnType<typeof setTimeout>;

    private current_hint?: DiagramHintPoolItem;

    private readonly resolver: DiagramHintMessageResolver;

    constructor() {
        this.hints = [...DIAGRAM_HINT_POOL];
        this.seen_hints = new Map<string, number>();
        this.resolver = new DiagramHintMessageResolver();
    }

    public getNextHint(filter: DiagramHintPoolFilter): string | undefined {
        // Do not rotate to a new hint if the current hint is still active.
        if (this.current_hint) return this.resolver.resolve(this.current_hint);

        // If not known, set and return the new current hint.

        if (this.hints.length === 0) {
            return undefined;
        }

        let relevant = this.relevantHints(filter);
        if (relevant.length === 0) {
            relevant = this.relevantHints({});
        }
        this.clearOldHints();
        relevant = relevant.filter(hint => !this.seen_hints.has(hint.id));
        if (relevant.length === 0) {
            return undefined;
        }

        const idx = Math.floor(Math.random() * relevant.length);
        const id = relevant[idx]!.id;
        const hint = this.hints.find(h => h.id === id);
        if (hint) {
            this.markSeen(hint);

            this.startAttentionTimer();
            this.current_hint = hint;
            return this.resolver.resolve(hint);
        }
        return undefined;
    }

    private relevantHints(filter: DiagramHintPoolFilter): DiagramHintPoolItem[] {
        return this.hints.filter(hint => this.isRelevant(hint, filter));
    }

    private isRelevant(hint: DiagramHintPoolItem, filter: DiagramHintPoolFilter): boolean {
        if (filter.category && hint.category !== filter.category) {
            return false;
        }
        if (filter.tool && hint.tool !== filter.tool) {
            return false;
        }
        if (hint.minSelectionCount) {
            const include = filter.selection && filter.selection.length >= hint.minSelectionCount;
            if (!include) return false;
        }
        if (hint.requiresConnectionSelection) {
            const include = filter.selection && filter.selection.some(node => isConnection(node));
            if (!include) return false;
        }
        if (hint.requiresTextCapableSelection) {
            const include = filter.selection && filter.selection.some(node => NodeRegistry.adapter(node.type)?.has_text);
            if (!include) return false;
        }
        return true;
    }

    private startAttentionTimer(seconds: number = 10): void {
        if (this.attention_timer) {
            clearTimeout(this.attention_timer);
        }
        this.attention_timer = setTimeout(() => {
            this.attention_timer = undefined;
            this.current_hint = undefined;
        }, 1000 * seconds);
    }

    private markSeen(hint: DiagramHintPoolItem): void {
        this.seen_hints.set(hint.id, Date.now());
    }

    private clearOldHints(options: { seconds: number, keep: number } = { seconds: 2 * 60, keep: 5 }): void {

        const oldest = Array.from(this.seen_hints.entries())
            .filter(([_, timestamp]) => Date.now() - timestamp > options.seconds * 1000)
            .sort((a, b) => a[1] - b[1])
            .slice(0, -options.keep);

        for (const [id] of oldest) {
            this.seen_hints.delete(id);
        }
    }
}