// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs', 'iife'],
    platform: 'browser',
    bundle: true,
    sourcemap: true,
    splitting: false,
    dts: true,
    external: [
        'file-type',
        'probe-image-size'
    ],
    noExternal: [
        '@samatawy/checks'
    ]
});