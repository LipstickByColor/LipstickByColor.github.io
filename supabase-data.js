const _SUPABASE_URL = 'https://xhmxvocjqcccrriovyfj.supabase.co';
const _SUPABASE_KEY = 'sb_publishable_2RQlqm5VuZaTBZ7qrd5V1A_eSjFIpaB';

// The catalogue is one file in Supabase Storage, written by build-catalogue.js
// (`npm run build:catalogue`, which also rewrites this name). Each version has
// its own name and is cached by the browser for a year, so tab switches and
// return visits download nothing; reading the table directly cost ~1 MB of
// Supabase transfer per page view.
const CATALOGUE_FILE = 'catalogue-20261027-16794.json';
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

(async function () {
  try {
    const res = await fetch(_CATALOGUE_URL);
    if (!res.ok) throw new Error(`Catalogue request failed: ${res.status}`);
    const { brands, products, rows } = await res.json();
    if (!rows?.length) throw new Error('No products returned');

    REAL_PRODUCTS = rows.map(([id, b, p, shade, finish, type, l, a, bb, hex, price_tier, discontinued]) => ({
      id, brand: brands[b], product: products[p], shade, finish, format: type,
      lab: [l, a, bb], hex, price_tier,
      discontinued: discontinued === '1' || discontinued === 1,
    }));
  } catch (err) {
    console.error('Failed to load product data:', err);
    window.gtag?.('event', 'data_load_error', { message: String(err?.message || err).slice(0, 100) });
    _setDataStatus('error');
    return;
  }

  _setDataStatus('ready');
})();

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
    const { data, error } = await _client.from('lipstic-data-update-oct26').select('id, image_url').in('id', chunk);
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
