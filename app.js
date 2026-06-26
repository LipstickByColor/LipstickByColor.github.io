function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect
} = React;

// Look up a product's image URL from the prebuilt index.
// Keys are "brand|product|shade" lowercased.
function getProductImage(p) {
  if (!p || !window.LIPSTICK_IMAGES) return null;
  const key = `${(p.brand || '').toLowerCase()}|${(p.product || '').toLowerCase()}|${(p.shade || '').toLowerCase()}`;
  return window.LIPSTICK_IMAGES[key] || null;
}

// Product thumb: real swatch/bullet photo. The extracted color shows immediately
// as a placeholder; the photo crossfades in once loaded.
function ProductThumb({
  product,
  size = 56,
  zoom = 1.18
}) {
  const url = getProductImage(product);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [url]);
  const showImg = url && !failed;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: 10,
      overflow: 'hidden',
      background: product.hex,
      boxShadow: showImg && loaded ? 'none' : `inset 0 2px 8px ${product.hex}70`,
      border: '1px solid rgba(42,26,20,0.08)',
      position: 'relative'
    }
  }, showImg && /*#__PURE__*/React.createElement("img", {
    key: url,
    src: url,
    alt: `${product.brand} ${product.shade}`,
    loading: "lazy",
    decoding: "async",
    onLoad: () => setLoaded(true),
    onError: () => setFailed(true),
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: `scale(${zoom})`,
      transformOrigin: 'center',
      display: 'block',
      opacity: loaded ? 1 : 0,
      transition: 'opacity 0.2s ease'
    }
  }));
}

// Slim vertical color chip — paired with ProductThumb so the
// extracted shade reads clearly even when the photo is busy.
function ShadeChip({
  hex,
  height = 56,
  width = 10
}) {
  return /*#__PURE__*/React.createElement("div", {
    title: hex,
    style: {
      width,
      height,
      flexShrink: 0,
      borderRadius: 6,
      background: hex,
      boxShadow: `0 1px 4px ${hex}55, inset 0 1px 0 rgba(255,255,255,0.18)`,
      border: '1px solid rgba(42,26,20,0.08)'
    }
  });
}

// Utility: luminance for text contrast
function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// finish badge color
function finishColor(finish) {
  const map = {
    Matte: '#8C6858',
    Satin: '#C4A060',
    Cream: '#C87890',
    Gloss: '#7090A0',
    Lustre: '#9080A8',
    Amplified: '#C05870',
    Frost: '#80A0B0',
    Sheer: '#B0A090'
  };
  return map[finish] || '#8C6858';
}

// Brand → price tier heuristics. Unlisted brands default to '$$'.
const BRAND_TIER = {
  // $ — Drugstore / mass-market
  "a'pieu": '$',
  'almay': '$',
  'ardell': '$',
  'australis cosmetics': '$',
  'avon': '$',
  'barry m cosmetics': '$',
  'beauty care naturals': '$',
  'blk/opl': '$',
  'bourjois': '$',
  "burt's bees": '$',
  'catrice': '$',
  'chapstick': '$',
  'colourpop': '$',
  'covergirl': '$',
  'e.l.f. cosmetics': '$',
  'essence': '$',
  'etude': '$',
  'flower beauty': '$',
  'flormar': '$',
  'holika holika': '$',
  'i heart revolution': '$',
  "i'm meme": '$',
  'iman cosmetics': '$',
  'inc.redible': '$',
  'j.cat beauty': '$',
  'kay beauty': '$',
  "l'oréal": '$',
  'l.a. colors': '$',
  'l.a. girl': '$',
  'makeup revolution': '$',
  'mango people': '$',
  'max factor': '$',
  'maybelline': '$',
  'milani': '$',
  'morphe 2': '$',
  'mua makeup academy': '$',
  'nature republic': '$',
  'neutrogena': '$',
  'no7': '$',
  'nykaa': '$',
  'nyx professional makeup': '$',
  'pacifica': '$',
  'peripera': '$',
  'physicians formula': '$',
  'revolution pro': '$',
  'revlon': '$',
  'rimmel': '$',
  'sleek makeup': '$',
  'soap & glory': '$',
  'the balm cosmetics': '$',
  'the creme shop': '$',
  'the lip bar': '$',
  'the saem': '$',
  'w7': '$',
  'wet n wild': '$',
  'xx revolution': '$',
  // $$$ — Luxury / designer
  'addiction tokyo': '$$$',
  'aj crimson': '$$$',
  'armani beauty': '$$$',
  'augustinus bader': '$$$',
  'bassam fattouh': '$$$',
  'burberry': '$$$',
  'by terry': '$$$',
  'byredo': '$$$',
  'carolina herrera': '$$$',
  'chanel': '$$$',
  'chantecaille': '$$$',
  'charlotte tilbury': '$$$',
  'christian louboutin': '$$$',
  'clé de peau beauté': '$$$',
  'decorté': '$$$',
  'dior': '$$$',
  'dolce & gabbana': '$$$',
  'edward bess': '$$$',
  'emilie heathe': '$$$',
  'estée lauder': '$$$',
  'fara homidi': '$$$',
  'florasis': '$$$',
  'givenchy': '$$$',
  'gucci': '$$$',
  'guerlain': '$$$',
  'hermès': '$$$',
  'house of sillage': '$$$',
  'isamaya': '$$$',
  'jung saem mool': '$$$',
  'kjaer weis': '$$$',
  'koh gen do': '$$$',
  'la bouche rouge, paris': '$$$',
  'la perla': '$$$',
  'lancôme': '$$$',
  'lunasol': '$$$',
  'mara': '$$$',
  'marc jacobs beauty': '$$$',
  'monika blunder': '$$$',
  'pat mcgrath labs': '$$$',
  'prada beauty': '$$$',
  'rabanne': '$$$',
  'rodin olio lusso': '$$$',
  'sarah creal': '$$$',
  'sensai': '$$$',
  'serge lutens': '$$$',
  'shiseido': '$$$',
  'shu uemura': '$$$',
  'sisley paris': '$$$',
  'skkn by kim': '$$$',
  'suqqu': '$$$',
  'surratt beauty': '$$$',
  'tata harper': '$$$',
  'tatcha': '$$$',
  'tom ford': '$$$',
  'valentino': '$$$',
  'victoria beckham beauty': '$$$',
  'westman atelier': '$$$',
  'yves saint laurent': '$$$'
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
    const name = d === 0 ? baseName : d < 0 ? d === -perSide ? `${baseName} · lightest` : `${baseName} · lighter` : d === perSide ? `${baseName} · deepest` : `${baseName} · deeper`;
    out.push({
      id: `t-${d}`,
      hex: labToHex(L, Math.cos(hueRad) * C, Math.sin(hueRad) * C),
      name
    });
  }
  return {
    ramp: out,
    anchorStep: out[perSide],
    anchorIdx: perSide
  };
}

// Generate a light→deep tonal ramp of 11 steps from an anchor hex.
// Holds hue angle constant; tapers chroma at the lightest and deepest ends.
function buildTonalRamp(anchorHex) {
  const [, a, b] = hexToLab(anchorHex);
  const hue = Math.atan2(b, a);
  const chroma = Math.sqrt(a * a + b * b);
  const STEPS = 11;
  return Array.from({
    length: STEPS
  }, (_, i) => {
    const t = i / (STEPS - 1);
    const L = 88 - t * 66; // 88 (lightest) → 22 (deepest)
    // parabolic taper: 0.35 at both ends, 1.0 at t=0.5
    const scale = 0.35 + 0.65 * (1 - Math.pow(2 * t - 1, 2));
    const c = chroma * scale;
    return {
      id: `ramp_${i}`,
      hex: labToHex(L, c * Math.cos(hue), c * Math.sin(hue)),
      name: ['Lightest', 'Very Light', 'Light', 'Medium-Light', 'Medium-Light', 'Medium', 'Medium-Deep', 'Deep', 'Deep', 'Very Deep', 'Deepest'][i]
    };
  });
}

// ── Color math helpers ─────────────────────────────────────────────────────────
function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return {
    h: h * 360,
    s,
    l
  };
}
function getHsl(hex) {
  const {
    r,
    g,
    b
  } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

// ── Segmented Color Wheel ──────────────────────────────────────────────────────
// Each of the 40 colors gets its own arc segment — clear boundaries, labeled,
// clickable. Colors sorted by hue; arranged in 2 rings (light outer, dark inner).
function ColorWheel({
  colors,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
  preserveOrder
}) {
  const SIZE = 440;
  const CX = SIZE / 2,
    CY = SIZE / 2;
  const N = colors.length;
  const SINGLE_RING = N <= 14 || N % 2 !== 0;
  const HALF = SINGLE_RING ? N : N / 2;

  // Radii scale with SIZE (designed for 380; scale up/down proportionally)
  const S = SIZE / 380;
  // Outer ring radii
  const R_OUTER_OUT = 184 * S;
  const R_OUTER_IN = 110 * S;
  // Inner ring radii (only used in 2-ring mode)
  const R_INNER_OUT = 108 * S;
  const R_INNER_IN = 44 * S;
  // Single-ring radii (one wide ring covering both)
  const R_SINGLE_OUT = 184 * S;
  const R_SINGLE_IN = 60 * S;
  const GAP_DEG = 0.8;
  const DIVIDER_GAP = 0; // no visual gap — novelty block sits at bottom, GMM fills the rest

  // Build segments with explicit angle ranges.
  const segments = [];
  if (preserveOrder) {
    // Zoom / ΔE mode: colors in passed order, evenly spaced across full 360°
    const sliceDeg = 360 / HALF;
    if (SINGLE_RING) {
      colors.forEach((c, i) => segments.push({
        outer: c,
        inner: null,
        startDeg: i * sliceDeg + GAP_DEG / 2,
        endDeg: (i + 1) * sliceDeg - GAP_DEG / 2
      }));
    } else {
      for (let i = 0; i < HALF; i++) {
        const a = colors[i * 2],
          b = colors[i * 2 + 1];
        const la = getHsl(a.hex).l,
          lb = getHsl(b.hex).l;
        const outer = la >= lb ? a : b,
          inner = la >= lb ? b : a;
        segments.push({
          outer,
          inner,
          startDeg: i * sliceDeg + GAP_DEG / 2,
          endDeg: (i + 1) * sliceDeg - GAP_DEG / 2
        });
      }
    }
  } else {
    // Normal mode: GMM colors hue-sorted across most of the wheel; novelty colors
    // hue-sorted in a fixed block at the bottom (180°), separated by DIVIDER_GAP.
    const sortByHue = arr => [...arr].sort((a, b) => getHsl(a.hex).h - getHsl(b.hex).h);
    const gmmColors = sortByHue(colors.filter(c => !c.novelty));
    const novColors = sortByHue(colors.filter(c => c.novelty));
    const sliceDeg = (360 - DIVIDER_GAP) / HALF;
    const novHalf = SINGLE_RING ? novColors.length : novColors.length / 2;
    const gmmHalf = SINGLE_RING ? gmmColors.length : gmmColors.length / 2;
    const novSpan = novHalf * sliceDeg;
    const novStart = 180 - novSpan / 2; // center novelty block at bottom (180°)
    const gmmStart = novStart + novSpan + DIVIDER_GAP;
    for (let i = 0; i < gmmHalf; i++) {
      const a = gmmColors[i * 2],
        b = gmmColors[i * 2 + 1];
      const la = getHsl(a.hex).l,
        lb = getHsl(b.hex).l;
      const outer = la >= lb ? a : b,
        inner = la >= lb ? b : a;
      const s = gmmStart + i * sliceDeg;
      segments.push({
        outer,
        inner,
        startDeg: s + GAP_DEG / 2,
        endDeg: s + sliceDeg - GAP_DEG / 2
      });
    }
    for (let i = 0; i < novHalf; i++) {
      const a = novColors[i * 2],
        b = novColors[i * 2 + 1];
      const la = getHsl(a.hex).l,
        lb = getHsl(b.hex).l;
      const outer = la >= lb ? a : b,
        inner = la >= lb ? b : a;
      const s = novStart + i * sliceDeg;
      segments.push({
        outer,
        inner,
        startDeg: s + GAP_DEG / 2,
        endDeg: s + sliceDeg - GAP_DEG / 2
      });
    }
  }
  function polarToXY(angleDeg, r) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: CX + r * Math.cos(rad),
      y: CY + r * Math.sin(rad)
    };
  }
  function arcPath(startDeg, endDeg, rOuter, rInner) {
    const s1 = polarToXY(startDeg, rOuter);
    const e1 = polarToXY(endDeg, rOuter);
    const s2 = polarToXY(endDeg, rInner);
    const e2 = polarToXY(startDeg, rInner);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return [`M ${s1.x} ${s1.y}`, `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${e1.x} ${e1.y}`, `L ${s2.x} ${s2.y}`, `A ${rInner} ${rInner} 0 ${largeArc} 0 ${e2.x} ${e2.y}`, 'Z'].join(' ');
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    width: "100%",
    height: "auto",
    style: {
      filter: 'drop-shadow(0 6px 24px rgba(42,26,20,0.14))',
      maxWidth: SIZE,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: CX,
    cy: CY,
    r: R_OUTER_OUT + 2,
    fill: "#F0E8DF"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: CX,
    cy: CY,
    r: R_OUTER_OUT + 2,
    fill: "none",
    stroke: "#E0D0C0",
    strokeWidth: "1.5"
  }), segments.map(({
    outer,
    inner,
    startDeg,
    endDeg
  }) => {
    const outerSelected = outer.id === selectedId;
    const innerSelected = inner && inner.id === selectedId;
    const outerHovered = outer.id === hoveredId;
    const innerHovered = inner && inner.id === hoveredId;

    // Pick radii based on single vs double ring
    const outerR1 = SINGLE_RING ? R_SINGLE_OUT : R_OUTER_OUT;
    const outerR2 = SINGLE_RING ? R_SINGLE_IN : R_OUTER_IN + 1;
    const outerPath = arcPath(startDeg, endDeg, outerR1, outerR2);
    const innerPath = inner ? arcPath(startDeg, endDeg, R_INNER_OUT - 1, R_INNER_IN) : null;
    const outerLabel = labelPos(startDeg, endDeg, outerR1, outerR2);
    const innerLabel = inner ? labelPos(startDeg, endDeg, R_INNER_OUT - 1, R_INNER_IN) : null;
    const outerRot = labelRotation(startDeg, endDeg);
    const innerRot = inner ? labelRotation(startDeg, endDeg) : 0;
    const outerLum = luminance(outer.hex);
    const innerLum = inner ? luminance(inner.hex) : 0;
    return /*#__PURE__*/React.createElement("g", {
      key: outer.id
    }, /*#__PURE__*/React.createElement("path", {
      d: outerPath,
      fill: outer.hex,
      stroke: outerSelected ? '#2A1A14' : '#FAF6F1',
      strokeWidth: outerSelected ? 2 : 1,
      opacity: outerHovered && !outerSelected ? 0.82 : 1,
      style: {
        cursor: 'pointer',
        transition: 'opacity 0.12s'
      },
      onClick: () => onSelect(outer),
      onMouseEnter: () => onHover(outer.id),
      onMouseLeave: () => onHover(null)
    }), outerSelected && /*#__PURE__*/React.createElement("path", {
      d: outerPath,
      fill: "none",
      stroke: "#2A1A14",
      strokeWidth: "2.5",
      opacity: "0.6"
    }), inner && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
      d: innerPath,
      fill: inner.hex,
      stroke: innerSelected ? '#2A1A14' : '#FAF6F1',
      strokeWidth: innerSelected ? 2 : 1,
      opacity: innerHovered && !innerSelected ? 0.82 : 1,
      style: {
        cursor: 'pointer',
        transition: 'opacity 0.12s'
      },
      onClick: () => onSelect(inner),
      onMouseEnter: () => onHover(inner.id),
      onMouseLeave: () => onHover(null)
    }), innerSelected && /*#__PURE__*/React.createElement("path", {
      d: innerPath,
      fill: "none",
      stroke: "#2A1A14",
      strokeWidth: "2.5",
      opacity: "0.6"
    })));
  }), /*#__PURE__*/React.createElement("circle", {
    cx: CX,
    cy: CY,
    r: (SINGLE_RING ? R_SINGLE_IN : R_INNER_IN) - 1,
    fill: selectedId ? colors.find(c => c.id === selectedId)?.hex || '#FAF6F1' : '#FAF6F1',
    stroke: "#E0D0C0",
    strokeWidth: "1.5",
    style: {
      transition: 'fill 0.3s ease'
    }
  }), selectedId && (() => {
    const c = colors.find(c => c.id === selectedId);
    if (!c) return null;
    const lum = luminance(c.hex);
    return /*#__PURE__*/React.createElement("text", {
      x: CX,
      y: CY,
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontSize: "11",
      fontFamily: "DM Sans, sans-serif",
      fontWeight: "500",
      fill: lum > 0.32 ? 'rgba(42,26,20,0.7)' : 'rgba(255,255,255,0.85)',
      style: {
        pointerEvents: 'none',
        userSelect: 'none'
      }
    }, c.hex.toUpperCase());
  })(), /*#__PURE__*/React.createElement("circle", {
    cx: CX,
    cy: CY,
    r: R_OUTER_OUT + 2,
    fill: "none",
    stroke: "#D8C8B8",
    strokeWidth: "1"
  })));
}

// ── Filter Dropdown ───────────────────────────────────────────────────────────
function FilterDropdown({
  label,
  count,
  onClear,
  isOpen,
  onOpen,
  children
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!isOpen) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOpen(null);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, onOpen]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpen(isOpen ? null : label),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 11,
      padding: '5px 12px',
      borderRadius: 20,
      border: `1.5px solid ${count ? 'var(--espresso-mid)' : 'var(--border)'}`,
      background: count ? 'rgba(92,61,48,0.08)' : isOpen ? 'var(--cream-dark)' : 'transparent',
      color: count ? 'var(--espresso-mid)' : 'var(--text-muted)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      fontWeight: count ? 500 : 400,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      transition: 'all 0.15s'
    }
  }, label, count > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--espresso-mid)',
      color: '#fff',
      fontSize: 11,
      padding: '1px 6px',
      borderRadius: 20,
      lineHeight: 1.6
    }
  }, count), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      opacity: 0.55,
      transform: isOpen ? 'rotate(180deg)' : 'none',
      transition: 'transform 0.15s'
    }
  }, "\u25BC")), isOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 7px)',
      left: 0,
      zIndex: 60,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 14,
      boxShadow: '0 10px 30px rgba(42,26,20,0.18)',
      padding: 14,
      minWidth: 200,
      maxWidth: 300,
      animation: 'fadeUp 0.15s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, children), count > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    style: {
      marginTop: 10,
      fontSize: 11,
      padding: '4px 10px',
      borderRadius: 20,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      letterSpacing: '0.04em'
    }
  }, "Clear ", label.toLowerCase())));
}

// ── Results Table ─────────────────────────────────────────────────────────────
function ResultsTable({
  selectedColor,
  matches,
  totalProducts,
  pinnedItems,
  togglePin,
  wishlist,
  toggleWishlist,
  toneRamp,
  toneIdx,
  setToneIdx
}) {
  const [activeFinishes, setActiveFinishes] = React.useState([]);
  const [activeBrands, setActiveBrands] = React.useState([]);
  const [activeTones, setActiveTones] = React.useState([]);
  const [activeTiers, setActiveTiers] = React.useState([]);
  const [openFilter, setOpenFilter] = React.useState(null);

  // Reset filters when selection changes
  React.useEffect(() => {
    setActiveFinishes([]);
    setActiveBrands([]);
    setActiveTones([]);
    setActiveTiers([]);
    setOpenFilter(null);
  }, [selectedColor?.id]);

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
  function tierOf(p) {
    return BRAND_TIER[p.brand] || '$$';
  }

  // Derive available options from matches
  const allFinishes = [...new Set(matches.map(p => p.finish))].sort();
  const allBrands = [...new Set(matches.map(p => p.brand))].sort();
  const allTones = [...new Set(matches.map(toneOf))];
  const TONE_ORDER = ['cool', 'neutral', 'warm'];
  const orderedTones = TONE_ORDER.filter(t => allTones.includes(t));
  const TIER_ORDER = ['$', '$$', '$$$'];
  const allTiers = TIER_ORDER.filter(t => matches.some(p => tierOf(p) === t));
  if (!selectedColor) return /*#__PURE__*/React.createElement("div", {
    className: "results-empty-state",
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      textAlign: 'center',
      padding: 40,
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "results-empty-tips",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(200,120,144,0.10)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 20 20",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 10 10 L 18 10 A 8 8 0 0 1 10 18 Z",
    fill: "#F5C5C5",
    stroke: "#D4B8AC",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 10 10 L 10 18 A 8 8 0 0 1 2 10 Z",
    fill: "#C87890",
    stroke: "#D4B8AC",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 10 10 L 2 10 A 8 8 0 0 1 10 2 Z",
    fill: "#8B4558",
    stroke: "#D4B8AC",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 10 10 L 10 2 A 8 8 0 0 1 18 10 Z",
    fill: "#E8C8B8",
    stroke: "#D4B8AC",
    strokeWidth: "0.5"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--espresso)',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, "Color Wheel"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 400,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Discover products by color family, then explore lighter and deeper shades."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(200,120,144,0.10)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 20 20",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "7",
    width: "16",
    height: "10",
    rx: "2",
    fill: "#EDD8CE",
    stroke: "#D4B8AC",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "5",
    width: "7",
    height: "3",
    rx: "1",
    fill: "#EDD8CE",
    stroke: "#D4B8AC",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "10",
    cy: "12",
    r: "3",
    fill: "#F0D8D0",
    stroke: "#C87890",
    strokeWidth: "1.2"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--espresso)',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, "Upload Photo"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 400,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Upload a photo and tap the exact shade you'd like to match."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(200,120,144,0.10)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 20 20",
    fill: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "14",
    cy: "5",
    r: "3.5",
    fill: "#EDD8CE",
    stroke: "#D4B8AC",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "7.5",
    x2: "5.5",
    y2: "14",
    stroke: "#D4B8AC",
    strokeWidth: "2",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "4",
    cy: "15.5",
    r: "2",
    fill: "#C87890"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--espresso)',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, "Custom Color"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 400,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Choose from the color picker or enter a hex code when you know the exact color you're looking for."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(200,120,144,0.10)',
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 20 20",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "13",
    width: "6",
    height: "6",
    rx: "1",
    fill: "#EDD8CE",
    stroke: "#D4B8AC",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "15.5",
    width: "6",
    height: "2",
    fill: "#E4C8BC",
    stroke: "#D4B8AC",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "7.5",
    width: "4",
    height: "5.5",
    rx: "0.5",
    fill: "#F0DED8",
    stroke: "#D4B8AC",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "4",
    height: "3.5",
    fill: "#C87890",
    stroke: "#A86878",
    strokeWidth: "0.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 4 Q3.5 1 5 0.5 Q6.5 1 7 4 Z",
    fill: "#C87890",
    stroke: "#A86878",
    strokeWidth: "0.6",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "2.8",
    x2: "7",
    y2: "1.5",
    stroke: "#A86878",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "12",
    y: "13",
    width: "6",
    height: "6",
    rx: "1",
    fill: "#EDD8CE",
    stroke: "#D4B8AC",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "12",
    y: "15.5",
    width: "6",
    height: "2",
    fill: "#E4C8BC",
    stroke: "#D4B8AC",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13",
    y: "7.5",
    width: "4",
    height: "5.5",
    rx: "0.5",
    fill: "#F0DED8",
    stroke: "#D4B8AC",
    strokeWidth: "0.8"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13",
    y: "4",
    width: "4",
    height: "3.5",
    fill: "#C87890",
    stroke: "#A86878",
    strokeWidth: "0.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 4 Q13.5 1 15 0.5 Q16.5 1 17 4 Z",
    fill: "#C87890",
    stroke: "#A86878",
    strokeWidth: "0.6",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "13",
    y1: "2.8",
    x2: "17",
    y2: "1.5",
    stroke: "#A86878",
    strokeWidth: "0.5"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--espresso)',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, "Dupe Finder"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 400,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Search a lipstick you already own and find color-matched alternatives at any price point."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: 'var(--blush)',
      flexShrink: 0,
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(200,120,144,0.10)',
      marginTop: 2
    }
  }, "\u2665"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--espresso)',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, "My Favorites"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 400,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Heart products to save them, compare options, and explore similar shades later."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: 'var(--espresso-mid)',
      flexShrink: 0,
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--cream-dark)',
      fontWeight: 300,
      marginTop: 2
    }
  }, "+"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--espresso)',
      marginBottom: 2,
      lineHeight: 1.3
    }
  }, "Shade Comparison"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 400,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, "Pin up to four shades to compare them side by side.")))));

  // Toggle a finish on/off
  function toggleFinish(f) {
    if (!activeFinishes.includes(f)) window.gtag?.('event', 'apply_filter', {
      filter_type: 'finish',
      filter_value: f
    });
    setActiveFinishes(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  // Toggle a brand on/off
  function toggleBrand(b) {
    if (!activeBrands.includes(b)) window.gtag?.('event', 'apply_filter', {
      filter_type: 'brand',
      filter_value: b
    });
    setActiveBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  }

  // Apply both filters
  // Toggle a tone on/off
  function toggleTone(t) {
    if (!activeTones.includes(t)) window.gtag?.('event', 'apply_filter', {
      filter_type: 'undertone',
      filter_value: t
    });
    setActiveTones(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }
  function toggleTier(t) {
    if (!activeTiers.includes(t)) window.gtag?.('event', 'apply_filter', {
      filter_type: 'price_tier',
      filter_value: t
    });
    setActiveTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }
  const filtered = matches.filter(p => (activeFinishes.length === 0 || activeFinishes.includes(p.finish)) && (activeBrands.length === 0 || activeBrands.includes(p.brand)) && (activeTones.length === 0 || activeTones.includes(toneOf(p))) && (activeTiers.length === 0 || activeTiers.includes(tierOf(p))));
  const maxDist = filtered.length > 0 ? Math.max(...filtered.map(p => p.distance)) : 1;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
      padding: '12px 18px',
      background: '#fff',
      borderRadius: 14,
      border: '1px solid var(--border)',
      boxShadow: '0 2px 12px var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: selectedColor.hex,
      boxShadow: `0 3px 10px ${selectedColor.hex}80, inset 0 -2px 4px rgba(0,0,0,0.15)`,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 18,
      fontWeight: 500,
      lineHeight: 1.15
    }
  }, selectedColor.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      marginTop: 2,
      fontFamily: 'DM Sans',
      letterSpacing: '0.05em'
    }
  }, selectedColor.hex.toUpperCase(), " \xB7 Closest lip matches by \u0394E")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center'
    }
  }, matches.slice(0, 5).map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: m.hex,
      border: '2px solid #fff',
      marginLeft: i > 0 ? -10 : 0,
      boxShadow: '0 1px 4px rgba(42,26,20,0.18)',
      zIndex: 5 - i,
      position: 'relative'
    },
    title: `${m.brand} — ${m.shade}`
  })))), toneRamp && toneRamp.ramp.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12,
      padding: '9px 12px 10px',
      background: '#fff',
      borderRadius: 12,
      border: '1px solid var(--border)',
      boxShadow: '0 2px 12px var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      letterSpacing: '0.03em',
      flexShrink: 0
    }
  }, "Lighter"), toneRamp.ramp.map((step, i) => {
    const isAnchor = i === toneRamp.anchorIdx;
    const isActive = i === toneIdx;
    return /*#__PURE__*/React.createElement("button", {
      key: step.id,
      onClick: () => setToneIdx(i),
      title: isAnchor ? `${step.name} (your shade)` : step.name,
      style: {
        flex: 1,
        height: 32,
        borderRadius: 7,
        cursor: 'pointer',
        padding: 0,
        background: step.hex,
        border: isActive ? '2.5px solid var(--espresso)' : '2px solid #fff',
        outline: isAnchor && !isActive ? '1.5px dashed rgba(42,26,20,0.35)' : 'none',
        outlineOffset: -5,
        boxShadow: isActive ? '0 3px 10px rgba(42,26,20,0.28)' : '0 1px 3px rgba(42,26,20,0.12)',
        transform: isActive ? 'translateY(-2px)' : 'none',
        transition: 'all 0.15s'
      }
    });
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      letterSpacing: '0.03em',
      flexShrink: 0
    }
  }, "Deeper")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: 'DM Sans',
      color: 'var(--text-muted)',
      letterSpacing: '0.03em'
    }
  }, toneIdx === toneRamp.anchorIdx ? 'Showing matches for your exact shade' : /*#__PURE__*/React.createElement("span", null, "Matches for a ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--espresso)',
      fontWeight: 600
    }
  }, toneRamp.ramp[toneIdx]?.name.split('· ')[1] || 'variant'), " version \xB7 ", selectedColor.hex.toUpperCase())), toneIdx !== toneRamp.anchorIdx && /*#__PURE__*/React.createElement("button", {
    onClick: () => setToneIdx(toneRamp.anchorIdx),
    style: {
      fontSize: 11,
      padding: '3px 10px',
      borderRadius: 20,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      letterSpacing: '0.04em',
      flexShrink: 0,
      marginLeft: 10
    }
  }, "Reset to my shade"))), (allFinishes.length > 1 || orderedTones.length >= 1 || allBrands.length > 1 || allTiers.length > 1) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontFamily: 'DM Sans',
      marginRight: 2
    }
  }, "Filter"), allBrands.length > 1 && /*#__PURE__*/React.createElement(FilterDropdown, {
    label: "Brand",
    count: activeBrands.length,
    isOpen: openFilter === 'Brand',
    onOpen: setOpenFilter,
    onClear: () => setActiveBrands([])
  }, allBrands.map(b => {
    const active = activeBrands.includes(b);
    return /*#__PURE__*/React.createElement("button", {
      key: b,
      onClick: () => toggleBrand(b),
      style: {
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 20,
        border: `1.5px solid ${active ? 'var(--espresso-mid)' : 'var(--border)'}`,
        background: active ? 'rgba(92,61,48,0.10)' : 'transparent',
        color: active ? 'var(--espresso-mid)' : 'var(--text-muted)',
        cursor: 'pointer',
        fontFamily: 'DM Sans',
        fontWeight: active ? 500 : 400,
        letterSpacing: '0.04em',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap'
      }
    }, b, active && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 5,
        opacity: 0.6,
        fontSize: 10
      }
    }, "\u2715"));
  })), allTiers.length > 1 && /*#__PURE__*/React.createElement(FilterDropdown, {
    label: "Price",
    count: activeTiers.length,
    isOpen: openFilter === 'Price',
    onOpen: setOpenFilter,
    onClear: () => setActiveTiers([])
  }, allTiers.map(t => {
    const active = activeTiers.includes(t);
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => toggleTier(t),
      style: {
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 20,
        border: `1.5px solid ${active ? '#8a6e2e' : 'var(--border)'}`,
        background: active ? 'rgba(138,110,46,0.12)' : 'transparent',
        color: active ? '#8a6e2e' : 'var(--text-muted)',
        cursor: 'pointer',
        fontFamily: 'DM Sans',
        fontWeight: active ? 600 : 400,
        letterSpacing: '0.04em',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap'
      }
    }, t, active && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 5,
        opacity: 0.6,
        fontSize: 10
      }
    }, "\u2715"));
  })), allFinishes.length > 1 && /*#__PURE__*/React.createElement(FilterDropdown, {
    label: "Finish",
    count: activeFinishes.length,
    isOpen: openFilter === 'Finish',
    onOpen: setOpenFilter,
    onClear: () => setActiveFinishes([])
  }, allFinishes.map(f => {
    const active = activeFinishes.includes(f);
    const fc = finishColor(f);
    return /*#__PURE__*/React.createElement("button", {
      key: f,
      onClick: () => toggleFinish(f),
      style: {
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 20,
        border: `1.5px solid ${active ? fc : 'var(--border)'}`,
        background: active ? fc + '22' : 'transparent',
        color: active ? fc : 'var(--text-muted)',
        cursor: 'pointer',
        fontFamily: 'DM Sans',
        fontWeight: active ? 500 : 400,
        letterSpacing: '0.04em',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap'
      }
    }, f, active && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 5,
        opacity: 0.6,
        fontSize: 12
      }
    }, "\u2715"));
  })), orderedTones.length >= 1 && /*#__PURE__*/React.createElement(FilterDropdown, {
    label: "Undertone",
    count: activeTones.length,
    isOpen: openFilter === 'Undertone',
    onOpen: setOpenFilter,
    onClear: () => setActiveTones([])
  }, orderedTones.map(t => {
    const active = activeTones.includes(t);
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => toggleTone(t),
      style: {
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 20,
        border: `1.5px solid ${active ? 'var(--espresso-mid)' : 'var(--border)'}`,
        background: active ? 'rgba(92,61,48,0.10)' : 'transparent',
        color: active ? 'var(--espresso-mid)' : 'var(--text-muted)',
        cursor: 'pointer',
        fontFamily: 'DM Sans',
        letterSpacing: '0.04em',
        textTransform: 'capitalize',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap'
      }
    }, t);
  })), (activeFinishes.length > 0 || activeBrands.length > 0 || activeTones.length > 0 || activeTiers.length > 0) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans'
    }
  }, filtered.length, " of ", matches.length, " shown"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setActiveFinishes([]);
      setActiveBrands([]);
      setActiveTones([]);
      setActiveTiers([]);
    },
    style: {
      fontSize: 11,
      padding: '3px 10px',
      borderRadius: 20,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--blush)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      letterSpacing: '0.04em'
    }
  }, "Clear all"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      borderRadius: 16,
      border: '1px solid var(--border)',
      background: '#fff',
      boxShadow: '0 2px 12px var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--cream-dark)',
      borderBottom: '1.5px solid var(--border)'
    }
  }, [{
    h: '',
    cls: ''
  }, {
    h: 'Color',
    cls: ''
  }, {
    h: 'Brand',
    cls: ''
  }, {
    h: 'Product',
    cls: 'col-hide-narrow'
  }, {
    h: 'Shade',
    cls: ''
  }, {
    h: 'Finish',
    cls: 'col-hide-mobile'
  }, {
    h: 'ΔE',
    cls: ''
  }, {
    h: '',
    cls: ''
  }].map((c, idx) => /*#__PURE__*/React.createElement("th", {
    key: idx,
    className: c.cls,
    style: {
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: 11,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      fontWeight: 500,
      fontFamily: 'DM Sans',
      whiteSpace: 'nowrap'
    }
  }, c.h)))), /*#__PURE__*/React.createElement("tbody", null, filtered.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    style: {
      padding: '32px 16px',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontFamily: 'Cormorant Garamond',
      fontSize: 16,
      fontStyle: 'italic'
    }
  }, "No matches for the selected filters \u2014 try clearing a filter")), filtered.map((p, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      borderBottom: i < filtered.length - 1 ? '1px solid var(--cream-dark)' : 'none',
      background: 'transparent'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--cream)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 4px 14px 16px',
      width: 36
    }
  }, (() => {
    const isLiked = wishlist.some(x => x.brand === p.brand && x.shade === p.shade);
    return /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        toggleWishlist(p);
      },
      title: isLiked ? 'Remove from My Favorites' : 'Save to My Favorites',
      style: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: 20,
        color: isLiked ? 'var(--blush)' : 'var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.15s, color 0.15s'
      },
      onMouseEnter: e => {
        e.currentTarget.style.transform = 'scale(1.2)';
        if (!isLiked) e.currentTarget.style.color = 'var(--blush-light)';
      },
      onMouseLeave: e => {
        e.currentTarget.style.transform = 'scale(1)';
        if (!isLiked) e.currentTarget.style.color = 'var(--border)';
      }
    }, isLiked ? '♥' : '♡');
  })()), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(ProductThumb, {
    product: p,
    size: 40
  }), /*#__PURE__*/React.createElement(ShadeChip, {
    hex: p.hex,
    height: 40,
    width: 7
  }))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 16px',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--espresso)',
      fontFamily: 'DM Sans',
      whiteSpace: 'nowrap'
    }
  }, p.brand), /*#__PURE__*/React.createElement("td", {
    className: "col-hide-narrow",
    style: {
      padding: '14px 16px',
      fontSize: 12,
      color: 'var(--text-body)',
      fontFamily: 'DM Sans'
    }
  }, p.product), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 16px',
      fontStyle: 'italic',
      fontFamily: 'Cormorant Garamond',
      fontSize: 15,
      color: 'var(--espresso-mid)'
    }
  }, p.shade), /*#__PURE__*/React.createElement("td", {
    className: "col-hide-mobile",
    style: {
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      padding: '3px 10px',
      borderRadius: 20,
      background: finishColor(p.finish) + '18',
      color: finishColor(p.finish),
      fontWeight: 500,
      letterSpacing: '0.04em',
      fontFamily: 'DM Sans'
    }
  }, p.finish)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 4,
      borderRadius: 2,
      background: 'var(--cream-dark)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      borderRadius: 2,
      width: `${Math.max(8, 100 - p.distance / (maxDist + 1) * 100)}%`,
      background: 'var(--blush)',
      transition: 'width 0.3s'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      minWidth: 28
    }
  }, p.distance.toFixed(1)))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '14px 12px'
    }
  }, (() => {
    const isPinned = pinnedItems.some(x => x.brand === p.brand && x.shade === p.shade);
    const isFull = pinnedItems.length >= 4 && !isPinned;
    return /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        togglePin(p);
      },
      title: isPinned ? 'Remove from comparison' : isFull ? 'Max 4 items' : 'Add to comparison',
      style: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: 'none',
        background: isPinned ? 'var(--espresso)' : 'var(--cream-dark)',
        color: isPinned ? '#FAF6F1' : 'var(--text-muted)',
        cursor: isFull ? 'not-allowed' : 'pointer',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFull ? 0.35 : 1,
        transition: 'all 0.15s',
        flexShrink: 0
      }
    }, isPinned ? '✕' : '+');
  })())))))));
}

// ── Tweaks Panel ──────────────────────────────────────────────────────────────
function TweaksPanel({
  tweaks,
  setTweak,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 200,
      background: '#fff',
      borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: '0 8px 32px rgba(42,26,20,0.16)',
      padding: 24,
      width: 240,
      fontFamily: 'DM Sans',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 18,
      fontWeight: 500
    }
  }, "Tweaks"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 18,
      color: 'var(--text-muted)'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      marginBottom: 6,
      color: 'var(--text-muted)',
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "\u0394E Band"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 2,
    max: 20,
    step: 1,
    value: tweaks.maxDeltaE,
    onChange: e => setTweak('maxDeltaE', +e.target.value),
    style: {
      flex: 1,
      accentColor: 'var(--blush)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      textAlign: 'center',
      color: 'var(--espresso)',
      fontWeight: 500
    }
  }, tweaks.maxDeltaE)), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      marginBottom: 6,
      color: 'var(--text-muted)',
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "Accent Color"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, ['#C87890', '#C4A060', '#7090A0', '#A87060', '#8090C0'].map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setTweak('accentColor', c),
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: c,
      border: 'none',
      cursor: 'pointer',
      boxShadow: tweaks.accentColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : '0 1px 4px rgba(42,26,20,0.15)'
    }
  }))));
}

// ── Shareable Image (Instagram-friendly) ──────────────────────────────────────
// Draws a clean 4:5 portrait card (1080×1350) of the user's wishlist to a
// canvas, then lets them preview, download, or copy it to clipboard.
function drawShareImage(canvas, wishlist) {
  const W = 1080,
    H = 1350;
  canvas.width = W;
  canvas.height = H;
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
    const x = Math.random() * W,
      y = Math.random() * H;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();

  // Top border accent line
  ctx.strokeStyle = '#E0D0C4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 140);
  ctx.lineTo(W - 80, 140);
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
  const subtitle = `${wishlist.length} ${wishlist.length === 1 ? 'shade' : 'shades'}  ·  ${new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })}`;
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
  ctx.moveTo(80, H - 95);
  ctx.lineTo(W - 80, H - 95);
  ctx.stroke();

  // Tiny lipstick bullet icon
  const fx = W / 2 - 130,
    fy = H - 55;
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
function ShareImageModal({
  wishlist,
  onClose
}) {
  const canvasRef = React.useRef(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(true);
  React.useEffect(() => {
    let cancelled = false;
    // Make sure custom fonts are loaded before drawing
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(() => {
      if (cancelled || !canvasRef.current) return;
      drawShareImage(canvasRef.current, wishlist);
      setBusy(false);
    });
    return () => {
      cancelled = true;
    };
  }, [wishlist]);
  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-lipstick-shortlist-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Saved!');
      setTimeout(() => setStatus(null), 2200);
    }, 'image/png');
  }
  async function copyImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob || !navigator.clipboard || !window.ClipboardItem) {
        setStatus('Copy not supported — use Save');
        setTimeout(() => setStatus(null), 2500);
        return;
      }
      await navigator.clipboard.write([new window.ClipboardItem({
        'image/png': blob
      })]);
      setStatus('Image copied!');
      setTimeout(() => setStatus(null), 2200);
    } catch (e) {
      setStatus('Copy failed — try Save');
      setTimeout(() => setStatus(null), 2500);
    }
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(42,26,20,0.55)',
      zIndex: 300,
      backdropFilter: 'blur(4px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 301,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--cream)',
      borderRadius: 20,
      boxShadow: '0 24px 60px rgba(42,26,20,0.32)',
      padding: '28px 32px 24px',
      maxWidth: 520,
      width: '100%',
      maxHeight: '92vh',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      pointerEvents: 'auto',
      animation: 'fadeUp 0.25s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, "\uD83D\uDCF8"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontWeight: 500,
      fontSize: 22,
      color: 'var(--espresso)'
    }
  }, "Share your shortlist"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      marginLeft: 'auto',
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: '1px solid var(--border)',
      background: '#fff',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 14
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      lineHeight: 1.5,
      marginTop: -4
    }
  }, "A portrait card sized for Instagram (4:5). Save it and post it to your story, feed, or send it to a friend."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#2A1A14',
      borderRadius: 14,
      padding: 10,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      minHeight: 200
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    style: {
      width: '100%',
      height: 'auto',
      maxHeight: '58vh',
      objectFit: 'contain',
      borderRadius: 8,
      display: 'block',
      opacity: busy ? 0 : 1,
      transition: 'opacity 0.2s'
    }
  }), busy && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      color: '#FAF6F1',
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 16
    }
  }, "Composing your card\u2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: download,
    style: {
      flex: 1,
      padding: '14px',
      borderRadius: 12,
      border: 'none',
      background: 'var(--espresso)',
      color: 'var(--cream)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "\u2B07  Save image"), /*#__PURE__*/React.createElement("button", {
    onClick: copyImage,
    style: {
      flex: 1,
      padding: '14px',
      borderRadius: 12,
      border: '1.5px solid var(--border)',
      background: '#fff',
      color: 'var(--espresso)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "\uD83D\uDCCB  Copy image")), status && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: 'var(--blush)',
      fontFamily: 'DM Sans',
      textAlign: 'center',
      letterSpacing: '0.06em'
    }
  }, status), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      textAlign: 'center',
      marginTop: -4
    }
  }, "Tip: on mobile, long-press the saved image to share it directly to Instagram or other apps."))));
}

// ── Wishlist Panel ────────────────────────────────────────────────────────────
function WishlistPanel({
  wishlist,
  onClose,
  onRemove,
  onClear
}) {
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
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }
  function copyToClipboard() {
    window.gtag?.('event', 'share_wishlist', {
      method: 'copy_text'
    });
    const text = formatAsText();
    const done = () => {
      setCopied('text');
      setTimeout(() => setCopied(null), 2000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        if (copyTextFallback(text)) done();
      });
    } else {
      if (copyTextFallback(text)) done();
    }
  }
  function downloadTxt() {
    window.gtag?.('event', 'share_wishlist', {
      method: 'download_txt'
    });
    const blob = new Blob([formatAsText()], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-lipstick-list-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopied('download');
    setTimeout(() => setCopied(null), 2000);
  }
  function copyShareLink() {
    window.gtag?.('event', 'share_wishlist', {
      method: 'copy_link'
    });
    const slugs = wishlist.map(p => `${p.brand}|${p.shade}`).join(',');
    const url = `${window.location.origin}${window.location.pathname}?list=${encodeURIComponent(slugs)}`;
    const done = () => {
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done).catch(() => {
        if (copyTextFallback(url)) done();
      });
    } else {
      if (copyTextFallback(url)) done();
    }
  }
  const exportActions = [{
    id: 'text',
    label: 'Copy as text',
    icon: '📋',
    onClick: copyToClipboard,
    done: copied === 'text' ? 'Copied!' : null
  }, {
    id: 'download',
    label: 'Download .txt',
    icon: '⬇',
    onClick: downloadTxt,
    done: copied === 'download' ? 'Downloaded!' : null
  }, {
    id: 'link',
    label: 'Copy link',
    icon: '🔗',
    onClick: copyShareLink,
    done: copied === 'link' ? 'Copied!' : null
  }, {
    id: 'image',
    label: 'Share as image',
    icon: '📸',
    onClick: () => {
      window.gtag?.('event', 'share_wishlist', {
        method: 'share_image'
      });
      setShowShareImage(true);
    },
    done: null
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(42,26,20,0.35)',
      zIndex: 200,
      backdropFilter: 'blur(2px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 'min(480px, 100%)',
      background: 'var(--cream)',
      zIndex: 201,
      boxShadow: '-8px 0 32px rgba(42,26,20,0.18)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.3s ease-out'
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 32px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blush)',
      fontSize: 22
    }
  }, "\u2665"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontWeight: 400,
      fontSize: 26,
      color: 'var(--espresso)'
    }
  }, "My Favorites"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.06em'
    }
  }, wishlist.length, " ", wishlist.length === 1 ? 'shade' : 'shades', " saved"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      marginLeft: 'auto',
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: '1px solid var(--border)',
      background: '#fff',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 14
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 32px'
    }
  }, wishlist.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '60px 20px',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      color: 'var(--border)',
      marginBottom: 16
    }
  }, "\u2661"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 18,
      fontStyle: 'italic',
      lineHeight: 1.5
    }
  }, "Tap the heart on any product to save it here"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      marginTop: 12,
      color: 'var(--text-muted)'
    }
  }, "Your list stays here on your device \u2014 even after you close the page.")) : /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, wishlist.map((p, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: '#fff',
      borderRadius: 14,
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(ProductThumb, {
    product: p,
    size: 60
  }), /*#__PURE__*/React.createElement(ShadeChip, {
    hex: p.hex,
    height: 60,
    width: 10
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--espresso)',
      fontFamily: 'DM Sans'
    }
  }, p.brand), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 15,
      fontStyle: 'italic',
      color: 'var(--espresso-mid)',
      lineHeight: 1.2,
      marginTop: 2
    }
  }, p.shade), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      marginTop: 3,
      fontFamily: 'DM Sans'
    }
  }, p.product, " \xB7 ", p.finish)), /*#__PURE__*/React.createElement("button", {
    onClick: () => onRemove(p),
    title: "Remove",
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--blush)',
      fontSize: 18,
      flexShrink: 0
    }
  }, "\u2665"))))), wishlist.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border)',
      padding: '20px 32px 24px',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: 12,
      fontFamily: 'DM Sans'
    }
  }, "Take it with you"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, exportActions.map(a => /*#__PURE__*/React.createElement("button", {
    key: a.id,
    onClick: a.onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 12,
      border: '1.5px solid var(--border)',
      background: 'var(--cream)',
      color: 'var(--espresso)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      fontSize: 13,
      fontWeight: 500,
      textAlign: 'left',
      transition: 'all 0.15s'
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = 'var(--blush)';
      e.currentTarget.style.color = 'var(--blush)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.color = 'var(--espresso)';
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, a.icon), /*#__PURE__*/React.createElement("span", null, a.done || a.label)))), /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    style: {
      marginTop: 12,
      width: '100%',
      padding: '10px',
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontSize: 11,
      fontFamily: 'DM Sans',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      borderRadius: 10
    }
  }, "Clear list"))), showShareImage && /*#__PURE__*/React.createElement(ShareImageModal, {
    wishlist: wishlist,
    onClose: () => setShowShareImage(false)
  }));
}

// ── Comparison Tray ────────────────────────────────────────────────────────────
function ComparisonTray({
  pinnedItems,
  onRemove,
  onClear
}) {
  const [expanded, setExpanded] = useState(false);
  const isVisible = pinnedItems.length > 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.35s cubic-bezier(0.34,1.26,0.64,1)',
      pointerEvents: isVisible ? 'all' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 0 0',
      background: 'linear-gradient(to bottom, transparent, rgba(42,26,20,0.04))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      borderRadius: 2,
      background: 'var(--border)',
      cursor: 'pointer'
    },
    onClick: () => setExpanded(e => !e)
  })), /*#__PURE__*/React.createElement("div", {
    className: "compare-tray-body",
    style: {
      background: '#fff',
      borderTop: '1.5px solid var(--border)',
      boxShadow: '0 -4px 24px rgba(42,26,20,0.12)',
      padding: expanded ? '24px 40px 32px' : '16px 40px 20px',
      transition: 'padding 0.25s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: expanded ? 24 : 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 18,
      fontWeight: 500,
      color: 'var(--espresso)'
    }
  }, "Comparing ", pinnedItems.length, " shade", pinnedItems.length !== 1 ? 's' : ''), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.05em'
    }
  }, "\xB7 up to 4 \xB7 click a row to pin"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpanded(e => !e),
    style: {
      fontSize: 11,
      padding: '4px 12px',
      borderRadius: 20,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontFamily: 'DM Sans'
    }
  }, expanded ? 'Collapse' : 'Expand'), /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    style: {
      fontSize: 11,
      padding: '4px 12px',
      borderRadius: 20,
      border: '1px solid var(--blush)',
      background: 'transparent',
      color: 'var(--blush)',
      cursor: 'pointer',
      fontFamily: 'DM Sans'
    }
  }, "Clear all"))), (() => {
    const sortedPins = [...pinnedItems].sort((a, b) => a.distance - b.distance);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: expanded ? 24 : 16,
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }
    }, sortedPins.map((p, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: expanded ? 12 : 8,
        cursor: 'pointer',
        position: 'relative',
        animation: 'fadeUp 0.2s ease'
      },
      onClick: () => onRemove(p)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -6,
        right: -6,
        zIndex: 2,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: 'var(--espresso)',
        color: '#FAF6F1',
        fontSize: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 0.15s'
      },
      className: "remove-btn"
    }, "\xD7"), /*#__PURE__*/React.createElement("div", {
      style: {
        width: expanded ? 80 : 52,
        height: expanded ? 80 : 52,
        borderRadius: '50%',
        background: p.hex,
        boxShadow: `0 4px 16px ${p.hex}80, inset 0 -2px 4px rgba(0,0,0,0.12)`,
        border: '2.5px solid #fff',
        outline: '1.5px solid var(--border)',
        transition: 'width 0.25s, height 0.25s',
        flexShrink: 0
      }
    }), expanded ? /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        maxWidth: 100
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Cormorant Garamond',
        fontSize: 15,
        fontStyle: 'italic',
        color: 'var(--espresso)',
        lineHeight: 1.3,
        marginBottom: 4
      }
    }, p.shade), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--text-muted)',
        fontFamily: 'DM Sans',
        marginBottom: 4
      }
    }, p.brand), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 20,
        background: finishColor(p.finish) + '18',
        color: finishColor(p.finish),
        fontWeight: 500,
        fontFamily: 'DM Sans'
      }
    }, p.finish), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 4,
        fontFamily: 'DM Sans'
      }
    }, "\u0394E ", p.distance.toFixed(1))) : /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        maxWidth: 72
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--text-muted)',
        fontFamily: 'DM Sans',
        lineHeight: 1.3
      }
    }, p.shade)))), Array.from({
      length: Math.max(0, 4 - pinnedItems.length)
    }).map((_, i) => /*#__PURE__*/React.createElement("div", {
      key: `empty-${i}`,
      style: {
        width: expanded ? 80 : 52,
        height: expanded ? 80 : 52,
        borderRadius: '50%',
        border: '2px dashed var(--border)',
        background: 'transparent',
        flexShrink: 0,
        transition: 'width 0.25s, height 0.25s',
        opacity: 0.4
      }
    })));
  })()), /*#__PURE__*/React.createElement("style", null, `
        div:hover > .remove-btn { opacity: 1 !important; }
      `));
}

// ── List Picker ─────────────────────────────────────────────────────────
// Grid of saved-shade swatches; clicking one uses its color as the seed.
function ListPicker({
  wishlist,
  selectedKey,
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 440,
      padding: '4px 0 8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      textAlign: 'center',
      marginBottom: 14
    }
  }, "Pick a saved shade to find similar ones"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
      gap: 14,
      padding: '4px 4px 16px'
    }
  }, wishlist.map((p, i) => {
    const key = `${p.brand}|${p.shade}`;
    const isSel = key === selectedKey;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => onPick(p),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        borderRadius: 12,
        transition: 'background 0.15s'
      },
      onMouseEnter: e => {
        if (!isSel) e.currentTarget.style.background = 'rgba(200,120,144,0.06)';
      },
      onMouseLeave: e => {
        if (!isSel) e.currentTarget.style.background = 'transparent';
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: p.hex,
        boxShadow: isSel ? `0 0 0 2px #fff, 0 0 0 4px var(--blush), 0 4px 14px ${p.hex}88` : `0 3px 12px ${p.hex}66, inset 0 -2px 4px rgba(0,0,0,0.12)`,
        border: '1.5px solid rgba(42,26,20,0.06)',
        transition: 'all 0.15s'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        maxWidth: '100%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 12,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, p.brand), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Cormorant Garamond',
        fontSize: 15,
        fontStyle: 'italic',
        color: isSel ? 'var(--blush)' : 'var(--espresso)',
        lineHeight: 1.2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }
    }, p.shade)));
  })));
}

// ── Photo Picker ───────────────────────────────────────────────────────────
// Upload an image, click anywhere on it to sample a color (averaged over an
// adjustable radius). The sampled hex is passed up via onColor.
function PhotoPicker({
  sampledHex,
  onColor
}) {
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
    reader.onload = e => {
      setSrc(e.target.result);
      setPoint(null);
      onColor(null);
    };
    reader.readAsDataURL(file);
  }
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }
  function sampleAt(px, py) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {
      colorSpace: 'display-p3',
      willReadFrequently: true
    });
    const r = Math.max(1, Math.round(radius));
    const x0 = Math.max(0, Math.floor(px - r));
    const y0 = Math.max(0, Math.floor(py - r));
    const w = Math.min(canvas.width - x0, r * 2);
    const h = Math.min(canvas.height - y0, r * 2);
    if (w <= 0 || h <= 0) return;
    const data = ctx.getImageData(x0, y0, w, h).data;
    let R = 0,
      G = 0,
      B = 0,
      n = 0;
    for (let i = 0; i < data.length; i += 4) {
      R += data[i];
      G += data[i + 1];
      B += data[i + 2];
      n++;
    }
    R = Math.round(R / n);
    G = Math.round(G / n);
    B = Math.round(B / n);
    const hex = '#' + [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('');
    onColor(hex);
  }
  function onImgClick(e) {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top) * sy;
    setPoint({
      x: px,
      y: py,
      displayX: e.clientX - rect.left,
      displayY: e.clientY - rect.top
    });
    sampleAt(px, py);
  }

  // Resample when radius changes
  React.useEffect(() => {
    if (point) sampleAt(point.x, point.y);
    // eslint-disable-next-line
  }, [radius]);

  // Draw uploaded image to canvas (offscreen) for pixel sampling
  function onImgLoad() {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    // Cap canvas size for performance
    const MAX = 1200;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d', {
      colorSpace: 'display-p3'
    }).drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  if (!src) {
    return /*#__PURE__*/React.createElement("div", {
      onDragOver: e => {
        e.preventDefault();
        setDragOver(true);
      },
      onDragLeave: () => setDragOver(false),
      onDrop: onDrop,
      onClick: () => fileInputRef.current?.click(),
      style: {
        width: '100%',
        maxWidth: 380,
        aspectRatio: '1/1',
        border: `2px dashed ${dragOver ? 'var(--blush)' : 'var(--border)'}`,
        borderRadius: 16,
        background: dragOver ? 'rgba(200,120,144,0.06)' : '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        gap: 14,
        padding: 24,
        textAlign: 'center',
        transition: 'all 0.15s ease'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 36,
        lineHeight: 1,
        color: 'var(--blush)'
      }
    }, "\u2913"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Cormorant Garamond',
        fontSize: 22,
        fontStyle: 'italic',
        color: 'var(--espresso)'
      }
    }, "Drop a photo or screenshot here"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 12,
        color: 'var(--text-muted)',
        letterSpacing: '0.04em'
      }
    }, "or click to upload \xB7 JPG, PNG, HEIC"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 12,
        color: 'var(--text-muted)',
        maxWidth: 260,
        marginTop: 8,
        lineHeight: 1.5
      }
    }, "Tap anywhere on the photo to pick a shade."), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 12,
        color: 'var(--text-muted)',
        maxWidth: 260,
        marginTop: 14,
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontStyle: 'normal'
      }
    }, "\uD83D\uDD12"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontStyle: 'italic'
      }
    }, "Your photo stays on your device \u2014 we never upload or store it.")), /*#__PURE__*/React.createElement("input", {
      ref: fileInputRef,
      type: "file",
      accept: "image/*",
      style: {
        display: 'none'
      },
      onChange: e => handleFile(e.target.files?.[0])
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 380,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    style: {
      position: 'relative',
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'var(--cream-dark)',
      width: '100%',
      aspectRatio: '1/1'
    }
  }, /*#__PURE__*/React.createElement("img", {
    ref: imgRef,
    src: src,
    onLoad: onImgLoad,
    onClick: onImgClick,
    alt: "Uploaded",
    style: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      cursor: 'crosshair'
    }
  }), /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    style: {
      display: 'none'
    }
  }), point && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: point.displayX,
      top: point.displayY,
      width: Math.max(12, radius * 1.6),
      height: Math.max(12, radius * 1.6),
      transform: 'translate(-50%, -50%)',
      border: '2px solid #fff',
      borderRadius: '50%',
      boxShadow: '0 0 0 1.5px rgba(42,26,20,0.6), 0 0 12px rgba(0,0,0,0.4)',
      pointerEvents: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, sampledHex && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: sampledHex,
      border: '2px solid #fff',
      boxShadow: `0 2px 8px ${sampledHex}66, 0 0 0 1px var(--border)`,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 16,
      fontStyle: 'italic',
      color: 'var(--espresso)'
    }
  }, "Sampled"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.06em'
    }
  }, sampledHex.toUpperCase()))), !sampledHex && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 15,
      color: 'var(--text-muted)'
    }
  }, "Click anywhere on the photo to sample a color.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      maxWidth: 240,
      alignSelf: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 12,
      color: 'var(--text-muted)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    }
  }, "Sample"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 2,
    max: 30,
    value: radius,
    onChange: e => setRadius(parseInt(e.target.value)),
    className: "dainty-range",
    style: {
      flex: 1,
      accentColor: 'var(--blush)',
      height: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 12,
      color: 'var(--text-muted)',
      minWidth: 28,
      textAlign: 'right'
    }
  }, radius, "px")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSrc(null);
      setPoint(null);
      onColor(null);
    },
    style: {
      flex: 1,
      padding: '8px 12px',
      fontFamily: 'DM Sans',
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 500,
      background: 'transparent',
      color: 'var(--text-muted)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      cursor: 'pointer'
    }
  }, "\u2190 New photo")));
}

// ── Hex Picker ──────────────────────────────────────────────────────────
// Pick or paste a hex code directly. Useful for matching a specific color
// (an outfit, a paint chip, a screen color) when the wheel doesn't cover it.
function HexPicker({
  sampledHex,
  onColor
}) {
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
  const QUICK = [{
    hex: '#C04E62',
    label: 'Classic rose'
  }, {
    hex: '#8B1A2E',
    label: 'Bordeaux'
  }, {
    hex: '#DC3092',
    label: 'Magenta'
  }, {
    hex: '#E85840',
    label: 'Coral'
  }, {
    hex: '#7A3E28',
    label: 'Cocoa'
  }, {
    hex: '#4A1820',
    label: 'Wine'
  }, {
    hex: '#454048',
    label: 'Charcoal'
  }, {
    hex: '#2D6850',
    label: 'Teal'
  }];
  const valid = !!normalize(draft);
  const previewHex = valid ? normalize(draft) : '#FAF6F1';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 440,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: '8px 0 4px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 200,
      height: 200,
      borderRadius: '50%',
      background: previewHex,
      boxShadow: valid ? `0 6px 28px ${previewHex}80, inset 0 -4px 12px rgba(0,0,0,0.10)` : '0 4px 16px rgba(42,26,20,0.10)',
      border: '4px solid #fff',
      outline: '1.5px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }
  }, !valid && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      color: 'var(--text-muted)',
      fontSize: 18,
      pointerEvents: 'none'
    }
  }, "Invalid hex"), /*#__PURE__*/React.createElement("label", {
    htmlFor: "hex-color-picker",
    style: {
      position: 'absolute',
      inset: 0,
      cursor: 'pointer',
      borderRadius: '50%'
    }
  }), /*#__PURE__*/React.createElement("input", {
    ref: colorInputRef,
    id: "hex-color-picker",
    type: "color",
    value: valid ? previewHex : '#C04E62',
    onChange: e => handlePickerChange(e.target.value),
    style: {
      position: 'absolute',
      width: 0,
      height: 0,
      opacity: 0,
      border: 'none',
      padding: 0
    },
    "aria-label": "Pick a color"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: '#fff',
      borderRadius: 10,
      border: `1.5px solid ${valid ? 'var(--border)' : 'var(--blush)'}`,
      padding: '6px 10px',
      boxShadow: '0 2px 8px var(--shadow)',
      minWidth: 180
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      fontSize: 14,
      fontWeight: 500
    }
  }, "#"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: draft.replace(/^#/, '').toUpperCase(),
    onChange: e => handleTextChange(e.target.value),
    placeholder: "C04E62",
    maxLength: 7,
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'DM Sans',
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: '0.1em',
      color: 'var(--espresso)',
      textTransform: 'uppercase',
      minWidth: 0
    }
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "hex-color-picker",
    title: "Open color picker",
    style: {
      border: 'none',
      background: 'var(--cream-dark)',
      width: 26,
      height: 26,
      borderRadius: 6,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--espresso-mid)',
      fontSize: 13
    }
  }, "\uD83C\uDFA8")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 15,
      color: 'var(--text-muted)',
      textAlign: 'center',
      maxWidth: 300,
      lineHeight: 1.5
    }
  }, "Pick any color you love or paste a hex, and we'll find the lipsticks closest to it."));
}

// ── Vibe Panel ──────────────────────────────────────────────────────────
function VibePanel({
  vibe,
  setVibe,
  onClose
}) {
  const toggle = (key, value) => {
    setVibe(v => {
      const cur = v[key] || [];
      const next = cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value];
      return {
        ...v,
        [key]: next
      };
    });
  };
  const clearAll = () => setVibe({
    finishes: [],
    temps: [],
    depths: []
  });
  const FINISHES = ['Matte', 'Satin', 'Sheer', 'Gloss', 'Cream'];
  const TEMPS = [{
    id: 'cool',
    label: 'Cool'
  }, {
    id: 'neutral',
    label: 'Neutral'
  }, {
    id: 'warm',
    label: 'Warm'
  }];
  const DEPTHS = [{
    id: 'light',
    label: 'Light'
  }, {
    id: 'medium',
    label: 'Medium'
  }, {
    id: 'deep',
    label: 'Deep'
  }];
  const active = (vibe.finishes?.length || 0) + (vibe.temps?.length || 0) + (vibe.depths?.length || 0);

  // Reusable chip
  const Chip = ({
    on,
    label,
    sub,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      flex: '1 1 0',
      minWidth: 0,
      padding: '12px 14px',
      borderRadius: 14,
      border: `1.5px solid ${on ? 'var(--blush)' : 'var(--border)'}`,
      background: on ? 'rgba(200,120,144,0.10)' : '#fff',
      color: on ? 'var(--blush)' : 'var(--espresso)',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'DM Sans',
      transition: 'all 0.15s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.04em',
      textTransform: 'uppercase'
    }
  }, label), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      marginTop: 3,
      letterSpacing: '0.02em'
    }
  }, sub));
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(42,26,20,0.32)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(2px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--cream)',
      borderRadius: 18,
      width: 'min(560px, 92vw)',
      maxHeight: '88vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(42,26,20,0.3)',
      border: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 32px 16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blush)',
      fontSize: 20
    }
  }, "\u2726"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontWeight: 400,
      fontSize: 24,
      color: 'var(--espresso)'
    }
  }, "My Lipstick Vibe"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      marginLeft: 'auto',
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: '1px solid var(--border)',
      background: '#fff',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 14
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 32px 8px',
      fontSize: 12,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      letterSpacing: '0.02em',
      lineHeight: 1.5
    }
  }, "Tell us what you love \u2014 we'll quietly filter every search to shades that fit. Pick any combination, or skip a row for \"anything goes.\""), /*#__PURE__*/React.createElement(Section, {
    title: "Finish"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, FINISHES.map(f => /*#__PURE__*/React.createElement(Chip, {
    key: f,
    on: (vibe.finishes || []).includes(f),
    label: f,
    onClick: () => toggle('finishes', f)
  })))), /*#__PURE__*/React.createElement(Section, {
    title: "Undertone"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, TEMPS.map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t.id,
    on: (vibe.temps || []).includes(t.id),
    label: t.label,
    sub: t.sub,
    onClick: () => toggle('temps', t.id)
  })))), /*#__PURE__*/React.createElement(Section, {
    title: "Depth"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, DEPTHS.map(d => /*#__PURE__*/React.createElement(Chip, {
    key: d.id,
    on: (vibe.depths || []).includes(d.id),
    label: d.label,
    sub: d.sub,
    onClick: () => toggle('depths', d.id)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 32px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      borderTop: '1px solid var(--border)',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      letterSpacing: '0.04em'
    }
  }, active === 0 ? 'No filters — showing all shades' : `${active} filter${active === 1 ? '' : 's'} active`), /*#__PURE__*/React.createElement("a", {
    href: "color-guide.html#undertone",
    style: {
      fontSize: 11,
      color: 'var(--blush)',
      fontFamily: 'DM Sans',
      letterSpacing: '0.04em',
      textDecoration: 'none',
      borderBottom: '1px solid var(--blush)',
      paddingBottom: 1
    }
  }, "What do these mean? \u2192"), /*#__PURE__*/React.createElement("button", {
    onClick: clearAll,
    disabled: active === 0,
    style: {
      marginLeft: 'auto',
      padding: '8px 16px',
      fontFamily: 'DM Sans',
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 500,
      background: 'transparent',
      color: active === 0 ? 'var(--border)' : 'var(--blush)',
      border: `1px solid ${active === 0 ? 'var(--border)' : 'var(--blush)'}`,
      borderRadius: 20,
      cursor: active === 0 ? 'default' : 'pointer'
    }
  }, "Clear my vibe"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      padding: '8px 20px',
      fontFamily: 'DM Sans',
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 500,
      background: 'var(--espresso)',
      color: 'var(--cream)',
      border: '1px solid var(--espresso)',
      borderRadius: 20,
      cursor: 'pointer'
    }
  }, "Done"))));
}
function Section({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 10,
      color: 'var(--text-muted)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: 10
    }
  }, title), children);
}

// ── Dupe Finder ──────────────────────────────────────────────────────────────
function DupeFinder({
  product,
  onSelect,
  onUsePhoto
}) {
  const [brand, setBrand] = useState(null);
  const [brandQuery, setBrandQuery] = useState('');
  const [shadeQuery, setShadeQuery] = useState('');
  const brands = React.useMemo(() => [...new Set(REAL_PRODUCTS.map(p => p.brand))].sort((a, b) => a.localeCompare(b)), []);
  const brandCounts = React.useMemo(() => {
    const m = {};
    for (const p of REAL_PRODUCTS) m[p.brand] = (m[p.brand] || 0) + 1;
    return m;
  }, []);
  const brandMatches = React.useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return [];
    const starts = [],
      incl = [];
    for (const b of brands) {
      const lb = b.toLowerCase();
      if (lb.startsWith(q)) starts.push(b);else if (lb.includes(q)) incl.push(b);
    }
    return [...starts, ...incl].slice(0, 12);
  }, [brandQuery, brands]);
  const shadeMatches = React.useMemo(() => {
    if (!brand) return [];
    const q = shadeQuery.trim().toLowerCase();
    if (!q) return [];
    const list = REAL_PRODUCTS.filter(p => p.brand === brand && (p.shade.toLowerCase().includes(q) || (p.product || '').toLowerCase().includes(q)));
    return list.sort((a, b) => a.shade.localeCompare(b.shade)).slice(0, 80);
  }, [brand, shadeQuery]);
  function pickBrand(b) {
    window.gtag?.('event', 'dupe_brand_select', {
      brand: b
    });
    setBrand(b);
    setBrandQuery('');
    setShadeQuery('');
    onSelect(null);
  }
  function changeBrand() {
    setBrand(null);
    setBrandQuery('');
    setShadeQuery('');
    onSelect(null);
  }
  function pickShade(p) {
    window.gtag?.('event', 'dupe_shade_select', {
      brand: p.brand,
      shade: p.shade,
      hex: p.hex
    });
    onSelect(p);
  }

  // Fire no-results events after the user pauses typing (600ms debounce)
  React.useEffect(() => {
    if (!brandQuery.trim() || brandMatches.length > 0) return;
    const t = setTimeout(() => {
      window.gtag?.('event', 'dupe_brand_no_results', {
        query: brandQuery.trim().toLowerCase()
      });
    }, 600);
    return () => clearTimeout(t);
  }, [brandQuery, brandMatches.length]);
  React.useEffect(() => {
    if (!shadeQuery.trim() || shadeMatches.length > 0) return;
    const t = setTimeout(() => {
      window.gtag?.('event', 'dupe_shade_no_results', {
        brand,
        query: shadeQuery.trim().toLowerCase()
      });
    }, 600);
    return () => clearTimeout(t);
  }, [shadeQuery, shadeMatches.length, brand]);
  const stepNum = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'var(--espresso)',
    color: 'var(--cream)',
    fontFamily: 'DM Sans',
    fontSize: 11,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };
  const stepLabel = {
    fontFamily: 'DM Sans',
    fontSize: 10,
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase'
  };
  const inputWrap = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#fff',
    borderRadius: 14,
    border: '1.5px solid var(--border)',
    padding: '11px 14px',
    boxShadow: '0 2px 8px var(--shadow)'
  };
  const inputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'DM Sans',
    fontSize: 15,
    color: 'var(--espresso)',
    minWidth: 0
  };
  const clearBtn = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontSize: 16,
    lineHeight: 1,
    padding: '0 2px'
  };
  const suggestBox = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    maxHeight: 260,
    overflowY: 'auto',
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 6,
    boxShadow: '0 4px 16px var(--shadow)'
  };
  const chip = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 8px 7px 14px',
    background: '#fff',
    borderRadius: 40,
    border: '1px solid var(--border)',
    boxShadow: '0 2px 8px var(--shadow)'
  };
  const chipX = {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--cream-dark)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };
  const emptyNote = {
    fontFamily: 'Cormorant Garamond',
    fontStyle: 'italic',
    fontSize: 14,
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '8px 0'
  };
  const photoFallbackBtn = {
    marginTop: 6,
    fontFamily: 'DM Sans',
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--blush)',
    background: 'transparent',
    border: '1px solid var(--blush)',
    borderRadius: 20,
    padding: '6px 14px',
    cursor: 'pointer'
  };
  const hov = () => ({
    onMouseEnter: e => e.currentTarget.style.background = 'var(--cream)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 440,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: '4px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 19,
      color: 'var(--espresso-mid)',
      lineHeight: 1.4
    }
  }, "Find your lipstick's twin"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.04em',
      marginTop: 4
    }
  }, "Search the brand, then the shade name"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      window.gtag?.('event', 'dupe_photo_fallback', {
        step: 'header'
      });
      onUsePhoto();
    },
    style: {
      marginTop: 8,
      fontFamily: 'DM Sans',
      fontSize: 10.5,
      letterSpacing: '0.05em',
      color: 'var(--blush)',
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid var(--blush)',
      paddingBottom: 1,
      cursor: 'pointer'
    }
  }, "Can't find your lipstick? Match it from a photo \u2192")), !brand ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: stepNum
  }, "1"), /*#__PURE__*/React.createElement("span", {
    style: stepLabel
  }, "Brand")), /*#__PURE__*/React.createElement("div", {
    style: inputWrap
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontSize: 22,
      lineHeight: 1
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: brandQuery,
    onChange: e => setBrandQuery(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter' && brandMatches[0]) pickBrand(brandMatches[0]);
    },
    placeholder: "MAC, Charlotte Tilbury\u2026",
    style: inputStyle
  }), brandQuery && /*#__PURE__*/React.createElement("button", {
    onClick: () => setBrandQuery(''),
    style: clearBtn
  }, "\xD7")), brandQuery && brandMatches.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: emptyNote
  }, "No brands match \"", brandQuery, "\"."), brandMatches.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: suggestBox
  }, brandMatches.map(b => /*#__PURE__*/React.createElement("button", _extends({
    key: b,
    onClick: () => pickBrand(b)
  }, hov(), {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      padding: '9px 12px',
      borderRadius: 9,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.12s'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--espresso)'
    }
  }, b), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 11,
      color: 'var(--text-muted)',
      marginLeft: 'auto',
      flexShrink: 0
    }
  }, brandCounts[b], " shade", brandCounts[b] !== 1 ? 's' : '')))), !brandQuery && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--text-muted)',
      textAlign: 'center',
      lineHeight: 1.5,
      marginTop: 2
    }
  }, "Start typing a brand name \u2014 matches appear as you go.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: stepNum
  }, "1"), /*#__PURE__*/React.createElement("div", {
    style: chip
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--espresso)'
    }
  }, brand), /*#__PURE__*/React.createElement("button", {
    onClick: changeBrand,
    title: "Change brand",
    style: chipX
  }, "\xD7"))), !product ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: stepNum
  }, "2"), /*#__PURE__*/React.createElement("span", {
    style: stepLabel
  }, "Shade")), /*#__PURE__*/React.createElement("div", {
    style: inputWrap
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontSize: 22,
      lineHeight: 1
    }
  }, "\u2315"), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: shadeQuery,
    onChange: e => setShadeQuery(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter' && shadeMatches[0]) pickShade(shadeMatches[0]);
    },
    placeholder: "Search a shade or product\u2026",
    style: inputStyle
  }), shadeQuery && /*#__PURE__*/React.createElement("button", {
    onClick: () => setShadeQuery(''),
    style: clearBtn
  }, "\xD7")), !shadeQuery.trim() ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 13,
      color: 'var(--text-muted)',
      textAlign: 'center',
      lineHeight: 1.5,
      marginTop: 2
    }
  }, "Start typing the shade name to see matches.") : shadeMatches.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '8px 0'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: emptyNote
  }, "No shades match \"", shadeQuery, "\"."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      window.gtag?.('event', 'dupe_photo_fallback', {
        step: 'shade_no_results',
        brand,
        query: shadeQuery.trim().toLowerCase()
      });
      onUsePhoto();
    },
    style: photoFallbackBtn
  }, "Can't find it? Match from a photo \u2192")) : /*#__PURE__*/React.createElement("div", {
    style: {
      ...suggestBox,
      maxHeight: 308
    }
  }, shadeMatches.map((p, i) => /*#__PURE__*/React.createElement("button", _extends({
    key: i,
    onClick: () => pickShade(p)
  }, hov(), {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      width: '100%',
      padding: '8px 10px',
      borderRadius: 9,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      transition: 'background 0.12s'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: p.hex,
      flexShrink: 0,
      boxShadow: `0 1px 4px ${p.hex}66`,
      border: '1px solid rgba(42,26,20,0.08)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 15,
      color: 'var(--espresso)',
      lineHeight: 1.2,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, p.shade), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 10,
      color: 'var(--text-muted)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, p.product, " \xB7 ", p.finish)))))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: stepNum
  }, "2"), /*#__PURE__*/React.createElement("span", {
    style: stepLabel
  }, "Matching this shade")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
      background: '#fff',
      borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: '0 2px 12px var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement(ProductThumb, {
    product: product,
    size: 56
  }), /*#__PURE__*/React.createElement(ShadeChip, {
    hex: product.hex,
    height: 56,
    width: 9
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--espresso)'
    }
  }, product.brand), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 18,
      color: 'var(--espresso-mid)',
      lineHeight: 1.2
    }
  }, product.shade), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 10,
      color: 'var(--text-muted)',
      marginTop: 2,
      letterSpacing: '0.04em'
    }
  }, product.finish, " \xB7 ", product.hex.toUpperCase()))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onSelect(null),
    style: {
      alignSelf: 'flex-start',
      fontSize: 11,
      fontFamily: 'DM Sans',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--blush)',
      background: 'transparent',
      border: '1px solid var(--blush)',
      borderRadius: 20,
      padding: '6px 14px',
      cursor: 'pointer'
    }
  }, "\u2190 Pick another shade"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--text-muted)',
      textAlign: 'center',
      marginTop: 2
    }
  }, "Closest dupes are ranked on the right \u2192"))));
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
  const [mode, setMode] = useState('wheel'); // 'wheel' | 'photo' | 'hex' | 'dupe' | 'list'
  const [photoHex, setPhotoHex] = useState(null);
  const [hexHex, setHexHex] = useState(null);
  const [dupeProduct, setDupeProduct] = useState(null);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lipstick-wishlist') || '[]');
    } catch {
      return [];
    }
  });
  const [showWishlist, setShowWishlist] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);

  // Persist wishlist
  useEffect(() => {
    localStorage.setItem('lipstick-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);
  function toggleWishlist(product) {
    setWishlist(prev => {
      const key = p => `${p.brand}|${p.shade}`;
      const exists = prev.some(p => key(p) === key(product));
      if (exists) {
        window.gtag?.('event', 'remove_from_wishlist', {
          brand: product.brand,
          shade: product.shade
        });
        return prev.filter(p => key(p) !== key(product));
      }
      window.gtag?.('event', 'add_to_wishlist', {
        brand: product.brand,
        shade: product.shade
      });
      return [...prev, {
        brand: product.brand,
        product: product.product,
        shade: product.shade,
        finish: product.finish,
        hex: product.hex
      }];
    });
  }
  const [tweaks, setTweaksState] = useState(/*EDITMODE-BEGIN*/{
    "maxDeltaE": 3,
    "accentColor": "#C87890"
  } /*EDITMODE-END*/);
  function setTweak(key, val) {
    const next = {
      ...tweaks,
      [key]: val
    };
    setTweaksState(next);
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits: next
    }, '*');
  }
  useEffect(() => {
    window.addEventListener('message', e => {
      if (e.data?.type === '__activate_edit_mode') setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    });
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
  }, []);

  // Push photo-sampled color into selection so the table/filters/wishlist all just work
  React.useEffect(() => {
    if (mode !== 'photo') return;
    if (photoHex) {
      setSelectedColor({
        id: '__photo__',
        name: 'Upload photo',
        hex: photoHex
      });
      window.gtag?.('event', 'select_color', {
        method: 'photo',
        hex: photoHex
      });
      setZoomAnchor(null);
    } else {
      setSelectedColor(null);
    }
  }, [photoHex, mode]);

  // Same plumbing for the hex-picker mode
  React.useEffect(() => {
    if (mode !== 'hex') return;
    if (hexHex) {
      setSelectedColor({
        id: '__hex__',
        name: 'From hex',
        hex: hexHex
      });
      window.gtag?.('event', 'select_color', {
        method: 'hex',
        hex: hexHex
      });
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
        sourceKey: `${dupeProduct.brand}|${dupeProduct.shade}`
      });
      window.gtag?.('event', 'select_color', {
        method: 'dupe',
        hex: dupeProduct.hex,
        brand: dupeProduct.brand,
        shade: dupeProduct.shade
      });
      setZoomAnchor(null);
    } else {
      setSelectedColor(null);
    }
  }, [dupeProduct, mode]);
  const colors = LIPSTICK_DATA;

  // ── Vibe profile (persistent shopper preferences) ───────────────────────
  const [vibe, setVibe] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lipstick-vibe') || 'null') || {
        finishes: [],
        temps: [],
        depths: []
      };
    } catch {
      return {
        finishes: [],
        temps: [],
        depths: []
      };
    }
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
  const toneRamp = React.useMemo(() => selectedColor && mode !== 'wheel' ? generateToneSteps(selectedColor.hex, 2, 13, selectedColor.name || 'This shade') : null, [selectedColor?.id, selectedColor?.hex, mode]);
  React.useEffect(() => {
    setToneIdx(toneRamp ? toneRamp.anchorIdx : null);
  }, [toneRamp]);
  const onAnchor = !toneRamp || toneIdx == null || toneIdx === toneRamp.anchorIdx;
  const effectiveColor = selectedColor && toneRamp && !onAnchor ? {
    ...selectedColor,
    hex: toneRamp.ramp[toneIdx].hex,
    name: toneRamp.ramp[toneIdx].name
  } : selectedColor;
  React.useEffect(() => {
    if (!effectiveColor || !resultsRef.current) return;
    if (window.innerWidth > 900) return;
    if (suppressScrollRef.current) {
      suppressScrollRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      resultsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [effectiveColor?.id, effectiveColor?.hex]);
  const matches = React.useMemo(() => {
    if (!selectedColor) return [];
    const hex = toneRamp && toneIdx != null && !onAnchor ? toneRamp.ramp[toneIdx].hex : selectedColor.hex;
    const candidates = getClosestColors(hex, 500).filter(p => !selectedColor.sourceKey || `${p.brand}|${p.shade}` !== selectedColor.sourceKey).filter(matchesVibe);
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
      window.gtag?.('event', 'pin_item', {
        brand: product.brand,
        shade: product.shade
      });
      return [...prev, product];
    });
  }

  // Color wheel is now the only palette style

  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("header", {
    className: "app-header",
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontWeight: 300,
      fontSize: 32,
      color: 'var(--espresso)',
      letterSpacing: '-0.01em'
    }
  }, "Lipstick Color Finder"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 12,
      color: 'var(--text-muted)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  }, "Explore 9,000+ shades"), /*#__PURE__*/React.createElement("a", {
    href: "about.html",
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      borderRadius: 24,
      border: '1.5px solid var(--border)',
      background: '#fff',
      color: 'var(--espresso)',
      textDecoration: 'none',
      fontFamily: 'DM Sans',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      transition: 'all 0.15s'
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = 'var(--blush)';
      e.currentTarget.style.color = 'var(--blush)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.color = 'var(--espresso)';
    }
  }, "About"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowWishlist(true),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 16px',
      borderRadius: 24,
      border: '1.5px solid var(--border)',
      background: '#fff',
      color: 'var(--espresso)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      transition: 'all 0.15s'
    },
    onMouseEnter: e => {
      e.currentTarget.style.borderColor = 'var(--blush)';
      e.currentTarget.style.color = 'var(--blush)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.color = 'var(--espresso)';
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blush)'
    }
  }, "\u2665"), " My Favorites", wishlist.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--blush)',
      color: '#fff',
      fontSize: 10,
      padding: '1px 7px',
      borderRadius: 20,
      marginLeft: 2
    }
  }, wishlist.length))), /*#__PURE__*/React.createElement("main", {
    className: "app-main",
    style: {
      paddingBottom: pinnedItems.length > 0 ? 140 : undefined,
      transition: 'padding-bottom 0.35s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "palette-col"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 0,
      background: 'transparent',
      border: '1px solid var(--border)',
      borderRadius: 18,
      padding: 2,
      marginBottom: 4,
      alignSelf: 'center'
    }
  }, [{
    id: 'wheel',
    label: 'Color wheel'
  }, {
    id: 'photo',
    label: 'Upload photo'
  }, {
    id: 'hex',
    label: 'Custom color'
  }, {
    id: 'dupe',
    label: 'Dupe finder'
  }, ...(wishlist.length > 0 ? [{
    id: 'list',
    label: 'From My List'
  }] : [])].map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => {
      setMode(t.id);
      window.gtag?.('event', 'select_mode', {
        mode: t.id
      });
      if (t.id === 'wheel') {
        setSelectedColor(null);
        setPhotoHex(null);
        setHexHex(null);
        setDupeProduct(null);
      } else if (t.id === 'photo') {
        setSelectedColor(null);
        setZoomAnchor(null);
        setHexHex(null);
        setDupeProduct(null);
      } else if (t.id === 'hex') {
        setSelectedColor(null);
        setZoomAnchor(null);
        setPhotoHex(null);
        setDupeProduct(null);
      } else if (t.id === 'dupe') {
        setSelectedColor(null);
        setZoomAnchor(null);
        setPhotoHex(null);
        setHexHex(null);
        setDupeProduct(null);
      } else {
        setSelectedColor(null);
        setZoomAnchor(null);
        setPhotoHex(null);
        setHexHex(null);
        setDupeProduct(null);
      }
    },
    style: {
      padding: '5px 14px',
      borderRadius: 16,
      fontFamily: 'DM Sans',
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      background: mode === t.id ? 'var(--espresso)' : 'transparent',
      color: mode === t.id ? 'var(--cream)' : 'var(--text-muted)',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s'
    }
  }, t.label))), mode === 'wheel' ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(ColorWheel, {
    colors: wheelColors,
    selectedId: selectedColor?.id,
    onSelect: c => {
      setSelectedColor(c);
      window.gtag?.('event', 'select_color', {
        method: 'wheel',
        hex: c.hex,
        name: c.name
      });
    },
    hoveredId: hoveredId,
    onHover: setHoveredId,
    preserveOrder: !!zoomAnchor
  })) : mode === 'photo' ? /*#__PURE__*/React.createElement(PhotoPicker, {
    sampledHex: photoHex,
    onColor: setPhotoHex
  }) : mode === 'hex' ? /*#__PURE__*/React.createElement(HexPicker, {
    sampledHex: hexHex,
    onColor: setHexHex
  }) : mode === 'dupe' ? /*#__PURE__*/React.createElement(DupeFinder, {
    product: dupeProduct,
    onSelect: setDupeProduct,
    onUsePhoto: () => {
      setMode('photo');
      setDupeProduct(null);
    }
  }) : /*#__PURE__*/React.createElement(ListPicker, {
    wishlist: wishlist,
    selectedKey: selectedColor?.sourceKey,
    onPick: p => setSelectedColor({
      id: '__list__',
      name: `Similar to ${p.shade}`,
      hex: p.hex,
      sourceKey: `${p.brand}|${p.shade}`
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      minHeight: 32,
      marginTop: 4
    }
  }, !zoomAnchor && selectedColor && mode === 'wheel' && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const ramp = buildTonalRamp(selectedColor.hex);
      const anchorLab = hexToLab(selectedColor.hex);
      const nearest = ramp.reduce((best, step) => {
        const d = deltaE(anchorLab, hexToLab(step.hex));
        return d < best.d ? {
          step,
          d
        } : best;
      }, {
        step: ramp[5],
        d: Infinity
      }).step;
      preZoomRef.current = selectedColor;
      setZoomAnchor(selectedColor);
      suppressScrollRef.current = true;
      setSelectedColor(nearest);
      window.gtag?.('event', 'zoom_shades', {
        hex: selectedColor.hex,
        name: selectedColor.name
      });
    },
    style: {
      padding: '8px 16px',
      fontSize: 11,
      fontFamily: 'DM Sans',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 500,
      background: 'transparent',
      color: 'var(--blush)',
      border: '1px solid var(--blush)',
      borderRadius: 20,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--blush)';
      e.currentTarget.style.color = '#fff';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--blush)';
    }
  }, /*#__PURE__*/React.createElement("span", null, "See lighter & deeper shades"), /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 16 16",
    fill: "none",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "7",
    r: "4.5",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10.5",
    y1: "10.5",
    x2: "14",
    y2: "14",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  }))), zoomAnchor && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setZoomAnchor(null);
      if (preZoomRef.current) {
        suppressScrollRef.current = true;
        setSelectedColor(preZoomRef.current);
      }
    },
    style: {
      padding: '8px 16px',
      fontSize: 11,
      fontFamily: 'DM Sans',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontWeight: 500,
      background: 'var(--espresso)',
      color: 'var(--cream)',
      border: '1px solid var(--espresso)',
      borderRadius: 20,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("span", null, "Show all shades"))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      letterSpacing: '0.05em',
      fontStyle: 'italic'
    }
  }, "Lighter to deeper shades of this color"))), selectedColor && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 16px 8px 10px',
      background: '#fff',
      borderRadius: 40,
      border: '1px solid var(--border)',
      boxShadow: '0 2px 8px var(--shadow)',
      animation: 'fadeUp 0.2s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: selectedColor.hex,
      boxShadow: `0 2px 8px ${selectedColor.hex}60`
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--espresso)',
      lineHeight: 1.2
    }
  }, selectedColor.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      letterSpacing: '0.06em'
    }
  }, selectedColor.hex.toUpperCase())), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSelectedColor(null);
      setZoomAnchor(null);
    },
    style: {
      marginLeft: 4,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 16,
      lineHeight: 1,
      padding: '2px 4px'
    }
  }, "\xD7")), mode === 'wheel' && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.05em',
      fontFamily: 'DM Sans',
      marginTop: 8,
      textAlign: 'center'
    }
  }, "Click a segment to browse matching lipstick shades"), !selectedColor && mode !== 'dupe' && /*#__PURE__*/React.createElement("div", {
    className: "mobile-picker-tips"
  }, [{
    icon: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 20 20",
      fill: "none"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M 10 10 L 18 10 A 8 8 0 0 1 10 18 Z",
      fill: "#F5C5C5",
      stroke: "#D4B8AC",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M 10 10 L 10 18 A 8 8 0 0 1 2 10 Z",
      fill: "#C87890",
      stroke: "#D4B8AC",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M 10 10 L 2 10 A 8 8 0 0 1 10 2 Z",
      fill: "#8B4558",
      stroke: "#D4B8AC",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M 10 10 L 10 2 A 8 8 0 0 1 18 10 Z",
      fill: "#E8C8B8",
      stroke: "#D4B8AC",
      strokeWidth: "0.5"
    })),
    label: 'Color Wheel',
    desc: 'Discover products by color family, then explore lighter and deeper shades.'
  }, {
    icon: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 20 20",
      fill: "none"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "2",
      y: "7",
      width: "16",
      height: "10",
      rx: "2",
      fill: "#EDD8CE",
      stroke: "#D4B8AC",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "6",
      y: "5",
      width: "7",
      height: "3",
      rx: "1",
      fill: "#EDD8CE",
      stroke: "#D4B8AC",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "10",
      cy: "12",
      r: "3",
      fill: "#F0D8D0",
      stroke: "#C87890",
      strokeWidth: "1.2"
    })),
    label: 'Upload Photo',
    desc: "Upload a photo and tap the exact shade you'd like to match."
  }, {
    icon: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 20 20",
      fill: "none"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "14",
      cy: "5",
      r: "3.5",
      fill: "#EDD8CE",
      stroke: "#D4B8AC",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "7.5",
      x2: "5.5",
      y2: "14",
      stroke: "#D4B8AC",
      strokeWidth: "2",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "4",
      cy: "15.5",
      r: "2",
      fill: "#C87890"
    })),
    label: 'Custom Color',
    desc: 'Enter a hex code or pick from the color picker.'
  }, {
    icon: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 20 20",
      fill: "none"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "2",
      y: "13",
      width: "6",
      height: "6",
      rx: "1",
      fill: "#EDD8CE",
      stroke: "#D4B8AC",
      strokeWidth: "0.8"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "2",
      y: "15.5",
      width: "6",
      height: "2",
      fill: "#E4C8BC",
      stroke: "#D4B8AC",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "7.5",
      width: "4",
      height: "5.5",
      rx: "0.5",
      fill: "#F0DED8",
      stroke: "#D4B8AC",
      strokeWidth: "0.8"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "4",
      width: "4",
      height: "3.5",
      fill: "#C87890",
      stroke: "#A86878",
      strokeWidth: "0.6"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M3 4 Q3.5 1 5 0.5 Q6.5 1 7 4 Z",
      fill: "#C87890",
      stroke: "#A86878",
      strokeWidth: "0.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "3",
      y1: "2.8",
      x2: "7",
      y2: "1.5",
      stroke: "#A86878",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "12",
      y: "13",
      width: "6",
      height: "6",
      rx: "1",
      fill: "#EDD8CE",
      stroke: "#D4B8AC",
      strokeWidth: "0.8"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "12",
      y: "15.5",
      width: "6",
      height: "2",
      fill: "#E4C8BC",
      stroke: "#D4B8AC",
      strokeWidth: "0.5"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "13",
      y: "7.5",
      width: "4",
      height: "5.5",
      rx: "0.5",
      fill: "#F0DED8",
      stroke: "#D4B8AC",
      strokeWidth: "0.8"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "13",
      y: "4",
      width: "4",
      height: "3.5",
      fill: "#C87890",
      stroke: "#A86878",
      strokeWidth: "0.6"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M13 4 Q13.5 1 15 0.5 Q16.5 1 17 4 Z",
      fill: "#C87890",
      stroke: "#A86878",
      strokeWidth: "0.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "13",
      y1: "2.8",
      x2: "17",
      y2: "1.5",
      stroke: "#A86878",
      strokeWidth: "0.5"
    })),
    label: 'Dupe Finder',
    desc: 'Search a lipstick you own and find color-matched alternatives.'
  }, {
    icon: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        color: 'var(--blush)'
      }
    }, "\u2665"),
    label: 'My Favorites',
    desc: 'Heart products to save and compare shades later.'
  }, {
    icon: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        color: 'var(--espresso-mid)',
        fontWeight: 300
      }
    }, "+"),
    label: 'Shade Comparison',
    desc: 'Pin up to four shades to compare side by side.'
  }].map(({
    icon,
    label,
    desc
  }) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 34,
      height: 34,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(200,120,144,0.10)',
      marginTop: 1
    }
  }, icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--espresso)',
      marginBottom: 2
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 12,
      color: 'var(--text-muted)',
      lineHeight: 1.5
    }
  }, desc)))))), /*#__PURE__*/React.createElement("div", {
    className: "results-col",
    ref: resultsRef
  }, /*#__PURE__*/React.createElement(ResultsTable, {
    selectedColor: effectiveColor,
    matches: matches,
    totalProducts: REAL_PRODUCTS.length,
    pinnedItems: pinnedItems,
    togglePin: togglePin,
    wishlist: wishlist,
    toggleWishlist: toggleWishlist,
    toneRamp: toneRamp,
    toneIdx: toneIdx,
    setToneIdx: setToneIdx
  }))), /*#__PURE__*/React.createElement("footer", {
    className: "app-footer",
    style: {
      borderTop: '1px solid var(--border)',
      display: 'flex',
      gap: 24,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.05em'
    }
  }, "Showing closest matches by color distance (\u0394E)"), /*#__PURE__*/React.createElement("a", {
    href: "color-guide.html",
    style: {
      fontSize: 11,
      color: 'var(--blush)',
      letterSpacing: '0.05em',
      textDecoration: 'none',
      borderBottom: '1px solid currentColor',
      paddingBottom: 1,
      transition: 'opacity 0.15s'
    }
  }, "What is \u0394E?"), /*#__PURE__*/React.createElement("a", {
    href: "about.html",
    style: {
      fontSize: 11,
      color: 'var(--blush)',
      letterSpacing: '0.05em',
      textDecoration: 'none',
      borderBottom: '1px solid currentColor',
      paddingBottom: 1,
      transition: 'opacity 0.15s'
    }
  }, "About"), selectedColor && matches.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, "\xB7 ", matches.length, " closest match", matches.length !== 1 ? 'es' : '', " from ", REAL_PRODUCTS.length, " products")), showTweaks && /*#__PURE__*/React.createElement(TweaksPanel, {
    tweaks: tweaks,
    setTweak: setTweak,
    onClose: () => {
      setShowTweaks(false);
      window.parent.postMessage({
        type: '__edit_mode_dismissed'
      }, '*');
    }
  }), /*#__PURE__*/React.createElement(ComparisonTray, {
    pinnedItems: pinnedItems,
    onRemove: p => togglePin(p),
    onClear: () => setPinnedItems([])
  }), showVibe && /*#__PURE__*/React.createElement(VibePanel, {
    vibe: vibe,
    setVibe: setVibe,
    onClose: () => setShowVibe(false)
  }), showWishlist && /*#__PURE__*/React.createElement(WishlistPanel, {
    wishlist: wishlist,
    onClose: () => setShowWishlist(false),
    onRemove: p => toggleWishlist(p),
    onClear: () => setWishlist([])
  }), /*#__PURE__*/React.createElement("style", null, `
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
      `));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
