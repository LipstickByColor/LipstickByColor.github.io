// Checks every link on the site: npm run links:check (add --internal to skip outside sites).
// Reads the links from the pages themselves (every .html page, feed.xml, llms.txt and the
// literal links in app.jsx), so new pages are covered without keeping a list.
//   - site paths: the file exists in the repo
//   - ?wheel=: the color is on the wheel (or renamed in parseSharedLink in app.jsx)
//   - ?color=: a 6-digit hex code
//   - ?brand=&dupe=: the shade is in the catalogue file (data-build/, not the Supabase table)
//   - fbrand, finish, format filters: a value the catalogue has
//   - outside links: the address still loads. Sites that refuse scripts are listed in
//     link-check-manual.json and reported as "check by hand" instead of broken.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const SITE = 'https://lipstickcolorfinder.com';
const INTERNAL_ONLY = process.argv.includes('--internal');
const SKIP_DIRS = new Set(['node_modules', 'design', 'data-build', '.git', '.claude']);

// ── Pages and their links ────────────────────────────────────────────────────
function pages(dir = ROOT, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) pages(path.join(dir, e.name), out); }
    else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, path.join(dir, e.name)));
  }
  return out;
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

const links = new Map(); // url -> Set of files it appears in
const add = (url, file) => {
  url = decode(url.trim());
  if (!url || /^(#|mailto:|tel:|javascript:|data:|\{)/.test(url)) return;
  if (!links.has(url)) links.set(url, new Set());
  links.get(url).add(file);
};
for (const file of [...pages(), 'feed.xml', 'llms.txt', 'app.jsx']) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  // <a href>, plus src/srcset of images and scripts (site files only)
  for (const m of text.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)) add(m[1], file);
  for (const m of text.matchAll(/\ssrc(?:set)?="([^"]*)"/g))
    for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u.startsWith('/')) add(u, file); }
  if (file === 'feed.xml') for (const m of text.matchAll(/<link>([^<]*)<\/link>/g)) add(m[1], file);
  if (file === 'llms.txt') for (const m of text.matchAll(/\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g)) add(m[1], file);
}

// ── What the links are checked against ───────────────────────────────────────
const { LIPSTICK_DATA } = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'lipstick-utils.js'), 'utf8') + '\n;({ LIPSTICK_DATA })', {});
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const wheelSlugs = new Set(LIPSTICK_DATA.map(c => slug(c.name)));
const appSrc = fs.readFileSync(path.join(ROOT, 'app.jsx'), 'utf8');
const renamed = Function('return ' + (appSrc.match(/const RENAMED = (\{[^}]*\})/) || [, '{}'])[1])();

const catalogueName = fs.readFileSync(path.join(ROOT, 'supabase-data.js'), 'utf8').match(/CATALOGUE_FILE = '([^']+)'/)[1];
let cataloguePath = path.join(ROOT, 'data-build', catalogueName);
const notes = [];
if (!fs.existsSync(cataloguePath)) {
  const files = fs.readdirSync(path.join(ROOT, 'data-build')).filter(f => /^catalogue-.*\.json$/.test(f)).sort();
  cataloguePath = path.join(ROOT, 'data-build', files[files.length - 1]);
  notes.push(`${catalogueName} (the live catalogue) isn't in data-build/, so shades were checked against ${path.basename(cataloguePath)}.`);
}
const cat = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
const products = cat.rows.map(r => ({ brand: cat.brands[r[1]], shade: r[3], finish: (r[4] || '').trim() || 'Unlisted', format: r[5] === 'Lip Crayon' ? 'Bullet Lipstick' : r[5] }));
const shadeKeys = new Set(products.map(p => `${p.brand.toLowerCase()}|${String(p.shade).toLowerCase()}`));
const brandSet = new Set(products.map(p => p.brand));
const finishSet = new Set(products.map(p => p.finish));
const formatSet = new Set(products.map(p => p.format));

// ── Checks ───────────────────────────────────────────────────────────────────
const problems = []; // { kind, url, detail }
const internal = [], external = [];
for (const url of links.keys()) {
  if (url.startsWith('/') && !url.startsWith('//')) internal.push(url);
  else if (url.startsWith(SITE)) internal.push(url.slice(SITE.length) || '/');
  else if (/^https?:\/\//.test(url)) external.push(url);
  else problems.push({ kind: 'Relative link (paths should start with /)', url });
}
const origUrl = u => links.has(u) ? u : SITE + u;

for (const u of internal) {
  const url = new URL(u, SITE);
  const p = decodeURIComponent(url.pathname);
  const file = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  if (!fs.existsSync(file)) problems.push({ kind: 'Page or file missing', url: origUrl(u) });
  const q = url.searchParams;
  const color = q.get('color'), wheel = q.get('wheel'), brand = q.get('brand'), dupe = q.get('dupe');
  if (color !== null && !/^[0-9a-f]{6}$/i.test(color)) problems.push({ kind: 'Bad hex code', url: origUrl(u) });
  if (wheel !== null) {
    const s = wheel.toLowerCase();
    if (!wheelSlugs.has(renamed[s] || s)) problems.push({ kind: 'Wheel color no longer on the wheel', url: origUrl(u), detail: wheel });
  }
  if (brand !== null && dupe !== null && !shadeKeys.has(`${brand.toLowerCase()}|${dupe.toLowerCase()}`))
    problems.push({ kind: 'Dupe shade not in the catalogue', url: origUrl(u), detail: `${brand} ${dupe}` });
  for (const b of q.getAll('fbrand')) if (!brandSet.has(b)) problems.push({ kind: 'Filter value not in the catalogue', url: origUrl(u), detail: `brand ${b}` });
  for (const f of q.getAll('finish')) if (!finishSet.has(f)) problems.push({ kind: 'Filter value not in the catalogue', url: origUrl(u), detail: `finish ${f}` });
  for (const f of q.getAll('format')) if (!formatSet.has(f)) problems.push({ kind: 'Filter value not in the catalogue', url: origUrl(u), detail: `format ${f}` });
}

// Outside sites, a few at a time
const manual = JSON.parse(fs.readFileSync(path.join(ROOT, 'link-check-manual.json'), 'utf8')).hosts;
const isManual = url => manual.some(h => new URL(url).hostname.replace(/^www\./, '') === h.replace(/^www\./, ''));
const byHand = [], blocked = [];
async function checkExternal(url) {
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': 'lipstickcolorfinder-link-check' } });
    res.body?.cancel();
    const moved = new URL(res.url), was = new URL(url);
    if (res.ok && moved.pathname === '/' && was.pathname !== '/')
      problems.push({ kind: 'Outside link now goes to the home page (product likely gone)', url, detail: res.url });
    else if (res.ok) return;
    else if (isManual(url)) byHand.push(url);
    else if ([401, 403, 429, 999].includes(res.status)) blocked.push({ url, status: res.status });
    else problems.push({ kind: 'Outside link broken', url, detail: String(res.status) });
  } catch (e) {
    if (isManual(url)) byHand.push(url);
    else problems.push({ kind: 'Outside link broken', url, detail: e.name === 'AbortError' ? 'timed out' : e.cause?.code || e.message });
  } finally { clearTimeout(timer); }
}

(async () => {
  if (!INTERNAL_ONLY) {
    const queue = [...external];
    await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await checkExternal(queue.shift()); }));
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  const where = url => [...(links.get(url) || links.get(SITE + url) || [])].sort();
  const short = files => files.length > 3 ? `${files.slice(0, 3).join(', ')} and ${files.length - 3} more` : files.join(', ');
  console.log(`Checked ${internal.length} site links and ${INTERNAL_ONLY ? 'no' : external.length} outside links on ${pages().length} pages.`);
  for (const n of notes) console.log('Note: ' + n);
  const groups = {};
  for (const p of problems) (groups[p.kind] ||= []).push(p);
  for (const [kind, list] of Object.entries(groups)) {
    console.log(`\n${kind} (${list.length})`);
    for (const p of list) console.log(`  ${p.url}${p.detail ? `  [${p.detail}]` : ''}\n    on ${short(where(p.url))}`);
  }
  if (blocked.length) {
    console.log(`\nRefused the check, ${blocked.length} (open them yourself; if they load, add the site to link-check-manual.json)`);
    for (const b of blocked) console.log(`  ${b.url}  [${b.status}]\n    on ${short(where(b.url))}`);
  }
  if (byHand.length) {
    console.log(`\nCheck by hand, ${byHand.length} (these sites refuse scripts)`);
    for (const u of byHand) console.log(`  ${u}\n    on ${short(where(u))}`);
  }
  if (!problems.length) console.log('\nNo broken links found.');
  process.exitCode = problems.length ? 1 : 0;
})();
