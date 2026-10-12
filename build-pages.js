// Writes the tool pages (/color-wheel/, /dupe-finder/, /photo-match/) from
// index.html: the same app, opened in that mode (see MODE_PAGES in app.jsx),
// with its own title, description, intro, and a write-up under the tool.
// Edit the copy here, then `npm run build`. Don't edit the generated pages.
const fs = require('fs');
const path = require('path');

const SITE = 'https://lipstickbycolor.github.io';
const HOME_TITLE = 'Lipstick Color Finder — Search Lipstick by Color &amp; Find Dupes';
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// The wheel's colors as small cards (swatch, name, lipstick count, hex), grouped by family
// and ordered light to deep. Every wheel color must be in exactly one family. The counts
// come from wheel-counts.json, which `npm run build:chart` writes from the live catalogue.
const WHEEL_FAMILIES = [
  ['Red', ['Poppy','Vermilion','Signal Red','Raspberry Red','Classic Red','Tomato','Cherry','Ruby','Scarlet','Black Cherry','Oxblood','Brick']],
  ['Pink', ['Ballet','Flamingo','Bubblegum','Rosy Pink','Tea Rose','Cerise','Azalea','Raspberry Sorbet','Magenta','Hot Magenta','Faded Rose','Dusty Cedar']],
  ['Coral and peach', ['Apricot','Burnt Coral','Coral','Carnelian']],
  ['Nude and brown', ['Rose Dawn','Canyon Clay','Terracotta','Nude Rose','Sable','Espresso','Old Rose','Rosewood']],
  ['Berry and wine', ['Mauve','Deep Raspberry','Dark Rose','Burgundy','Syrah','Dark Wine','Holly Berry','Rose Wine']],
  ['Black and grey', ['Charcoal','Onyx']],
];
const wheel = require('vm').runInNewContext(
  fs.readFileSync(path.join(__dirname, 'lipstick-utils.js'), 'utf8') + '\n;({ LIPSTICK_DATA, hexToLab })', {});
const wheelCounts = JSON.parse(fs.readFileSync(path.join(__dirname, 'wheel-counts.json'), 'utf8'));
function wheelCards() {
  const left = new Map(wheel.LIPSTICK_DATA.map(c => [c.name, c]));
  const html = WHEEL_FAMILIES.map(([family, names]) => {
    const colors = names.map(n => {
      if (!left.has(n)) throw new Error(`build-pages: "${n}" is not a wheel color, or is listed twice`);
      if (!Number.isInteger(wheelCounts[n])) throw new Error(`build-pages: no count for "${n}" in wheel-counts.json. Run npm run build:chart.`);
      const c = left.get(n); left.delete(n); return c;
    }).sort((a, b) => wheel.hexToLab(b.hex)[0] - wheel.hexToLab(a.hex)[0]);
    return `
    <p class="wheel-family">${family} lipstick shades</p>
    <div class="wheel-cards">${colors.map(c => `
      <a href="/color-wheel/?wheel=${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"><span class="wheel-card-swatch" style="background:${c.hex}"></span><span class="wheel-card-name">${c.name}</span><span class="wheel-card-count">${wheelCounts[c.name].toLocaleString('en-US')} ${wheelCounts[c.name] === 1 ? 'lipstick' : 'lipsticks'}</span><span class="wheel-card-hex">${c.hex.toUpperCase()}</span></a>`).join('')}
    </div>`;
  }).join('');
  if (left.size) throw new Error(`build-pages: wheel colors missing from WHEEL_FAMILIES: ${[...left.keys()].join(', ')}`);
  return html;
}

const PAGES = [
  {
    dir: 'color-wheel',
    name: 'Lipstick Color Wheel',
    title: 'Lipstick Color Wheel — Discover Lipstick Shades by Color',
    description: 'Browse nearly 17,000 lip products by color, not by name. Click any shade on the color wheel, step lighter or deeper, and filter by undertone and finish.',
    h1: 'Lipstick color wheel',
    intro: 'Click any color on the wheel to see real lipsticks in that shade, from nearly 17,000 lip products. Go lighter or deeper, then filter by finish, brand, and price.',
    copy: `
    <h2>How the lipstick color wheel works</h2>
    <p>Explore 46 lipstick colors, from pale pinks to deep wines. Select a color to see real lipstick shades that match, then refine your search by depth, brand, finish, or price.</p>
    <h3>Why search by color instead of shade name?</h3>
    <p>Shade names like "Velvet Plum" or "Spiced Rosewood" say little about the color itself, and retailer filters like "Pink" or "Nude" each cover hundreds of very different shades. Here every product is placed by its measured color, so what you click is what you get. <a href="/about/">How I built it</a> explains how the colors are measured.</p>
    <h3>What if I want an exact shade?</h3>
    <p>If you have a picture of it, use <a href="/photo-match/">photo match</a>. If you already own a lipstick in that color, the <a href="/dupe-finder/">dupe finder</a> starts from that shade. The Custom color tab above takes a hex code.</p>
    <h3>The 46 lipstick shades on the wheel</h3>
    <p>Each shade is shown with its hex code and the number of lipsticks nearest to it. The names are only labels for the wheel; click one to open it.</p>${wheelCards()}
    <p class="wheel-after">The <a href="/lipstick-color-chart/">lipstick color chart</a> lists the same shades with example lipsticks for each. For reds in depth, see the <a href="/guides/red-lipstick/">red lipstick guide</a>.</p>`,
  },
  {
    dir: 'dupe-finder',
    name: 'Lipstick Dupe Finder',
    title: 'Lipstick Dupe Finder — Find Dupes for Any Shade by Color',
    description: 'Find lipstick dupes by measured color across nearly 17,000 products: cheaper alternatives, drugstore matches, and stand-ins for discontinued favorites.',
    h1: 'Lipstick dupe finder',
    intro: 'Pick a lipstick you already love and see its closest color matches across brands and prices, from nearly 17,000 lip products.',
    copy: `
    <h2>How the lipstick dupe finder works</h2>
    <p>Search the brand, then the shade. The finder takes that lipstick's measured color and ranks every other product in the catalogue by how close its color is, closest first. Narrow the list by price, brand, format, finish, or undertone to find a cheaper alternative, the same color in a different finish, or a stand-in for a shade you can no longer buy.</p>
    <h3>What counts as a dupe?</h3>
    <p>Two lipsticks are dupes when their colors are close enough to be hard to tell apart. Closeness is measured as ΔE (Delta E), a standard measure of how different two colors look to the eye: the lower the number, the closer the match. The <a href="/color-science/">color science page</a> explains how ΔE works.</p>
    <p>Color is only part of a dupe. Finish and formula also change how a shade looks on your lips, so use the finish and format filters to keep the comparison fair.</p>
    <h3>Where do the colors come from?</h3>
    <p>Each shade's color is measured from its product images, not taken from the brand's shade name or a retailer's color filter. <a href="/about/">How I built it</a> explains the method.</p>
    <h3>What if my lipstick isn't listed?</h3>
    <p>Use <a href="/photo-match/">photo match</a>: upload a picture of it, tap the color, and search from there. Or find the closest color on the <a href="/color-wheel/">color wheel</a>.</p>
    <h3>Popular shades to start from</h3>
    <p class="page-copy-links">
      <a href="/dupe-finder/mac/ruby-woo/">MAC Ruby Woo dupes</a>
      <a href="/dupe-finder/charlotte-tilbury/pillow-talk/">Charlotte Tilbury Pillow Talk dupes</a>
      <a href="/dupe-finder/pat-mcgrath/elson-4/">Pat McGrath Labs Elson 4 dupes</a>
      <a href="/dupe-finder/chanel/99-pirate/">Chanel 99 Pirate dupes</a>
      <a href="/dupe-finder/chanel/49-ever-red/">Chanel 49 Ever Red dupes</a>
      <a href="/dupe-finder/dior/100-forever-nude-look/">Dior 100 Forever Nude Look dupes</a>
      <a href="/dupe-finder/dior/422-rose-des-vents/">Dior 422 Rose des Vents dupes</a>
      <a href="/dupe-finder/dior/670-rose-blues/">Dior 670 Rose Blues dupes</a>
    </p>`,
  },
  {
    dir: 'photo-match',
    name: 'Lipstick Photo Match',
    title: 'Find Your Lipstick Shade from a Photo',
    description: 'Saw a lip color on Instagram or Pinterest? Upload a photo, tap the lips, and match it against nearly 17,000 lip products. Your photo stays on your device.',
    h1: 'Find a lipstick color from a photo',
    intro: 'Saw a lip color on Instagram or Pinterest? Upload a photo, tap the lips, and match it against nearly 17,000 lip products. Your photo stays on your device.',
    copy: `
    <h2>How lipstick photo match works</h2>
    <p>Upload any photo or screenshot: a celebrity's red-carpet look, a selfie, a swatch, a product shot. Tap the spot whose color you want. The finder reads that color and ranks lipsticks by how close their measured color is, closest first. Then narrow the list by price, brand, format, finish, or undertone.</p>
    <h3>Is my photo uploaded anywhere?</h3>
    <p>No. The image is read by your browser. It is never uploaded or stored. See the <a href="/privacy/">privacy page</a>.</p>
    <h3>How do I get a better match?</h3>
    <p>Lighting, filters, and screens all shift color in a photo. Tap a part of the lip in even light, away from glossy highlights and shadows, and try a few spots to see how much the result moves.</p>
    <h3>Already know which lipstick it is?</h3>
    <p>The <a href="/dupe-finder/">dupe finder</a> starts from the lipstick's own measured color, which is more reliable than a photo. To browse by color family, use the <a href="/color-wheel/">color wheel</a>.</p>`,
  },
];

const PAGE_CSS = `<style>
  /* Write-up under the tool; app.js seats it above the footer once mounted */
  .page-copy { position: relative; z-index: 1; border-top: 1px solid var(--border); padding: 44px 24px 52px; }
  .page-copy-inner { max-width: 680px; margin: 0 auto; }
  .page-copy h2 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 30px; line-height: 1.2; color: var(--espresso); margin-bottom: 14px; }
  .page-copy h3 { font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: 21px; line-height: 1.3; color: var(--espresso); margin: 28px 0 8px; }
  .page-copy p { font-size: 15px; line-height: 1.7; color: var(--text-body); margin-bottom: 12px; }
  .page-copy a { color: var(--blush-deep); text-decoration: underline; text-underline-offset: 3px; }
  .page-copy-links { display: flex; flex-wrap: wrap; gap: 10px; }
  .page-copy-links a { padding: 7px 14px; border: 1px solid var(--border); border-radius: 20px; background: #fff; color: var(--espresso); text-decoration: none; font-size: 13px; }
  .page-copy-links a:hover { border-color: var(--blush); }
  .page-copy .wheel-family { font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--espresso); margin: 22px 0 8px; }
  .wheel-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(98px, 1fr)); gap: 8px; }
  .page-copy .wheel-cards a { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 10px; background: #fff; overflow: hidden; text-decoration: none; color: var(--espresso); }
  .page-copy .wheel-cards a:hover { border-color: var(--blush); }
  .wheel-card-swatch { height: 44px; }
  .wheel-card-name { padding: 7px 9px 0; font-size: 13px; font-weight: 500; line-height: 1.25; color: var(--blush-deep); }
  .wheel-card-count { padding: 2px 9px 0; font-size: 11px; color: var(--text-body); }
  .wheel-card-hex { padding: 2px 9px 8px; font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: var(--text-body); }
  .page-copy .wheel-after { margin-top: 24px; }
  @media (max-width: 540px) { .page-copy { padding: 32px 16px 40px; } .page-copy h2 { font-size: 26px; } }
</style>`;

const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const homeDescription = template.match(/<meta name="description" content="([^"]*)"/)[1];

// Replace every occurrence, and fail loudly if index.html no longer has it
function swap(html, from, to) {
  if (!html.includes(from)) throw new Error(`build-pages: index.html is missing "${String(from).slice(0, 60)}"`);
  return html.split(from).join(to);
}
function swapRe(html, re, to) {
  if (!re.test(html)) throw new Error(`build-pages: index.html does not match ${re}`);
  return html.replace(re, to);
}

for (const page of PAGES) {
  const url = `${SITE}/${page.dir}/`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: page.name,
    url,
    description: page.description,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isPartOf: { '@type': 'WebSite', name: 'Lipstick Color Finder', url: `${SITE}/` },
  }, null, 2);

  let html = template;
  html = swap(html, HOME_TITLE, esc(page.title));
  html = swap(html, homeDescription, esc(page.description));
  html = swap(html, `content="${SITE}/"`, `content="${url}"`);
  html = swap(html, `<link rel="canonical" href="${SITE}/"`, `<link rel="canonical" href="${url}"`);
  html = swapRe(html, /<script type="application\/ld\+json">[\s\S]*<\/script>\n(?=<\/head>)/,
    `<script type="application/ld+json">\n${jsonLd}\n</script>\n${PAGE_CSS}\n`);
  html = swapRe(html, /<h1>[\s\S]*?(?=\s*<div class="preload-spinner")/, `<h1>${page.h1}</h1>\n    <p>${page.intro}</p>`);
  html = swap(html, '</div>\n</body>',
    `</div>\n<section id="page-copy" class="page-copy">\n  <div class="page-copy-inner">${page.copy}\n  </div>\n</section>\n</body>`);
  html = swap(html, '<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- Generated from index.html by build-pages.js. Do not edit. -->');

  fs.mkdirSync(path.join(__dirname, page.dir), { recursive: true });
  fs.writeFileSync(path.join(__dirname, page.dir, 'index.html'), html);
  console.log(`wrote ${page.dir}/index.html`);
}
