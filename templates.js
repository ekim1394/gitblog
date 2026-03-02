function layout(config, nav, basePath, theme, content, ogMeta = {}) {
  const pages = nav.map(p => `<a href="${basePath}/${p.slug}.html">${p.title}</a>`).join('\n      ');
  const themeVars = Object.entries(theme.colors)
    .map(([key, val]) => `    ${key}: ${val};`)
    .join('\n');

  const pageTitle = ogMeta.title || config.title || 'gitblog';
  const pageDesc = ogMeta.description || config.description || '';
  const ogType = ogMeta.type || 'website';
  const ogImage = ogMeta.image || config.og_image || '';

  let ogTags = `
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDesc}">
  <meta property="og:type" content="${ogType}">
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${pageDesc}">`;
  if (ogMeta.url) ogTags += `\n  <meta property="og:url" content="${ogMeta.url}">`;
  if (ogImage) ogTags += `\n  <meta property="og:image" content="${ogImage}">\n  <meta name="twitter:image" content="${ogImage}">`;
  if (config.author) ogTags += `\n  <meta name="author" content="${config.author}">`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDesc}">${ogTags}
  <style>
  :root {
${themeVars}
  }
  </style>
  <link rel="stylesheet" href="${basePath}/style.css">
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</head>
<body>
  <div class="container">
    <header>
      <h1><a href="${basePath}/">${config.title || 'gitblog'}</a></h1>
      <nav>
        <a href="${basePath}/">Home</a>
        ${pages}
      </nav>
    </header>
    <main>${content}</main>
    <footer>&copy; ${new Date().getFullYear()} ${config.author || ''}. Powered by <a href="https://github.com/ekim1394/gitblog">gitblog</a>.</footer>
  </div>
  <script async src="https://platform.twitter.com/widgets.js"></script>
</body>
</html>`;
}

function index(posts, basePath) {
  if (posts.length === 0) {
    return `<p>No posts yet. Create a commit with the prefix <code>blog:</code> to get started.</p>`;
  }
  const items = posts.map(p => {
    const date = new Date(p.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const excerpt = p.body
      .replace(/<[^>]+>/g, '')
      .slice(0, 160)
      .trim();
    const authorHtml = p.author ? `<span class="post-author">${p.author}</span>` : '';
    return `    <li>
      <span class="post-date">${date}${p.author ? ' · ' + p.author : ''}</span>
      <a href="${basePath}/posts/${p.slug}.html">${p.title}</a>
      <p class="excerpt">${excerpt}${excerpt.length >= 160 ? '...' : ''}</p>
    </li>`;
  }).join('\n');

  return `<ul class="post-list">\n${items}\n</ul>`;
}

function post(p, basePath) {
  const date = new Date(p.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  return `<a href="${basePath}/" class="back-link">&larr; Back</a>
<article>
  <h1>${p.title}</h1>
  <div class="post-meta">${date}${p.author ? ' · ' + p.author : ''}</div>
  <div class="content">${p.body}</div>
</article>`;
}

function page(p) {
  return `<article>
  <h1>${p.title}</h1>
  <div class="content">${p.body}</div>
</article>`;
}

module.exports = { layout, index, post, page };
