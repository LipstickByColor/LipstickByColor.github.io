# Lipstick Color Finder

A tool for discovering, searching, and comparing lipstick shades across 350+ brands by color, finish, and vibe.

**[lipstickbycolor.github.io](https://lipstickbycolor.github.io)**

---

## How it works

The color wheel is built from the actual product data: 48 cluster centers were derived using a Gaussian Mixture Model trained on 9,000+ real lipstick shades in CIELAB color space. When you pick a color, the app computes [ΔE (perceptual color distance)](https://lipstickbycolor.github.io/color-guide.html) between your selection and every product in the database to surface the closest matches.

All product data is stored in [Supabase](https://supabase.com) and fetched on load. Color matching runs entirely in the browser using the CIELAB → sRGB math.

The ML pipeline behind the color clustering and product data is described in the [About](https://lipstickbycolor.github.io/about.html) section and documented in detail on [GitHub (TBD)]().

---

## Stack

- React via CDN (pre-compiled JSX, no bundler or build pipeline)
- Supabase (product database)
- CIELAB color space + ΔE76 for perceptual color matching
- GitHub Pages

---

## Credits

Web application designed and built with the help of [Claude](https://claude.ai) (design and [Claude Code](https://claude.ai/claude-code)).
