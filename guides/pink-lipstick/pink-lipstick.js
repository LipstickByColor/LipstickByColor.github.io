// Interactive parts of guides/pink-lipstick/index.html. The page's text, lists and images are
// all in the HTML; this only draws the color map, flips the kind cards and runs the quiz.
(function () {
  const ASSETS = '/guides/assets/';

  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const focusEl = el => { if (el) el.focus({ preventScroll: true }); };
  const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // Analytics: no-ops until the visitor has allowed it (see /consent.js)
  const track = (name, params) => window.gtag?.('event', name, { guide: 'pink-lipstick', ...params });

  // ── Color map: lipstick colors at medium lightness, the pink slice left clear ──
  const PINK_MIN_C = 25;
  function lchRgb(L, C, h) {
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    let y = (L + 16) / 116, x = a / 500 + y, z = y - b / 200;
    const f = t => t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
    x = 0.95047 * f(x); y = f(y); z = 1.08883 * f(z);
    const gm = c => { c = c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c; return Math.round(Math.max(0, Math.min(1, c)) * 255); };
    return [gm(x * 3.2406 - y * 1.5372 - z * 0.4986), gm(-x * 0.9689 + y * 1.8758 + z * 0.0415), gm(x * 0.0557 - y * 0.204 + z * 1.057)];
  }
  function drawMap() {
    const cv = $('pink-map'); if (!cv) return;
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, img = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const a = -10 + px / W * 95, b = 50 - py / H * 100;
      const C = Math.hypot(a, b), h = Math.atan2(b, a) * 180 / Math.PI;
      const [r, g, bl] = lchRgb(58, C, h), i = (py * W + px) * 4;
      // Outside the pink slice the colors are washed out, and every color fades out at the edge
      const inPink = h >= -30 && h <= 30 && C >= PINK_MIN_C;
      const base = inPink ? 0 : 0.5, edge = Math.min(1, Math.max(0, (C - 72) / 22)), k = base + (1 - base) * edge * edge * (3 - 2 * edge);
      img.data[i] = r + (250 - r) * k; img.data[i + 1] = g + (246 - g) * k; img.data[i + 2] = bl + (241 - bl) * k; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  const state = { flipped: null, hoverKind: null, answers: {}, lastQ: null };

  // ── Fourteen kinds: flip cards ──────────────────────────────────────────────
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
    tile.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      if (state.hoverKind === key && e.detail > 0) return;
      flipKind(key);
    });
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

  // ── Pink or nude quiz ───────────────────────────────────────────────────────
  // brand, shade, hex, what brands call look-alikes, swatch photo
  const QUIZ = [
    ['MAC', 'Mehr', '#a75a5c', 'nude', 'pink-quiz-mac-mehr.webp'],
    ['Revlon', '415 Pink in the Afternoon', '#cf6164', 'pink', 'pink-quiz-revlon-415-pink-in-the-afternoon.webp'],
    ['NARS', '821 Liason', '#c96a67', 'nude', 'pink-quiz-nars-821-liason.webp'],
    ['e.l.f.', 'Dirty Talk', '#df7774', 'pink', 'pink-quiz-elf-dirty-talk.webp'],
    ['Tom Ford', 'Runway Rose', '#b1515c', 'nude', 'pink-quiz-tf-runway-rose.webp'],
    ['MAC', 'Teddy 2.0', '#cc6f68', 'nude', 'pink-quiz-mac-teddy-2.webp'],
    ['Dior', '429 Rose Blues', '#bf7778', 'nude', 'pink-quiz-dior-429-rose-blues.webp'],
    ['NARS', '831 Devious', '#cd6772', 'pink', 'pink-quiz-nars-831-devious.webp'],
  ];
  const cards = $$('[data-quiz]');
  const scoreEl = $('quiz-score');

  function answerCard(i) {
    const [brand, shade, , truth, img] = QUIZ[i], a = state.answers[i], right = a === truth;
    const card = cards[i], [swatch, buttons] = card.children;
    card.style.border = right ? '1px solid #E0D0C4' : '2px solid #B0566F';
    swatch.insertAdjacentHTML('beforeend',
      `<span style="position:absolute;left:10px;bottom:10px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;background:#FAF6F1;color:#2A1A14;padding:5px 10px;border-radius:20px">Brands say ${esc(truth)}</span>` +
      `<span aria-label="${right ? 'Matched' : 'Did not match'}" style="position:absolute;right:10px;top:10px;width:28px;height:28px;border-radius:50%;background:${right ? '#2A1A14' : '#B0566F'};color:#fff;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center">${right ? '✓' : '✕'}</span>`);
    buttons.outerHTML =
      `<div tabindex="-1" style="padding:0 6px 6px;display:flex;flex-direction:column;gap:8px;outline:none">
        <div>
          <p style="margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8C6858;font-weight:500">${esc(brand)}</p>
          <p style="margin:2px 0 0;font-family:'Cormorant Garamond',serif;font-size:24px;line-height:1.05">${esc(shade)}</p>
        </div>
        <p style="margin:0;font-size:14px;line-height:1.5;color:#5C3D30;text-wrap:pretty"><strong style="color:${right ? '#2A1A14' : '#B0566F'};font-weight:600">${right ? 'You agree with the brands.' : 'You said ' + esc(a) + '. Brands say ' + esc(truth) + '.'}</strong></p>
        <img src="${ASSETS + img}" alt="${esc(brand + ' ' + shade)} swatch" style="width:100%;height:160px;object-fit:contain;background:#fff;border-radius:10px;display:block">
      </div>`;
    // The buttons are gone, so keep focus in the card
    focusEl(card.children[1]);
  }
  function renderScore() {
    const answered = Object.keys(state.answers).map(Number);
    const correct = answered.filter(i => state.answers[i] === QUIZ[i][3]).length;
    const misses = answered.filter(i => state.answers[i] !== QUIZ[i][3]).map(i => QUIZ[i][0] + ' ' + QUIZ[i][1]);
    const q = state.lastQ, lastMsg = q != null ? QUIZ[q][0] + ' ' + QUIZ[q][1] + ': ' + (state.answers[q] === QUIZ[q][3] ? 'you agree with the brands. ' : 'you said ' + state.answers[q] + ', brands say ' + QUIZ[q][3] + '. ') : '';
    scoreEl.textContent = lastMsg + (answered.length === QUIZ.length
      ? 'You matched the brands on ' + correct + ' of ' + QUIZ.length + '.' + (misses.length ? ' Missed: ' + misses.join(', ') + '.' : '') + ' Even brands can\'t always agree here.'
      : answered.length ? correct + ' of ' + answered.length + ' so far.' : '');
  }
  cards.forEach((card, i) => {
    card.querySelectorAll('[data-pick]').forEach(btn => btn.addEventListener('click', () => {
      if (state.answers[i]) return;
      state.answers[i] = btn.dataset.pick;
      state.lastQ = i;
      track('guide_quiz_answer', { shade: QUIZ[i][0] + ' ' + QUIZ[i][1], answer: btn.dataset.pick, correct: btn.dataset.pick === QUIZ[i][3] });
      answerCard(i);
      renderScore();
    }));
  });

  // ── Link clicks: into the finder, or out to a brand's site ─────────────────
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === '/' || href.startsWith('/?') || href === '/dupe-finder/') track('guide_to_finder', { link: href });
    else if (/^https?:/.test(href) && a.host !== location.host) track('guide_outbound_click', { link: a.host + a.pathname });
  });

  // ── Escape closes the kind card that has focus ─────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const a = document.activeElement;
    const tile = a && a.closest && a.closest('[data-kind]'), kind = tile && tile.dataset.kind;
    if (kind && state.flipped === kind) flipKind(kind);
  });

  drawMap();
})();
