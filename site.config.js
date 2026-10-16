const url = new URL(process.env.SITE_URL || 'https://mikemfleming.com/');
if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash) {
  throw new Error('SITE_URL must be an HTTP(S) URL without a query or fragment');
}
url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;

export const site = {
  url: url.href,
  base: url.pathname,
  name: 'Mike M Fleming',
  description: 'Dev notes and deep thoughts from Mike M Fleming.',
};
export const sitePath = path => `${site.base}${path.replace(/^\//, '')}`;
