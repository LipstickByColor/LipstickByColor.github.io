// Copyright (c) 2025 Constanza Schibber. Licensed under CC BY-NC 4.0 — non-commercial use only. https://creativecommons.org/licenses/by-nc/4.0/
// ── CIELAB → sRGB hex conversion (D65 illuminant) ────────────────────────────
function labToXyz(L, a, b) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const d65 = { x: 0.95047, y: 1.00000, z: 1.08883 };
  const eps = 0.008856, kap = 903.3;
  const x = (fx**3 > eps ? fx**3 : (116*fx-16)/kap) * d65.x;
  const y = (L > kap*eps ? ((L+16)/116)**3 : L/kap) * d65.y;
  const z = (fz**3 > eps ? fz**3 : (116*fz-16)/kap) * d65.z;
  return { x, y, z };
}
function xyzToLinearRgb(x, y, z) {
  return {
    r:  3.2404542*x - 1.5371385*y - 0.4985314*z,
    g: -0.9692660*x + 1.8760108*y + 0.0415560*z,
    b:  0.0556434*x - 0.2040259*y + 1.0572252*z,
  };
}
function srgbGamma(c) {
  return c <= 0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055;
}
function labToHex(L, a, b) {
  const xyz = labToXyz(L, a, b);
  const lin = xyzToLinearRgb(xyz.x, xyz.y, xyz.z);
  const r = Math.max(0, Math.min(255, Math.round(srgbGamma(lin.r)*255)));
  const g = Math.max(0, Math.min(255, Math.round(srgbGamma(lin.g)*255)));
  const bv= Math.max(0, Math.min(255, Math.round(srgbGamma(lin.b)*255)));
  return '#' + [r,g,bv].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// ── CIEDE2000 color distance ─────────────────────────────────────────────────
// Unlike plain straight-line ΔE76, CIEDE2000 corrects for how the eye actually
// judges differences — e.g. ΔE76 overstates gaps between vivid colors and
// understates them near neutrals. Numbers run smaller than ΔE76 (~1.75 here
// covers what 3 did), so thresholds in app.jsx are calibrated to this scale.
// Sharma, Wu & Dalal (2005); test pair ([50,2.6772,-79.7751] vs [50,0,-82.7485]) = 2.0425.
function deltaE(lab1, lab2) {
  const [L1, a1, b1] = lab1, [L2, a2, b2] = lab2;
  const rad = Math.PI / 180, p25 = 25 ** 7;
  const Cbar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + p25)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
  const C1 = Math.hypot(ap1, b1), C2 = Math.hypot(ap2, b2);
  const hue = (b, a) => { const h = Math.atan2(b, a) / rad; return h < 0 ? h + 360 : h; };
  const h1 = hue(b1, ap1), h2 = hue(b2, ap2);

  const dL = L2 - L1, dC = C2 - C1;
  let dh = 0;
  if (C1 * C2 !== 0) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin(dh / 2 * rad);

  const Lbar = (L1 + L2) / 2, Cpbar = (C1 + C2) / 2;
  let hbar = h1 + h2;
  if (C1 * C2 !== 0) hbar = Math.abs(h1 - h2) > 180 ? (h1 + h2 + (h1 + h2 < 360 ? 360 : -360)) / 2 : (h1 + h2) / 2;
  const T = 1 - 0.17 * Math.cos((hbar - 30) * rad) + 0.24 * Math.cos(2 * hbar * rad)
              + 0.32 * Math.cos((3 * hbar + 6) * rad) - 0.20 * Math.cos((4 * hbar - 63) * rad);
  const SL = 1 + 0.015 * (Lbar - 50) ** 2 / Math.sqrt(20 + (Lbar - 50) ** 2);
  const SC = 1 + 0.045 * Cpbar;
  const SH = 1 + 0.015 * Cpbar * T;
  const RT = -2 * Math.sqrt(Cpbar ** 7 / (Cpbar ** 7 + p25)) * Math.sin(60 * Math.exp(-(((hbar - 275) / 25) ** 2)) * rad);

  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

// ── Wheel palette: GMM cluster centers, pink guide kinds, Chestnut + the two darkest (Onyx, Espresso) at the bottom ──
// tag: the line under the name in the middle of the wheel. Pinks use the pink guide's words
// (depth pale / light / medium / deep, undertone cool / true / warm, vivid); reds the red guide's.
const LIPSTICK_DATA = [
  // ── GMM clusters (data-driven from 8684 real products, hue-ordered) ─────────
  {id:1,  hex:"#a22956", name:"Deep Raspberry", tag:"Deep berry"},
  {id:2,  hex:"#efb5cd", name:"Lilac Pink", tag:"Pale cool pink"},     // pink guide kind (replaced Raspberry Sorbet)
  {id:3,  hex:"#cb6c7e", name:"Classic Pink", tag:"Medium true pink"},   // pink guide kind (replaced Bubblegum)
  {id:4,  hex:"#883042", name:"Dark Rose", tag:"Deep warm berry"},
  {id:5,  hex:"#92515a", name:"Rose Wine", tag:"Warm wine"},
  {id:6,  hex:"#e48385", name:"Peachy Pink", tag:"Light warm pink"},    // pink guide kind (replaced Azalea)
  {id:51, hex:"#c14d5d", name:"Deep Rose", tag:"Deep warm pink"},    // pink guide kind (replaced Cerise)
  {id:7,  hex:"#ca7780", name:"Rosy Pink", tag:"Medium warm pink"},
  {id:8,  hex:"#b24f5c", name:"Holly Berry", tag:"Deep warm pink"},
  {id:9,  hex:"#af5f64", name:"Dusty Cedar", tag:"Pink-nude"},
  {id:10, hex:"#d3676d", name:"Rose", tag:"Medium warm pink"},           // pink guide kind (replaced Tea Rose)
  {id:11, hex:"#a4333e", name:"Cherry", tag:"Blue-red"},
  {id:12, hex:"#6b272b", name:"Syrah", tag:"Deep warm berry"},
  {id:13, hex:"#4b2323", name:"Dark Wine", tag:"Deep cool brown"},
  {id:14, hex:"#b07774", name:"Old Rose", tag:"Medium cool brown"},
  {id:15, hex:"#e3454d", name:"Signal Red", tag:"Bright true red"},
  {id:16, hex:"#d85d5b", name:"Coral", tag:"Medium coral"},
  {id:17, hex:"#ba5250", name:"Rosewood", tag:"Medium rose-brown"},
  {id:18, hex:"#b5252c", name:"Classic Red", tag:"True red"},
  {id:19, hex:"#7e1c11", name:"Brick", tag:"Deep orange-red"},
  {id:20, hex:"#efbfbb", name:"Ballet", tag:"Pale nude"},
  {id:21, hex:"#842525", name:"Oxblood", tag:"Deep true red"},
  {id:22, hex:"#c26f67", name:"Faded Rose", tag:"Medium nude"},
  {id:23, hex:"#ea8e83", name:"Burnt Coral", tag:"Light coral"},
  {id:34, hex:"#c47159", name:"Carnelian", tag:"Medium cool coral"},
  {id:25, hex:"#945c55", name:"Nude Rose", tag:"Medium rose-brown"},
  {id:26, hex:"#76433d", name:"Sable", tag:"Deep cool brown"},
  {id:47, hex:"#994d36", name:"Chestnut", tag:"Deep warm brown"},  // fills the biggest uncovered group (replaced Charcoal)
  {id:27, hex:"#9c0822", name:"Scarlet", tag:"Deep true red"},
  {id:52, hex:"#da0f18", name:"Vermilion", tag:"Bright orange-red"},
  {id:28, hex:"#a02523", name:"Ruby", tag:"True red"},
  {id:29, hex:"#cb8579", name:"Canyon Clay", tag:"Light cool coral"},
  {id:53, hex:"#d9a083", name:"Apricot", tag:"Light brown"},
  {id:30, hex:"#aa6155", name:"Terracotta", tag:"Medium warm brown"},
  {id:31, hex:"#de2a21", name:"Poppy", tag:"Bright orange-red"},
  {id:50, hex:"#e02040", name:"Raspberry Red", tag:"Bright blue-red"},
  {id:32, hex:"#b12d1e", name:"Tomato", tag:"Orange-red"},
  {id:33, hex:"#c48c7f", name:"Rose Dawn", tag:"Light cool brown"},
  {id:39, hex:"#b73e78", name:"Magenta", tag:"Deep cool pink"},        // pink guide kind
  {id:40, hex:"#f1abb7", name:"Ballet Pink", tag:"Pale true pink"},  // pink guide kind (replaced Mauve)
  {id:49, hex:"#e58297", name:"Bright Pink", tag:"Bright light pink"},    // pink guide kind (replaced Flamingo)
  {id:42, hex:"#6c3348", name:"Burgundy", tag:"Deep mauve"},
  {id:43, hex:"#e6567e", name:"Hot Pink", tag:"Vivid pink"},       // pink guide kind (replaced Hot Magenta)
  {id:44, hex:"#801628", name:"Black Cherry", tag:"Deep blue-red"},
  // ── Novelty entry points (hand-curated for outlier zones) ─────────────────
  {id:41, hex:"#170e12", name:"Onyx", tag:"Black",     novelty:true}, // GMM cluster — moved here; near-neutral hue sorts poorly
  {id:54, hex:"#50332c", name:"Espresso", tag:"Deep cool brown", novelty:true}, // sits with Onyx so the two rings stay even
];

// ── Convert wheel hex to CIELAB for matching ─────────────────────────────────
function hexToLab(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const lin = v => v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  const lr = lin(r), lg = lin(g), lb = lin(b);
  const x = (0.4124564*lr + 0.3575761*lg + 0.1804375*lb) / 0.95047;
  const y = (0.2126729*lr + 0.7151522*lg + 0.0721750*lb) / 1.00000;
  const z = (0.0193339*lr + 0.1191920*lg + 0.9503041*lb) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : (903.3*t+16)/116;
  const fx = f(x), fy = f(y), fz = f(z);
  return [116*fy-16, 500*(fx-fy), 200*(fy-fz)];
}

// ── Is this color a red, and which kind? ─────────────────────────────────────
// Same rules as the red guide (guides/red-lipstick/red-lipstick.js: redCheck,
// toneOf, depthOf) — keep the two in step. Red is hue 18–42°, L* 20–55, with
// enough chroma; tone comes from hue and depth from lightness.
// Returns null for anything that isn't a red.
function redKind(hex) {
  const [L, a, b] = hexToLab(hex);
  const C = Math.hypot(a, b), h = Math.atan2(b, a) * 180 / Math.PI;
  const minC = Math.max(45 + Math.max(0, h - 34) * 13 / 8, 45 + 1.5 * Math.max(0, L - 40));
  if (h < 18 || h > 42 || L < 20 || L > 55 || C < minC) return null;
  return {
    tone: h < 26 ? 'blue' : h < 34 ? 'true' : 'orange',
    depth: L >= 45 ? 'bright' : L >= 35 ? 'classic' : 'deep',
  };
}

// ── Is this color a pink, and which kind? ────────────────────────────────────
// The pink guide's kinds (guides/pink-lipstick/). Pink is hue −30° to 30° with enough
// chroma (a little less for pale pinks); depth comes from lightness (pale / light /
// medium / deep), tone from hue (cool below 0°, true below 15°, warm above), and pinks
// too saturated for the depth scale are vivid. The guide's export doesn't spell out its
// limits for depth and warmth; these are fitted so the guide's 14 kind colors and its
// "not pink" examples come out right, and the catalogue splits into kinds in the guide's
// shares (about 22% of lipsticks pink, rose the biggest kind at about a quarter).
// Check redKind first: the two slices overlap, and a red is a red.
// Returns null for anything that isn't a pink.
function pinkKind(hex) {
  const [L, a, b] = hexToLab(hex);
  const C = Math.hypot(a, b), h = Math.atan2(b, a) * 180 / Math.PI;
  if (h < -30 || h > 30 || L < 40) return null;                 // outside the slice; deeper is berry
  if (C < (L >= 72 ? 22 : 25)) return null;                      // near gray: mauve or greige
  if (h > 15 + (L - 40) * 0.8) return null;                      // too warm for its depth: rose-brown, nude, coral
  if ((L < 52 || (h >= 15 && L < 55)) && C < 40) return null;    // deep, or medium and warm, without enough color: nude
  const tone = h < 0 ? 'cool' : h < 15 ? 'true' : 'warm';
  if (C >= 59 && L >= 48) return { depth: 'vivid', tone };
  return { depth: L >= 72 ? 'pale' : L >= 62 ? 'light' : L >= 52 ? 'medium' : 'deep', tone };
}

// ── Find closest real products to a wheel color by ΔE ────────────────────────
function getClosestColors(wheelHex, count = 5) {
  const targetLab = hexToLab(wheelHex);
  return REAL_PRODUCTS
    .map(p => ({ ...p, distance: deltaE(targetLab, p.lab) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}
