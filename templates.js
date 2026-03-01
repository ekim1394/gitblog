function layout(config, nav, content) {
  const pages = nav.map(p => `<a href="/${p.slug}.html">${p.title}</a>`).join('\n      ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title || 'gitblog'}</title>
  <meta name="description" content="${config.description || ''}">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1><a href="/">${config.title || 'gitblog'}</a></h1>
      <nav>
        <a href="/">Home</a>
        ${pages}
      </nav>
    </header>
    <main>${content}</main>
    <footer>&copy; ${new Date().getFullYear()} ${config.author || ''}. Powered by <a href="https://github.com/ekim/gitblog">gitblog</a>.</footer>
  </div>
</body>
</html>`;
}

function index(posts) {
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
    return `    <li>
      <span class="post-date">${date}</span>
      <a href="/posts/${p.slug}.html">${p.title}</a>
      <p class="excerpt">${excerpt}${excerpt.length >= 160 ? '...' : ''}</p>
    </li>`;
  }).join('\n');

  return `<ul class="post-list">\n${items}\n</ul>`;
}

function post(p) {
  const date = new Date(p.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  return `<a href="/" class="back-link">&larr; Back</a>
<article>
  <h1>${p.title}</h1>
  <div class="post-meta">${date}</div>
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
