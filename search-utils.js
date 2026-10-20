// Copyright (c) 2025 Constanza Schibber. Licensed under CC BY-NC 4.0 — non-commercial use only. https://creativecommons.org/licenses/by-nc/4.0/
// ── Forgiving brand search, shared by the dupe finder (app.jsx) and the red guide ──

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
};
const brandAliases = b => [...(BRAND_ALIASES[b] || []), ...(b.includes('&') ? [b.replace(/&/g, ' and ')] : [])].map(normSearch);
