// Loads the CSV written by prepare-catalogue.js into a Supabase table, 1,000
// rows at a time. Rows are upserted by id, so running it again is safe.
// Needs the secret key in .env (SUPABASE_SERVICE_KEY); the table must exist.
//   node load-table.js <table> [data-build/products-<date>.csv]
const fs = require('fs');
const path = require('path');

const [table, file] = process.argv.slice(2);
if (!table) throw new Error('usage: node load-table.js <table> [csv]');
const csv = file || path.join('data-build', fs.readdirSync(path.join(__dirname, 'data-build'))
  .filter(f => /^products-\d{8}\.csv$/.test(f)).sort().pop());

const src = fs.readFileSync(path.join(__dirname, 'supabase-data.js'), 'utf8');
const url = src.match(/_SUPABASE_URL = '([^']+)'/)[1], publicKey = src.match(/_SUPABASE_KEY = '([^']+)'/)[1];
if (fs.existsSync(path.join(__dirname, '.env'))) process.loadEnvFile(path.join(__dirname, '.env'));
const key = process.env.SUPABASE_SERVICE_KEY;
if (!key) throw new Error('SUPABASE_SERVICE_KEY not set in .env');

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

const NUMBERS = new Set(['id', 'lab_l', 'lab_a', 'lab_b', 'long_lasting']);
const [header, ...data] = parseCSV(fs.readFileSync(csv, 'utf8').trim());
const rows = data.map(r => Object.fromEntries(header.map((k, i) =>
  [k, r[i] === '' ? null : NUMBERS.has(k) ? Number(r[i]) : r[i]])));

(async () => {
  const endpoint = `${url}/rest/v1/${encodeURIComponent(table)}`;
  for (let i = 0; i < rows.length; i += 1000) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows.slice(i, i + 1000)),
    });
    if (!res.ok) throw new Error(`rows ${i}-${i + 999}: ${res.status} ${await res.text()}`);
    process.stdout.write(`\r${Math.min(i + 1000, rows.length).toLocaleString('en-US')} / ${rows.length.toLocaleString('en-US')}`);
  }
  // Count with the public key, so this also checks the site can read the table
  const res = await fetch(`${endpoint}?select=id`, { method: 'HEAD', headers: { apikey: publicKey, Prefer: 'count=exact', Range: '0-0' } });
  const total = Number((res.headers.get('content-range') || '').split('/')[1]);
  console.log(`\n${table}: ${total.toLocaleString('en-US')} rows readable with the public key (CSV has ${rows.length.toLocaleString('en-US')})`);
  if (total !== rows.length) process.exitCode = 1;
})().catch(err => { console.error(err); process.exit(1); });
