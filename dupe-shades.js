// The popular shades that get their own dupe page at /dupe-finder/<brand>/<shade>/.
// build-dupe-pages.js writes the pages; build-pages.js links them from the dupe finder's write-up.
// brand and shade exactly as the catalogue has them (lowercase); name is how to print it and
// short is the shade alone, for headings. product picks one line when a shade is sold in
// several; brandSlug shortens the address. chartHex overrides the catalogue's color: the page
// ranks matches from it the way the color chart does, and its "filter all" links open the chart.
// swatch is a photo of the shade swatched, shown beside the product in the page's hero.
// skip lists matches never to offer for that page, as 'brand|shade' the way the catalogue has them.
// Which matches a page lists is picked with npm run dupes:pick (kept in dupe-picks.json). Keep the list short and hand-picked: each page
// should be a shade people really search for.
const SHADES = [
  { brand:'mac cosmetics', shade:'ruby woo', product:'retro matte lipstick', name:'MAC Ruby Woo', short:'Ruby Woo', brandSlug:'mac',
    skip:['l oreal|le rouge avant-garde'] }, // the same lipstick as 203 Le Rouge Avant-Garde
  // chartHex: the catalogue's color for Pillow Talk is off until the next dataset, so its page
  // ranks from this color instead and links to the color chart. Remove it once the data is fixed.
  { brand:'charlotte tilbury', shade:'pillow talk', product:'matte revolution lipstick', name:'Charlotte Tilbury Pillow Talk', short:'Pillow Talk', chartHex:'#dc7b77',
    swatch:'/dupe-finder/assets/charlotte-tilbury-pillow-talk-swatch.webp', skip:['palladio|nude lwl50'] },
  { brand:'pat mcgrath labs', shade:'elson 4', name:'Pat McGrath Labs Elson 4', short:'Elson 4', brandSlug:'pat-mcgrath' },
  { brand:'chanel', shade:'99 pirate', name:'Chanel 99 Pirate', short:'99 Pirate' },
  { brand:'chanel', shade:'49 ever red', name:'Chanel 49 Ever Red', short:'49 Ever Red',
    skip:['armani beauty|01 summer adventure'] }, // no photo: the retailer blocks the download
  { brand:'dior', shade:'100 forever nude look', name:'Dior 100 Forever Nude Look', short:'100 Forever Nude Look' },
  { brand:'dior', shade:'422 rose des vents', name:'Dior 422 Rose des Vents', short:'422 Rose des Vents' },
  { brand:'dior', shade:'670 rose blues', name:'Dior 670 Rose Blues', short:'670 Rose Blues' },
];

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pageUrl = s => `/dupe-finder/${s.brandSlug || slug(s.brand)}/${slug(s.shade)}/`;

module.exports = { SHADES, slug, pageUrl };
