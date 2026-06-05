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

// ── CIELAB ΔE76 distance ──────────────────────────────────────────────────────
function deltaE(lab1, lab2) {
  return Math.sqrt(
    (lab1[0]-lab2[0])**2 +
    (lab1[1]-lab2[1])**2 +
    (lab1[2]-lab2[2])**2
  );
}

// ── Wheel palette: 42 GMM cluster centers + 6 novelty entry points ────────────
const LIPSTICK_DATA = [
  {id:1,  hex:"#a22956", name:"Deep Raspberry"},
  {id:2,  hex:"#db2a6a", name:"Raspberry Sorbet"},
  {id:3,  hex:"#ed7491", name:"Bubblegum"},
  {id:4,  hex:"#883042", name:"Dark Rose"},
  {id:5,  hex:"#92515a", name:"Rose Wine"},
  {id:6,  hex:"#d23658", name:"Azalea"},
  {id:7,  hex:"#ca7780", name:"Rosy Pink"},
  {id:8,  hex:"#b24f5c", name:"Holly Berry"},
  {id:9,  hex:"#af5f64", name:"Dusty Cedar"},
  {id:10, hex:"#d56369", name:"Tea Rose"},
  {id:11, hex:"#a4333e", name:"American Beauty"},
  {id:12, hex:"#6b272b", name:"Syrah"},
  {id:13, hex:"#4b2323", name:"Dark Wine"},
  {id:14, hex:"#b07774", name:"Old Rose"},
  {id:15, hex:"#e3454d", name:"Signal Red"},
  {id:16, hex:"#d85d5b", name:"Spiced Coral"},
  {id:17, hex:"#ba5250", name:"Cranberry"},
  {id:18, hex:"#bb2c35", name:"Cherry Red"},
  {id:19, hex:"#8f4440", name:"Brick"},
  {id:20, hex:"#e8ada7", name:"Ballet"},
  {id:21, hex:"#842525", name:"Red Dahlia"},
  {id:22, hex:"#c26f67", name:"Faded Rose"},
  {id:23, hex:"#ea8e83", name:"Burnt Coral"},
  {id:24, hex:"#686160", name:"Pebble"},
  {id:25, hex:"#945c55", name:"Nude Rose"},
  {id:26, hex:"#76433d", name:"Sable"},
  {id:27, hex:"#bd1722", name:"Classic Red"},
  {id:28, hex:"#a02523", name:"Ruby"},
  {id:29, hex:"#cb8579", name:"Canyon Clay"},
  {id:30, hex:"#aa6155", name:"Terracotta"},
  {id:31, hex:"#e33830", name:"Grenadine"},
  {id:32, hex:"#a34233", name:"Cayenne"},
  {id:33, hex:"#c48c7f", name:"Rose Dawn"},
  {id:34, hex:"#c47159", name:"Carnelian"},
  {id:35, hex:"#eae5e0", name:"Porcelain"},
  {id:36, hex:"#8f8576", name:"Greige"},
  {id:37, hex:"#b2d7ba", name:"Sage"},
  {id:38, hex:"#2f3760", name:"Midnight"},
  {id:39, hex:"#c9579c", name:"Magenta"},
  {id:40, hex:"#a3487a", name:"Dahlia Mauve"},
  {id:41, hex:"#170e12", name:"Onyx"},
  {id:42, hex:"#6c3348", name:"Burgundy"},
  {id:43, hex:"#DC3092", name:"Hot Magenta"},
  {id:44, hex:"#4A1820", name:"Oxblood"},
  {id:45, hex:"#2C7E94", name:"Aqua"},
  {id:46, hex:"#2D6850", name:"Teal"},
  {id:47, hex:"#454048", name:"Charcoal"},
  {id:48, hex:"#C0A038", name:"Mustard"},
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

// ── Find closest real products to a wheel color by ΔE ────────────────────────
function getClosestColors(wheelHex, count = 5) {
  const targetLab = hexToLab(wheelHex);
  return REAL_PRODUCTS
    .map(p => ({ ...p, distance: deltaE(targetLab, p.lab) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}
