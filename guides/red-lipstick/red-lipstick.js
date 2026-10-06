// Interactive parts of guides/red-lipstick/index.html. The page's text, lists and images are
// all in the HTML; this only flips cards, moves the map popover and runs search.
(function () {
  const SUPABASE_URL = 'https://xhmxvocjqcccrriovyfj.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_2RQlqm5VuZaTBZ7qrd5V1A_eSjFIpaB';
  const ASSETS = '/guides/assets/';

  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const setText = (key, v) => $$(`[data-t="${key}"]`).forEach(el => { el.textContent = v; });
  const setIf = (key, on) => $$(`[data-if="${key}"]`).forEach(el => { el.hidden = !on; });
  const focusEl = el => { if (el) el.focus({ preventScroll: true }); };
  const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // Analytics: no-ops until the visitor has allowed it (see /consent.js)
  const track = (name, params) => window.gtag?.('event', name, { guide: 'red-lipstick', ...params });
  const slug = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  // Title-case catalogue names; a letter after an apostrophe or accent stays lower
  const cap = t => (t || '').replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (m, pre, c) => pre + c.toUpperCase());

  // ── Color math ──────────────────────────────────────────────────────────────
  function lchRgb(L, C, h) {
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    let y = (L + 16) / 116, x = a / 500 + y, z = y - b / 200;
    const f = t => t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
    x = 0.95047 * f(x); y = f(y); z = 1.08883 * f(z);
    const gm = c => { c = c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c; return Math.round(Math.max(0, Math.min(1, c)) * 255); };
    return [gm(x * 3.2406 - y * 1.5372 - z * 0.4986), gm(-x * 0.9689 + y * 1.8758 + z * 0.0415), gm(x * 0.0557 - y * 0.204 + z * 1.057)];
  }
  function hex2lab(hex) {
    const lin = v => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; };
    const r = lin(parseInt(hex.slice(1, 3), 16)), g = lin(parseInt(hex.slice(3, 5), 16)), b = lin(parseInt(hex.slice(5, 7), 16));
    const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function de2000([L1, a1, b1], [L2, a2, b2]) {
    const rad = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
    const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
    const ap1 = a1 * (1 + G), ap2 = a2 * (1 + G), Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
    const hp = (b, a) => { const h = Math.atan2(b, a) / rad; return h < 0 ? h + 360 : h; };
    const h1 = hp(b1, ap1), h2 = hp(b2, ap2);
    const dL = L2 - L1, dC = Cp2 - Cp1;
    let dh = h2 - h1; if (Cp1 * Cp2 === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
    const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(dh / 2 * rad);
    const Lb = (L1 + L2) / 2, Cpb = (Cp1 + Cp2) / 2;
    let hb = h1 + h2; if (Cp1 * Cp2 !== 0) { if (Math.abs(h1 - h2) > 180) hb += h1 + h2 < 360 ? 360 : -360; hb /= 2; }
    const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad);
    const SL = 1 + 0.015 * (Lb - 50) ** 2 / Math.sqrt(20 + (Lb - 50) ** 2), SC = 1 + 0.045 * Cpb, SH = 1 + 0.015 * Cpb * T;
    const RT = -2 * Math.sqrt(Cpb ** 7 / (Cpb ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hb - 275) / 25) ** 2)) * rad);
    return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
  }

  // What counts as red: hue 18–42°, L* 20–55, and enough chroma. The floor is 45,
  // rising on the orange side (where weak color reads as brick or brown) and
  // above L* 40 (where a lighter shade needs stronger color to stay red, or it
  // reads as terracotta). L defaults to 40 for the map, which is drawn there.
  const minC = (h, L = 40) => Math.max(45 + Math.max(0, h - 34) * 13 / 8, 45 + 1.5 * Math.max(0, L - 40));
  function redCheck(L, a, b) {
    const C = Math.hypot(a, b); let h = Math.atan2(b, a) * 180 / Math.PI; if (h > 180) h -= 360;
    const ok = h >= 18 && h <= 42 && L >= 20 && L <= 55 && C >= minC(h, L);
    const why = ok ? '' : L > 55 ? 'too coral' : L < 20 ? 'too dark' : h < 18 ? 'too pink' : h > 42 ? 'too orange' : 'too brown';
    return { ok, why, h };
  }
  const toneOf = h => h < 26 ? 'blue' : h < 34 ? 'true' : 'orange';
  const depthOf = L => L >= 45 ? 'bright' : L >= 35 ? 'classic' : 'deep';
  const KINDS = {
    'bright-blue': 'raspberry red', 'bright-true': 'fire-engine', 'bright-orange': 'poppy',
    'classic-blue': 'cherry', 'classic-true': 'classic red', 'classic-orange': 'tomato',
    'deep-blue': 'black cherry', 'deep-true': 'oxblood', 'deep-orange': 'brick',
  };

  // ── Famous reds: [name, price tier, hex, hue, L*, photo file stem, photo order] ──
  const ICONS = [
    ['MAC Ruby Woo', '$$', '#aa2d34', 27.5, 39.1, 'ruby-woo-lips-', [1, 2, 3]],
    ['MAC Russian Red', '$$', '#912c2c', 30, 34, 'russian-red-lips-', [1, 2, 3]],
    ['NARS Dragon Girl', '$$$', '#b70e23', 31.1, 38.7, 'dragon-girl-lips-', [1, 2, 3]],
    ['Chanel Pirate', '$$$$', '#c52638', 26.6, 43.5, ['pirate-lips-1.webp?v=2', 'pirate-lips-2.webp?v=2', 'pirate-bullet-3.webp']],
    ['Pat McGrath Elson', '$$$', '#af2737', 25.1, 39.4, 'elson-lips-', [1, 2, 3]],
    ['Charlotte Tilbury Love Liberty', '$$$', '#86222e', 22.9, 30.5, 'love-liberty-lips-', [2, 1, 3]],
    ['Givenchy Le Rouge 334 Grenat Volontaire', '$$$$', '#b22137', 23.9, 39.3, 'grenat-volontaire-lips-', [1, 2, 3]],
    ['MAC Lady Danger', '$$', '#de2a21', 37.1, 48.8, 'lady-danger-lips-', [1, 2, 3]],
    ['Tom Ford Scarlet Rouge', '$$$$', '#d3222c', 32.1, 45.9, 'tom-ford-scarlet-rouge-lips-', [2, 1, 3]],
    ['Lancôme L\'Absolu Rouge 196 French Touch', '$$$', '#913227', 35.7, 34.9, 'lancome-196-french-touch-lips-', [1, 2, 3]],
    ['Armani Lip Maestro 405 Sultan', '$$$$', '#951f13', 38.2, 32.7, 'armani-405-sultan-lips-', [1, 2, 3]],
    ['Revlon 806 Electric Melon', '$', '#f83155', 21.9, 54.9, 'revlon-806-electric-melon-lips-', ['1', '2b', '3']],
    ['Dior 784 Rouge Rose', '$$$$', '#e23959', 18.7, 51.6, 'dior-784-rouge-rose-lips-', [1, 2, 3]],
    ['Dior 777 Fahrenheit', '$$$$', '#b33125', 36.5, 41.1, 'dior-777-fahrenheit-lips-', [1, 2, 3]],
    ['Dior Rouge 999', '$$$$', '#b0222a', 30.4, 38.8, 'dior-999-satin-lips-', [1, 2, 3]],
    ['Charlotte Tilbury Red Carpet Red', '$$$', '#7e151c', 30.0, 26.9, 'red-carpet-red-lips-', [1, 2, 3]],
    ['MAC Relentlessly Red', '$$', '#e0304f', 21.5, 50.1, 'relentlessly-red-lips-', [1, 2, 3]],
    ['Revlon Cherries in the Snow 440', '$', '#c50c3c', 21.4, 41.8, 'cherries-in-the-snow-lips-', [1, 2, 3]],
    ['Fenty Beauty Stunna Uncensored', '$$', '#b32126', 33.3, 39.2, 'uncensored-lips-', [3, 2, 1]],
    ['Revlon 720 Fire & Ice', '$', '#db2129', 33.4, 47.4, 'fire-and-ice-lips-', ['1', '2b', '4']],
    ['Gucci Rouge à Lèvres Satin Goldie Red', '$$$$', '#a20313', 34.8, 33.5, 'goldie-red-lips-', [1, 2, 3]],
    ['Lisa Eldridge True Velvet Velvet Ribbon', '$$', '#b91b2f', 27.7, 40.1, 'velvet-ribbon-lips-', [1, 2, 3]],
    ['Lisa Eldridge True Velvet Velvet Dragon', '$$', '#ad2d13', 41.6, 39.3, 'velvet-dragon-lips-', [2, 1, 3]],
    ['Maybelline SuperStay Matte Ink Ruler', '$', '#961e32', 21.5, 33.2, 'ruler-lips-', [1, 2, 3]],
    ['YSL Le Orange', '$$$$', '#ca3121', 38.1, 45.4, 'le-orange-lips-', [1, 2, 3], '?v=2'],
    ['Dior 550 Red Shock', '$$$$', '#8b1b1c', 32.7, 30.3, 'red-shock-lips-', [1, 2, 3]],
  ].map(([name, tier, hex, h, L, stem, order, bust]) => ({
    key: name, name, tier, hex, h, L,
    photos: (order ? order.map(n => stem + n + '.webp' + (bust || '')) : stem).map(f => ASSETS + f),
  }));
  const BRANDS = ['Armani', 'Lancôme', 'Charlotte Tilbury', 'Pat McGrath', 'Fenty Beauty', 'Tom Ford', 'Lisa Eldridge', 'Maybelline', 'MAC', 'NARS', 'Chanel', 'Revlon', 'Dior', 'Gucci', 'YSL', 'Givenchy'];
  const LINES = /^(L'Absolu Rouge|Lip Maestro|Stunna|Rouge à Lèvres Satin|True Velvet|SuperStay Matte Ink|Rouge Dior Forever Liquid|Rouge Dior|Le Rouge) /;

  const state = { flipped: null, hoverKind: null, redCard: null, icon: null, mine: null };

  // ── Nine kinds: flip cards ──────────────────────────────────────────────────
  const tiles = $$('[data-kind]');
  function renderKinds() {
    tiles.forEach(tile => {
      const key = tile.dataset.kind, on = state.flipped === key || state.hoverKind === key;
      const inner = tile.firstElementChild, [front, back] = inner.children;
      inner.style.transform = on ? 'rotateY(180deg)' : 'none';
      front.setAttribute('aria-hidden', on); front.inert = on;
      back.setAttribute('aria-hidden', !on); back.inert = !on;
      $('kind-front-' + key).setAttribute('aria-expanded', on);
    });
  }
  function flipKind(key) {
    state.flipped = state.flipped === key ? null : key;
    if (state.flipped) track('guide_kind_open', { kind: key });
    renderKinds();
    focusEl($((state.flipped ? 'kind-back-' : 'kind-front-') + key));
  }
  let hoverTimer;
  tiles.forEach(tile => {
    const key = tile.dataset.kind;
    // A mouse click on a tile that hover already flipped shouldn't flip it back
    tile.addEventListener('click', e => { if (state.hoverKind === key && e.detail > 0) return; flipKind(key); });
    tile.addEventListener('mouseenter', () => {
      if (!finePointer()) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => { state.hoverKind = key; renderKinds(); }, 200);
    });
    tile.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      if (state.hoverKind === key) { state.hoverKind = null; renderKinds(); }
    });
  });

  // ── Reddest red: list on the front, one shade's details on the back ─────────
  const redFlip = $('red-flip'), redFront = $('red-card-front'), redBack = $('red-card-back');
  const redCards = $$('[data-red-card]');
  function renderRed() {
    const on = !!state.redCard;
    if (on) redCards.forEach(c => { c.hidden = c.dataset.redCard !== state.redCard; });
    redFlip.style.transform = on ? 'rotateY(180deg)' : 'none';
    redFront.style.position = on ? 'absolute' : 'relative';
    redBack.style.position = on ? 'relative' : 'absolute';
    redFront.setAttribute('aria-hidden', on); redFront.inert = on;
    redBack.setAttribute('aria-hidden', !on); redBack.inert = !on;
  }
  function showRed(key) {
    state.redCard = key; renderRed();
    track('guide_reddest_open', { shade: key });
    focusEl(redBack.querySelector(`[data-red-card="${key}"] [data-red-back]`));
  }
  function backRed() {
    const prev = state.redCard;
    state.redCard = null; renderRed();
    focusEl($('red-row-' + prev));
  }
  redCards.forEach(card => {
    const key = card.dataset.redCard, row = $('red-row-' + key);
    row.addEventListener('click', () => showRed(key));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showRed(key); } });
    card.querySelector('[data-red-back]').addEventListener('click', backRed);
  });
  // Tapping the empty red around an open shade goes back to the list
  redFlip.closest('section').addEventListener('click', e => {
    if (state.redCard && !redFlip.contains(e.target) && !e.target.closest('a, button')) backRed();
  });

  // ── Famous reds map ─────────────────────────────────────────────────────────
  const pop = $('pop'), popPhotos = $$('[data-if="sel.hasPhotos"] img');
  const dotId = key => 'dot-' + slug(key);
  const rows = () => state.mine ? ICONS.concat(state.mine) : ICONS;

  function describe(r) {
    const t = toneOf(r.h), d = depthOf(r.L), kind = KINDS[d + '-' + t];
    // Within 2 units of a border, say which neighbour it leans toward
    const near = [
      [Math.abs(r.h - 26), r.h < 26 ? [d, 'true'] : t === 'true' ? [d, 'blue'] : null],
      [Math.abs(r.h - 34), r.h < 34 ? (t === 'true' ? [d, 'orange'] : null) : [d, 'true']],
      [Math.abs(r.L - 45), r.L >= 45 ? ['classic', t] : d === 'classic' ? ['bright', t] : null],
      [Math.abs(r.L - 35), r.L >= 35 ? (d === 'classic' ? ['deep', t] : null) : ['classic', t]],
    ].filter(([dist, c]) => c && dist < 2).sort((a, b) => a[0] - b[0])[0];
    const corner = Math.min(Math.abs(r.h - 26), Math.abs(r.h - 34)) < 2 && Math.min(Math.abs(r.L - 45), Math.abs(r.L - 35)) < 2;
    return {
      kind, art: /^[aeiou]/.test(kind) ? 'an' : 'a',
      lean: corner ? ', right where four reds meet' : near ? ', leaning ' + KINDS[near[1].join('-')] : '',
      brand: r.isMine ? r.brand : (BRANDS.find(b => r.name.startsWith(b + ' ')) || ''),
      shade: r.isMine ? r.shade : r.name.replace(new RegExp('^(' + BRANDS.join('|') + ') '), '').replace(LINES, ''),
      x: ((r.h - 18) / 24 * 100).toFixed(1) + '%',
      y: ((r.L >= 45 ? (55 - r.L) / 10 : r.L >= 35 ? 1 + (45 - r.L) / 10 : 2 + (35 - r.L) / 15) / 3 * 100).toFixed(1) + '%',
    };
  }

  function renderMap() {
    rows().forEach(r => {
      const dot = $(dotId(r.key)), on = state.icon === r.key, s = dot.style;
      dot.setAttribute('aria-expanded', on);
      s.width = s.height = on ? '33px' : '24px';
      s.margin = on ? '-16.5px 0 0 -16.5px' : '-12px 0 0 -12px';
      s.boxShadow = r.isMine ? '0 0 0 3px #C87890, 0 6px 16px rgba(42,26,20,.3)' : on ? '0 0 0 2px #2A1A14, 0 6px 16px rgba(42,26,20,.3)' : '0 2px 6px rgba(42,26,20,.25)';
      s.zIndex = on ? 3 : r.isMine ? 2 : 1;
    });

    const sel = rows().find(r => r.key === state.icon);
    setIf('hasSel', !!sel);
    if (!sel) return;
    const d = describe(sel);
    pop.setAttribute('aria-label', sel.name);
    pop.style.left = `clamp(8px, calc(${d.x} - min(190px, calc(50% - 8px))), calc(100% - min(380px, calc(100% - 16px)) - 8px))`;
    pop.style.top = d.y;
    pop.style.transform = `translateY(${sel.L >= 40 ? '22px' : 'calc(-100% - 22px)'})`;
    setText('sel.brand', d.brand); setText('sel.shade', d.shade);
    setText('sel.art', d.art); setText('sel.kind', d.kind); setText('sel.lean', d.lean);
    setText('sel.tier', sel.tier); setText('sel.hex', sel.hex);
    setText('sel.closest', sel.closest || ''); setText('sel.closestDe', sel.closestDe || '');
    setIf('sel.isMine', !!sel.isMine);
    setIf('sel.noPhotos', !sel.photos.length);
    setIf('sel.hasPhotos', sel.photos.length > 0);
    pop.querySelector('[data-if="sel.noPhotos"]').firstElementChild.style.background = sel.hex;
    pop.querySelector('div[data-if="sel.isMine"] a').href = '/?color=' + sel.hex.slice(1);
    const skin = ['deep', 'medium', 'light'];
    sel.photos.forEach((src, j) => { popPhotos[j].src = src; popPhotos[j].alt = `${sel.name} red lipstick on ${skin[j]} skin`; });
  }

  function selectIcon(key, viaClick) {
    state.icon = key; renderMap();
    if (viaClick) focusEl($('pop-close'));
  }
  function closePop() {
    const key = state.icon; if (!key) return;
    state.icon = null; renderMap();
    focusEl($(dotId(key)));
  }
  function wireDot(dot, key) {
    dot.addEventListener('click', () => { selectIcon(key, true); track('guide_map_select', { shade: key === '__mine' ? 'mine' : key }); });
    dot.addEventListener('mouseenter', () => { if (state.icon !== key && finePointer()) selectIcon(key); });
  }
  ICONS.forEach(r => wireDot($(dotId(r.key)), r.key));
  // The markup carries Ruby Woo's card filled in; the map starts with nothing open
  renderMap();
  pop.classList.remove('pre');
  $('pop-close').addEventListener('click', closePop);
  $('red-map-bg').addEventListener('click', closePop);

  // The searched-for lipstick joins the map as one more dot
  function addMine(p, rc) {
    const lab = [p.lab_l, p.lab_a, p.lab_b];
    const best = ICONS.map(i => ({ name: i.name, d: de2000(lab, hex2lab(i.hex)) })).sort((x, y) => x.d - y.d)[0];
    const old = $(dotId('__mine')); if (old) old.remove();
    state.mine = {
      key: '__mine', isMine: true, name: cap(p.brand), brand: cap(p.brand), shade: cap(p.shade),
      tier: p.price_tier || '', hex: p.hex, h: rc.h, L: p.lab_l, photos: [],
      closest: best.name, closestDe: best.d.toFixed(1),
    };
    const d = describe(state.mine), dot = $(dotId(ICONS[0].key)).cloneNode(false);
    dot.id = dotId('__mine'); dot.title = state.mine.name; dot.setAttribute('aria-label', 'Your red: ' + state.mine.name + ' ' + state.mine.shade);
    dot.style.left = d.x; dot.style.top = d.y; dot.style.background = p.hex;
    pop.before(dot);
    wireDot(dot, '__mine');
    selectIcon('__mine');
    // The search sits under the map, so bring the new dot into view
    dot.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // Hue/chroma map for "what makes a red red", at L* 40; everything outside the
  // red wedge is washed toward the page background
  function drawMap() {
    const cv = $('red-map'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height, img = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const a = -10 + px / W * 105, b = 75 - py / H * 110;
      const C = Math.hypot(a, b), h = Math.atan2(b, a) * 180 / Math.PI;
      const [r, g, bl] = lchRgb(40, C, h), i = (py * W + px) * 4;
      const inRed = h >= 18 && h <= 42 && C >= minC(h);
      const base = inRed ? 0 : 0.5, edge = Math.min(1, Math.max(0, (C - 72) / 22)), k = base + (1 - base) * edge * edge * (3 - 2 * edge);
      img.data[i] = r + (250 - r) * k; img.data[i + 1] = g + (246 - g) * k; img.data[i + 2] = bl + (241 - bl) * k; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  // ── Search: add your red to the map ─────────────────────────────────────────
  const qInput = $('red-q'), resultsEl = $('red-results');
  const SHOWN = 6;
  let searchTimer, searchSeq = 0;

  // Names are stored with accents some of the time ("rosé", but "lancome"), so
  // both sides are compared accent-free: here in JS, and in the query by letting
  // each plain letter match its accented forms.
  const plain = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const ACCENTS = { a: '[aàáâãä]', c: '[cç]', e: '[eèéêë]', i: '[iìíîï]', n: '[nñ]', o: '[oòóôõö]', u: '[uùúûü]' };
  const tokens = q => plain(q).split(/\s+/).map(t => t.replace(/[^a-z0-9'&-]/g, '')).filter(Boolean);

  // How well a row answers the query, so "ruby woo" puts Ruby Woo above
  // Rosewood Ruby while still listing both:
  //   3  the shade name has the words typed, in order ("ruby woo")
  //   2  every word typed is a whole word somewhere in brand, product or shade
  //   1  every word typed starts a word
  //   0  matched only inside longer words ("woo" in "rosewood")
  function rank(r, toks) {
    const words = t => plain(t).split(/[^a-z0-9'&]+/).filter(Boolean);
    const shade = words(r.shade), all = words(r.brand).concat(words(r.product), shade);
    if (shade.some((_, i) => toks.every((t, j) => shade[i + j] === t))) return 3;
    if (toks.every(t => all.includes(t))) return 2;
    if (toks.every(t => all.some(w => w.startsWith(t)))) return 1;
    return 0;
  }

  // Two queries per search: one boxed to roughly-red Lab values so reds aren't
  // crowded out of a big brand's rows, one unboxed so near-misses still show up
  // (greyed out, with the reason). redCheck() makes the real call on each row.
  async function fetchRows(toks, redBox) {
    const pattern = t => t.replace(/[aceinou]/g, c => ACCENTS[c]);
    const params = new URLSearchParams({
      select: 'id,brand,product,shade,lab_l,lab_a,lab_b,hex,price_tier',
      and: '(' + toks.map(pattern).map(t => `or(brand.imatch."${t}",product.imatch."${t}",shade.imatch."${t}")`).join(',') + ')',
      order: 'brand,shade,id',
      limit: redBox ? 300 : 60,
    });
    if (redBox) { params.append('lab_l', 'gte.20'); params.append('lab_l', 'lte.55'); params.append('lab_a', 'gte.33'); params.append('lab_b', 'gte.13'); }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/lipstic-data-update-oct26?${params}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  function showResults(rows, down, toks) {
    resultsEl.querySelectorAll('li:not([data-if])').forEach(li => li.remove());
    const seen = new Set();
    const items = rows.filter(r => r.hex && !seen.has(r.id) && seen.add(r.id))
      .map(r => ({ r, rc: redCheck(r.lab_l, r.lab_a, r.lab_b), score: rank(r, toks) }))
      .sort((x, y) => y.score - x.score || y.rc.ok - x.rc.ok)
      .slice(0, SHOWN);
    const first = resultsEl.firstElementChild;
    items.forEach(({ r, rc }) => {
      const li = document.createElement('li'), btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'res'; btn.disabled = !rc.ok;
      const span = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; return s; };
      const dot = span('res-dot', ''); dot.style.background = r.hex;
      const text = span('res-text', '');
      text.append(span('res-name', `${cap(r.brand)} · ${cap(r.shade)}`), span('res-product', cap(r.product)));
      btn.append(dot, text, span('res-tag', rc.ok ? KINDS[depthOf(r.lab_l) + '-' + toneOf(rc.h)] : 'Not a red: ' + rc.why));
      btn.addEventListener('click', () => {
        track('guide_search_add', { brand: r.brand, shade: r.shade, hex: r.hex });
        addMine(r, rc); qInput.value = ''; onQuery();
      });
      li.append(btn);
      resultsEl.insertBefore(li, first);
    });
    if (down) track('guide_search_error');
    else if (!items.length) track('guide_search_no_results', { query: toks.join(' ') });
    setIf('searchDown', down);
    setIf('noResults', !down && !items.length);
    setIf('showResults', true);
    setText('searchStatus', down ? "Search isn't available right now." : items.length ? items.length + (items.length === 1 ? ' match' : ' matches') : 'No reds match that yet.');
  }

  function onQuery() {
    const q = qInput.value.trim(), toks = tokens(q), seq = ++searchSeq;
    clearTimeout(searchTimer);
    setIf('hasQ', qInput.value.length > 0);
    if (q.length < 2 || !toks.length) { setIf('showResults', false); setText('searchStatus', ''); return; }
    searchTimer = setTimeout(async () => {
      let rows = [], down = false;
      try { rows = (await Promise.all([fetchRows(toks, true), fetchRows(toks, false)])).flat(); }
      catch (err) { down = true; }
      if (seq === searchSeq) showResults(rows, down, toks); // drop answers to an older query
    }, 250);
  }
  qInput.addEventListener('input', onQuery);
  $('red-q-clear').addEventListener('click', () => { qInput.value = ''; onQuery(); focusEl(qInput); });

  // ── Link clicks: into the finder, or out to a brand's site ─────────────────
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '/' || href.startsWith('/?')) track('guide_to_finder', { link: href });
    else if (/^https?:/.test(href) && a.host !== location.host) track('guide_outbound_click', { link: a.host + a.pathname });
  });

  // ── Escape closes whichever card or popover has focus ───────────────────────
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const a = document.activeElement, id = (a && a.id) || '';
    const tile = a && a.closest('[data-kind]'), kind = tile && tile.dataset.kind;
    if (kind && state.flipped === kind) flipKind(kind);
    else if (state.redCard && a && a.closest('#red-card-back')) backRed();
    else if (state.icon && a && (a.closest('[role="dialog"]') || /^dot-/.test(id))) closePop();
  });

  drawMap();
  // Popover photos swap on hover, so fetch them once the page is idle
  const warm = () => { ICONS.forEach(r => r.photos.forEach(src => { const im = new Image(); im.decoding = 'async'; im.src = src; })); };
  if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 2500 }); else setTimeout(warm, 1200);
})();
