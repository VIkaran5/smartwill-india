#!/usr/bin/env node
/**
 * build-dist.cjs
 * SmartWill India — Cross-platform dist/ assembler (works on Windows + Linux/Vercel)
 */

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

console.log('==> SmartWill India dist build starting...');
console.log('    Root :', root);
console.log('    Dist :', dist);

// 1. Clean and recreate dist/
if (fs.existsSync(dist)) {
  console.log('==> Removing old dist/...');
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

// Helper: recursive copy
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 2. Copy HTML pages
const htmlFiles = ['index.html', 'app.html', 'contact.html', 'terms.html', 'refunds.html', 'pay.html', 'privacy.html'];
for (const f of htmlFiles) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dist, f));
    console.log('    Copied', f);
  } else {
    console.warn('    WARN:', f, 'not found, skipping.');
  }
}

// 3. Copy asset folders
const folders = ['css', 'js', 'assets', 'blog', 'te'];
for (const folder of folders) {
  const src = path.join(root, folder);
  if (fs.existsSync(src)) {
    copyRecursive(src, path.join(dist, folder));
    console.log('    Copied', folder + '/');
  }
}

// 3b. Copy root static files (SEO, OG image)
const staticFiles = ['sitemap.xml', 'robots.txt', 'og-image.jpg'];
for (const f of staticFiles) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dist, f));
    console.log('    Copied', f);
  } else {
    console.warn('    WARN:', f, 'not found, skipping.');
  }
}

// 4. Safety check — never copy server/config files into dist
const forbidden = ['node_modules', '.git', 'android', 'ios', 'api', 'scripts', '.vercel',
  'capacitor.config.json', 'package.json', 'package-lock.json', 'vercel.json', 'firestore.rules'];
for (const item of forbidden) {
  const p = path.join(dist, item);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log('    Removed forbidden item:', item);
  }
}

// 5. Report
function countFiles(dir) {
  let count = 0;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    count += fs.statSync(full).isDirectory() ? countFiles(full) : 1;
  }
  return count;
}

const fileCount = countFiles(dist);
console.log('');
console.log(`==> dist/ build complete! (${fileCount} files)`);
console.log('    Path:', dist);
