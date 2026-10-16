import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { collectPosts } from './posts.js';
import { collectProjects } from './projects.js';
import { site, sitePath } from '../site.config.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function markdown(source) {
  return sanitizeHtml(marked.parse(source), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title', 'width', 'height', 'loading'] },
    transformTags: {
      img: (tagName, attrs) => ({ tagName, attribs: { ...attrs, src: attrs.src?.startsWith('images/') ? sitePath(attrs.src) : attrs.src, loading: 'lazy' } }),
      a: (tagName, attrs) => {
        let href = attrs.href;
        if (href?.startsWith('#/')) href = sitePath(`${href.slice(2).replace(/\/$/, '')}/`);
        else if (href?.startsWith('/') && !href.startsWith('//')) href = sitePath(href);
        return { tagName, attribs: { ...attrs, href } };
      },
    },
  });
}

function excerpt(body) {
  return sanitizeHtml(marked.parse(body), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ').trim().slice(0, 160);
}

export function getPages() {
  const directory = new URL('../content/posts/', import.meta.url);
  const files = Object.fromEntries(readdirSync(directory).filter(name => name.endsWith('.md'))
    .map(name => [name, readFileSync(new URL(name, directory), 'utf8')]));
  const posts = collectPosts(files);
  const projectDirectory = new URL('../content/projects/', import.meta.url);
  const projects = collectProjects(Object.fromEntries(readdirSync(projectDirectory)
    .filter(name => name.endsWith('.md'))
    .map(name => [name, readFileSync(new URL(name, projectDirectory), 'utf8')])));
  const pages = [
    { path: '/', title: 'Home', description: site.description, post: posts[0], empty: !posts.length },
    { path: '/blog/', title: 'Blog', description: `Posts by ${site.name}.`, posts },
    { path: '/projects/', title: 'Projects', description: `Projects by ${site.name}.`, projects },
    ...['about'].map(name => {
      const body = readFileSync(new URL(`../content/${name}.md`, import.meta.url), 'utf8');
      return { path: `/${name}/`, title: name === 'about' ? 'About' : 'Projects', description: excerpt(body), body };
    }),
    ...posts.map(post => ({ path: `/blog/${post.slug}/`, title: post.title, description: post.description || excerpt(post.body), post })),
    { path: '/404.html', title: 'Page not found', description: 'The requested page could not be found.', notFound: true },
  ];
  return pages;
}

function Markdown({ body }) {
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: markdown(body) }} />;
}

function Post({ post }) {
  return <article className="card">
    <h1>{post.title}</h1>
    <time dateTime={post.date}>{new Date(`${post.date}T00:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}</time>
    <Markdown body={post.body} />
    {post.tags.length > 0 && <p className="tags">{post.tags.map(tag => `#${tag}`).join(' ')}</p>}
  </article>;
}

function Projects({ projects }) {
  return <section aria-labelledby="projects-heading">
    <h1 id="projects-heading" className="sr-only">Projects</h1>
    <ul className="posts">
      {projects.map(project => <li key={project.slug}>
        <article className="card post-card">
          <h2><a href={project.url}>{project.title}</a></h2>
          <Markdown body={project.body} />
        </article>
      </li>)}
    </ul>
    {!projects.length && <p className="card">More projects coming soon.</p>}
  </section>;
}

function Page({ page }) {
  let content;
  if (page.post) content = <Post post={page.post} />;
  else if (page.posts) content = <section aria-labelledby="blog-heading">
    <h1 id="blog-heading" className="sr-only">Blog</h1>
    <ul className="posts">
      {page.posts.map(post => <li key={post.slug}>
        <article className="card post-card">
          <h2><a href={sitePath(`blog/${post.slug}/`)}>{post.title}</a></h2>
          <time dateTime={post.date}>{new Date(`${post.date}T00:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}</time>
          <p>{post.description || excerpt(post.body)}</p>
          <a href={sitePath(`blog/${post.slug}/`)} aria-label={`Read ${post.title}`}>Read post →</a>
        </article>
      </li>)}
    </ul>
    {!page.posts.length && <p className="card">No posts yet.</p>}
  </section>;
  else if (page.projects) content = <Projects projects={page.projects} />;
  else if (page.body !== undefined) content = <article className="card"><Markdown body={page.body} /></article>;
  else content = <section className="card"><h1>{page.notFound ? 'Page not found' : 'No posts yet'}</h1>{page.notFound && <a href={site.base}>Back home</a>}</section>;
  return <><canvas aria-hidden="true" /><div className="layout"><header className="card">
    <a className="logo" href={site.base} aria-label="Mike M Fleming home"><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="logo__circle" cx="50" cy="50" r="40" stroke="black" strokeWidth="2" fill="none" /><text x="50" y="50" textAnchor="middle" dy=".3em" fill="black" fontSize="24">M F</text></svg></a>
    <nav aria-label="Main navigation">{[['/blog/', 'Blog'], ['/about/', 'About'], ['/projects/', 'Projects']].map(([path, label]) => <a key={path} href={sitePath(path)} aria-current={page.path === path ? 'page' : undefined}>{label}</a>)}</nav>
  </header><main>{content}</main></div></>;
}

export function renderPage(template, page) {
  const title = `${page.title} | ${site.name}`;
  const canonical = new URL(page.path.slice(1), site.url).href;
  const metadata = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(page.description)}">`,
    `<meta name="site-base" content="${escape(site.base)}">`,
    `<meta property="og:title" content="${escape(title)}">`,
    `<meta property="og:description" content="${escape(page.description)}">`,
    `<meta property="og:type" content="${page.post && page.path !== '/' ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="${escape(site.name)}">`,
    '<meta name="twitter:card" content="summary">',
    `<meta name="twitter:title" content="${escape(title)}">`,
    `<meta name="twitter:description" content="${escape(page.description)}">`,
    ...(page.notFound ? ['<meta name="robots" content="noindex">'] : [
      `<link rel="canonical" href="${escape(canonical)}">`,
      `<meta property="og:url" content="${escape(canonical)}">`,
    ]),
  ].join('\n');
  return template.replace('<!--page-head-->', () => metadata)
    .replace('<!--page-content-->', () => renderToStaticMarkup(<Page page={page} />));
}

export function sitemap(pages) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.filter(page => !page.notFound).map(page => `<url><loc>${escape(new URL(page.path.slice(1), site.url).href)}</loc></url>`).join('')}</urlset>\n`;
}
