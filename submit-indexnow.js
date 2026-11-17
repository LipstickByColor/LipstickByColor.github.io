// Sends NEW pages to IndexNow (Bing, Yandex, Naver, Seznam) once they are live on GitHub Pages.
// Only for pages that didn't exist before; don't resubmit pages that were only edited
// (Bing recrawls those from the sitemap).
//   npm run indexnow -- /guides/new-guide/ /dupe-finder/brand/shade/
// Paths or full URLs; each must already be in sitemap.xml.
const fs = require('fs');
const path = require('path');

const HOST = 'lipstickcolorfinder.com';
const KEY = 'cdf01ce9fadf4ed7902161c57beab7a5';

const args = process.argv.slice(2);
if (!args.length || args.some(a => a.startsWith('-'))) {
  console.log('Usage: npm run indexnow -- <new page path or URL> [...]');
  console.log('Only submit pages that are new. Edited pages are picked up from the sitemap.');
  process.exit(1);
}

const xml = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
const sitemap = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]));

const urls = args.map(a => a.startsWith('http') ? a : `https://${HOST}${a.startsWith('/') ? '' : '/'}${a}`);
const missing = urls.filter(u => !sitemap.has(u));
if (missing.length) {
  console.error('Not in sitemap.xml (check the path, trailing slash included):');
  missing.forEach(u => console.error('  ' + u));
  process.exit(1);
}

fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  }),
}).then(async res => {
  console.log(`IndexNow ${res.status} ${res.statusText} for ${urls.length} URL(s):`);
  urls.forEach(u => console.log('  ' + u));
  const text = await res.text();
  if (text) console.log(text);
  if (res.status >= 400) process.exit(1);
}).catch(err => { console.error(err); process.exit(1); });
