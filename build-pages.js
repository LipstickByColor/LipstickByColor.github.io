// Writes the tool pages (/color-wheel/, /dupe-finder/, /photo-match/, /lipstick-color-chart/) from
// index.html: the same app, opened in that mode (see MODE_PAGES in app.jsx),
// with its own title, description, intro, and a write-up under the tool.
// Edit the copy here, then `npm run build`. Don't edit the generated pages.
const fs = require('fs');
const path = require('path');

const SITE = 'https://lipstickbycolor.github.io';
const HOME_TITLE = 'Lipstick Color Finder: Find Any Lipstick by Color';
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// The wheel's colors as small cards (swatch, name, lipstick count, hex), grouped by family
// and ordered light to deep. Every wheel color must be in exactly one family. The counts
// come from wheel-counts.json, which `npm run build:counts` writes from the live catalogue.
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
      if (!Number.isInteger(wheelCounts[n])) throw new Error(`build-pages: no count for "${n}" in wheel-counts.json. Run npm run build:counts.`);
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
    title: 'Lipstick Color Wheel: Browse Shades by Color',
    description: 'Tap a color on the wheel and see the lipsticks that look like it. Go lighter or deeper, then filter by finish, undertone and price.',
    h1: 'Lipstick color wheel',
    intro: 'Not sure what you want yet? Start with a color and see real lipsticks in it, then go lighter, deeper, warmer or cooler until it feels right.',
    copy: `
    <h2>How the lipstick color wheel works</h2>
    <p>Explore 46 lipstick colors, from pale pinks to deep wines. Select a color to see real lipstick shades that match, then refine your search by depth, brand, finish, or price.</p>
    <h3>Why search by color instead of shade name?</h3>
    <p>Shade names like "Velvet Plum" or "Spiced Rosewood" say little about the color itself, and retailer filters like "Pink" or "Nude" each cover hundreds of very different shades. Here every product is placed by its measured color, so what you click is what you get. <a href="/about/">How I built it</a> explains how the colors are measured.</p>
    <h3>What if I want an exact shade?</h3>
    <p>If you have a picture of it, use <a href="/photo-match/">photo match</a>. If you already own a lipstick in that color, the <a href="/dupe-finder/">dupe finder</a> starts from that shade. The <a href="/lipstick-color-chart/">lipstick color chart</a> takes a hex code.</p>
    <h3>The 46 lipstick shades on the wheel</h3>
    <p>Each shade is shown with its hex code and the number of lipsticks nearest to it. The names are only labels for the wheel; click one to open it.</p>${wheelCards()}
    <p class="wheel-after">To pick any color, not only these 46, use the <a href="/lipstick-color-chart/">lipstick color chart</a>. For reds in depth, see the <a href="/guides/red-lipstick/">red lipstick guide</a>.</p>`,
  },
  {
    dir: 'dupe-finder',
    name: 'Lipstick Dupe Finder',
    title: 'Lipstick Dupe Finder: Same Color, Any Price',
    description: 'Name your lipstick and see the shades that look most like it, from nearly 17,000 lipsticks and nearly 450 brands. Discontinued? Find its closest twin.',
    h1: 'Lipstick dupe finder',
    intro: 'Name a lipstick you love and see the shades that look most like it, from drugstore to luxury, across nearly 450 brands.',
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
    title: 'Find a Lipstick from a Photo: Match Any Lip Color',
    description: 'Saw the perfect lip color on Instagram? Upload the photo, tap the lips, and find it among nearly 17,000 lipsticks. Your photo never leaves your phone.',
    h1: 'Find a lipstick color from a photo',
    intro: 'That lip color you screenshotted? Upload it, tap the lips, and see which lipsticks come closest. Your photo stays on your device.',
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
  {
    dir: 'lipstick-color-chart',
    name: 'Lipstick Color Chart',
    title: 'Lipstick Color Chart: Nearly 17,000 Lipsticks by Color',
    description: 'Explore hundreds of shades on one chart. Tap a color or paste a hex code to match against nearly 17,000 lipsticks across 430+ brands at every price.',
    h1: 'Lipstick color chart: find any shade',
    intro: 'Hundreds of shades on one map, from soft nudes to deep blue-reds, matched against nearly 17,000 lipsticks from 430+ brands. Tap a color to see the closest matches, then go lighter or deeper.',
    copy: `
    <h2>How to find the right lipstick color</h2>
    <p>The best way to find a lipstick shade depends on how much you already know about the color you want. A lipstick color chart lets you explore shades visually instead of relying only on brand names, which can describe similar colors differently.</p>
    <p><strong>If you know the color family:</strong> start with red, pink, berry, coral, brown, plum, blue, or black under "Start from", then adjust the tone and depth.</p>
    <p><strong>If you know the exact color you want:</strong> enter a hex color code to find lipsticks with the closest measured colors.</p>
    <p><strong>If you want a lighter or darker shade:</strong> keep the hue and move the depth bar to compare lighter and deeper lipsticks.</p>
    <p><strong>If you are choosing between similar shades:</strong> use "Explore nearby shades" to zoom in and compare colors that differ only slightly.</p>
    <p><strong>If you have a lipstick you love:</strong> use the <a href="/dupe-finder/">lipstick dupe finder</a> to look for similar shades in other products.</p>
    <h3>Colors to start from</h3>
    <p class="page-copy-links">
      <a href="/lipstick-color-chart/?color=a3172e"><span class="chart-chip-swatch" style="background:#a3172e"></span>Blue red lipsticks</a>
      <a href="/lipstick-color-chart/?color=d03a26"><span class="chart-chip-swatch" style="background:#d03a26"></span>Orange red lipsticks</a>
      <a href="/lipstick-color-chart/?color=d77749"><span class="chart-chip-swatch" style="background:#d77749"></span>Coral lipsticks</a>
      <a href="/lipstick-color-chart/?color=c96b84"><span class="chart-chip-swatch" style="background:#c96b84"></span>Rose pink lipsticks</a>
      <a href="/lipstick-color-chart/?color=9c6b7a"><span class="chart-chip-swatch" style="background:#9c6b7a"></span>Mauve lipsticks</a>
      <a href="/lipstick-color-chart/?color=c39482"><span class="chart-chip-swatch" style="background:#c39482"></span>Nude lipsticks</a>
      <a href="/lipstick-color-chart/?color=8a5545"><span class="chart-chip-swatch" style="background:#8a5545"></span>Brown lipsticks</a>
      <a href="/lipstick-color-chart/?color=7d2349"><span class="chart-chip-swatch" style="background:#7d2349"></span>Berry lipsticks</a>
      <a href="/lipstick-color-chart/?color=5c3069"><span class="chart-chip-swatch" style="background:#5c3069"></span>Plum lipsticks</a>
      <a href="/lipstick-color-chart/?color=1f1f1f"><span class="chart-chip-swatch" style="background:#1f1f1f"></span>Black lipsticks</a>
    </p>
    <h3>How to choose between warm and cool lipstick shades</h3>
    <p>Warm and cool lipstick shades can look similar at first, but small differences in undertone change their overall appearance. Warm reds lean toward orange, while blue-reds lean toward cooler, pinker or bluer tones. Coral shades combine red and orange, while berry and plum shades move toward purple.</p>
    <p>Use the chart to compare these differences directly: warmer shades sit toward the top of the map and cooler ones toward the bottom. Move between neighboring shades to find a red that is more orange or more blue, a pink that is warmer or cooler, or a nude that is more peachy or more brown.</p>
    <h3>How to find a lipstick in a specific color</h3>
    <p>If you have a color in mind but don't know which brands sell it, select that color on the chart. The results show lip products whose measured colors fall within the chart's matching distance, ordered from closest to farthest.</p>
    <p>You can then narrow the results by brand, price, product format, finish, or undertone, and compare products across brands without relying on shade names.</p>
    <h3>Can you find a lipstick using a hex color code?</h3>
    <p>Yes. If you have a hex color code from a website, an image, or a design tool, enter it into the lipstick color chart. The chart uses that color as the target and finds the lipsticks in its catalogue with the closest measured colors.</p>
    <p>A hex match is a starting point for comparison, not a guarantee that the lipstick will look identical on your lips. Product photography, lighting, skin tone, and the lipstick's formula all affect the final look.</p>
    <h3>Why use measured color instead of lipstick shade names?</h3>
    <p>Lipstick shade names are not standardized across brands. One brand's rose, nude, or brick red may look quite different from another brand's version of the same name, and retailer color filters group products into broad categories.</p>
    <p>This chart compares products by color measured from their product images, using the same method for every brand. That helps you discover visually similar shades across brands, including colors you might not find by searching for a shade name. <a href="/about/">How I built it</a> explains the method, and the <a href="/color-science/">color science page</a> explains how closeness is measured.</p>
    <h3>Prefer to browse named lipstick colors?</h3>
    <p>Explore 46 named shades on the <a href="/color-wheel/">lipstick color wheel</a>. If you want to find a similar shade to a lipstick you already own, try the <a href="/dupe-finder/">lipstick dupe finder</a>.</p>`,
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
  .page-copy-links a:has(.chart-chip-swatch) { display: inline-flex; align-items: center; gap: 8px; padding-left: 8px; }
  .chart-chip-swatch { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(42,26,20,0.12); }
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
