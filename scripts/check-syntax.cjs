const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const jsFiles = walk(path.resolve(__dirname, '..', 'js'));

jsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Check for unescaped quotes in template literals or strings
  // Replace import/export to parse with new Function
  let clean = content
    .replace(/^\s*import\s+.*?;?\s*$/gm, '// import')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+(async\s+)?function\s+/gm, '$1function ')
    .replace(/^\s*export\s+(const|let|var)\s+/gm, '$1 ')
    .replace(/^\s*export\s+\{.*?\};?\s*$/gm, '// export');
  
  try {
    new Function(clean);
  } catch(err) {
    console.error('ERROR in file:', file);
    console.error('Error message:', err.message);
  }
});
console.log('Syntax scan completed!');
