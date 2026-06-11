import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');
const demoDir = path.join(root, 'demo');
const distDir = path.join(root, 'dist');
const siteDir = path.join(root, 'site');
const siteAssetsDir = path.join(siteDir, 'assets');

const siteStyles = `
#tsd-toolbar-links {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.diagrams-demo-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.55rem 0.95rem;
    border-radius: 999px;
    background: #111827;
    color: #ffffff !important;
    text-decoration: none;
    font: 600 0.875rem/1.1 system-ui, sans-serif;
    letter-spacing: 0.01em;
    transition: transform 120ms ease, background-color 120ms ease;
}

.diagrams-demo-link:hover,
.diagrams-demo-link:focus-visible {
    background: #0f766e;
    transform: translateY(-1px);
}

.diagrams-demo-link:focus-visible {
    outline: 2px solid #99f6e4;
    outline-offset: 2px;
}

.diagrams-demo-panel {
    margin: 0 0 1.5rem;
    padding: 1.25rem 1.5rem;
    border: 1px solid #d1d5db;
    border-radius: 18px;
    background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
}

.diagrams-demo-eyebrow {
    margin: 0 0 0.5rem;
    color: #4338ca;
    font: 600 0.75rem/1.2 system-ui, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.diagrams-demo-panel h2 {
    margin: 0 0 0.5rem;
    color: #111827;
    font: 700 1.5rem/1.2 system-ui, sans-serif;
}

.diagrams-demo-panel p:last-of-type {
    max-width: 52rem;
    color: #374151;
}

.diagrams-demo-panel .diagrams-demo-link {
    margin-top: 0.25rem;
}

.site-menu .diagrams-demo-nav-item {
    margin: 0.55rem 0 0.85rem;
}

.site-menu .diagrams-demo-nav-item a {
    display: inline-flex;
    align-items: center;
    color: var(--color-text);
    font-weight: 600;
    text-decoration: none;
}

.site-menu .diagrams-demo-nav-item a:hover,
.site-menu .diagrams-demo-nav-item a:focus-visible {
    color: #0f766e;
}

@media (max-width: 768px) {
    #tsd-toolbar-links {
        gap: 0.5rem;
    }

    .diagrams-demo-link {
        padding: 0.45rem 0.8rem;
        font-size: 0.8125rem;
    }

    .diagrams-demo-panel {
        padding: 1rem;
        border-radius: 14px;
    }
}
`;

function toPosix(value) {
    return value.split(path.sep).join('/');
}

function injectHomepagePromo(html, demoHref) {
    const promo = [
        '<section class="diagrams-demo-panel" data-diagrams-demo-panel>',
        '<p class="diagrams-demo-eyebrow">Live demos</p>',
        '<h2>Explore the browser feature set</h2>',
        '<p>Preview rendering, editing, connectors, selection, and viewport behavior in a live browser playground.</p>',
        `<a class="diagrams-demo-link" href="${demoHref}">Open Demo</a>`,
        '</section>',
    ].join('');

    let patched = html;

    patched = patched.replace(
        /<div class="col-content"><div class="tsd-page-title">[\s\S]*?<\/div><div class="tsd-panel tsd-typography"><h1 id="samatawydiagrams" class="tsd-anchor-link">[\s\S]*?<\/h1>/i,
        '<div class="col-content"><div class="tsd-page-title"><h1>@samatawy/diagrams</h1></div>' +
        promo +
        '<div class="tsd-panel tsd-typography">',
    );

    return patched;
}

function injectSiteStylesheet(html, stylesheetHref) {
    if (html.includes('data-diagrams-site-style')) {
        return html;
    }

    return html.replace(
        /<\/head>/i,
        `<link rel="stylesheet" href="${stylesheetHref}" data-diagrams-site-style/></head>`,
    );
}

function injectToolbarLink(html, demoHref) {
    if (html.includes('data-diagrams-demo-link')) {
        return html;
    }

    return html.replace(
        /<div id="tsd-toolbar-links"><\/div>/i,
        `<div id="tsd-toolbar-links"><a class="diagrams-demo-link" data-diagrams-demo-link href="${demoHref}">Demo</a></div>`,
    );
}

function injectSidebarLink(html, demoHref) {
    if (html.includes('data-diagrams-demo-nav-item')) {
        return html;
    }

    return html.replace(
        /(<div class="site-menu"><nav class="tsd-navigation"><a [^>]*>@samatawy\/diagrams<\/a>)/i,
        `$1<div class="diagrams-demo-nav-item"><a data-diagrams-demo-nav-item href="${demoHref}">Demo gallery</a></div>`,
    );
}

async function collectHtmlFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await collectHtmlFiles(fullPath));
            continue;
        }
        if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

async function writeSiteStyles() {
    await mkdir(siteAssetsDir, { recursive: true });
    await writeFile(path.join(siteAssetsDir, 'diagrams-site.css'), siteStyles, 'utf8');
}

async function patchDocsHtml() {
    const htmlFiles = await collectHtmlFiles(siteDir);

    for (const filePath of htmlFiles) {
        if (filePath.includes(`${path.sep}demo${path.sep}`)) {
            continue;
        }

        let html = await readFile(filePath, 'utf8');
        const isHomepage = path.resolve(filePath) === path.join(siteDir, 'index.html');
        const relToSite = path.relative(path.dirname(filePath), siteDir) || '.';
        const demoHref = toPosix(path.join(relToSite, 'demo', 'index.html'));
        const assetsHref = toPosix(path.join(relToSite, 'assets', 'diagrams-site.css'));

        html = injectSiteStylesheet(html, assetsHref);
        html = injectToolbarLink(html, demoHref);
        html = injectSidebarLink(html, demoHref);

        if (isHomepage) {
            html = injectHomepagePromo(html, demoHref);
        }

        await writeFile(filePath, html, 'utf8');
    }
}

async function main() {
    await rm(siteDir, { recursive: true, force: true });
    await mkdir(siteDir, { recursive: true });

    await cp(docsDir, siteDir, { recursive: true });
    await cp(demoDir, path.join(siteDir, 'demo'), { recursive: true });
    await cp(distDir, path.join(siteDir, 'dist'), { recursive: true });
    await writeFile(path.join(siteDir, '.nojekyll'), '\n', 'utf8');

    await writeSiteStyles();
    await patchDocsHtml();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
