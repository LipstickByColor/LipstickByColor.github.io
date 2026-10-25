function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect
} = React;

// Filled heart. The trailing U+FE0E asks for the text glyph: without it phones
// draw U+2665 as a red emoji that ignores the CSS color.
const HEART = '\u2665\uFE0E';

// Look up a product's image URL from the prebuilt index.
// Keys are "brand|product|shade" lowercased.
function getProductImage(p) {
  if (!p || !window.LIPSTICK_IMAGES) return null;
  const key = `${(p.brand || '').toLowerCase()}|${(p.product || '').toLowerCase()}|${(p.shade || '').toLowerCase()}`;
  return window.LIPSTICK_IMAGES[key] || null;
}

// Product thumb: real swatch/bullet photo. The extracted color shows immediately
// as a placeholder; the photo crossfades in once loaded.
// Round heart toggle — shared by result cards, My Favorites, and shared lists
function heartBtnStyle(isLiked) {
  return {
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    lineHeight: 1,
    fontFamily: 'DM Sans',
    flexShrink: 0,
    background: isLiked ? 'rgba(232,180,192,0.55)' : 'rgba(255,255,255,0.82)',
    color: isLiked ? 'var(--blush-deep)' : 'var(--blush)',
    // the filled heart sits on pink
    border: '1px solid rgba(42,26,20,0.08)',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s, box-shadow 0.18s'
  };
}
function ProductThumb({
  product,
  size = 56,
  width,
  height,
  zoom = 1.18,
  fit = 'cover',
  radius = 10,
  ring = true,
  tint = true
}) {
  // Image URLs arrive after the catalogue (see supabase-data.js); re-render when they do
  const [, setImagesVersion] = useState(0);
  useEffect(() => {
    if (window.LIPSTICK_IMAGES_READY) return;
    const onImages = () => setImagesVersion(v => v + 1);
    window.addEventListener('lipstick-images', onImages);
    return () => window.removeEventListener('lipstick-images', onImages);
  }, []);
  const url = getProductImage(product);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const w = width ?? size,
    h = height ?? size;
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [url]);
  const showImg = url && !failed;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: w,
      height: h,
      flexShrink: 0,
      borderRadius: radius,
      overflow: 'hidden',
      background: tint ? product.hex : 'transparent',
      boxShadow: ring && (!showImg || !loaded) ? `inset 0 2px 8px ${product.hex}70` : 'none',
      border: ring ? '1px solid rgba(42,26,20,0.08)' : 'none',
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
      objectFit: fit,
      transform: fit === 'cover' ? `scale(${zoom})` : 'none',
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

// Visually-hidden text — screen readers only
const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap'
};

// How many shades the comparison tray holds
const MAX_COMPARE = 6;

// Single result card — image, save/compare overlay, ΔE + % match
function MatchCard({
  p,
  wishlist,
  toggleWishlist,
  pinnedItems,
  togglePin,
  onOpen
}) {
  const isLiked = wishlist.some(x => x.brand === p.brand && x.shade === p.shade);
  const isPinned = pinnedItems.some(x => x.brand === p.brand && x.shade === p.shade);
  const isFull = pinnedItems.length >= MAX_COMPARE && !isPinned;
  const pct = Math.max(0, Math.round(100 - p.distance));
  return /*#__PURE__*/React.createElement("div", {
    className: "match-card",
    style: {
      position: 'relative',
      cursor: 'pointer',
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'box-shadow 0.18s, transform 0.18s'
    },
    onMouseEnter: e => {
      e.currentTarget.style.boxShadow = '0 8px 22px var(--shadow)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'none';
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onOpen,
    "aria-label": `See details for ${p.brand} ${p.shade}`,
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      background: 'none',
      border: 0,
      padding: 0,
      borderRadius: 14,
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 106,
      background: 'var(--cream-dark)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "img",
    "aria-label": `Swatch ${p.hex}`,
    title: p.hex,
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 18,
      background: p.hex
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 18
    }
  }, /*#__PURE__*/React.createElement(ProductThumb, {
    product: p,
    width: "100%",
    height: "100%",
    fit: "contain",
    radius: 0,
    ring: false,
    tint: false
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 5,
      top: 5,
      bottom: 5,
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      toggleWishlist(p);
    },
    "aria-pressed": isLiked,
    "aria-label": `${isLiked ? 'Remove' : 'Save'} ${p.brand} ${p.shade} ${isLiked ? 'from' : 'to'} My Favorites`,
    title: isLiked ? 'Remove from My Favorites' : 'Save to My Favorites',
    className: "match-card-action",
    style: heartBtnStyle(isLiked)
  }, isLiked ? HEART : '♡'), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      togglePin(p);
    },
    "aria-label": `${isPinned ? 'Remove' : 'Add'} ${p.brand} ${p.shade} ${isPinned ? 'from' : 'to'} comparison`,
    title: isPinned ? 'Remove from comparison' : isFull ? `Max ${MAX_COMPARE} items` : 'Add to comparison',
    disabled: isFull,
    className: "match-card-action",
    style: {
      width: 30,
      height: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 15,
      lineHeight: 1,
      fontFamily: 'DM Sans',
      background: isPinned ? 'var(--espresso)' : 'rgba(255,255,255,0.82)',
      color: isPinned ? '#FAF6F1' : 'var(--blush)',
      border: '1px solid rgba(42,26,20,0.08)',
      borderRadius: '50%',
      cursor: isFull ? 'not-allowed' : 'pointer',
      opacity: isFull ? 0.4 : 1
    }
  }, isPinned ? '✕' : '+'))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 9px 9px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: srOnly
  }, "Brand: "), p.brand), /*#__PURE__*/React.createElement("div", {
    title: p.product,
    style: {
      fontSize: 13,
      color: 'var(--espresso)',
      fontFamily: 'DM Sans',
      lineHeight: 1.3,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  }, p.product), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontFamily: 'DM Sans',
      color: 'var(--text-muted)',
      lineHeight: 1.35
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: srOnly
  }, "Shade: "), p.shade), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginTop: 4
    },
    title: `Color distance ΔE ${p.distance.toFixed(1)} — lower is closer`
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'ui-monospace, Menlo, monospace',
      fontSize: 10.5,
      color: 'var(--text-muted)'
    }
  }, "\u0394E ", p.distance.toFixed(1)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'baseline',
      gap: 3,
      color: 'var(--blush-deep)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: srOnly
  }, "Match: "), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 500
    }
  }, pct, "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5
    }
  }, "match")))));
}

// What a result was matched against, for the detail view's side-by-side strip.
// Wheel colors are left out: the strip is for holding a lipstick against the
// one color or lipstick the visitor brought.
const DETAIL_SOURCES = {
  __photo__: 'photo',
  __hex__: 'hex',
  __list__: 'list',
  __dupe__: 'dupe'
};
function detailSourceLabel(source) {
  if (source.id === '__photo__') return 'Your photo';
  if (source.id === '__hex__') return 'Your color';
  const key = source.sourceKey || '';
  return key.slice(key.indexOf('|') + 1) || 'Your shade';
}
const MATCH_DETAIL_TYPE = {
  eyebrow: 11,
  brand: 12,
  body: 13,
  value: 15,
  match: 17,
  shade: 26
};

// A result card opened up: bottom sheet on phones, centered dialog on desktop
// (.match-detail in index.html). `source` is the color it was matched against,
// or null when the swatch shows the lipstick alone.
function MatchDetail({
  p,
  source,
  onClose,
  wishlist,
  toggleWishlist,
  pinnedItems,
  togglePin
}) {
  const TYPE = MATCH_DETAIL_TYPE;
  const isLiked = wishlist.some(x => x.brand === p.brand && x.shade === p.shade);
  const isPinned = pinnedItems.some(x => x.brand === p.brand && x.shade === p.shade);
  const isFull = pinnedItems.length >= MAX_COMPARE && !isPinned;
  const pct = Math.max(0, Math.round(100 - p.distance));
  const ink = bandInk(p.hex);
  const redName = redLabel(p.hex);
  const dialogRef = useDialog(onClose);
  useBackToClose(onClose);
  const facts = [['Finish', (p.finish || '').trim() || 'Unlisted'], ['Type', FORMAT_LABELS[p.format] || p.format], ['Price', p.price_tier || '$$'], p.discontinued && ['Status', 'Discontinued']].filter(f => f && f[1]);
  const stripHalf = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'flex-end',
    padding: '8px 10px',
    fontSize: TYPE.body,
    fontWeight: 600
  };
  const actionBtn = {
    height: 48,
    borderRadius: 24,
    fontFamily: 'DM Sans',
    fontSize: TYPE.value,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  };
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    className: "match-detail-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    ref: dialogRef,
    tabIndex: -1,
    className: "match-detail",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": `${p.brand} ${p.shade} details`,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 44,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "match-detail-handle",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close details",
    style: {
      position: 'absolute',
      right: 6,
      top: 0,
      width: 44,
      height: 44,
      border: 0,
      padding: 0,
      cursor: 'pointer',
      background: 'none',
      color: 'var(--espresso-mid)',
      fontSize: 20,
      lineHeight: 1,
      fontFamily: 'DM Sans'
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '2px 18px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      fontFamily: 'DM Sans'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "match-detail-photo",
    style: {
      position: 'relative',
      flexShrink: 0,
      borderRadius: 12,
      background: 'var(--cream-dark)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 8
    }
  }, /*#__PURE__*/React.createElement(ProductThumb, {
    product: p,
    width: "100%",
    height: "100%",
    fit: "contain",
    radius: 0,
    ring: false,
    tint: false
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 6,
      overflowWrap: 'anywhere'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: TYPE.brand,
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--espresso-mid)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: srOnly
  }, "Brand: "), p.brand), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontWeight: 600,
      fontSize: TYPE.shade,
      lineHeight: 1.08,
      color: 'var(--espresso)',
      textTransform: 'capitalize',
      fontVariantNumeric: 'lining-nums'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: srOnly
  }, "Shade: "), p.shade), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: TYPE.value,
      lineHeight: 1.35,
      color: 'var(--text-body)',
      textTransform: 'capitalize'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: srOnly
  }, "Product: "), p.product), redName && /*#__PURE__*/React.createElement("div", {
    style: {
      ...RED_LABEL_STYLE,
      fontSize: TYPE.eyebrow
    }
  }, redName))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3,
      height: 64,
      borderRadius: 12,
      overflow: 'hidden',
      background: '#fff'
    }
  }, source && /*#__PURE__*/React.createElement("div", {
    style: {
      ...stripHalf,
      background: source.hex,
      color: bandInk(source.hex)
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      textTransform: source.sourceKey ? 'capitalize' : 'none'
    }
  }, detailSourceLabel(source))), /*#__PURE__*/React.createElement("div", {
    role: source ? undefined : 'img',
    "aria-label": source ? undefined : `Swatch ${p.hex}`,
    style: {
      ...stripHalf,
      justifyContent: 'flex-end',
      background: p.hex,
      color: ink
    }
  }, source && 'This lipstick')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: TYPE.match,
      fontWeight: 600,
      color: 'var(--blush-deep)'
    }
  }, pct, "% match"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'ui-monospace, Menlo, monospace',
      fontSize: TYPE.body,
      color: 'var(--espresso-mid)'
    }
  }, p.hex.toUpperCase()))), /*#__PURE__*/React.createElement("dl", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
      gap: 8,
      margin: 0
    }
  }, facts.map(([label, value]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      background: 'var(--cream)',
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      fontSize: TYPE.eyebrow,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--espresso-mid)'
    }
  }, label), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      fontSize: TYPE.value,
      fontWeight: 500,
      color: 'var(--espresso)'
    }
  }, value)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleWishlist(p),
    "aria-pressed": isLiked,
    "aria-label": `${isLiked ? 'Remove' : 'Save'} ${p.brand} ${p.shade} ${isLiked ? 'from' : 'to'} My Favorites`,
    style: {
      ...actionBtn,
      cursor: 'pointer',
      background: isLiked ? 'var(--blush-deep)' : 'var(--espresso)',
      color: '#FAF6F1',
      border: `1px solid ${isLiked ? 'var(--blush-deep)' : 'var(--espresso)'}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, isLiked ? HEART : '♡'), isLiked ? 'Saved' : /*#__PURE__*/React.createElement("span", null, "Save", /*#__PURE__*/React.createElement("span", {
    className: "match-detail-long"
  }, " to My Favorites"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => togglePin(p),
    disabled: isFull,
    "aria-pressed": isPinned,
    "aria-label": `${isPinned ? 'Remove' : 'Add'} ${p.brand} ${p.shade} ${isPinned ? 'from' : 'to'} comparison`,
    title: isFull ? `Max ${MAX_COMPARE} items` : undefined,
    style: {
      ...actionBtn,
      cursor: isFull ? 'not-allowed' : 'pointer',
      opacity: isFull ? 0.4 : 1,
      background: isPinned ? 'var(--cream-dark)' : '#fff',
      color: 'var(--espresso)',
      border: '1px solid var(--espresso)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, isPinned ? '✓' : '+'), isPinned ? 'Comparing' : 'Compare'))))), document.body);
}

// Utility: luminance for text contrast
function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Compact tonal ramp anchored to a specific shade (perSide lighter, anchor, perSide deeper).
// Used in the results-panel strip for all entry points.
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

// A ramp step counts as "no options" if even the closest real product is this
// far away in CIEDE2000 — calibrated against the catalog so it only trips for the
// hand-curated novelty wheel colors that are already known outliers, not for
// ordinary shades. (Well beyond "just noticeable"; equivalent to the old ΔE76
// cutoff of 10, which reads as a clearly different color, not a slightly-off match.)
const NO_MATCH_DELTA_E = 6.5;

// How far from the color a result may be. Normally maxDeltaE past the closest match. The color
// chart instead uses a fixed distance from the pick, so two picks the eye can't tell apart search
// the same area and get the same lipsticks; only where the catalogue is thin (nothing that close)
// does it reach a little past the closest match. Blues and greens are so rare (a few dozen in the
// catalogue) that a blue or green pick searches a much wider area, so navy also finds blue-black.
const CHART_RADIUS = 2.25,
  CHART_SPARSE = 1,
  CHART_RARE_RADIUS = 9,
  CHART_RARE = ['blue', 'green'];
// chartLab is the chart's pick (null elsewhere)
function bandCut(best, maxDeltaE, chartLab) {
  if (!chartLab) return best + maxDeltaE;
  const radius = CHART_RARE.includes(colorFamily(...chartLab)) ? CHART_RARE_RADIUS : CHART_RADIUS;
  return Math.max(radius, best + CHART_SPARSE);
}
// What the results show: everything within the cut-off, and never fewer than five
function matchBand(candidates, maxDeltaE, chartLab) {
  const bestDist = candidates[0]?.distance ?? 0;
  const inBand = candidates.filter(p => p.distance <= bandCut(bestDist, maxDeltaE, chartLab));
  return inBand.length >= 5 ? inBand : candidates.slice(0, 5);
}
function nearestProductDistance(hex) {
  const lab = hexToLab(hex);
  let best = Infinity;
  for (const p of REAL_PRODUCTS) {
    const d = deltaE(lab, p.lab);
    if (d < best) best = d;
  }
  return best;
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
  onHover
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
  // GMM colors hue-sorted across most of the wheel; novelty colors hue-sorted
  // in a fixed block at the bottom (180°), separated by DIVIDER_GAP.
  const segments = [];
  {
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

  // Keyboard: the wheel is one Tab stop. Arrow keys move the focus (left/right around the ring,
  // up/down between the outer and inner ring), Enter or Space picks the color.
  const [rovingId, setRovingId] = useState(null); // the segment Tab lands on
  const [ringId, setRingId] = useState(null); // the segment showing a keyboard focus ring
  const cellEls = React.useRef({});
  const around = [...segments].sort((p, q) => (p.startDeg % 360 + 360) % 360 - (q.startDeg % 360 + 360) % 360);
  const hasCell = id => segments.some(sg => sg.outer.id === id || sg.inner?.id === id);
  const tabId = hasCell(rovingId) ? rovingId : hasCell(selectedId) ? selectedId : around[0]?.outer.id;
  function onCellKey(e, c) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      return onSelect(c);
    }
    const i = around.findIndex(sg => sg.outer.id === c.id || sg.inner?.id === c.id);
    if (i < 0) return;
    const onInner = around[i].inner?.id === c.id;
    const step = {
      ArrowRight: 1,
      ArrowLeft: -1
    }[e.key];
    let next = null;
    if (step) {
      const sg = around[(i + step + around.length) % around.length];
      next = onInner && sg.inner ? sg.inner : sg.outer;
    } else if (e.key === 'ArrowDown') next = around[i].inner || null;else if (e.key === 'ArrowUp') next = around[i].outer;
    if (!next || next.id === c.id) {
      if (next) e.preventDefault();
      return;
    }
    e.preventDefault();
    setRovingId(next.id);
    cellEls.current[next.id]?.focus();
  }
  const cellProps = c => ({
    ref: el => {
      cellEls.current[c.id] = el;
    },
    role: 'button',
    tabIndex: c.id === tabId ? 0 : -1,
    'aria-label': c.name,
    'aria-pressed': c.id === selectedId,
    onKeyDown: e => onCellKey(e, c),
    onFocus: e => {
      setRovingId(c.id);
      if (e.target.matches(':focus-visible')) setRingId(c.id);
    },
    onBlur: () => setRingId(null)
  });
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
    role: "group",
    "aria-label": "Lipstick color wheel. Arrow keys move between colors; Enter picks one.",
    style: {
      filter: 'drop-shadow(0 6px 24px rgba(42,26,20,0.14))',
      maxWidth: SIZE,
      height: 'auto',
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
    }, /*#__PURE__*/React.createElement("path", _extends({
      d: outerPath,
      fill: outer.hex,
      stroke: outerSelected ? '#2A1A14' : '#FAF6F1',
      strokeWidth: outerSelected ? 2 : 1,
      opacity: outerHovered && !outerSelected ? 0.82 : 1
    }, cellProps(outer), {
      style: {
        cursor: 'pointer',
        transition: 'opacity 0.12s',
        outline: 'none'
      },
      onClick: () => onSelect(outer),
      onMouseEnter: () => onHover(outer.id),
      onMouseLeave: () => onHover(null)
    })), outerSelected && /*#__PURE__*/React.createElement("path", {
      d: outerPath,
      fill: "none",
      stroke: "#2A1A14",
      strokeWidth: "2.5",
      opacity: "0.6"
    }), inner && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", _extends({
      d: innerPath,
      fill: inner.hex,
      stroke: innerSelected ? '#2A1A14' : '#FAF6F1',
      strokeWidth: innerSelected ? 2 : 1,
      opacity: innerHovered && !innerSelected ? 0.82 : 1
    }, cellProps(inner), {
      style: {
        cursor: 'pointer',
        transition: 'opacity 0.12s',
        outline: 'none'
      },
      onClick: () => onSelect(inner),
      onMouseEnter: () => onHover(inner.id),
      onMouseLeave: () => onHover(null)
    })), innerSelected && /*#__PURE__*/React.createElement("path", {
      d: innerPath,
      fill: "none",
      stroke: "#2A1A14",
      strokeWidth: "2.5",
      opacity: "0.6"
    })));
  }), ringId && (() => {
    const sg = segments.find(x => x.outer.id === ringId || x.inner?.id === ringId);
    if (!sg) return null;
    const d = sg.inner?.id === ringId ? arcPath(sg.startDeg, sg.endDeg, R_INNER_OUT - 1, R_INNER_IN) : arcPath(sg.startDeg, sg.endDeg, SINGLE_RING ? R_SINGLE_OUT : R_OUTER_OUT, SINGLE_RING ? R_SINGLE_IN : R_OUTER_IN + 1);
    return /*#__PURE__*/React.createElement("g", {
      style: {
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: d,
      fill: "none",
      stroke: "#fff",
      strokeWidth: "7",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: d,
      fill: "none",
      stroke: "#2A1A14",
      strokeWidth: "3",
      strokeLinejoin: "round"
    }));
  })(), /*#__PURE__*/React.createElement("circle", {
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
    },
    onKeyDown: e => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onOpen(null);
        ref.current.querySelector('button').focus();
      }
    }
  }, /*#__PURE__*/React.createElement("button", {
    "aria-expanded": isOpen,
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
  }, children), count > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 10,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      fontFamily: 'DM Sans',
      letterSpacing: '0.04em'
    }
  }, count, " selected"), /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    onMouseEnter: e => {
      e.currentTarget.style.textDecoration = 'underline';
    },
    onMouseLeave: e => {
      e.currentTarget.style.textDecoration = 'none';
    },
    style: {
      fontSize: 12,
      padding: 0,
      border: 'none',
      background: 'transparent',
      color: 'var(--blush-deep)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      fontWeight: 500,
      letterSpacing: '0.04em',
      textUnderlineOffset: 3
    }
  }, "Clear \u2715"))));
}

// ── Results Table ─────────────────────────────────────────────────────────────
// ── Filters in the link ───────────────────────────────────────────────────────
// Result filters ride along in the URL so a filtered view can be shared:
//   &price=1&price=2 ($ and $$)  &fbrand=dior  &finish=Matte  &format=Lip+Gloss
//   &tone=cool  &discontinued=show
// (fbrand, not brand: ?brand= already names the lipstick in a dupe link)
const FILTER_PARAMS = ['price', 'fbrand', 'finish', 'format', 'tone', 'discontinued'];
const PRICE_TIERS = ['$', '$$', '$$$', '$$$$'];
const FORMAT_LABELS = {
  'Lip Liner & Pencil': 'Lip Crayon, Liner, & Pencil'
};
function filterParamsFrom(search) {
  return [...new URLSearchParams(search)].filter(([k]) => FILTER_PARAMS.includes(k));
}
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
  setToneIdx,
  initialFilterParams,
  onFiltersChange,
  hideHeader
}) {
  const [activeBrands, setActiveBrands] = React.useState([]);
  const [activeTones, setActiveTones] = React.useState([]);
  const [activeTiers, setActiveTiers] = React.useState([]);
  const [activeFinishes, setActiveFinishes] = React.useState([]);
  const [activeFormats, setActiveFormats] = React.useState([]);
  const [hideDiscontinued, setHideDiscontinued] = React.useState(true);
  const [openFilter, setOpenFilter] = React.useState(null);
  // The result whose detail view is open, if any
  const [openProduct, setOpenProduct] = React.useState(null);
  React.useEffect(() => {
    setOpenProduct(null);
  }, [selectedColor?.id, selectedColor?.hex]);
  function openDetail(p) {
    window.gtag?.('event', 'view_match_detail', {
      brand: p.brand,
      shade: p.shade,
      ui_source: DETAIL_SOURCES[selectedColor?.id] || 'wheel'
    });
    setOpenProduct(p);
  }

  // Filters the page was opened with (a shared link), waiting for the first results to apply to
  const linkFilters = React.useRef(initialFilterParams || []);
  // Reset filters when selection changes (hideDiscontinued persists as a standing preference).
  // The first selection takes the link's filters instead.
  React.useEffect(() => {
    const fromLink = selectedColor ? linkFilters.current : null;
    if (selectedColor) linkFilters.current = null;
    const got = key => (fromLink || []).filter(([k]) => k === key).map(([, v]) => v);
    setActiveBrands(got('fbrand'));
    setActiveTones(got('tone'));
    setActiveFinishes(got('finish'));
    setActiveFormats(got('format'));
    setActiveTiers(got('price').map(n => PRICE_TIERS[n - 1]).filter(Boolean));
    if (got('discontinued').includes('show')) setHideDiscontinued(false);
    setOpenFilter(null);
  }, [selectedColor?.id]);

  // Tell the app which filters are on, for the URL
  React.useEffect(() => {
    if (linkFilters.current || !onFiltersChange) return;
    onFiltersChange([...activeTiers.map(t => ['price', String(PRICE_TIERS.indexOf(t) + 1)]), ...activeBrands.map(b => ['fbrand', b]), ...activeFinishes.map(f => ['finish', f]), ...activeFormats.map(f => ['format', f]), ...activeTones.map(t => ['tone', t]), ...(hideDiscontinued ? [] : [['discontinued', 'show']])]);
  }, [selectedColor?.id, activeTiers, activeBrands, activeFinishes, activeFormats, activeTones, hideDiscontinued]);

  // Classify undertone from LAB hue angle
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
  const redName = selectedColor ? redLabel(selectedColor.hex) : null;
  function tierOf(p) {
    return p.price_tier || '$$';
  }
  function finishOf(p) {
    return (p.finish || '').trim() || 'Unlisted';
  }

  // Derive available options from matches
  const allBrands = [...new Set(matches.map(p => p.brand))].sort();
  const allTones = [...new Set(matches.map(toneOf))];
  const TONE_ORDER = ['cool', 'neutral', 'warm'];
  const orderedTones = TONE_ORDER.filter(t => allTones.includes(t));
  const TIER_ORDER = PRICE_TIERS;
  const allTiers = TIER_ORDER.filter(t => matches.some(p => tierOf(p) === t));
  const FINISH_ORDER = ['Cream', 'Glossy', 'Matte', 'Satin', 'Semi-Matte', 'Sheer', 'Shimmer', 'Unlisted'];
  const allFinishes = FINISH_ORDER.filter(f => matches.some(p => finishOf(p) === f));
  const FORMAT_ORDER = ['Bullet Lipstick', 'Liquid Lipstick', 'Lip Gloss', 'Lip Stain & Tint', 'Lip Liner & Pencil', 'Lip Oil', 'Lip Balm & Care'];
  const allFormats = FORMAT_ORDER.filter(f => matches.some(p => p.format === f));
  const hasDiscontinued = matches.some(p => p.discontinued);
  const filtered = matches.filter(p => (activeBrands.length === 0 || activeBrands.includes(p.brand)) && (activeTones.length === 0 || activeTones.includes(toneOf(p))) && (activeTiers.length === 0 || activeTiers.includes(tierOf(p))) && (activeFinishes.length === 0 || activeFinishes.includes(finishOf(p))) && (activeFormats.length === 0 || activeFormats.includes(p.format)) && (!hideDiscontinued || !p.discontinued));

  // Fire once each time a filter combination empties the results
  const filtersEmptied = matches.length > 0 && filtered.length === 0;
  React.useEffect(() => {
    if (!filtersEmptied) return;
    window.gtag?.('event', 'filter_no_results', {
      brand: activeBrands.join(','),
      undertone: activeTones.join(','),
      price_tier: activeTiers.join(','),
      finish: activeFinishes.join(','),
      format: activeFormats.join(','),
      still_made: hideDiscontinued
    });
  }, [filtersEmptied]);
  if (!selectedColor) return /*#__PURE__*/React.createElement("div", {
    className: "results-empty-state",
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      textAlign: 'center',
      padding: 40
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 13,
      letterSpacing: '0.02em'
    }
  }, "Your matches will appear here"));

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
  function toggleFinish(f) {
    if (!activeFinishes.includes(f)) window.gtag?.('event', 'apply_filter', {
      filter_type: 'finish',
      filter_value: f
    });
    setActiveFinishes(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }
  function toggleDiscontinued() {
    window.gtag?.('event', 'apply_filter', {
      filter_type: 'still_made',
      filter_value: hideDiscontinued ? 'include_discontinued' : 'still_made_only'
    });
    setHideDiscontinued(v => !v);
  }
  const otherFilters = activeBrands.length + activeTones.length + activeTiers.length + activeFinishes.length + activeFormats.length;
  function clearFilters() {
    window.gtag?.('event', 'clear_filters', {
      filter_count: otherFilters
    });
    setActiveBrands([]);
    setActiveTones([]);
    setActiveTiers([]);
    setActiveFinishes([]);
    setActiveFormats([]);
  }
  // Matches the other filters keep that are only missing because discontinued shades are hidden
  const hiddenDiscontinued = hideDiscontinued ? matches.filter(p => p.discontinued && (activeBrands.length === 0 || activeBrands.includes(p.brand)) && (activeTones.length === 0 || activeTones.includes(toneOf(p))) && (activeTiers.length === 0 || activeTiers.includes(tierOf(p))) && (activeFinishes.length === 0 || activeFinishes.includes(finishOf(p))) && (activeFormats.length === 0 || activeFormats.includes(p.format))).length : 0;
  const emptyBtn = {
    fontFamily: 'DM Sans',
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '10px 18px',
    borderRadius: 24,
    border: '1.5px solid var(--espresso)',
    background: '#fff',
    color: 'var(--espresso)',
    cursor: 'pointer'
  };
  function toggleFormat(f) {
    if (!activeFormats.includes(f)) window.gtag?.('event', 'apply_filter', {
      filter_type: 'format',
      filter_value: f
    });
    setActiveFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "results-table",
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, !hideHeader && /*#__PURE__*/React.createElement("div", {
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
      borderRadius: 7,
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
  }, selectedColor.hex.toUpperCase(), " \xB7 Closest lip matches by \u0394E"), redName && /*#__PURE__*/React.createElement("p", {
    style: {
      ...RED_LABEL_STYLE,
      marginTop: 6
    }
  }, redName))), toneRamp && toneRamp.ramp.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12,
      padding: '9px 12px 10px',
      background: '#fff',
      borderRadius: 12,
      border: '1px solid var(--border)',
      boxShadow: '0 2px 12px var(--shadow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "group",
    "aria-label": "Lighter and deeper versions of this shade",
    style: {
      display: 'flex',
      gap: 5,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
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
    const disabled = !step.hasMatch;
    const lighter = i < toneRamp.anchorIdx;
    const label = isAnchor ? 'Your shade' : lighter ? i === 0 ? 'Lightest' : 'Lighter' : i === toneRamp.ramp.length - 1 ? 'Deepest' : 'Deeper';
    // A step with no lipsticks stays reachable (aria-disabled, not disabled) so its reason can be read out
    return /*#__PURE__*/React.createElement("button", {
      key: step.id,
      onClick: () => {
        if (!disabled) setToneIdx(i);
      },
      "aria-disabled": disabled || undefined,
      "aria-pressed": isActive,
      "aria-label": disabled ? `${label}, no lipsticks this ${lighter ? 'light' : 'deep'}` : label,
      title: disabled ? 'No options available in this shade' : isAnchor ? `${step.name} (your shade)` : step.name,
      style: {
        flex: 1,
        height: 40,
        borderRadius: 7,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        // Struck through when there is nothing in that shade
        background: disabled ? `linear-gradient(to top right, transparent calc(50% - 1px), var(--espresso) calc(50% - 1px), var(--espresso) calc(50% + 1px), transparent calc(50% + 1px)), ${step.hex}` : step.hex,
        border: isActive ? '2.5px solid var(--espresso)' : '2px solid #fff',
        outline: isAnchor && !isActive ? '1.5px dashed rgba(42,26,20,0.35)' : undefined,
        outlineOffset: isAnchor && !isActive ? -5 : 2,
        boxShadow: isActive ? '0 3px 10px rgba(42,26,20,0.28)' : '0 1px 3px rgba(42,26,20,0.12)',
        transform: isActive ? 'translateY(-2px)' : 'none',
        opacity: disabled ? 0.5 : 1,
        filter: disabled ? 'grayscale(0.7)' : 'none',
        transition: 'all 0.15s'
      }
    });
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
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
  }, "Reset to my shade")), (() => {
    const noLight = toneRamp.ramp.some((st, i) => !st.hasMatch && i < toneRamp.anchorIdx);
    const noDeep = toneRamp.ramp.some((st, i) => !st.hasMatch && i > toneRamp.anchorIdx);
    if (!noLight && !noDeep) return null;
    return /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: 4,
        fontSize: 11,
        fontFamily: 'DM Sans',
        color: 'var(--text-muted)',
        letterSpacing: '0.03em'
      }
    }, "No lipsticks that ", noLight && noDeep ? 'light or that deep' : noLight ? 'light' : 'deep');
  })()), (orderedTones.length >= 1 || allBrands.length > 1 || allTiers.length > 1 || allFormats.length > 1 || hasDiscontinued) && /*#__PURE__*/React.createElement("div", {
    className: "results-filters",
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
  }, "Filter"), allTiers.length > 1 && /*#__PURE__*/React.createElement(FilterDropdown, {
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
  })), allBrands.length > 1 && /*#__PURE__*/React.createElement(FilterDropdown, {
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
  })), allFormats.length > 1 && /*#__PURE__*/React.createElement(FilterDropdown, {
    label: "Format",
    count: activeFormats.length,
    isOpen: openFilter === 'Format',
    onOpen: setOpenFilter,
    onClear: () => setActiveFormats([])
  }, allFormats.map(f => {
    const active = activeFormats.includes(f);
    return /*#__PURE__*/React.createElement("button", {
      key: f,
      onClick: () => toggleFormat(f),
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
    }, FORMAT_LABELS[f] || f, active && /*#__PURE__*/React.createElement("span", {
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
  }, allFinishes.includes('Unlisted') && /*#__PURE__*/React.createElement("p", {
    style: {
      width: '100%',
      margin: '0 0 2px',
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 14,
      color: 'var(--text-muted)',
      lineHeight: 1.35
    }
  }, "Finish isn't listed for every product \u2014 \"Unlisted\" includes those."), allFinishes.map(f => {
    const active = activeFinishes.includes(f);
    const unlisted = f === 'Unlisted';
    return /*#__PURE__*/React.createElement("button", {
      key: f,
      onClick: () => toggleFinish(f),
      style: {
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 20,
        border: `1.5px ${unlisted ? 'dashed' : 'solid'} ${active ? 'var(--espresso-mid)' : 'var(--border)'}`,
        background: active ? 'rgba(92,61,48,0.10)' : 'transparent',
        color: active ? 'var(--espresso-mid)' : 'var(--text-muted)',
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
        fontSize: 10
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
  })), hasDiscontinued && /*#__PURE__*/React.createElement("button", {
    "aria-pressed": hideDiscontinued,
    onClick: toggleDiscontinued,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 11,
      padding: '5px 12px 5px 9px',
      borderRadius: 20,
      border: `1.5px solid ${hideDiscontinued ? 'var(--espresso-mid)' : 'var(--border)'}`,
      background: hideDiscontinued ? 'rgba(92,61,48,0.08)' : 'transparent',
      color: hideDiscontinued ? 'var(--espresso-mid)' : 'var(--text-muted)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      fontWeight: hideDiscontinued ? 500 : 400,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 14,
      height: 14,
      borderRadius: 4,
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1.5px solid ${hideDiscontinued ? 'var(--espresso-mid)' : 'var(--text-muted)'}`,
      background: hideDiscontinued ? 'var(--espresso-mid)' : '#fff',
      color: '#fff',
      fontSize: 10,
      lineHeight: 1
    }
  }, hideDiscontinued ? '✓' : ''), "Hide discontinued"), (activeBrands.length > 0 || activeTones.length > 0 || activeTiers.length > 0 || activeFinishes.length > 0 || activeFormats.length > 0) && /*#__PURE__*/React.createElement("div", {
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
    onClick: clearFilters,
    style: {
      fontSize: 11,
      padding: '3px 10px',
      borderRadius: 20,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--blush-deep)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      letterSpacing: '0.04em'
    }
  }, "Clear all"))), /*#__PURE__*/React.createElement("div", {
    className: "results-scroll",
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      padding: '32px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 14,
      lineHeight: 1.5,
      color: 'var(--text-body)'
    }
  }, !hiddenDiscontinued ? 'No matches for the selected filters.' : hiddenDiscontinued === 1 ? otherFilters ? 'The only match for these filters is discontinued.' : 'The only match here is discontinued.' : otherFilters ? `The ${hiddenDiscontinued} matches for these filters are discontinued.` : `All ${hiddenDiscontinued} matches here are discontinued.`), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10
    }
  }, hiddenDiscontinued > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: toggleDiscontinued,
    style: emptyBtn
  }, "Show discontinued"), otherFilters > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: clearFilters,
    style: emptyBtn
  }, "Clear filters"))) : /*#__PURE__*/React.createElement("ul", {
    "aria-label": `${filtered.length} closest lipstick matches, ordered by closeness`,
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))',
      gap: 10
    }
  }, filtered.map((p, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement(MatchCard, {
    p: p,
    wishlist: wishlist,
    toggleWishlist: toggleWishlist,
    pinnedItems: pinnedItems,
    togglePin: togglePin,
    onOpen: () => openDetail(p)
  }))))), openProduct && /*#__PURE__*/React.createElement(MatchDetail, {
    p: openProduct,
    source: DETAIL_SOURCES[selectedColor?.id] ? selectedColor : null,
    onClose: () => setOpenProduct(null),
    wishlist: wishlist,
    toggleWishlist: toggleWishlist,
    pinnedItems: pinnedItems,
    togglePin: togglePin
  }));
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
    min: 0.5,
    max: 10,
    step: 0.25,
    value: tweaks.maxDeltaE,
    onChange: e => setTweak('maxDeltaE', +e.target.value),
    style: {
      flex: 1,
      accentColor: 'var(--blush)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
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
// Site URL printed on the shared card so it can be scanned / typed back in.
const SITE_URL = 'lipstickbycolor.github.io';

// Route a URL through a CORS-friendly image proxy. Many retailer CDNs (Sephora,
// ilmakiage, …) serve product photos without an Access-Control-Allow-Origin
// header, so they can't be drawn onto an exportable canvas directly. wsrv.nl
// re-serves the same image with permissive CORS.
// CORS-enabled mirrors to try when a host doesn't send CORS headers itself.
// wsrv.nl covers most hosts; Sephora blocks it, but i0.wp.com (Jetpack's image
// CDN) can fetch Sephora. It takes a bare host+path, without the source query.
function corsProxies(url) {
  // bg=white: a transparent PNG would otherwise come back on black
  const proxies = ['https://wsrv.nl/?url=' + encodeURIComponent(url) + '&output=jpg&bg=white'];
  try {
    const u = new URL(url);
    proxies.push('https://i0.wp.com/' + u.host + u.pathname);
  } catch {}
  return proxies;
}

// Load one image cross-origin so it can be painted onto a canvas without
// tainting it. Tries the source directly first, then each proxy in turn;
// resolves to null (never rejects) if none work or it takes too long.
function loadCorsImage(url) {
  return new Promise(resolve => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    const fallbacks = corsProxies(url);
    let settled = false;
    const done = v => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(v);
      }
    };
    const timer = setTimeout(() => done(null), 8000);
    img.onload = () => done(img);
    img.onerror = () => {
      if (!fallbacks.length) {
        done(null);
        return;
      }
      img.src = fallbacks.shift();
    };
    img.src = url;
  });
}

// Preload every wishlist product photo. Returns an array aligned with `wishlist`
// (null where there's no image or the host blocked cross-origin use).
function loadWishlistImages(wishlist) {
  return Promise.all(wishlist.map(p => loadCorsImage(getProductImage(p))));
}

// The site's lips (same shape as favicon.svg and the share cards), drawn on the
// shortlist card. Its box runs x 1..99, y 3..68.
const SHARE_LIP = typeof Path2D !== 'undefined' ? new Path2D('M1 34C8 20 20 3 34 3C42 3 46 9 50 12C54 9 58 3 66 3C80 3 92 20 99 34C82 33 66 30 50 32C34 30 18 33 1 34Z M2 37C18 38 34 37 50 38C66 37 82 38 98 37C90 56 72 68 50 68C28 68 10 56 2 37Z') : null;
const SHARE_LIP_RATIO = 65 / 98;

// Draws a 4:5 portrait card (1080×1350) of the user's wishlist to a canvas,
// then lets them preview, download, or copy it to clipboard. Dark background,
// a row of lips in the list's own shades, and one tile per shade: its photo
// over a band of its color with the name and brand.
// `images` is the aligned array from loadWishlistImages (optional).
function drawShareImage(canvas, wishlist, images) {
  const W = 1080,
    H = 1350,
    M = 40;
  const INK = '#2A1A14',
    CREAM = '#FBF7F2';
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const n = wishlist.length;
  function lip(x, y, w, color, alpha = 1) {
    const s = w / 98;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x - s, y - 3 * s);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.fill(SHARE_LIP);
    ctx.restore();
  }
  const onColor = hex => luminance(hex) > 0.62 ? INK : '#FFFFFF';
  // Largest font size (down to min) at which the text fits, then clipped with …
  function fit(text, maxW, font, size, min) {
    while (size > min) {
      ctx.font = font(size);
      if (ctx.measureText(text).width <= maxW) break;
      size -= 1;
    }
    ctx.font = font(size);
    return clipToWidth(ctx, text, maxW);
  }
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // Row of lips across the top, cycling through the list's shades
  const lipW = 54,
    lipCount = 12,
    lipStep = (W - 2 * M) / lipCount;
  for (let i = 0; i < lipCount; i++) {
    lip(M + i * lipStep + (lipStep - lipW) / 2, 34, lipW, wishlist[i % n].hex);
  }

  // Title + count/date
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = CREAM;
  ctx.font = '400 italic 80px "Cormorant Garamond", serif';
  ctx.fillText('my lipstick shortlist', W / 2, 160);
  ctx.fillStyle = '#C9B3A6';
  ctx.font = '500 22px "DM Sans", sans-serif';
  const subtitle = `${n} ${n === 1 ? 'shade' : 'shades'}  ·  ${new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })}`;
  ctx.fillText(subtitle, W / 2, 200);

  // ── Tiles ────────────────────────────────────────────────────────────────
  const gTop = 236,
    gBot = H - 116;
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const gap = cols >= 4 ? 12 : 18;
  const cw = (W - 2 * M - gap * (cols - 1)) / cols;
  // Tiles stop at 1.3× as tall as wide so photos aren't cropped to strips;
  // a short grid sits in the middle of the space.
  const ch = Math.min(cw * 1.3, (gBot - gTop - gap * (rows - 1)) / rows);
  const gY = gTop + (gBot - gTop - rows * ch - gap * (rows - 1)) / 2;
  const sc = Math.min(1.25, Math.max(0.6, cw / 400));
  const band = Math.min(ch * 0.45, Math.max(86, 100 * sc));
  for (let i = 0; i < n; i++) {
    const p = wishlist[i];
    const row = Math.floor(i / cols),
      inRow = Math.min(cols, n - row * cols);
    const x = M + (cols - inRow) * (cw + gap) / 2 + i % cols * (cw + gap);
    const y = gY + row * (ch + gap);
    const photoH = ch - band;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, 18);
    ctx.clip();
    ctx.fillStyle = p.hex;
    ctx.fillRect(x, y, cw, ch);
    const img = images && images[i];
    if (img) {
      // Cover the photo area, on white so transparent photos keep a plain
      // background instead of showing the shade color through
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, y, cw, photoH);
      const s = Math.max(cw / img.naturalWidth, photoH / img.naturalHeight);
      const dw = img.naturalWidth * s,
        dh = img.naturalHeight * s;
      // Pinned to the top, so a tall photo loses its bottom rather than the
      // bullet or pencil tip; clipped so the cut edge doesn't spill over the band
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cw, photoH);
      ctx.clip();
      ctx.drawImage(img, x + (cw - dw) / 2, y, dw, dh);
      ctx.restore();
    } else {
      // No photo: a faded lip on the shade's color
      const lw = Math.min(cw * 0.5, photoH * 0.8 / SHARE_LIP_RATIO);
      lip(x + (cw - lw) / 2, y + (photoH - lw * SHARE_LIP_RATIO) / 2, lw, onColor(p.hex), 0.3);
    }
    const fg = onColor(p.hex);
    const tx = x + 18 * sc,
      tw = cw - 36 * sc;
    ctx.textAlign = 'left';
    ctx.fillStyle = fg;
    ctx.fillText(fit(p.shade, tw, s => `500 ${s}px "Cormorant Garamond", serif`, Math.max(26, Math.round(38 * sc)), 18), tx, y + photoH + band * 0.46);
    ctx.globalAlpha = 0.85;
    ctx.fillText(fit(p.brand.toUpperCase(), tw, s => `600 ${s}px "DM Sans", sans-serif`, Math.max(15, Math.round(18 * sc)), 12), tx, y + photoH + band * 0.78);
    ctx.restore();
  }

  // ── Footer: credit + site link ─────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = CREAM;
  ctx.font = '500 24px "DM Sans", sans-serif';
  ctx.fillText('made with Lipstick Color Finder', W / 2, H - 62);
  ctx.fillStyle = '#E7A9BF';
  ctx.font = '600 24px "DM Sans", sans-serif';
  ctx.fillText(SITE_URL, W / 2, H - 30);
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
  const dialogRef = useDialog(onClose);
  React.useEffect(() => {
    let cancelled = false;
    // Make sure custom fonts are loaded before drawing
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const imagesP = loadWishlistImages(wishlist);
    const paint = images => {
      if (cancelled || !canvasRef.current) return;
      drawShareImage(canvasRef.current, wishlist, images);
      setBusy(false);
    };
    ready.then(async () => {
      // Draw once fonts + photos are ready, but don't wait forever on a slow
      // proxied image — show the card after a short grace period and redraw
      // with the full set when the stragglers arrive.
      const grace = new Promise(res => setTimeout(() => res('grace'), 2500));
      const first = await Promise.race([imagesP, grace]);
      paint(first === 'grace' ? [] : first);
      if (first === 'grace') paint(await imagesP);
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
      window.gtag?.('event', 'share_wishlist', {
        method: 'image_save',
        item_count: wishlist.length
      });
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
      window.gtag?.('event', 'share_wishlist', {
        method: 'image_copy',
        item_count: wishlist.length
      });
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
    ref: dialogRef,
    tabIndex: -1,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Share your shortlist",
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
    "aria-label": "Close",
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
  }, "A portrait card sized for Instagram (4:5), with each lipstick photo, its shade, and a link back to ", SITE_URL, ". Save it and post it to your story, feed, or send it to a friend."), /*#__PURE__*/React.createElement("div", {
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
      color: 'var(--blush-deep)',
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

// ── "new" tag on the Guides links ─────────────────────────────────────────────
// A small pill badge that overlaps the link's top-right corner (the link needs
// position:relative). Switches itself off after GUIDES_NEW_UNTIL so it can't
// go stale.
const GUIDES_NEW_UNTIL = new Date('2026-11-16');
function GuidesNewTag({
  top = -8,
  right = -10
}) {
  if (new Date() > GUIDES_NEW_UNTIL) return null;
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": "New",
    style: {
      position: 'absolute',
      top,
      right,
      pointerEvents: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500,
      fontSize: 9,
      lineHeight: 1,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      color: '#fff',
      background: 'var(--blush-deep)',
      padding: '3px 6px 2px',
      borderRadius: 10,
      boxShadow: '0 0 0 2px var(--cream)'
    }
  }, "new");
}

// ── Dialogs ───────────────────────────────────────────────────────────────────
// What every panel that covers the page shares (the detail view, My Favorites, a shared list, the
// share card): Escape closes it, Tab stays inside it, the page behind does not scroll, and focus goes
// in when it opens and back to where it was when it closes. Only the topmost one answers the keys.
// Returns the ref for the panel's own element.
const dialogs = {
  open: [],
  pageOverflow: ''
};
function useDialog(onClose) {
  const ref = React.useRef(null);
  const close = React.useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const el = ref.current,
      opener = document.activeElement,
      me = {};
    if (dialogs.open.push(me) === 1) {
      dialogs.pageOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    const stops = () => [...el.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(n => n.getClientRects().length);
    (stops()[0] || el).focus({
      preventScroll: true
    });
    const onKey = e => {
      if (dialogs.open[dialogs.open.length - 1] !== me) return;
      if (e.key === 'Escape') return close.current();
      if (e.key !== 'Tab') return;
      const f = stops(),
        first = f[0],
        last = f[f.length - 1],
        at = document.activeElement;
      if (!first) return e.preventDefault();
      if (!el.contains(at) || (e.shiftKey ? at === first : at === last)) {
        e.preventDefault();
        (e.shiftKey && el.contains(at) ? last : first).focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      dialogs.open.splice(dialogs.open.indexOf(me), 1);
      if (!dialogs.open.length) document.body.style.overflow = dialogs.pageOverflow;
      if (opener && document.contains(opener)) opener.focus?.({
        preventScroll: true
      });
    };
  }, []);
  return ref;
}

// ── Back button ───────────────────────────────────────────────────────────────
// Changing tool adds a history entry, so Back returns to the previous tool instead of leaving
// the site (App, "Mirror what's on screen in the URL"). An open panel or sheet adds one too
// (useBackToClose), so Back closes it; closing it on screen takes that entry away again.
const backNav = {
  open: [],
  // open panels, innermost last
  leaving: 0,
  // panels closed on screen whose entries are still to be taken off
  skip: 0,
  // pops we caused ourselves by taking those entries off
  afterLeave: null,
  // a tool change that waits for those entries to go
  onTool: null,
  // App: Back or Forward landed on another tool
  syncUrl: null // App: write the current view to the address bar
};
window.addEventListener('popstate', e => {
  if (backNav.skip > 0) {
    // Panels can close a render apart (the detail view follows My Favorites); wait until the last entry is off
    if (--backNav.skip > 0 || backNav.leaving > 0) return;
    const then = backNav.afterLeave;
    backNav.afterLeave = null;
    if (then) then();else backNav.syncUrl?.();
    return;
  }
  const top = backNav.open.pop();
  if (!top) return backNav.onTool?.(e);
  top.popped = true;
  top.close();
  backNav.syncUrl?.();
});
function useBackToClose(onClose, enabled = true) {
  const close = React.useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!enabled) return;
    const entry = {
      close: () => close.current(),
      popped: false
    };
    backNav.open.push(entry);
    history.pushState(history.state, '');
    return () => {
      if (entry.popped) return;
      backNav.open.splice(backNav.open.indexOf(entry), 1);
      // Taken off after this render's effects, so a tool change made by the same click can wait its turn
      if (backNav.leaving++ === 0) queueMicrotask(() => {
        const n = backNav.leaving;
        backNav.leaving = 0;
        backNav.skip++;
        history.go(-n);
      });
    };
  }, [enabled]);
}

// ── Shared links ──────────────────────────────────────────────────────────────
// The URL mirrors what's on screen so it can be copied and sent:
//   ?color=a02523                 matches for a color (wheel, photo, hex, list)
//   ?wheel=classic-red            a wheel color by name, whatever its hex is today (guides link here)
//   ?brand=chanel&dupe=99+pirate  dupes for a product
//   ?mode=dupe                    the dupe finder, nothing picked yet (older links; now /dupe-finder/)
//   ?item=brand|shade&item=…      a shared favorites list
// Brands never contain '|' (shades can), so items split on the first one.
// Tools with a page of their own: the same app, opened in that mode. The path
// follows the mode as tabs change. Titles match the pages build-pages.js writes.
const MODE_PAGES = {
  wheel: {
    path: '/color-wheel/',
    title: 'Lipstick Color Wheel: Browse Shades by Color'
  },
  photo: {
    path: '/photo-match/',
    title: 'Find a Lipstick from a Photo: Match Any Lip Color'
  },
  dupe: {
    path: '/dupe-finder/',
    title: 'Lipstick Dupe Finder: Same Color, Any Price'
  },
  hex: {
    path: '/lipstick-color-chart/',
    title: 'Lipstick Color Chart: Nearly 17,000 Lipsticks by Color'
  }
};
const HOME_TITLE = 'Lipstick Color Finder: Any Lipstick or Dupe by Color';
const PAGE_MODE = Object.keys(MODE_PAGES).find(m => window.location.pathname.startsWith(MODE_PAGES[m].path)) || null;
function parseSharedLink(search) {
  const q = new URLSearchParams(search);
  const color = q.get('color'),
    brand = q.get('brand'),
    dupe = q.get('dupe');
  // The From Favorites tab: favorites live in this browser, so it is an address to come back to, not to share
  if (q.get('mode') === 'favorites') {
    const pick = q.get('pick') || '',
      i = pick.indexOf('|');
    return {
      type: 'favorites',
      pick: i > 0 ? {
        brand: pick.slice(0, i),
        shade: pick.slice(i + 1)
      } : null
    };
  }
  if (color && /^[0-9a-f]{6}$/i.test(color)) return {
    type: 'color',
    hex: '#' + color.toLowerCase()
  };
  const wheel = q.get('wheel');
  if (wheel) {
    const c = LIPSTICK_DATA.find(c => c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === wheel.toLowerCase());
    if (c) return {
      type: 'color',
      hex: c.hex.toLowerCase()
    };
  }
  if (brand && dupe) return {
    type: 'dupe',
    brand,
    shade: dupe
  };
  if (q.get('mode') === 'dupe') return {
    type: 'dupe'
  };
  // Older links packed the list as ?list=brand|shade,brand|shade — best effort,
  // since a few names contain commas
  const items = q.getAll('item').length ? q.getAll('item') : (q.get('list') || '').split(',').filter(Boolean);
  const keys = items.map(it => {
    const i = it.indexOf('|');
    return i > 0 ? {
      brand: it.slice(0, i),
      shade: it.slice(i + 1)
    } : null;
  }).filter(Boolean);
  if (keys.length) return {
    type: 'list',
    keys
  };
  return null;
}
function findProduct(brand, shade) {
  const b = brand.toLowerCase(),
    s = shade.toLowerCase();
  return REAL_PRODUCTS.find(p => p.brand.toLowerCase() === b && p.shade.toLowerCase() === s) || null;
}
function sharedListUrl(wishlist) {
  const q = new URLSearchParams();
  wishlist.forEach(p => q.append('item', `${p.brand}|${p.shade}`));
  return `${window.location.origin}${window.location.pathname}?${q}`;
}

// ── Red label ─────────────────────────────────────────────────────────────────
// "bright orange-red", "deep blue-red"… for any color the red guide counts as a
// red (tone words as the guide uses them); null for everything else.
const RED_TONES = {
  blue: 'blue-red',
  true: 'true red',
  orange: 'orange-red'
};
function redLabel(hex) {
  const red = hex ? redKind(hex) : null;
  return red ? `${red.depth} ${RED_TONES[red.tone]}` : null;
}
const RED_LABEL_STYLE = {
  fontFamily: 'DM Sans',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--blush-deep)'
};

// Words on a band of color `hex`: white or the dark brown, whichever contrasts
// more (WCAG contrast ratio). Deep shades get white; pinks, corals and nudes get brown.
function bandInk(hex) {
  const lum = h => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ESPRESSO = '#2A1A14',
    L = lum(hex);
  return 1.05 / (L + 0.05) >= (L + 0.05) / (lum(ESPRESSO) + 0.05) ? '#fff' : 'var(--espresso)';
}

// One saved shade — used by My Favorites and the shared-list panel.
// Photo on the left at full height; to its right, a band in the shade's own
// color carries "Brand · shade" (after the back of the "nine kinds" cards in the
// red guide), with everything else below it.
// Sizes, each with one job: title 18 for the brand, shade 15 for the shade name,
// body 13 for the product, micro 11 for facts and the red label.
const SHADE_ITEM_TYPE = {
  micro: 11,
  body: 13,
  shade: 15,
  title: 18
};
function ShadeListItem({
  p,
  action,
  glow
}) {
  const TYPE = SHADE_ITEM_TYPE;
  const redName = redLabel(p.hex);
  const facts = [(p.finish || '').trim(), p.price_tier, p.hex.toUpperCase(), p.discontinued && 'Discontinued'].filter(Boolean);
  const ink = bandInk(p.hex);
  return /*#__PURE__*/React.createElement("li", {
    className: glow ? 'first-heart-glow' : undefined,
    style: {
      display: 'flex',
      alignItems: 'stretch',
      background: '#fff',
      borderRadius: 14,
      border: '1px solid var(--border)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 112,
      minHeight: 112,
      flexShrink: 0,
      background: 'var(--cream-dark)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 8
    }
  }, /*#__PURE__*/React.createElement(ProductThumb, {
    product: p,
    width: "100%",
    height: "100%",
    fit: "contain",
    radius: 0,
    ring: false,
    tint: false
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: p.hex,
      color: ink,
      padding: '8px 14px 7px',
      fontFamily: 'Cormorant Garamond',
      fontWeight: 500,
      lineHeight: 1.15,
      textTransform: 'capitalize',
      fontVariantNumeric: 'lining-nums' // shade names are often numbers ("999", "0 Ultra Light")
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: srOnly
  }, "Brand: "), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: TYPE.title
    }
  }, p.brand), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      margin: '0 7px',
      opacity: 0.75
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: srOnly
  }, "Shade: "), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: TYPE.shade
    }
  }, p.shade)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '9px 14px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'DM Sans'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: TYPE.body,
      lineHeight: 1.35,
      color: 'var(--text-body)',
      textTransform: 'capitalize'
    }
  }, p.product), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: TYPE.micro,
      color: 'var(--text-muted)',
      letterSpacing: '0.04em',
      marginTop: 5
    }
  }, facts.join(' · ')), redName && /*#__PURE__*/React.createElement("div", {
    style: {
      ...RED_LABEL_STYLE,
      fontSize: TYPE.micro,
      marginTop: 4
    }
  }, redName)), /*#__PURE__*/React.createElement("div", null, action))));
}

// ── Wishlist Panel ────────────────────────────────────────────────────────────
// `glowKey` ("brand|shade") is set the first time a visitor ever hearts a
// shade: the panel opens by itself, that row glows and a line says where the
// list lives.
function WishlistPanel({
  wishlist,
  onClose,
  onRemove,
  onClear,
  onFindSimilar,
  glowKey
}) {
  const [copied, setCopied] = useState(null);
  const [showShareImage, setShowShareImage] = useState(false);
  useBackToClose(onClose);
  const dialogRef = useDialog(onClose);

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
    const url = sharedListUrl(wishlist);
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

  // In <body>, like MatchDetail, so the panel can open over a result's detail view (the first heart does that)
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(42,26,20,0.35)',
      zIndex: 200,
      backdropFilter: 'blur(2px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: dialogRef,
    tabIndex: -1,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "My Favorites",
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
  }, /*#__PURE__*/React.createElement("style", null, `
          @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
          @keyframes firstHeartGlow {
            0%, 100% { box-shadow: 0 0 0 2px var(--blush), 0 0 0 0 var(--blush); }
            50%      { box-shadow: 0 0 0 2px var(--blush), 0 0 22px 4px var(--blush); }
          }
          .first-heart-glow { border-color: var(--blush) !important; animation: firstHeartGlow 1.3s ease-in-out 0.3s 3 both; }
          @media (prefers-reduced-motion: reduce) {
            .first-heart-glow { animation: none; box-shadow: 0 0 0 2px var(--blush); }
          }
        `), /*#__PURE__*/React.createElement("div", {
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
  }, HEART), /*#__PURE__*/React.createElement("h2", {
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
    "aria-label": "Close My Favorites",
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
  }, glowKey && /*#__PURE__*/React.createElement("li", {
    role: "status",
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 18,
      fontStyle: 'italic',
      lineHeight: 1.4,
      color: 'var(--espresso)',
      marginBottom: 6
    }
  }, "Saved. Every shade you heart is kept here \u2014 open it any time from My Favorites at the top."), wishlist.map((p, i) => /*#__PURE__*/React.createElement(ShadeListItem, {
    key: i,
    p: p,
    glow: glowKey === `${p.brand}|${p.shade}`,
    action: /*#__PURE__*/React.createElement("button", {
      onClick: () => onRemove(p),
      title: "Remove from My Favorites",
      "aria-label": `Remove ${p.brand} ${p.shade} from My Favorites`,
      style: heartBtnStyle(true)
    }, HEART)
  })), /*#__PURE__*/React.createElement("li", {
    style: {
      textAlign: 'center',
      padding: '10px 0 4px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onFindSimilar,
    style: {
      border: 'none',
      background: 'none',
      padding: '6px 4px',
      cursor: 'pointer',
      color: 'var(--blush-deep)',
      fontFamily: 'DM Sans',
      fontSize: 13,
      fontWeight: 500,
      textDecoration: 'underline',
      textUnderlineOffset: 3
    }
  }, "Find shades similar to ", wishlist.length === 1 ? 'this one' : 'these', " \u2192")))), wishlist.length > 0 && /*#__PURE__*/React.createElement("div", {
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
      e.currentTarget.style.color = 'var(--blush-deep)';
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
  })), document.body);
}

// ── Shared List Panel ─────────────────────────────────────────────────────────
// Someone else's favorites, opened from a ?item=… link. Kept apart from the
// viewer's own list; they can save shades one by one or all at once.
function SharedListPanel({
  items,
  missing,
  loading,
  wishlist,
  toggleWishlist,
  onSaveAll,
  onClose
}) {
  const key = p => `${p.brand}|${p.shade}`;
  const saved = new Set(wishlist.map(key));
  const unsaved = (items || []).filter(p => !saved.has(key(p)));
  const dialogRef = useDialog(onClose);
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
    ref: dialogRef,
    tabIndex: -1,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Shared list",
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
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontWeight: 400,
      fontSize: 26,
      color: 'var(--espresso)'
    }
  }, "Shared list"), items && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.06em'
    }
  }, items.length, " ", items.length === 1 ? 'shade' : 'shades'), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close shared list",
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
  }, loading ? /*#__PURE__*/React.createElement(CatalogueLoading, null) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 16,
      color: 'var(--text-muted)',
      marginBottom: 14
    }
  }, "Someone shared these shades with you. Tap a heart to save one to your favorites."), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, items.map(p => {
    const isSaved = saved.has(key(p));
    return /*#__PURE__*/React.createElement(ShadeListItem, {
      key: key(p),
      p: p,
      action: /*#__PURE__*/React.createElement("button", {
        onClick: () => toggleWishlist(p),
        title: isSaved ? 'Remove from favorites' : 'Save to favorites',
        "aria-pressed": isSaved,
        "aria-label": `${isSaved ? 'Remove' : 'Save'} ${p.brand} ${p.shade} ${isSaved ? 'from' : 'to'} My Favorites`,
        style: heartBtnStyle(isSaved)
      }, isSaved ? HEART : '♡')
    });
  })), missing > 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      marginTop: 14,
      fontFamily: 'DM Sans'
    }
  }, missing, " ", missing === 1 ? 'shade is' : 'shades are', " no longer in the catalogue."))), !loading && items.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border)',
      padding: '20px 32px 24px',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onSaveAll,
    disabled: !unsaved.length,
    style: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 12,
      border: '1.5px solid var(--blush-deep)',
      background: unsaved.length ? 'var(--blush-deep)' : 'transparent',
      color: unsaved.length ? '#fff' : 'var(--blush-deep)',
      cursor: unsaved.length ? 'pointer' : 'default',
      fontFamily: 'DM Sans',
      fontSize: 13,
      fontWeight: 500
    }
  }, unsaved.length ? `${HEART} Save ${unsaved.length === items.length ? 'all' : unsaved.length} to my favorites` : `${HEART} All saved to your favorites`))));
}

// ── Comparison Tray ────────────────────────────────────────────────────────────
const TRAY_TYPE = {
  micro: 11,
  body: 13,
  title: 18
};
function ComparisonTray({
  pinnedItems,
  onRemove,
  onClear
}) {
  const TYPE = TRAY_TYPE;
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
      // Hidden once it has slid away, so its buttons can't be tabbed to while it is off-screen
      visibility: isVisible ? 'visible' : 'hidden',
      transition: 'transform 0.35s cubic-bezier(0.34,1.26,0.64,1)' + (isVisible ? '' : ', visibility 0s linear 0.35s'),
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
      padding: expanded ? '20px 40px 24px' : '12px 40px 14px',
      transition: 'padding 0.25s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: expanded ? 20 : 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: TYPE.title,
      fontWeight: 500,
      color: 'var(--espresso)',
      whiteSpace: 'nowrap'
    }
  }, "Comparing ", pinnedItems.length, " shade", pinnedItems.length !== 1 ? 's' : ''), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: TYPE.micro,
      color: 'var(--text-muted)',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap'
    }
  }, "\xB7 up to ", MAX_COMPARE), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpanded(e => !e),
    "aria-expanded": expanded,
    style: {
      fontSize: TYPE.micro,
      padding: '4px 12px',
      borderRadius: 20,
      border: '1px solid var(--border)',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      whiteSpace: 'nowrap'
    }
  }, expanded ? 'Collapse' : 'Expand'), /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    style: {
      fontSize: TYPE.micro,
      padding: '4px 12px',
      borderRadius: 20,
      border: '1px solid var(--blush-deep)',
      background: 'transparent',
      color: 'var(--blush-deep)',
      cursor: 'pointer',
      fontFamily: 'DM Sans',
      whiteSpace: 'nowrap'
    }
  }, "Clear all"))), (() => {
    const sortedPins = [...pinnedItems].sort((a, b) => a.distance - b.distance);
    const box = expanded ? 80 : 52;
    return /*#__PURE__*/React.createElement("div", {
      className: "compare-row",
      style: {
        display: 'flex',
        gap: expanded ? 20 : 14,
        alignItems: 'flex-start',
        overflowX: 'auto',
        padding: '6px 6px 2px 0'
      }
    }, sortedPins.map(p => /*#__PURE__*/React.createElement("button", {
      key: `${p.brand}|${p.shade}`,
      type: "button",
      onClick: () => onRemove(p),
      "aria-label": `Remove ${p.brand} ${p.shade} from comparison`,
      title: "Remove from comparison",
      style: {
        flex: 'none',
        width: expanded ? 96 : 76,
        padding: 0,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: expanded ? 8 : 6,
        fontFamily: 'DM Sans',
        textAlign: 'center',
        animation: 'fadeUp 0.2s ease'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        display: 'block',
        width: box,
        height: box
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        width: '100%',
        height: '100%',
        borderRadius: expanded ? 16 : 12,
        background: p.hex,
        boxShadow: `0 4px 16px ${p.hex}80, inset 0 -2px 4px rgba(0,0,0,0.12)`,
        border: '2.5px solid #fff',
        outline: '1.5px solid var(--border)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'var(--espresso)',
        color: '#FAF6F1',
        boxShadow: '0 0 0 2px #fff',
        fontSize: TYPE.body,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, "\xD7")), expanded && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        width: box,
        height: 64,
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--cream-dark)'
      }
    }, /*#__PURE__*/React.createElement(ProductThumb, {
      product: p,
      width: "100%",
      height: "100%",
      fit: "contain",
      radius: 0,
      ring: false,
      tint: false
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: TYPE.body,
        color: 'var(--espresso)',
        lineHeight: 1.25,
        textTransform: 'capitalize',
        display: '-webkit-box',
        WebkitLineClamp: expanded ? 2 : 1,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        overflowWrap: 'anywhere'
      }
    }, p.shade), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: TYPE.micro,
        color: 'var(--text-muted)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, p.brand), expanded && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: TYPE.micro,
        color: 'var(--text-muted)'
      }
    }, "\u0394E ", p.distance.toFixed(1))))), Array.from({
      length: Math.max(0, MAX_COMPARE - pinnedItems.length)
    }).map((_, i) => /*#__PURE__*/React.createElement("div", {
      key: `empty-${i}`,
      className: "compare-empty",
      style: {
        width: box,
        height: box,
        margin: expanded ? '0 8px' : '0 12px',
        borderRadius: expanded ? 16 : 12,
        border: '2px dashed var(--border)',
        background: 'transparent',
        flexShrink: 0,
        opacity: 0.4
      }
    })));
  })()));
}

// ── List Picker ─────────────────────────────────────────────────────────
// Grid of saved-shade tiles; clicking one uses its color as the seed. Kept
// compact so the selected shade's card fits below.
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
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: 21,
      color: 'var(--espresso-mid)',
      lineHeight: 1.4,
      textAlign: 'center',
      marginBottom: 14
    }
  }, "Pick a saved shade to find similar ones"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(124px, 1fr))',
      gap: 10
    }
  }, wishlist.map((p, i) => {
    const key = `${p.brand}|${p.shade}`;
    const isSel = key === selectedKey;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => onPick(p),
      "aria-pressed": isSel,
      style: {
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        background: isSel ? 'var(--cream-dark)' : '#fff',
        cursor: 'pointer',
        padding: 0,
        borderRadius: 12,
        overflow: 'hidden',
        border: isSel ? '2px solid var(--blush-deep)' : '1px solid var(--border)',
        margin: isSel ? 0 : 1,
        // keeps tiles the same size whichever border they have
        transition: 'background 0.15s'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        width: '100%',
        height: 36,
        background: p.hex,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 10px 10px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 11,
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase'
      }
    }, p.brand), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--espresso)',
        lineHeight: 1.25
      }
    }, p.shade), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 12,
        color: 'var(--espresso-mid)',
        lineHeight: 1.3
      }
    }, chartColorName(p.hex))));
  })));
}

// ── Photo Picker ───────────────────────────────────────────────────────────
// Upload an image, click anywhere on it to sample a color (trimmed median over an
// adjustable radius). The sampled hex is passed up via onColor.
// The photo canvas is read as Display P3 so iPhone photos keep their full
// gamut, but hexes (and hexToLab) are sRGB — convert before matching, or
// every sampled color reads as less saturated than it really is.
// Takes 0–255 P3 channels; returns clamped 0–255 sRGB integers.
function p3ToSrgb([r, g, b]) {
  const lin = v => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const enc = v => {
    v = Math.min(1, Math.max(0, v));
    return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
  };
  const lr = lin(r),
    lg = lin(g),
    lb = lin(b);
  return [enc(1.2249401 * lr - 0.2249404 * lg), enc(-0.0420569 * lr + 1.0420571 * lg), enc(-0.0196376 * lr - 0.0786361 * lg + 1.0982735 * lb)];
}
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
  // Shown in the drop zone when a file is not a picture, or is one this browser cannot open (HEIC outside Safari)
  const [error, setError] = React.useState(false);
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.gtag?.('event', 'photo_upload_error', {
        reason: 'not_image'
      });
      return setError(true);
    }
    window.gtag?.('event', 'photo_uploaded');
    const reader = new FileReader();
    reader.onload = e => {
      setError(false);
      setSrc(e.target.result);
      setPoint(null);
      onColor(null);
    };
    reader.onerror = () => setError(true);
    reader.readAsDataURL(file);
  }
  function onImgError() {
    window.gtag?.('event', 'photo_upload_error', {
      reason: 'cannot_open'
    });
    setSrc(null);
    setPoint(null);
    onColor(null);
    setError(true);
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

    // A plain average blends in shine, lip-line shadows, and skin at the edges.
    // Instead: keep pixels inside the circle, convert to LAB, drop the lightest
    // and darkest 15% (highlights / creases), and take the per-channel median.
    const labs = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x0 + x + 0.5 - px,
        dy = y0 + y + 0.5 - py;
      if (dx * dx + dy * dy > r * r) continue;
      const i = (y * w + x) * 4;
      const hex = '#' + p3ToSrgb([data[i], data[i + 1], data[i + 2]]).map(v => v.toString(16).padStart(2, '0')).join('');
      labs.push(hexToLab(hex));
    }
    if (!labs.length) return;
    labs.sort((p, q) => p[0] - q[0]);
    const trim = Math.floor(labs.length * 0.15);
    const kept = labs.slice(trim, labs.length - trim);
    const median = ch => {
      const v = kept.map(l => l[ch]).sort((p, q) => p - q);
      const m = v.length >> 1;
      return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
    };
    onColor(labToHex(median(0), median(1), median(2)));
  }
  function onImgClick(e) {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    // The photo is fitted inside the square box (objectFit: contain), so a tall or wide one
    // has empty bands beside it: measure the tap from the photo's own edge, not the box's
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    const x = e.clientX - rect.left - (rect.width - canvas.width * scale) / 2;
    const y = e.clientY - rect.top - (rect.height - canvas.height * scale) / 2;
    const px = x / scale,
      py = y / scale;
    if (px < 0 || py < 0 || px > canvas.width || py > canvas.height) return; // a tap on an empty band
    // The marker is placed in percent of the box so it stays on its spot when the box resizes
    setPoint({
      x: px,
      y: py,
      left: (e.clientX - rect.left) / rect.width * 100,
      top: (e.clientY - rect.top) / rect.height * 100
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
      role: "button",
      tabIndex: 0,
      "aria-label": "Upload a photo or screenshot",
      onKeyDown: e => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      },
      style: {
        width: '100%',
        maxWidth: 380,
        aspectRatio: '1/1',
        outlineOffset: 4,
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
    }, "or click to upload \xB7 JPG, PNG, HEIC"), error ? /*#__PURE__*/React.createElement("div", {
      role: "alert",
      style: {
        fontFamily: 'DM Sans',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--blush-deep)',
        maxWidth: 280,
        marginTop: 8,
        lineHeight: 1.5
      }
    }, "We couldn't open that file. Try a JPG or PNG, or take a screenshot of it and upload that.") : /*#__PURE__*/React.createElement("div", {
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
      onChange: e => {
        handleFile(e.target.files?.[0]);
        e.target.value = '';
      }
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
    onError: onImgError,
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
      left: `${point.left}%`,
      top: `${point.top}%`,
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
// ── Shade explorer (Custom color tab, /lipstick-color-chart/) ────────────────
// A map of every hue at one depth (CIELAB a* across, b* up) with a depth bar.
// The draft color lives in App so the map and its summary — the card beside it on
// desktop, the bar under it when the columns stack — describe the same pick.
// Results only load when the visitor asks for them, and appear underneath.
// ZOOM: half-width of the close-up; GRID: spacing of its dots, wide enough apart that neighbors look different
const EXPLORER = {
  LMIN: 8,
  LMAX: 95,
  SPAN: 80,
  ZOOM: 20,
  GRID: 5
};
// input: 16px keeps iOS from zooming the page on focus. title: the picked color's name on the card.
const EXPLORER_TYPE = {
  eyebrow: 11,
  micro: 11,
  link: 12,
  body: 13,
  caption: 14,
  input: 16,
  lede: 21,
  title: 30
};
const EXPLORER_STARTS = [['Red', '#b5252c'], ['Pink', '#d66796'], ['Berry', '#7d2349'], ['Coral', '#d77749'], ['Brown', '#b4856b'], ['Plum', '#5c3069'], ['Blue', '#004590'], ['Black', '#1f1f1f']];
// Start-from families that open a Tone and a Depth row: hue (degrees) for [warm, neutral, cool], chroma,
// and which depth a tap on the family opens on. The numbers are chosen so the card names each pick the
// way its chips do (describeColor); Red has its own depths, the red guide's bright / classic / deep.
// No chip may land on another family: a pink below lightness 40 is named berry, so Pink's Deep stops
// at 43, and Berry has only its deep depth (lighter ones are pinks) and so no Depth row.
// Blue and Black have no rows: they jump to their EXPLORER_STARTS color.
const START_TONES = ['Warm', 'Neutral', 'Cool'];
const START_DEPTHS = [['Light', 68], ['Medium', 52], ['Deep', 34]];
const START_FAMILIES = {
  Red: {
    hues: [37, 30, 23],
    C: 64,
    depths: [['Bright', 50], ['Medium', 42], ['Deep', 32]],
    open: 1
  },
  Pink: {
    hues: [5.5, 354.5, 343.5],
    C: 45,
    depths: [['Light', 68], ['Medium', 52], ['Deep', 43]],
    open: 1
  },
  Berry: {
    hues: [10, 358, 346],
    C: 40,
    depths: [['Deep', 34]],
    open: 0
  },
  Coral: {
    hues: [56, 51, 46],
    C: 50,
    open: 1
  },
  Brown: {
    hues: [70, 55, 40],
    C: 20,
    open: 1
  },
  Plum: {
    hues: [329, 320, 311],
    C: 35,
    open: 2
  }
};
// Sunflower layout, same spacing as the color guide card, carried out to the corners of the
// square: the most vivid reds sit beyond the circle that would fit inside it.
const EXPLORER_SEEDS = (() => {
  const {
      SPAN
    } = EXPLORER,
    RMAX = SPAN * Math.SQRT2,
    N = Math.round(560 * 2 / (0.96 * 0.96)),
    EDGE = SPAN * 0.97,
    out = [];
  for (let i = 0; i < N; i++) {
    const r = RMAX * Math.sqrt((i + 0.5) / N),
      t = i * 2.39996323;
    const a = r * Math.cos(t),
      b = r * Math.sin(t);
    if (Math.abs(a) <= EDGE && Math.abs(b) <= EDGE) out.push([a, b]);
  }
  return out;
})();
function labInGamut(L, a, b) {
  const {
    x,
    y,
    z
  } = labToXyz(L, a, b);
  const rgb = xyzToLinearRgb(x, y, z);
  return [rgb.r, rgb.g, rgb.b].every(c => c >= -0.002 && c <= 1.002);
}
// Pull a color toward gray until a screen can show it
function fitToGamut(L, a, b) {
  if (labInGamut(L, a, b)) return [a, b];
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 16; i++) {
    const m = (lo + hi) / 2;
    if (labInGamut(L, a * m, b * m)) lo = m;else hi = m;
  }
  return [a * lo, b * lo];
}

// "Red" is only what the red guide counts as red (redKind). Reddish colors that miss it
// (too muted, too light, too dark) take the name of the family beside them.
function colorFamily(L, a, b) {
  const C = Math.hypot(a, b);
  let h = Math.atan2(b, a) * 180 / Math.PI;
  if (h < 0) h += 360;
  if (C < 12) return L < 22 ? 'black' : L > 88 ? 'white' : 'gray';
  if (redKind(labToHex(L, a, b))) return 'red';
  if (C < 24 && h < 90 || C < 30 && h >= 20 && h < 90) return 'brown';
  if (C < 30 && (h >= 330 || h < 20)) return 'mauve';
  if (h >= 305 && h < 335) return L < 40 ? 'plum' : 'purple';
  if (h >= 335 || h < 14) return L < 40 ? 'berry' : 'pink';
  if (h < 30) return L < 40 ? 'berry' : 'rose';
  if (h < 60) return L < 45 ? 'brick' : 'coral';
  if (h < 85) return L < 45 ? 'rust' : 'orange';
  if (h < 115) return L >= 82 ? 'yellow' : 'olive';
  if (h < 230) return 'green';
  return 'blue';
}
// Very dark and nearly colorless. The eye can't tell these apart, though the distance formula
// can, so a black pick on the map or the wheel is matched to every black lipstick (see shadeMatchInfo).
function isBlackLab(lab) {
  return !!lab && lab.every(Number.isFinite) && colorFamily(lab[0], lab[1], lab[2]) === 'black';
}
// Per family: [neutral center, "clearly leaning" threshold, band start, band end], in hue degrees.
// A family only gets "warm"/"cool" when the hue is clearly off-center and at least 3° inside
// its band, so a name never points back at the neighboring family.
const FAMILY_TONE = {
  pink: [354.5, 8, 335, 14],
  berry: [358, 9, 335, 30],
  coral: [51, 3, 30, 60],
  brick: [51, 4, 30, 60],
  rust: [72.5, 6, 60, 85],
  orange: [72.5, 6, 60, 85],
  brown: [55, 12, 20, 90],
  mauve: [355, 10, 330, 20],
  plum: [320, 6, 305, 335],
  purple: [320, 6, 305, 335],
  blue: [285, 10, 230, 305]
};
function familyTone(fam, h) {
  const c = FAMILY_TONE[fam];
  if (!c) return '';
  const w = (c[3] - c[2] + 360) % 360,
    d = (h - c[2] + 360) % 360;
  if (d > w || Math.min(d, w - d) < 3) return '';
  const off = (h - c[0] + 540) % 360 - 180;
  return off > c[1] ? 'warm' : off < -c[1] ? 'cool' : '';
}
// "Deep cool berry", "Light coral", "Black"; a red is worded as the red guide does, minus
// its middle depth word: "classic" read as a tone here, so that depth is just "True red", "Blue-red"
function describeColor(L, a, b) {
  const fam = colorFamily(L, a, b);
  if (fam === 'red') {
    const red = redLabel(labToHex(L, a, b)).replace(/^classic /, '');
    return red[0].toUpperCase() + red.slice(1);
  }
  let h = Math.atan2(b, a) * 180 / Math.PI;
  if (h < 0) h += 360;
  const tone = familyTone(fam, h);
  const name = ['black', 'white', 'gray'].includes(fam) ? fam : `${L < 45 ? 'deep' : L <= 60 ? 'medium' : 'light'} ${tone ? tone + ' ' : ''}${fam}`;
  return name[0].toUpperCase() + name.slice(1);
}

// A draft is the depth plus the spot aimed at on the map; the color shown is that
// spot pulled into what a screen can display at that depth.
function draftFromLab([L, a, b]) {
  return {
    L: Math.max(EXPLORER.LMIN, Math.min(EXPLORER.LMAX, L)),
    ta: a,
    tb: b
  };
}
// The color chart's name for a hex ("Medium warm pink"), as its card shows it
function chartColorName(hex) {
  return draftColor(draftFromLab(hexToLab(hex))).name;
}
function draftColor(draft) {
  const [a, b] = fitToGamut(draft.L, draft.ta, draft.tb);
  return {
    L: draft.L,
    a,
    b,
    hex: labToHex(draft.L, a, b),
    name: describeColor(draft.L, a, b)
  };
}

// The color a Start-from family gives at one tone (index into START_TONES) and depth (index into its depths)
function startLab(fam, ti, di) {
  const f = START_FAMILIES[fam],
    L = (f.depths || START_DEPTHS)[di][1],
    r = f.hues[ti] * Math.PI / 180;
  return [L, ...fitToGamut(L, f.C * Math.cos(r), f.C * Math.sin(r))];
}

// How many lipsticks the results would show for this color, and the nearest one. Same
// rule as the results (matchBand over the closest 500, minus discontinued shades, which
// the results hide until asked). One pass and normally no sorting, so it can run while
// the dot is dragged. A black pick counts every black lipstick instead, as the results do.
function shadeMatchInfo(hex, maxDeltaE) {
  const lab = hexToLab(hex),
    black = isBlackLab(lab);
  let rows = [],
    best = Infinity,
    nearest = null,
    blacks = 0;
  for (const p of REAL_PRODUCTS) {
    const d = deltaE(lab, p.lab);
    rows.push([d, p.discontinued]);
    if (d < best) {
      best = d;
      nearest = p;
    }
    if (black && !p.discontinued && isBlackLab(p.lab)) blacks++;
  }
  if (black) return {
    hex,
    best,
    nearest,
    black,
    count: blacks
  };
  let band = rows.filter(r => r[0] <= bandCut(best, maxDeltaE, lab));
  // Fewer than five in the band shows the closest five; more than 500 shows the closest 500
  if (band.length < 5 || band.length > 500) band = rows.sort((a, b) => a[0] - b[0]).slice(0, band.length < 5 ? 5 : 500);
  return {
    hex,
    best,
    nearest,
    count: band.filter(r => !r[1]).length
  };
}
// What the card and the bar say about the current pick
function shadeSummary(info) {
  if (!info) return {
    loading: true,
    text: 'Loading the catalogue…'
  };
  if (info.best > NO_MATCH_DELTA_E && !info.black || !info.count) return {
    noMatch: true,
    text: 'No close matches here.',
    nearHex: info.nearest.hex
  };
  const n = info.count.toLocaleString('en-US');
  return {
    n,
    text: `${n} close ${info.count === 1 ? 'match' : 'matches'}`,
    cta: `See ${n} matching ${info.count === 1 ? 'lipstick' : 'lipsticks'} →`
  };
}
const EXPLORER_CTA = {
  fontFamily: 'DM Sans',
  fontSize: EXPLORER_TYPE.link,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'var(--espresso)',
  color: 'var(--cream)',
  border: 'none',
  borderRadius: 40,
  cursor: 'pointer'
};

// Custom color map use, so visitors who explore without asking for results still show up in analytics.
// Moving the dot or the depth bar sends one event per visit, not one per drag step.
const exploreSent = new Set();
function trackExplore(action, params, once) {
  if (once) {
    if (exploreSent.has(action)) return;
    exploreSent.add(action);
  }
  window.gtag?.('event', 'shade_explore', {
    action,
    ...params
  });
}
function ShadeExplorer({
  draft,
  color,
  origin,
  zoom,
  onZoom,
  info,
  committed,
  pinned,
  onDraft,
  onStep,
  onCommit,
  onJump
}) {
  const {
      LMIN,
      LMAX,
      SPAN,
      ZOOM,
      GRID
    } = EXPLORER,
    TYPE = EXPLORER_TYPE;
  const [stacked, setStacked] = useState(() => window.innerWidth <= 900);
  const [depthFocus, setDepthFocus] = useState(false);
  const [liveMsg, setLiveMsg] = useState('');
  // The last Start-from family pick. Its Tone and Depth rows stay until another family is chosen: they sit
  // above the map, so taking them away while the dot is dragged would slide the map out from under the pointer.
  // Their chips are only marked while the dot is still on the color they picked (onStart).
  const [start, setStart] = useState(null); // { fam, ti, di, hex }
  const sel = start,
    onStart = !!start && start.hex === color.hex;
  const mapEl = React.useRef(null);
  const drag = React.useRef({}); // mouse: dragging the map · dot: dragging the marker · tap: a touch that may still be a tap

  useEffect(() => {
    const onResize = () => setStacked(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Stacked layout: when the results sheet opens, bring the map to the top of the screen so it shows above the sheet
  useEffect(() => {
    if (!committed || !stacked) return;
    const t = setTimeout(() => {
      if (!mapEl.current) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: mapEl.current.getBoundingClientRect().top + window.scrollY - 12,
        behavior: reduce ? 'auto' : 'smooth'
      });
    }, 80);
    return () => clearTimeout(t);
  }, [committed]);
  const summary = shadeSummary(info);
  const before = origin && draftColor(origin),
    moved = !!before && before.hex !== color.hex;
  const hexLabel = color.hex.toUpperCase();
  // One announcement after the visitor pauses, not one per drag step
  useEffect(() => {
    const t = setTimeout(() => setLiveMsg(`${color.name}, ${summary.text}`), 700);
    return () => clearTimeout(t);
  }, [color.name, summary.text]);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // The map shows the whole a*b* square, or, zoomed, the close-up around where the pick was
  const ca = zoom ? zoom.a : 0,
    cb = zoom ? zoom.b : 0,
    half = zoom ? ZOOM : SPAN;
  const px = v => ((v - ca + half) / (2 * half) * 100).toFixed(2) + '%';
  const py = v => ((cb + half - v) / (2 * half) * 100).toFixed(2) + '%';
  // Picks made in the close-up are steps: they keep the color chosen before zooming for "Return to"
  const send = zoom ? onStep : onDraft;
  function moveTo(a, b) {
    // Each dot stands for the colors around it: a pick on the map lands on the nearest dot, so two
    // picks are either the same shade or visibly different (a typed hex code is still exact)
    trackExplore(zoom ? 'map_closeup' : 'map', {}, true);
    if (dots.length) {
      const d = dots.reduce((best, dot) => Math.hypot(dot.a - a, dot.b - b) < Math.hypot(best.a - a, best.b - b) ? dot : best);
      return send({
        L: draft.L,
        ta: d.a,
        tb: d.b
      });
    }
    const [fa, fb] = fitToGamut(draft.L, clamp(a, Math.max(-SPAN, ca - half), Math.min(SPAN, ca + half)), clamp(b, Math.max(-SPAN, cb - half), Math.min(SPAN, cb + half)));
    send({
      L: draft.L,
      ta: fa,
      tb: fb
    });
  }
  function fromPoint(x, y) {
    const r = mapEl.current.getBoundingClientRect();
    moveTo(ca + ((x - r.left) / r.width * 2 - 1) * half, cb + (1 - (y - r.top) / r.height * 2) * half);
  }
  // A pick that lands outside the close-up (a chip, a hex code, a change of depth) brings the close-up with it
  useEffect(() => {
    if (zoom && (Math.abs(color.a - zoom.a) > ZOOM || Math.abs(color.b - zoom.b) > ZOOM)) onZoom({
      a: color.a,
      b: color.b
    });
  }, [color.a, color.b, zoom]);
  const isTap = e => drag.current.tap && Math.hypot(e.clientX - drag.current.tap.x, e.clientY - drag.current.tap.y) <= 10;
  const Lk = Math.round(draft.L);
  const dots = React.useMemo(() => {
    let seeds = EXPLORER_SEEDS;
    if (zoom) {
      // Close-up: a honeycomb of large dots, on fixed positions so they don't shift when the view moves
      const row = GRID * 0.866;
      seeds = [];
      for (let j = Math.ceil((cb - half) / row); j * row <= cb + half; j++) {
        const off = j % 2 ? GRID / 2 : 0;
        for (let i = Math.ceil((ca - half - off) / GRID); i * GRID + off <= ca + half; i++) seeds.push([i * GRID + off, j * row]);
      }
      seeds = seeds.filter(([a, b]) => Math.abs(a) <= SPAN && Math.abs(b) <= SPAN);
    }
    return seeds.filter(([a, b]) => labInGamut(Lk, a, b)).map(([a, b]) => ({
      a,
      b,
      x: px(a),
      y: py(b),
      c: labToHex(Lk, a, b)
    }));
  }, [Lk, zoom]);
  const stops = [];
  for (let l = LMAX; l >= LMIN; l -= 6) {
    const [fa, fb] = fitToGamut(l, draft.ta, draft.tb);
    stops.push(labToHex(l, fa, fb));
  }
  function pickStart(fam, ti, di, row) {
    const lab = startLab(fam, ti, di);
    trackExplore(row, {
      name: row === 'tone' ? START_TONES[ti] : row === 'depth_chip' ? (START_FAMILIES[fam].depths || START_DEPTHS)[di][0] : fam
    });
    setStart({
      fam,
      ti,
      di,
      hex: labToHex(...lab)
    });
    onDraft(draftFromLab(lab));
  }
  const startChip = (name, hex, on, onClick) => /*#__PURE__*/React.createElement("button", {
    key: name,
    type: "button",
    "aria-pressed": on,
    onClick: onClick,
    style: {
      flex: 'none',
      whiteSpace: 'nowrap',
      fontFamily: 'DM Sans',
      fontSize: TYPE.body,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      minHeight: stacked ? 44 : 0,
      padding: '6px 14px 6px 7px',
      borderRadius: 20,
      border: `1.5px solid ${on ? 'var(--espresso)' : 'var(--border)'}`,
      background: '#fff',
      color: 'var(--espresso)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: hex
    }
  }), name);
  // The label has a fixed width so the chips of the three rows line up
  const startRow = (label, chips, group) => /*#__PURE__*/React.createElement("div", {
    role: group ? 'group' : undefined,
    "aria-label": group ? label : undefined,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '2px 0',
      flexWrap: stacked ? 'nowrap' : 'wrap',
      overflowX: stacked ? 'auto' : 'visible',
      scrollbarWidth: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      fontSize: TYPE.eyebrow,
      lineHeight: 1.15,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--espresso-mid)',
      fontWeight: 500,
      width: stacked ? 52 : 72
    }
  }, label), chips);
  const axisWord = {
    fontSize: TYPE.micro,
    color: 'var(--espresso-mid)',
    lineHeight: 1,
    textAlign: 'center',
    pointerEvents: 'none'
  };
  const depthBar = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: TYPE.micro,
      color: 'var(--espresso-mid)',
      letterSpacing: '0.03em'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Lighter"), /*#__PURE__*/React.createElement("span", null, "Deeper")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 10,
      border: '1px solid var(--border)',
      background: `linear-gradient(to right,${stops.join(',')})`,
      boxShadow: depthFocus ? '0 0 0 2px var(--cream), 0 0 0 4px var(--espresso)' : 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -4,
      bottom: -4,
      left: `${(LMAX - draft.L) / (LMAX - LMIN) * 100}%`,
      width: 10,
      marginLeft: -5,
      borderRadius: 5,
      background: color.hex,
      border: '2.5px solid #fff',
      boxShadow: '0 0 0 1.5px var(--espresso)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: LMIN,
    max: LMAX,
    step: "1",
    value: Math.round(LMIN + LMAX - draft.L),
    onChange: e => {
      trackExplore('depth_bar', {}, true);
      send({
        ...draft,
        L: LMIN + LMAX - +e.target.value
      });
    },
    onFocus: e => {
      if (e.target.matches(':focus-visible')) setDepthFocus(true);
    },
    onBlur: () => setDepthFocus(false),
    "aria-label": "Depth",
    "aria-valuetext": `${draft.L < 45 ? 'deep' : draft.L <= 60 ? 'medium' : 'light'}, lightness ${Math.round(draft.L)} of 100`,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      opacity: 0,
      cursor: 'pointer'
    }
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: TYPE.lede,
      color: 'var(--espresso-mid)',
      textAlign: 'center',
      lineHeight: 1.4,
      maxWidth: 360,
      alignSelf: 'center'
    }
  }, "Choose a spot on the map to find matching lipsticks, then go lighter or deeper."), /*#__PURE__*/React.createElement("p", {
    "aria-live": "polite",
    style: {
      position: 'absolute',
      width: 1,
      height: 1,
      margin: -1,
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap'
    }
  }, liveMsg), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, startRow('Start from', EXPLORER_STARTS.map(([name, hex]) => START_FAMILIES[name] ? startChip(name, hex, sel?.fam === name, () => pickStart(name, 1, START_FAMILIES[name].open, 'start_from')) : startChip(name, hex, hex === color.hex, () => {
    setStart(null);
    trackExplore('start_from', {
      name
    });
    onDraft(draftFromLab(hexToLab(hex)));
  }))), sel && startRow('Tone', START_TONES.map((name, ti) => startChip(name, labToHex(...startLab(sel.fam, ti, sel.di)), onStart && sel.ti === ti, () => pickStart(sel.fam, ti, sel.di, 'tone'))), true), sel && (START_FAMILIES[sel.fam].depths || START_DEPTHS).length > 1 && startRow('Depth', (START_FAMILIES[sel.fam].depths || START_DEPTHS).map(([name], di) => startChip(name, labToHex(...startLab(sel.fam, sel.ti, di)), onStart && sel.di === di, () => pickStart(sel.fam, sel.ti, di, 'depth_chip'))), true)), stacked && depthBar, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'stretch',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      ...axisWord,
      writingMode: 'vertical-rl',
      alignSelf: 'center',
      flex: 'none',
      transform: 'rotate(180deg)'
    }
  }, "greener"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: axisWord
  }, "yellower"), /*#__PURE__*/React.createElement("div", {
    ref: mapEl,
    onPointerDown: e => {
      // Mouse: drag anywhere. Touch and pen: the page scrolls over the map, a tap places the dot
      if (e.pointerType === 'mouse') {
        drag.current.mouse = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPoint(e.clientX, e.clientY);
      } else drag.current.tap = {
        x: e.clientX,
        y: e.clientY
      };
    },
    onPointerMove: e => {
      if (drag.current.mouse) fromPoint(e.clientX, e.clientY);else if (drag.current.tap && !isTap(e)) drag.current.tap = null;
    },
    onPointerUp: e => {
      if (isTap(e)) fromPoint(e.clientX, e.clientY);
      drag.current.tap = null;
      drag.current.mouse = false;
    },
    onPointerCancel: () => {
      drag.current.tap = null;
      drag.current.mouse = false;
    },
    style: {
      position: 'relative',
      width: '100%',
      aspectRatio: '1 / 1',
      background: 'var(--cream)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 0 0 1px var(--border)',
      touchAction: stacked ? 'pan-y' : 'none',
      cursor: 'crosshair'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: px(0),
      top: 0,
      bottom: 0,
      width: 1,
      background: '#D8C8BC',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: py(0),
      left: 0,
      right: 0,
      height: 1,
      background: '#D8C8BC',
      pointerEvents: 'none'
    }
  }), dots.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      position: 'absolute',
      left: d.x,
      top: d.y,
      width: zoom ? '11%' : '3.2%',
      aspectRatio: '1 / 1',
      borderRadius: '50%',
      transform: 'translate(-50%,-50%)',
      background: d.c,
      pointerEvents: 'none'
    }
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": `Color picker: ${color.name}, ${hexLabel}. Arrow keys move it; hold Shift for bigger steps.`,
    "aria-describedby": "shade-map-help",
    onKeyDown: e => {
      const s = zoom ? GRID : e.shiftKey ? 12 : 6,
        m = {
          ArrowLeft: [-s, 0],
          ArrowRight: [s, 0],
          ArrowUp: [0, s],
          ArrowDown: [0, -s]
        }[e.key];
      if (m) {
        e.preventDefault();
        moveTo(color.a + m[0], color.b + m[1]);
      }
    },
    onPointerDown: e => {
      // Remember where on the marker it was grabbed, so the drag moves its center, not the fingertip's spot
      const r = e.currentTarget.getBoundingClientRect();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current.dot = {
        x: e.clientX,
        y: e.clientY,
        dx: e.clientX - (r.left + r.width / 2),
        dy: e.clientY - (r.top + r.height / 2),
        moved: false
      };
    },
    onPointerMove: e => {
      const g = drag.current.dot;
      if (!g) return;
      e.stopPropagation();
      // A press that barely moves is not a drag: the marker stays where it is
      if (!g.moved && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return;
      g.moved = true;
      fromPoint(e.clientX - g.dx, e.clientY - g.dy);
    },
    onPointerUp: e => {
      e.stopPropagation();
      drag.current.dot = null;
      drag.current.tap = null;
    },
    onPointerCancel: e => {
      e.stopPropagation();
      drag.current.dot = null;
      drag.current.tap = null;
    },
    style: {
      touchAction: 'none',
      position: 'absolute',
      left: px(color.a),
      top: py(color.b),
      width: 34,
      height: 34,
      margin: '-17px 0 0 -17px',
      padding: 0,
      borderRadius: '50%',
      border: '3px solid #fff',
      background: color.hex,
      boxShadow: '0 0 0 1.5px var(--espresso), 0 4px 14px rgba(42,26,20,0.35)',
      cursor: 'grab',
      outlineOffset: 4
    }
  })), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: axisWord
  }, "bluer")), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      ...axisWord,
      writingMode: 'vertical-rl',
      alignSelf: 'center',
      flex: 'none'
    }
  }, "redder")), !stacked && depthBar, /*#__PURE__*/React.createElement("p", {
    id: "shade-map-help",
    style: {
      fontSize: TYPE.body,
      lineHeight: 1.6,
      color: 'var(--espresso-mid)',
      textAlign: 'center'
    }
  }, zoom ? `Close-up of the shades around your pick. ${stacked ? 'Tap a spot to choose, or drag the dot.' : 'Select or drag to choose one.'}` : stacked ? 'Tap a spot to choose, or drag the dot. Use the bar above to go lighter or deeper.' : 'Select or drag across the map to explore colors. Use the depth bar to go lighter or deeper.'), stacked && /*#__PURE__*/React.createElement(ShadeZoomControl, {
    color: color,
    origin: origin,
    zoom: zoom,
    onZoom: onZoom,
    onDraft: onDraft,
    row: true
  }), stacked && /*#__PURE__*/React.createElement(ShadeHexForm, {
    id: "shade-hex",
    big: true,
    onDraft: onDraft
  }), stacked && !committed && /*#__PURE__*/React.createElement("div", {
    className: pinned ? undefined : 'shade-bar',
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: '#fff',
      ...(pinned ? {
        padding: '10px 12px',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 4px 18px rgba(42,26,20,0.16)'
      } : {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 90,
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 16px rgba(42,26,20,0.10)'
      })
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      display: 'flex',
      width: 44,
      height: 44,
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 0 0 1px var(--border)'
    }
  }, moved && !summary.noMatch && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      background: before.hex
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      background: color.hex
    }
  }), summary.noMatch && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      background: summary.nearHex
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: TYPE.lede,
      lineHeight: 1.1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, color.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: TYPE.body,
      color: 'var(--espresso-mid)'
    }
  }, summary.noMatch ? 'No close matches · nearest on right' : summary.text)), !summary.loading && /*#__PURE__*/React.createElement("button", {
    id: "shade-bar-cta",
    type: "button",
    onClick: summary.noMatch ? onJump : onCommit,
    style: {
      ...EXPLORER_CTA,
      flex: 'none',
      minHeight: 44,
      padding: '0 18px',
      letterSpacing: '0.06em'
    }
  }, summary.noMatch ? 'Jump to nearest' : `See ${summary.n}`)));
}

// "Already know the hex?": a typed hex moves the dot to that color
function ShadeHexForm({
  id,
  big,
  onDraft
}) {
  const TYPE = EXPLORER_TYPE;
  const [hexText, setHexText] = useState('');
  const [hexBad, setHexBad] = useState(false);
  function submitHex(e) {
    e.preventDefault();
    let s = hexText.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(s)) return setHexBad(true);
    setHexBad(false);
    trackExplore('hex_typed', {
      hex: '#' + s.toLowerCase()
    });
    onDraft(draftFromLab(hexToLab('#' + s.toLowerCase())));
  }
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: submitHex,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '0 4px'
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: TYPE.lede,
      lineHeight: 1.2,
      color: 'var(--espresso)'
    }
  }, "Already know the hex?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: id,
    value: hexText,
    onChange: e => {
      setHexText(e.target.value);
      setHexBad(false);
    },
    placeholder: "#B5252C",
    maxLength: 7,
    spellCheck: false,
    autoComplete: "off",
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'DM Sans',
      fontSize: big ? TYPE.input : TYPE.caption,
      minHeight: big ? 44 : 0,
      padding: '10px 14px',
      borderRadius: 12,
      border: `1.5px solid ${hexBad ? 'var(--blush-deep)' : 'var(--border)'}`,
      background: '#fff',
      color: 'var(--espresso)',
      letterSpacing: '0.04em'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.body,
      padding: '10px 18px',
      borderRadius: 12,
      border: '1.5px solid #C9B3A4',
      background: 'transparent',
      color: 'var(--espresso)',
      cursor: 'pointer'
    }
  }, "Show")), hexBad && /*#__PURE__*/React.createElement("p", {
    role: "alert",
    style: {
      fontSize: TYPE.body,
      color: 'var(--blush-deep)'
    }
  }, "Use six characters, like #B5252C."));
}

// "Explore nearby shades" zooms the map in on the pick (and back out). After picking in the
// close-up, "Return to #…" goes back to the color chosen before zooming. On the card on desktop,
// under the map when the columns stack.
function ShadeZoomControl({
  color,
  origin,
  zoom,
  onZoom,
  onDraft,
  row,
  wide
}) {
  const TYPE = EXPLORER_TYPE,
    back = origin && draftColor(origin);
  return /*#__PURE__*/React.createElement("div", {
    style: wide
    // On the card once there are two colors to describe: one line across, under both
    ? {
      flex: 1,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10
    } : {
      flex: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: row ? 'center' : 'flex-end',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-pressed": !!zoom,
    onClick: () => {
      trackExplore(zoom ? 'zoom_out' : 'zoom_in');
      onZoom(zoom ? null : {
        a: color.a,
        b: color.b
      });
    },
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.link,
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      minHeight: row ? 44 : 0,
      padding: '10px 18px',
      borderRadius: 40,
      border: '1.5px solid var(--espresso)',
      background: zoom ? 'var(--espresso)' : '#fff',
      color: zoom ? 'var(--cream)' : 'var(--espresso)',
      cursor: 'pointer'
    }
  }, zoom ? 'Show full map' : 'Explore nearby shades'), back && back.hex !== color.hex && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      trackExplore('return_to_origin');
      onDraft(origin);
    },
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.link,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minHeight: row ? 44 : 0,
      padding: 0,
      border: 'none',
      background: 'none',
      color: 'var(--espresso)',
      cursor: 'pointer',
      textDecoration: 'underline',
      textUnderlineOffset: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: 5,
      background: back.hex,
      boxShadow: '0 0 0 1px var(--border)'
    }
  }), "Return to ", back.hex.toUpperCase()));
}

// Desktop: the current pick, beside the map. Its matches appear right under it once asked for.
function ShadeCard({
  color,
  origin,
  zoom,
  onZoom,
  info,
  committed,
  onCommit,
  onJump,
  onDraft
}) {
  const TYPE = EXPLORER_TYPE,
    summary = shadeSummary(info);
  const before = origin && draftColor(origin),
    moved = !!before && before.hex !== color.hex;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: 24,
      boxShadow: '0 2px 12px var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      height: 160,
      borderRadius: 12,
      overflow: 'hidden'
    }
  }, moved && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      background: before.hex
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      background: color.hex
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      boxShadow: 'inset 0 -2px 6px rgba(0,0,0,0.15)',
      pointerEvents: 'none'
    }
  })), moved && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      paddingTop: 6
    }
  }, [['Your first pick', before], ['Now', color]].map(([label, c]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      paddingRight: 12
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: TYPE.eyebrow,
      fontWeight: 500,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--espresso-mid)'
    }
  }, label), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: TYPE.lede,
      lineHeight: 1.15
    }
  }, c.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: TYPE.body,
      color: 'var(--espresso-mid)',
      letterSpacing: '0.04em'
    }
  }, c.hex.toUpperCase()))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16
    }
  }, !moved && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 160px',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: TYPE.title,
      lineHeight: 1.1
    }
  }, color.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: TYPE.body,
      color: 'var(--espresso-mid)',
      letterSpacing: '0.04em'
    }
  }, color.hex.toUpperCase())), /*#__PURE__*/React.createElement(ShadeZoomControl, {
    color: color,
    origin: origin,
    zoom: zoom,
    onZoom: onZoom,
    onDraft: onDraft,
    wide: moved
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: TYPE.caption,
      lineHeight: 1.4,
      color: 'var(--espresso)'
    }
  }, summary.text), summary.noMatch && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 48,
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 0 0 1px var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      background: color.hex
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      background: summary.nearHex
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      fontSize: TYPE.body,
      color: 'var(--espresso-mid)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Your pick"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Nearest lipstick"))), !summary.loading && !committed && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: summary.noMatch ? onJump : onCommit,
    onMouseEnter: e => {
      e.currentTarget.style.background = 'var(--espresso-mid)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = 'var(--espresso)';
    },
    style: {
      ...EXPLORER_CTA,
      width: '100%',
      padding: '15px 28px'
    }
  }, summary.noMatch ? 'Jump to the nearest lipstick' : summary.cta));
}

// The results for the pick. Stacked layout: a sheet over the bottom of the screen (`.shade-sheet` in
// index.html) with the map still in use above it; swipe its header down, press × or Escape to close.
// On desktop the header is hidden and the results sit under the card.
function ShadeSheet({
  color,
  info,
  pinned,
  onClose,
  children
}) {
  const TYPE = EXPLORER_TYPE,
    summary = shadeSummary(info);
  const [dy, setDy] = useState(0);
  const drag = React.useRef(null);
  const closeBtn = React.useRef(null);
  const [isSheet] = useState(() => window.innerWidth <= 900);
  useBackToClose(onClose, isSheet);
  useEffect(() => {
    if (window.innerWidth <= 900) closeBtn.current?.focus({
      preventScroll: true
    });
  }, []);
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    if (dy > 80) onClose();else setDy(0);
  };
  return /*#__PURE__*/React.createElement("section", {
    className: `shade-sheet${pinned ? ' tray-open' : ''}`,
    role: "region",
    "aria-labelledby": "shade-sheet-title",
    onKeyDown: e => {
      if (e.key === 'Escape' && window.innerWidth <= 900) {
        e.preventDefault();
        onClose();
      }
    },
    style: {
      transform: dy ? `translateY(${dy}px)` : undefined,
      transition: drag.current ? 'none' : 'transform 0.2s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "shade-sheet-head",
    onPointerDown: e => {
      if (e.target.closest('button')) return;
      drag.current = {
        y: e.clientY
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: e => {
      if (drag.current) setDy(Math.max(0, e.clientY - drag.current.y));
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      alignSelf: 'center',
      width: 40,
      height: 5,
      borderRadius: 3,
      background: '#D8C8BC'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 10,
      flex: 'none',
      background: color.hex,
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.12)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("h2", {
    id: "shade-sheet-title",
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontWeight: 400,
      fontSize: TYPE.lede,
      lineHeight: 1.1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, color.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: TYPE.body,
      color: 'var(--espresso-mid)'
    }
  }, summary.text, summary.n ? ' · closest first' : '')), /*#__PURE__*/React.createElement("button", {
    ref: closeBtn,
    type: "button",
    "aria-label": "Close results",
    onClick: onClose,
    style: {
      flex: 'none',
      width: 44,
      height: 44,
      borderRadius: '50%',
      border: '1px solid var(--border)',
      background: '#fff',
      color: 'var(--espresso)',
      fontFamily: 'DM Sans',
      fontSize: 20,
      lineHeight: 1,
      cursor: 'pointer'
    }
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    className: "shade-sheet-body"
  }, children));
}

// ── Dupe Finder ──────────────────────────────────────────────────────────────
// normSearch, typoDistance, typoLimit and brandAliases come from search-utils.js.
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

// Quick-start options shown under the dupe search for anyone who
// doesn't have a specific lipstick in mind yet.
const POPULAR_DUPE_PICKS = [{
  brand: 'mac cosmetics',
  shade: 'ruby woo'
}, {
  brand: 'charlotte tilbury',
  shade: 'pillow talk'
}, {
  brand: 'pat mcgrath labs',
  shade: 'elson 4'
}, {
  brand: 'chanel',
  shade: '99 pirate'
}, {
  brand: 'chanel',
  shade: '49 ever red'
}, {
  brand: 'dior',
  shade: '100 forever nude look'
}, {
  brand: 'dior',
  shade: '422 rose des vents'
}, {
  brand: 'dior',
  shade: '670 rose blues'
}];
function DupeFinder({
  product,
  onSelect,
  onUsePhoto
}) {
  const [brand, setBrand] = useState(product?.brand ?? null);
  const [brandQuery, setBrandQuery] = useState('');
  // A product set from outside (e.g. a shared dupe link) opens its brand too
  useEffect(() => {
    if (product) setBrand(product.brand);
  }, [product]);
  const [shadeQuery, setShadeQuery] = useState('');
  const touchStartY = React.useRef(0);
  const brandNoResultFired = React.useRef(false);
  const shadeNoResultFired = React.useRef(new Set());
  const brands = React.useMemo(() => [...new Set(REAL_PRODUCTS.map(p => p.brand))].sort((a, b) => a.localeCompare(b)), []);
  const brandCounts = React.useMemo(() => {
    const m = {};
    for (const p of REAL_PRODUCTS) m[p.brand] = (m[p.brand] || 0) + 1;
    return m;
  }, []);

  // Brand search ignores case, accents, spaces and punctuation, so "smash box",
  // "loreal" and "elf" still find their brands; other names ("ysl") count too.
  const brandKeys = React.useMemo(() => brands.map(b => {
    const first = normSearch(b.split(' ')[0]),
      aliases = brandAliases(b);
    return {
      b,
      key: normSearch(b),
      first: first.length >= 3 ? first : null,
      aliases,
      tails: [...wordTails(b), ...aliases]
    };
  }), [brands]);
  const shadeIndex = React.useMemo(() => REAL_PRODUCTS.map(p => ({
    p,
    key: normShade(p.shade),
    tails: wordTails(normShade(p.shade))
  })), []);
  // Shades `q` is a typo or two away from, closest first
  const nearShades = (q, items) => {
    const max = typoLimit(q),
      near = [];
    if (max < 0) return near;
    for (const {
      p,
      tails
    } of items) {
      const d = typoScore(q, tails, max);
      if (d <= max) near.push({
        p,
        d
      });
    }
    return near.sort((x, y) => x.d - y.d || x.p.shade.localeCompare(y.p.shade) || x.p.brand.localeCompare(y.p.brand)).slice(0, 40).map(x => x.p);
  };
  const brandMatches = React.useMemo(() => {
    const q = normSearch(brandQuery);
    if (!q) return [];
    const starts = [],
      incl = [];
    for (const {
      b,
      key,
      aliases
    } of brandKeys) {
      if (key.startsWith(q) || aliases.some(a => a.startsWith(q))) starts.push(b);else if (key.includes(q)) incl.push(b);
    }
    if (starts.length || incl.length || q.length < 4) return [...starts, ...incl].slice(0, 12);
    // Nothing matches as typed: list brands a typo or two away, then bigger brands first
    const max = typoLimit(q);
    const near = [];
    for (const {
      b,
      tails
    } of brandKeys) {
      const d = typoScore(q, tails, max);
      if (d <= max) near.push({
        b,
        d
      });
    }
    return near.sort((x, y) => x.d - y.d || brandCounts[y.b] - brandCounts[x.b]).slice(0, 5).map(x => x.b);
  }, [brandQuery, brandKeys, brandCounts]);

  // Shades offered from the brand box: "mac ruby woo" (a brand, or its first
  // word, then a shade) lists that brand's shades; a shade name on its own
  // ("pillow talk") lists that shade across brands. Either skips step 2. The
  // brand can also come last ("rebel mac") when the whole search isn't a shade.
  // When neither matches as typed and no brand does either, typos are allowed
  // in both parts ("nars gols", "rimmel's 136 balistic").
  const quickShades = React.useMemo(() => {
    const words = brandQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const brandShade = (typos, brandLast) => {
      for (let k = words.length - 1; k >= 1; k--) {
        const brandWords = brandLast ? words.slice(words.length - k) : words.slice(0, k);
        const shadeWords = brandLast ? words.slice(0, words.length - k) : words.slice(k);
        const head = normSearch(brandWords.join(' '));
        const rest = normShade(shadeWords.join(' '));
        if (!rest) continue;
        const hit = new Set(brandKeys.filter(x => x.key === head || x.first === head || x.aliases.includes(head)).map(x => x.b));
        if (typos && !hit.size) {
          const max = typoLimit(head);
          for (const x of brandKeys) {
            if ([x.key, x.first, ...x.aliases].some(n => n && typoDistance(head, n, true, max) <= max)) hit.add(x.b);
          }
        }
        if (!hit.size) continue;
        const items = shadeIndex.filter(x => hit.has(x.p.brand));
        let list = items.filter(x => x.key.includes(rest)).map(x => x.p).sort((a, b) => a.shade.localeCompare(b.shade)).slice(0, 40);
        if (typos && !list.length) list = nearShades(normSearch(rest), items);
        if (list.length) return {
          route: 'brand_shade',
          list
        };
      }
      return null;
    };
    const exact = brandShade(false, false);
    if (exact) return exact;
    const q = normShade(brandQuery);
    if (q.length < 3) return null;
    const starts = [],
      incl = [];
    for (const {
      p,
      key
    } of shadeIndex) {
      if (key.startsWith(q)) starts.push(p);else if (key.includes(q)) incl.push(p);
    }
    const byShade = (a, b) => a.shade.localeCompare(b.shade) || a.brand.localeCompare(b.brand);
    const list = [...starts.sort(byShade), ...incl.sort(byShade)].slice(0, 40);
    if (list.length) return {
      route: 'shade',
      list
    };
    const last = brandShade(false, true);
    if (last) return last;
    if (brandMatches.length) return null;
    const near = brandShade(true, false) || brandShade(true, true);
    if (near) return near;
    const nearList = nearShades(normSearch(brandQuery), shadeIndex);
    return nearList.length ? {
      route: 'shade',
      list: nearList
    } : null;
  }, [brandQuery, brandKeys, shadeIndex, brandMatches]);
  const shadeMatches = React.useMemo(() => {
    if (!brand) return [];
    // An empty box lists every shade of the brand, so it can be browsed
    const q = shadeQuery.trim().toLowerCase();
    const list = REAL_PRODUCTS.filter(p => p.brand === brand && (!q || p.shade.toLowerCase().includes(q) || (p.product || '').toLowerCase().includes(q)));
    if (list.length || !q) return list.sort((a, b) => a.shade.localeCompare(b.shade));
    // Nothing matches as typed: shades of the brand a typo or two away
    return nearShades(normSearch(q), shadeIndex.filter(x => x.p.brand === brand));
  }, [brand, shadeQuery, shadeIndex]);
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
      hex: p.hex,
      route: 'brand'
    });
    onSelect(p);
  }
  function pickQuickShade(p) {
    window.gtag?.('event', 'dupe_shade_select', {
      brand: p.brand,
      shade: p.shade,
      hex: p.hex,
      route: quickShades.route
    });
    setBrand(p.brand);
    setBrandQuery('');
    setShadeQuery('');
    onSelect(p);
  }
  const popularProducts = React.useMemo(() => POPULAR_DUPE_PICKS.map(({
    brand: b,
    shade: s
  }) => REAL_PRODUCTS.find(p => p.brand.toLowerCase() === b && p.shade.toLowerCase() === s)).filter(Boolean), []);
  function pickPopular(p) {
    window.gtag?.('event', 'dupe_popular_select', {
      brand: p.brand,
      shade: p.shade,
      hex: p.hex
    });
    setBrand(p.brand);
    setBrandQuery('');
    setShadeQuery('');
    onSelect(p);
  }

  // Fire no-results events after the user pauses typing (600ms debounce).
  // Guarded by a minimum length (skip early, still-typing fragments) and
  // deduped (fire at most once per session/brand) so retries and typos
  // don't inflate the metric with repeats of the same dead-end search.
  React.useEffect(() => {
    const q = brandQuery.trim().toLowerCase();
    if (q.length < 3 || brandMatches.length > 0 || quickShades || brandNoResultFired.current) return;
    const t = setTimeout(() => {
      brandNoResultFired.current = true;
      window.gtag?.('event', 'dupe_brand_no_results', {
        query: q
      });
    }, 600);
    return () => clearTimeout(t);
  }, [brandQuery, brandMatches.length, quickShades]);
  React.useEffect(() => {
    const q = shadeQuery.trim().toLowerCase();
    if (q.length < 3 || shadeMatches.length > 0 || !brand || shadeNoResultFired.current.has(brand)) return;
    const t = setTimeout(() => {
      shadeNoResultFired.current.add(brand);
      window.gtag?.('event', 'dupe_shade_no_results', {
        brand,
        query: q
      });
    }, 600);
    return () => clearTimeout(t);
  }, [shadeQuery, shadeMatches.length, brand]);

  // Type scale for this panel — each size has one job. Don't add a one-off
  // size for a new label; pick the closest existing role instead.
  //   eyebrow  11px  uppercase micro-labels (step labels, section dividers)
  //   micro    11px  secondary meta riding alongside primary text (counts, finish tags)
  //   caption  14px  helper/hint sentences (italic serif, under inputs)
  //   link     12px  clickable CTA text ("match from a photo")
  //   body     13px  regular UI text (chips, list primary text)
  //   lede     21px  panel intro headline
  const TYPE = {
    eyebrow: 11,
    micro: 11,
    caption: 14,
    link: 12,
    body: 13,
    lede: 21
  };
  const stepNum = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'var(--espresso)',
    color: 'var(--cream)',
    fontFamily: 'DM Sans',
    fontSize: TYPE.eyebrow,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };
  const stepLabel = {
    fontFamily: 'DM Sans',
    fontSize: TYPE.eyebrow,
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
    fontSize: TYPE.caption,
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '8px 0'
  };
  const photoFallbackBtn = {
    marginTop: 6,
    fontFamily: 'DM Sans',
    fontSize: TYPE.link,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--blush-deep)',
    background: 'transparent',
    border: '1px solid var(--blush-deep)',
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
      fontSize: TYPE.lede,
      color: 'var(--espresso-mid)',
      lineHeight: 1.4
    }
  }, "Find a color match for a lipstick you like"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.body,
      color: 'var(--text-muted)',
      letterSpacing: '0.02em',
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
      fontSize: TYPE.link,
      letterSpacing: '0.05em',
      color: 'var(--blush-deep)',
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid var(--blush-deep)',
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
    className: "dupe-input",
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
      if (e.key !== 'Enter') return;
      if (brandMatches[0]) pickBrand(brandMatches[0]);else if (quickShades) pickQuickShade(quickShades.list[0]);
    },
    placeholder: "MAC, Charlotte Tilbury\u2026",
    "aria-label": "Brand",
    style: inputStyle
  }), brandQuery && /*#__PURE__*/React.createElement("button", {
    onClick: () => setBrandQuery(''),
    "aria-label": "Clear search",
    style: clearBtn
  }, "\xD7")), brandQuery.trim() && brandMatches.length === 0 && !quickShades && normSearch(brandQuery).length >= 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '8px 0'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: emptyNote
  }, "No brand or shade matches \"", brandQuery.trim(), "\". It may not be in the catalogue."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      window.gtag?.('event', 'dupe_photo_fallback', {
        step: 'brand_no_results',
        query: brandQuery.trim().toLowerCase()
      });
      onUsePhoto();
    },
    style: photoFallbackBtn
  }, "Match it from a photo \u2192")), (brandMatches.length > 0 || quickShades) && /*#__PURE__*/React.createElement("div", {
    style: {
      ...suggestBox,
      maxHeight: 308
    }
  }, brandMatches.length > 0 && quickShades && /*#__PURE__*/React.createElement("span", {
    style: {
      ...stepLabel,
      padding: '6px 12px 2px'
    }
  }, "Brands"), brandMatches.map(b => /*#__PURE__*/React.createElement("button", _extends({
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
  }, brandCounts[b], " shade", brandCounts[b] !== 1 ? 's' : ''))), brandMatches.length > 0 && quickShades && /*#__PURE__*/React.createElement("span", {
    style: {
      ...stepLabel,
      padding: '10px 12px 2px'
    }
  }, "Shades"), quickShades?.list.map((p, i) => /*#__PURE__*/React.createElement("button", _extends({
    key: i,
    onTouchStart: e => {
      touchStartY.current = e.touches[0].clientY;
    },
    onTouchEnd: e => {
      if (Math.abs(e.changedTouches[0].clientY - touchStartY.current) < 10) {
        e.preventDefault();
        pickQuickShade(p);
      }
    },
    onClick: () => pickQuickShade(p)
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
      fontSize: TYPE.micro,
      color: 'var(--text-muted)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, p.brand, " \xB7 ", p.product))))), !brandQuery && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: TYPE.caption,
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
    className: "dupe-input",
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
    "aria-label": "Shade or product",
    style: inputStyle
  }), shadeQuery && /*#__PURE__*/React.createElement("button", {
    onClick: () => setShadeQuery(''),
    "aria-label": "Clear search",
    style: clearBtn
  }, "\xD7")), shadeMatches.length === 0 ? /*#__PURE__*/React.createElement("div", {
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
    onTouchStart: e => {
      touchStartY.current = e.touches[0].clientY;
    },
    onTouchEnd: e => {
      if (Math.abs(e.changedTouches[0].clientY - touchStartY.current) < 10) {
        e.preventDefault();
        pickShade(p);
      }
    },
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
      fontSize: TYPE.micro,
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
    className: "dupe-card-desktop",
    style: {
      flexDirection: 'column',
      background: '#fff',
      borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: '0 2px 12px var(--shadow)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 252,
      background: 'var(--cream-dark)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "img",
    "aria-label": `Swatch ${product.hex}`,
    title: product.hex,
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 22,
      background: product.hex
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 16,
      right: 16,
      bottom: 16,
      left: 38
    }
  }, /*#__PURE__*/React.createElement(ProductThumb, {
    product: product,
    width: "100%",
    height: "100%",
    fit: "contain",
    radius: 0,
    ring: false,
    tint: false
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px 18px',
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.body,
      fontWeight: 500,
      color: 'var(--espresso)'
    }
  }, product.brand), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: TYPE.lede,
      color: 'var(--espresso-mid)',
      lineHeight: 1.2,
      marginTop: 2
    }
  }, product.shade), product.product && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.body,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, product.product), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.micro,
      color: 'var(--text-muted)',
      marginTop: 6,
      letterSpacing: '0.04em'
    }
  }, product.hex.toUpperCase()))), /*#__PURE__*/React.createElement("div", {
    className: "dupe-card-mobile",
    style: {
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
  }, product.hex.toUpperCase()))), /*#__PURE__*/React.createElement("button", {
    onClick: () => onSelect(null),
    style: {
      alignSelf: 'flex-start',
      fontSize: 11,
      fontFamily: 'DM Sans',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--blush-deep)',
      background: 'transparent',
      border: '1px solid var(--blush-deep)',
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
  }, /*#__PURE__*/React.createElement("span", {
    className: "only-wide"
  }, "Closest dupes are ranked on the right \u2192"), /*#__PURE__*/React.createElement("span", {
    className: "only-stacked"
  }, "Closest dupes are ranked below \u2193")))), !product && popularProducts.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.eyebrow,
      color: 'var(--text-muted)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      textAlign: 'center'
    }
  }, "Or try a popular shade"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center'
    }
  }, popularProducts.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "popular-pick",
    onClick: () => pickPopular(p),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '7px 12px 7px 8px',
      background: '#fff',
      borderRadius: 40,
      border: '1px solid var(--border)',
      boxShadow: '0 2px 8px var(--shadow)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "popular-pick-swatch",
    style: {
      width: 20,
      height: 20,
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
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "popular-pick-shade",
    style: {
      fontFamily: 'Cormorant Garamond',
      fontStyle: 'italic',
      fontSize: TYPE.body,
      color: 'var(--espresso)',
      lineHeight: 1.15
    }
  }, p.shade), /*#__PURE__*/React.createElement("span", {
    className: "popular-pick-brand",
    style: {
      fontFamily: 'DM Sans',
      fontSize: TYPE.micro,
      color: 'var(--text-muted)',
      textTransform: 'capitalize'
    }
  }, p.brand)))))));
}

// Mode icons for the in-app mode bar: one-color line versions of the landing card pictures,
// drawn in currentColor, with lighter tints standing in for the pictures' colors
const wheelRing = (r, width, opacity) => {
  const seg = 2 * Math.PI * r / 8;
  return /*#__PURE__*/React.createElement("circle", {
    cx: "10",
    cy: "10",
    r: r,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: width,
    opacity: opacity,
    strokeDasharray: `${seg - 0.9} 0.9`
  });
};
const iconBullet = (x, tilt) => /*#__PURE__*/React.createElement("g", {
  transform: `rotate(${tilt} ${x + 2.5} 18)`
}, /*#__PURE__*/React.createElement("path", {
  d: `M${x + 1} 8V5Q${x + 1} 1.8 ${x + 4} 1.5V8Z`,
  fill: "currentColor"
}), /*#__PURE__*/React.createElement("rect", {
  x: x + 0.5,
  y: "8",
  width: "4",
  height: "3",
  fill: "currentColor",
  opacity: "0.4"
}), /*#__PURE__*/React.createElement("rect", {
  x: x,
  y: "11",
  width: "5",
  height: "7",
  rx: "0.8",
  fill: "currentColor",
  opacity: "0.75"
}));
const MODE_ICONS = {
  wheel: (s = 26) => /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 20 20",
    "aria-hidden": "true"
  }, wheelRing(8.2, 2.2, 0.5), wheelRing(5.4, 2, 0.75), wheelRing(2.8, 1.8, 1)),
  dupe: (s = 26) => /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 20 20",
    "aria-hidden": "true"
  }, iconBullet(1.5, -6), iconBullet(13.5, 6), /*#__PURE__*/React.createElement("path", {
    d: "M8.3 9.2q.85-.8 1.7 0t1.7 0M8.3 11.4q.85-.8 1.7 0t1.7 0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "0.9",
    strokeLinecap: "round"
  })),
  photo: (s = 26) => /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 20 20",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 6V4.5Q2 3 3.5 3H5M15 3h1.5Q18 3 18 4.5V6M18 14v1.5Q18 17 16.5 17H15M5 17H3.5Q2 17 2 15.5V14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.3",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    transform: "translate(4.5 6.15) scale(0.11)",
    fill: "currentColor",
    d: "M1 34C8 20 20 3 34 3C42 3 46 9 50 12C54 9 58 3 66 3C80 3 92 20 99 34C82 33 66 30 50 32C34 30 18 33 1 34Z M2 37C18 38 34 37 50 38C66 37 82 38 98 37C90 56 72 68 50 68C28 68 10 56 2 37Z"
  })),
  hex: (s = 26) => /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 20 20",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "16",
    height: "16",
    rx: "3",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.2",
    opacity: "0.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 2.6v14.8M2.6 10h14.8",
    stroke: "currentColor",
    strokeWidth: "0.7",
    opacity: "0.35"
  }), [5.5, 8.5, 11.5, 14.5].flatMap(x => [5.5, 8.5, 11.5, 14.5].map(y => /*#__PURE__*/React.createElement("circle", {
    key: `${x}-${y}`,
    cx: x,
    cy: y,
    r: "0.95",
    fill: "currentColor",
    opacity: "0.45"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "13",
    cy: "7",
    r: "2.6",
    fill: "currentColor",
    stroke: "#fff",
    strokeWidth: "1.2"
  })),
  list: (s = 26) => /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 20 20",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 17 C10 17 2.5 12.4 2.5 7.3 C2.5 4.7 4.5 3 6.7 3 C8.1 3 9.3 3.7 10 4.9 C10.7 3.7 11.9 3 13.3 3 C15.5 3 17.5 4.7 17.5 7.3 C17.5 12.4 10 17 10 17 Z",
    fill: "currentColor",
    fillOpacity: "0.25",
    stroke: "currentColor",
    strokeWidth: "1.2",
    strokeLinejoin: "round"
  }))
};

// Landing card pictures: each mode drawn as its own small object (Claude Design "Search landing" 3a)
// Three depth rings of twelve wheel colors, light outside to deep inside
const LANDING_WHEEL_RINGS = [{
  inner: 70,
  outer: 100,
  colors: ['#E3454D', '#DE2A21', '#EA8E83', '#D9A083', '#C48C7F', '#C26F67', '#AF5F64', '#B24F5C', '#A3487A', '#F89FB5', '#EFBFBB', '#CA7780']
}, {
  inner: 47,
  outer: 68,
  colors: ['#B5252C', '#B12D1E', '#D85D5B', '#C47159', '#B07774', '#AA6155', '#92515A', '#883042', '#A22956', '#DC5391', '#ED7491', '#CC4C63']
}, {
  inner: 22.5,
  outer: 44,
  colors: ['#9C0822', '#7E1C11', '#BA5250', '#945C55', '#76433D', '#50332C', '#6B272B', '#6C3348', '#801628', '#DC3092', '#D23658', '#A4333E']
}];
const ringGradient = colors => `conic-gradient(from -15deg, ${colors.map((c, i) => `${c} ${i * 30}deg ${i * 30 + 27.5}deg, var(--cream) ${i * 30 + 27.5}deg ${i * 30 + 30}deg`).join(', ')})`;
function LandingWheelArt() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '72%',
      aspectRatio: '1',
      borderRadius: '50%',
      background: 'var(--cream)',
      boxShadow: '0 0 0 1px var(--border), 0 6px 24px rgba(42,26,20,0.10)'
    }
  }, LANDING_WHEEL_RINGS.map(({
    inner,
    outer,
    colors
  }) => {
    const mask = outer === 100 ? `radial-gradient(circle closest-side, transparent ${inner}%, #000 ${inner + 0.5}%)` : `radial-gradient(circle closest-side, transparent ${inner - 0.5}%, #000 ${inner}%, #000 ${outer}%, transparent ${outer + 0.5}%)`;
    return /*#__PURE__*/React.createElement("div", {
      key: inner,
      style: {
        position: 'absolute',
        inset: '3%',
        borderRadius: '50%',
        background: ringGradient(colors),
        WebkitMask: mask,
        mask
      }
    });
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '19%',
      aspectRatio: '1',
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      background: 'var(--cream)',
      boxShadow: '0 0 0 1px #D8C8B8'
    }
  }));
}

// The picker dot shared by the photo and chart pictures
const landingPickDot = (left, top, size, color) => ({
  position: 'absolute',
  left,
  top,
  width: size,
  height: size,
  margin: -size / 2,
  borderRadius: '50%',
  border: '3px solid #fff',
  background: color,
  boxShadow: '0 0 0 1.5px var(--espresso), 0 4px 12px rgba(42,26,20,0.32)'
});
function LandingPhotoArt() {
  const corner = (pos, sides) => ({
    position: 'absolute',
    ...pos,
    width: 16,
    height: 16,
    ...sides
  });
  const line = '2px solid var(--espresso)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '66%',
      aspectRatio: '4/3',
      background: 'var(--cream)',
      borderRadius: 14,
      boxShadow: '0 0 0 1px var(--border), 0 8px 20px rgba(42,26,20,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "landing-corner",
    style: corner({
      left: 10,
      top: 10
    }, {
      borderLeft: line,
      borderTop: line,
      borderTopLeftRadius: 4
    })
  }), /*#__PURE__*/React.createElement("span", {
    className: "landing-corner",
    style: corner({
      right: 10,
      top: 10
    }, {
      borderRight: line,
      borderTop: line,
      borderTopRightRadius: 4
    })
  }), /*#__PURE__*/React.createElement("span", {
    className: "landing-corner",
    style: corner({
      left: 10,
      bottom: 10
    }, {
      borderLeft: line,
      borderBottom: line,
      borderBottomLeftRadius: 4
    })
  }), /*#__PURE__*/React.createElement("span", {
    className: "landing-corner",
    style: corner({
      right: 10,
      bottom: 10
    }, {
      borderRight: line,
      borderBottom: line,
      borderBottomRightRadius: 4
    })
  }), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 70",
    style: {
      width: '62%'
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "#C41E3A",
    d: "M1 34C8 20 20 3 34 3C42 3 46 9 50 12C54 9 58 3 66 3C80 3 92 20 99 34C82 33 66 30 50 32C34 30 18 33 1 34Z M2 37C18 38 34 37 50 38C66 37 82 38 98 37C90 56 72 68 50 68C28 68 10 56 2 37Z"
  })), /*#__PURE__*/React.createElement("span", {
    className: "landing-pick",
    style: landingPickDot('58%', '60%', 26, '#C41E3A')
  }));
}
function LandingBullet({
  bullet,
  sleeve,
  base,
  tilt,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transform: `rotate(${tilt}deg)`,
      transformOrigin: 'bottom center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 44,
      background: bullet,
      borderRadius: '26px 3px 0 0 / 38px 3px 0 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 30,
      background: sleeve,
      borderRadius: '3px 3px 0 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 70,
      background: base,
      borderRadius: '4px 4px 10px 10px'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--espresso-mid)'
    }
  }, label));
}
function LandingDupeArt() {
  return /*#__PURE__*/React.createElement("div", {
    className: "landing-art-dupe",
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(LandingBullet, {
    bullet: "#B5263A",
    sleeve: "#D9B98A",
    base: "var(--espresso)",
    tilt: -6,
    label: "Yours"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontSize: 40,
      lineHeight: 1,
      color: 'var(--text-muted)',
      alignSelf: 'center'
    }
  }, "\u2248"), /*#__PURE__*/React.createElement(LandingBullet, {
    bullet: "#BA2A3C",
    sleeve: "#E6CFC2",
    base: "var(--blush)",
    tilt: 6,
    label: "Its twin"
  }));
}

// A slice of the color chart: dots on a sunflower spiral across the a*/b* plane at L 50,
// keeping only those inside the sRGB gamut
const LANDING_CHART_DOTS = (() => {
  const S = 80,
    N = 300,
    R = S * 0.96;
  const gam = c => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  const k = t => {
    const c = t * t * t;
    return c > 0.008856 ? c : (t - 16 / 116) / 7.787;
  };
  const out = [];
  for (let i = 0; i < N; i++) {
    const r = R * Math.sqrt((i + 0.5) / N),
      t = i * 2.39996323,
      a = r * Math.cos(t),
      b = r * Math.sin(t);
    const fy = (50 + 16) / 116,
      X = 0.95047 * k(fy + a / 500),
      Y = k(fy),
      Z = 1.08883 * k(fy - b / 200);
    const rgb = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
    if (!rgb.every(c => c >= -0.002 && c <= 1.002)) continue;
    const hex = rgb.map(c => ('0' + Math.round(Math.max(0, Math.min(1, gam(c))) * 255).toString(16)).slice(-2)).join('');
    out.push({
      x: `${((a + S) / (2 * S) * 100).toFixed(2)}%`,
      y: `${((S - b) / (2 * S) * 100).toFixed(2)}%`,
      c: '#' + hex
    });
  }
  return out;
})();
function LandingChartArt() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '82%',
      aspectRatio: '1',
      background: 'var(--cream)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 0 0 1px var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 0,
      bottom: 0,
      width: 1,
      background: '#D8C8BC'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: 1,
      background: '#D8C8BC'
    }
  }), LANDING_CHART_DOTS.map((d, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      position: 'absolute',
      left: d.x,
      top: d.y,
      width: '4.6%',
      aspectRatio: '1',
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      background: d.c
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "landing-pick",
    style: landingPickDot('78%', '34%', 28, '#B0243A')
  }));
}
function LandingCard({
  art,
  title,
  desc,
  href,
  onClick
}) {
  // A real link where the tool has its own page (crawlable, opens in a new tab);
  // a plain click still switches in place
  const Tag = href ? 'a' : 'div';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    className: "landing-card",
    onClick: e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      onClick();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "landing-art",
    "aria-hidden": "true"
  }, art), /*#__PURE__*/React.createElement("div", {
    className: "landing-card-text"
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'Cormorant Garamond',
      fontWeight: 400,
      fontSize: 26,
      lineHeight: 1.1,
      color: 'var(--espresso)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.55,
      color: 'var(--espresso-mid)',
      textWrap: 'pretty'
    }
  }, desc)));
}
function Landing({
  onPick
}) {
  const cards = [{
    id: 'wheel',
    title: 'Explore by color',
    desc: 'Start from 46 shades on a color wheel, then go lighter or deeper.',
    art: /*#__PURE__*/React.createElement(LandingWheelArt, null)
  }, {
    id: 'dupe',
    title: 'Find a dupe',
    desc: 'Name a lipstick you own and see what matches.',
    art: /*#__PURE__*/React.createElement(LandingDupeArt, null)
  }, {
    id: 'photo',
    title: 'Match a photo',
    desc: 'Drop in any photo and tap the shade you want.',
    art: /*#__PURE__*/React.createElement(LandingPhotoArt, null)
  }, {
    id: 'hex',
    title: 'Use the color chart',
    desc: 'Pinpoint from hundreds of shades, or paste a hex code.',
    art: /*#__PURE__*/React.createElement(LandingChartArt, null)
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "landing-lede"
  }, "How do you want ", /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'italic',
      fontWeight: 400,
      color: 'var(--espresso-mid)'
    }
  }, "to search?")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.5,
      color: 'var(--espresso-mid)'
    }
  }, "Nearly 17,000 lip products at every price, matched by how they actually look.")), /*#__PURE__*/React.createElement("div", {
    className: "landing-grid"
  }, cards.map(c => /*#__PURE__*/React.createElement(LandingCard, {
    key: c.id,
    art: c.art,
    title: c.title,
    desc: c.desc,
    href: MODE_PAGES[c.id]?.path,
    onClick: () => onPick(c.id)
  }))));
}

// ── Main App ──────────────────────────────────────────────────────────────────
// Shown where results or the dupe search would be while the catalogue is still
// arriving (supabase-data.js loads it in parallel with the app).
function CatalogueLoading() {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 14,
      padding: '48px 16px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "preload-spinner"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond, serif',
      fontStyle: 'italic',
      fontSize: 18,
      color: 'var(--text-muted)'
    }
  }, "Loading nearly 17,000 shades\u2026"));
}

// Replaces the whole app when the catalogue can't be loaded, so visitors don't
// get a working-looking UI where every search says "no matches".
function DataLoadError() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      padding: 24,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'Cormorant Garamond, serif',
      fontStyle: 'italic',
      fontSize: 28,
      color: 'var(--espresso)'
    }
  }, "We couldn't load the lipstick catalogue."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      maxWidth: 380,
      lineHeight: 1.6
    }
  }, "This is usually a brief connection hiccup. Please try again in a moment."), /*#__PURE__*/React.createElement("button", {
    onClick: () => location.reload(),
    style: {
      padding: '10px 22px',
      borderRadius: 24,
      border: '1.5px solid var(--border)',
      background: '#fff',
      color: 'var(--espresso)',
      cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, "Refresh"));
}
function App() {
  // 'loading' | 'ready' | 'error' — see supabase-data.js
  const [dataStatus, setDataStatus] = useState(() => window.LIPSTICK_DATA_STATUS);
  useEffect(() => {
    const onData = () => setDataStatus(window.LIPSTICK_DATA_STATUS);
    window.addEventListener('lipstick-data', onData);
    onData(); // in case it settled between the first render and this effect
    return () => window.removeEventListener('lipstick-data', onData);
  }, []);
  const dataReady = dataStatus === 'ready';

  // Link this page was opened with, if any — see parseSharedLink
  const [initialLink] = useState(() => parseSharedLink(window.location.search));
  // Result filters as URL pairs — from the link at first, then whatever ResultsTable reports
  const [filterParams, setFilterParams] = useState(() => filterParamsFrom(window.location.search));
  useEffect(() => {
    if (initialLink && initialLink.type !== 'favorites') window.gtag?.('event', 'open_shared_link', {
      link_type: initialLink.type
    });
  }, []);

  // A ?color= link that is exactly a wheel color opens on the wheel with that
  // segment selected (that's how a wheel pick is shared); any other hex opens
  // the custom-color picker
  const [initialWheelColor] = useState(() => initialLink?.type === 'color' && PAGE_MODE !== 'hex' ? LIPSTICK_DATA.find(c => c.hex.toLowerCase() === initialLink.hex) || null : null);
  // A From Favorites address reopens the tab on the shade it showed, or the last one saved if that is gone
  const [initialFavorite] = useState(() => {
    if (initialLink?.type !== 'favorites') return null;
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('lipstick-wishlist') || '[]');
    } catch {}
    const k = initialLink.pick && `${initialLink.pick.brand}|${initialLink.pick.shade}`;
    return saved.find(p => `${p.brand}|${p.shade}` === k) || saved[saved.length - 1] || null;
  });
  const [selectedColor, setSelectedColor] = useState(() => initialWheelColor || initialFavorite && {
    ...listSeed(initialFavorite),
    auto: true
  });
  const [hoveredId, setHoveredId] = useState(null);
  const resultsRef = React.useRef(null);
  const [toneIdx, setToneIdx] = useState(null);
  const [mode, setMode] = useState(() => {
    // 'landing' | 'wheel' | 'photo' | 'hex' | 'dupe' | 'list'
    if (initialLink?.type === 'color') return initialWheelColor ? 'wheel' : 'hex';
    if (initialLink?.type === 'dupe') return 'dupe';
    if (initialLink?.type === 'favorites') return initialFavorite ? 'list' : 'wheel';
    if (PAGE_MODE) return PAGE_MODE;
    try {
      return localStorage.getItem('lipstick-visited') ? 'wheel' : 'landing';
    } catch {
      return 'landing';
    }
  });
  const [photoHex, setPhotoHex] = useState(null);
  // Custom color: hexDraft is where the dot sits on the map, hexHex the color whose matches were asked for
  const [hexHex, setHexHex] = useState(initialLink?.type === 'color' && !initialWheelColor ? initialLink.hex : null);
  const [hexDraft, setHexDraft] = useState(() => draftFromLab(hexToLab(hexHex || EXPLORER_STARTS[0][1])));
  const [hexOrigin, setHexOrigin] = useState(hexDraft);
  const [shadeZoom, setShadeZoom] = useState(null); // center of the map's close-up, or null for the full map
  const [shadeInfo, setShadeInfo] = useState(null);
  const [dupeProduct, setDupeProduct] = useState(null);
  // Bumped to remount DupeFinder, clearing its brand/shade search back to step 1
  const [dupeResetKey, setDupeResetKey] = useState(0);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lipstick-wishlist') || '[]');
    } catch {
      return [];
    }
  });
  const [showWishlist, setShowWishlist] = useState(false);
  // "brand|shade" of a visitor's first-ever heart, while My Favorites shows it off
  const [firstHeartKey, setFirstHeartKey] = useState(null);
  const [sharedListKeys, setSharedListKeys] = useState(initialLink?.type === 'list' ? initialLink.keys : null);
  const [showTweaks, setShowTweaks] = useState(false);

  // "My Lipstick Vibe" (saved finish, undertone and depth preferences) is gone; drop what it stored
  useEffect(() => {
    try {
      localStorage.removeItem('lipstick-vibe');
    } catch {}
  }, []);

  // Persist wishlist
  useEffect(() => {
    localStorage.setItem('lipstick-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);
  function switchMode(id, ui_source = 'tabs') {
    setMode(id);
    localStorage.setItem('lipstick-visited', '1');
    window.gtag?.('event', 'select_mode', {
      mode: id,
      ui_source
    });
    if (id === 'wheel') {
      setSelectedColor(null);
      setPhotoHex(null);
      setHexHex(null);
      setDupeProduct(null);
    } else if (id === 'photo') {
      setSelectedColor(null);
      setHexHex(null);
      setDupeProduct(null);
    } else if (id === 'hex') {
      setSelectedColor(null);
      setPhotoHex(null);
      setDupeProduct(null);
    } else if (id === 'dupe') {
      setSelectedColor(null);
      setPhotoHex(null);
      setHexHex(null);
      setDupeProduct(null);
    } else {
      // From Favorites opens on the last shade saved, so there are results straight away
      const last = wishlist[wishlist.length - 1];
      setSelectedColor(last ? {
        ...listSeed(last),
        auto: true
      } : null);
      setPhotoHex(null);
      setHexHex(null);
      setDupeProduct(null);
    }
  }
  function listSeed(p) {
    return {
      id: '__list__',
      name: `Similar to ${p.shade}`,
      hex: p.hex,
      sourceKey: `${p.brand}|${p.shade}`,
      item: p
    };
  }
  function toggleWishlist(product) {
    const productKey = `${product.brand}|${product.shade}`;
    if (!wishlist.some(p => `${p.brand}|${p.shade}` === productKey)) {
      // First heart ever: open My Favorites with the new row glowing, so the
      // visitor learns where saved shades go. Not while a shared list is open.
      let seen = true;
      try {
        seen = !!localStorage.getItem('lipstick-heart-intro');
        localStorage.setItem('lipstick-heart-intro', '1');
      } catch {}
      if (!seen && wishlist.length === 0 && !sharedListKeys) {
        window.gtag?.('event', 'first_heart_intro');
        setFirstHeartKey(productKey);
        // a beat, so the heart is seen filling in before the panel covers it
        setTimeout(() => setShowWishlist(true), 350);
      }
    }
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
    "maxDeltaE": 1.75,
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
        name: 'Your photo',
        hex: photoHex
      });
      window.gtag?.('event', 'select_color', {
        method: 'photo',
        hex: photoHex
      });
    } else {
      setSelectedColor(null);
    }
  }, [photoHex, mode]);

  // Same plumbing for the hex-picker mode
  // A ?color= link sets hexHex on load: ui_source tells those apart from presses of the results button
  const hexFromLink = React.useRef(!!hexHex);
  React.useEffect(() => {
    if (mode !== 'hex') return;
    if (hexHex) {
      setSelectedColor({
        id: '__hex__',
        name: describeColor(...hexToLab(hexHex)),
        hex: hexHex
      });
      // hexHex only changes when results are asked for, so this counts those requests, not map moves (shade_explore)
      window.gtag?.('event', 'select_color', {
        method: 'hex',
        hex: hexHex,
        ui_source: hexFromLink.current ? 'shared_link' : 'button'
      });
      hexFromLink.current = false;
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
    } else {
      setSelectedColor(null);
    }
  }, [dupeProduct, mode]);
  const colors = LIPSTICK_DATA;

  // Shared dupe link: the product can only be looked up once the catalogue is in
  useEffect(() => {
    if (!dataReady || initialLink?.type !== 'dupe' || !initialLink.brand || mode !== 'dupe') return;
    const p = findProduct(initialLink.brand, initialLink.shade);
    if (p) setDupeProduct(p);else window.gtag?.('event', 'shared_link_not_found', {
      link_type: 'dupe',
      brand: initialLink.brand,
      shade: initialLink.shade
    });
  }, [dataReady]);
  const sharedList = React.useMemo(() => {
    if (!sharedListKeys || !dataReady) return null;
    const items = [];
    for (const k of sharedListKeys) {
      const p = findProduct(k.brand, k.shade);
      if (p && !items.some(q => q.brand === p.brand && q.shade === p.shade)) {
        items.push({
          brand: p.brand,
          product: p.product,
          shade: p.shade,
          finish: p.finish,
          hex: p.hex
        });
      }
    }
    return {
      items,
      missing: sharedListKeys.length - items.length
    };
  }, [sharedListKeys, dataReady]);
  function saveSharedList() {
    const key = p => `${p.brand}|${p.shade}`;
    setWishlist(prev => {
      const have = new Set(prev.map(key));
      const add = sharedList.items.filter(p => !have.has(key(p)));
      window.gtag?.('event', 'save_shared_list', {
        item_count: add.length
      });
      return [...prev, ...add];
    });
  }

  // Custom color: the pick on the map, and (shortly after it stops moving) how many matches it has
  const draftCol = React.useMemo(() => draftColor(hexDraft), [hexDraft]);
  useEffect(() => {
    if (mode !== 'hex' || !dataReady) return;
    const t = setTimeout(() => setShadeInfo(shadeMatchInfo(draftCol.hex, tweaks.maxDeltaE)), 60);
    return () => clearTimeout(t);
  }, [draftCol.hex, mode, dataReady, tweaks.maxDeltaE]);
  // The pick goes in the URL as ?color= once the visitor has made one (or opened a link to one), so it
  // can be shared before results are asked for; written once the dot stops, as browsers limit how often it can change
  const [chartPicked, setChartPicked] = useState(!!hexHex);
  const [chartLinkHex, setChartLinkHex] = useState(hexHex);
  useEffect(() => {
    if (mode !== 'hex' || !chartPicked) return;
    const t = setTimeout(() => setChartLinkHex(draftCol.hex), 400);
    return () => clearTimeout(t);
  }, [draftCol.hex, mode, chartPicked]);
  // Moving the dot starts over: the results (and their filters) belong to the last color asked for
  // A pick made in the map's close-up is a step: it keeps hexOrigin, the color chosen before zooming, for "Return to"
  function changeHexDraft(next, step) {
    setHexDraft(next);
    setChartPicked(true);
    if (step !== true) setHexOrigin(next);
    if (hexHex) {
      setHexHex(null);
      setFilterParams([]);
    }
  }
  // Closing the results sheet (stacked layout) starts over the same way, and hands focus back to the bar's button
  function closeShadeResults() {
    setHexHex(null);
    setFilterParams([]);
    setTimeout(() => document.getElementById('shade-bar-cta')?.focus({
      preventScroll: true
    }), 50);
  }
  // From Favorites → the color chart, zoomed into the shades around a saved one
  function exploreOnChart(hex) {
    const d = draftFromLab(hexToLab(hex)),
      c = draftColor(d);
    switchMode('hex', 'favorites_explore');
    setHexDraft(d);
    setHexOrigin(d);
    setShadeZoom({
      a: c.a,
      b: c.b
    });
    setChartPicked(true);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  const jumpToNearestShade = () => {
    if (shadeInfo?.nearest) {
      trackExplore('jump_nearest');
      changeHexDraft(draftFromLab(shadeInfo.nearest.lab));
    }
  };

  // Tonal strip — 5-step ramp (2 lighter, anchor, 2 deeper) for every entry point
  // except Custom color, which has its own depth bar.
  const toneRamp = React.useMemo(() => {
    if (!selectedColor || mode === 'hex') return null;
    const base = generateToneSteps(selectedColor.hex, 2, 13, selectedColor.name || 'This shade');
    const ramp = base.ramp.map((step, i) => ({
      ...step,
      hasMatch: i === base.anchorIdx || nearestProductDistance(step.hex) <= NO_MATCH_DELTA_E
    }));
    return {
      ...base,
      ramp
    };
  }, [selectedColor?.id, selectedColor?.hex, mode, dataReady]);
  React.useEffect(() => {
    setToneIdx(toneRamp ? toneRamp.anchorIdx : null);
  }, [toneRamp]);
  function handleToneIdxChange(i) {
    setToneIdx(prev => {
      if (prev === i || !toneRamp) return i;
      const step = toneRamp.ramp[i];
      window.gtag?.('event', 'select_color', {
        method: 'tone_adjust',
        ui_source: mode,
        hex: step.hex,
        name: step.name
      });
      return i;
    });
  }
  const onAnchor = !toneRamp || toneIdx == null || toneIdx === toneRamp.anchorIdx;
  const effectiveColor = selectedColor && toneRamp && !onAnchor ? {
    ...selectedColor,
    hex: toneRamp.ramp[toneIdx].hex,
    name: toneRamp.ramp[toneIdx].name
  } : selectedColor;
  React.useEffect(() => {
    if (!effectiveColor || !resultsRef.current) return;
    // Custom color opens its results in a sheet and scrolls the map into view itself (ShadeExplorer)
    if (window.innerWidth > 900 || mode === 'hex') return;
    // A pick made for the visitor on opening From Favorites leaves the saved shades in view
    if (effectiveColor.auto) return;
    const timer = setTimeout(() => {
      resultsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [effectiveColor?.id, effectiveColor?.hex]);

  // Mirror what's on screen in the URL so it can be copied and shared
  useEffect(() => {
    const q = new URLSearchParams();
    if (sharedListKeys) sharedListKeys.forEach(k => q.append('item', `${k.brand}|${k.shade}`));else if (mode === 'dupe' && dupeProduct) {
      q.set('brand', dupeProduct.brand);
      q.set('dupe', dupeProduct.shade);
    } else if (mode === 'dupe' && !dataReady && initialLink?.type === 'dupe') {
      q.set('brand', initialLink.brand);
      q.set('dupe', initialLink.shade);
    } else if (mode === 'list') {
      q.set('mode', 'favorites');
      if (selectedColor?.item) q.set('pick', selectedColor.sourceKey);
    } else if (mode !== 'dupe' && effectiveColor) q.set('color', effectiveColor.hex.slice(1).toLowerCase());else if (mode === 'hex' && chartPicked && chartLinkHex) q.set('color', chartLinkHex.slice(1).toLowerCase());
    if (q.has('color') || q.has('dupe') || q.has('pick')) filterParams.forEach(([k, v]) => q.append(k, v));
    const search = q.toString() ? `?${q}` : '';
    const path = MODE_PAGES[mode]?.path || '/';
    const url = path + search + window.location.hash;
    const write = () => {
      if (search !== window.location.search || path !== window.location.pathname) history.replaceState(history.state, '', url);
    };
    backNav.syncUrl = write;
    // A change of tool is a new history entry (not when Back or Forward brought us here: that entry exists)
    const newTool = mode !== urlMode.current && !fromPop.current;
    urlMode.current = mode;
    fromPop.current = false;
    const push = () => history.pushState({
      mode
    }, '', url);
    if (!newTool) write();else if (backNav.leaving || backNav.skip) backNav.afterLeave = push; // a panel closed by the same click goes first
    else push();
    document.title = MODE_PAGES[mode]?.title || HOME_TITLE;
  }, [sharedListKeys, mode, dupeProduct, effectiveColor?.hex, selectedColor?.sourceKey, dataReady, filterParams, chartPicked, chartLinkHex]);

  // Back or Forward onto another tool's entry: show that tool, nothing picked
  const [firstMode] = useState(mode);
  const urlMode = React.useRef(mode),
    fromPop = React.useRef(false);
  useEffect(() => {
    backNav.onTool = e => {
      const next = e.state?.mode || Object.keys(MODE_PAGES).find(m => window.location.pathname.startsWith(MODE_PAGES[m].path)) || firstMode;
      if (next === urlMode.current) return;
      fromPop.current = true;
      setMode(next);
      setSelectedColor(null);
      setPhotoHex(null);
      setHexHex(null);
      setDupeProduct(null);
      setFilterParams([]);
    };
    return () => {
      backNav.onTool = null;
    };
  }, []);
  const matches = React.useMemo(() => {
    if (!selectedColor || !dataReady) return [];
    const hex = toneRamp && toneIdx != null && !onAnchor ? toneRamp.ramp[toneIdx].hex : selectedColor.hex;
    // Custom color and the wheel (Onyx): every black lipstick answers a black pick, closest first
    const target = hexToLab(hex);
    if ((mode === 'hex' || mode === 'wheel') && isBlackLab(target)) {
      return REAL_PRODUCTS.filter(p => isBlackLab(p.lab)).map(p => ({
        ...p,
        distance: deltaE(target, p.lab)
      })).sort((a, b) => a.distance - b.distance);
    }
    const candidates = getClosestColors(hex, 500).filter(p => !selectedColor.sourceKey || `${p.brand}|${p.shade}` !== selectedColor.sourceKey);
    return matchBand(candidates, tweaks.maxDeltaE, mode === 'hex' ? target : null);
  }, [selectedColor, toneRamp, toneIdx, tweaks.maxDeltaE, dataReady, mode]);
  // matches: array of real products with .hex .brand .product .shade .finish .retailer .distance
  function togglePin(product) {
    setPinnedItems(prev => {
      const key = p => `${p.brand}|${p.shade}`;
      const exists = prev.some(p => key(p) === key(product));
      if (exists) return prev.filter(p => key(p) !== key(product));
      if (prev.length >= MAX_COMPARE) return prev;
      window.gtag?.('event', 'pin_item', {
        brand: product.brand,
        shade: product.shade
      });
      return [...prev, product];
    });
  }

  // Color wheel is now the only palette style

  if (dataStatus === 'error') return /*#__PURE__*/React.createElement(DataLoadError, null);

  // Custom color shows its pick on the card above the results, so they skip their own color header
  const resultsEl = selectedColor && !dataReady ? /*#__PURE__*/React.createElement(CatalogueLoading, null) : /*#__PURE__*/React.createElement(ResultsTable, {
    selectedColor: effectiveColor,
    matches: matches,
    totalProducts: REAL_PRODUCTS.length,
    pinnedItems: pinnedItems,
    togglePin: togglePin,
    wishlist: wishlist,
    toggleWishlist: toggleWishlist,
    toneRamp: toneRamp,
    toneIdx: toneIdx,
    setToneIdx: handleToneIdxChange,
    initialFilterParams: filterParams,
    onFiltersChange: setFilterParams,
    hideHeader: mode === 'hex'
  });
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
      alignItems: 'center',
      gap: 16,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'DM Sans',
      fontWeight: 500,
      fontSize: 13,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--espresso)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    "aria-current": mode === 'landing' ? 'page' : undefined,
    onClick: e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (mode !== 'landing') {
        switchMode('landing', 'title');
        window.scrollTo({
          top: 0
        });
      }
    },
    onMouseEnter: e => {
      e.currentTarget.style.color = 'var(--espresso-mid)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.color = 'inherit';
    },
    style: {
      display: 'inline-block',
      padding: '8px 0',
      margin: '-8px 0',
      color: 'inherit',
      textDecoration: 'none',
      transition: 'color 0.15s'
    }
  }, "Lipstick Color Finder")), /*#__PURE__*/React.createElement("span", {
    className: "header-product-count",
    style: {
      fontFamily: 'DM Sans',
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.02em'
    }
  }, "\xB7 Nearly 17,000 lip products"), /*#__PURE__*/React.createElement("div", {
    className: "header-actions",
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "/guides/",
    className: "header-how-it-works",
    onClick: () => window.gtag?.('event', 'nav_link_click', {
      target: 'guides',
      location: 'header'
    }),
    style: {
      position: 'relative',
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
      e.currentTarget.style.color = 'var(--blush-deep)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.color = 'var(--espresso)';
    }
  }, "Guides", /*#__PURE__*/React.createElement(GuidesNewTag, null)), /*#__PURE__*/React.createElement("a", {
    href: "/about/",
    className: "header-how-it-works",
    onClick: () => window.gtag?.('event', 'nav_link_click', {
      target: 'about',
      location: 'header'
    }),
    style: {
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
      e.currentTarget.style.color = 'var(--blush-deep)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.color = 'var(--espresso)';
    }
  }, "How I Built It"), /*#__PURE__*/React.createElement("button", {
    className: "header-fav",
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
      e.currentTarget.style.color = 'var(--blush-deep)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.color = 'var(--espresso)';
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--blush)'
    }
  }, HEART), " My Favorites", wishlist.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--blush-deep)',
      color: '#fff',
      fontSize: 10,
      padding: '1px 7px',
      borderRadius: 20,
      marginLeft: 2
    }
  }, wishlist.length))), /*#__PURE__*/React.createElement("nav", {
    className: "header-mobile-links",
    "aria-label": "Pages"
  }, [['/guides/', 'Guides', 'guides'], ['/about/', 'How I Built It', 'about']].map(([href, label, target]) => /*#__PURE__*/React.createElement("a", {
    key: target,
    href: href,
    onClick: () => window.gtag?.('event', 'nav_link_click', {
      target,
      location: 'header'
    }),
    style: {
      position: 'relative',
      color: 'var(--espresso-mid)',
      textDecoration: 'none',
      fontFamily: 'DM Sans',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      borderBottom: '1px solid var(--border)',
      paddingBottom: 2
    }
  }, label, target === 'guides' && /*#__PURE__*/React.createElement(GuidesNewTag, {
    top: -3,
    right: -12
  }))))), mode === 'landing' ? /*#__PURE__*/React.createElement("main", {
    className: "landing-main"
  }, /*#__PURE__*/React.createElement(Landing, {
    onPick: id => switchMode(id, 'landing')
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "mode-bar",
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      background: 'var(--cream-dark)',
      borderBottom: '1px solid var(--border)'
    }
  }, [{
    id: 'wheel',
    label: 'Color wheel'
  }, {
    id: 'dupe',
    label: 'Dupe finder'
  }, {
    id: 'photo',
    label: 'Upload photo'
  }, {
    id: 'hex',
    label: 'Color chart'
  }, ...(wishlist.length > 0 ? [{
    id: 'list',
    label: 'From Favorites'
  }] : [])].map(t => {
    const active = mode === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      className: "mode-tab",
      onClick: () => switchMode(t.id),
      style: {
        fontFamily: 'DM Sans',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        flexShrink: 0,
        textAlign: 'left',
        background: active ? '#fff' : 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--blush)' : 'transparent'}`,
        padding: '14px 20px 12px',
        cursor: 'pointer',
        transition: 'background 0.15s'
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mode-tab-icon",
      style: {
        width: 30,
        height: 30,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'rgba(200,120,144,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? 'var(--blush-deep)' : 'var(--text-muted)'
      }
    }, MODE_ICONS[t.id](22)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14.5,
        color: active ? 'var(--espresso)' : 'var(--text-body)',
        whiteSpace: 'nowrap'
      }
    }, t.label));
  })), /*#__PURE__*/React.createElement("main", {
    className: "app-main",
    style: {
      paddingBottom: pinnedItems.length > 0 ? 190 : undefined,
      transition: 'padding-bottom 0.35s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: mode === 'hex' ? 'shade-top' : 'palette-col'
  }, mode === 'wheel' ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(ColorWheel, {
    colors: colors,
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
    onHover: setHoveredId
  })) : mode === 'photo' ? /*#__PURE__*/React.createElement(PhotoPicker, {
    sampledHex: photoHex,
    onColor: setPhotoHex
  }) : mode === 'hex' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "shade-picker"
  }, /*#__PURE__*/React.createElement(ShadeExplorer, {
    draft: hexDraft,
    color: draftCol,
    origin: hexOrigin,
    zoom: shadeZoom,
    onZoom: setShadeZoom,
    onStep: d => changeHexDraft(d, true),
    info: shadeInfo,
    committed: !!hexHex,
    pinned: pinnedItems.length > 0,
    onDraft: changeHexDraft,
    onCommit: () => setHexHex(draftCol.hex),
    onJump: jumpToNearestShade
  })), /*#__PURE__*/React.createElement("div", {
    className: "shade-side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "results-empty-state"
  }, /*#__PURE__*/React.createElement(ShadeCard, {
    color: draftCol,
    info: shadeInfo,
    committed: !!hexHex,
    onCommit: () => setHexHex(draftCol.hex),
    onJump: jumpToNearestShade,
    onDraft: changeHexDraft,
    origin: hexOrigin,
    zoom: shadeZoom,
    onZoom: setShadeZoom
  }), hexHex && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: EXPLORER_TYPE.body,
      color: 'var(--espresso-mid)',
      textAlign: 'center',
      marginTop: 12
    }
  }, "Move the dot or the depth bar to start over.")), !hexHex && /*#__PURE__*/React.createElement("div", {
    className: "results-empty-state"
  }, /*#__PURE__*/React.createElement(ShadeHexForm, {
    id: "shade-hex-side",
    onDraft: changeHexDraft
  })), hexHex && /*#__PURE__*/React.createElement(ShadeSheet, {
    color: draftCol,
    info: shadeInfo,
    pinned: pinnedItems.length > 0,
    onClose: closeShadeResults
  }, resultsEl))) : mode === 'dupe' && !dataReady ? /*#__PURE__*/React.createElement(CatalogueLoading, null) : mode === 'dupe' ? /*#__PURE__*/React.createElement(DupeFinder, {
    key: dupeResetKey,
    product: dupeProduct,
    onSelect: setDupeProduct,
    onUsePhoto: () => {
      setMode('photo');
      setDupeProduct(null);
    }
  }) : /*#__PURE__*/React.createElement(ListPicker, {
    wishlist: wishlist,
    selectedKey: selectedColor?.sourceKey,
    onPick: p => {
      setSelectedColor(listSeed(p));
      window.gtag?.('event', 'select_color', {
        method: 'list',
        hex: p.hex,
        name: p.shade
      });
    }
  }), selectedColor && mode !== 'hex' && mode !== 'list' && /*#__PURE__*/React.createElement("div", {
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
      // In dupe mode, clearing the pill starts the search over (brand included)
      if (mode === 'dupe') {
        setDupeProduct(null);
        setDupeResetKey(k => k + 1);
      } else setSelectedColor(null);
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
  }, "\xD7")), selectedColor && mode === 'list' && (() => {
    const p = selectedColor.item;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        maxWidth: 440,
        marginTop: 20,
        background: '#fff',
        borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: '0 2px 12px var(--shadow)',
        overflow: 'hidden',
        animation: 'fadeUp 0.2s ease'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px'
      }
    }, /*#__PURE__*/React.createElement(ShadeChip, {
      hex: p.hex,
      height: 72,
      width: 9
    }), /*#__PURE__*/React.createElement(ProductThumb, {
      product: p,
      size: 72,
      tint: false
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 12,
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase'
      }
    }, p.brand), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 16,
        fontWeight: 500,
        color: 'var(--espresso)',
        lineHeight: 1.25,
        marginTop: 2
      }
    }, p.shade))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 16px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'DM Sans',
        fontSize: 13,
        color: 'var(--text-body)',
        lineHeight: 1.5
      }
    }, "Want it a little warmer or cooler? See the shades around it on the color chart."), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => exploreOnChart(p.hex),
      style: {
        fontFamily: 'DM Sans',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        minHeight: 44,
        padding: '10px 18px',
        borderRadius: 40,
        border: 'none',
        background: 'var(--espresso)',
        color: 'var(--cream)',
        cursor: 'pointer'
      }
    }, "Explore shades near ", p.shade, " \u2192")));
  })(), mode === 'wheel' && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.05em',
      fontFamily: 'DM Sans',
      marginTop: 8,
      textAlign: 'center'
    }
  }, "Select a color to browse matching lipstick shades"), !selectedColor && mode !== 'dupe' && mode !== 'hex' && /*#__PURE__*/React.createElement("div", {
    className: "mobile-picker-tips",
    style: {
      justifyContent: 'center',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'DM Sans',
      fontSize: 13,
      color: 'var(--text-muted)',
      letterSpacing: '0.02em'
    }
  }, "Your matches will appear here"))), mode !== 'hex' && /*#__PURE__*/React.createElement("div", {
    className: "results-col",
    ref: resultsRef
  }, resultsEl))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: mode === PAGE_MODE ? 'block' : 'none'
    },
    ref: el => {
      const copy = document.getElementById('page-copy');
      if (el && copy && copy.parentNode !== el) el.appendChild(copy);
    }
  }), /*#__PURE__*/React.createElement("footer", {
    className: "app-footer",
    style: {
      borderTop: '1px solid var(--border)',
      display: 'flex',
      gap: 24,
      alignItems: 'center'
    }
  }, mode !== 'landing' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.05em'
    }
  }, "Showing closest matches by color distance (\u0394E)"), /*#__PURE__*/React.createElement("a", {
    href: "/color-science/",
    onClick: () => window.gtag?.('event', 'nav_link_click', {
      target: 'color_guide',
      location: 'footer'
    }),
    style: {
      fontSize: 11,
      color: 'var(--blush-deep)',
      letterSpacing: '0.05em',
      textDecoration: 'none',
      borderBottom: '1px solid currentColor',
      paddingBottom: 1,
      transition: 'opacity 0.15s'
    }
  }, "What is \u0394E?")), /*#__PURE__*/React.createElement("a", {
    href: "/about/",
    onClick: () => window.gtag?.('event', 'nav_link_click', {
      target: 'about',
      location: 'footer'
    }),
    style: {
      fontSize: 11,
      color: 'var(--blush-deep)',
      letterSpacing: '0.05em',
      textDecoration: 'none',
      borderBottom: '1px solid currentColor',
      paddingBottom: 1,
      transition: 'opacity 0.15s'
    }
  }, "How I Built It"), /*#__PURE__*/React.createElement("a", {
    href: "/guides/",
    onClick: () => window.gtag?.('event', 'nav_link_click', {
      target: 'guides',
      location: 'footer'
    }),
    style: {
      fontSize: 11,
      color: 'var(--blush-deep)',
      letterSpacing: '0.05em',
      textDecoration: 'none',
      borderBottom: '1px solid currentColor',
      paddingBottom: 1,
      transition: 'opacity 0.15s'
    }
  }, "Guides"), /*#__PURE__*/React.createElement("a", {
    href: "/privacy/",
    style: {
      fontSize: 11,
      color: 'var(--blush-deep)',
      letterSpacing: '0.05em',
      textDecoration: 'none',
      borderBottom: '1px solid currentColor',
      paddingBottom: 1,
      transition: 'opacity 0.15s'
    }
  }, "Privacy"), /*#__PURE__*/React.createElement("a", {
    href: "https://www.pinterest.com/lipstickbycolor/",
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: () => window.gtag?.('event', 'nav_link_click', {
      target: 'pinterest',
      location: 'footer'
    }),
    style: {
      fontSize: 11,
      color: 'var(--blush-deep)',
      letterSpacing: '0.05em',
      textDecoration: 'none',
      borderBottom: '1px solid currentColor',
      paddingBottom: 1,
      transition: 'opacity 0.15s'
    }
  }, "Pinterest"), selectedColor && matches.length > 0 && /*#__PURE__*/React.createElement("span", {
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
  }), sharedListKeys && /*#__PURE__*/React.createElement(SharedListPanel, {
    items: sharedList?.items,
    missing: sharedList?.missing || 0,
    loading: !sharedList,
    wishlist: wishlist,
    toggleWishlist: toggleWishlist,
    onSaveAll: saveSharedList,
    onClose: () => setSharedListKeys(null)
  }), showWishlist && /*#__PURE__*/React.createElement(WishlistPanel, {
    wishlist: wishlist,
    glowKey: firstHeartKey,
    onClose: () => {
      setShowWishlist(false);
      setFirstHeartKey(null);
    },
    onRemove: p => toggleWishlist(p),
    onClear: () => setWishlist([]),
    onFindSimilar: () => {
      setShowWishlist(false);
      setFirstHeartKey(null);
      switchMode('list', 'favorites_panel');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
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
