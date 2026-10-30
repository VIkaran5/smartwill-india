const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
  let list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f.endsWith('.js')) {
      try {
        execSync(`node --check "${full}"`);
      } catch(e) {
        console.error('FAILED syntax check:', full);
        process.exit(1);
      }
    }
  }
}
walk(path.resolve(__dirname, '..', 'js'));
console.log('ALL JS files in js/ pass node --check cleanly!');
