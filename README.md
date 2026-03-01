# gitblog

A git-powered blog where commits ARE the content. No CMS, no database — just git.

## Quick Start

1. **Fork this repo**
2. **Enable auto-deployment:**
   ```bash
   mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml
   git add .github/workflows/deploy.yml
   git commit -m "Enable GitHub Actions deployment"
   ```
3. **Configure your site** with a `meta:` commit:
   ```
   git commit --allow-empty -m "meta: site config" -m "title: My Blog
   author: Your Name
   description: A blog about things"
   ```
4. **Write a post** with a `blog:` commit:
   ```
   git commit --allow-empty -m "blog: My First Post" -m "This is my first blog post.

   You can use **markdown** here — headings, lists, code blocks, images, everything."
   ```
5. **Enable GitHub Pages** in your repo settings (Settings → Pages → Source: GitHub Actions)
6. Push to `main` and your site deploys automatically

## Commit Types

| Prefix | Purpose | Example |
|--------|---------|---------|
| `blog:` | Blog post | `blog: My First Post` |
| `embed:` | Post with video/tweet embeds | `embed: Cool Video` |
| `page:` | Static page (shown in nav) | `page: About` |
| `meta:` | Site configuration | `meta: site config` |

### Blog Post

Each post automatically displays the **git commit author name** (`git config user.name`) alongside the date.

```
git commit --allow-empty -m "blog: Post Title" -m "Markdown content here.

## Subheading

- List items
- More items

\`\`\`js
console.log('code blocks work too');
\`\`\`"
```

### Embed Post

Put a bare URL on its own line. YouTube, Vimeo, and Twitter/X links are auto-embedded:

```
git commit --allow-empty -m "embed: Great Talk" -m "Check out this talk:

https://www.youtube.com/watch?v=dQw4w9WgXcQ

It changed how I think about things."
```

### Static Page

Pages appear in the site navigation:

```
git commit --allow-empty -m "page: About" -m "# About Me

I write about code and other things."
```

### Site Config

Key-value pairs in the commit body:

```
git commit --allow-empty -m "meta: site config" -m "title: My Blog
author: Jane Doe
description: Thoughts on code"
```

## Setup

Run the setup script to add a `git blog` shortcut (alias for `git commit --allow-empty`):

```bash
./bin/setup.sh
```

Then write posts with:

```bash
git blog -m "blog: My Post" -m "Content here"
git blog -m "embed: Video" -m "https://youtube.com/watch?v=..."
git blog -m "page: About" -m "About page content"
git blog -m "meta: site config" -m "title: My Blog"
```

## Local Development

```
npm install
npm run dev
```

## How It Works

The build script reads your git history, filters commits by type prefix, renders markdown to HTML, and outputs a static site to `dist/`.

By default, the GitHub Actions workflow is disabled (`.github/workflows/deploy.yml.disabled`). Enable it by renaming the file to `deploy.yml` — then it will deploy automatically on every push to `main`.
