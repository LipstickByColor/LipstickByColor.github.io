// Writes /lipstick-color-chart/: every wheel color with its hex code, how many
// catalogue lipsticks sit nearest to it, and a few real shades close to it.
// Reads the live catalogue, so it needs the network and is run on its own:
//   npm run build:chart
// Edit the copy and families here. Don't edit the generated page.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://lipstickbycolor.github.io';
const TITLE = 'Lipstick Color Chart: Shades & Hex Codes';
const DESCRIPTION = 'Explore lipstick colors from 16,794 measured shades. Browse red, pink, nude, berry and other lipstick colors with representative hex values and real products.';

// Wheel colors by family, in reading order (light to deep within a family)
const FAMILIES = [
  { id:'red', name:'Red lipstick colors',
    blurb:'From bright poppy and tomato to deep oxblood. The <a href="/guides/red-lipstick/">red lipstick guide</a> goes through these one by one.',
    colors:['Poppy','Vermilion','Signal Red','Raspberry Red','Classic Red','Tomato','Cherry','Ruby','Scarlet','Black Cherry','Oxblood','Brick'] },
  { id:'pink', name:'Pink lipstick colors',
    blurb:'Pale ballet pinks through to hot magenta.',
    colors:['Ballet','Flamingo','Bubblegum','Rosy Pink','Tea Rose','Cerise','Azalea','Raspberry Sorbet','Magenta','Hot Magenta'] },
  { id:'coral', name:'Coral and peach lipstick colors',
    blurb:'Warm, orange-leaning shades.',
    colors:['Apricot','Burnt Coral','Coral','Carnelian'] },
  { id:'rose', name:'Rose lipstick colors',
    blurb:'Muted, everyday pinks that sit between nude and berry.',
    colors:['Old Rose','Faded Rose','Dusty Cedar','Rosewood','Holly Berry','Rose Wine'] },
  { id:'nude', name:'Nude and brown lipstick colors',
    blurb:'Beige and clay nudes through to deep browns.',
    colors:['Rose Dawn','Canyon Clay','Terracotta','Nude Rose','Sable','Espresso'] },
  { id:'berry', name:'Berry and wine lipstick colors',
    blurb:'Cool raspberries, mauves, and dark wines.',
    colors:['Mauve','Deep Raspberry','Dark Rose','Burgundy','Syrah','Dark Wine'] },
  { id:'dark', name:'Black and grey lipstick colors',
    blurb:'The far edge of the chart.',
    colors:['Charcoal','Onyx'] },
];

// Example shades come from widely sold brands so the names are recognisable.
// Catalogue brand (lowercase) -> how to print it.
const BRANDS = {
  'mac cosmetics':'MAC', 'chanel':'Chanel', 'dior':'Dior', 'nars':'NARS', 'maybelline':'Maybelline', 'revlon':'Revlon',
  'l oreal':"L'Oréal", 'nyx professional makeup':'NYX', 'charlotte tilbury':'Charlotte Tilbury',
  'fenty beauty by rihanna':'Fenty Beauty', 'rare beauty':'Rare Beauty', 'yves saint laurent':'Yves Saint Laurent',
  'tom ford':'Tom Ford', 'lancome':'Lancôme', 'estee lauder':'Estée Lauder', 'clinique':'Clinique',
  'bobbi brown':'Bobbi Brown', 'urban decay':'Urban Decay', 'too faced':'Too Faced', 'huda beauty':'Huda Beauty',
  'pat mcgrath labs':'Pat McGrath Labs', 'e.l.f. cosmetics':'e.l.f.', 'covergirl':'CoverGirl', 'milani':'Milani',
  'colourpop':'ColourPop', 'givenchy':'Givenchy', 'armani beauty':'Armani Beauty', 'gucci':'Gucci', 'hermes':'Hermès',
  'guerlain':'Guerlain', 'sephora collection':'Sephora Collection', 'anastasia beverly hills':'Anastasia Beverly Hills',
  'rimmel':'Rimmel', 'wet n wild':'Wet n Wild', 'hourglass':'Hourglass', 'laura mercier':'Laura Mercier',
  'shiseido':'Shiseido', 'valentino':'Valentino', 'kiko milano':'Kiko Milano', 'makeup by mario':'Makeup by Mario',
  'merit':'Merit', 'ilia':'Ilia', 'tarte':'Tarte', 'smashbox':'Smashbox', 'stila':'Stila', 'burberry':'Burberry',
  'dolce & gabbana':'Dolce & Gabbana', 'clarins':'Clarins',
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const titleCase = s => s.replace(/(^|[\s\-/(])([a-zà-ÿ])/g, (m, pre, ch) => pre + ch.toUpperCase());
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const num = n => n.toLocaleString('en-US');
// White or espresso text, whichever reads better on the swatch
const ink = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.0625 ? '#fff' : '#2A1A14';
};

// Color math and the wheel palette come straight from the site's own script
const utils = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, 'lipstick-utils.js'), 'utf8') + '\n;({ LIPSTICK_DATA, hexToLab, deltaE })', {});

async function fetchCatalogue() {
  const src = fs.readFileSync(path.join(__dirname, 'supabase-data.js'), 'utf8');
  const url = src.match(/_SUPABASE_URL = '([^']+)'/)[1], key = src.match(/_SUPABASE_KEY = '([^']+)'/)[1];
  const table = src.match(/_client\.from\('([^']+)'\)/)[1];
  const rows = [];
  for (let i = 0; ; i++) {
    const res = await fetch(`${url}/rest/v1/${table}?select=brand,shade,lab_l,lab_a,lab_b,discontinued&order=id`,
      { headers: { apikey: key, Range: `${i * 1000}-${i * 1000 + 999}` } });
    if (!res.ok) throw new Error(`catalogue fetch failed: ${res.status}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows.map(r => ({ brand: r.brand, shade: r.shade, lab: [r.lab_l, r.lab_a, r.lab_b], discontinued: r.discontinued === '1' || r.discontinued === 1 }));
}

(async () => {
  const products = await fetchCatalogue();
  const byName = new Map(utils.LIPSTICK_DATA.map(c => [c.name, { ...c, hex: c.hex.toLowerCase(), lab: utils.hexToLab(c.hex), count: 0 }]));
  const charted = FAMILIES.flatMap(f => f.colors);
  const missing = [...byName.keys()].filter(n => !charted.includes(n)), unknown = charted.filter(n => !byName.has(n));
  if (missing.length || unknown.length) throw new Error(`FAMILIES is out of step with the wheel. Not charted: ${missing}. Not on the wheel: ${unknown}`);

  // Each lipstick counts toward the wheel color it sits nearest to
  const colors = [...byName.values()];
  for (const p of products) {
    let best = null, bestD = Infinity;
    for (const c of colors) { const d = utils.deltaE(c.lab, p.lab); if (d < bestD) { bestD = d; best = c; } }
    best.count++;
  }
  // Three close shades still on sale, one per brand (skipping long, untidy shade names)
  for (const c of colors) {
    const near = products.filter(p => BRANDS[p.brand] && !p.discontinued && p.shade && p.shade.length <= 28 && !/[|+]/.test(p.shade))
      .map(p => ({ ...p, d: utils.deltaE(c.lab, p.lab) })).sort((a, b) => a.d - b.d);
    c.examples = [];
    for (const p of near) {
      if (c.examples.some(e => e.brand === p.brand)) continue;
      c.examples.push(p);
      if (c.examples.length === 3) break;
    }
  }

  const card = c => `
        <article class="chip">
          <div class="chip-swatch" style="background:${c.hex};color:${ink(c.hex)}">
            <button type="button" class="chip-hex" data-hex="${c.hex.toUpperCase()}" aria-label="Copy hex code ${c.hex.toUpperCase()}">${c.hex.toUpperCase()}</button>
          </div>
          <div class="chip-body">
            <h3 id="${slug(c.name)}">${esc(c.name)}</h3>
            <p class="chip-count">${num(c.count)} lipstick${c.count === 1 ? '' : 's'} nearest this color</p>
            <ul>${c.examples.map(p => `
              <li><a href="/dupe-finder/?brand=${encodeURIComponent(p.brand)}&amp;dupe=${encodeURIComponent(p.shade)}">${esc(BRANDS[p.brand])} · ${esc(titleCase(p.shade))}</a></li>`).join('')}
            </ul>
            <a class="chip-more" href="/color-wheel/?wheel=${slug(c.name)}">See all ${esc(c.name)} matches →</a>
          </div>
        </article>`;

  const sections = FAMILIES.map(f => {
    const cs = f.colors.map(n => byName.get(n)), total = cs.reduce((s, c) => s + c.count, 0);
    return `
    <section class="family" id="${f.id}">
      <h2>${f.name}</h2>
      <p class="family-meta">${cs.length} colors · ${num(total)} lipsticks</p>
      <p class="family-blurb">${f.blurb}</p>
      <div class="chips">${cs.map(card).join('')}
      </div>
    </section>`;
  }).join('\n');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: TITLE, description: DESCRIPTION, url: `${SITE}/lipstick-color-chart/`,
    isPartOf: { '@type': 'WebSite', name: 'Lipstick Color Finder', url: `${SITE}/` },
  });

  const html = `<!DOCTYPE html>
<!-- Generated by build-color-chart.js. Do not edit. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(TITLE)}</title>
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="description" content="${esc(DESCRIPTION)}">
<link rel="canonical" href="${SITE}/lipstick-color-chart/">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}/lipstick-color-chart/">
<meta property="og:site_name" content="Lipstick Color Finder">
<meta property="og:title" content="${esc(TITLE)}">
<meta property="og:description" content="${esc(DESCRIPTION)}">
<meta property="og:image" content="${SITE}/assets/share-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Lipstick Color Finder: find lipstick by color, with rows of lips in every color of the rainbow">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(TITLE)}">
<meta name="twitter:description" content="${esc(DESCRIPTION)}">
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
.wrap{max-width:1120px;margin:0 auto;padding:0 clamp(18px,5vw,32px)}
.top{display:flex;align-items:center;gap:8px 24px;flex-wrap:wrap;padding-top:14px}
.top a{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5C3D30;text-decoration:none;padding:14px 0}
.top a:hover{color:#2A1A14}
.top a:first-child{margin-right:auto}
.eyebrow{margin:56px 0 14px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#B54A6A;font-weight:500}
h1{margin:0;font-family:'Cormorant Garamond',serif;font-weight:300;font-size:clamp(44px,7vw,84px);line-height:.98;letter-spacing:-.015em}
.lede{margin:22px 0 0;font-size:17px;line-height:1.7;color:#5C3D30;max-width:620px}
.jump{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.jump a{padding:9px 16px;border:1px solid #E0D0C4;border-radius:24px;background:#fff;color:#2A1A14;text-decoration:none;font-size:13px}
.jump a:hover{border-color:#C87890}
.family{padding-top:72px}
h2{margin:0;font-family:'Cormorant Garamond',serif;font-weight:400;font-size:clamp(30px,4vw,40px);line-height:1.1}
.family-meta{margin:10px 0 0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5C3D30}
.family-blurb{margin:10px 0 0;font-size:15px;line-height:1.7;color:#3D2820;max-width:620px}
.chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;margin-top:26px}
.chip{background:#fff;border:1px solid #E0D0C4;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
.chip-swatch{height:104px;display:flex;align-items:flex-end;padding:10px}
.chip-hex{font-family:ui-monospace,Menlo,monospace;font-size:13px;letter-spacing:.04em;color:inherit;background:none;border:1px solid currentColor;border-radius:20px;padding:5px 11px;cursor:pointer;opacity:.92}
.chip-hex:hover{opacity:1}
.chip-body{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1}
h3{margin:0;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:24px;line-height:1.15;scroll-margin-top:130px}
.chip-count{margin:6px 0 0;font-size:13px;color:#5C3D30}
.chip ul{list-style:none;margin:14px 0 16px;padding:0;display:flex;flex-direction:column;gap:7px;flex:1}
.chip li a{font-size:14px;line-height:1.4;color:#2A1A14;text-decoration:none;border-bottom:1px solid #E0D0C4}
.chip li a:hover{border-color:#B54A6A}
.chip-more{font-size:12px;font-weight:500;letter-spacing:.04em;color:#B54A6A;text-decoration:none}
.notes{padding:80px 0 24px;max-width:680px}
.notes h3{font-size:21px;margin-top:28px}
.notes p{font-size:15px;line-height:1.7;color:#3D2820;margin:10px 0 0}
.foot{padding:32px 0 48px;font-size:12px}
.foot a{color:#5C3D30}
@media (max-width:540px){.top a:first-child{flex-basis:100%;padding-bottom:0}.chips{grid-template-columns:1fr 1fr;gap:12px}.chip-swatch{height:84px}.chip-body{padding:12px 12px 14px}h3{font-size:21px}.chip li a{font-size:13px}}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a href="/">← Lipstick Color Finder</a>
    <a href="/color-wheel/">Color wheel</a>
    <a href="/guides/">Guides</a>
  </header>

  <p class="eyebrow">Color chart</p>
  <h1>Lipstick color chart</h1>
  <p class="lede">The ${colors.length} lipstick colors on our color wheel, grouped by family. Each one has a representative hex code, the number of lipsticks in our catalogue nearest to it, and three real shades close to it.</p>
  <nav class="jump" aria-label="Color families">${FAMILIES.map(f => `
    <a href="#${f.id}">${f.name.replace(/ lipstick colors$/, '')}</a>`).join('')}
  </nav>
${sections}

  <section class="notes">
    <h2>How to read this chart</h2>
    <h3>Where do the hex codes come from?</h3>
    <p>Lipstick brands don't publish hex codes. We measure each lipstick's color from its product images, then group the measurements into clusters. Each hex code here is the center of one cluster, so it stands for a group of real lipsticks rather than any single product. <a href="/about/">How I built it</a> explains the method.</p>
    <h3>How close are the example shades?</h3>
    <p>They are the nearest shades to that color from widely sold brands, one per brand, measured by ΔE (Delta E). A lipstick can look different on your lips than in the tube, so treat the hex as a guide. The <a href="/color-science/">color science page</a> explains ΔE, undertone, and depth.</p>
    <h3>Looking for a color that isn't here?</h3>
    <p>Open the <a href="/color-wheel/">color wheel</a> to step lighter or deeper from any of these, <a href="/photo-match/">match a color from a photo</a>, or start from a lipstick you own in the <a href="/dupe-finder/">dupe finder</a>.</p>
  </section>
  <p class="foot"><a href="/privacy/">Privacy</a></p>
</div>
<script>
document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('.chip-hex');
  if (!btn) return;
  try { navigator.clipboard.writeText(btn.dataset.hex); } catch (err) {}
  btn.textContent = 'Copied';
  setTimeout(function () { btn.textContent = btn.dataset.hex; }, 1400);
});
</script>
</body>
</html>
`;

  const dir = path.join(__dirname, 'lipstick-color-chart');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`wrote lipstick-color-chart/index.html (${colors.length} colors, ${num(products.length)} lipsticks)`);
  const far = colors.flatMap(c => c.examples.map(p => ({ c: c.name, d: p.d }))).sort((a, b) => b.d - a.d).slice(0, 5);
  console.log('farthest examples (ΔE):', far.map(f => `${f.c} ${f.d.toFixed(1)}`).join(', '));
})().catch(err => { console.error(err); process.exit(1); });
