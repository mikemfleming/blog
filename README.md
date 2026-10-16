# Mike M Fleming's blog

A small React application built with Vite. Posts are Markdown files in this repository, parsed with `marked` and sanitized with DOMPurify. No Next.js, Astro, CMS, or API credentials.

## Run locally

Use Node.js 24 (`nvm use` if you use nvm).

```sh
npm ci
npm run dev
```

`npm run build` creates `dist/`. `npm run preview` serves the production build. `npm test` checks content parsing, sorting, and draft filtering.

## Write a post

Add a file such as `content/posts/my-new-post.md`:

```md
---
title: My new post
date: 2026-10-15
tags: [development]
draft: false
---
Write **Markdown** here.

![Description of the image](images/my-new-post/photo.jpg)
```

The filename becomes the URL slug: `#/blog/my-new-post`. Title and an ISO date are required; tags and draft are optional. Drafts are hidden from the website, but their source is bundled in the app: do not commit confidential drafts. Published posts appear newest first; the homepage displays the newest post. Restarting is unnecessary when editing posts in development.

Put images in `public/images/` and use relative `images/...` URLs (without a leading slash), so they also work under a GitHub Pages repository path. Vite copies these files into the published site. All public assets are published, so do not store private files there.

## Edit About and Projects

Edit `content/about.md` and `content/projects.md`. These pages use the same `marked` parser, HTML sanitization, and Markdown styling as blog posts. Use a `# Heading` for the page title; front matter is not needed for these standalone pages. Images use the same relative `images/...` paths and `public/images/` folder as posts.

## GitHub Pages

The included workflow builds and deploys `dist/` on pushes to `main` or `master`, or manually. In repository Settings → Pages, select **GitHub Actions** as the source. Use only your actual production branch in the workflow if both branches exist.

Relative asset URLs and hash navigation support both repository sites and custom domains without a server rewrite. A post link looks like `https://username.github.io/repo/#/blog/hello-world`; refreshing it works on Pages. This is a client-rendered application, so per-post HTML, social previews, and the former clean post URLs are not provided.

For a custom domain, configure it in GitHub Pages and add a `public/CNAME` file containing the domain. Styling lives in `src/styles.css`.

The old GraphCMS integration was removed. Existing CMS content has not been imported; the Hello World post is the initial sample.
