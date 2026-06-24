import { ACTION_MAP } from "../editor/diagram.actions";
import type { DiagramHintAccessSurface, DiagramHintPoolItem } from "./hint.types";

const ACCESS_LABELS: Record<DiagramHintAccessSurface, string> = {
    shortcut: "shortcut",
    toolbar: "toolbar",
    inspector: "inspector",
    palette: "tool palette",
    canvas: "canvas",
};

export class DiagramHintMessageResolver {

    private readonly isMac: boolean;

    constructor() {
        this.isMac = this.detectMacPlatform();
    }

    public resolve(item: DiagramHintPoolItem): string | undefined {
        if (item.message?.trim()) {
            return item.message.trim();
        }

        const action = item.actionId ? ACTION_MAP.get(item.actionId) : undefined;
        const label = action?.label?.trim();
        const shortcut = this.formatShortcut(item.shortcut);
        const access = this.formatAccess(item.access, !!shortcut);

        // For non-action hints, prefer explicit fallback phrasing over a raw shortcut string.
        if (!label && item.fallbackMessage?.trim()) {
            return item.fallbackMessage.trim();
        }

        if (label) {
            const parts: string[] = [`Use ${label}`];
            if (access) {
                parts.push(`from the ${access}`);
            }
            if (shortcut) {
                parts.push(`(${shortcut})`);
            }
            return `${parts.join(" ")}.`;
        }

        if (shortcut) {
            return `Use ${shortcut}.`;
        }

        if (item.fallbackMessage?.trim()) {
            return item.fallbackMessage.trim();
        }

        if (action?.tooltip?.trim()) {
            return action.tooltip.trim();
        }

        return undefined;
    }

    private formatAccess(access?: DiagramHintAccessSurface[], hasShortcut: boolean = false): string | undefined {
        if (!access || access.length === 0) {
            return undefined;
        }

        const labels = access
            .filter((one) => !(hasShortcut && one === "shortcut"))
            .map((one) => ACCESS_LABELS[one])
            .filter((one) => !!one);

        if (!labels.length) {
            return undefined;
        }

        if (labels.length === 1) {
            return labels[0];
        }

        if (labels.length === 2) {
            return `${labels[0]} or ${labels[1]}`;
        }

        const head = labels.slice(0, -1).join(", ");
        const tail = labels[labels.length - 1];
        return `${head}, or ${tail}`;
    }

    private formatShortcut(shortcut?: string | string[]): string | undefined {
        if (!shortcut) {
            return undefined;
        }

        const options = Array.isArray(shortcut) ? shortcut : [shortcut];
        const preferred = options.filter((one) => this.isMac ? one.includes("Cmd") : one.includes("Ctrl"));
        const candidate = (preferred[0] || options[0] || "").trim();
        if (!candidate) {
            return undefined;
        }

        return this.normalizeShortcut(candidate);
    }

    private normalizeShortcut(shortcut: string): string {
        let normalized = shortcut;

        if (this.isMac) {
            normalized = normalized
                .replace(/Ctrl/g, "Cmd")
                .replace(/Alt/g, "Option");
        } else {
            normalized = normalized
                .replace(/Cmd/g, "Ctrl")
                .replace(/Option/g, "Alt");
        }

        return normalized;
    }

    private detectMacPlatform(): boolean {
        if (typeof navigator === "undefined") {
            return false;
        }

        return /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform || navigator.userAgent);
    }
}
