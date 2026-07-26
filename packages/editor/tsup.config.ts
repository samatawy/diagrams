import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        // index = editview + editor (one bundle, no duplicate entry)
        index: 'src/index.ts',
        // Thin re-exports delegated to viewer package (tiny)
        core: 'src/core.ts',
        view: 'src/view.ts',
        layout: 'src/layout.ts',
        status: 'src/status.ts',
    },
    format: ['esm', 'cjs'],
    platform: 'browser',
    bundle: true,
    sourcemap: false,
    splitting: false,
    dts: true,
    clean: true,
    external: [
        '@samatawy/diagrams-viewer',
        '@samatawy/diagrams-model',
        'uuid',
        '@samatawy/checks',
        // elkjs must be a peer/host dependency — do not bundle it per-entry
        'elkjs',
        'web-worker',
        'file-type',
        'probe-image-size',
    ],
});
