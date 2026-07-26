import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    platform: 'browser',
    bundle: true,
    sourcemap: false,
    splitting: false,
    dts: true,
    clean: true,
    external: [
        'uuid',
        '@samatawy/checks',
        'web-worker',
        'file-type',
        'probe-image-size',
    ],
});
