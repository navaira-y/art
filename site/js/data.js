/* Dana Habayeb — catalogue data.
   Titles, prices, availability, dimensions and product links mirror
   danahabayeb.art (Shopify products feed). Captions are trimmed from the
   artist's own product texts so the gallery reads like a catalogue.        */
"use strict";

const SITE = "https://danahabayeb.art";
const ART_DIR = "assets/art/";

/* id            -> assets/art/<id>.webp (1120px) and <id>-s.webp (380px)
   t             -> title
   cap           -> catalogue line
   dim           -> real dimensions, as published
   hcm           -> physical height in cm, used to scale the plates in the hall
   p             -> price in AED
   sold          -> 1 when the original is collected
   u             -> product path on danahabayeb.art                          */
const ART = [
  { id: "there-is-always-hope", t: "There is Always Hope",
    cap: "Banksy's girl with the balloon leads KAWS to a free Palestine behind the wall.",
    dim: "100 × 150 cm", hcm: 150, p: 7800, sold: 1, u: "/products/there-is-always-hope" },

  { id: "this-is-your-god", t: "This is Your God",
    cap: "Your God is whatever you spend the most time pursuing and consuming.",
    dim: "100 × 150 cm", hcm: 150, p: 7800, sold: 1, u: "/products/this-is-your-god" },

  { id: "do-you-have-no-shame", t: "Do You Have No Shame",
    cap: "Cultural expectation peers over us like a cloud. Who knew it could be so loud.",
    dim: "100 × 150 cm", hcm: 150, p: 7800, sold: 1,
    u: "/products/posters-prints-and-visual-artwork-example-product-5" },

  { id: "the-world-is-watching", t: "The World is Watching",
    cap: "Two canvases, framed separately, hung as one long look.",
    dim: "Two panels, each 80 × 105 cm", hcm: 105, p: 8000, sold: 1,
    u: "/products/posters-prints-and-visual-artwork-example-product-2" },

  { id: "the-source", t: "The Source",
    cap: "Everything opening outward from a single point of light. Gold frame, ready to hang.",
    dim: "100 × 150 cm", hcm: 150, p: 7900, sold: 1,
    u: "/products/posters-prints-and-visual-artwork-example-product-3" },

  { id: "from-the-land", t: "From the Land",
    cap: "A girl, a watermelon, and the pattern of a land she keeps wearing.",
    dim: "35.5 × 45.5 cm", hcm: 45.5, p: 1850, sold: 0, u: "/products/from-the-land" },

  { id: "pali-pika", t: "Pali Pika",
    cap: "A lifetime beneath the olive trees. The strongest roots survive every storm.",
    dim: "35.5 × 45.5 cm", hcm: 45.5, p: 1850, sold: 0, u: "/products/pali-pika" },

  { id: "van-gogh-pikachu", t: "Van Gogh Pikachu",
    cap: "A self portrait of Pikachu x Van Gogh.",
    dim: "80 × 100 cm", hcm: 100, p: 3900, sold: 1, u: "/products/van-gogh-pikachu" },

  { id: "monkey-d-luffy", t: "Monkey D. Luffy",
    cap: "Gear five awake inside a starry night. Painted for a collector.",
    dim: "80 × 100 cm", hcm: 100, p: 3900, sold: 1, u: "/products/luffy-x-starry-nights" },

  { id: "sheikh-pika", t: "Sheikh Pika",
    cap: "Pika visits Dubai, keffiyeh on, one metre of straight faced ceremony.",
    dim: "80 × 100 cm", hcm: 100, p: 3900, sold: 1, u: "/products/pika-visits-dubai" },

  { id: "dxb-pika", t: "DXB Pika",
    cap: "Pikachu in kandura, under a swirling Emirati night.",
    dim: "35.5 × 45.5 cm", hcm: 45.5, p: 1850, sold: 0, u: "/products/dxb-pika" },

  { id: "mini-sheikh-pika", t: "Mini Sheikh Pika",
    cap: "The same sheikh at a smaller scale, on deep edge canvas.",
    dim: "35.5 × 45.5 cm", hcm: 45.5, p: 1850, sold: 1, u: "/products/mini-sheikh-pika" },

  { id: "desert-companion", t: "Desert Companion",
    cap: "The Bedouin lives inside the horse's eye. Trust built across the desert.",
    dim: "35.5 × 45.5 cm", hcm: 45.5, p: 1850, sold: 0, u: "/products/desert-companion" },

  { id: "dune-buggy-bashing", t: "Dune Buggy Bashing",
    cap: "A nostalgic afternoon of dune bashing in the desert.",
    dim: "46 × 46 cm", hcm: 46, p: 1850, sold: 0, u: "/products/dune-buggy-bashing" },

  { id: "desert-dune-bashing", t: "Desert Dune Bashing",
    cap: "The dunes at the moment the tyres let go.",
    dim: "46 × 46 cm", hcm: 46, p: 1850, sold: 1, u: "/products/desert-dune-bashing" },
];

const BY_ID = Object.fromEntries(ART.map(a => [a.id, a]));

/* the five works that travel through the second act, in order */
const CHAPTERS = [
  "pali-pika",
  "there-is-always-hope",
  "the-source",
  "van-gogh-pikachu",
  "this-is-your-god",
];

/* hero scatter: [left %, top %, width px, depth] — traced from the reference */
/* [id, left %, top %, width in vw (clamped in css), parallax depth] */
const SCATTER = [
  ["there-is-always-hope",  3.0, 12,  8.6, 26],
  ["this-is-your-god",     24.0,  8,  9.0, 14],
  ["do-you-have-no-shame", 46.0,  6,  9.8, 20],
  ["the-world-is-watching",68.0, 11,  9.0, 32],
  ["pali-pika",            93.0, 22, 10.4, 18],
  ["the-source",            7.0, 40,  7.6, 30],
  ["from-the-land",        14.0, 74,  8.6, 12],
  ["van-gogh-pikachu",     89.0, 44,  9.2, 24],
  ["dxb-pika",             97.5, 66,  7.0, 34],
  ["monkey-d-luffy",       79.0, 30,  6.6, 16],
  ["sheikh-pika",           4.5, 90,  9.4, 28],
  ["mini-sheikh-pika",     28.0, 96,  7.2, 12],
  ["desert-companion",     47.0, 85,  8.4, 22],
  ["dune-buggy-bashing",   64.0, 96,  9.0, 30],
  ["desert-dune-bashing",  85.0, 87, 10.2, 16],
];

/* paint transition: shape, colour, seat on the frame, size, rotation, impact origin */
/* narrow screens: keep the middle band clear for the headline */
const SCATTER_M = {
  "there-is-always-hope": [ 9,  7, 20],
  "this-is-your-god":     [35,  4, 17],
  "do-you-have-no-shame": [62,  9, 20],
  "the-world-is-watching":[89, 15, 19],
  "pali-pika":            [ 7, 25, 16],
  "the-source":           [92, 34, 17],
  "from-the-land":        [ 6, 71, 18],
  "van-gogh-pikachu":     [27, 75, 16],
  "dxb-pika":             [93, 62, 14],
  "monkey-d-luffy":       [50, 96, 16],
  "sheikh-pika":          [11, 90, 19],
  "mini-sheikh-pika":     [72, 76, 15],
  "desert-companion":     [92, 90, 18],
  "dune-buggy-bashing":   [33, 96, 17],
  "desert-dune-bashing":  [66, 24, 15],
};

const SPLASHES = [
  { s: "b", c: "wine",  x: -6,  y: 22, w: 46, r: -14, ox: 88, oy: 46, o: 0.00 },
  { s: "a", c: "ochre", x: 74,  y: 6,  w: 40, r: 12,  ox: 40, oy: 60, o: 0.10 },
  { s: "c", c: "rust",  x: 26,  y: -8, w: 30, r: 4,   ox: 50, oy: 8,  o: 0.22 },
  { s: "b", c: "blue",  x: 62,  y: 58, w: 50, r: 168, ox: 14, oy: 50, o: 0.34 },
  { s: "d", c: "ink",   x: -4,  y: 62, w: 38, r: -8,  ox: 20, oy: 30, o: 0.46 },
  { s: "a", c: "rust",  x: 40,  y: 74, w: 34, r: 148, ox: 52, oy: 40, o: 0.58 },
  { s: "d", c: "olive", x: 78,  y: 34, w: 32, r: 196, ox: 70, oy: 55, o: 0.70 },
  { s: "c", c: "wine",  x: 8,   y: 2,  w: 22, r: 186, ox: 50, oy: 88, o: 0.80 },
];
