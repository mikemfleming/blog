import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { site } from './site.config.js';

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), {
    name: 'markdown-pages',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const pathname = new URL(req.url, 'http://localhost').pathname;
          if (!pathname.startsWith(site.base)) return next();
          const route = `/${pathname.slice(site.base.length)}`;
          if (route.includes('.') && route !== '/404.html' && route !== '/index.html') return next();
          if (!req.headers.accept?.includes('text/html')) return next();
          const { getPages, renderPage } = await server.ssrLoadModule('/src/render.jsx');
          const pages = getPages();
          const normalized = route === '/index.html' ? '/' : `${route.replace(/\/$/, '')}/`;
          const page = pages.find(page => page.path === normalized) || pages.find(page => page.notFound);
          const template = await readFile(new URL('./index.html', import.meta.url), 'utf8');
          const html = await server.transformIndexHtml(req.url, renderPage(template, page));
          res.statusCode = page.notFound ? 404 : 200;
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        } catch (error) { next(error); }
      });
      server.watcher.on('change', path => {
        if (path.endsWith('.md')) server.ws.send({ type: 'full-reload' });
      });
    },
  }],
  base: site.base,
});
