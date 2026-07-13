import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const ICON_DIR = path.join(__dirname, '../node_modules/lucide-static/icons');
// const OUTPUT_FILE = path.join(__dirname, '../src/icons_generated/lucide-static.ts');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Parse command-line arguments ──
const args = process.argv.slice(2);
const ICON_DIR_ARG = args[0];
const OUTPUT_NAME = args[1] || 'icon-registry'; // Optional: custom output filename

if (!ICON_DIR_ARG) {
    console.error('❌ Usage: node generate-icons.mjs <icon-directory> [output-name]');
    console.error('Example: node generate-icons.mjs ../node_modules/lucide-static/icons lucide');
    process.exit(1);
}

const ICON_DIR = path.isAbsolute(ICON_DIR_ARG)
    ? ICON_DIR_ARG
    : path.join(__dirname, ICON_DIR_ARG);

const OUTPUT_FILE = path.join(__dirname, `../src/${OUTPUT_NAME}`);


// Parse viewBox safely
function getViewBox(svg) {
    const match = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    return match ? { w: parseFloat(match[1]), h: parseFloat(match[2]) } : { w: 24, h: 24 };
}

// Sanitize for template literal output
function cleanSvg(svg) {
    return svg
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/`/g, '\\`')
        .trim();
}

// Convert to Data URI for direct asset-store compatibility
// function toDataUri(svg) {
//     const base64 = Buffer.from(svg, 'utf-8').toString('base64');
//     return `data:image/svg+xml;base64,${base64}`;
// }

// function svgToDataUri(svgString) {
//     // encodeURIComponent handles special chars safely
//     const encoded = encodeURIComponent(svgString);
//     return `data:image/svg+xml;charset=utf-8,${encoded}`;
//     // OR use base64 if you prefer:
//     // return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
// }

async function run() {
    console.log('📦 Scanning icon pack...');
    const files = await fs.readdir(ICON_DIR);
    const svgFiles = files.filter(f => f.endsWith('.svg'));

    const registry = {};

    for (const file of svgFiles) {
        const name = path.basename(file, '.svg');
        const rawSvg = await fs.readFile(path.join(ICON_DIR, file), 'utf-8');
        const { w, h } = getViewBox(rawSvg);

        registry[name] = {
            name,
            svg: cleanSvg(rawSvg), // 👈 Ready for your asset store
            // svg: toDataUri(cleanSvg(rawSvg)), // 👈 Ready for your asset store
            defaultWidth: w,
            defaultHeight: h
        };
    }

    // Generate clean ES module output
    const entries = Object.entries(registry).map(([key, val]) =>
        `  "${key}": ${JSON.stringify(val)}`
    ).join(',\n');

    const output = `// ⚠️ AUTO-GENERATED: DO NOT EDIT
// Run: node scripts/import-icons.mjs

export const ICON_REGISTRY = {
${entries}
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);
export const ICON_COUNT = ICON_NAMES.length;
`;

    await fs.writeFile(OUTPUT_FILE, output, 'utf-8');
    console.log(`✅ Generated ${Object.keys(registry).length} icons → ${OUTPUT_FILE}`);
}

run().catch(err => {
    console.error('❌ Generation failed:', err);
    process.exit(1);
});