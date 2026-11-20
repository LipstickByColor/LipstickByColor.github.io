const _SUPABASE_URL = 'https://xhmxvocjqcccrriovyfj.supabase.co';
const _SUPABASE_KEY = 'sb_publishable_2RQlqm5VuZaTBZ7qrd5V1A_eSjFIpaB';

// The catalogue is one file in Supabase Storage, written by build-catalogue.js
// (`npm run build:catalogue`, which also rewrites this name). Each version has
// its own name and is cached by the browser for a year, so tab switches and
// return visits download nothing; reading the table directly cost ~1 MB of
// Supabase transfer per page view.
const CATALOGUE_FILE = 'catalogue-20261111-24032.json';
const _CATALOGUE_URL = `${_SUPABASE_URL}/storage/v1/object/public/site-data/${CATALOGUE_FILE}`;

// The app mounts right away (app.js loads in parallel) and listens for the
// 'lipstick-data' event; LIPSTICK_DATA_STATUS is 'loading' | 'ready' | 'error'.
// On 'error' the app swaps itself for a refresh prompt, so visitors don't get a
// working-looking UI where every search says "no matches".
// Image URLs are fetched only for the products a thumb shows
// (requestLipstickImages), which fires 'lipstick-images' as LIPSTICK_IMAGES fills.
REAL_PRODUCTS = [];
window.LIPSTICK_IMAGES = {};
window.LIPSTICK_DATA_STATUS = 'loading';

function _setDataStatus(status) {
  window.LIPSTICK_DATA_STATUS = status;
  window.dispatchEvent(new Event('lipstick-data'));
}

const _imageKey = p => `${(p.brand||'').toLowerCase()}|${(p.product||'').toLowerCase()}|${(p.shade||'').toLowerCase()}`;

// A dropped connection (weak signal, switching apps on iOS, a tab left in the
// background) kills the download with a generic network error. Those are tried
// again a few times before the refresh prompt; a missing file (4xx) is not.
// Analytics: data_load_retry for each failed try, data_load_recovered when a
// retry worked, data_load_error when the visitor gets the refresh prompt.
const _CATALOGUE_TRIES = 3;
const _CATALOGUE_WAITS = [1000, 3000];   // before the 2nd and 3rd try
const _CATALOGUE_TIMEOUT = 30000;        // a stalled download fails instead of loading forever

let _catalogueLoading = false, _catalogueRound = 0;

async function _fetchCatalogue() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), _CATALOGUE_TIMEOUT);
  try {
    const res = await fetch(_CATALOGUE_URL, { signal: ctrl.signal });
    if (!res.ok) {
      const err = new Error(`Catalogue request failed: ${res.status}`);
      err.retry = res.status >= 500;
      throw err;
    }
    const { brands, products, rows } = await res.json();
    if (!rows?.length) throw Object.assign(new Error('No products returned'), { retry: false });
    return rows.map(([id, b, p, shade, finish, type, l, a, bb, hex, price_tier, discontinued, long_lasting]) => ({
      id, brand: brands[b], product: products[p], shade, finish, format: type,
      lab: [l, a, bb], hex, price_tier,
      discontinued: discontinued === '1' || discontinued === 1,
      long_lasting: long_lasting === 1,
    }));
  } catch (err) {
    if (err.name === 'AbortError') throw Object.assign(new Error('Timed out'), { retry: true });
    if (err.retry === undefined) err.retry = true;   // network errors: "Load failed", "Failed to fetch"
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Resolves after ms, or as soon as the tab is visible and online again
// when it is in the background or offline (the retry would fail there too)
function _waitToRetry(ms) {
  return new Promise(resolve => {
    const ready = () => document.visibilityState === 'visible' && navigator.onLine !== false;
    const check = () => { if (ready()) done(); };
    const done = () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
      resolve();
    };
    setTimeout(() => (ready() ? done() : null), ms);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);
  });
}

async function _loadCatalogue() {
  if (_catalogueLoading) return;
  _catalogueLoading = true;
  const round = ++_catalogueRound, start = Date.now();
  for (let attempt = 1; ; attempt++) {
    const tryStart = Date.now();
    try {
      REAL_PRODUCTS = await _fetchCatalogue();
      if (attempt > 1 || round > 1) window.gtag?.('event', 'data_load_recovered', { attempt, round, elapsed_ms: Date.now() - start });
      _catalogueLoading = false;
      _setDataStatus('ready');
      return;
    } catch (err) {
      const info = {
        message: String(err?.message || err).slice(0, 100), attempt, round,
        elapsed_ms: Date.now() - tryStart, visible: document.visibilityState, online: navigator.onLine,
      };
      console.error(`Failed to load product data (try ${attempt}):`, err);
      if (!err.retry || attempt >= _CATALOGUE_TRIES) {
        window.gtag?.('event', 'data_load_error', info);
        _catalogueLoading = false;
        _setDataStatus('error');
        return;
      }
      window.gtag?.('event', 'data_load_retry', info);
      await _waitToRetry(_CATALOGUE_WAITS[attempt - 1]);
    }
  }
}

_loadCatalogue();
// After the refresh prompt, one more round when the connection comes back or the
// tab returns; the app replaces the prompt when the catalogue arrives
['online', 'visibilitychange'].forEach(ev => (ev === 'online' ? window : document).addEventListener(ev, () => {
  if (window.LIPSTICK_DATA_STATUS === 'error' && _catalogueRound < 2 && document.visibilityState === 'visible') _loadCatalogue();
}));

// Image URLs, fetched for the products on screen. Requests made within a short
// window go out together, 100 ids per call. Products saved before ids existed
// (favourites in localStorage) are matched to an id by brand, product and shade.
// Returns a promise that settles once those products' URLs are in LIPSTICK_IMAGES.
const _client = supabase.createClient(_SUPABASE_URL, _SUPABASE_KEY);
const _imageRequests = new Map(); // id -> promise
let _idByKey = null, _pendingIds = [], _batch = null;

function _flushImages() {
  const ids = _pendingIds, done = _batch;
  _pendingIds = []; _batch = null;
  const chunks = [];
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
  Promise.all(chunks.map(async chunk => {
    const { data, error } = await _client.from('lipstick-data-nov26-v2').select('id, image_url').in('id', chunk);
    if (error) throw error;
    const byId = new Map(REAL_PRODUCTS.map(p => [p.id, p]));
    data.forEach(r => { const p = byId.get(r.id); if (p && r.image_url) window.LIPSTICK_IMAGES[_imageKey(p)] = r.image_url; });
  })).catch(err => {
    // Not fatal: thumbs keep showing the shade color instead of a photo
    console.error('Failed to load product images:', err);
    window.gtag?.('event', 'image_load_error', { message: String(err?.message || err).slice(0, 100) });
    ids.forEach(id => _imageRequests.delete(id)); // a later thumb can try again
  }).finally(() => {
    window.dispatchEvent(new Event('lipstick-images'));
    done.resolve();
  });
}

window.requestLipstickImages = function (list) {
  if (window.LIPSTICK_DATA_STATUS !== 'ready') {
    return new Promise(resolve => {
      const onData = () => {
        if (window.LIPSTICK_DATA_STATUS === 'loading') return;
        window.removeEventListener('lipstick-data', onData);
        resolve(window.LIPSTICK_DATA_STATUS === 'ready' ? window.requestLipstickImages(list) : undefined);
      };
      window.addEventListener('lipstick-data', onData);
    });
  }
  if (!_idByKey) _idByKey = new Map(REAL_PRODUCTS.map(p => [_imageKey(p), p.id]));
  const waits = [];
  for (const p of list) {
    if (!p) continue;
    const id = p.id ?? _idByKey.get(_imageKey(p));
    if (id == null) continue;
    if (!_imageRequests.has(id)) {
      if (!_batch) {
        let resolve;
        _batch = { promise: new Promise(r => { resolve = r; }) };
        _batch.resolve = resolve;
        setTimeout(_flushImages, 30);
      }
      _pendingIds.push(id);
      _imageRequests.set(id, _batch.promise);
    }
    waits.push(_imageRequests.get(id));
  }
  return Promise.all(waits);
};
