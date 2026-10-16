import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { marked } from 'marked';
import { parsePost, collectPosts } from './posts.js';

const source = readFileSync(new URL('../content/posts/hello-world.md', import.meta.url), 'utf8');
test('Hello World has metadata and renders Markdown and an image', () => {
  const post = parsePost(source, 'hello-world.md');
  assert.equal(post.slug, 'hello-world');
  assert.equal(post.title, 'Hello World');
  const html = marked.parse(post.body);
  assert.match(html, /<strong>Markdown<\/strong>/);
  assert.match(html, /src="images\/hello-world.svg"/);
});
test('drafts are excluded and posts are newest first', () => {
  const files = { 'old.md': source.replace('2026-10-15', '2025-01-01'), 'new.md': source, 'draft.md': source.replace('draft: false', 'draft: true') };
  assert.deepEqual(collectPosts(files).map(post => post.slug), ['new', 'old']);
});
test('malformed metadata fails with the filename', () => {
  assert.throws(() => parsePost('no metadata', 'broken.md'), /broken.md/);
  assert.throws(() => parsePost(source.replace('2026-10-15', 'yesterday'), 'broken.md'), /title and date/);
});
