import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
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
        '@samatawy/diagrams-model',
        'uuid',
        '@samatawy/checks',
        'web-worker',
        'file-type',
        'probe-image-size',
    ],
    noExternal: [
        'elkjs',
    ],
});
