# Lipstick Color Finder

A tool for discovering, searching, and comparing lipstick shades across 24,000+ products and 520+ brands by color, finish, and vibe.

**[lipstickcolorfinder.com](https://lipstickcolorfinder.com)**

---

## How it works

The color wheel is built from the actual product data: 48 cluster centers were derived using a Gaussian Mixture Model trained on the catalog's lipstick shades in CIELAB color space. When you pick a color, the app computes [ΔE (perceptual color distance)](https://lipstickcolorfinder.com/color-science/) between your selection and every product in the database to surface the closest matches.

All product data is stored in [Supabase](https://supabase.com) and fetched on load. Color matching runs entirely in the browser using the CIELAB → sRGB math.

The ML pipeline behind the color clustering and product data is described in the [About](https://lipstickcolorfinder.com/about/) section and documented in detail on [GitHub](https://github.com/ConstanzaSchibber/lipstick_color_extraction).

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

**Making lipstick search more forgiving.** Google Analytics showed that the dupe finder returned no results for 95 of about 262 searches over five days in mid-October. Most of these weren't because we lacked the brand: 62 searches were for brands already in the catalogue, while only 18 were for brands we don't carry.

The problem was how people searched. They used familiar names, added spaces, made small typos, or entered the shade before the brand. For example, "ysl" didn't match Yves Saint Laurent, "kat von d" missed KVD Beauty, and "smash box" didn't match Smashbox. Even small typos like "rimmell" and "colourpip" returned nothing. A search like "black cherry revlon" also failed because the brand appeared after the shade.

In 34 failed searches, people left without selecting a brand or shade. That suggested the search was getting in the way of finding a lipstick, even when the right products were available.

I updated the search to recognize brand aliases, ignore spacing differences, tolerate small typos, and find brands anywhere in the query. All of these examples now return the correct lipstick results. You can also include a shade name in the brand search bar because some users remember the shade name rather than the brand. The red lipstick guide uses the same search logic.

**Filters could lead to an empty list.** On the color wheel, filters stay on when you pick a new color, so you can compare one brand or finish across colors. But if you filtered to MAC and then moved to a color MAC doesn't make, you saw an empty list. Google Analytics showed that 3 people filtering by MAC hit 24 empty lists between them, and one person filtering by L'Oréal hit 5. Now the empty list says which filter caused it, for example "No MAC Cosmetics matches for this color.", and offers a button that turns off just that filter. Your other filters stay on.

**Filters now narrow each other.** Each filter used to list every option for the color, even ones that didn't fit your other choices. If you picked a brand, the finish filter still offered finishes that brand doesn't make, and picking one gave no results. Now each filter only shows options that still have matches. Pick "$" on Classic Red and the brand list drops from 159 brands to the 39 that have an affordable red. Every option you can pick leads to real lipsticks.

---

## Credits

Web application designed and built with the help of [Claude](https://claude.ai) (design and [Claude Code](https://claude.ai/claude-code)).
