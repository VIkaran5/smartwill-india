const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const backupDir = path.join(root, '.backups', 'dayos-rebrand');

const files = [
  'css/design-system.css',
  'css/landing.css',
  'css/app.css',
  'css/legal.css',
  'app.html',
  'index.html',
  'te/index.html'
];

for (const f of files) {
  const src = path.join(backupDir, f);
  const dest = path.join(root, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Applied Dayos rebrand version:', f);
  }
}

console.log('Rebuilding dist/...');
execSync('node scripts/build-dist.cjs', { cwd: root, stdio: 'inherit' });
console.log('==> Successfully applied Dayos rebrand version and rebuilt dist/!');
