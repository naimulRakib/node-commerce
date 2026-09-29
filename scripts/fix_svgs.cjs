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

const files = walk(path.join(__dirname, '..', 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace "<svg ... </svg>" with <svg ... </svg>
  const badRegex = /"(<svg[^>]*>.*?<\/svg>)"/g;
  if (badRegex.test(content)) {
    content = content.replace(badRegex, '$1');
    changed = true;
  }
  
  // Also check for SVG in single quotes
  const badRegex2 = /'(<svg[^>]*>.*?<\/svg>)'/g;
  if (badRegex2.test(content)) {
    content = content.replace(badRegex2, '$1');
    changed = true;
  }

  // Next.js components that map over stats using {stat.icon} will try to render objects. 
  // Wait, if it's `{stat.icon}` where icon is a string, it prints the string.
  // We just made it an element by removing quotes. But what if it was in an array and the SVG string was literally `" <svg ... " `? Wait, if we remove quotes, it becomes valid JSX syntax. 
  // Let's also check for `<svg` inside template literals ` \`<svg ... >\` ` which would also be strings. 
  // But our previous script just replaced the emoji directly, so if the emoji was inside quotes like `icon: "📦"`, it became `icon: "<svg...></svg>"`. By removing quotes, it becomes `icon: <svg...></svg>`, which is PERFECT React.

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
});
