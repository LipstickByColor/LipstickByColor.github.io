// Turns the pipeline's api_products.csv into the CSV loaded into the Supabase
// table: only the columns the site uses, plus the fixes below. Writes
// data-build/products-<date>.csv (gitignored: the repo is public).
//   node prepare-catalogue.js [path/to/api_products.csv]
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || '/Users/connie/dev/color_pipeline_end_to_end/data/runs/2026-11-01_export2/api_products.csv';
const COLS = ['id', 'brand', 'product', 'shade', 'finish', 'type', 'lab_l', 'lab_a', 'lab_b', 'hex', 'image_url', 'price_tier', 'discontinued', 'long_lasting'];

// Photos cut out of a chart of every shade (image_file, in site_images/ next
// to the source CSV) are copied to product-images/ and served by the site;
// the row's image_url points there. Commit that folder with the change.
const IMAGE_DIR = path.join(__dirname, 'product-images');
const IMAGE_BASE = 'https://lipstickcolorfinder.com/product-images/';

const BRAND_RENAMES = { 'prada beauty': 'prada' };

// Rows dropped: no real shade, or a store listing that repeats a cleaner row
const DROP = {
  49222: 'generic brand, "pink 1 pcs"',
  33591: 'repeats christian louboutin mundo red 003 (33581)',
  28372: 'repeats pixi +rose lip nourisher (28447), "(100% off)" listing',
  49172: 'revlon, shade is only "0.15 ounce (pack of 2)"',
  49488: 'revlon, shade is only "1 count (pack of 2) red"',
};

// Shade names with sizes, store text or broken characters
const SHADES = {
  51816: 'kisses matte lipstick no 12 soft pink',
  51805: 'kisses lip lacquer no 41 military red',
  51813: 'kisses satin lip color no 111 lola red',
  51822: 'liquid lip velvet no 37 regiment red',
  51825: 'liquid lip velvet no 41 military red',
  51820: 'lip velvet no 412 orange red',
  51817: 'lip velvet crush no 85 rosy mauve',
  51819: 'lip velvet no 419 magenta pink',
  49491: '510 berry rich',
  49489: 'fuchsia fusion',
  49490: '525 wine with everything',
  50079: 'the original 101 ointment multipurpose superbalm',
  20600: 'original cinnamon - brown with pink and gold pearl',
  1118721: 'hearsay',
  // single-shade products whose shade was only a size
  20140: 'original', 21015: 'original', 51902: 'original',
  26160: 'original', 28447: '+rose', 45867: 'gilded gloss',
};

// Marked discontinued but still sold: limited editions and clearance
const NOT_DISCONTINUED = [31508, 31510, 31512, 31513, 31514, 31543, 31506, 49898, 46822, 46993, 145642,
  145638, 50302, 26004, 26012, 50340, 50339, 50341, 50342, 28283, 1142981].map(String);

function parseCSV(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const cell = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
const clean = s => s.replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();

const [header, ...data] = parseCSV(fs.readFileSync(SRC, 'utf8'));
const rows = data.map(r => Object.fromEntries(header.map((k, i) => [k, r[i]])));
const missing = [...Object.keys(DROP), ...Object.keys(SHADES), ...NOT_DISCONTINUED].filter(id => !rows.some(r => r.id === id));
if (missing.length) throw new Error(`fix ids not in the source: ${missing.join(', ')}`);

const out = [];
for (const r of rows) {
  if (DROP[r.id]) continue;
  r.brand = BRAND_RENAMES[r.brand] || clean(r.brand);
  r.product = clean(r.product).toLowerCase();
  r.shade = clean(SHADES[r.id] || r.shade).toLowerCase();
  if (NOT_DISCONTINUED.includes(r.id)) r.discontinued = '';
  if (r.image_file) r.image_url = IMAGE_BASE + path.basename(r.image_file);
  out.push(r);
}

const key = r => `${r.brand}|${r.product}|${r.shade}`;
const seen = new Set(), dups = out.filter(r => seen.has(key(r)) || !seen.add(key(r)));
if (dups.length) throw new Error(`repeated brand|product|shade: ${dups.map(key).join('; ')}`);

const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const outDir = path.join(__dirname, 'data-build');
fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `products-${date}.csv`);
fs.writeFileSync(file, [COLS.join(','), ...out.map(r => COLS.map(c => cell(r[c] ?? '')).join(','))].join('\n') + '\n');
console.log(`wrote ${path.relative(__dirname, file)}: ${out.length.toLocaleString('en-US')} rows (${rows.length - out.length} dropped)`);
const images = out.filter(r => r.image_file).map(r => path.basename(r.image_file));
fs.mkdirSync(IMAGE_DIR, { recursive: true });
images.forEach(f => fs.copyFileSync(path.join(path.dirname(SRC), 'site_images', f), path.join(IMAGE_DIR, f)));
const stale = fs.readdirSync(IMAGE_DIR).filter(f => !images.includes(f));
stale.forEach(f => fs.unlinkSync(path.join(IMAGE_DIR, f)));
console.log(`copied ${images.length} cropped photos to product-images/${stale.length ? ` (removed ${stale.length} no row uses)` : ''}`);
