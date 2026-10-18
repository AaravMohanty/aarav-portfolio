/* Walks dist/, pulls every local href/src out of the HTML, and makes sure
   the file (or the #anchor) it points at actually exists. Run: npm run check */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, posix } from 'node:path';

const ROOT = new URL('../dist/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const htmlFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith('.html')) htmlFiles.push(full);
  }
})(ROOT);

const problems = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const pretty = file.slice(ROOT.length).replace(/\\/g, '/');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    // ?v= cache-busting is not part of the path on disk
    const target = match[1].replace(/\?[^#]*/, '');
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(target)) {
      if (target.startsWith('#') && target !== '#' && !ids.has(target.slice(1))) {
        problems.push(`${pretty}: anchor ${target} has no matching id`);
      }
      continue;
    }
    if (!target.startsWith('/')) continue;

    const [path, hash] = target.split('#');
    let resolved = join(ROOT, path.replace(/\//g, '/'));
    if (path.endsWith('/')) resolved = join(resolved, 'index.html');

    if (!existsSync(resolved)) {
      problems.push(`${pretty}: ${target} -> missing ${posix.normalize(path)}`);
      continue;
    }
    if (hash && resolved.endsWith('.html')) {
      const targetIds = new Set([...readFileSync(resolved, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
      if (!targetIds.has(hash)) problems.push(`${pretty}: ${target} -> no id "${hash}" on that page`);
    }
  }
}

// Anchors the command palette jumps to, which live only in site.js.
const paletteTargets = [...readFileSync(join(ROOT, 'site.js'), 'utf8').matchAll(/href: '(\/[^']+)'/g)].map((m) => m[1]);
for (const raw of paletteTargets) {
  const target = raw.replace(/\?[^#]*/, '');   // /?globe resolves to /
  const [path, hash] = target.split('#');
  const resolved = path.endsWith('/') ? join(ROOT, path, 'index.html') : join(ROOT, path);
  if (!existsSync(resolved)) {
    problems.push(`site.js palette: ${target} -> missing file`);
  } else if (hash) {
    const ids = new Set([...readFileSync(resolved, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    if (!ids.has(hash)) problems.push(`site.js palette: ${target} -> no id "${hash}"`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} broken link(s):\n`);
  problems.forEach((problem) => console.error('  ' + problem));
  process.exit(1);
}
console.log(`All local links resolve. Checked ${htmlFiles.length} pages.`);
