// Writes wheel-counts.json: how many catalogue lipsticks sit nearest to each wheel
// color. build-pages.js shows these on the color wheel page's shade cards.
// Reads the live catalogue, so it needs the network and is run on its own:
//   npm run build:counts
// then `npm run build` so the page picks the counts up.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Color math and the wheel palette come straight from the site's own script
const utils = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, 'lipstick-utils.js'), 'utf8') + '\n;({ LIPSTICK_DATA, hexToLab, deltaE })', {});

async function fetchLabs() {
  const src = fs.readFileSync(path.join(__dirname, 'supabase-data.js'), 'utf8');
  const url = src.match(/_SUPABASE_URL = '([^']+)'/)[1], key = src.match(/_SUPABASE_KEY = '([^']+)'/)[1];
  const table = src.match(/_client\.from\('([^']+)'\)/)[1];
  const rows = [];
  for (let i = 0; ; i++) {
    const res = await fetch(`${url}/rest/v1/${table}?select=lab_l,lab_a,lab_b&order=id`,
      { headers: { apikey: key, Range: `${i * 1000}-${i * 1000 + 999}` } });
    if (!res.ok) throw new Error(`catalogue fetch failed: ${res.status}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows.map(r => [r.lab_l, r.lab_a, r.lab_b]);
}

(async () => {
  const labs = await fetchLabs();
  const colors = utils.LIPSTICK_DATA.map(c => ({ name: c.name, lab: utils.hexToLab(c.hex), count: 0 }));
  // Each lipstick counts toward the wheel color it sits nearest to
  for (const lab of labs) {
    let best = null, bestD = Infinity;
    for (const c of colors) { const d = utils.deltaE(c.lab, lab); if (d < bestD) { bestD = d; best = c; } }
    best.count++;
  }
  fs.writeFileSync(path.join(__dirname, 'wheel-counts.json'), JSON.stringify(Object.fromEntries(colors.map(c => [c.name, c.count])), null, 2) + '\n');
  console.log(`wrote wheel-counts.json (${colors.length} colors, ${labs.length.toLocaleString('en-US')} lipsticks)`);
})().catch(err => { console.error(err); process.exit(1); });
