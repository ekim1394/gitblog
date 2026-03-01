const fs = require('fs');
const path = require('path');

const themes = {};

// Auto-discover themes: each subdirectory with a theme.js is a theme
for (const entry of fs.readdirSync(__dirname, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const themePath = path.join(__dirname, entry.name, 'theme.js');
  if (fs.existsSync(themePath)) {
    const theme = require(themePath);
    themes[theme.name] = theme;
  }
}

function resolve(name) {
  return themes[name] || themes.light;
}

module.exports = { themes, resolve };
