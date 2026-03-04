const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const templates = require('./templates');
const { resolve: resolveTheme } = require('./themes');

// --- Git log parsing ---

function getCommits() {
  const sep = '---COMMIT_START---';
  const format = `${sep}%nHASH:%H%nDATE:%aI%nAUTHOR:%an%nSUBJECT:%s%nBODY_START%n%b%nBODY_END`;
  const raw = execSync(`git log --format="${format}" --reverse`, { encoding: 'utf-8' });

  return raw.split(sep).filter(Boolean).map(block => {
    const hash = block.match(/HASH:(.+)/)?.[1]?.trim();
    const date = block.match(/DATE:(.+)/)?.[1]?.trim();
    const author = block.match(/AUTHOR:(.+)/)?.[1]?.trim() || '';
    const subject = block.match(/SUBJECT:(.+)/)?.[1]?.trim();
    const bodyMatch = block.match(/BODY_START\n([\s\S]*?)\nBODY_END/);
    const body = bodyMatch?.[1]?.trim() || '';
    if (!hash || !subject) return null;
    return { hash, date, author, subject, body };
  }).filter(Boolean);
}

// --- Type extraction ---

const TYPE_RE = /^(blog|embed|page|meta):\s*(.+)$/;

function categorize(commits) {
  const result = { meta: [], blog: [], embed: [], page: [] };
  for (const c of commits) {
    const m = c.subject.match(TYPE_RE);
    if (!m) continue;
    const [, type, title] = m;
    result[type].push({ ...c, type, title: title.trim() });
  }
  return result;
}

// --- Meta config ---

function buildConfig(metaCommits) {
  const config = {};
  for (const c of metaCommits) {
    for (const line of c.body.split('\n')) {
      const sep = line.indexOf(':');
      if (sep === -1) continue;
      const key = line.slice(0, sep).trim().toLowerCase();
      const val = line.slice(sep + 1).trim();
      if (key && val) config[key] = val;
    }
  }
  return config;
}

// --- Slug generation ---

function slug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- Embed detection ---

const EMBED_PATTERNS = [
  {
    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, or youtube.com/shorts/ID
    re: /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/,
    render: (id) =>
      `<div class="embed-container"><iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe></div>`,
  },
  {
    // Vimeo: vimeo.com/ID
    re: /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/,
    render: (id) =>
      `<div class="embed-container"><iframe src="https://player.vimeo.com/video/${id}" allowfullscreen></iframe></div>`,
  },
  {
    // Twitter/X: twitter.com or x.com status URLs
    re: /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    render: (_id, url) =>
      `<blockquote class="twitter-tweet"><a href="${url}">View post on X</a></blockquote>`,
  },
];

function processEmbeds(body) {
  return body.split('\n').map(line => {
    const trimmed = line.trim();
    // Skip lines that are part of markdown links
    if (/\[.*\]\(.*\)/.test(line)) return line;
    for (const { re, render } of EMBED_PATTERNS) {
      const m = trimmed.match(re);
      if (m) return render(m[1], trimmed);
    }
    return line;
  }).join('\n');
}

// --- Build ---

function build() {
  console.log('Building site...');

  const basePath = (process.env.BASE_PATH || '').replace(/\/+$/, '');

  const commits = getCommits();
  const { meta, blog, embed, page } = categorize(commits);
  const config = buildConfig(meta);
  const theme = resolveTheme(config.theme);

  // Merge blog + embed as posts, sorted reverse-chronological
  const allPosts = [...blog, ...embed]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Process each post
  for (const p of allPosts) {
    p.slug = p.hash.slice(0, 7);
    let body = p.body;
    if (p.type === 'embed') body = processEmbeds(body);
    p.body = marked(body);
  }

  // Process pages
  const pages = page.map(p => ({
    ...p,
    slug: slug(p.title),
    body: marked(p.body),
  }));

  // Ensure output dirs
  const dist = path.join(__dirname, 'dist');
  const postsDir = path.join(dist, 'posts');
  fs.mkdirSync(postsDir, { recursive: true });

  // Helper: strip HTML and truncate for OG description
  function excerpt(html, len = 160) {
    const text = html.replace(/<[^>]+>/g, '').trim();
    return text.length > len ? text.slice(0, len) + '...' : text;
  }

  const siteUrl = (config.url || '').replace(/\/+$/, '');

  // Write index
  const indexOg = {
    title: config.title || 'gitblog',
    description: config.description || '',
    type: 'website',
    url: siteUrl || undefined,
  };
  const indexContent = templates.layout(config, pages, basePath, theme, templates.index(allPosts, basePath), indexOg);
  fs.writeFileSync(path.join(dist, 'index.html'), indexContent);
  console.log('  dist/index.html');

  // Write posts
  for (const p of allPosts) {
    const postOg = {
      title: p.title,
      description: excerpt(p.body),
      type: 'article',
      url: siteUrl ? `${siteUrl}/posts/${p.slug}.html` : undefined,
    };
    const html = templates.layout(config, pages, basePath, theme, templates.post(p, basePath), postOg);
    fs.writeFileSync(path.join(postsDir, `${p.slug}.html`), html);
    console.log(`  dist/posts/${p.slug}.html`);
  }

  // Write pages
  for (const p of pages) {
    const pageOg = {
      title: p.title,
      description: excerpt(p.body),
      type: 'website',
      url: siteUrl ? `${siteUrl}/${p.slug}.html` : undefined,
    };
    const html = templates.layout(config, pages, basePath, theme, templates.page(p), pageOg);
    fs.writeFileSync(path.join(dist, `${p.slug}.html`), html);
    console.log(`  dist/${p.slug}.html`);
  }

  // Copy style.css
  fs.copyFileSync(
    path.join(__dirname, 'style.css'),
    path.join(dist, 'style.css')
  );
  console.log('  dist/style.css');

  console.log(`Done. ${allPosts.length} posts, ${pages.length} pages.`);
}

build();
