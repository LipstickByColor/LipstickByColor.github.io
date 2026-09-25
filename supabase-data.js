const _SUPABASE_URL = 'https://xhmxvocjqcccrriovyfj.supabase.co';
const _SUPABASE_KEY = 'sb_publishable_2RQlqm5VuZaTBZ7qrd5V1A_eSjFIpaB';

// The app mounts right away (app.js loads in parallel) and listens for the
// 'lipstick-data' event; LIPSTICK_DATA_STATUS is 'loading' | 'ready' | 'error'.
// On 'error' the app swaps itself for a refresh prompt, so visitors don't get a
// working-looking UI where every search says "no matches".
// Image URLs are ~40% of the payload and only needed for photos (thumbs show the
// shade color until then), so they follow in a second pass that fires
// 'lipstick-images' when LIPSTICK_IMAGES is filled.
REAL_PRODUCTS = [];
window.LIPSTICK_IMAGES = {};
window.LIPSTICK_DATA_STATUS = 'loading';

function _setDataStatus(status) {
  window.LIPSTICK_DATA_STATUS = status;
  window.dispatchEvent(new Event('lipstick-data'));
}

const _client = supabase.createClient(_SUPABASE_URL, _SUPABASE_KEY);

// Fetch every row's `cols`. ~17.5k rows today: requesting a guessed number of
// pages in parallel skips a separate count round trip, and if the catalogue
// outgrows it we keep going. Ordered by id so pages never overlap or skip rows.
async function _fetchAll(cols) {
  const PAGE = 1000;
  const EXPECTED_PAGES = 18;
  const fetchPage = i => _client.from('lipstick-data-update')
    .select(cols)
    .order('id')
    .range(i * PAGE, (i + 1) * PAGE - 1);

  const results = await Promise.all(Array.from({ length: EXPECTED_PAGES }, (_, i) => fetchPage(i)));
  while (!results.some(r => r.error) && results[results.length - 1].data?.length === PAGE) {
    results.push(await fetchPage(results.length));
  }

  const failed = results.find(r => r.error);
  if (failed) throw failed.error;
  return results.flatMap(r => r.data || []);
}

(async function () {
  let all;
  try {
    all = await _fetchAll('id, brand, product, shade, finish, type, lab_l, lab_a, lab_b, hex, price_tier, discontinued');
    if (!all.length) throw new Error('No products returned');

    REAL_PRODUCTS = all.map(r => ({
      brand: r.brand, product: r.product, shade: r.shade, finish: r.finish, format: r.type,
      lab: [r.lab_l, r.lab_a, r.lab_b], hex: r.hex, price_tier: r.price_tier,
      discontinued: r.discontinued === '1' || r.discontinued === 1,
    }));
  } catch (err) {
    console.error('Failed to load product data:', err);
    window.gtag?.('event', 'data_load_error', { message: String(err?.message || err).slice(0, 100) });
    _setDataStatus('error');
    return;
  }

  _setDataStatus('ready');

  try {
    const urls = new Map((await _fetchAll('id, image_url')).map(r => [r.id, r.image_url]));
    all.forEach(r => {
      window.LIPSTICK_IMAGES[`${(r.brand||'').toLowerCase()}|${(r.product||'').toLowerCase()}|${(r.shade||'').toLowerCase()}`] = urls.get(r.id);
    });
    window.LIPSTICK_IMAGES_READY = true;
    window.dispatchEvent(new Event('lipstick-images'));
  } catch (err) {
    // Not fatal: thumbs keep showing the shade color instead of a photo
    console.error('Failed to load product images:', err);
    window.gtag?.('event', 'image_load_error', { message: String(err?.message || err).slice(0, 100) });
  }
})();
