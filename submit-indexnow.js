// Sends sitemap URLs to IndexNow (Bing, Yandex, Naver, Seznam) so they recrawl them.
// Run after the change is live on GitHub Pages:
//   npm run indexnow              URLs whose sitemap lastmod is today
//   npm run indexnow -- 2026-11-01   URLs with lastmod on or after that date
//   npm run indexnow -- --all     every URL in the sitemap
const fs = require('fs');
const path = require('path');

const HOST = 'lipstickcolorfinder.com';
const KEY = 'cdf01ce9fadf4ed7902161c57beab7a5';

const arg = process.argv[2];
const today = new Date().toISOString().slice(0, 10);
const since = arg === '--all' ? '' : (arg || today);

const xml = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map(([, block]) => ({
    loc: (block.match(/<loc>(.*?)<\/loc>/) || [])[1],
    lastmod: (block.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1] || '',
  }))
  .filter(u => u.loc && u.lastmod.slice(0, 10) >= since)
  .map(u => u.loc);

if (!urls.length) {
  console.log(`No sitemap URLs with lastmod on or after ${since}.`);
  process.exit(0);
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
