# Mike M Fleming's blog

A small React application built with Vite. Posts are Markdown files in this repository, parsed with `marked` and sanitized with sanitize-html at build time. No Next.js, Astro, CMS, or API credentials.

## Run locally

Use Node.js 24 (`nvm use` if you use nvm).

```sh
npm ci
npm run dev
```

`npm run build` creates complete HTML pages in `dist/` using React’s `renderToStaticMarkup`; content and navigation work without JavaScript. `npm run preview` serves the production build. `npm test` checks content parsing, sorting, and draft filtering. After building, `npm run test:build` checks generated pages, metadata, links, assets, and sanitization.

## Write a post

Add a file such as `content/posts/my-new-post.md`:

```md
---
title: My new post
date: 2026-10-15
tags: [development]
description: A short summary for search results and social previews.
draft: false
---
Write **Markdown** here.

![Description of the image](images/my-new-post/photo.jpg)
```

The filename becomes the URL slug: `/blog/my-new-post/`. Use lowercase, hyphen-separated filenames. Title and an ISO date are required; tags, draft, and description are optional. Without a description, the build uses an excerpt of the body. Draft posts are excluded from the generated site. Files in a public GitHub repository are still public, including drafts. Published posts appear newest first; the homepage displays the newest post. Restarting is unnecessary when editing posts in development.

Put images in `public/images/` and use relative `images/...` URLs (without a leading slash), so they also work under a GitHub Pages repository path. The Markdown renderer adds the configured site base path, and Vite copies these files into the published site. All public assets are published, so do not store private files there.

### Text and formatting

Write the post body below the closing `---` of the metadata block. Separate paragraphs with a blank line. The title is displayed automatically, so start sections with `##`.

```md
This is a paragraph of ordinary text.

This is another paragraph with **bold text**, *italic text*, and `inline code`.

## A section heading

### A smaller heading

- First bullet
- Second bullet

1. First step
2. Second step

> A quotation or callout.
```

For a code block, put three backticks on a line before and after the code. Add the language after the opening backticks:

````md
```js
console.log('Hello, world!');
```
````

### Links

Put the visible link text in square brackets and the destination in parentheses:

```md
Read the [React documentation](https://react.dev/).

Visit my [About page](/about/) or [Projects page](/projects/).

Read the [Hello World post](/blog/hello-world/).
```

Use full `https://` URLs for external sites. For pages and posts in this app, use the paths shown above (the renderer adds any repository base path); the post slug is its Markdown filename without `.md`.

### Images

1. Create a folder for the post under `public/images/`, for example `public/images/my-new-post/`.
2. Copy your image into that folder, for example `public/images/my-new-post/photo.jpg`.
3. Reference it in your Markdown:

```md
![A description of what the photo shows](images/my-new-post/photo.jpg)
```

The text in square brackets is alternative text for accessibility and when the image cannot load. Use a useful description. Images automatically fit within the post width.

Use `images/...` without `public/` or a leading `/`. The renderer resolves these image paths from the website base, not the Markdown file. Match the filename and capitalization exactly; lowercase names with hyphens are easiest to use.

You can also display an image hosted elsewhere or make an image a link:

```md
![Description of a remote image](https://example.com/photo.jpg)

[![Project screenshot](images/my-new-post/screenshot.png)](https://example.com/)
```

When editing on GitHub, upload images into the same `public/images/` folder and commit them along with the Markdown changes. Check the result with `npm run dev`; after publishing, pushing to the deployment branch triggers the GitHub Pages build.

## Edit About and Projects

Edit `content/about.md` and `content/projects.md`. These pages use the same `marked` parser, HTML sanitization, and Markdown styling as blog posts. Use a `# Heading` for the page title; front matter is not needed for these standalone pages. Images use the same relative `images/...` paths and `public/images/` folder as posts.

## GitHub Pages

The included workflow builds and deploys `dist/` on pushes to `main` or `master`, or manually. In repository Settings → Pages, select **GitHub Actions** as the source. Use only your actual production branch in the workflow if both branches exist.

The workflow sets `SITE_URL` from GitHub Pages settings, so canonical URLs, navigation, image URLs, and the sitemap use the correct domain and repository prefix. For a local production build, the default is `https://mikemfleming.com/`. To target another URL:

```sh
SITE_URL=https://username.github.io/repo/ npm run build
SITE_URL=https://username.github.io/repo/ npm run test:build
SITE_URL=https://username.github.io/repo/ npm run preview
```

For development under that prefix, use the same `SITE_URL` with `npm run dev` and visit `/repo/`.

The build produces `/`, `/blog/`, `/about/`, `/projects/`, one `/blog/slug/` page per published post, and a `404.html` error page. Each page has a title, description, canonical URL, and Open Graph/Twitter text metadata. The error page is marked `noindex`. It also generates `sitemap.xml`, `robots.txt`, and `.nojekyll`. Social preview images are not configured.

Navigation uses ordinary links and directory `index.html` files, so direct visits and refreshes work on GitHub Pages. The browser script draws the pixel background and forwards old `#/...` links to their new paths; it does not render content. The SVG logo animation remains CSS-only.

For a custom domain, configure it in GitHub Pages and add a `public/CNAME` file containing the domain. Styling lives in `src/styles.css`.

The old GraphCMS integration was removed. Existing CMS content has not been imported; the Hello World post is the initial sample.

## Editorial approach

Write as a technical lead who enjoys learning and explaining what they learn. Start with a concrete problem, explain the mechanism, and make the tradeoffs useful to the reader. Keep the voice conversational and technically precise; light humor should support the explanation.

Check factual claims against primary documentation. Distinguish observations from guarantees, lab measurements from real-user experience, and illustrative snippets from tested deployments. Explain prerequisites and meaningful failure cases without turning every post into a checklist. Don't invent experience or results.

Keep original publication dates and stable filenames when revising migrated posts. Identify historical dependencies and commands where they differ from current guidance, and link to sources for important corrections. Prefer small, inspectable experiments over claims that something is automatically faster, safer, or free.
