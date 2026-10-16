import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { collectPosts } from './posts.js';
import aboutMarkdown from '../content/about.md?raw';
import projectsMarkdown from '../content/projects.md?raw';
import './styles.css';

const posts = collectPosts(import.meta.glob('../content/posts/*.md', {
  eager: true, query: '?raw', import: 'default',
}));

function PixelBackground() {
  const canvas = useRef(null);
  useEffect(() => {
    const palette = Array.from({ length: 3 }, () => `hsl(${Math.random() * 360} 55% 78%)`);
    const draw = () => {
      const { innerWidth: width, innerHeight: height } = window;
      canvas.current.width = width;
      canvas.current.height = height;
      const context = canvas.current.getContext('2d');
      const size = Math.max(1, width / 40);
      for (let x = 0; x < width; x += size) for (let y = 0; y < height; y += size) {
        context.fillStyle = palette[Math.floor(Math.random() * palette.length)];
        context.fillRect(x, y, Math.ceil(size), Math.ceil(size));
      }
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);
  return <canvas ref={canvas} aria-hidden="true" />;
}

function Markdown({ source }) {
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(source)) }} />;
}

function Post({ post }) {
  return <article className="card">
    <h1>{post.title}</h1>
    <time dateTime={post.date}>{new Date(`${post.date}T00:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}</time>
    <Markdown source={post.body} />
    <p className="tags">{post.tags.map(tag => `#${tag}`).join(' ')}</p>
  </article>;
}

function App() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const navigate = () => { setRoute(window.location.hash.slice(1) || '/'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  const post = posts.find(item => route === `/blog/${item.slug}`);
  const title = post?.title ?? ({ '/': 'Home', '/blog': 'Blog', '/about': 'About', '/projects': 'Projects' }[route] ?? 'Page not found');
  useEffect(() => { document.title = `${title} | Mike M Fleming`; }, [title]);
  let content;
  if (post) content = <Post post={post} />;
  else if (route === '/') content = posts.length ? <Post post={posts[0]} /> : <section className="card"><h1>No posts yet</h1></section>;
  else if (route === '/blog') content = <section className="card"><h1>Blog</h1><ul className="posts">{posts.map(item => <li key={item.slug}><a href={`#/blog/${item.slug}`}>{item.title}</a><time dateTime={item.date}>{item.date}</time></li>)}</ul>{!posts.length && <p>No posts yet.</p>}</section>;
  else if (route === '/about') content = <article className="card"><Markdown source={aboutMarkdown} /></article>;
  else if (route === '/projects') content = <article className="card"><Markdown source={projectsMarkdown} /></article>;
  else content = <section className="card"><h1>Page not found</h1><a href="#/">Back home</a></section>;
  return <><PixelBackground /><div className="layout"><header className="card"><a className="logo" href="#/" aria-label="Mike M Fleming home"><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="logo__circle" cx="50" cy="50" r="40" stroke="black" strokeWidth="2" fill="none" /><text x="50" y="50" textAnchor="middle" dy=".3em" fill="black" fontSize="24">M F</text></svg></a><nav aria-label="Main navigation">{[['/blog', 'Blog'], ['/about', 'About'], ['/projects', 'Projects']].map(([path, label]) => <a key={path} href={`#${path}`} aria-current={route === path ? 'page' : undefined}>{label}</a>)}</nav></header><main>{content}</main></div></>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
