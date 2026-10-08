// Writes one page per popular shade at /dupe-finder/<brand>/<shade>/: the shade,
// its closest color matches, and cheaper alternatives, all from the live catalogue.
// Needs the network, so it is run on its own:
//   npm run build:dupes
// Add a shade to SHADES to give it a page. Keep the list short and hand-picked:
// each page should be a shade people really search for. Don't edit the generated pages.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://lipstickbycolor.github.io';

// brand and shade exactly as the catalogue has them (lowercase); name is how to print it.
// product picks one line when a shade is sold in several; brandSlug shortens the address.
const SHADES = [
  { brand:'chanel', shade:'99 pirate', name:'Chanel 99 Pirate' },
  { brand:'chanel', shade:'49 ever red', name:'Chanel 49 Ever Red' },
  { brand:'dior', shade:'100 forever nude look', name:'Dior 100 Forever Nude Look' },
  { brand:'dior', shade:'422 rose des vents', name:'Dior 422 Rose des Vents' },
  { brand:'dior', shade:'670 rose blues', name:'Dior 670 Rose Blues' },
  { brand:'mac cosmetics', shade:'ruby woo', product:'retro matte lipstick', name:'MAC Ruby Woo', brandSlug:'mac' },
  { brand:'charlotte tilbury', shade:'pillow talk', product:'matte revolution lipstick', name:'Charlotte Tilbury Pillow Talk' },
  { brand:'pat mcgrath labs', shade:'elson 4', name:'Pat McGrath Labs Elson 4', brandSlug:'pat-mcgrath' },
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

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const titleCase = s => s.replace(/(^|[\s\-/(])([a-zà-ÿ])/g, (m, pre, ch) => pre + ch.toUpperCase());
// Small joining words stay lowercase: "Makeup by Mario", "Dose of Colors"
const brandName = b => BRAND_NAMES[b] || titleCase(b).replace(/(?<=\s)(Of|By|De|And|The|For)(?=\s)/g, w => w.toLowerCase());
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pageUrl = s => `/dupe-finder/${s.brandSlug || slug(s.brand)}/${slug(s.shade)}/`;
const finderUrl = p => `/dupe-finder/?brand=${encodeURIComponent(p.brand)}&amp;dupe=${encodeURIComponent(p.shade)}`;

const utils = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, 'lipstick-utils.js'), 'utf8') + '\n;({ deltaE })', {});

async function fetchCatalogue() {
  const src = fs.readFileSync(path.join(__dirname, 'supabase-data.js'), 'utf8');
  const url = src.match(/_SUPABASE_URL = '([^']+)'/)[1], key = src.match(/_SUPABASE_KEY = '([^']+)'/)[1];
  const table = src.match(/_client\.from\('([^']+)'\)/)[1];
  const rows = [];
  for (let i = 0; ; i++) {
    const res = await fetch(`${url}/rest/v1/${table}?select=brand,product,shade,finish,type,lab_l,lab_a,lab_b,hex,price_tier,discontinued&order=id`,
      { headers: { apikey: key, Range: `${i * 1000}-${i * 1000 + 999}` } });
    if (!res.ok) throw new Error(`catalogue fetch failed: ${res.status}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows.map(r => ({
    brand: r.brand, product: r.product || '', shade: r.shade || '', finish: (r.finish || '').trim(), format: r.type || '',
    lab: [r.lab_l, r.lab_a, r.lab_b], hex: (r.hex || '').toLowerCase(), tier: r.price_tier || '$$',
    discontinued: r.discontinued === '1' || r.discontinued === 1,
  }));
}

const row = p => `
        <li>
          <span class="dot" style="background:${p.hex}"></span>
          <span class="who">
            <a href="${finderUrl(p)}">${esc(brandName(p.brand))} · ${esc(titleCase(p.shade))}</a>
            <span class="what">${esc([titleCase(p.product), p.finish, p.format, p.tier].filter(Boolean).join(' · '))}</span>
          </span>
          <span class="de" title="Color difference from the original; lower is closer">ΔE ${p.d.toFixed(1)}</span>
        </li>`;

function page(s, src, closest, budget, mid, others) {
  const url = `${SITE}${pageUrl(s)}`;
  const title = `${s.name} Dupes & Closest Color Matches`;
  const description = `The closest color matches to ${s.name} from nearly 17,000 lip products, ranked by measured color difference, with cheaper alternatives at every price.`;
  const facts = [titleCase(src.product), src.finish, src.format, src.tier, src.discontinued && 'Discontinued'].filter(Boolean);
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [['Lipstick Color Finder', `${SITE}/`], ['Dupe finder', `${SITE}/dupe-finder/`], [`${s.name} dupes`, url]]
      .map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  });
  const list = (heading, intro, items) => !items.length ? '' : `
    <section class="block">
      <h2>${heading}</h2>
      <p class="block-intro">${intro}</p>
      <ol class="matches">${items.map(row).join('')}
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
<meta property="og:image" content="${SITE}/assets/share-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Lipstick Color Finder: find lipstick by color, with rows of lips in every color of the rainbow">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/assets/share-card.png">
<script type="application/ld+json">${jsonLd}</script>
<script src="/consent.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#FAF6F1;color:#2A1A14;font-family:'DM Sans',system-ui,sans-serif}
a{color:#B54A6A}a:hover{color:#2A1A14}
.wrap{max-width:860px;margin:0 auto;padding:0 clamp(18px,5vw,32px)}
.top{display:flex;align-items:center;gap:8px 24px;flex-wrap:wrap;padding-top:14px}
.top a{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5C3D30;text-decoration:none;padding:14px 0}
.top a:hover{color:#2A1A14}
.top a:first-child{margin-right:auto}
.eyebrow{margin:48px 0 14px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#B54A6A;font-weight:500}
h1{margin:0;font-family:'Cormorant Garamond',serif;font-weight:300;font-size:clamp(40px,6.5vw,68px);line-height:1;letter-spacing:-.015em}
.lede{margin:20px 0 0;font-size:17px;line-height:1.7;color:#5C3D30;max-width:620px}
.source{display:flex;align-items:stretch;margin-top:30px;background:#fff;border:1px solid #E0D0C4;border-radius:16px;overflow:hidden}
.source-swatch{flex:0 0 120px;min-height:120px}
.source-body{padding:18px 20px;display:flex;flex-direction:column;justify-content:center;gap:6px}
.source-name{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:26px;line-height:1.15}
.source-facts{font-size:14px;line-height:1.5;color:#3D2820}
.source-hex{font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#5C3D30}
.cta{display:inline-block;margin-top:26px;background:#2A1A14;color:#FAF6F1;text-decoration:none;font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;padding:14px 22px;border-radius:40px}
.cta:hover{background:#B54A6A;color:#fff}
.block{padding-top:60px}
h2{margin:0;font-family:'Cormorant Garamond',serif;font-weight:400;font-size:clamp(28px,4vw,36px);line-height:1.15}
.block-intro{margin:10px 0 0;font-size:15px;line-height:1.7;color:#3D2820;max-width:620px}
.matches{list-style:none;margin:22px 0 0;padding:0;background:#fff;border:1px solid #E0D0C4;border-radius:16px;overflow:hidden}
.matches li{display:flex;align-items:center;gap:14px;padding:13px 18px;border-top:1px solid #F0E8DF}
.matches li:first-child{border-top:none}
.dot{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid rgba(42,26,20,.08)}
.who{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.who a{font-size:15px;color:#2A1A14;text-decoration:none;font-weight:500}
.who a:hover{color:#B54A6A}
.what{font-size:13px;line-height:1.4;color:#5C3D30}
.de{flex:none;font-size:13px;color:#3D2820;white-space:nowrap}
.notes{padding:60px 0 0;max-width:680px}
.notes h3{margin:26px 0 0;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:21px;line-height:1.3}
.notes p{font-size:15px;line-height:1.7;color:#3D2820;margin:10px 0 0}
.more{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.more a{padding:8px 15px;border:1px solid #E0D0C4;border-radius:22px;background:#fff;color:#2A1A14;text-decoration:none;font-size:13px}
.more a:hover{border-color:#C87890}
.foot{padding:36px 0 48px;font-size:12px}
.foot a{color:#5C3D30}
@media (max-width:540px){.top a:first-child{flex-basis:100%;padding-bottom:0}.source-swatch{flex-basis:84px}.matches li{padding:12px 14px;gap:12px}.dot{width:28px;height:28px}}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a href="/">← Lipstick Color Finder</a>
    <a href="/dupe-finder/">Dupe finder</a>
    <a href="/guides/">Guides</a>
  </header>

  <p class="eyebrow">Dupe finder</p>
  <h1>${esc(s.name)} dupes</h1>
  <p class="lede">The lipsticks whose measured color is closest to ${esc(s.name)}, out of nearly 17,000 lip products, closest first.</p>

  <div class="source">
    <div class="source-swatch" style="background:${src.hex}"></div>
    <div class="source-body">
      <span class="source-name">${esc(s.name)}</span>
      <span class="source-facts">${esc(facts.join(' · '))}</span>
      <span class="source-hex">Measured color ${src.hex.toUpperCase()}</span>
    </div>
  </div>
  <a class="cta" href="${finderUrl(src)}">Open in the dupe finder to filter →</a>
${list(`Closest matches to ${esc(s.name)}`, 'Any brand, any price. ΔE is the measured color difference from the original: the lower the number, the closer the match.', closest)}
${list(`Budget dupes for ${esc(s.name)}`, 'The closest matches in the lowest price tier ($).', budget)}
${list('Mid-priced alternatives', 'The closest matches one tier up ($$).', mid)}

  <section class="notes">
    <h2>About these matches</h2>
    <h3>How are the dupes chosen?</h3>
    <p>Every lipstick's color is measured from its product images, and matches are ranked by ΔE (Delta E), a standard measure of how different two colors look to the eye. Nothing here is sponsored or hand-picked. <a href="/color-science/">Color science</a> explains the measurement.</p>
    <h3>Will a dupe look the same on me?</h3>
    <p>Color is only part of it. Finish and formula change how a shade looks on your lips, so a matte and a gloss in the same color can read differently. Each match lists its finish and format so you can compare like with like. Discontinued shades are left out.</p>
    <h3>More popular shades</h3>
    <p class="more">${others.map(o => `
      <a href="${pageUrl(o)}">${esc(o.name)} dupes</a>`).join('')}
      <a href="/dupe-finder/">Find dupes for any lipstick</a>
    </p>
  </section>
  <p class="foot"><a href="/privacy/">Privacy</a></p>
</div>
</body>
</html>
`;
}

(async () => {
  const products = await fetchCatalogue();
  const tidy = p => p.shade && p.shade.length <= 40 && !p.shade.includes('|') && p.hex;
  const written = [];
  for (const s of SHADES) {
    const src = products.find(p => p.brand === s.brand && p.shade === s.shade && (!s.product || p.product === s.product));
    if (!src) { console.warn(`skipped ${s.name}: not in the catalogue as "${s.brand}" / "${s.shade}"`); continue; }
    // Nearest first; the same shade sold in several product lines counts once
    const seen = new Set([`${src.brand}|${src.shade}`]);
    // The brand's own variants of the shade ("Pillow Talk Medium", kits) aren't dupes of it
    const ranked = products.filter(p => !p.discontinued && tidy(p) && !(p.brand === src.brand && p.shade.includes(src.shade)))
      .map(p => ({ ...p, d: utils.deltaE(src.lab, p.lab) })).sort((a, b) => a.d - b.d)
      .filter(p => { const k = `${p.brand}|${p.shade}`; if (seen.has(k)) return false; seen.add(k); return true; });
    const html = page(s, src, ranked.slice(0, 12), ranked.filter(p => p.tier === '$').slice(0, 6), ranked.filter(p => p.tier === '$$').slice(0, 6), SHADES.filter(o => o !== s));
    const dir = path.join(__dirname, pageUrl(s));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    written.push(s);
    console.log(`wrote ${pageUrl(s).slice(1)}index.html (closest ΔE ${ranked[0].d.toFixed(1)})`);
  }

  // List the pages in the sitemap
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  for (const s of written) {
    const loc = `${SITE}${pageUrl(s)}`;
    if (sitemap.includes(`<loc>${loc}</loc>`)) continue;
    sitemap = sitemap.replace('</urlset>', `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`);
  }
  fs.writeFileSync(sitemapPath, sitemap);
})().catch(err => { console.error(err); process.exit(1); });
