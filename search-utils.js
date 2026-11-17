// Copyright (c) 2025-2026 Constanza Schibber. All rights reserved. See LICENSE.
// ── Forgiving brand and shade search, shared by the dupe finder (app.jsx) and the red guide ──

// Lowercase with accents, spaces and punctuation removed, for forgiving search.
const normSearch = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Fewest typing slips (wrong, missing, extra or swapped letter) to turn `q`
// into the start of `key`, so "jefr" is 1 away from "jeffreestar"; with
// `whole`, into all of `key`. Gives up (Infinity) once it's past `max`, so
// scanning every shade stays quick.
function typoDistance(q, key, whole = false, max = Infinity) {
  if (whole && Math.abs(q.length - key.length) > max) return Infinity;
  // A start of `key` longer than this is already more than `max` away
  const n = whole ? key.length : Math.min(key.length, q.length + max);
  let prev2 = null, prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= q.length; i++) {
    const row = [i];
    let low = i;
    for (let j = 1; j <= n; j++) {
      let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (q[i - 1] === key[j - 1] ? 0 : 1));
      if (prev2 && j > 1 && q[i - 1] === key[j - 2] && q[i - 2] === key[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      row.push(d);
      if (d < low) low = d;
    }
    if (low > max) return Infinity;
    prev2 = prev; prev = row;
  }
  return whole ? prev[n] : Math.min(...prev);
}
// Slips allowed in a search that matches nothing as typed: none under 4
// letters, one ("rimmell", "naes"), or two from 6 letters ("limectim").
const typoLimit = q => q.length < 4 ? -1 : q.length >= 6 ? 2 : 1;

// Other names people search a brand by (old names, initials, founders, full
// names), keyed by the catalogue's brand name. "&" also matches "and" without
// being listed here.
const BRAND_ALIASES = {
  'kvd beauty': ['kat von d', 'kvd vegan beauty'],
  'yves saint laurent': ['ysl', 'saint laurent'],
  'armani beauty': ['giorgio armani'],
  'anastasia beverly hills': ['abh'],
  'make up for ever': ['mufe'],
  'dior': ['christian dior'],
  'pat mcgrath labs': ['pmg'],
  'kylie cosmetics': ['kylie jenner'],
  'kkw beauty': ['kim kardashian'],
  'skkn by kim': ['kim kardashian'],
  'r.e.m. beauty': ['ariana grande'],
  'maybelline': ['maybelline new york'],
  'nyx professional makeup': ['nyx cosmetics'],
  'l oreal': ['loreal paris'],
  'rare beauty': ['selena gomez'],
  'haus labs': ['lady gaga'],
  'prada': ['prada beauty'],
};
const brandAliases = b => [...(BRAND_ALIASES[b] || []), ...(b.includes('&') ? [b.replace(/&/g, ' and ')] : [])].map(normSearch);

// ── Shade search, shared by the dupe finder (app.jsx) and the red guide ──────
// Shade names keep their word gaps, so a search can't join two words ("colorbar"
// shouldn't match "lip color | bare it all").
const normShade = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// How close `q` comes to a name, given the name from each word on ("tilbury"
// for "charlotte tilbury"); a match from a later word ranks after the start.
const typoScore = (q, tails, max) => Math.min(...tails.map((t, i) => typoDistance(q, t, false, max) + (i ? 0.5 : 0)));
const wordTails = s => {
  const words = s.split(/\s+/);
  return words.map((_, i) => normSearch(words.slice(i).join(' '))).filter(Boolean);
};
// Words people add around a shade name ("armani lip power in shade 104")
const SHADE_FILLER = new Set(['lipstick', 'lip', 'in', 'shade', 'the', 'dupe']);
// Every word of `rest` appears in `full` (product line and shade, normShade'd)
// in any order, so "naughty plum 045" finds "045 naughty plum" and "rouge coco"
// finds the Rouge Coco line. The last word only has to start a word, for
// searches still being typed ("dior addi").
const wordsHit = (rest, full) => {
  const all = rest.split(' ').filter(Boolean);
  const words = all.some(w => !SHADE_FILLER.has(w)) ? all.filter(w => !SHADE_FILLER.has(w)) : all;
  if (!words.length) return false;
  const have = full.split(' ');
  return words.every((w, i) => i === words.length - 1 ? have.some(h => h.startsWith(w)) : have.includes(w));
};

// What the searches below read, built once per catalogue (products with brand,
// product and shade). `heads` are the ways a brand can start a brand + shade
// search: its first word (3+ letters), first two words and so on ("pat
// mcgrath"), or an alias.
function shadeSearchIndex(products) {
  const brands = [...new Set(products.map(p => p.brand))].sort((a, b) => a.localeCompare(b));
  const brandCounts = {};
  for (const p of products) brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  const brandKeys = brands.map(b => {
    const words = b.split(' '), aliases = brandAliases(b);
    const heads = [...words.map((_, i) => normSearch(words.slice(0, i + 1).join(' '))).filter((h, i) => h && (i > 0 || h.length >= 3)), ...aliases];
    return { b, key: normSearch(b), aliases, heads, tails: [...wordTails(b), ...aliases] };
  });
  const shadeIndex = products.map(p => ({ p, key: normShade(p.shade), full: normShade(`${p.product || ''} ${p.shade}`), tails: wordTails(normShade(p.shade)) }));
  return { brands, brandCounts, brandKeys, shadeIndex };
}

// Shades `q` is a typo or two away from, closest first
function nearShades(q, items) {
  const max = typoLimit(q), near = [];
  if (max < 0) return near;
  for (const { p, tails } of items) {
    const d = typoScore(q, tails, max);
    if (d <= max) near.push({ p, d });
  }
  return near.sort((x, y) => x.d - y.d || x.p.shade.localeCompare(y.p.shade) || x.p.brand.localeCompare(y.p.brand))
    .slice(0, 40).map(x => x.p);
}

// Brands a search names. Ignores case, accents, spaces and punctuation, so
// "smash box", "loreal" and "elf" still find their brands; other names ("ysl")
// count too.
function matchBrands(query, { brandKeys, brandCounts }) {
  const q = normSearch(query);
  if (!q) return [];
  const starts = [], incl = [];
  for (const { b, key, aliases } of brandKeys) {
    if (key.startsWith(q) || aliases.some(a => a.startsWith(q))) starts.push(b);
    else if (key.includes(q)) incl.push(b);
  }
  if (starts.length || incl.length || q.length < 4) return [...starts, ...incl].slice(0, 12);
  // Nothing matches as typed: list brands a typo or two away, then bigger brands first
  const max = typoLimit(q);
  const near = [];
  for (const { b, tails } of brandKeys) {
    const d = typoScore(q, tails, max);
    if (d <= max) near.push({ b, d });
  }
  return near.sort((x, y) => x.d - y.d || brandCounts[y.b] - brandCounts[x.b]).slice(0, 5).map(x => x.b);
}

// Shades a search names: "mac ruby woo" (a brand, or its first word, then a
// shade) lists that brand's shades; a shade name on its own ("pillow talk")
// lists that shade across brands. The brand can also come last ("rebel mac")
// when the whole search isn't a shade. When neither matches as typed and no
// brand does either (`brandMatches`, from matchBrands), typos are allowed in
// both parts ("nars gols", "rimmel's 136 balistic"). The shade part can also
// name the product line ("dior addict") or put the words in another order
// ("revlon naughty plum 045"). A brand found with no shade to match gives
// { route: 'brand_only' } and an empty list. Otherwise { route, list }, or null.
function findShades(query, { brandKeys, brandCounts, shadeIndex }, brandMatches) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // Brand found with no shade to match: as typed, and with typos allowed
  const missed = { exact: null, typos: null };
  const byShade = (a, b) => a.shade.localeCompare(b.shade) || a.brand.localeCompare(b.brand);
  const brandShade = (typos, brandLast) => {
    for (let k = words.length - 1; k >= 1; k--) {
      const brandWords = brandLast ? words.slice(words.length - k) : words.slice(0, k);
      const shadeWords = brandLast ? words.slice(0, words.length - k) : words.slice(k);
      const head = normSearch(brandWords.join(' '));
      const rest = normShade(shadeWords.join(' '));
      if (!rest) continue;
      const hit = new Set(brandKeys.filter(x => x.heads.includes(head)).map(x => x.b));
      if (typos && !hit.size) {
        const max = typoLimit(head);
        for (const x of brandKeys) {
          if (x.heads.some(n => typoDistance(head, n, true, max) <= max)) hit.add(x.b);
        }
      }
      if (!hit.size) continue;
      const items = shadeIndex.filter(x => hit.has(x.p.brand));
      const inShade = items.filter(x => x.key.includes(rest));
      const inWords = items.filter(x => !x.key.includes(rest) && wordsHit(rest, x.full));
      let list = [...inShade.map(x => x.p).sort(byShade), ...inWords.map(x => x.p).sort(byShade)].slice(0, 40);
      if (typos && !list.length) list = nearShades(normSearch(rest), items);
      if (list.length) return { route: 'brand_shade', list };
      const tier = typos ? 'typos' : 'exact';
      if (!missed[tier] && !brandLast) {
        const brand = [...hit].sort((a, b) => brandCounts[b] - brandCounts[a])[0];
        missed[tier] = { route: 'brand_only', brand, rest: shadeWords.join(' '), list: [] };
      }
    }
    return null;
  };
  const exact = brandShade(false, false);
  if (exact) return exact;
  const q = normShade(query);
  if (q.length < 3) return null;
  const starts = [], incl = [];
  for (const { p, key } of shadeIndex) {
    if (key.startsWith(q)) starts.push(p);
    else if (key.includes(q)) incl.push(p);
  }
  const list = [...starts.sort(byShade), ...incl.sort(byShade)].slice(0, 40);
  if (list.length) return { route: 'shade', list };
  const last = brandShade(false, true);
  if (last) return last;
  if (brandMatches.length) return null;
  const near = brandShade(true, false) || brandShade(true, true);
  if (near) return near;
  // A brand typed as such but none of its shades: say so rather than guess
  // shades of other brands from the whole search. A brand only found with
  // typos ("pillow" for Mellow) comes after that guess.
  if (missed.exact) return missed.exact;
  const nearList = nearShades(normSearch(query), shadeIndex);
  return nearList.length ? { route: 'shade', list: nearList } : missed.typos;
}
