const _SUPABASE_URL = 'https://xhmxvocjqcccrriovyfj.supabase.co';
const _SUPABASE_KEY = 'sb_publishable_2RQlqm5VuZaTBZ7qrd5V1A_eSjFIpaB';

(async function () {
  const client = supabase.createClient(_SUPABASE_URL, _SUPABASE_KEY);
  const COLS = 'brand, product, shade, finish, type, lab_l, lab_a, lab_b, hex, image_url, price_tier, discontinued';
  const PAGE = 1000;

  const { count } = await client
    .from('lipstick-data-update')
    .select('*', { count: 'exact', head: true });

  const numPages = Math.ceil(count / PAGE);
  const results = await Promise.all(
    Array.from({ length: numPages }, (_, i) =>
      client.from('lipstick-data-update')
        .select(COLS)
        .range(i * PAGE, (i + 1) * PAGE - 1)
    )
  );

  const all = results.flatMap(r => r.data || []);

  REAL_PRODUCTS = all.map(r => ({
    brand: r.brand, product: r.product, shade: r.shade, finish: r.finish, format: r.type,
    lab: [r.lab_l, r.lab_a, r.lab_b], hex: r.hex, price_tier: r.price_tier,
    discontinued: r.discontinued === '1' || r.discontinued === 1,
  }));

  window.LIPSTICK_IMAGES = {};
  all.forEach(r => {
    window.LIPSTICK_IMAGES[`${(r.brand||'').toLowerCase()}|${(r.product||'').toLowerCase()}|${(r.shade||'').toLowerCase()}`] = r.image_url;
  });

  const s = document.createElement('script');
  s.src = 'app.js';
  document.body.appendChild(s);
})();
