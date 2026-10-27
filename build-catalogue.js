// Writes the catalogue the site loads (supabase-data.js) as one JSON file and
// uploads it to Supabase Storage, so visitors download one cached file instead
// of paging through the table on every page load. The file is never committed:
// the repo is public. Reads the live catalogue, so it needs the network:
//   npm run build:catalogue   (secret key in .env as SUPABASE_SERVICE_KEY)
// Without the key it only writes data-build/<file> for a manual upload.
// Each run gets a new file name (CATALOGUE_FILE in supabase-data.js), so
// browsers can keep a file forever; commit and push supabase-data.js after.
const fs = require('fs');
const path = require('path');

const DATA_JS = path.join(__dirname, 'supabase-data.js');
const BUCKET = 'site-data';
const COLS = ['id', 'brand', 'product', 'shade', 'finish', 'type', 'lab_l', 'lab_a', 'lab_b', 'hex', 'price_tier', 'discontinued'];

const src = fs.readFileSync(DATA_JS, 'utf8');
const url = src.match(/_SUPABASE_URL = '([^']+)'/)[1], key = src.match(/_SUPABASE_KEY = '([^']+)'/)[1];
const table = src.match(/_client\.from\('([^']+)'\)/)[1];

async function fetchRows() {
  const rows = [];
  for (let i = 0; ; i++) {
    const res = await fetch(`${url}/rest/v1/${table}?select=${COLS.join(',')}&order=id`,
      { headers: { apikey: key, Range: `${i * 1000}-${i * 1000 + 999}` } });
    if (!res.ok) throw new Error(`catalogue fetch failed: ${res.status}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

// Brand and product names repeat across shades, so rows point into lists of them
function pack(rows) {
  const brands = [], products = [], bi = new Map(), pi = new Map();
  const idx = (list, map, v) => { if (!map.has(v)) { map.set(v, list.length); list.push(v); } return map.get(v); };
  return {
    fields: COLS,
    brands, products,
    rows: rows.map(r => [r.id, idx(brands, bi, r.brand), idx(products, pi, r.product), r.shade, r.finish, r.type,
      r.lab_l, r.lab_a, r.lab_b, r.hex, r.price_tier, r.discontinued]),
  };
}

async function upload(name, body, serviceKey) {
  const auth = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  // Creating the bucket fails harmlessly once it exists
  await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${name}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json', 'cache-control': 'max-age=31536000', 'x-upsert': 'true' },
    body,
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${await res.text()}`);
}

(async () => {
  const rows = await fetchRows();
  if (!rows.length) throw new Error('No products returned');
  const body = JSON.stringify(pack(rows));
  const name = `catalogue-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${rows.length}.json`;

  const outDir = path.join(__dirname, 'data-build');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, name), body);
  console.log(`wrote data-build/${name} (${rows.length.toLocaleString('en-US')} lipsticks, ${(body.length / 1024).toFixed(0)} KB)`);

  // The secret key lives in .env (gitignored)
  if (fs.existsSync(path.join(__dirname, '.env'))) process.loadEnvFile(path.join(__dirname, '.env'));
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (serviceKey) {
    await upload(name, body, serviceKey);
    console.log(`uploaded to ${url}/storage/v1/object/public/${BUCKET}/${name}`);
  } else {
    console.log(`SUPABASE_SERVICE_KEY not set: upload data-build/${name} to the public "${BUCKET}" bucket in the Supabase dashboard.`);
  }

  fs.writeFileSync(DATA_JS, src.replace(/const CATALOGUE_FILE = '[^']*';/, `const CATALOGUE_FILE = '${name}';`));
  console.log('updated CATALOGUE_FILE in supabase-data.js');
})().catch(err => { console.error(err); process.exit(1); });
