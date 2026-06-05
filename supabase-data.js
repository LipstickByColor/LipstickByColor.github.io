const _SUPABASE_URL = 'https://xhmxvocjqcccrriovyfj.supabase.co';
const _SUPABASE_KEY = 'sb_publishable_2RQlqm5VuZaTBZ7qrd5V1A_eSjFIpaB';

(async function () {
  const client = supabase.createClient(_SUPABASE_URL, _SUPABASE_KEY);

  const PAGE = 1000;
  let all = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from('lipstick-data')
      .select('brand, product, shade, finish, lab_l, lab_a, lab_b, hex, image_url')
      .range(from, from + PAGE - 1);

    if (error) { console.error('Failed to load products:', error); break; }
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  REAL_PRODUCTS = all.map(r => ({
    brand: r.brand, product: r.product, shade: r.shade, finish: r.finish,
    lab: [r.lab_l, r.lab_a, r.lab_b], hex: r.hex,
  }));

  window.LIPSTICK_IMAGES = {};
  all.forEach(r => {
    window.LIPSTICK_IMAGES[`${r.brand}|${r.product}|${r.shade}`] = r.image_url;
  });

  const s = document.createElement('script');
  s.src = 'app.js';
  document.body.appendChild(s);
})();
