// Writes one page per popular shade at /dupe-finder/<brand>/<shade>/: the shade, five close color
// matches, five close ones under $15, and links into the dupe finder's filters, all from the live
// catalogue. Needs the network, so it is run on its own:
//   npm run dupes:pick    pick each page's matches out of its 10 closest, save, and rebuild
//   npm run build:dupes   rebuild the pages with the saved picks (dupe-picks.json)
// Product photos are saved as small WebP thumbnails in /dupe-finder/assets/, so the pages
// don't depend on retailer image links. Ones already saved are reused; unused ones are removed.
// Each page also gets a share image (<page>-share.png) for Pinterest and link previews.
// The shades are listed in dupe-shades.js. Don't edit the generated pages.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const sharp = require('sharp');
const { SHADES, slug, pageUrl } = require('./dupe-shades');

const SITE = 'https://lipstickbycolor.github.io';
const IMG_DIR = path.join(__dirname, 'dupe-finder', 'assets');
// Saved at about twice the size they are shown at, for sharp screens
const THUMB = 144, SOURCE_IMG = 240;
// The dupe finder lists matches up to this far past the closest one (DUPE_DELTA_E in app.jsx);
// the page only offers filters that leave something in that range
const FINDER_MARGIN = 2;
// The color chart's reach for a pick (CHART_RADIUS and CHART_SPARSE in app.jsx)
const CHART_RADIUS = 2.25, CHART_SPARSE = 1;

// Never listed as a match. Liners aren't a stand-in for a lipstick; SKIP is for single
// products the catalogue has as a lipstick but aren't one, as 'brand|product|shade'.
const SKIP_FORMATS = ['Lip Liner & Pencil'];
const SKIP = [
  'buxom|plump shot™ peptide lip serum|lingerie', // a near-clear balm
];

// Brands whose names plain title-casing gets wrong
const BRAND_NAMES = {
  'mac cosmetics':'MAC', 'l.a. colors':'L.A. Colors', 'l.a. girl':'L.A. Girl', 'nars':'NARS', 'nyx':'NYX', 'nyx professional makeup':'NYX Professional Makeup', 'l oreal':"L'Oréal",
  'lancome':'Lancôme', 'estee lauder':'Estée Lauder', 'hermes':'Hermès', 'e.l.f. cosmetics':'e.l.f.', 'e l f':'e.l.f.',
  'fenty beauty by rihanna':'Fenty Beauty', 'covergirl':'CoverGirl', 'colourpop':'ColourPop', 'kvd beauty':'KVD Beauty',
  'rms beauty':'RMS Beauty', 'bh cosmetics':'BH Cosmetics', 'it cosmetics':'IT Cosmetics', 'pat mcgrath labs':'Pat McGrath Labs',
  '3ce':'3CE', 'dhc':'DHC', 'mua cosmetics':'MUA Cosmetics', 'mua makeup academy':'MUA Makeup Academy', 'lys beauty':'LYS Beauty', 'pyt beauty':'PYT Beauty',
  'rom&nd':'rom&nd', 'rom nd':'rom&nd', 'yves saint laurent':'Yves Saint Laurent', 'bareminerals':'bareMinerals',
  'cle de peau beaute':'Clé de Peau Beauté', 'tonymoly':'TonyMoly', 'olehenriksen':'Olehenriksen',
};

// The finder's filter values (FINISH_ORDER and FORMAT_ORDER in app.jsx), with the short names shown here
const FINISHES = ['Matte', 'Semi-Matte', 'Satin', 'Cream', 'Glossy', 'Sheer', 'Shimmer'];
const FORMATS = { 'Bullet Lipstick':'Bullet', 'Lip Crayon':'Crayon', 'Liquid Lipstick':'Liquid', 'Lip Gloss':'Gloss', 'Lip Stain & Tint':'Stain', 'Lip Oil':'Oil', 'Lip Balm & Care':'Balm' };
// What to call a product of each format in a sentence
const FORMAT_NOUNS = { 'Lip Crayon':'lip crayon', 'Liquid Lipstick':'liquid lipstick', 'Lip Gloss':'gloss', 'Lip Stain & Tint':'stain', 'Lip Oil':'lip oil', 'Lip Balm & Care':'balm' };
// The page's two lists only show lipsticks that can stand in for the original: these formats
// (no glosses, oils, balms or pencils), in the original's finish or one close to it
const LISTED_FORMATS = ['Bullet Lipstick', 'Lip Crayon', 'Liquid Lipstick', 'Lip Stain & Tint'];
// The finder filters crayons with bullets (formatGroup in app.jsx), under one option
const formatGroup = f => f === 'Lip Crayon' ? 'Bullet Lipstick' : f;
const FORMAT_PILLS = { 'Bullet Lipstick':'Bullet & Crayon' };
const SIMILAR_FINISHES = {
  'Matte': ['Matte', 'Semi-Matte'],
  'Semi-Matte': ['Semi-Matte', 'Matte', 'Satin'],
  'Satin': ['Satin', 'Cream', 'Semi-Matte'],
  'Cream': ['Cream', 'Satin'],
  'Glossy': ['Glossy', 'Sheer', 'Shimmer'],
  'Sheer': ['Sheer', 'Glossy'],
  'Shimmer': ['Shimmer', 'Glossy'],
};
// ΔE bands, as the finder names them (MATCH_TIERS in app.jsx), on a scale that runs 0 to 4
const SCALE_MAX = 4;
const BANDS = [[0, 1, 'Very close'], [1, 2, 'Close'], [2, 3.5, 'Similar'], [3.5, SCALE_MAX, 'Same family']];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const titleCase = s => s.replace(/(^|[\s\-/(])([a-zà-ÿ])/g, (m, pre, ch) => pre + ch.toUpperCase());
// Small joining words stay lowercase: "Makeup by Mario", "Dose of Colors"
const brandName = b => BRAND_NAMES[b] || titleCase(b).replace(/(?<=\s)(Of|By|De|And|The|For)(?=\s)/g, w => w.toLowerCase());
const finderUrl = (p, filters = []) => `/dupe-finder/?brand=${encodeURIComponent(p.brand)}&amp;dupe=${encodeURIComponent(p.shade)}`
  + filters.map(([k, v]) => `&amp;${k}=${encodeURIComponent(v)}`).join('');
// Every match for the shade: the dupe finder, or the color chart at the shade's chartHex
const allUrl = (s, src, filters = []) => !s.chartHex ? finderUrl(src, filters)
  : `/lipstick-color-chart/?color=${s.chartHex.slice(1).toLowerCase()}` + filters.map(([k, v]) => `&amp;${k}=${encodeURIComponent(v)}`).join('');
const fullName = p => `${brandName(p.brand)} ${titleCase(p.shade)} ${titleCase(p.product)}`.trim();

const utils = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, 'lipstick-utils.js'), 'utf8') + '\n;({ deltaE, hexToLab })', {});

// ── Page colors ───────────────────────────────────────────────────────────────
// Each page is tinted with a pale wash of its shade, worked out here (in OKLab) rather than
// with CSS color-mix, so every page's text contrast can be checked before it is written.
const CREAM = '#faf6f1', TEXT_MID = '#5c3d30';
const toLin = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLin = c => Math.round(Math.max(0, Math.min(1, c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)) * 255);
const rgbOf = hex => [1, 3, 5].map(i => toLin(parseInt(hex.slice(i, i + 2), 16)));
function hexToOklab(hex) {
  const [r, g, b] = rgbOf(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklabToHex([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return '#' + [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
    .map(c => fromLin(c).toString(16).padStart(2, '0')).join('');
}
const luminance = hex => { const [r, g, b] = rgbOf(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (x, y) => { const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
// share of the shade mixed into cream, with its chroma capped so deep reds still give a soft tint
function wash(hex, share, maxChroma) {
  const c = hexToOklab(CREAM), o = hexToOklab(hex);
  const [L, a, b] = c.map((v, i) => v + (o[i] - v) * share);
  const k = Math.min(1, maxChroma / (Math.hypot(a, b) || 1));
  return oklabToHex([L, a * k, b * k]);
}
function pageColors(hex) {
  const tint = wash(hex, 0.18, 0.03), border = wash(hex, 0.30, 0.05);
  // The accent on "dupes" is a darker version of the shade, darkened further until it reads on the tint
  const [L, a, b] = hexToOklab(hex);
  let accent, dl = 0.12;
  do { accent = oklabToHex([Math.max(0, L - dl), a, b]); dl += 0.02; } while (contrast(accent, tint) < 4.5 && dl < 1);
  if (contrast(accent, tint) < 4.5 || contrast(TEXT_MID, tint) < 4.5) throw new Error(`text on the ${hex} tint (${tint}) is too faint`);
  return { tint, border, accent };
}

// ── Catalogue ─────────────────────────────────────────────────────────────────
async function fetchCatalogue() {
  const src = fs.readFileSync(path.join(__dirname, 'supabase-data.js'), 'utf8');
  const url = src.match(/_SUPABASE_URL = '([^']+)'/)[1], key = src.match(/_SUPABASE_KEY = '([^']+)'/)[1];
  const table = src.match(/_client\.from\('([^']+)'\)/)[1];
  const rows = [];
  for (let i = 0; ; i++) {
    const res = await fetch(`${url}/rest/v1/${table}?select=brand,product,shade,finish,type,lab_l,lab_a,lab_b,hex,price_tier,discontinued,image_url&order=id`,
      { headers: { apikey: key, Range: `${i * 1000}-${i * 1000 + 999}` } });
    if (!res.ok) throw new Error(`catalogue fetch failed: ${res.status}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows.map(r => ({
    brand: r.brand, product: r.product || '', shade: r.shade || '', finish: (r.finish || '').trim(), format: r.type || '',
    lab: [r.lab_l, r.lab_a, r.lab_b], hex: (r.hex || '').toLowerCase(), tier: r.price_tier || '$$',
    discontinued: r.discontinued === '1' || r.discontinued === 1, imageUrl: r.image_url || '',
  }));
}

// Saves a product's photo as a square WebP and returns its address, or null when there is none
// Saves a product's photo as a square WebP in dir and returns its file name, or null when there is
// none. One already saved in either folder is reused (copied over when it is in the other one).
// The picker's candidates go in CANDIDATE_DIR, outside the site, so they aren't committed.
const CANDIDATE_DIR = path.join(__dirname, 'data-build', 'dupe-candidates');
const saving = new Map();
function savePhoto(p, px, dir) {
  if (!p.imageUrl) return null;
  const name = `${slug(`${p.brand} ${p.product} ${p.shade}`)}-${px}.webp`;
  const file = path.join(dir, name);
  if (!saving.has(file)) saving.set(file, (async () => {
    if (fs.existsSync(file)) return name;
    const other = path.join(dir === IMG_DIR ? CANDIDATE_DIR : IMG_DIR, name);
    if (fs.existsSync(other)) { fs.copyFileSync(other, file); return name; }
    try {
      const res = await fetch(p.imageUrl.replace(/^\/\//, 'https://'), { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`status ${res.status}`);
      await sharp(Buffer.from(await res.arrayBuffer())).flatten({ background: '#fff' })
        .resize(px, px, { fit: 'contain', background: '#fff' }).webp({ quality: 80 }).toFile(file);
      return name;
    } catch (err) {
      console.warn(`no image for ${p.brand} / ${p.shade}: ${err.message}`);
      return null;
    }
  })());
  return saving.get(file);
}
// A photo a page shows: its address on the site. used lists them, so unused ones can be removed.
const used = new Set();
async function image(p, px) {
  const name = await savePhoto(p, px, IMG_DIR);
  if (!name) return null;
  used.add(name);
  return `/dupe-finder/assets/${name}`;
}

// ── Share image ───────────────────────────────────────────────────────────────
const LIP_PATH = 'M1 34C8 20 20 3 34 3C42 3 46 9 50 12C54 9 58 3 66 3C80 3 92 20 99 34C82 33 66 30 50 32C34 30 18 33 1 34Z M2 37C18 38 34 37 50 38C66 37 82 38 98 37C90 56 72 68 50 68C28 68 10 56 2 37Z';
const shareName = s => `${slug(pageUrl(s).replace('/dupe-finder/', ''))}-share.png`;
async function shareImage(s, src, top, colors) {
  const brandLine = s.name.slice(0, s.name.length - s.short.length).trim();
  const x = (t, size, y, opts = '') => `<text x="80" y="${y}" font-size="${size}" ${opts}>${t}</text>`;
  // Long names shrink to stay clear of the lips (a serif letter averages about half its size in width)
  const fit = (t, size) => Math.min(size, Math.floor(560 / (t.length * 0.52)));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${colors.tint}"/>
  <g font-family="Georgia, 'Times New Roman', serif" fill="#2A1A14">
    ${x('LIPSTICK COLOR FINDER', 22, 112, `font-family="Helvetica, Arial, sans-serif" letter-spacing="4" fill="${TEXT_MID}"`)}
    ${x(esc(brandLine), fit(brandLine, 64), 250)}
    ${x(esc(s.short), fit(s.short, 84), 345)}
    ${x('dupes', 84, 440, `font-style="italic" fill="${colors.accent}"`)}
    ${x('Closest color matches, from drugstore to luxury', 26, 540, `font-family="Helvetica, Arial, sans-serif" fill="${TEXT_MID}"`)}
  </g>
  <g transform="translate(700 120) scale(4.2)"><path d="${LIP_PATH}" fill="${src.hex}"/></g>
  ${top.map((p, i) => `<circle cx="${738 + i * 82}" cy="480" r="32" fill="${p.hex}" stroke="${CREAM}" stroke-width="4"/>`).join('')}
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(IMG_DIR, shareName(s)));
  return `/dupe-finder/assets/${shareName(s)}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
// A card links to the finder, but the page's script opens it in place as a detail view (like a
// result card in the app); matchData is what that view shows, keyed by matchKey
const matchKey = p => slug(`${p.brand} ${p.shade}`);
const tierName = d => BANDS.find(([, hi], i) => d <= hi || i === BANDS.length - 1)[2];
// Dark or white text, whichever reads better on a color
const inkOn = hex => contrast(hex, '#2a1a14') >= contrast(hex, '#ffffff') ? '#2A1A14' : '#FFFFFF';
const dedupe = list => list.filter((p, i) => list.findIndex(q => matchKey(q) === matchKey(p)) === i);
function matchData(matches) {
  const out = {};
  for (const p of matches) out[matchKey(p)] = {
    brand: brandName(p.brand), shade: titleCase(p.shade), product: titleCase(p.product),
    img: p.big || p.img || '', alt: fullName(p), hex: p.hex, ink: inkOn(p.hex), tier: tierName(p.d),
    facts: [['Finish', p.finish || 'Unlisted'], ['Type', p.format], ['Price', p.tier]].filter(f => f[1]),
    dupes: finderUrl(p).replace(/&amp;/g, '&'),
    // as My Favorites in the app saves it
    save: { brand: p.brand, product: p.product, shade: p.shade, finish: p.finish, hex: p.hex },
  };
  return JSON.stringify(out).replace(/</g, '\\u003c');
}
const card = (s, src) => (p, i) => `
          <li><a class="card" href="${finderUrl(p)}" data-match="${matchKey(p)}">
            <span class="card-img">${p.img ? `<img src="${p.img}" alt="${esc(fullName(p))}" width="112" height="112" loading="lazy" decoding="async">` : ''}<span class="rank">${String(i + 1).padStart(2, '0')}</span></span>
            <span class="pair" role="img" aria-label="${esc(s.short)} color beside ${esc(titleCase(p.shade))} color"><span style="background:${src.hex}"></span><span style="background:${p.hex}"></span></span>
            <span class="card-body">
              <span class="card-brand">${esc(brandName(p.brand))}</span>
              <span class="card-shade">${esc(titleCase(p.shade))}</span>
              <span class="card-meta">${esc([titleCase(p.product), p.finish, FORMATS[p.format] || p.format, p.tier].filter(Boolean).join(' · '))}</span>
              <span class="card-de">${tierName(p.d)}</span>
            </span>
          </a></li>`;

// One dot per match on the ΔE scale; a dot too close to the one before it moves up a row
function scaleDots(matches) {
  const rows = [];
  const dots = [...matches].sort((a, b) => a.d - b.d).map(p => {
    const d = Math.min(p.d, SCALE_MAX);
    let r = rows.findIndex(last => d - last >= 0.2);
    if (r < 0) { r = rows.length; rows.push(d); } else rows[r] = d;
    return { p, d, r };
  });
  return { dots, rows: rows.length };
}

function page(s, src, srcImg, top, budget, listed, band, colors, shareImg) {
  const url = `${SITE}${pageUrl(s)}`;
  const title = `${s.name} Dupes & Closest Color Matches`;
  const description = `The lipsticks closest in color to ${s.name}, out of nearly 17,000, from drugstore to luxury. Closest first.`;
  const now = new Date(), today = now.toISOString().slice(0, 10);
  const updated = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const productLine = titleCase(src.product).replace(/\s+Lipstick$/, '');

  // Filters to try in the finder: only values that some match in its range has
  const count = key => { const n = new Map(); band.forEach(p => n.set(key(p), (n.get(key(p)) || 0) + 1)); return n; };
  const brands = [...count(p => p.brand)].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b]) => b);
  const finishes = FINISHES.filter(f => band.some(p => p.finish === f)).slice(0, 4);
  const formats = LISTED_FORMATS.filter(f => f !== 'Lip Crayon' && band.some(p => formatGroup(p.format) === f));
  const filterRows = [
    ['Brand', brands.map(b => [brandName(b), ['fbrand', b]])],
    ['Finish', finishes.map(f => [f, ['finish', f]])],
    ['Format', formats.map(f => [FORMAT_PILLS[f] || FORMATS[f], ['format', f]])],
  ].filter(([, pills]) => pills.length);

  const first = top[0];
  const cheaper = first && first.tier.length < src.tier.length;
  const faq = [
    ['Will a dupe look the same on me?', 'Color is only part of it. Finish and formula change how a shade reads on your lips, so a matte and a gloss in the same color can look different. Every match lists its finish and format so you can compare like with like.'],
    cheaper && [`Why is a ${first.tier === '$' ? 'drugstore' : 'cheaper'} ${FORMAT_NOUNS[first.format] || 'lipstick'} the top match?`,
      `Ranking uses measured color only, never price or brand. A ${first.tier} product can be the closest match to a ${src.tier} one.`],
    ['Is anything sponsored?', 'No. Nothing here is sponsored or hand-picked, and discontinued shades are left out.'],
  ].filter(Boolean);

  const seen = new Set();
  const { dots, rows } = scaleDots([...top, ...budget].filter(p => { const k = `${p.brand}|${p.shade}`; return !seen.has(k) && seen.add(k); }));

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': url, url, name: title, description, dateModified: today, inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'Lipstick Color Finder', url: `${SITE}/` } },
      { '@type': 'BreadcrumbList',
        itemListElement: [['Lipstick Color Finder', `${SITE}/`], ['Dupe finder', `${SITE}/dupe-finder/`], [`${s.name} dupes`, url]]
          .map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
      { '@type': 'ItemList', name: `Closest color matches to ${s.name}`, itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: listed.slice(0, 12).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: fullName(p), url: `${SITE}${finderUrl(p).replace(/&amp;/g, '&')}` })) },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  }).replace(/</g, '\\u003c');

  const grid = (heading, intro, items) => !items.length ? '' : `
    <section class="matches">
      <h2>${heading}</h2>
      <p class="sub">${intro}</p>
      <ol class="grid">${items.map(card(s, src)).join('')}
      </ol>
    </section>`;

  return `<!DOCTYPE html>
<!-- Generated by build-dupe-pages.js. Do not edit. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Lipstick Color Finder">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}${shareImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(s.name)} beside the colors of its closest dupes">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}${shareImg}">
<script type="application/ld+json">${jsonLd}</script>
<script src="/consent.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#FAF6F1;color:#2A1A14;font-family:'DM Sans',system-ui,sans-serif;--tint:${colors.tint};--tint-border:${colors.border};--accent:${colors.accent}}
a{color:#2A1A14;text-decoration:none}a:hover{color:#96455C}
:focus-visible{outline:2px solid #2A1A14;outline-offset:3px;border-radius:4px}
h1,h2,h3{margin:0;font-family:'Cormorant Garamond',serif;font-weight:300}
p{margin:0}
.u{text-decoration:underline;text-decoration-color:#C87890;text-underline-offset:3px}
.in{max-width:1200px;margin:0 auto;padding-left:56px;padding-right:56px}
.eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:500}
[data-lip]{-webkit-mask:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%2070%22%3E%3Cpath%20d%3D%22M1%2034C8%2020%2020%203%2034%203C42%203%2046%209%2050%2012C54%209%2058%203%2066%203C80%203%2092%2020%2099%2034C82%2033%2066%2030%2050%2032C34%2030%2018%2033%201%2034Z%20M2%2037C18%2038%2034%2037%2050%2038C66%2037%2082%2038%2098%2037C90%2056%2072%2068%2050%2068C28%2068%2010%2056%202%2037Z%22%2F%3E%3C%2Fsvg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%2070%22%3E%3Cpath%20d%3D%22M1%2034C8%2020%2020%203%2034%203C42%203%2046%209%2050%2012C54%209%2058%203%2066%203C80%203%2092%2020%2099%2034C82%2033%2066%2030%2050%2032C34%2030%2018%2033%201%2034Z%20M2%2037C18%2038%2034%2037%2050%2038C66%2037%2082%2038%2098%2037C90%2056%2072%2068%2050%2068C28%2068%2010%2056%202%2037Z%22%2F%3E%3C%2Fsvg%3E") center/contain no-repeat}

.tinted{background:var(--tint)}
.site-head{display:flex;align-items:center;flex-wrap:wrap;gap:12px 28px;padding-top:20px;padding-bottom:20px}
.tinted:first-child{border-bottom:1px solid var(--tint-border)}
.logo{font-size:13px;font-weight:500;letter-spacing:.16em;text-transform:uppercase}
.site-nav{margin-left:auto;display:flex;gap:28px;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
.site-nav a{color:#5C3D30}.site-nav a:hover{color:#96455C}
.site-nav a[aria-current]{color:#2A1A14;border-bottom:1.5px solid #2A1A14;padding-bottom:2px}

.hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:56px;align-items:center;padding-top:48px;padding-bottom:64px}
.hero-text{display:flex;flex-direction:column;gap:22px}
.crumbs{display:flex;flex-wrap:wrap;gap:8px;font-size:13px;color:#5C3D30}
.crumbs a{color:#5C3D30}.crumbs [aria-current]{color:#2A1A14}
h1{font-size:72px;line-height:.98;letter-spacing:-.015em;text-wrap:balance}
h1 em{font-weight:400;color:var(--accent)}
.lede{font-size:17px;line-height:1.6;color:#5C3D30;max-width:520px;text-wrap:pretty}
.trust{display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:12px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:#5C3D30}
.trust i{width:4px;height:4px;border-radius:50%;background:var(--accent)}
.original{background:#FAF6F1;border-radius:20px;padding:28px;display:flex;flex-direction:column;gap:20px;box-shadow:0 14px 40px rgba(110,50,40,.14)}
.original-img{position:relative;display:flex;align-items:center;justify-content:center;height:220px;background:#fff;border-radius:14px}
.original-img img{height:190px;width:auto;display:block}
.original-img [data-lip]{position:absolute;right:18px;bottom:16px;width:110px;aspect-ratio:10/7}
.has-swatch{justify-content:space-evenly;gap:8px;padding:0 12px}
.has-swatch img{height:170px;min-width:0}
.has-swatch .swatch{height:auto;width:52%;max-width:220px}
.original-text{display:flex;flex-direction:column;gap:6px}
.original-label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8C6858}
.original-name{font-family:'Cormorant Garamond',serif;font-size:28px;line-height:1.1}
.original-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;font-size:13px;color:#5C3D30}
.original-meta span{display:flex;align-items:center;gap:6px}
.chip{width:12px;height:12px;border-radius:3px}

.method{display:grid;grid-template-columns:220px repeat(3,minmax(0,1fr));gap:32px;align-items:start;padding-top:36px;padding-bottom:36px;border-bottom:1px solid #E0D0C4}
.method>div{display:flex;flex-direction:column;gap:6px}
.method .eyebrow{color:#96455C}
.method a{font-size:13px;margin-top:2px}
.num{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:22px;color:#8C6858}
.step{font-size:15px;font-weight:500}
.method p{font-size:14px;line-height:1.55;color:#5C3D30;text-wrap:pretty}

.matches{display:flex;flex-direction:column;gap:20px;padding-top:56px}
.matches+.matches{padding-top:64px}
.matches h2{font-size:40px;line-height:1.05}
.sub{font-size:14px;color:#5C3D30;margin-top:-12px}
.grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px}
.card{display:flex;flex-direction:column;height:100%;background:#fff;border:1px solid #E0D0C4;border-radius:14px;overflow:hidden;transition:border-color .15s,box-shadow .15s}
.card:hover{color:#2A1A14;border-color:#C87890;box-shadow:0 10px 28px rgba(42,26,20,.08)}
.card-img{position:relative;height:140px;display:flex;align-items:center;justify-content:center}
.card-img img{height:112px;width:auto;display:block}
.rank{position:absolute;left:12px;top:10px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:20px;color:#8C6858}
.pair{display:flex;height:44px}.pair span{flex:1}
.card-body{display:flex;flex-direction:column;gap:6px;padding:14px 16px 16px;flex:1}
.card-brand{font-size:13px;color:#5C3D30}
.card-shade{font-family:'Cormorant Garamond',serif;font-size:22px;line-height:1.1}
.card-meta{font-size:13px;line-height:1.5;color:#5C3D30}
.card-de{margin-top:auto;padding-top:6px;font-size:13px;font-weight:600;color:#B54A6A}

.cta-wrap{padding-top:56px}
.cta{background:#2A1A14;color:#FAF6F1;border-radius:20px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:48px;padding:44px 48px;align-items:center}
.cta-text{display:flex;flex-direction:column;gap:14px}
.cta .eyebrow{color:#E8B4C0;font-weight:400}
.cta h2{font-size:40px;line-height:1.05;text-wrap:balance}
.cta p{font-size:15px;line-height:1.6;color:#E6D6CC;text-wrap:pretty}
.button{align-self:flex-start;margin-top:8px;background:#FAF6F1;color:#2A1A14;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:15px 26px;border-radius:40px;transition:background .15s}
.button:hover{background:#E8B4C0;color:#2A1A14}
.filters{background:#3A261E;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:16px}
.filters>div{display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap}
.filters-label{width:64px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#C9B2A6}
.filters a{font-size:13px;color:#FAF6F1;padding:6px 12px;border-radius:30px;border:1px solid #6A4E42;transition:border-color .15s}
.filters a:hover{color:#FAF6F1;border-color:#E8B4C0}

.explain{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;padding-top:64px}
.scale-col{display:flex;flex-direction:column;gap:18px}
.explain h2{font-size:34px;line-height:1.05}
.scale-col>p{font-size:14px;line-height:1.6;color:#5C3D30;text-wrap:pretty}
.scale{position:relative}
.bar{display:flex;height:14px;border-radius:8px;overflow:hidden}
.dot{position:absolute;width:16px;height:16px;margin-left:-8px;border-radius:50%;border:2px solid #FAF6F1;box-shadow:0 0 0 1px #8C6858}
.bands{display:flex;margin-top:10px;font-size:12px;line-height:1.4;color:#5C3D30}
.bands b{font-weight:600;color:#2A1A14}
.faq{list-style:none;margin:0;padding:0;border-top:1px solid #2A1A14}
.faq li{display:flex;flex-direction:column;gap:8px;padding:20px 0;border-bottom:1px solid #E0D0C4}
.faq h3{font-weight:400;font-size:24px;line-height:1.15}
.faq p{font-size:14px;line-height:1.6;color:#5C3D30;text-wrap:pretty}

.more{display:flex;flex-direction:column;gap:18px;padding-top:64px;padding-bottom:56px}
.more-head{display:flex;align-items:center;gap:16px}
.more-head .eyebrow{color:#8C6858;font-weight:400;white-space:nowrap}
.more-head hr{flex:1;height:1px;border:0;margin:0;background:#E0D0C4}
.more-head a{font-size:13px;white-space:nowrap}
.shades{display:flex;flex-wrap:wrap;gap:10px}
.shades a{display:flex;align-items:center;gap:10px;padding:6px 16px 6px 6px;border-radius:30px;border:1.5px solid #E0D0C4;background:#fff;font-size:14px;transition:border-color .15s}
.shades a:hover{color:#2A1A14;border-color:#C87890}
.shades i{width:26px;height:26px;border-radius:50%}
.site-foot{border-top:1px solid #E0D0C4}
.site-foot .in{display:flex;flex-wrap:wrap;gap:8px 20px;padding-top:20px;padding-bottom:20px;font-size:13px;color:#5C3D30}
.site-foot a{color:#5C3D30}.site-foot a:first-child{margin-right:auto}

/* A match card opened up (like MatchDetail in the app): centered on desktop, a bottom sheet on phones */
html{scrollbar-gutter:stable}
body:has(.detail[open]){overflow:hidden}
.detail{width:min(520px,92vw);max-width:none;max-height:88vh;padding:0;border:0;border-radius:18px;background:#fff;color:#2A1A14;box-shadow:0 24px 60px rgba(42,26,20,.32);overflow-y:auto;overscroll-behavior:contain}
.detail[open]{animation:detailIn .2s ease}
.detail::backdrop{background:rgba(42,26,20,.48)}
@keyframes detailIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes detailUp{from{transform:translateY(100%)}to{transform:none}}
.detail-top{position:relative;display:flex;align-items:center;justify-content:center;height:44px}
.detail-handle{display:none;width:40px;height:4px;border-radius:2px;background:#E0D0C4}
.detail-close{position:absolute;right:6px;top:0;width:44px;height:44px;border:0;padding:0;background:none;color:#5C3D30;font:20px/1 'DM Sans',sans-serif;cursor:pointer}
.detail-body{display:flex;flex-direction:column;gap:16px;padding:2px 18px 22px}
.detail-head{display:flex;gap:14px;align-items:stretch}
.detail-photo{flex:none;width:160px;height:170px;border-radius:12px;background:#F0E8DF;display:flex;align-items:center;justify-content:center;overflow:hidden}
.detail-photo img{width:calc(100% - 16px);height:calc(100% - 16px);object-fit:contain;mix-blend-mode:multiply}
.detail-names{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:6px;overflow-wrap:anywhere}
.detail-brand{font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#5C3D30}
.detail-shade{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:28px;line-height:1.08}
.detail-product{font-size:15px;line-height:1.35;color:#3D2820}
.detail-strip{display:flex;gap:3px;height:64px;border-radius:12px;overflow:hidden;background:#fff}
.detail-strip span{flex:1;min-width:0;display:flex;align-items:flex-end;padding:8px 10px;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.detail-this{justify-content:flex-end}
.detail-match{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-top:8px}
.detail-tier{font-size:17px;font-weight:600;color:#B54A6A}
.detail-hex{font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#5C3D30}
.detail-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin:0}
.detail-facts div{background:#FAF6F1;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:3px}
.detail-facts dt{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5C3D30}
.detail-facts dd{margin:0;font-size:15px;font-weight:500}
.detail-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.detail-actions>*{height:48px;border-radius:24px;display:flex;align-items:center;justify-content:center;gap:8px;font:500 15px 'DM Sans',sans-serif;cursor:pointer}
.detail-save{background:#2A1A14;color:#FAF6F1;border:1px solid #2A1A14}
.detail-save.on{background:#B54A6A;border-color:#B54A6A}
.detail-dupes{background:#fff;color:#2A1A14;border:1px solid #2A1A14}
.detail-dupes:hover{color:#2A1A14;background:#FAF6F1}
@media (max-width:900px){
  .detail{width:100%;max-width:100%;margin:auto 0 0;border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(42,26,20,.22);padding-bottom:env(safe-area-inset-bottom)}
  .detail[open]{animation:detailUp .25s ease-out}
  .detail-handle{display:block}
  .detail-photo{width:124px;height:132px}
  .detail-save .long{display:none}
}

@media (prefers-reduced-motion:reduce){*{transition:none!important}.detail[open]{animation:none}}
@media (max-width:1100px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:900px){
  .hero{grid-template-columns:minmax(0,1fr);gap:36px;padding-top:32px;padding-bottom:48px}
  h1{font-size:44px}
  .method{grid-template-columns:minmax(0,1fr);gap:22px}
  .cta{grid-template-columns:minmax(0,1fr);gap:28px;padding:32px 28px}
  .explain{grid-template-columns:minmax(0,1fr);gap:40px}
}
@media (max-width:640px){.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
@media (max-width:540px){
  .in{padding-left:20px;padding-right:20px}
  .site-head{gap:10px 20px}
  .site-nav{margin-left:0;gap:20px}
  .original{padding:18px}
  .matches h2,.cta h2{font-size:32px}
  .card-img{height:120px}.card-img img{height:96px}
  .card-body{padding:12px 12px 14px}
  .card-shade{font-size:20px}
  .more-head{flex-wrap:wrap}.more-head hr{display:none}
}
</style>
</head>
<body>
<div class="tinted">
  <header class="in site-head">
    <a class="logo" href="/">Lipstick Color Finder</a>
    <nav class="site-nav" aria-label="Main"><a href="/dupe-finder/" aria-current="true">Dupe finder</a><a href="/guides/">Guides</a><a href="/about/">How it works</a></nav>
  </header>
</div>
<main>
  <div class="tinted">
    <div class="in hero">
      <div class="hero-text">
        <nav class="crumbs" aria-label="Breadcrumb"><a class="u" href="/dupe-finder/">Dupe finder</a><span aria-hidden="true">/</span><span>${esc(brandName(src.brand))}</span><span aria-hidden="true">/</span><span aria-current="page">${esc(s.short)}</span></nav>
        <h1>${esc(s.name)} <em>dupes</em></h1>
        <p class="lede">The lipsticks that look most like ${esc(s.short)}, out of over 24,000 we've measured. Ranked by color alone, from drugstore to luxury.</p>
        <p class="trust"><span>Not sponsored</span><i aria-hidden="true"></i><span>Measured from product photos</span><i aria-hidden="true"></i><span>Updated ${updated}</span></p>
      </div>
      <div class="original">
        <div class="original-img${s.swatch ? ' has-swatch' : ''}">${srcImg ? `
          <img src="${srcImg}" alt="${esc(fullName(src))}" width="190" height="190" fetchpriority="high">` : ''}${s.swatch ? `
          <img class="swatch" src="${s.swatch}" alt="${esc(`${s.name} swatch`)}" width="315" height="273">` : `
          <div data-lip aria-hidden="true" style="background:${src.hex}"></div>`}
        </div>
        <div class="original-text">
          <span class="original-label">The original</span>
          <span class="original-name">${esc([s.short, productLine].filter(Boolean).join(' · '))}</span>
          <div class="original-meta">${[src.finish, FORMATS[src.format] || src.format, src.tier, src.discontinued && 'Discontinued'].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join('')}<span><i class="chip" aria-hidden="true" style="background:${src.hex}"></i>Measured ${src.hex.toUpperCase()}</span></div>
        </div>
      </div>
    </div>
  </div>

  <section class="in method" aria-label="How we find dupes">
    <div><span class="eyebrow">How we find dupes</span><a class="u" href="/color-science/">Read the color science →</a></div>
    <div><span class="num" aria-hidden="true">01</span><span class="step">Measure</span><p>We isolate the lipstick in each product photo and read its true color, ignoring the packaging and the shade name.</p></div>
    <div><span class="num" aria-hidden="true">02</span><span class="step">Compare</span><p>Every shade is scored against ${esc(s.short)} by how different the two colors look to the eye.</p></div>
    <div><span class="num" aria-hidden="true">03</span><span class="step">Rank</span><p>Closest first. Nothing is hand-picked or paid for.</p></div>
  </section>

  <div class="in">
${grid(`Closest color matches to ${esc(s.short)}`, 'The 5 closest shades, any brand, any price.', top)}
${grid(`Closest ${esc(s.short)} dupes under $15`, 'The 5 closest matches in the drugstore price tier ($).', budget)}

    <div class="cta-wrap"><section class="cta">
      <div class="cta-text">
        <span class="eyebrow">Not quite the one?</span>
        <h2>See every ${esc(s.short)} match, filtered your way</h2>
        <p>This page shows the top 5 overall and under $15. The ${s.chartHex ? 'Color chart' : 'Dupe Finder'} has every match and lets you filter by finish, brand, format and price, save favorites, and compare shades side by side.</p>
        <a class="button" href="${allUrl(s, src)}">Filter all ${esc(s.short)} dupes →</a>
      </div>
      <div class="filters">${filterRows.map(([label, pills]) => `
        <div><span class="filters-label">${label}</span>${pills.map(([text, f]) => `<a href="${allUrl(s, src, [f])}">${esc(text)}</a>`).join('')}</div>`).join('')}
      </div>
    </section></div>

    <div class="explain">
      <section class="scale-col">
        <h2>How close is close?</h2>
        <p>Each dot is one match on this page, placed by how close its color is to ${esc(s.short)}.</p>
        <div class="scale" style="padding-top:${rows * 14 + 6}px">
          <div class="bar" aria-hidden="true">${BANDS.map(([lo, hi], i) => `<span style="flex:${hi - lo};background:${['#D9B7AE', '#E6CBC3', '#EFDDD7', '#F5ECE8'][i]}"></span>`).join('')}</div>${dots.map(({ p, d, r }) => `
          <span class="dot" aria-hidden="true" title="${esc(`${brandName(p.brand)} ${titleCase(p.shade)} · ${tierName(p.d)}`)}" style="left:${(d / SCALE_MAX * 100).toFixed(1)}%;top:${(rows - 1 - r) * 14}px;background:${p.hex}"></span>`).join('')}
          <div class="bands">${BANDS.map(([lo, hi, name]) => { const n = dots.filter(({ p }) => tierName(p.d) === name).length;
            return `<span style="flex:${hi - lo}"><b>${name}</b><br>${n ? `${n} ${n === 1 ? 'match' : 'matches'}` : 'None'}</span>`; }).join('')}</div>
        </div>
      </section>
      <section aria-label="Questions">
        <ul class="faq">${faq.map(([q, a]) => `
          <li><h3>${esc(q)}</h3><p>${esc(a)}</p></li>`).join('')}
        </ul>
      </section>
    </div>

    <nav class="more" aria-label="Dupes for other cult shades">
      <div class="more-head"><span class="eyebrow">Dupes for other cult shades</span><hr><a class="u" href="/dupe-finder/">Search any lipstick →</a></div>
      <div class="shades">${SHADES.filter(o => o !== s).map(o => `
        <a href="${pageUrl(o)}"><i aria-hidden="true" style="background:${o.hex}"></i>${esc(o.name)}</a>`).join('')}
      </div>
    </nav>
  </div>
</main>
<footer class="site-foot">
  <div class="in"><a href="/">Lipstick Color Finder</a><a href="/privacy/">Privacy</a><a href="https://www.pinterest.com/lipstickbycolor/" target="_blank" rel="noopener noreferrer">Pinterest</a><a href="https://www.instagram.com/lipstick.color.finder/" target="_blank" rel="noopener noreferrer">Instagram</a></div>
</footer>

<dialog class="detail">
  <div class="detail-top"><span class="detail-handle" aria-hidden="true"></span><button type="button" class="detail-close" aria-label="Close details">✕</button></div>
  <div class="detail-body">
    <div class="detail-head">
      <div class="detail-photo"><img alt="" width="240" height="240"></div>
      <div class="detail-names"><span class="detail-brand"></span><span class="detail-shade"></span><span class="detail-product"></span></div>
    </div>
    <div>
      <div class="detail-strip"><span class="detail-src" style="background:${src.hex};color:${inkOn(src.hex)}">${esc(s.short)}</span><span class="detail-this">This lipstick</span></div>
      <div class="detail-match"><span class="detail-tier"></span><span class="detail-hex"></span></div>
    </div>
    <dl class="detail-facts"></dl>
    <div class="detail-actions">
      <button type="button" class="detail-save" aria-pressed="false"><span class="heart" aria-hidden="true">♡</span><span class="label-off">Save<span class="long"> to My Favorites</span></span><span class="label-on" hidden>Saved</span></button>
      <a class="detail-dupes" href="/dupe-finder/">Find its dupes</a>
    </div>
  </div>
</dialog>
<script type="application/json" id="match-data">${matchData(dedupe([...top, ...budget]))}</script>
<script>
(() => {
  const dialog = document.querySelector('.detail');
  if (!dialog.showModal) return; // no dialog support: the cards stay links to the finder
  const data = JSON.parse(document.getElementById('match-data').textContent);
  const $ = sel => dialog.querySelector(sel);
  const KEY = 'lipstick-wishlist';
  const saved = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const same = (a, b) => a.brand === b.brand && a.shade === b.shade;
  let m;
  function showSaved() {
    const on = saved().some(x => same(x, m.save)), b = $('.detail-save');
    b.setAttribute('aria-pressed', on); b.classList.toggle('on', on);
    $('.heart').textContent = on ? '♥' : '♡';
    $('.label-off').hidden = on; $('.label-on').hidden = !on;
  }
  document.querySelectorAll('.card[data-match]').forEach(card => card.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // opening in a new tab still goes to the finder
    e.preventDefault();
    m = data[card.dataset.match];
    dialog.setAttribute('aria-label', m.brand + ' ' + m.shade + ' details');
    const img = $('.detail-photo img');
    img.src = m.img; img.alt = m.alt; img.hidden = !m.img;
    $('.detail-brand').textContent = m.brand;
    $('.detail-shade').textContent = m.shade;
    $('.detail-product').textContent = m.product;
    const swatch = $('.detail-this');
    swatch.style.background = m.hex; swatch.style.color = m.ink;
    $('.detail-tier').textContent = m.tier;
    $('.detail-hex').textContent = m.hex.toUpperCase();
    $('.detail-facts').replaceChildren(...m.facts.map(([label, value]) => {
      const box = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value; box.append(dt, dd); return box;
    }));
    $('.detail-dupes').href = m.dupes;
    showSaved();
    dialog.showModal();
    window.gtag?.('event', 'view_match_detail', { brand: m.save.brand, shade: m.save.shade, ui_source: 'dupe_page' });
  }));
  $('.detail-close').addEventListener('click', () => dialog.close());
  // A click on the backdrop lands on the dialog itself
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  $('.detail-save').addEventListener('click', () => {
    const list = saved(), has = list.some(x => same(x, m.save));
    try { localStorage.setItem(KEY, JSON.stringify(has ? list.filter(x => !same(x, m.save)) : [...list, m.save])); } catch (e) {}
    window.gtag?.('event', has ? 'remove_from_wishlist' : 'add_to_wishlist', { brand: m.save.brand, shade: m.save.shade });
    showSaved();
  });
})();
</script>
</body>
</html>
`;
}

// ── Picks ─────────────────────────────────────────────────────────────────────
// Which matches each page lists is chosen in the picker (npm run dupes:pick) and kept in
// dupe-picks.json, as 'brand|shade' per page and list. A page with no picks lists its 5 closest.
const PICKS_FILE = path.join(__dirname, 'dupe-picks.json');
const LISTED = 5, CANDIDATES = 10, PICK_PORT = 8081;
const pageKey = s => pageUrl(s).replace('/dupe-finder/', '').replace(/\/$/, '');
const productKey = p => `${p.brand}|${p.shade}`;
function readPicks() {
  try { return JSON.parse(fs.readFileSync(PICKS_FILE, 'utf8')); } catch { return {}; }
}
// The picked matches, closest first. A pick no longer in the catalogue (or no longer a match after
// a new dataset) is replaced by the closest one not picked, so the list keeps its length.
function choose(list, keys, where) {
  if (!keys) return list.slice(0, LISTED);
  const chosen = keys.map(k => list.find(p => productKey(p) === k)).filter(Boolean);
  if (chosen.length < keys.length) {
    console.warn(`${where}: ${keys.length - chosen.length} pick(s) no longer match; filled from the closest. Run npm run dupes:pick to check.`);
    for (const p of list) { if (chosen.length >= keys.length) break; if (!chosen.includes(p)) chosen.push(p); }
  }
  return chosen.sort((a, b) => a.d - b.d);
}

// ── Build ─────────────────────────────────────────────────────────────────────
// Everything about each shade that doesn't depend on the picks
async function prepare() {
  const products = await fetchCatalogue();
  const tidy = p => p.shade && p.shade.length <= 40 && !p.shade.includes('|') && p.hex
    && !SKIP_FORMATS.includes(p.format) && !SKIP.includes(`${p.brand}|${p.product}|${p.shade}`);

  // Find every original first: each page links the others with their measured color
  // A shade with chartHex uses that color instead of the catalogue's
  const found = SHADES.map(s => {
    let src = products.find(p => p.brand === s.brand && p.shade === s.shade && (!s.product || p.product === s.product));
    if (!src) console.warn(`skipped ${s.name}: not in the catalogue as "${s.brand}" / "${s.shade}"`);
    else {
      if (s.chartHex) src = { ...src, hex: s.chartHex.toLowerCase(), lab: utils.hexToLab(s.chartHex) };
      s.hex = src.hex;
    }
    return [s, src];
  }).filter(([, src]) => src);

  return found.map(([s, src]) => {
    // Nearest first; the same shade sold in several product lines counts once
    const seen = new Set([productKey(src)]);
    // The brand's own variants of the shade ("Pillow Talk Medium", kits) aren't dupes of it
    const ranked = products.filter(p => !p.discontinued && tidy(p) && !(p.brand === src.brand && p.shade.includes(src.shade)))
      .map(p => ({ ...p, d: utils.deltaE(src.lab, p.lab) })).sort((a, b) => a.d - b.d)
      .filter(p => { const k = productKey(p); if (seen.has(k)) return false; seen.add(k); return true; });
    // What the page's two lists can show
    const finishes = SIMILAR_FINISHES[src.finish];
    const listed = ranked.filter(p => LISTED_FORMATS.includes(p.format) && (!finishes || finishes.includes(p.finish))
      && !(s.skip || []).includes(productKey(p)));
    const budgetAll = listed.filter(p => p.tier === '$');
    // Where the "filter all" links lead, and how far from the shade that page's results reach.
    // The finder measures its margin from the closest of every other lipstick, discontinued ones and
    // the brand's own variants included, so its cut-off can sit lower than this page's closest match.
    // The color chart (for a chartHex) reaches a fixed distance, or a little past the closest lipstick.
    // Both measure from a rounded color, so a match right at the edge is left out here.
    const closest = Math.min(...products.filter(p => s.chartHex || productKey(p) !== productKey(src)).map(p => utils.deltaE(src.lab, p.lab)));
    const cut = s.chartHex ? Math.max(CHART_RADIUS, closest + CHART_SPARSE) : closest + FINDER_MARGIN;
    const band = ranked.filter(p => p.d <= cut - 0.1);
    return { s, src, listed, budgetAll, band };
  });
}

async function writePages(shades, picks) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  used.clear();
  const written = [];
  for (const { s, src, listed, budgetAll, band } of shades) {
    const pick = picks[pageKey(s)] || {};
    const top = choose(listed, pick.top, `${s.name}, closest`), budget = choose(budgetAll, pick.budget, `${s.name}, under $15`);
    // The cards' photos, and larger ones for the detail view
    await Promise.all([...top, ...budget].map(async p => { p.img = await image(p, THUMB); p.big = await image(p, SOURCE_IMG); }));
    const colors = pageColors(src.hex);
    const shareImg = await shareImage(s, src, top, colors);
    const html = page(s, src, await image(src, SOURCE_IMG), top, budget, listed, band, colors, shareImg);
    const dir = path.join(__dirname, pageUrl(s));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    written.push(s);
    console.log(`wrote ${pageUrl(s).slice(1)}index.html (${src.finish || 'no finish'}, closest ΔE ${top[0] ? top[0].d.toFixed(1) : '–'}, ${budget.length} under $15)`);
  }

  // Drop thumbnails and share images no page shows any more (only when every page was rewritten)
  if (written.length === SHADES.length) {
    const shares = new Set(SHADES.map(shareName));
    SHADES.forEach(s => s.swatch && used.add(path.basename(s.swatch)));
    for (const f of fs.readdirSync(IMG_DIR)) {
      if ((f.endsWith('.webp') && !used.has(f)) || (f.endsWith('-share.png') && !shares.has(f))) fs.unlinkSync(path.join(IMG_DIR, f));
    }
  }

  // List the pages in the sitemap, with today as the date they last changed
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  for (const s of written) {
    const loc = `${SITE}${pageUrl(s)}`;
    if (sitemap.includes(`<loc>${loc}</loc>`)) {
      sitemap = sitemap.replace(new RegExp(`(<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>\\s*<lastmod>)[^<]*`), `$1${today}`);
      continue;
    }
    sitemap = sitemap.replace('</urlset>', `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`);
  }
  fs.writeFileSync(sitemapPath, sitemap);
}

// ── Picker ────────────────────────────────────────────────────────────────────
// npm run dupes:pick serves a page at localhost:8081 with each shade's 10 closest candidates for
// both lists. Pick up to 5 in each and save: the picks go in dupe-picks.json and the pages are rebuilt.
function pickerPage(cands, picks) {
  const cardHtml = (src, list, keys) => (p, i) => `
        <button type="button" class="c" data-list="${list}" data-key="${esc(productKey(p))}" aria-pressed="${keys.includes(productKey(p))}">
          <span class="ci">${p.thumb ? `<img src="/img/${p.thumb}" alt="" width="96" height="96">` : '<span class="none">No photo</span>'}<span class="r">${String(i + 1).padStart(2, '0')}</span><span class="tick" aria-hidden="true">✓</span></span>
          <span class="pr"><span style="background:${src.hex}"></span><span style="background:${p.hex}"></span></span>
          <span class="cb"><span class="b">${esc(brandName(p.brand))}</span><span class="s">${esc(titleCase(p.shade))}</span>
          <span class="m">${esc([titleCase(p.product), p.finish, FORMATS[p.format] || p.format, p.tier].filter(Boolean).join(' · '))}</span>
          <span class="d">ΔE ${p.d.toFixed(1)}</span></span>
        </button>`;
  const block = (src, list, title, items, keys) => `
      <div class="list" data-list="${list}">
        <h3>${title} <span class="count"></span></h3>
        ${items.length ? `<div class="grid">${items.map(cardHtml(src, list, keys)).join('')}</div>` : '<p class="empty">No candidates.</p>'}
      </div>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dupe picks</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;background:#FAF6F1;color:#2A1A14;font-family:'DM Sans',system-ui,sans-serif;padding-bottom:90px}
.in{max-width:1240px;margin:0 auto;padding:0 32px}
header{padding:32px 0 8px}h1{margin:0;font-family:'Cormorant Garamond',serif;font-weight:400;font-size:44px}
header p{margin:8px 0 0;font-size:15px;line-height:1.6;color:#5C3D30;max-width:760px}
.jump{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.jump a{font-size:13px;color:#2A1A14;padding:6px 12px;border:1px solid #E0D0C4;border-radius:30px;background:#fff;text-decoration:none}
section{padding-top:40px;border-bottom:1px solid #E0D0C4;padding-bottom:32px}
h2{display:flex;align-items:center;gap:12px;margin:0;font-family:'Cormorant Garamond',serif;font-weight:400;font-size:32px}
h2 i{width:28px;height:28px;border-radius:50%}h2 a{margin-left:auto;font:500 13px 'DM Sans',sans-serif;color:#96455C}
h3{margin:24px 0 10px;font-size:15px;font-weight:600}.count{font-weight:400;color:#5C3D30;margin-left:6px}.count.full{color:#2A1A14;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.c{display:flex;flex-direction:column;padding:0;text-align:left;background:#fff;border:2px solid #E0D0C4;border-radius:12px;overflow:hidden;cursor:pointer;font:inherit;color:inherit}
.c:hover{border-color:#C87890}.c[aria-pressed=true]{border-color:#2A1A14;box-shadow:0 0 0 2px #2A1A14}
.c:disabled{cursor:not-allowed;opacity:.45}
.ci{position:relative;height:104px;display:flex;align-items:center;justify-content:center}.ci img{height:96px;width:auto}
.none{font-size:12px;color:#8C6858}
.r{position:absolute;left:8px;top:6px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:#8C6858}
.tick{position:absolute;right:8px;top:8px;width:24px;height:24px;border-radius:50%;background:#2A1A14;color:#fff;font-size:14px;display:none;align-items:center;justify-content:center}
.c[aria-pressed=true] .tick{display:flex}
.pr{display:flex;height:22px}.pr span{flex:1}
.cb{display:flex;flex-direction:column;gap:3px;padding:8px 10px 10px}
.b{font-size:12px;color:#5C3D30}.s{font-family:'Cormorant Garamond',serif;font-size:19px;line-height:1.1}.m{font-size:12px;line-height:1.4;color:#5C3D30}.d{font-size:12px;font-weight:600;margin-top:2px}
.empty{font-size:14px;color:#5C3D30}
.bar{position:fixed;left:0;right:0;bottom:0;background:#2A1A14;color:#FAF6F1}
.bar .in{display:flex;align-items:center;gap:16px;padding-top:14px;padding-bottom:14px}
#status{font-size:14px;margin-right:auto}
#save{background:#FAF6F1;color:#2A1A14;border:0;border-radius:30px;padding:13px 24px;font:600 13px 'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
#save:disabled{opacity:.6;cursor:wait}
@media (max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.in{padding:0 16px}}
</style></head><body>
<div class="in">
  <header>
    <h1>Dupe picks</h1>
    <p>Each shade's 10 closest matches, for each list on its page. Pick up to ${LISTED} in each list, then save: the picks go in dupe-picks.json and every page is rebuilt. Look at them on <a href="http://localhost:8080/dupe-finder/" target="_blank">localhost:8080</a>. Lists without picks show the ${LISTED} closest.</p>
    <nav class="jump">${cands.map(({ s }) => `<a href="#${pageKey(s).replace('/', '-')}">${esc(s.name)}</a>`).join('')}</nav>
  </header>
${cands.map(({ s, src, top, budget }) => {
    const pick = picks[pageKey(s)] || {};
    const keys = (list, saved) => saved || list.slice(0, LISTED).map(productKey);
    return `  <section id="${pageKey(s).replace('/', '-')}" data-page="${pageKey(s)}">
    <h2><i style="background:${src.hex}"></i>${esc(s.name)}<a href="http://localhost:8080${pageUrl(s)}" target="_blank">Open page →</a></h2>${block(src, 'top', 'Closest color matches', top, keys(top, pick.top))}${block(src, 'budget', 'Under $15', budget, keys(budget, pick.budget))}
  </section>`;
  }).join('\n')}
</div>
<div class="bar"><div class="in"><span id="status">Pick up to ${LISTED} in each list.</span><button type="button" id="save">Save picks and rebuild</button></div></div>
<script>
const MAX = ${LISTED};
function update(list) {
  const on = list.querySelectorAll('.c[aria-pressed=true]').length, total = list.querySelectorAll('.c').length;
  const count = list.querySelector('.count');
  if (count) { count.textContent = on + ' of ' + Math.min(MAX, total) + ' picked'; count.classList.toggle('full', on === Math.min(MAX, total)); }
  list.querySelectorAll('.c').forEach(c => { c.disabled = on >= MAX && c.getAttribute('aria-pressed') !== 'true'; });
}
document.querySelectorAll('.list').forEach(list => {
  update(list);
  list.addEventListener('click', e => {
    const c = e.target.closest('.c'); if (!c || c.disabled) return;
    c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true');
    update(list);
    document.getElementById('status').textContent = 'Not saved yet.';
  });
});
document.getElementById('save').addEventListener('click', async () => {
  const picks = {};
  document.querySelectorAll('section[data-page]').forEach(sec => {
    const keys = list => [...sec.querySelectorAll('.list[data-list=' + list + '] .c[aria-pressed=true]')].map(c => c.dataset.key);
    picks[sec.dataset.page] = { top: keys('top'), budget: keys('budget') };
  });
  const btn = document.getElementById('save'), status = document.getElementById('status');
  btn.disabled = true; status.textContent = 'Saving and rebuilding the pages…';
  try {
    const res = await fetch('/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(picks) });
    const out = await res.json();
    status.textContent = res.ok ? 'Saved. ' + out.pages + ' pages rebuilt.' : 'Not saved: ' + out.error;
  } catch (e) { status.textContent = 'Not saved: ' + e.message; }
  btn.disabled = false;
});
</script>
</body></html>`;
}

async function pickServer(shades) {
  fs.mkdirSync(CANDIDATE_DIR, { recursive: true });
  const cands = shades.map(sh => ({ ...sh, top: sh.listed.slice(0, CANDIDATES), budget: sh.budgetAll.slice(0, CANDIDATES) }));
  console.log('saving candidate photos…');
  await Promise.all(cands.flatMap(c => [...c.top, ...c.budget]).map(async p => { p.thumb = await savePhoto(p, THUMB, CANDIDATE_DIR); }));
  const http = require('http');
  let busy = false;
  http.createServer(async (req, res) => {
    const json = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(pickerPage(cands, readPicks()));
    }
    if (req.method === 'GET' && req.url.startsWith('/img/')) {
      const name = path.basename(decodeURIComponent(req.url.slice(5)));
      const file = [CANDIDATE_DIR, IMG_DIR].map(d => path.join(d, name)).find(f => fs.existsSync(f));
      if (!file) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/webp' });
      return fs.createReadStream(file).pipe(res);
    }
    if (req.method === 'POST' && req.url === '/save') {
      if (busy) return json(409, { error: 'still saving the last picks' });
      let body = '';
      for await (const chunk of req) body += chunk;
      busy = true;
      try {
        const sent = JSON.parse(body), picks = {};
        for (const { s } of cands) {
          const p = sent[pageKey(s)];
          if (!p) continue;
          const keys = v => (Array.isArray(v) ? v : []).filter(k => typeof k === 'string').slice(0, LISTED);
          picks[pageKey(s)] = { top: keys(p.top), budget: keys(p.budget) };
        }
        fs.writeFileSync(PICKS_FILE, JSON.stringify(picks, null, 2) + '\n');
        await writePages(shades, picks);
        json(200, { pages: shades.length });
      } catch (err) {
        console.error(err);
        json(500, { error: err.message });
      } finally { busy = false; }
      return;
    }
    res.writeHead(404); res.end();
  }).listen(PICK_PORT, () => console.log(`Pick the matches at http://localhost:${PICK_PORT} (Ctrl+C to stop)`));
}

(async () => {
  const shades = await prepare();
  if (process.argv.includes('--pick')) await pickServer(shades);
  else await writePages(shades, readPicks());
})().catch(err => { console.error(err); process.exit(1); });
