# Lipstick Color Finder

A tool for discovering, searching, and comparing lipstick shades across 17,000+ products and 350+ brands by color, finish, and vibe.

**[lipstickbycolor.github.io](https://lipstickbycolor.github.io)**

---

## How it works

The color wheel is built from the actual product data: 48 cluster centers were derived using a Gaussian Mixture Model trained on the catalog's lipstick shades in CIELAB color space. When you pick a color, the app computes [ΔE (perceptual color distance)](https://lipstickbycolor.github.io/color-guide.html) between your selection and every product in the database to surface the closest matches.

All product data is stored in [Supabase](https://supabase.com) and fetched on load. Color matching runs entirely in the browser using the CIELAB → sRGB math.

The ML pipeline behind the color clustering and product data is described in the [About](https://lipstickbycolor.github.io/about.html) section and documented in detail on [GitHub](https://github.com/ConstanzaSchibber/lipstick_color_extraction).

---

## Stack

- React via CDN (pre-compiled JSX, no bundler or build pipeline)
- Supabase (product database)
- CIELAB color space + CIEDE2000 for perceptual color matching
- GitHub Pages

---

## UX Improvements

**In-store photos gave the wrong colors.** Taking a photo in the store is a common way to match a lipstick, but the colors picked from iPhone photos came out darker or duller than the real thing. iPhones capture a wider range of color than the site was reading, so some color was lost. The site now keeps the full color from the photo and translates it the same way the product colors are stored, so they're compared fairly. It also ignores shine and shadows in the spot you tap, so the pick reflects the lipstick's true color.

**The site was slow to open.** Visitors had to wait for every product to download before they could do anything. Now the site opens right away and the products load while you browse. Product photos come last, and each result shows its shade color until its photo arrives. If the products can't load, the site says so and asks you to refresh, instead of looking normal but finding no matches.

**Lighter and deeper options could lead nowhere.** Each shade offers lighter and deeper versions to explore, but for some very light or very deep colors, no lipstick came close. Picking one of those showed poor matches. These options are now grayed out, so every option you can pick leads to real matches.

---

## Credits

Web application designed and built with the help of [Claude](https://claude.ai) (design and [Claude Code](https://claude.ai/claude-code)).
