import { parse } from 'yaml';

export function parsePost(source, filename) {
  const match = source.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: missing YAML front matter`);
  const metadata = parse(match[1]);
  if (!metadata || typeof metadata.title !== 'string' || !metadata.title.trim() ||
      typeof metadata.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.date) ||
      Number.isNaN(Date.parse(metadata.date))) {
    throw new Error(`${filename}: title and date (YYYY-MM-DD) are required`);
  }
  if (metadata.draft !== undefined && typeof metadata.draft !== 'boolean') {
    throw new Error(`${filename}: draft must be true or false`);
  }
  if (metadata.tags !== undefined && (!Array.isArray(metadata.tags) || metadata.tags.some(tag => typeof tag !== 'string'))) {
    throw new Error(`${filename}: tags must be a list of strings`);
  }
  return { ...metadata, tags: metadata.tags ?? [], slug: filename.split('/').pop().replace(/\.md$/, ''), body: match[2] };
}

export function collectPosts(files) {
  return Object.entries(files).map(([filename, source]) => parsePost(source, filename))
    .filter(post => !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
