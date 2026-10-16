import { build, createServer } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { site } from '../site.config.js';

await build();
const template = await readFile('dist/index.html', 'utf8');
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
try {
  const { getPages, renderPage, sitemap } = await server.ssrLoadModule('/src/render.jsx');
  const pages = getPages();
  for (const page of pages) {
    const filename = page.notFound ? 'dist/404.html' : `dist${page.path}index.html`;
    await mkdir(dirname(filename), { recursive: true });
    await writeFile(filename, renderPage(template, page));
  }
  await writeFile('dist/sitemap.xml', sitemap(pages));
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}sitemap.xml\n`);
  await writeFile('dist/.nojekyll', '');
  console.log(`Generated ${pages.length} HTML pages for ${site.url}`);
} finally {
  await server.close();
}
