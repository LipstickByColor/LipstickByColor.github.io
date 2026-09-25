const _SUPABASE_URL = 'https://xhmxvocjqcccrriovyfj.supabase.co';
const _SUPABASE_KEY = 'sb_publishable_2RQlqm5VuZaTBZ7qrd5V1A_eSjFIpaB';

// Shown in place of the app when the catalogue can't be loaded, so visitors
// don't get a working-looking UI where every search says "no matches".
function _showLoadError(err) {
  console.error('Failed to load product data:', err);
  window.gtag?.('event', 'data_load_error', { message: String(err?.message || err).slice(0, 100) });
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; padding:24px; text-align:center;">
      <p style="font-family:'Cormorant Garamond', serif; font-style:italic; font-size:28px; color:var(--espresso);">
        We couldn't load the lipstick catalogue.
      </p>
      <p style="font-size:14px; color:var(--text-muted); max-width:380px; line-height:1.6;">
        This is usually a brief connection hiccup. Please try again in a moment.
      </p>
      <button onclick="location.reload()" style="
        padding:10px 22px; border-radius:24px; border:1.5px solid var(--border); background:#fff;
        color:var(--espresso); cursor:pointer; font-family:'DM Sans', sans-serif; font-size:12px;
        font-weight:500; letter-spacing:0.06em; text-transform:uppercase;">
        Refresh
      </button>
    </div>`;
}

(async function () {
  try {
    const client = supabase.createClient(_SUPABASE_URL, _SUPABASE_KEY);
    const COLS = 'brand, product, shade, finish, type, lab_l, lab_a, lab_b, hex, image_url, price_tier, discontinued';
    const PAGE = 1000;

    const { count, error: countError } = await client
      .from('lipstick-data-update')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;
    if (!count) throw new Error('Product count is empty');

    const numPages = Math.ceil(count / PAGE);
    const results = await Promise.all(
      Array.from({ length: numPages }, (_, i) =>
        client.from('lipstick-data-update')
          .select(COLS)
          .range(i * PAGE, (i + 1) * PAGE - 1)
      )
    );

    const failed = results.find(r => r.error);
    if (failed) throw failed.error;

    const all = results.flatMap(r => r.data || []);
    if (!all.length) throw new Error('No products returned');

    REAL_PRODUCTS = all.map(r => ({
      brand: r.brand, product: r.product, shade: r.shade, finish: r.finish, format: r.type,
      lab: [r.lab_l, r.lab_a, r.lab_b], hex: r.hex, price_tier: r.price_tier,
      discontinued: r.discontinued === '1' || r.discontinued === 1,
    }));

    window.LIPSTICK_IMAGES = {};
    all.forEach(r => {
      window.LIPSTICK_IMAGES[`${(r.brand||'').toLowerCase()}|${(r.product||'').toLowerCase()}|${(r.shade||'').toLowerCase()}`] = r.image_url;
    });
  } catch (err) {
    _showLoadError(err);
    return;
  }

  const s = document.createElement('script');
  s.src = 'app.js';
  document.body.appendChild(s);
})();
