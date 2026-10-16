import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createServer } from 'vite';
import sanitizeHtml from 'sanitize-html';
import { site } from '../site.config.js';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
try {
  const { getPages, markdown } = await server.ssrLoadModule('/src/render.jsx');
  const pages = getPages();
  for (const page of pages) {
    const html = await readFile(page.notFound ? 'dist/404.html' : `dist${page.path}index.html`, 'utf8');
    if (page.post) assert.ok(html.includes(markdown(page.post.body)), `${page.path}: missing post body`);
    assert.ok(html.includes('<main>'), `${page.path}: missing pre-rendered content`);
    assert.ok(html.includes('<title>'), `${page.path}: missing title`);
    assert.ok(html.includes('name="description"'), `${page.path}: missing description`);
    assert.ok(html.includes('property="og:title"'), `${page.path}: missing social metadata`);
    assert.ok(!html.includes('<!--page-'), `${page.path}: unresolved template`);
    if (page.notFound) assert.ok(html.includes('content="noindex"'));
    else assert.ok(html.includes(`rel="canonical" href="${new URL(page.path.slice(1), site.url).href}"`));
    // Parse real element attributes, rather than matching escaped HTML code examples.
    const urls = [];
    sanitizeHtml(html, {
      onOpenTag: (_name, attributes) => {
        for (const key of ['href', 'src']) {
          if (attributes[key] && !attributes[key].startsWith('#')) urls.push(attributes[key]);
        }
      },
    });
    for (const url of urls) {
      if (/^https?:/.test(url)) continue;
      assert.ok(url.startsWith(site.base), `${page.path}: unprefixed URL ${url}`);
      const path = url.slice(site.base.length);
      await access(`dist/${path}${path.endsWith('/') || !path ? 'index.html' : ''}`);
    }
  }
  assert.match(markdown('This is **Markdown**.'), /<strong>Markdown<\/strong>/);
  const safe = markdown('<script>alert(1)</script><img src="images/test.png" onerror="alert(1)"><a href="javascript:alert(1)">bad</a>');
  assert.ok(!/script|onerror|javascript:/.test(safe));
  assert.ok(safe.includes(`${site.base}images/test.png`));
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const page of pages.filter(page => !page.notFound)) assert.ok(sitemap.includes(new URL(page.path.slice(1), site.url).href));
  assert.ok(!sitemap.includes('404.html'));
  assert.ok((await readFile('dist/robots.txt', 'utf8')).includes(`${site.url}sitemap.xml`));
  console.log(`Verified ${pages.length} static pages, local links/assets, metadata, sitemap, and sanitization.`);
} finally { await server.close(); }
