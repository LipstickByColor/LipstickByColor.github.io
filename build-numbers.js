// Keeps the catalogue numbers quoted around the site in step with one file.
// Edit site-numbers.json (or run with --fetch to count from the live catalogue),
// then `npm run build`. Every page that quotes a number is rewritten in place.
//
// Each number can appear in three wordings, and each keeps its wording:
//   exact   16,794
//   round   nearly 17,000 / over 16,000 / about 16,000   (whichever is true)
//   plus    16,000+
// site-numbers.lock.json records what the pages say right now, so the next run
// knows what to look for. It is written by this script; don't edit it.
//
// To manage a new number: add it to site-numbers.json, and add what the pages
// currently say for it to site-numbers.lock.json, once.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const NUMBERS = path.join(ROOT, 'site-numbers.json');
const LOCK = path.join(ROOT, 'site-numbers.lock.json');

// Hand-written sources plus the generated pages (so they stay right between rebuilds)
// Not here: guides/red-lipstick/index.html. Its figures (17,141 lipsticks, 2,668 reds) are the
// catalogue as it was when the guide was written, and stay fixed. guides/index.html quotes those
// same two figures for the guides; they no longer match a current wording, so they are left alone.
const FILES = [
  'index.html', 'about/index.html', 'color-science/index.html', 'privacy/index.html', '404.html',
  'guides/index.html',
  'color-wheel/index.html', 'dupe-finder/index.html', 'photo-match/index.html', 'lipstick-color-chart/index.html',
  'app.jsx', 'build-pages.js', 'build-color-chart.js', 'build-dupe-pages.js', 'feed.xml', 'README.md',
];
// Per-shade dupe pages: dupe-finder/<brand>/<shade>/index.html
const dupeRoot = path.join(ROOT, 'dupe-finder');
for (const brand of fs.readdirSync(dupeRoot, { withFileTypes: true }).filter(d => d.isDirectory())) {
  for (const shade of fs.readdirSync(path.join(dupeRoot, brand.name), { withFileTypes: true }).filter(d => d.isDirectory())) {
    FILES.push(`dupe-finder/${brand.name}/${shade.name}/index.html`);
  }
}

// Small numbers would collide with unrelated ones (a "437" in some CSS), so these
// are only touched where the word follows, directly or across tags:
// "437 brands", "<span>437</span><span>brands</span>"
const NOUNS = { brands: 'brands' };

const fmt = n => n.toLocaleString('en-US');
function forms(n) {
  const unit = n >= 10000 ? 1000 : n >= 1000 ? 100 : n >= 100 ? 50 : 10;
  const floor = Math.floor(n / unit) * unit;
  // "nearly" only when it is close to the next round number
  const round = n % unit >= unit * 0.7 ? `nearly ${fmt(floor + unit)}` : n === floor ? `about ${fmt(n)}` : `over ${fmt(floor)}`;
  return { exact: fmt(n), round, plus: `${fmt(floor)}+` };
}

// Count products, reds (the red guide's rule, redKind in lipstick-utils.js) and brand names from the live catalogue
async function fetchNumbers() {
  const src = fs.readFileSync(path.join(ROOT, 'supabase-data.js'), 'utf8');
  const url = src.match(/_SUPABASE_URL = '([^']+)'/)[1], key = src.match(/_SUPABASE_KEY = '([^']+)'/)[1];
  const table = src.match(/_client\.from\('([^']+)'\)/)[1];
  const { redKind } = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'lipstick-utils.js'), 'utf8') + '\n;({ redKind })', {});
  let products = 0, reds = 0;
  const brands = new Set();
  for (let i = 0; ; i++) {
    const res = await fetch(`${url}/rest/v1/${table}?select=hex,brand&order=id`, { headers: { apikey: key, Range: `${i * 1000}-${i * 1000 + 999}` } });
    if (!res.ok) throw new Error(`catalogue fetch failed: ${res.status}`);
    const page = await res.json();
    products += page.length;
    reds += page.filter(r => r.hex && redKind(r.hex)).length;
    page.forEach(r => r.brand && brands.add(r.brand));
    if (page.length < 1000) break;
  }
  return { products, reds, brands: brands.size };
}

(async () => {
  const numbers = JSON.parse(fs.readFileSync(NUMBERS, 'utf8'));
  if (process.argv.includes('--fetch')) {
    Object.assign(numbers, await fetchNumbers());
    fs.writeFileSync(NUMBERS, JSON.stringify(numbers, null, 2) + '\n');
    console.log('site-numbers.json updated from the catalogue:', JSON.stringify(numbers));
  }
  const lock = JSON.parse(fs.readFileSync(LOCK, 'utf8'));

  // old wording -> new wording, for every number and form
  const swaps = new Map(), next = {};
  for (const [key, value] of Object.entries(numbers)) {
    if (!Number.isInteger(value) || value < 0) throw new Error(`site-numbers.json: "${key}" must be a whole number`);
    if (!lock[key]) throw new Error(`site-numbers.lock.json has no entry for "${key}". Add what the pages currently say for it.`);
    next[key] = forms(value);
    if (NOUNS[key]) continue; // handled below, tied to its word
    for (const form of ['exact', 'round', 'plus']) {
      const from = lock[key][form], to = next[key][form];
      if (swaps.has(from) && swaps.get(from).to !== to) {
        throw new Error(`"${from}" is what the pages say for both ${swaps.get(from).key} and ${key}, so they can't be told apart. Reword one of them by hand first.`);
      }
      swaps.set(from, { to, key });
    }
  }

  // One pass per file, longest wording first, whole numbers only ("16,794" never matches inside "116,794")
  const quote = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const olds = [...swaps.keys()].sort((a, b) => b.length - a.length);
  const re = new RegExp(olds.map(o => `(?<![\\d,.])${quote(o)}${o.endsWith('+') ? '' : '(?![\\d,+])'}`).join('|'), 'gi');
  const keepCase = (from, to) => (/^[A-Z]/.test(from) ? to[0].toUpperCase() + to.slice(1) : to);
  let changed = 0;
  for (const file of FILES) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const before = fs.readFileSync(full, 'utf8');
    let n = 0;
    let after = before.replace(re, m => {
      const to = keepCase(m, swaps.get(m.toLowerCase()).to);
      if (to !== m) n++;
      return to;
    });
    for (const [key, noun] of Object.entries(NOUNS)) {
      if (!next[key]) continue;
      const from = ['round', 'plus', 'exact'].map(f => lock[key][f]);
      const nounRe = new RegExp(`(?<![\\d,.])(${from.map(quote).join('|')})((?:\\s|<[^>]+>)+${quote(noun)}\\b)`, 'gi');
      after = after.replace(nounRe, (m, old, rest) => {
        const form = ['round', 'plus', 'exact'][from.findIndex(f => f.toLowerCase() === old.toLowerCase())];
        const to = keepCase(old, next[key][form]);
        if (to !== old) n++;
        return to + rest;
      });
    }
    if (after !== before) { fs.writeFileSync(full, after); changed += n; console.log(`  ${file}: ${n} updated`); }
  }
  fs.writeFileSync(LOCK, JSON.stringify(next, null, 2) + '\n');

  for (const [key, f] of Object.entries(next)) console.log(`${key}: ${f.exact} · ${f.round} · ${f.plus}`);
  console.log(changed ? `site numbers: ${changed} updated` : 'site numbers: already up to date');
})().catch(err => { console.error(String(err.message || err)); process.exit(1); });
