const { useState, useEffect } = React;

// Look up a product's image URL from the prebuilt index.
// Keys are "brand|product|shade" lowercased.
function getProductImage(p) {
  if (!p || !window.LIPSTICK_IMAGES) return null;
  const key = `${(p.brand||'').toLowerCase()}|${(p.product||'').toLowerCase()}|${(p.shade||'').toLowerCase()}`;
  return window.LIPSTICK_IMAGES[key] || null;
}

// Product thumb: real swatch/bullet photo. The extracted color shows immediately
// as a placeholder; the photo crossfades in once loaded.
function ProductThumb({ product, size = 56, zoom = 1.18 }) {
  const url = getProductImage(product);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => { setLoaded(false); setFailed(false); }, [url]);

  const showImg = url && !failed;
  return (
    <div style={{
      width:size, height:size, flexShrink:0,
      borderRadius:10, overflow:'hidden',
      background: product.hex,
      boxShadow: showImg && loaded ? 'none' : `inset 0 2px 8px ${product.hex}70`,
      border:'1px solid rgba(42,26,20,0.08)',
      position:'relative',
    }}>
      {showImg && (
        <img
          key={url}
          src={url}
          alt={`${product.brand} ${product.shade}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            width:'100%', height:'100%', objectFit:'cover',
            transform:`scale(${zoom})`, transformOrigin:'center',
            display:'block',
            opacity: loaded ? 1 : 0,
            transition:'opacity 0.2s ease',
          }}
        />
      )}
    </div>
  );
}

// Slim vertical color chip — paired with ProductThumb so the
// extracted shade reads clearly even when the photo is busy.
function ShadeChip({ hex, height = 56, width = 10 }) {
  return (
    <div
      title={hex}
      style={{
        width, height, flexShrink:0,
        borderRadius:6, background:hex,
        boxShadow:`0 1px 4px ${hex}55, inset 0 1px 0 rgba(255,255,255,0.18)`,
        border:'1px solid rgba(42,26,20,0.08)',
      }}
    />
  );
}

// Utility: luminance for text contrast
function luminance(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

// finish badge color
function finishColor(finish) {
  const map = { Matte:'#8C6858', Satin:'#C4A060', Cream:'#C87890', Gloss:'#7090A0', Lustre:'#9080A8', Amplified:'#C05870', Frost:'#80A0B0', Sheer:'#B0A090' };
  return map[finish] || '#8C6858';
}

// Brand → price tier heuristics. Unlisted brands default to '$$'.
const BRAND_TIER = {
  // $ — Drugstore / mass-market
  "a'pieu":'$','almay':'$','ardell':'$','australis cosmetics':'$','avon':'$',
  'barry m cosmetics':'$','beauty care naturals':'$','blk/opl':'$','bourjois':'$',
  "burt's bees":'$','catrice':'$','chapstick':'$','colourpop':'$','covergirl':'$',
  'e.l.f. cosmetics':'$','essence':'$','etude':'$','flower beauty':'$','flormar':'$',
  'holika holika':'$','i heart revolution':'$',"i'm meme":'$','iman cosmetics':'$',
  'inc.redible':'$','j.cat beauty':'$','kay beauty':'$',"l'oréal":'$',
  'l.a. colors':'$','l.a. girl':'$','makeup revolution':'$','mango people':'$',
  'max factor':'$','maybelline':'$','milani':'$','morphe 2':'$','mua makeup academy':'$',
  'nature republic':'$','neutrogena':'$','no7':'$','nykaa':'$',
  'nyx professional makeup':'$','pacifica':'$','peripera':'$','physicians formula':'$',
  'revolution pro':'$','revlon':'$','rimmel':'$','sleek makeup':'$','soap & glory':'$',
  'the balm cosmetics':'$','the creme shop':'$','the lip bar':'$','the saem':'$',
  'w7':'$','wet n wild':'$','xx revolution':'$',
  // $$$ — Luxury / designer
  'addiction tokyo':'$$$','aj crimson':'$$$','armani beauty':'$$$',
  'augustinus bader':'$$$','bassam fattouh':'$$$','burberry':'$$$',
  'by terry':'$$$','byredo':'$$$','carolina herrera':'$$$','chanel':'$$$',
  'chantecaille':'$$$','charlotte tilbury':'$$$','christian louboutin':'$$$',
  'clé de peau beauté':'$$$','decorté':'$$$','dior':'$$$','dolce & gabbana':'$$$',
  'edward bess':'$$$','emilie heathe':'$$$','estée lauder':'$$$',
  'fara homidi':'$$$','florasis':'$$$','givenchy':'$$$','gucci':'$$$',
  'guerlain':'$$$','hermès':'$$$','house of sillage':'$$$','isamaya':'$$$',
  'jung saem mool':'$$$','kjaer weis':'$$$','koh gen do':'$$$',
  'la bouche rouge, paris':'$$$','la perla':'$$$','lancôme':'$$$',
  'lunasol':'$$$','mara':'$$$','marc jacobs beauty':'$$$','monika blunder':'$$$',
  'pat mcgrath labs':'$$$','prada beauty':'$$$','rabanne':'$$$',
  'rodin olio lusso':'$$$','sarah creal':'$$$','sensai':'$$$',
  'serge lutens':'$$$','shiseido':'$$$','shu uemura':'$$$','sisley paris':'$$$',
  'skkn by kim':'$$$','suqqu':'$$$','surratt beauty':'$$$','tata harper':'$$$',
  'tatcha':'$$$','tom ford':'$$$','valentino':'$$$',
  'victoria beckham beauty':'$$$','westman atelier':'$$$','yves saint laurent':'$$$',
  // everything else → '$$' (mid-range / prestige)
};

// Compact 5-step tonal ramp anchored to a specific shade (2 lighter, anchor, 2 deeper).
// Used in the results-panel strip for photo/hex/list entry points.
function generateToneSteps(anchorHex, perSide = 2, stepL = 13, baseName = 'This shade') {
  const [L0, a0, b0] = hexToLab(anchorHex);
  const C0 = Math.sqrt(a0 * a0 + b0 * b0);
  const hueRad = Math.atan2(b0, a0);
  const out = [];
  for (let d = -perSide; d <= perSide; d++) {
    const L = Math.max(14, Math.min(90, L0 - d * stepL));
    const C = C0 * (1 - 0.12 * Math.abs(d));
    const name = d === 0 ? baseName
      : d < 0 ? (d === -perSide ? `${baseName} · lightest` : `${baseName} · lighter`)
      :          (d ===  perSide ? `${baseName} · deepest`  : `${baseName} · deeper`);
    out.push({ id: `t-${d}`, hex: labToHex(L, Math.cos(hueRad) * C, Math.sin(hueRad) * C), name });
  }
  return { ramp: out, anchorStep: out[perSide], anchorIdx: perSide };
}

// Generate a light→deep tonal ramp of 11 steps from an anchor hex.
// Holds hue angle constant; tapers chroma at the lightest and deepest ends.
function buildTonalRamp(anchorHex) {
  const [, a, b] = hexToLab(anchorHex);
  const hue = Math.atan2(b, a);
  const chroma = Math.sqrt(a * a + b * b);
  const STEPS = 11;
  return Array.from({ length: STEPS }, (_, i) => {
    const t = i / (STEPS - 1);
    const L = 88 - t * 66; // 88 (lightest) → 22 (deepest)
    // parabolic taper: 0.35 at both ends, 1.0 at t=0.5
    const scale = 0.35 + 0.65 * (1 - Math.pow(2 * t - 1, 2));
    const c = chroma * scale;
    return {
      id: `ramp_${i}`,
      hex: labToHex(L, c * Math.cos(hue), c * Math.sin(hue)),
      name: ['Lightest','Very Light','Light','Medium-Light','Medium-Light',
             'Medium','Medium-Deep','Deep','Deep','Very Deep','Deepest'][i],
    };
  });
}

// ── Color math helpers ─────────────────────────────────────────────────────────
function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1,3),16),
    g: parseInt(hex.slice(3,5),16),
    b: parseInt(hex.slice(5,7),16),
  };
}
function rgbToHsl(r,g,b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s, l=(max+min)/2;
  if(max===min){ h=s=0; }
  else {
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      default: h=((r-g)/d+4)/6;
    }
  }
  return { h:h*360, s, l };
}
function getHsl(hex) {
  const {r,g,b} = hexToRgb(hex);
  return rgbToHsl(r,g,b);
}

// ── Segmented Color Wheel ──────────────────────────────────────────────────────
// Each of the 40 colors gets its own arc segment — clear boundaries, labeled,
// clickable. Colors sorted by hue; arranged in 2 rings (light outer, dark inner).
function ColorWheel({ colors, selectedId, onSelect, hoveredId, onHover, preserveOrder }) {
  const SIZE = 440;
  const CX = SIZE / 2, CY = SIZE / 2;

  const N = colors.length;
  const SINGLE_RING = N <= 14 || N % 2 !== 0;
  const HALF = SINGLE_RING ? N : N / 2;

  // Radii scale with SIZE (designed for 380; scale up/down proportionally)
  const S = SIZE / 380;
  // Outer ring radii
  const R_OUTER_OUT = 184 * S;
  const R_OUTER_IN  = 110 * S;
  // Inner ring radii (only used in 2-ring mode)
  const R_INNER_OUT = 108 * S;
  const R_INNER_IN  = 44 * S;
  // Single-ring radii (one wide ring covering both)
  const R_SINGLE_OUT = 184 * S;
  const R_SINGLE_IN  = 60 * S;

  const GAP_DEG = 0.8;
  const DIVIDER_GAP = 0; // no visual gap — novelty block sits at bottom, GMM fills the rest

  // Build segments with explicit angle ranges.
  const segments = [];
  if (preserveOrder) {
    // Zoom / ΔE mode: colors in passed order, evenly spaced across full 360°
    const sliceDeg = 360 / HALF;
    if (SINGLE_RING) {
      colors.forEach((c, i) => segments.push({ outer: c, inner: null,
        startDeg: i * sliceDeg + GAP_DEG / 2, endDeg: (i + 1) * sliceDeg - GAP_DEG / 2 }));
    } else {
      for (let i = 0; i < HALF; i++) {
        const a = colors[i * 2], b = colors[i * 2 + 1];
        const la = getHsl(a.hex).l, lb = getHsl(b.hex).l;
        const outer = la >= lb ? a : b, inner = la >= lb ? b : a;
        segments.push({ outer, inner,
          startDeg: i * sliceDeg + GAP_DEG / 2, endDeg: (i + 1) * sliceDeg - GAP_DEG / 2 });
      }
    }
  } else {
    // Normal mode: GMM colors hue-sorted across most of the wheel; novelty colors
    // hue-sorted in a fixed block at the bottom (180°), separated by DIVIDER_GAP.
    const sortByHue = arr => [...arr].sort((a, b) => getHsl(a.hex).h - getHsl(b.hex).h);
    const gmmColors = sortByHue(colors.filter(c => !c.novelty));
    const novColors = sortByHue(colors.filter(c =>  c.novelty));
    const sliceDeg  = (360 - DIVIDER_GAP) / HALF;
    const novHalf   = SINGLE_RING ? novColors.length : novColors.length / 2;
    const gmmHalf   = SINGLE_RING ? gmmColors.length : gmmColors.length / 2;
    const novSpan   = novHalf * sliceDeg;
    const novStart  = 180 - novSpan / 2; // center novelty block at bottom (180°)
    const gmmStart  = novStart + novSpan + DIVIDER_GAP;
    for (let i = 0; i < gmmHalf; i++) {
      const a = gmmColors[i * 2], b = gmmColors[i * 2 + 1];
      const la = getHsl(a.hex).l, lb = getHsl(b.hex).l;
      const outer = la >= lb ? a : b, inner = la >= lb ? b : a;
      const s = gmmStart + i * sliceDeg;
      segments.push({ outer, inner, startDeg: s + GAP_DEG / 2, endDeg: s + sliceDeg - GAP_DEG / 2 });
    }
    for (let i = 0; i < novHalf; i++) {
      const a = novColors[i * 2], b = novColors[i * 2 + 1];
      const la = getHsl(a.hex).l, lb = getHsl(b.hex).l;
      const outer = la >= lb ? a : b, inner = la >= lb ? b : a;
      const s = novStart + i * sliceDeg;
      segments.push({ outer, inner, startDeg: s + GAP_DEG / 2, endDeg: s + sliceDeg - GAP_DEG / 2 });
    }
  }

  function polarToXY(angleDeg, r) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }

  function arcPath(startDeg, endDeg, rOuter, rInner) {
    const s1 = polarToXY(startDeg, rOuter);
    const e1 = polarToXY(endDeg,   rOuter);
    const s2 = polarToXY(endDeg,   rInner);
    const e2 = polarToXY(startDeg, rInner);
    const largeArc = (endDeg - startDeg) > 180 ? 1 : 0;
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
      'Z'
    ].join(' ');
  }

  // Label position: midpoint of arc, mid-radius
  function labelPos(startDeg, endDeg, rOuter, rInner) {
    const midDeg = (startDeg + endDeg) / 2;
    const midR = (rOuter + rInner) / 2;
    return polarToXY(midDeg, midR);
  }

  // Text rotation: radial, pointing outward
  function labelRotation(startDeg, endDeg) {
    const mid = (startDeg + endDeg) / 2;
    // Keep text readable: flip if in bottom half
    return mid > 90 && mid < 270 ? mid + 90 : mid - 90;
  }


  return (
    <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width="100%" height="auto"
        style={{ filter:'drop-shadow(0 6px 24px rgba(42,26,20,0.14))', maxWidth: SIZE, display:'block' }}
      >
        {/* Outer background ring */}
        <circle cx={CX} cy={CY} r={R_OUTER_OUT + 2} fill="#F0E8DF" />
        <circle cx={CX} cy={CY} r={R_OUTER_OUT + 2} fill="none" stroke="#E0D0C0" strokeWidth="1.5" />

        {segments.map(({ outer, inner, startDeg, endDeg }) => {

          const outerSelected = outer.id === selectedId;
          const innerSelected = inner && inner.id === selectedId;
          const outerHovered  = outer.id === hoveredId;
          const innerHovered  = inner && inner.id === hoveredId;

          // Pick radii based on single vs double ring
          const outerR1 = SINGLE_RING ? R_SINGLE_OUT : R_OUTER_OUT;
          const outerR2 = SINGLE_RING ? R_SINGLE_IN  : R_OUTER_IN + 1;

          const outerPath = arcPath(startDeg, endDeg, outerR1, outerR2);
          const innerPath = inner ? arcPath(startDeg, endDeg, R_INNER_OUT - 1, R_INNER_IN) : null;

          const outerLabel = labelPos(startDeg, endDeg, outerR1, outerR2);
          const innerLabel = inner ? labelPos(startDeg, endDeg, R_INNER_OUT - 1, R_INNER_IN) : null;
          const outerRot = labelRotation(startDeg, endDeg);
          const innerRot = inner ? labelRotation(startDeg, endDeg) : 0;

          const outerLum = luminance(outer.hex);
          const innerLum = inner ? luminance(inner.hex) : 0;

          return (
            <g key={outer.id}>
              {/* Outer segment */}
              <path
                d={outerPath}
                fill={outer.hex}
                stroke={outerSelected ? '#2A1A14' : '#FAF6F1'}
                strokeWidth={outerSelected ? 2 : 1}
                opacity={outerHovered && !outerSelected ? 0.82 : 1}
                style={{ cursor:'pointer', transition:'opacity 0.12s' }}
                onClick={() => onSelect(outer)}
                onMouseEnter={() => onHover(outer.id)}
                onMouseLeave={() => onHover(null)}
              />
              {/* Selected ring highlight outer */}
              {outerSelected && (
                <path d={outerPath} fill="none" stroke="#2A1A14" strokeWidth="2.5" opacity="0.6" />
              )}

              {/* Inner segment */}
              {inner && (
                <>
                  <path
                    d={innerPath}
                    fill={inner.hex}
                    stroke={innerSelected ? '#2A1A14' : '#FAF6F1'}
                    strokeWidth={innerSelected ? 2 : 1}
                    opacity={innerHovered && !innerSelected ? 0.82 : 1}
                    style={{ cursor:'pointer', transition:'opacity 0.12s' }}
                    onClick={() => onSelect(inner)}
                    onMouseEnter={() => onHover(inner.id)}
                    onMouseLeave={() => onHover(null)}
                  />
                  {innerSelected && (
                    <path d={innerPath} fill="none" stroke="#2A1A14" strokeWidth="2.5" opacity="0.6" />
                  )}
                </>
              )}

              {/* Labels intentionally omitted — fantasy names aren't informative.
                   The swatches speak for themselves; selected color is shown in
                   the center and in the pill below the wheel. */}
            </g>
          );
        })}

        {/* Center circle — shows selected color */}
        <circle cx={CX} cy={CY} r={(SINGLE_RING ? R_SINGLE_IN : R_INNER_IN) - 1}
          fill={selectedId ? (colors.find(c=>c.id===selectedId)?.hex || '#FAF6F1') : '#FAF6F1'}
          stroke="#E0D0C0" strokeWidth="1.5"
          style={{ transition:'fill 0.3s ease' }}
        />
        {selectedId && (() => {
          const c = colors.find(c=>c.id===selectedId);
          if (!c) return null;
          const lum = luminance(c.hex);
          return (
            <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="500"
              fill={lum > 0.32 ? 'rgba(42,26,20,0.7)' : 'rgba(255,255,255,0.85)'}
              style={{ pointerEvents:'none', userSelect:'none' }}
            >
              {c.hex.toUpperCase()}
            </text>
          );
        })()}

        {/* Outer border */}
        <circle cx={CX} cy={CY} r={R_OUTER_OUT + 2} fill="none" stroke="#D8C8B8" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── Filter Dropdown ───────────────────────────────────────────────────────────
function FilterDropdown({ label, count, onClear, isOpen, onOpen, children }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!isOpen) return;
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) onOpen(null); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, onOpen]);
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => onOpen(isOpen ? null : label)} style={{
        display:'inline-flex', alignItems:'center', gap:7,
        fontSize:11, padding:'5px 12px', borderRadius:20,
        border:`1.5px solid ${count ? 'var(--espresso-mid)' : 'var(--border)'}`,
        background: count ? 'rgba(92,61,48,0.08)' : (isOpen ? 'var(--cream-dark)' : 'transparent'),
        color: count ? 'var(--espresso-mid)' : 'var(--text-muted)',
        cursor:'pointer', fontFamily:'DM Sans', fontWeight: count ? 500 : 400,
        letterSpacing:'0.06em', textTransform:'uppercase', transition:'all 0.15s',
      }}>
        {label}
        {count > 0 && (
          <span style={{ background:'var(--espresso-mid)', color:'#fff', fontSize:11, padding:'1px 6px', borderRadius:20, lineHeight:1.6 }}>{count}</span>
        )}
        <span style={{ fontSize:10, opacity:0.55, transform: isOpen ? 'rotate(180deg)':'none', transition:'transform 0.15s' }}>▼</span>
      </button>
      {isOpen && (
        <div style={{
          position:'absolute', top:'calc(100% + 7px)', left:0, zIndex:60,
          background:'#fff', border:'1px solid var(--border)', borderRadius:14,
          boxShadow:'0 10px 30px rgba(42,26,20,0.18)', padding:14,
          minWidth:200, maxWidth:300,
          animation:'fadeUp 0.15s ease',
        }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {children}
          </div>
          {count > 0 && (
            <button onClick={onClear} style={{
              marginTop:10, fontSize:11, padding:'4px 10px', borderRadius:20,
              border:'1px solid var(--border)', background:'transparent',
              color:'var(--text-muted)', cursor:'pointer', fontFamily:'DM Sans',
              letterSpacing:'0.04em',
            }}>Clear {label.toLowerCase()}</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Results Table ─────────────────────────────────────────────────────────────
function ResultsTable({ selectedColor, matches, totalProducts, pinnedItems, togglePin, wishlist, toggleWishlist, toneRamp, toneIdx, setToneIdx }) {
  const [activeFinishes, setActiveFinishes] = React.useState([]);
  const [activeBrands, setActiveBrands] = React.useState([]);
  const [activeTones, setActiveTones] = React.useState([]);
  const [activeTiers, setActiveTiers] = React.useState([]);
  const [openFilter, setOpenFilter] = React.useState(null);

  // Reset filters when selection changes
  React.useEffect(() => { setActiveFinishes([]); setActiveBrands([]); setActiveTones([]); setActiveTiers([]); setOpenFilter(null); }, [selectedColor?.id]);

  // Classify undertone from LAB hue angle (matches Vibe panel logic)
  function toneOf(p) {
    const lab = p.cielab || p.lab;
    if (!lab || lab.length < 3) return 'neutral';
    const [, a, b] = lab;
    if (a <= 0) return 'neutral';
    const h = Math.atan2(b, a) * 180 / Math.PI;
    if (h < 12) return 'cool';
    if (h > 28) return 'warm';
    return 'neutral';
  }

  function tierOf(p) { return BRAND_TIER[p.brand] || '$$'; }

  // Derive available options from matches
  const allFinishes = [...new Set(matches.map(p => p.finish))].sort();
  const allBrands   = [...new Set(matches.map(p => p.brand))].sort();
  const allTones    = [...new Set(matches.map(toneOf))];
  const TONE_ORDER  = ['cool','neutral','warm'];
  const orderedTones = TONE_ORDER.filter(t => allTones.includes(t));
  const TIER_ORDER  = ['$','$$','$$$'];
  const allTiers    = TIER_ORDER.filter(t => matches.some(p => tierOf(p) === t));

  if (!selectedColor) return (
    <div className="results-empty-state" style={{
      flex:1, display:'flex', alignItems:'center', justifyContent:'center',
      color:'var(--text-muted)', textAlign:'center', padding:40,
    }}>
      <p style={{ fontFamily:'DM Sans', fontSize:13, letterSpacing:'0.02em' }}>
        Your matches will appear here
      </p>
    </div>
  );

  // Toggle a finish on/off
  function toggleFinish(f) {
    if (!activeFinishes.includes(f)) window.gtag?.('event', 'apply_filter', { filter_type: 'finish', filter_value: f });
    setActiveFinishes(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }

  // Toggle a brand on/off
  function toggleBrand(b) {
    if (!activeBrands.includes(b)) window.gtag?.('event', 'apply_filter', { filter_type: 'brand', filter_value: b });
    setActiveBrands(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    );
  }

  // Apply both filters
  // Toggle a tone on/off
  function toggleTone(t) {
    if (!activeTones.includes(t)) window.gtag?.('event', 'apply_filter', { filter_type: 'undertone', filter_value: t });
    setActiveTones(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  function toggleTier(t) {
    if (!activeTiers.includes(t)) window.gtag?.('event', 'apply_filter', { filter_type: 'price_tier', filter_value: t });
    setActiveTiers(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  const filtered = matches.filter(p =>
    (activeFinishes.length === 0 || activeFinishes.includes(p.finish)) &&
    (activeBrands.length === 0   || activeBrands.includes(p.brand))   &&
    (activeTones.length === 0    || activeTones.includes(toneOf(p)))   &&
    (activeTiers.length === 0    || activeTiers.includes(tierOf(p)))
  );

  const maxDist = filtered.length > 0 ? Math.max(...filtered.map(p=>p.distance)) : 1;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Selected color header */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, marginBottom:18,
        padding:'12px 18px', background:'#fff',
        borderRadius:14, border:'1px solid var(--border)',
        boxShadow:'0 2px 12px var(--shadow)',
      }}>
        <div style={{
          width:38, height:38, borderRadius:'50%',
          background: selectedColor.hex,
          boxShadow:`0 3px 10px ${selectedColor.hex}80, inset 0 -2px 4px rgba(0,0,0,0.15)`,
          flexShrink:0,
        }} />
        <div>
          <p style={{ fontFamily:'Cormorant Garamond', fontSize:18, fontWeight:500, lineHeight:1.15 }}>
            {selectedColor.name}
          </p>
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, fontFamily:'DM Sans', letterSpacing:'0.05em' }}>
            {selectedColor.hex.toUpperCase()} · Closest lip matches by ΔE
          </p>
        </div>
        {/* Stacked swatches of top matches */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center' }}>
          {matches.slice(0,5).map((m,i) => (
            <div key={i} style={{
              width:20, height:20, borderRadius:'50%',
              background: m.hex,
              border:'2px solid #fff',
              marginLeft: i > 0 ? -10 : 0,
              boxShadow:'0 1px 4px rgba(42,26,20,0.18)',
              zIndex: 5-i,
              position:'relative',
            }} title={`${m.brand} — ${m.shade}`} />
          ))}
        </div>
      </div>

      {/* Tonal range strip — photo / hex / list entry points only */}
      {toneRamp && toneRamp.ramp.length > 1 && (
        <div style={{
          marginBottom:12, padding:'9px 12px 10px', background:'#fff',
          borderRadius:12, border:'1px solid var(--border)', boxShadow:'0 2px 12px var(--shadow)',
        }}>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Sans', letterSpacing:'0.03em', flexShrink:0 }}>Lighter</span>
            {toneRamp.ramp.map((step, i) => {
              const isAnchor = i === toneRamp.anchorIdx;
              const isActive = i === toneIdx;
              return (
                <button key={step.id} onClick={() => setToneIdx(i)}
                  title={isAnchor ? `${step.name} (your shade)` : step.name}
                  style={{
                    flex:1, height:32, borderRadius:7, cursor:'pointer', padding:0,
                    background: step.hex,
                    border: isActive ? '2.5px solid var(--espresso)' : '2px solid #fff',
                    outline: isAnchor && !isActive ? '1.5px dashed rgba(42,26,20,0.35)' : 'none',
                    outlineOffset: -5,
                    boxShadow: isActive ? '0 3px 10px rgba(42,26,20,0.28)' : '0 1px 3px rgba(42,26,20,0.12)',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                    transition:'all 0.15s',
                  }}
                />
              );
            })}
            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Sans', letterSpacing:'0.03em', flexShrink:0 }}>Deeper</span>
          </div>
          <div style={{ marginTop:6, display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:16 }}>
            <span style={{ fontSize:11, fontFamily:'DM Sans', color:'var(--text-muted)', letterSpacing:'0.03em' }}>
              {toneIdx === toneRamp.anchorIdx
                ? 'Showing matches for your exact shade'
                : <span>Matches for a <strong style={{ color:'var(--espresso)', fontWeight:600 }}>{toneRamp.ramp[toneIdx]?.name.split('· ')[1] || 'variant'}</strong> version · {selectedColor.hex.toUpperCase()}</span>}
            </span>
            {toneIdx !== toneRamp.anchorIdx && (
              <button onClick={() => setToneIdx(toneRamp.anchorIdx)} style={{
                fontSize:11, padding:'3px 10px', borderRadius:20, border:'1px solid var(--border)',
                background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontFamily:'DM Sans',
                letterSpacing:'0.04em', flexShrink:0, marginLeft:10,
              }}>Reset to my shade</button>
            )}
          </div>
        </div>
      )}

      {/* Compact filter bar */}
      {(allFinishes.length > 1 || orderedTones.length >= 1 || allBrands.length > 1 || allTiers.length > 1) && (
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:8, marginBottom:14 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'DM Sans', marginRight:2 }}>
            Filter
          </span>

          {allBrands.length > 1 && (
            <FilterDropdown label="Brand" count={activeBrands.length}
              isOpen={openFilter==='Brand'} onOpen={setOpenFilter}
              onClear={() => setActiveBrands([])}>
              {allBrands.map(b => {
                const active = activeBrands.includes(b);
                return (
                  <button key={b} onClick={() => toggleBrand(b)} style={{
                    fontSize:11, padding:'4px 12px', borderRadius:20,
                    border:`1.5px solid ${active ? 'var(--espresso-mid)' : 'var(--border)'}`,
                    background: active ? 'rgba(92,61,48,0.10)' : 'transparent',
                    color: active ? 'var(--espresso-mid)' : 'var(--text-muted)',
                    cursor:'pointer', fontFamily:'DM Sans', fontWeight: active ? 500 : 400,
                    letterSpacing:'0.04em', transition:'all 0.15s', whiteSpace:'nowrap',
                  }}>{b}{active && <span style={{ marginLeft:5, opacity:0.6, fontSize:10 }}>✕</span>}</button>
                );
              })}
            </FilterDropdown>
          )}

          {allTiers.length > 1 && (
            <FilterDropdown label="Price" count={activeTiers.length}
              isOpen={openFilter==='Price'} onOpen={setOpenFilter}
              onClear={() => setActiveTiers([])}>
              {allTiers.map(t => {
                const active = activeTiers.includes(t);
                return (
                  <button key={t} onClick={() => toggleTier(t)} style={{
                    fontSize:11, padding:'4px 12px', borderRadius:20,
                    border:`1.5px solid ${active ? '#8a6e2e' : 'var(--border)'}`,
                    background: active ? 'rgba(138,110,46,0.12)' : 'transparent',
                    color: active ? '#8a6e2e' : 'var(--text-muted)',
                    cursor:'pointer', fontFamily:'DM Sans', fontWeight: active ? 600 : 400,
                    letterSpacing:'0.04em', transition:'all 0.15s', whiteSpace:'nowrap',
                  }}>{t}{active && <span style={{ marginLeft:5, opacity:0.6, fontSize:10 }}>✕</span>}</button>
                );
              })}
            </FilterDropdown>
          )}

          {allFinishes.length > 1 && (
            <FilterDropdown label="Finish" count={activeFinishes.length}
              isOpen={openFilter==='Finish'} onOpen={setOpenFilter}
              onClear={() => setActiveFinishes([])}>
              {allFinishes.map(f => {
                const active = activeFinishes.includes(f);
                const fc = finishColor(f);
                return (
                  <button key={f} onClick={() => toggleFinish(f)} style={{
                    fontSize:11, padding:'4px 12px', borderRadius:20,
                    border:`1.5px solid ${active ? fc : 'var(--border)'}`,
                    background: active ? fc + '22' : 'transparent',
                    color: active ? fc : 'var(--text-muted)',
                    cursor:'pointer', fontFamily:'DM Sans', fontWeight: active ? 500 : 400,
                    letterSpacing:'0.04em', transition:'all 0.15s', whiteSpace:'nowrap',
                  }}>{f}{active && <span style={{ marginLeft:5, opacity:0.6, fontSize:12 }}>✕</span>}</button>
                );
              })}
            </FilterDropdown>
          )}

          {orderedTones.length >= 1 && (
            <FilterDropdown label="Undertone" count={activeTones.length}
              isOpen={openFilter==='Undertone'} onOpen={setOpenFilter}
              onClear={() => setActiveTones([])}>
              {orderedTones.map(t => {
                const active = activeTones.includes(t);
                return (
                  <button key={t} onClick={() => toggleTone(t)} style={{
                    fontSize:11, padding:'4px 12px', borderRadius:20,
                    border:`1.5px solid ${active ? 'var(--espresso-mid)' : 'var(--border)'}`,
                    background: active ? 'rgba(92,61,48,0.10)' : 'transparent',
                    color: active ? 'var(--espresso-mid)' : 'var(--text-muted)',
                    cursor:'pointer', fontFamily:'DM Sans', letterSpacing:'0.04em',
                    textTransform:'capitalize', transition:'all 0.15s', whiteSpace:'nowrap',
                  }}>{t}</button>
                );
              })}
            </FilterDropdown>
          )}

          {(activeFinishes.length > 0 || activeBrands.length > 0 || activeTones.length > 0 || activeTiers.length > 0) && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
              <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Sans' }}>
                {filtered.length} of {matches.length} shown
              </span>
              <button onClick={() => { setActiveFinishes([]); setActiveBrands([]); setActiveTones([]); setActiveTiers([]); }} style={{
                fontSize:11, padding:'3px 10px', borderRadius:20, border:'1px solid var(--border)',
                background:'transparent', color:'var(--blush)', cursor:'pointer',
                fontFamily:'DM Sans', letterSpacing:'0.04em',
              }}>Clear all</button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ flex:1, overflowY:'auto', borderRadius:16, border:'1px solid var(--border)', background:'#fff', boxShadow:'0 2px 12px var(--shadow)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--cream-dark)', borderBottom:'1.5px solid var(--border)' }}>
              {[
                {h:'', cls:''},
                {h:'Color', cls:''},
                {h:'Brand', cls:''},
                {h:'Product', cls:'col-hide-narrow'},
                {h:'Shade', cls:''},
                {h:'Finish', cls:'col-hide-mobile'},
                {h:'ΔE', cls:''},
                {h:'', cls:''},
              ].map((c, idx) => (
                <th key={idx} className={c.cls} style={{
                  padding:'12px 16px', textAlign:'left',
                  fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase',
                  color:'var(--text-muted)', fontWeight:500, fontFamily:'DM Sans',
                  whiteSpace:'nowrap',
                }}>
                  {c.h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding:'32px 16px', textAlign:'center', color:'var(--text-muted)', fontFamily:'Cormorant Garamond', fontSize:16, fontStyle:'italic' }}>
                No matches for the selected filters — try clearing a filter
              </td></tr>
            )}
            {filtered.map((p, i) => (
              <tr key={i} style={{
                borderBottom: i < filtered.length-1 ? '1px solid var(--cream-dark)' : 'none',
                background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background='var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                {/* Heart / wishlist button */}
                <td style={{ padding:'14px 4px 14px 16px', width:36 }}>
                  {(() => {
                    const isLiked = wishlist.some(x => x.brand === p.brand && x.shade === p.shade);
                    return (
                      <button
                        onClick={e => { e.stopPropagation(); toggleWishlist(p); }}
                        title={isLiked ? 'Remove from My Favorites' : 'Save to My Favorites'}
                        style={{
                          width:28, height:28, borderRadius:'50%', border:'none',
                          background:'transparent', cursor:'pointer',
                          fontSize:20, color: isLiked ? 'var(--blush)' : 'var(--border)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'transform 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.2)'; if (!isLiked) e.currentTarget.style.color='var(--blush-light)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; if (!isLiked) e.currentTarget.style.color='var(--border)'; }}
                      >
                        {isLiked ? '♥' : '♡'}
                      </button>
                    );
                  })()}
                </td>
                {/* Product photo + extracted CIELAB swatch */}
                <td style={{ padding:'10px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <ProductThumb product={p} size={40} />
                    <ShadeChip hex={p.hex} height={40} width={7} />
                  </div>
                </td>
                <td style={{ padding:'14px 16px', fontSize:13, fontWeight:500, color:'var(--espresso)', fontFamily:'DM Sans', whiteSpace:'nowrap' }}>
                  {p.brand}
                </td>
                <td className="col-hide-narrow" style={{ padding:'14px 16px', fontSize:12, color:'var(--text-body)', fontFamily:'DM Sans' }}>
                  {p.product}
                </td>
                <td style={{ padding:'14px 16px', fontStyle:'italic', fontFamily:'Cormorant Garamond', fontSize:15, color:'var(--espresso-mid)' }}>
                  {p.shade}
                </td>
                <td className="col-hide-mobile" style={{ padding:'14px 16px' }}>
                  <span style={{
                    fontSize:11, padding:'3px 10px', borderRadius:20,
                    background: finishColor(p.finish) + '18',
                    color: finishColor(p.finish),
                    fontWeight:500, letterSpacing:'0.04em',
                    fontFamily:'DM Sans',
                  }}>
                    {p.finish}
                  </span>
                </td>
                {/* ΔE distance — lower is closer */}
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{
                      width:40, height:4, borderRadius:2,
                      background:'var(--cream-dark)', overflow:'hidden',
                    }}>
                      <div style={{
                        height:'100%', borderRadius:2,
                        width:`${Math.max(8, 100 - (p.distance / (maxDist+1)) * 100)}%`,
                        background:'var(--blush)',
                        transition:'width 0.3s',
                      }} />
                    </div>
                    <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Sans', minWidth:28 }}>
                      {p.distance.toFixed(1)}
                    </span>
                  </div>
                </td>
                {/* Pin button */}
                <td style={{ padding:'14px 12px' }}>
                  {(() => {
                    const isPinned = pinnedItems.some(x => x.brand === p.brand && x.shade === p.shade);
                    const isFull = pinnedItems.length >= 4 && !isPinned;
                    return (
                      <button
                        onClick={e => { e.stopPropagation(); togglePin(p); }}
                        title={isPinned ? 'Remove from comparison' : isFull ? 'Max 4 items' : 'Add to comparison'}
                        style={{
                          width:28, height:28, borderRadius:'50%', border:'none',
                          background: isPinned ? 'var(--espresso)' : 'var(--cream-dark)',
                          color: isPinned ? '#FAF6F1' : 'var(--text-muted)',
                          cursor: isFull ? 'not-allowed' : 'pointer',
                          fontSize:13, display:'flex', alignItems:'center', justifyContent:'center',
                          opacity: isFull ? 0.35 : 1,
                          transition:'all 0.15s', flexShrink:0,
                        }}
                      >
                        {isPinned ? '✕' : '+'}
                      </button>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tweaks Panel ──────────────────────────────────────────────────────────────
function TweaksPanel({ tweaks, setTweak, onClose }) {
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:200,
      background:'#fff', borderRadius:16, border:'1px solid var(--border)',
      boxShadow:'0 8px 32px rgba(42,26,20,0.16)',
      padding:24, width:240,
      fontFamily:'DM Sans', fontSize:13,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <span style={{ fontFamily:'Cormorant Garamond', fontSize:18, fontWeight:500 }}>Tweaks</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-muted)' }}>×</button>
      </div>

      <label style={{ display:'block', marginBottom:6, color:'var(--text-muted)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase' }}>ΔE Band</label>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <input type="range" min={2} max={20} step={1} value={tweaks.maxDeltaE}
          onChange={e => setTweak('maxDeltaE', +e.target.value)}
          style={{ flex:1, accentColor:'var(--blush)' }} />
        <span style={{ width:20, textAlign:'center', color:'var(--espresso)', fontWeight:500 }}>{tweaks.maxDeltaE}</span>
      </div>

      <label style={{ display:'block', marginBottom:6, color:'var(--text-muted)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase' }}>Accent Color</label>
      <div style={{ display:'flex', gap:8 }}>
        {['#C87890','#C4A060','#7090A0','#A87060','#8090C0'].map(c => (
          <button key={c} onClick={() => setTweak('accentColor', c)}
            style={{
              width:28, height:28, borderRadius:'50%', background:c, border:'none',
              cursor:'pointer',
              boxShadow: tweaks.accentColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : '0 1px 4px rgba(42,26,20,0.15)',
            }} />
        ))}
      </div>
    </div>
  );
}

// ── Shareable Image (Instagram-friendly) ──────────────────────────────────────
// Draws a clean 4:5 portrait card (1080×1350) of the user's wishlist to a
// canvas, then lets them preview, download, or copy it to clipboard.
function drawShareImage(canvas, wishlist) {
  const W = 1080, H = 1350;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background — cream with subtle vertical wash
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#FBF7F2');
  bgGrad.addColorStop(1, '#F4ECE2');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Very soft noise dots for paper feel
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#2A1A14' : '#FAF6F1';
    const x = Math.random() * W, y = Math.random() * H;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();

  // Top border accent line
  ctx.strokeStyle = '#E0D0C4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 140); ctx.lineTo(W - 80, 140);
  ctx.stroke();

  // Header eyebrow (manually letterspaced)
  ctx.fillStyle = '#8C6858';
  ctx.font = '500 18px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const eyebrow = 'L I P  ·  C O L O R  ·  F I N D E R';
  ctx.fillText(eyebrow, W / 2, 105);

  // Title — Cormorant Garamond italic
  ctx.fillStyle = '#2A1A14';
  ctx.font = '300 italic 86px "Cormorant Garamond", serif';
  ctx.fillText('my lipstick', W / 2, 230);
  ctx.font = '400 italic 86px "Cormorant Garamond", serif';
  ctx.fillText('shortlist', W / 2, 320);

  // Date / count subtitle
  ctx.fillStyle = '#8C6858';
  ctx.font = '400 17px "DM Sans", sans-serif';
  const subtitle = `${wishlist.length} ${wishlist.length === 1 ? 'shade' : 'shades'}  ·  ${new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}`;
  ctx.fillText(subtitle, W / 2, 370);

  // ── Shade list ───────────────────────────────────────────────────────────
  const LIST_TOP = 440;
  const LIST_BOTTOM = H - 130;
  const LIST_LEFT = 110;
  const LIST_RIGHT = W - 110;
  const listW = LIST_RIGHT - LIST_LEFT;

  // Layout: single column up to 8 items, two columns otherwise
  const twoCol = wishlist.length > 8;
  const cols = twoCol ? 2 : 1;
  const rows = Math.ceil(wishlist.length / cols);
  const colW = listW / cols;
  const rowH = Math.min(120, (LIST_BOTTOM - LIST_TOP) / Math.max(rows, 1));
  const swatchR = Math.min(36, rowH * 0.32);

  ctx.textBaseline = 'middle';
  for (let i = 0; i < wishlist.length; i++) {
    const p = wishlist[i];
    const col = twoCol ? i % 2 : 0;
    const row = twoCol ? Math.floor(i / 2) : i;
    const cx = LIST_LEFT + col * colW + 16;
    const cy = LIST_TOP + row * rowH + rowH / 2;

    // Color swatch — circle with soft shadow
    ctx.save();
    ctx.shadowColor = p.hex + '88';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = p.hex;
    ctx.beginPath();
    ctx.arc(cx + swatchR, cy, swatchR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Subtle outer ring
    ctx.strokeStyle = 'rgba(42,26,20,0.10)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx + swatchR, cy, swatchR, 0, Math.PI * 2);
    ctx.stroke();

    // Text block
    const tx = cx + swatchR * 2 + 22;
    const textMaxW = colW - swatchR * 2 - 50;

    // Brand
    ctx.fillStyle = '#2A1A14';
    ctx.textAlign = 'left';
    ctx.font = `500 ${twoCol ? 17 : 22}px "DM Sans", sans-serif`;
    ctx.fillText(clipToWidth(ctx, p.brand, textMaxW), tx, cy - (twoCol ? 16 : 20));

    // Shade — italic serif
    ctx.fillStyle = '#5C3D30';
    ctx.font = `400 italic ${twoCol ? 21 : 28}px "Cormorant Garamond", serif`;
    ctx.fillText(clipToWidth(ctx, p.shade, textMaxW), tx, cy + (twoCol ? 7 : 10));

    // Finish + hex meta
    ctx.fillStyle = '#A08878';
    ctx.font = `400 ${twoCol ? 12 : 13}px "DM Sans", sans-serif`;
    const meta = `${(p.finish || '').toUpperCase()}  ·  ${p.hex.toUpperCase()}`;
    ctx.fillText(meta, tx, cy + (twoCol ? 28 : 38));
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = '#E0D0C4';
  ctx.beginPath();
  ctx.moveTo(80, H - 95); ctx.lineTo(W - 80, H - 95);
  ctx.stroke();

  // Tiny lipstick bullet icon
  const fx = W / 2 - 130, fy = H - 55;
  ctx.fillStyle = '#C87890';
  ctx.beginPath();
  ctx.moveTo(fx, fy + 6);
  ctx.lineTo(fx, fy - 8);
  ctx.quadraticCurveTo(fx, fy - 20, fx + 8, fy - 22);
  ctx.quadraticCurveTo(fx + 16, fy - 20, fx + 16, fy - 8);
  ctx.lineTo(fx + 16, fy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2A1A14';
  ctx.fillRect(fx - 2, fy + 6, 20, 5);

  // Footer text
  ctx.fillStyle = '#5C3D30';
  ctx.textAlign = 'left';
  ctx.font = '500 14px "DM Sans", sans-serif';
  ctx.fillText('made with Lipstick Color Finder', fx + 30, fy - 5);
}

// Truncate text with an ellipsis to fit a max width.
function clipToWidth(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) {
    s = s.slice(0, -1);
  }
  return s + '…';
}

function ShareImageModal({ wishlist, onClose }) {
  const canvasRef = React.useRef(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    // Make sure custom fonts are loaded before drawing
    const ready = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();
    ready.then(() => {
      if (cancelled || !canvasRef.current) return;
      drawShareImage(canvasRef.current, wishlist);
      setBusy(false);
    });
    return () => { cancelled = true; };
  }, [wishlist]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-lipstick-shortlist-${new Date().toISOString().slice(0,10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Saved!'); setTimeout(() => setStatus(null), 2200);
    }, 'image/png');
  }

  async function copyImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob || !navigator.clipboard || !window.ClipboardItem) {
        setStatus('Copy not supported — use Save'); setTimeout(() => setStatus(null), 2500);
        return;
      }
      await navigator.clipboard.write([
        new window.ClipboardItem({ 'image/png': blob }),
      ]);
      setStatus('Image copied!'); setTimeout(() => setStatus(null), 2200);
    } catch (e) {
      setStatus('Copy failed — try Save'); setTimeout(() => setStatus(null), 2500);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(42,26,20,0.55)',
        zIndex:300, backdropFilter:'blur(4px)',
      }} />
      <div style={{
        position:'fixed', inset:0, zIndex:301,
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'24px', pointerEvents:'none',
      }}>
        <div style={{
          background:'var(--cream)', borderRadius:20,
          boxShadow:'0 24px 60px rgba(42,26,20,0.32)',
          padding:'28px 32px 24px',
          maxWidth:520, width:'100%', maxHeight:'92vh',
          display:'flex', flexDirection:'column', gap:18,
          pointerEvents:'auto',
          animation:'fadeUp 0.25s ease',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:18 }}>📸</span>
            <h3 style={{ fontFamily:'Cormorant Garamond', fontWeight:500, fontSize:22, color:'var(--espresso)' }}>
              Share your shortlist
            </h3>
            <button onClick={onClose} style={{
              marginLeft:'auto', width:32, height:32, borderRadius:'50%',
              border:'1px solid var(--border)', background:'#fff',
              cursor:'pointer', color:'var(--text-muted)', fontSize:14,
            }}>✕</button>
          </div>

          <p style={{ fontSize:13, color:'var(--text-muted)', fontFamily:'DM Sans', lineHeight:1.5, marginTop:-4 }}>
            A portrait card sized for Instagram (4:5). Save it and post it to your story, feed, or send it to a friend.
          </p>

          {/* Canvas preview — scales to fit modal */}
          <div style={{
            background:'#2A1A14', borderRadius:14, padding:10, overflow:'hidden',
            display:'flex', alignItems:'center', justifyContent:'center',
            position:'relative', minHeight:200,
          }}>
            <canvas
              ref={canvasRef}
              style={{
                width:'100%', height:'auto', maxHeight:'58vh',
                objectFit:'contain', borderRadius:8, display:'block',
                opacity: busy ? 0 : 1, transition:'opacity 0.2s',
              }}
            />
            {busy && (
              <span style={{
                position:'absolute', color:'#FAF6F1',
                fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:16,
              }}>
                Composing your card…
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={download} style={{
              flex:1, padding:'14px',
              borderRadius:12, border:'none',
              background:'var(--espresso)', color:'var(--cream)',
              cursor:'pointer', fontFamily:'DM Sans', fontSize:12, fontWeight:500,
              letterSpacing:'0.08em', textTransform:'uppercase',
            }}>
              ⬇  Save image
            </button>
            <button onClick={copyImage} style={{
              flex:1, padding:'14px',
              borderRadius:12, border:'1.5px solid var(--border)',
              background:'#fff', color:'var(--espresso)',
              cursor:'pointer', fontFamily:'DM Sans', fontSize:12, fontWeight:500,
              letterSpacing:'0.08em', textTransform:'uppercase',
            }}>
              📋  Copy image
            </button>
          </div>

          {status && (
            <p style={{
              fontSize:12, color:'var(--blush)', fontFamily:'DM Sans',
              textAlign:'center', letterSpacing:'0.06em',
            }}>{status}</p>
          )}

          <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'DM Sans', textAlign:'center', marginTop:-4 }}>
            Tip: on mobile, long-press the saved image to share it directly to Instagram or other apps.
          </p>
        </div>
      </div>
    </>
  );
}

// ── Wishlist Panel ────────────────────────────────────────────────────────────
function WishlistPanel({ wishlist, onClose, onRemove, onClear }) {
  const [copied, setCopied] = useState(null);
  const [showShareImage, setShowShareImage] = useState(false);

  // Format the list as plain text for export / clipboard / email
  function formatAsText() {
    if (wishlist.length === 0) return '';
    const lines = ['My Lipstick Shortlist', '─'.repeat(40), ''];
    wishlist.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.brand}`);
      lines.push(`   ${p.product}`);
      lines.push(`   Shade: ${p.shade}`);
      lines.push(`   Finish: ${p.finish}`);
      lines.push(`   Color: ${p.hex.toUpperCase()}`);
      lines.push('');
    });
    lines.push(`Saved from Lipstick Color Finder · ${new Date().toLocaleDateString()}`);
    return lines.join('\n');
  }

  function copyTextFallback(text) {
    // Fallback for iframes / non-secure contexts where navigator.clipboard fails
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0'; ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copyToClipboard() {
    window.gtag?.('event', 'share_wishlist', { method: 'copy_text' });
    const text = formatAsText();
    const done = () => { setCopied('text'); setTimeout(() => setCopied(null), 2000); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        if (copyTextFallback(text)) done();
      });
    } else {
      if (copyTextFallback(text)) done();
    }
  }

  function downloadTxt() {
    window.gtag?.('event', 'share_wishlist', { method: 'download_txt' });
    const blob = new Blob([formatAsText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `my-lipstick-list-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied('download'); setTimeout(() => setCopied(null), 2000);
  }

  function copyShareLink() {
    window.gtag?.('event', 'share_wishlist', { method: 'copy_link' });
    const slugs = wishlist.map(p => `${p.brand}|${p.shade}`).join(',');
    const url = `${window.location.origin}${window.location.pathname}?list=${encodeURIComponent(slugs)}`;
    const done = () => { setCopied('link'); setTimeout(() => setCopied(null), 2000); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done).catch(() => {
        if (copyTextFallback(url)) done();
      });
    } else {
      if (copyTextFallback(url)) done();
    }
  }

  const exportActions = [
    { id:'text',     label:'Copy as text',  icon:'📋', onClick: copyToClipboard, done: copied === 'text' ? 'Copied!' : null },
    { id:'download', label:'Download .txt', icon:'⬇',  onClick: downloadTxt,    done: copied === 'download' ? 'Downloaded!' : null },
    { id:'link',     label:'Copy link',     icon:'🔗', onClick: copyShareLink,  done: copied === 'link' ? 'Copied!' : null },
    { id:'image',    label:'Share as image',icon:'📸', onClick: () => { window.gtag?.('event', 'share_wishlist', { method: 'share_image' }); setShowShareImage(true); }, done: null },
  ];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, background:'rgba(42,26,20,0.35)',
        zIndex:200, backdropFilter:'blur(2px)',
      }} />

      {/* Panel */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0, width:'min(480px, 100%)',
        background:'var(--cream)', zIndex:201,
        boxShadow:'-8px 0 32px rgba(42,26,20,0.18)',
        display:'flex', flexDirection:'column',
        animation:'slideInRight 0.3s ease-out',
      }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{
          padding:'24px 32px 20px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <span style={{ color:'var(--blush)', fontSize:22 }}>♥</span>
          <h2 style={{ fontFamily:'Cormorant Garamond', fontWeight:400, fontSize:26, color:'var(--espresso)' }}>
            My Favorites
          </h2>
          <span style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.06em' }}>
            {wishlist.length} {wishlist.length === 1 ? 'shade' : 'shades'} saved
          </span>
          <button onClick={onClose} style={{
            marginLeft:'auto', width:32, height:32, borderRadius:'50%',
            border:'1px solid var(--border)', background:'#fff',
            cursor:'pointer', color:'var(--text-muted)', fontSize:14,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 32px' }}>
          {wishlist.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
              <div style={{ fontSize:48, color:'var(--border)', marginBottom:16 }}>♡</div>
              <p style={{ fontFamily:'Cormorant Garamond', fontSize:18, fontStyle:'italic', lineHeight:1.5 }}>
                Tap the heart on any product to save it here
              </p>
              <p style={{ fontSize:12, marginTop:12, color:'var(--text-muted)' }}>
                Your list stays here on your device — even after you close the page.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
              {wishlist.map((p, i) => (
                <li key={i} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'12px 14px', background:'#fff',
                  borderRadius:14, border:'1px solid var(--border)',
                }}>
                  <ProductThumb product={p} size={60} />
                  <ShadeChip hex={p.hex} height={60} width={10} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--espresso)', fontFamily:'DM Sans' }}>
                      {p.brand}
                    </div>
                    <div style={{
                      fontFamily:'Cormorant Garamond', fontSize:15, fontStyle:'italic',
                      color:'var(--espresso-mid)', lineHeight:1.2, marginTop:2,
                    }}>
                      {p.shade}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3, fontFamily:'DM Sans' }}>
                      {p.product} · {p.finish}
                    </div>
                  </div>
                  <button onClick={() => onRemove(p)} title="Remove" style={{
                    width:28, height:28, borderRadius:'50%', border:'none',
                    background:'transparent', cursor:'pointer',
                    color:'var(--blush)', fontSize:18, flexShrink:0,
                  }}>♥</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Export actions */}
        {wishlist.length > 0 && (
          <div style={{
            borderTop:'1px solid var(--border)', padding:'20px 32px 24px',
            background:'#fff',
          }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12, fontFamily:'DM Sans' }}>
              Take it with you
            </p>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {exportActions.map(a => (
                <button key={a.id} onClick={a.onClick} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'12px 14px', borderRadius:12,
                  border:'1.5px solid var(--border)', background:'var(--cream)',
                  color:'var(--espresso)', cursor:'pointer',
                  fontFamily:'DM Sans', fontSize:13, fontWeight:500,
                  textAlign:'left', transition:'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--blush)'; e.currentTarget.style.color='var(--blush)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--espresso)'; }}
                >
                  <span style={{ fontSize:16 }}>{a.icon}</span>
                  <span>{a.done || a.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onClear} style={{
              marginTop:12, width:'100%', padding:'10px',
              border:'1px solid var(--border)', background:'transparent',
              color:'var(--text-muted)', cursor:'pointer',
              fontSize:11, fontFamily:'DM Sans', letterSpacing:'0.06em', textTransform:'uppercase',
              borderRadius:10,
            }}>
              Clear list
            </button>
          </div>
        )}
      </div>

      {/* Share-as-image modal */}
      {showShareImage && (
        <ShareImageModal
          wishlist={wishlist}
          onClose={() => setShowShareImage(false)}
        />
      )}
    </>
  );
}

// ── Comparison Tray ────────────────────────────────────────────────────────────
function ComparisonTray({ pinnedItems, onRemove, onClear }) {
  const [expanded, setExpanded] = useState(false);
  const isVisible = pinnedItems.length > 0;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.35s cubic-bezier(0.34,1.26,0.64,1)',
      pointerEvents: isVisible ? 'all' : 'none',
    }}>
      {/* Handle bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 0 0',
        background: 'linear-gradient(to bottom, transparent, rgba(42,26,20,0.04))',
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border)', cursor: 'pointer',
        }} onClick={() => setExpanded(e => !e)} />
      </div>

      {/* Tray body */}
      <div className="compare-tray-body" style={{
        background: '#fff',
        borderTop: '1.5px solid var(--border)',
        boxShadow: '0 -4px 24px rgba(42,26,20,0.12)',
        padding: expanded ? '24px 40px 32px' : '16px 40px 20px',
        transition: 'padding 0.25s ease',
      }}>
        {/* Tray header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: expanded ? 24 : 16 }}>
          <span style={{
            fontFamily:'Cormorant Garamond', fontSize:18, fontWeight:500, color:'var(--espresso)',
          }}>
            Comparing {pinnedItems.length} shade{pinnedItems.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.05em' }}>
            · up to 4 · click a row to pin
          </span>
          <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={() => setExpanded(e => !e)} style={{
              fontSize:11, padding:'4px 12px', borderRadius:20,
              border:'1px solid var(--border)', background:'transparent',
              color:'var(--text-muted)', cursor:'pointer', fontFamily:'DM Sans',
            }}>
              {expanded ? 'Collapse' : 'Expand'}
            </button>
            <button onClick={onClear} style={{
              fontSize:11, padding:'4px 12px', borderRadius:20,
              border:'1px solid var(--blush)', background:'transparent',
              color:'var(--blush)', cursor:'pointer', fontFamily:'DM Sans',
            }}>
              Clear all
            </button>
          </div>
        </div>

        {/* Swatches row — sorted by ΔE ascending */}
        {(() => { const sortedPins = [...pinnedItems].sort((a,b) => a.distance - b.distance); return (
        <div style={{ display:'flex', gap: expanded ? 24 : 16, alignItems:'flex-start', flexWrap:'wrap' }}>
          {sortedPins.map((p, i) => (
            <div key={i} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap: expanded ? 12 : 8,
              cursor:'pointer', position:'relative',
              animation:'fadeUp 0.2s ease',
            }} onClick={() => onRemove(p)}>
              {/* Remove hint */}
              <div style={{
                position:'absolute', top:-6, right:-6, zIndex:2,
                width:18, height:18, borderRadius:'50%',
                background:'var(--espresso)', color:'#FAF6F1',
                fontSize:10, display:'flex', alignItems:'center', justifyContent:'center',
                opacity:0, transition:'opacity 0.15s',
              }} className="remove-btn">×</div>

              {/* Swatch */}
              <div style={{
                width: expanded ? 80 : 52,
                height: expanded ? 80 : 52,
                borderRadius:'50%',
                background: p.hex,
                boxShadow: `0 4px 16px ${p.hex}80, inset 0 -2px 4px rgba(0,0,0,0.12)`,
                border: '2.5px solid #fff',
                outline: '1.5px solid var(--border)',
                transition: 'width 0.25s, height 0.25s',
                flexShrink: 0,
              }} />

              {/* Info */}
              {expanded ? (
                <div style={{ textAlign:'center', maxWidth:100 }}>
                  <div style={{
                    fontFamily:'Cormorant Garamond', fontSize:15, fontStyle:'italic',
                    color:'var(--espresso)', lineHeight:1.3, marginBottom:4,
                  }}>{p.shade}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Sans', marginBottom:4 }}>
                    {p.brand}
                  </div>
                  <span style={{
                    fontSize:10, padding:'2px 8px', borderRadius:20,
                    background: finishColor(p.finish) + '18',
                    color: finishColor(p.finish),
                    fontWeight:500, fontFamily:'DM Sans',
                  }}>{p.finish}</span>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4, fontFamily:'DM Sans' }}>
                    ΔE {p.distance.toFixed(1)}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', maxWidth:72 }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'DM Sans', lineHeight:1.3 }}>
                    {p.shade}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 4 - pinnedItems.length) }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              width: expanded ? 80 : 52,
              height: expanded ? 80 : 52,
              borderRadius:'50%',
              border: '2px dashed var(--border)',
              background: 'transparent',
              flexShrink: 0,
              transition: 'width 0.25s, height 0.25s',
              opacity: 0.4,
            }} />
          ))}
        </div>
        ); })()}
      </div>

      <style>{`
        div:hover > .remove-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// ── List Picker ─────────────────────────────────────────────────────────
// Grid of saved-shade swatches; clicking one uses its color as the seed.
function ListPicker({ wishlist, selectedKey, onPick }) {
  return (
    <div style={{ width:'100%', maxWidth:440, padding:'4px 0 8px' }}>
      <div style={{
        fontFamily:'DM Sans', fontSize:11, color:'var(--text-muted)',
        letterSpacing:'0.1em', textTransform:'uppercase', textAlign:'center',
        marginBottom:14,
      }}>
        Pick a saved shade to find similar ones
      </div>
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(96px, 1fr))',
        gap:14, padding:'4px 4px 16px',
      }}>
        {wishlist.map((p, i) => {
          const key = `${p.brand}|${p.shade}`;
          const isSel = key === selectedKey;
          return (
            <button key={i} onClick={() => onPick(p)} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              background:'transparent', border:'none', cursor:'pointer',
              padding:6, borderRadius:12,
              transition:'background 0.15s',
            }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='rgba(200,120,144,0.06)'; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='transparent'; }}
            >
              <div style={{
                width:56, height:56, borderRadius:'50%',
                background: p.hex,
                boxShadow: isSel
                  ? `0 0 0 2px #fff, 0 0 0 4px var(--blush), 0 4px 14px ${p.hex}88`
                  : `0 3px 12px ${p.hex}66, inset 0 -2px 4px rgba(0,0,0,0.12)`,
                border:'1.5px solid rgba(42,26,20,0.06)',
                transition:'all 0.15s',
              }} />
              <div style={{ textAlign:'center', maxWidth:'100%' }}>
                <div style={{
                  fontFamily:'DM Sans', fontSize:12, color:'var(--text-muted)',
                  letterSpacing:'0.08em', textTransform:'uppercase',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>{p.brand}</div>
                <div style={{
                  fontFamily:'Cormorant Garamond', fontSize:15, fontStyle:'italic',
                  color: isSel ? 'var(--blush)' : 'var(--espresso)', lineHeight:1.2,
                  overflow:'hidden', textOverflow:'ellipsis',
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                }}>{p.shade}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Photo Picker ───────────────────────────────────────────────────────────
// Upload an image, click anywhere on it to sample a color (averaged over an
// adjustable radius). The sampled hex is passed up via onColor.
function PhotoPicker({ sampledHex, onColor }) {
  const [src, setSrc] = React.useState(null);
  const [point, setPoint] = React.useState(null); // {x,y} in image pixel space
  const [radius, setRadius] = React.useState(8);
  const canvasRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    window.gtag?.('event', 'photo_uploaded');
    const reader = new FileReader();
    reader.onload = e => { setSrc(e.target.result); setPoint(null); onColor(null); };
    reader.readAsDataURL(file);
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function sampleAt(px, py) {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { colorSpace: 'display-p3', willReadFrequently:true });
    const r = Math.max(1, Math.round(radius));
    const x0 = Math.max(0, Math.floor(px - r));
    const y0 = Math.max(0, Math.floor(py - r));
    const w  = Math.min(canvas.width  - x0, r * 2);
    const h  = Math.min(canvas.height - y0, r * 2);
    if (w <= 0 || h <= 0) return;
    const data = ctx.getImageData(x0, y0, w, h).data;
    let R=0,G=0,B=0,n=0;
    for (let i = 0; i < data.length; i += 4) { R+=data[i]; G+=data[i+1]; B+=data[i+2]; n++; }
    R = Math.round(R/n); G = Math.round(G/n); B = Math.round(B/n);
    const hex = '#' + [R,G,B].map(v => v.toString(16).padStart(2,'0')).join('');
    onColor(hex);
  }

  function onImgClick(e) {
    const img = imgRef.current; const canvas = canvasRef.current; if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top)  * sy;
    setPoint({ x: px, y: py, displayX: e.clientX - rect.left, displayY: e.clientY - rect.top });
    sampleAt(px, py);
  }

  // Resample when radius changes
  React.useEffect(() => {
    if (point) sampleAt(point.x, point.y);
    // eslint-disable-next-line
  }, [radius]);

  // Draw uploaded image to canvas (offscreen) for pixel sampling
  function onImgLoad() {
    const img = imgRef.current; const canvas = canvasRef.current;
    if (!img || !canvas) return;
    // Cap canvas size for performance
    const MAX = 1200;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width  = Math.round(img.naturalWidth  * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d', { colorSpace: 'display-p3' }).drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  if (!src) {
    return (
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          width:'100%', maxWidth:380, aspectRatio:'1/1',
          border:`2px dashed ${dragOver ? 'var(--blush)' : 'var(--border)'}`,
          borderRadius:16, background: dragOver ? 'rgba(200,120,144,0.06)' : '#fff',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          cursor:'pointer', gap:14, padding:24, textAlign:'center',
          transition:'all 0.15s ease',
        }}
      >
        <div style={{ fontSize:36, lineHeight:1, color:'var(--blush)' }}>⤓</div>
        <div style={{ fontFamily:'Cormorant Garamond', fontSize:22, fontStyle:'italic', color:'var(--espresso)' }}>
          Drop a photo or screenshot here
        </div>
        <div style={{ fontFamily:'DM Sans', fontSize:12, color:'var(--text-muted)', letterSpacing:'0.04em' }}>
          or click to upload · JPG, PNG, HEIC
        </div>
        <div style={{ fontFamily:'DM Sans', fontSize:12, color:'var(--text-muted)', maxWidth:260, marginTop:8, lineHeight:1.5 }}>
          Tap anywhere on the photo to pick a shade.
        </div>
        <div style={{ fontFamily:'DM Sans', fontSize:12, color:'var(--text-muted)', maxWidth:260, marginTop:14, lineHeight:1.5, display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, fontStyle:'normal' }}>🔒</span>
          <span style={{ fontStyle:'italic' }}>Your photo stays on your device — we never upload or store it.</span>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div style={{ width:'100%', maxWidth:380, display:'flex', flexDirection:'column', gap:14 }}>
      <div ref={containerRef} style={{ position:'relative', borderRadius:14, overflow:'hidden', border:'1px solid var(--border)', background:'var(--cream-dark)', width:'100%', aspectRatio:'1/1' }}>
        <img
          ref={imgRef}
          src={src}
          onLoad={onImgLoad}
          onClick={onImgClick}
          alt="Uploaded"
          style={{ display:'block', width:'100%', height:'100%', objectFit:'contain', cursor:'crosshair' }}
        />
        <canvas ref={canvasRef} style={{ display:'none' }} />
        {point && (
          <div style={{
            position:'absolute',
            left: point.displayX, top: point.displayY,
            width: Math.max(12, radius * 1.6), height: Math.max(12, radius * 1.6),
            transform:'translate(-50%, -50%)',
            border:'2px solid #fff', borderRadius:'50%',
            boxShadow:'0 0 0 1.5px rgba(42,26,20,0.6), 0 0 12px rgba(0,0,0,0.4)',
            pointerEvents:'none',
          }} />
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {sampledHex && (
          <>
            <div style={{
              width:36, height:36, borderRadius:'50%', background: sampledHex,
              border:'2px solid #fff', boxShadow:`0 2px 8px ${sampledHex}66, 0 0 0 1px var(--border)`,
              flexShrink:0,
            }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Cormorant Garamond', fontSize:16, fontStyle:'italic', color:'var(--espresso)' }}>
                Sampled
              </div>
              <div style={{ fontFamily:'DM Sans', fontSize:11, color:'var(--text-muted)', letterSpacing:'0.06em' }}>
                {sampledHex.toUpperCase()}
              </div>
            </div>
          </>
        )}
        {!sampledHex && (
          <div style={{ flex:1, fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:15, color:'var(--text-muted)' }}>
            Click anywhere on the photo to sample a color.
          </div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, maxWidth:240, alignSelf:'flex-start' }}>
        <label style={{ fontFamily:'DM Sans', fontSize:12, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
          Sample
        </label>
        <input
          type="range" min={2} max={30} value={radius}
          onChange={e => setRadius(parseInt(e.target.value))}
          className="dainty-range"
          style={{ flex:1, accentColor:'var(--blush)', height:2 }}
        />
        <span style={{ fontFamily:'DM Sans', fontSize:12, color:'var(--text-muted)', minWidth:28, textAlign:'right' }}>{radius}px</span>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button
          onClick={() => { setSrc(null); setPoint(null); onColor(null); }}
          style={{
            flex:1, padding:'8px 12px', fontFamily:'DM Sans', fontSize:11,
            letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500,
            background:'transparent', color:'var(--text-muted)',
            border:'1px solid var(--border)', borderRadius:20, cursor:'pointer',
          }}
        >
          ← New photo
        </button>
      </div>
    </div>
  );
}

// ── Hex Picker ──────────────────────────────────────────────────────────
// Pick or paste a hex code directly. Useful for matching a specific color
// (an outfit, a paint chip, a screen color) when the wheel doesn't cover it.
function HexPicker({ sampledHex, onColor }) {
  const [draft, setDraft] = React.useState(sampledHex || '#C04E62');
  const colorInputRef = React.useRef(null);

  React.useEffect(() => {
    if (sampledHex && sampledHex !== draft) setDraft(sampledHex);
  }, [sampledHex]);

  function normalize(v) {
    if (!v) return null;
    let s = v.trim().replace(/^#/, '').toLowerCase();
    if (/^[0-9a-f]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
    if (/^[0-9a-f]{6}$/.test(s)) return '#' + s;
    return null;
  }

  function handleTextChange(v) {
    setDraft(v);
    const hex = normalize(v);
    if (hex) onColor(hex);
  }

  function handlePickerChange(v) {
    setDraft(v);
    onColor(v.toLowerCase());
  }

  const QUICK = [
    {hex:'#C04E62', label:'Classic rose'},
    {hex:'#8B1A2E', label:'Bordeaux'},
    {hex:'#DC3092', label:'Magenta'},
    {hex:'#E85840', label:'Coral'},
    {hex:'#7A3E28', label:'Cocoa'},
    {hex:'#4A1820', label:'Wine'},
    {hex:'#454048', label:'Charcoal'},
    {hex:'#2D6850', label:'Teal'},
  ];

  const valid = !!normalize(draft);
  const previewHex = valid ? normalize(draft) : '#FAF6F1';

  return (
    <div style={{
      width:'100%', maxWidth:440,
      display:'flex', flexDirection:'column', alignItems:'center', gap:20,
      padding:'8px 0 4px',
    }}>
      {/* Big preview swatch */}
      <div style={{
        position:'relative',
        width:200, height:200, borderRadius:'50%',
        background: previewHex,
        boxShadow: valid
          ? `0 6px 28px ${previewHex}80, inset 0 -4px 12px rgba(0,0,0,0.10)`
          : '0 4px 16px rgba(42,26,20,0.10)',
        border:'4px solid #fff',
        outline:'1.5px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'background 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}>
        {!valid && (
          <span style={{ fontFamily:'Cormorant Garamond', fontStyle:'italic', color:'var(--text-muted)', fontSize:18, pointerEvents:'none' }}>
            Invalid hex
          </span>
        )}
        {/* Label overlay — most reliable cross-platform way to trigger the color picker */}
        <label htmlFor="hex-color-picker" style={{ position:'absolute', inset:0, cursor:'pointer', borderRadius:'50%' }} />
        <input
          ref={colorInputRef}
          id="hex-color-picker"
          type="color"
          value={valid ? previewHex : '#C04E62'}
          onChange={e => handlePickerChange(e.target.value)}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0, border:'none', padding:0, cursor:'pointer' }}
          aria-label="Pick a color"
        />
      </div>

      {/* Hex text input */}
      <div style={{
        display:'flex', alignItems:'center', gap:6,
        background:'#fff', borderRadius:10,
        border:`1.5px solid ${valid ? 'var(--border)' : 'var(--blush)'}`,
        padding:'6px 10px',
        boxShadow:'0 2px 8px var(--shadow)',
        minWidth:180,
      }}>
        <span style={{ color:'var(--text-muted)', fontFamily:'DM Sans', fontSize:14, fontWeight:500 }}>#</span>
        <input
          type="text"
          value={draft.replace(/^#/, '').toUpperCase()}
          onChange={e => handleTextChange(e.target.value)}
          placeholder="C04E62"
          maxLength={7}
          style={{
            flex:1, border:'none', outline:'none', background:'transparent',
            fontFamily:'DM Sans', fontSize:13, fontWeight:500,
            letterSpacing:'0.1em', color:'var(--espresso)',
            textTransform:'uppercase', minWidth:0,
          }}
        />
        <label
          htmlFor="hex-color-picker"
          title="Open color picker"
          style={{
            border:'none', background:'var(--cream-dark)',
            width:26, height:26, borderRadius:6, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--espresso-mid)', fontSize:13,
          }}
        >🎨</label>
      </div>

      <p style={{
        fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:15,
        color:'var(--text-muted)', textAlign:'center', maxWidth:300, lineHeight:1.5,
      }}>
        Pick any color you love or paste a hex, and we'll find the lipsticks closest to it.
      </p>
    </div>
  );
}

// ── Vibe Panel ──────────────────────────────────────────────────────────
function VibePanel({ vibe, setVibe, onClose }) {
  const toggle = (key, value) => {
    setVibe(v => {
      const cur = v[key] || [];
      const next = cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value];
      return { ...v, [key]: next };
    });
  };
  const clearAll = () => setVibe({ finishes:[], temps:[], depths:[] });
  const FINISHES = ['Matte','Satin','Sheer','Gloss','Cream'];
  const TEMPS    = [
    { id:'cool',    label:'Cool'    },
    { id:'neutral', label:'Neutral' },
    { id:'warm',    label:'Warm'    },
  ];
  const DEPTHS = [
    { id:'light',  label:'Light'  },
    { id:'medium', label:'Medium' },
    { id:'deep',   label:'Deep'   },
  ];
  const active = (vibe.finishes?.length || 0) + (vibe.temps?.length || 0) + (vibe.depths?.length || 0);

  // Reusable chip
  const Chip = ({ on, label, sub, onClick }) => (
    <button onClick={onClick} style={{
      flex:'1 1 0', minWidth:0,
      padding:'12px 14px', borderRadius:14,
      border:`1.5px solid ${on ? 'var(--blush)' : 'var(--border)'}`,
      background: on ? 'rgba(200,120,144,0.10)' : '#fff',
      color: on ? 'var(--blush)' : 'var(--espresso)',
      cursor:'pointer', textAlign:'left',
      fontFamily:'DM Sans', transition:'all 0.15s',
    }}>
      <div style={{ fontSize:12, fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3, letterSpacing:'0.02em' }}>{sub}</div>}
    </button>
  );

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:300,
      background:'rgba(42,26,20,0.32)',
      display:'flex', alignItems:'center', justifyContent:'center',
      backdropFilter:'blur(2px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--cream)', borderRadius:18,
        width:'min(560px, 92vw)', maxHeight:'88vh', overflowY:'auto',
        boxShadow:'0 20px 60px rgba(42,26,20,0.3)',
        border:'1px solid var(--border)',
      }}>
        <div style={{
          padding:'24px 32px 16px',
          borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <span style={{ color:'var(--blush)', fontSize:20 }}>✦</span>
          <h2 style={{ fontFamily:'Cormorant Garamond', fontWeight:400, fontSize:24, color:'var(--espresso)' }}>
            My Lipstick Vibe
          </h2>
          <button onClick={onClose} style={{
            marginLeft:'auto', width:32, height:32, borderRadius:'50%',
            border:'1px solid var(--border)', background:'#fff',
            cursor:'pointer', color:'var(--text-muted)', fontSize:14,
          }}>×</button>
        </div>
        <div style={{ padding:'18px 32px 8px', fontSize:12, color:'var(--text-muted)', fontFamily:'DM Sans', letterSpacing:'0.02em', lineHeight:1.5 }}>
          Tell us what you love — we'll quietly filter every search to shades that fit. Pick any combination, or skip a row for "anything goes."
        </div>

        <Section title="Finish">
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {FINISHES.map(f => (
              <Chip key={f} on={(vibe.finishes||[]).includes(f)} label={f}
                onClick={() => toggle('finishes', f)} />
            ))}
          </div>
        </Section>

        <Section title="Undertone">
          <div style={{ display:'flex', gap:8 }}>
            {TEMPS.map(t => (
              <Chip key={t.id} on={(vibe.temps||[]).includes(t.id)} label={t.label} sub={t.sub}
                onClick={() => toggle('temps', t.id)} />
            ))}
          </div>
        </Section>

        <Section title="Depth">
          <div style={{ display:'flex', gap:8 }}>
            {DEPTHS.map(d => (
              <Chip key={d.id} on={(vibe.depths||[]).includes(d.id)} label={d.label} sub={d.sub}
                onClick={() => toggle('depths', d.id)} />
            ))}
          </div>
        </Section>

        <div style={{
          padding:'18px 32px 24px', display:'flex', alignItems:'center', gap:12,
          borderTop:'1px solid var(--border)', marginTop:8,
        }}>
          <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Sans', letterSpacing:'0.04em' }}>
            {active === 0 ? 'No filters — showing all shades' : `${active} filter${active===1?'':'s'} active`}
          </span>
          <a href="color-guide.html#undertone"
            onClick={() => window.gtag?.('event', 'nav_link_click', { target: 'color_guide', location: 'undertone_panel' })}
            style={{
            fontSize:11, color:'var(--blush)', fontFamily:'DM Sans',
            letterSpacing:'0.04em', textDecoration:'none',
            borderBottom:'1px solid var(--blush)',
            paddingBottom:1,
          }}>What do these mean? →</a>
          <button onClick={clearAll} disabled={active === 0} style={{
            marginLeft:'auto', padding:'8px 16px',
            fontFamily:'DM Sans', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500,
            background:'transparent', color: active === 0 ? 'var(--border)' : 'var(--blush)',
            border:`1px solid ${active === 0 ? 'var(--border)' : 'var(--blush)'}`,
            borderRadius:20, cursor: active === 0 ? 'default' : 'pointer',
          }}>Clear my vibe</button>
          <button onClick={onClose} style={{
            padding:'8px 20px',
            fontFamily:'DM Sans', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500,
            background:'var(--espresso)', color:'var(--cream)',
            border:'1px solid var(--espresso)', borderRadius:20, cursor:'pointer',
          }}>Done</button>
        </div>
      </div>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div style={{ padding:'14px 32px' }}>
      <div style={{
        fontFamily:'DM Sans', fontSize:10, color:'var(--text-muted)',
        letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10,
      }}>{title}</div>
      {children}
    </div>
  );
}

// ── Dupe Finder ──────────────────────────────────────────────────────────────
// Quick-start options shown under the dupe search for anyone who
// doesn't have a specific lipstick in mind yet.
const POPULAR_DUPE_PICKS = [
  { brand: 'chanel', shade: '99 pirate' },
  { brand: 'chanel', shade: '49 ever red' },
  { brand: 'dior', shade: '100 forever nude look' },
  { brand: 'dior', shade: '422 rose des vents' },
  { brand: 'dior', shade: '670 rose blues' },
];

function DupeFinder({ product, onSelect, onUsePhoto }) {
  const [brand, setBrand] = useState(null);
  const [brandQuery, setBrandQuery] = useState('');
  const [shadeQuery, setShadeQuery] = useState('');
  const touchStartY = React.useRef(0);
  const brandNoResultFired = React.useRef(false);
  const shadeNoResultFired = React.useRef(new Set());

  const brands = React.useMemo(
    () => [...new Set(REAL_PRODUCTS.map(p => p.brand))].sort((a, b) => a.localeCompare(b)),
    []
  );
  const brandCounts = React.useMemo(() => {
    const m = {};
    for (const p of REAL_PRODUCTS) m[p.brand] = (m[p.brand] || 0) + 1;
    return m;
  }, []);

  const brandMatches = React.useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return [];
    const starts = [], incl = [];
    for (const b of brands) {
      const lb = b.toLowerCase();
      if (lb.startsWith(q)) starts.push(b);
      else if (lb.includes(q)) incl.push(b);
    }
    return [...starts, ...incl].slice(0, 12);
  }, [brandQuery, brands]);

  const shadeMatches = React.useMemo(() => {
    if (!brand) return [];
    const q = shadeQuery.trim().toLowerCase();
    if (!q) return [];
    const list = REAL_PRODUCTS.filter(p => p.brand === brand &&
      (p.shade.toLowerCase().includes(q) || (p.product || '').toLowerCase().includes(q)));
    return list.sort((a, b) => a.shade.localeCompare(b.shade)).slice(0, 80);
  }, [brand, shadeQuery]);

  function pickBrand(b) {
    window.gtag?.('event', 'dupe_brand_select', { brand: b });
    setBrand(b); setBrandQuery(''); setShadeQuery(''); onSelect(null);
  }
  function changeBrand() { setBrand(null); setBrandQuery(''); setShadeQuery(''); onSelect(null); }
  function pickShade(p) {
    window.gtag?.('event', 'dupe_shade_select', { brand: p.brand, shade: p.shade, hex: p.hex });
    onSelect(p);
  }

  const popularProducts = React.useMemo(() => (
    POPULAR_DUPE_PICKS
      .map(({ brand: b, shade: s }) => REAL_PRODUCTS.find(p => p.brand.toLowerCase() === b && p.shade.toLowerCase() === s))
      .filter(Boolean)
  ), []);
  function pickPopular(p) {
    window.gtag?.('event', 'dupe_popular_select', { brand: p.brand, shade: p.shade, hex: p.hex });
    setBrand(p.brand); setBrandQuery(''); setShadeQuery('');
    onSelect(p);
  }

  // Fire no-results events after the user pauses typing (600ms debounce).
  // Guarded by a minimum length (skip early, still-typing fragments) and
  // deduped (fire at most once per session/brand) so retries and typos
  // don't inflate the metric with repeats of the same dead-end search.
  React.useEffect(() => {
    const q = brandQuery.trim().toLowerCase();
    if (q.length < 3 || brandMatches.length > 0 || brandNoResultFired.current) return;
    const t = setTimeout(() => {
      brandNoResultFired.current = true;
      window.gtag?.('event', 'dupe_brand_no_results', { query: q });
    }, 600);
    return () => clearTimeout(t);
  }, [brandQuery, brandMatches.length]);

  React.useEffect(() => {
    const q = shadeQuery.trim().toLowerCase();
    if (q.length < 3 || shadeMatches.length > 0 || !brand || shadeNoResultFired.current.has(brand)) return;
    const t = setTimeout(() => {
      shadeNoResultFired.current.add(brand);
      window.gtag?.('event', 'dupe_shade_no_results', { brand, query: q });
    }, 600);
    return () => clearTimeout(t);
  }, [shadeQuery, shadeMatches.length, brand]);

  const stepNum = { width:22, height:22, borderRadius:'50%', background:'var(--espresso)', color:'var(--cream)', fontFamily:'DM Sans', fontSize:11, fontWeight:500, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
  const stepLabel = { fontFamily:'DM Sans', fontSize:10, color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase' };
  const inputWrap = { display:'flex', alignItems:'center', gap:10, background:'#fff', borderRadius:14, border:'1.5px solid var(--border)', padding:'11px 14px', boxShadow:'0 2px 8px var(--shadow)' };
  const inputStyle = { flex:1, border:'none', outline:'none', background:'transparent', fontFamily:'DM Sans', fontSize:15, color:'var(--espresso)', minWidth:0 };
  const clearBtn = { background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16, lineHeight:1, padding:'0 2px' };
  const suggestBox = { display:'flex', flexDirection:'column', gap:2, maxHeight:260, overflowY:'auto', background:'#fff', border:'1px solid var(--border)', borderRadius:12, padding:6, boxShadow:'0 4px 16px var(--shadow)' };
  const chip = { display:'inline-flex', alignItems:'center', gap:8, padding:'7px 8px 7px 14px', background:'#fff', borderRadius:40, border:'1px solid var(--border)', boxShadow:'0 2px 8px var(--shadow)' };
  const chipX = { width:20, height:20, borderRadius:'50%', border:'none', background:'var(--cream-dark)', color:'var(--text-muted)', cursor:'pointer', fontSize:13, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
  const emptyNote = { fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:14, color:'var(--text-muted)', textAlign:'center', padding:'8px 0' };
  const photoFallbackBtn = { marginTop:6, fontFamily:'DM Sans', fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--blush)', background:'transparent', border:'1px solid var(--blush)', borderRadius:20, padding:'6px 14px', cursor:'pointer' };
  const hov = () => ({ onMouseEnter: e => e.currentTarget.style.background = 'var(--cream)', onMouseLeave: e => e.currentTarget.style.background = 'transparent' });

  return (
    <div style={{ width:'100%', maxWidth:440, display:'flex', flexDirection:'column', gap:14, padding:'4px 0' }}>
      <div style={{ textAlign:'center', marginBottom:2 }}>
        <p style={{ fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:19, color:'var(--espresso-mid)', lineHeight:1.4 }}>
          Find your lipstick's twin
        </p>
        <p style={{ fontFamily:'DM Sans', fontSize:11, color:'var(--text-muted)', letterSpacing:'0.04em', marginTop:4 }}>
          Search the brand, then the shade name
        </p>
        <button onClick={() => { window.gtag?.('event', 'dupe_photo_fallback', { step: 'header' }); onUsePhoto(); }} style={{ marginTop:8, fontFamily:'DM Sans', fontSize:10.5, letterSpacing:'0.05em', color:'var(--blush)', background:'transparent', border:'none', borderBottom:'1px solid var(--blush)', paddingBottom:1, cursor:'pointer' }}>
          Can't find your lipstick? Match it from a photo →
        </button>
      </div>

      {!brand ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={stepNum}>1</span>
            <span style={stepLabel}>Brand</span>
          </div>
          <div style={inputWrap}>
            <span style={{ color:'var(--text-muted)', fontSize:22, lineHeight:1 }}>⌕</span>
            <input autoFocus value={brandQuery}
              onChange={e => setBrandQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && brandMatches[0]) pickBrand(brandMatches[0]); }}
              placeholder="MAC, Charlotte Tilbury…" style={inputStyle} />
            {brandQuery && <button onClick={() => setBrandQuery('')} style={clearBtn}>×</button>}
          </div>
          {brandQuery && brandMatches.length === 0 && (
            <p style={emptyNote}>No brands match "{brandQuery}".</p>
          )}
          {brandMatches.length > 0 && (
            <div style={suggestBox}>
              {brandMatches.map(b => (
                <button key={b} onClick={() => pickBrand(b)} {...hov()} style={{
                  display:'flex', alignItems:'center', gap:8, width:'100%',
                  padding:'9px 12px', borderRadius:9, border:'none',
                  background:'transparent', cursor:'pointer', textAlign:'left',
                  transition:'background 0.12s',
                }}>
                  <span style={{ fontFamily:'DM Sans', fontSize:13, fontWeight:500, color:'var(--espresso)' }}>{b}</span>
                  <span style={{ fontFamily:'DM Sans', fontSize:11, color:'var(--text-muted)', marginLeft:'auto', flexShrink:0 }}>
                    {brandCounts[b]} shade{brandCounts[b] !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!brandQuery && (
            <p style={{ fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:13, color:'var(--text-muted)', textAlign:'center', lineHeight:1.5, marginTop:2 }}>
              Start typing a brand name — matches appear as you go.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={stepNum}>1</span>
            <div style={chip}>
              <span style={{ fontFamily:'DM Sans', fontSize:13, fontWeight:500, color:'var(--espresso)' }}>{brand}</span>
              <button onClick={changeBrand} title="Change brand" style={chipX}>×</button>
            </div>
          </div>

          {!product ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={stepNum}>2</span>
                <span style={stepLabel}>Shade</span>
              </div>
              <div style={inputWrap}>
                <span style={{ color:'var(--text-muted)', fontSize:22, lineHeight:1 }}>⌕</span>
                <input autoFocus value={shadeQuery}
                  onChange={e => setShadeQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && shadeMatches[0]) pickShade(shadeMatches[0]); }}
                  placeholder="Search a shade or product…" style={inputStyle} />
                {shadeQuery && <button onClick={() => setShadeQuery('')} style={clearBtn}>×</button>}
              </div>
              {!shadeQuery.trim() ? (
                <p style={{ fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:13, color:'var(--text-muted)', textAlign:'center', lineHeight:1.5, marginTop:2 }}>
                  Start typing the shade name to see matches.
                </p>
              ) : shadeMatches.length === 0 ? (
                <div style={{ textAlign:'center', padding:'8px 0' }}>
                  <p style={emptyNote}>No shades match "{shadeQuery}".</p>
                  <button onClick={() => { window.gtag?.('event', 'dupe_photo_fallback', { step: 'shade_no_results', brand, query: shadeQuery.trim().toLowerCase() }); onUsePhoto(); }} style={photoFallbackBtn}>
                    Can't find it? Match from a photo →
                  </button>
                </div>
              ) : (
                <div style={{ ...suggestBox, maxHeight:308 }}>
                  {shadeMatches.map((p, i) => (
                    <button key={i}
                      onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }}
                      onTouchEnd={e => { if (Math.abs(e.changedTouches[0].clientY - touchStartY.current) < 10) { e.preventDefault(); pickShade(p); } }}
                      onClick={() => pickShade(p)}
                      {...hov()} style={{
                      display:'flex', alignItems:'center', gap:11, width:'100%',
                      padding:'8px 10px', borderRadius:9, border:'none',
                      background:'transparent', cursor:'pointer', transition:'background 0.12s',
                    }}>
                      <span style={{ width:24, height:24, borderRadius:'50%', background:p.hex, flexShrink:0, boxShadow:`0 1px 4px ${p.hex}66`, border:'1px solid rgba(42,26,20,0.08)' }} />
                      <span style={{ display:'flex', flexDirection:'column', minWidth:0, textAlign:'left' }}>
                        <span style={{ fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:15, color:'var(--espresso)', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.shade}</span>
                        <span style={{ fontFamily:'DM Sans', fontSize:10, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product} · {p.finish}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={stepNum}>2</span>
                <span style={stepLabel}>Matching this shade</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'#fff', borderRadius:16, border:'1px solid var(--border)', boxShadow:'0 2px 12px var(--shadow)' }}>
                <ProductThumb product={product} size={56} />
                <ShadeChip hex={product.hex} height={56} width={9} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'DM Sans', fontSize:12, fontWeight:500, color:'var(--espresso)' }}>{product.brand}</div>
                  <div style={{ fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:18, color:'var(--espresso-mid)', lineHeight:1.2 }}>{product.shade}</div>
                  <div style={{ fontFamily:'DM Sans', fontSize:10, color:'var(--text-muted)', marginTop:2, letterSpacing:'0.04em' }}>{product.finish} · {product.hex.toUpperCase()}</div>
                </div>
              </div>
              <button onClick={() => onSelect(null)} style={{
                alignSelf:'flex-start', fontSize:11, fontFamily:'DM Sans',
                letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--blush)',
                background:'transparent', border:'1px solid var(--blush)', borderRadius:20,
                padding:'6px 14px', cursor:'pointer',
              }}>← Pick another shade</button>
              <p style={{ fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:14, color:'var(--text-muted)', textAlign:'center', marginTop:2 }}>
                Closest dupes are ranked on the right →
              </p>
            </div>
          )}
        </div>
      )}

      {!product && popularProducts.length > 0 && (
        <div style={{ marginTop:26, display:'flex', flexDirection:'column', gap:10 }}>
          <p style={{ fontFamily:'DM Sans', fontSize:10, color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase', textAlign:'center' }}>
            Or try a popular shade
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
            {popularProducts.map((p, i) => (
              <button key={i} onClick={() => pickPopular(p)} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'7px 12px 7px 8px', background:'#fff', borderRadius:40,
                border:'1px solid var(--border)', boxShadow:'0 2px 8px var(--shadow)',
                cursor:'pointer',
              }}>
                <span style={{ width:20, height:20, borderRadius:'50%', background:p.hex, flexShrink:0, boxShadow:`0 1px 4px ${p.hex}66`, border:'1px solid rgba(42,26,20,0.08)' }} />
                <span style={{ display:'flex', flexDirection:'column', textAlign:'left' }}>
                  <span style={{ fontFamily:'Cormorant Garamond', fontStyle:'italic', fontSize:13, color:'var(--espresso)', lineHeight:1.15 }}>{p.shade}</span>
                  <span style={{ fontFamily:'DM Sans', fontSize:9, color:'var(--text-muted)', textTransform:'capitalize' }}>{p.brand}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Shared mode icons — used on the landing cards and the in-app mode bar
// so a user sees the same glyph for "color wheel" etc. everywhere.
const MODE_ICONS = {
  wheel: (s = 26) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <path d="M 10 10 L 18 10 A 8 8 0 0 1 10 18 Z" fill="#F5C5C5" stroke="#D4B8AC" strokeWidth="0.5"/>
      <path d="M 10 10 L 10 18 A 8 8 0 0 1 2 10 Z" fill="#C87890" stroke="#D4B8AC" strokeWidth="0.5"/>
      <path d="M 10 10 L 2 10 A 8 8 0 0 1 10 2 Z" fill="#8B4558" stroke="#D4B8AC" strokeWidth="0.5"/>
      <path d="M 10 10 L 10 2 A 8 8 0 0 1 18 10 Z" fill="#E8C8B8" stroke="#D4B8AC" strokeWidth="0.5"/>
    </svg>
  ),
  photo: (s = 26) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="7" width="16" height="10" rx="2" fill="#EDD8CE" stroke="#D4B8AC" strokeWidth="1"/>
      <rect x="6" y="5" width="7" height="3" rx="1" fill="#EDD8CE" stroke="#D4B8AC" strokeWidth="1"/>
      <circle cx="10" cy="12" r="3" fill="#F0D8D0" stroke="#C87890" strokeWidth="1.2"/>
    </svg>
  ),
  dupe: (s = 26) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="13" width="6" height="6" rx="1" fill="#EDD8CE" stroke="#D4B8AC" strokeWidth="0.8"/>
      <rect x="2" y="15.5" width="6" height="2" fill="#E4C8BC" stroke="#D4B8AC" strokeWidth="0.5"/>
      <rect x="3" y="7.5" width="4" height="5.5" rx="0.5" fill="#F0DED8" stroke="#D4B8AC" strokeWidth="0.8"/>
      <rect x="3" y="4" width="4" height="3.5" fill="#C87890" stroke="#A86878" strokeWidth="0.6"/>
      <path d="M3 4 Q3.5 1 5 0.5 Q6.5 1 7 4 Z" fill="#C87890" stroke="#A86878" strokeWidth="0.6" strokeLinejoin="round"/>
      <line x1="3" y1="2.8" x2="7" y2="1.5" stroke="#A86878" strokeWidth="0.5"/>
      <rect x="12" y="13" width="6" height="6" rx="1" fill="#EDD8CE" stroke="#D4B8AC" strokeWidth="0.8"/>
      <rect x="12" y="15.5" width="6" height="2" fill="#E4C8BC" stroke="#D4B8AC" strokeWidth="0.5"/>
      <rect x="13" y="7.5" width="4" height="5.5" rx="0.5" fill="#F0DED8" stroke="#D4B8AC" strokeWidth="0.8"/>
      <rect x="13" y="4" width="4" height="3.5" fill="#C87890" stroke="#A86878" strokeWidth="0.6"/>
      <path d="M13 4 Q13.5 1 15 0.5 Q16.5 1 17 4 Z" fill="#C87890" stroke="#A86878" strokeWidth="0.6" strokeLinejoin="round"/>
      <line x1="13" y1="2.8" x2="17" y2="1.5" stroke="#A86878" strokeWidth="0.5"/>
    </svg>
  ),
  hex: (s = 26) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <circle cx="14" cy="5" r="3.5" fill="#EDD8CE" stroke="#D4B8AC" strokeWidth="1"/>
      <line x1="12" y1="7.5" x2="5.5" y2="14" stroke="#D4B8AC" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="4" cy="15.5" r="2" fill="#C87890"/>
    </svg>
  ),
  list: (s = 26) => (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <path d="M10 17 C10 17 2.5 12.4 2.5 7.3 C2.5 4.7 4.5 3 6.7 3 C8.1 3 9.3 3.7 10 4.9 C10.7 3.7 11.9 3 13.3 3 C15.5 3 17.5 4.7 17.5 7.3 C17.5 12.4 10 17 10 17 Z" fill="#F0D8D0" stroke="#C87890" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
};

function LandingCard({ icon, title, desc, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', flexDirection:'column', gap:14,
        padding:'28px 26px 24px', background:'#fff',
        border:'1px solid', borderColor: hovered ? 'var(--blush)' : 'var(--border)',
        borderRadius:16, cursor:'pointer',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 14px 34px var(--shadow)' : 'none',
        transition:'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
    >
      <span style={{
        width:52, height:52, borderRadius:'50%', display:'flex',
        alignItems:'center', justifyContent:'center', flexShrink:0,
        background:'rgba(200,120,144,0.10)',
      }}>{icon}</span>
      <h2 style={{ fontFamily:'Cormorant Garamond', fontWeight:400, fontSize:24, letterSpacing:'-0.01em', color:'var(--espresso)' }}>{title}</h2>
      <p style={{ fontSize:14, lineHeight:1.6, color:'var(--text-muted)', flex:1 }}>{desc}</p>
      <span style={{
        display:'flex', alignItems:'center', gap:8,
        fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase',
        color:'var(--blush)', fontWeight:500,
      }}>
        Start here
        <span style={{ transition:'transform 0.18s ease', transform: hovered ? 'translateX(5px)' : 'none' }}>→</span>
      </span>
    </div>
  );
}

function Landing({ onPick }) {
  const cards = [
    {
      id:'wheel', title:'Explore by color',
      desc:'Browse a color wheel of lipstick shades and zoom into lighter and deeper tones.',
      icon: MODE_ICONS.wheel(),
    },
    {
      id:'photo', title:'Match a photo',
      desc:'Upload any photo or screenshot and tap the lipstick shade you want.',
      icon: MODE_ICONS.photo(),
    },
    {
      id:'dupe', title:'Find a dupe',
      desc:'Search a lipstick you own and find matches at any price.',
      icon: MODE_ICONS.dupe(),
    },
    {
      id:'hex', title:'Enter a hex code',
      desc:'Paste it or use the picker for a precise lipstick match.',
      icon: MODE_ICONS.hex(),
    },
  ];

  return (
    <>
      <div>
        <p style={{
          fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase',
          color:'var(--text-muted)', textAlign:'center', marginBottom:14,
        }}>
          Perceptual color matching · 9,000+ lip products
        </p>
        <h2 className="landing-lede">
          Let's find your <em style={{ fontStyle:'italic', color:'var(--espresso-mid)' }}>shade</em>.
        </h2>
      </div>
      <div className="landing-grid">
        {cards.map(c => (
          <LandingCard key={c.id} icon={c.icon} title={c.title} desc={c.desc} onClick={() => onPick(c.id)} />
        ))}
      </div>
    </>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [selectedColor, setSelectedColor] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [zoomAnchor, setZoomAnchor] = useState(null);
  const preZoomRef = React.useRef(null); // original swatch before entering zoom
  const suppressScrollRef = React.useRef(false);
  const resultsRef = React.useRef(null);
  const [toneIdx, setToneIdx] = useState(null);
  const [mode, setMode] = useState('landing'); // 'landing' | 'wheel' | 'photo' | 'hex' | 'dupe' | 'list'
  const [photoHex, setPhotoHex] = useState(null);
  const [hexHex, setHexHex] = useState(null);
  const [dupeProduct, setDupeProduct] = useState(null);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lipstick-wishlist') || '[]'); }
    catch { return []; }
  });
  const [showWishlist, setShowWishlist] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);

  // Persist wishlist
  useEffect(() => {
    localStorage.setItem('lipstick-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  function switchMode(id, source = 'tabs') {
    setMode(id);
    window.gtag?.('event', 'select_mode', { mode: id, source });
    if (id === 'wheel') { setSelectedColor(null); setPhotoHex(null); setHexHex(null); setDupeProduct(null); }
    else if (id === 'photo') { setSelectedColor(null); setZoomAnchor(null); setHexHex(null); setDupeProduct(null); }
    else if (id === 'hex')   { setSelectedColor(null); setZoomAnchor(null); setPhotoHex(null); setDupeProduct(null); }
    else if (id === 'dupe')  { setSelectedColor(null); setZoomAnchor(null); setPhotoHex(null); setHexHex(null); setDupeProduct(null); }
    else { setSelectedColor(null); setZoomAnchor(null); setPhotoHex(null); setHexHex(null); setDupeProduct(null); }
  }

  function toggleWishlist(product) {
    setWishlist(prev => {
      const key = p => `${p.brand}|${p.shade}`;
      const exists = prev.some(p => key(p) === key(product));
      if (exists) {
        window.gtag?.('event', 'remove_from_wishlist', { brand: product.brand, shade: product.shade });
        return prev.filter(p => key(p) !== key(product));
      }
      window.gtag?.('event', 'add_to_wishlist', { brand: product.brand, shade: product.shade });
      return [...prev, { brand: product.brand, product: product.product, shade: product.shade, finish: product.finish, hex: product.hex }];
    });
  }
  const [tweaks, setTweaksState] = useState(/*EDITMODE-BEGIN*/{
    "maxDeltaE": 3,
    "accentColor": "#C87890"
  }/*EDITMODE-END*/);

  function setTweak(key, val) {
    const next = { ...tweaks, [key]: val };
    setTweaksState(next);
    window.parent.postMessage({ type:'__edit_mode_set_keys', edits: next }, '*');
  }

  useEffect(() => {
    window.addEventListener('message', e => {
      if (e.data?.type === '__activate_edit_mode') setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    });
    window.parent.postMessage({ type:'__edit_mode_available' }, '*');
  }, []);

  // Push photo-sampled color into selection so the table/filters/wishlist all just work
  React.useEffect(() => {
    if (mode !== 'photo') return;
    if (photoHex) {
      setSelectedColor({ id:'__photo__', name:'Upload photo', hex: photoHex });
      window.gtag?.('event', 'select_color', { method: 'photo', hex: photoHex });
      setZoomAnchor(null);
    } else {
      setSelectedColor(null);
    }
  }, [photoHex, mode]);

  // Same plumbing for the hex-picker mode
  React.useEffect(() => {
    if (mode !== 'hex') return;
    if (hexHex) {
      setSelectedColor({ id:'__hex__', name:'From hex', hex: hexHex });
      window.gtag?.('event', 'select_color', { method: 'hex', hex: hexHex });
      setZoomAnchor(null);
    } else {
      setSelectedColor(null);
    }
  }, [hexHex, mode]);

  // Dupe mode: seed selectedColor from a picked product, excluding that product from matches
  React.useEffect(() => {
    if (mode !== 'dupe') return;
    if (dupeProduct) {
      setSelectedColor({
        id: '__dupe__',
        name: `Similar to ${dupeProduct.shade}`,
        hex: dupeProduct.hex,
        sourceKey: `${dupeProduct.brand}|${dupeProduct.shade}`,
      });
      window.gtag?.('event', 'select_color', { method: 'dupe', hex: dupeProduct.hex, brand: dupeProduct.brand, shade: dupeProduct.shade });
      setZoomAnchor(null);
    } else {
      setSelectedColor(null);
    }
  }, [dupeProduct, mode]);

  const colors = LIPSTICK_DATA;

  // ── Vibe profile (persistent shopper preferences) ───────────────────────
  const [vibe, setVibe] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lipstick-vibe') || 'null') || { finishes:[], temps:[], depths:[] }; }
    catch { return { finishes:[], temps:[], depths:[] }; }
  });
  const [showVibe, setShowVibe] = useState(false);
  React.useEffect(() => {
    localStorage.setItem('lipstick-vibe', JSON.stringify(vibe));
  }, [vibe]);
  const vibeActive = (vibe.finishes?.length || 0) + (vibe.temps?.length || 0) + (vibe.depths?.length || 0);

  // Classify a product's undertone (cool/neutral/warm) from LAB hue angle.
  // Hue angle h = atan2(b*, a*) in degrees — for reds (a*>0):
  //   h < 12°  → cool (blue/pink-leaning red, berry, fuchsia)
  //   12°–28°  → neutral (true red, balanced)
  //   h > 28°  → warm (orange/coral/brick, brown, nude)
  function classifyTemp(lab) {
    if (!lab || lab.length < 3) return 'neutral';
    const [, a, b] = lab;
    if (a <= 0) return 'neutral';
    const h = Math.atan2(b, a) * 180 / Math.PI;
    if (h < 12) return 'cool';
    if (h > 28) return 'warm';
    return 'neutral';
  }
  function classifyDepth(lab) {
    if (!lab || lab.length < 1) return 'medium';
    const L = lab[0];
    if (L >= 55) return 'light';
    if (L <= 32) return 'deep';
    return 'medium';
  }
  function matchesVibe(p) {
    if (vibe.finishes?.length && !vibe.finishes.includes(p.finish)) return false;
    const lab = p.cielab || p.lab;
    if (vibe.temps?.length && !vibe.temps.includes(classifyTemp(lab))) return false;
    if (vibe.depths?.length && !vibe.depths.includes(classifyDepth(lab))) return false;
    return true;
  }

  // When zoomed, show a light→deep tonal ramp instead of nearest palette neighbors.
  const wheelColors = React.useMemo(() => {
    if (!zoomAnchor) return colors;
    return buildTonalRamp(zoomAnchor.hex);
  }, [colors, zoomAnchor]);

  // Tonal strip for non-wheel entry points (photo / hex / list).
  const toneRamp = React.useMemo(
    () => selectedColor && mode !== 'wheel'
      ? generateToneSteps(selectedColor.hex, 2, 13, selectedColor.name || 'This shade')
      : null,
    [selectedColor?.id, selectedColor?.hex, mode]
  );
  React.useEffect(() => {
    setToneIdx(toneRamp ? toneRamp.anchorIdx : null);
  }, [toneRamp]);
  function handleToneIdxChange(i) {
    setToneIdx(prev => {
      if (prev === i || !toneRamp) return i;
      const step = toneRamp.ramp[i];
      window.gtag?.('event', 'select_color', { method: 'tone_adjust', source: mode, hex: step.hex, name: step.name });
      return i;
    });
  }
  const onAnchor = !toneRamp || toneIdx == null || toneIdx === toneRamp.anchorIdx;
  const effectiveColor = selectedColor && toneRamp && !onAnchor
    ? { ...selectedColor, hex: toneRamp.ramp[toneIdx].hex, name: toneRamp.ramp[toneIdx].name }
    : selectedColor;

  React.useEffect(() => {
    if (!effectiveColor || !resultsRef.current) return;
    if (window.innerWidth > 900) return;
    if (suppressScrollRef.current) { suppressScrollRef.current = false; return; }
    const timer = setTimeout(() => {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => clearTimeout(timer);
  }, [effectiveColor?.id, effectiveColor?.hex]);

  const matches = React.useMemo(() => {
    if (!selectedColor) return [];
    const hex = toneRamp && toneIdx != null && !onAnchor ? toneRamp.ramp[toneIdx].hex : selectedColor.hex;
    const candidates = getClosestColors(hex, 500)
      .filter(p => !selectedColor.sourceKey || `${p.brand}|${p.shade}` !== selectedColor.sourceKey)
      .filter(matchesVibe);
    const bestDist = candidates[0]?.distance ?? 0;
    const inBand = candidates.filter(p => p.distance <= bestDist + tweaks.maxDeltaE);
    return inBand.length >= 5 ? inBand : candidates.slice(0, 5);
  }, [selectedColor, toneRamp, toneIdx, tweaks.maxDeltaE, matchesVibe]);
  // matches: array of real products with .hex .brand .product .shade .finish .retailer .distance
  function togglePin(product) {
    setPinnedItems(prev => {
      const key = p => `${p.brand}|${p.shade}`;
      const exists = prev.some(p => key(p) === key(product));
      if (exists) return prev.filter(p => key(p) !== key(product));
      if (prev.length >= 4) return prev; // max 4
      window.gtag?.('event', 'pin_item', { brand: product.brand, shade: product.shade });
      return [...prev, product];
    });
  }

  // Color wheel is now the only palette style

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', zIndex:1 }}>

      {/* Header */}
      <header className="app-header" style={{
        display:'flex', alignItems:'center', gap:16,
        borderBottom:'1px solid var(--border)',
      }}>
        <h1 style={{
          fontFamily:'DM Sans', fontWeight:500, fontSize:13,
          letterSpacing:'0.16em', textTransform:'uppercase',
          color:'var(--espresso)',
        }}>
          Lipstick Color Finder
        </h1>
        <a href="about.html"
          onClick={() => window.gtag?.('event', 'nav_link_click', { target: 'about', location: 'header' })}
          style={{
            marginLeft:'auto', display:'flex', alignItems:'center', gap:8,
            padding:'8px 16px', borderRadius:24,
            border:'1.5px solid var(--border)',
            background:'#fff',
            color:'var(--espresso)', textDecoration:'none',
            fontFamily:'DM Sans', fontSize:12, fontWeight:500, letterSpacing:'0.06em',
            textTransform:'uppercase', transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--blush)'; e.currentTarget.style.color='var(--blush)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--espresso)'; }}
        >
          How It Works
        </a>
        <button
          onClick={() => setShowWishlist(true)}
          style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'8px 16px', borderRadius:24,
            border:'1.5px solid var(--border)', background:'#fff',
            color:'var(--espresso)', cursor:'pointer',
            fontFamily:'DM Sans', fontSize:12, fontWeight:500, letterSpacing:'0.06em',
            textTransform:'uppercase', transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--blush)'; e.currentTarget.style.color='var(--blush)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--espresso)'; }}
        >
          <span style={{ color:'var(--blush)' }}>♥</span> My Favorites
          {wishlist.length > 0 && (
            <span style={{
              background:'var(--blush)', color:'#fff',
              fontSize:10, padding:'1px 7px', borderRadius:20, marginLeft:2,
            }}>{wishlist.length}</span>
          )}
        </button>
      </header>

      {/* Main layout */}
      {mode === 'landing' ? (
        <main className="landing-main">
          <Landing onPick={id => switchMode(id, 'landing')} />
        </main>
      ) : (
      <>
      {/* Mode bar — full-width, under the header */}
      <div className="mode-bar" style={{
        display:'flex', flexWrap:'wrap',
        background:'var(--cream-dark)', borderBottom:'1px solid var(--border)',
      }}>
        {[
          {id:'wheel', label:'Color wheel', hint:'Browse by hue'},
          {id:'photo', label:'Upload photo', hint:'Match from a photo'},
          {id:'hex', label:'Custom color', hint:'Hex code or picker'},
          {id:'dupe', label:'Dupe finder', hint:'Match a lipstick you own'},
          ...(wishlist.length > 0 ? [{id:'list', label:'From My List', hint:'Your saved shades'}] : []),
        ].map(t => {
          const active = mode === t.id;
          return (
            <button key={t.id}
              onClick={() => switchMode(t.id)}
              style={{
                fontFamily:'DM Sans', display:'flex', alignItems:'center', gap:11,
                textAlign:'left', background: active ? '#fff' : 'transparent',
                border:'none', borderBottom:`2px solid ${active ? 'var(--blush)' : 'transparent'}`,
                padding:'14px 20px 12px', cursor:'pointer', transition:'background 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{
                width:30, height:30, borderRadius:'50%', flexShrink:0,
                background:'rgba(200,120,144,0.10)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{MODE_ICONS[t.id](16)}</span>
              <span style={{ display:'flex', flexDirection:'column' }}>
                <span style={{ fontSize:12.5, color: active ? 'var(--espresso)' : 'var(--text-body)' }}>{t.label}</span>
                <span style={{ fontSize:10.5, color:'var(--text-muted)', marginTop:2 }}>{t.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      <main className="app-main" style={{
        paddingBottom: pinnedItems.length > 0 ? 140 : undefined,
        transition:'padding-bottom 0.35s ease',
      }}>
        {/* Left: Palette */}
        <div className="palette-col">
          {mode === 'wheel' ? (
            <div style={{ position:'relative' }}>
              <ColorWheel
                colors={wheelColors}
                selectedId={selectedColor?.id}
                onSelect={c => { setSelectedColor(c); window.gtag?.('event', 'select_color', { method: 'wheel', zoomed: !!zoomAnchor, hex: c.hex, name: c.name }); }}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                preserveOrder={!!zoomAnchor}
              />
            </div>
          ) : mode === 'photo' ? (
            <PhotoPicker sampledHex={photoHex} onColor={setPhotoHex} />
          ) : mode === 'hex' ? (
            <HexPicker sampledHex={hexHex} onColor={setHexHex} />
          ) : mode === 'dupe' ? (
            <DupeFinder
              product={dupeProduct}
              onSelect={setDupeProduct}
              onUsePhoto={() => { setMode('photo'); setDupeProduct(null); }}
            />
          ) : (
            <ListPicker
              wishlist={wishlist}
              selectedKey={selectedColor?.sourceKey}
              onPick={p => {
                setSelectedColor({
                  id:'__list__',
                  name:`Similar to ${p.shade}`,
                  hex: p.hex,
                  sourceKey: `${p.brand}|${p.shade}`,
                });
                window.gtag?.('event', 'select_color', { method: 'list', hex: p.hex, name: p.shade });
              }}
            />
          )}

          {/* Zoom control — sits under the wheel */}
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
            minHeight:32, marginTop:4,
          }}>
            {!zoomAnchor && selectedColor && mode === 'wheel' && (
              <button
                onClick={() => {
                  const ramp = buildTonalRamp(selectedColor.hex);
                  const anchorLab = hexToLab(selectedColor.hex);
                  const nearest = ramp.reduce((best, step) => {
                    const d = deltaE(anchorLab, hexToLab(step.hex));
                    return d < best.d ? { step, d } : best;
                  }, { step: ramp[5], d: Infinity }).step;
                  preZoomRef.current = selectedColor;
                  setZoomAnchor(selectedColor);
                  suppressScrollRef.current = true;
                  setSelectedColor(nearest);
                  window.gtag?.('event', 'zoom_shades', { hex: selectedColor.hex, name: selectedColor.name });
                }}
                style={{
                  padding:'8px 16px',
                  fontSize:11, fontFamily:'DM Sans',
                  letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500,
                  background:'transparent', color:'var(--blush)',
                  border:'1px solid var(--blush)', borderRadius:20,
                  cursor:'pointer', transition:'all 0.15s ease',
                  display:'inline-flex', alignItems:'center', gap:8,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--blush)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--blush)'; }}
              >
                <span>See lighter &amp; deeper shades</span>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0 }}>
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            {zoomAnchor && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                  <button
                    onClick={() => {
                      setZoomAnchor(null);
                      if (preZoomRef.current) { suppressScrollRef.current = true; setSelectedColor(preZoomRef.current); }
                    }}
                    style={{
                      padding:'8px 16px',
                      fontSize:11, fontFamily:'DM Sans',
                      letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500,
                      background:'var(--espresso)', color:'var(--cream)',
                      border:'1px solid var(--espresso)', borderRadius:20,
                      cursor:'pointer', transition:'all 0.15s ease',
                      display:'inline-flex', alignItems:'center', gap:8,
                    }}
                  >
                    <span style={{ fontSize:13, lineHeight:1 }}>←</span>
                    <span>Show all shades</span>
                  </button>
                </div>
                <span style={{
                  fontSize:10, color:'var(--text-muted)', fontFamily:'DM Sans',
                  letterSpacing:'0.05em', fontStyle:'italic',
                }}>
                  Lighter to deeper shades of this color
                </span>
              </div>
            )}
          </div>

          {/* Selected color pill */}
          {selectedColor && (
            <div style={{
              marginTop:28, display:'flex', alignItems:'center', gap:10,
              padding:'8px 16px 8px 10px',
              background:'#fff', borderRadius:40,
              border:'1px solid var(--border)',
              boxShadow:'0 2px 8px var(--shadow)',
              animation:'fadeUp 0.2s ease',
            }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background: selectedColor.hex,
                boxShadow:`0 2px 8px ${selectedColor.hex}60`,
              }}/>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--espresso)', lineHeight:1.2 }}>{selectedColor.name}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.06em' }}>{selectedColor.hex.toUpperCase()}</div>
              </div>
              <button onClick={() => { setSelectedColor(null); setZoomAnchor(null); }} style={{
                marginLeft:4, background:'none', border:'none', cursor:'pointer',
                color:'var(--text-muted)', fontSize:16, lineHeight:1, padding:'2px 4px',
              }}>×</button>
            </div>
          )}

          {/* Wheel hint */}
          {mode === 'wheel' && (
            <p style={{
              fontSize:11, color:'var(--text-muted)', letterSpacing:'0.05em',
              fontFamily:'DM Sans', marginTop:8, textAlign:'center',
            }}>
              Click a segment to browse matching lipstick shades
            </p>
          )}

          {/* Mobile-only: quiet placeholder shown below picker before a color is picked */}
          {!selectedColor && mode !== 'dupe' && (
            <div className="mobile-picker-tips" style={{ justifyContent:'center', textAlign:'center' }}>
              <p style={{ fontFamily:'DM Sans', fontSize:13, color:'var(--text-muted)', letterSpacing:'0.02em' }}>
                Your matches will appear here
              </p>
            </div>
          )}

        </div>

        {/* Right: Results */}
        <div className="results-col" ref={resultsRef}>
          <ResultsTable selectedColor={effectiveColor} matches={matches} totalProducts={REAL_PRODUCTS.length} pinnedItems={pinnedItems} togglePin={togglePin} wishlist={wishlist} toggleWishlist={toggleWishlist} toneRamp={toneRamp} toneIdx={toneIdx} setToneIdx={handleToneIdxChange} />
        </div>
      </main>
      </>
      )}

      {/* Footer */}
      <footer className="app-footer" style={{
        borderTop:'1px solid var(--border)',
        display:'flex', gap:24, alignItems:'center',
      }}>
        <span style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.05em' }}>
          Showing closest matches by color distance (ΔE)
        </span>
        <a href="color-guide.html"
          onClick={() => window.gtag?.('event', 'nav_link_click', { target: 'color_guide', location: 'footer' })}
          style={{
          fontSize:11, color:'var(--blush)', letterSpacing:'0.05em',
          textDecoration:'none', borderBottom:'1px solid currentColor', paddingBottom:1,
          transition:'opacity 0.15s',
        }}>
          What is ΔE?
        </a>
        <a href="about.html"
          onClick={() => window.gtag?.('event', 'nav_link_click', { target: 'about', location: 'footer' })}
          style={{
          fontSize:11, color:'var(--blush)', letterSpacing:'0.05em',
          textDecoration:'none', borderBottom:'1px solid currentColor', paddingBottom:1,
          transition:'opacity 0.15s',
        }}>
          How It Works
        </a>
        {selectedColor && matches.length > 0 && (
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>
            · {matches.length} closest match{matches.length !== 1 ? 'es' : ''} from {REAL_PRODUCTS.length} products
          </span>
        )}
      </footer>

      {/* Tweaks panel */}
      {showTweaks && (
        <TweaksPanel tweaks={tweaks} setTweak={setTweak} onClose={() => {
          setShowTweaks(false);
          window.parent.postMessage({ type:'__edit_mode_dismissed' }, '*');
        }} />
      )}

      {/* Comparison tray */}
      <ComparisonTray
        pinnedItems={pinnedItems}
        onRemove={p => togglePin(p)}
        onClear={() => setPinnedItems([])}
      />

      {/* Vibe panel */}
      {showVibe && (
        <VibePanel
          vibe={vibe}
          setVibe={setVibe}
          onClose={() => setShowVibe(false)}
        />
      )}

      {/* Wishlist panel */}
      {showWishlist && (
        <WishlistPanel
          wishlist={wishlist}
          onClose={() => setShowWishlist(false)}
          onRemove={p => toggleWishlist(p)}
          onClear={() => setWishlist([])}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        :root { --blush: ${tweaks.accentColor}; }
        tbody tr { transition: background 0.12s; }
        input[type=range] { width:100%; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
      `}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
