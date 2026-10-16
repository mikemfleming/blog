import { parse } from 'yaml';

export function collectProjects(files) {
  return Object.entries(files).map(([filename, source]) => {
    const match = source.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
    if (!match) throw new Error(`${filename}: missing YAML front matter`);
    const metadata = parse(match[1]);
    if (!metadata || typeof metadata.title !== 'string' || !metadata.title.trim()) {
      throw new Error(`${filename}: title is required`);
    }
    let url;
    try { url = new URL(metadata.url); } catch { throw new Error(`${filename}: url must be an absolute HTTP(S) URL`); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`${filename}: url must use HTTP(S)`);
    if (metadata.order !== undefined && !Number.isFinite(metadata.order)) throw new Error(`${filename}: order must be a number`);
    if (metadata.draft !== undefined && typeof metadata.draft !== 'boolean') throw new Error(`${filename}: draft must be true or false`);
    return { ...metadata, slug: filename.split('/').pop().replace(/\.md$/, ''), body: match[2] };
  }).filter(project => !project.draft)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.slug.localeCompare(b.slug));
}
