const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace "<svg ... </svg>" with <svg ... </svg>
  const badRegex = /"(\<svg[^>]*\>.*?\<\/svg\>)"/g;
  if (badRegex.test(content)) {
    content = content.replace(badRegex, '$1');
    changed = true;
  }
  
  // Also check for SVG in single quotes
  const badRegex2 = /'(\<svg[^>]*\>.*?\<\/svg\>)'/g;
  if (badRegex2.test(content)) {
    content = content.replace(badRegex2, '$1');
    changed = true;
  }

  // Also fix `<span style={{ fontSize: 22 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg></span>`
  // Actually, standard JSX SVG with strokeWidth instead of stroke-width is fine, but if we injected raw SVG, it might need strokeWidth vs stroke-width.
  // The svgMap used strokeWidth and strokeLinecap, which is React compliant!

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
});
