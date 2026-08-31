# Dana Habayeb — art that tells a story

Live site (GitHub Pages, deployed from branch `arena/01a0524a-art`, folder `/`):
**https://navaira-y.github.io/art/** (root `index.html` redirects to `site/index.html`).

Catalog data (titles / prices / sold status / product links) mirrors
`danahabayeb.art` and lives in one place: `site/js/data.js`.

## The website (`site/`)

```
site/
  index.html          page
  css/style.css       design system (camel / warm taupe / dusty mauve / deep wine / charcoal)
  js/data.js          catalog data + hall stills list
  js/main.js          loader, hero, stories, traveler, gallery, lightbox
index.html            root redirect -> site/index.html
```

Experience, top to bottom:

- **Realistic brush loader** — a hand-built brush (wood / ferrule / bristle gradients)
  descends and writes "Art by" then "Dana Habayeb" in script, choreographed after the
  `loading.mp4` reference clip; the curtain lifts only once the writing is done **and**
  the hero images are decoded, so the hero never pops in afterwards.
- **Editorial scattered-art hero** — cream canvas, her 15 artworks floating as
  white-framed cards in the layout traced from the reference recording, big serif
  statement "Art That Tells / A Story", rust scribble draw-in, rotating orbit badge,
  mouse-depth parallax, star cursor.
- **Second section — pinned story cards** — 430 vh of scroll drive a horizontal row of
  tilted, white-bordered story cards over a ghost statement; the bottom-left panel swaps
  title + story per active card.
- **Traveling artwork** — *Pali Pika* leaves its hero slot, flies into the first story-card
  slot, rides the horizontal drift, then lands on its own tile in the Collection
  (coffee-cup style hand-off between sections).
- **The Hall** — photoreal stills of the walkthrough in walking order, snap-scroll strip.
- **Collection** — the 15 real originals with prices/sold status, hover zoom,
  lightbox deep-linking to the Shopify products.
- Marquee band, film grain, commission CTA, reduced-motion support.

Serve locally from the repo root (media paths are root-relative):

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Walkthrough archive (keyframes + pipeline)

The hall was rendered as **one continuous camera take** (no cuts) — left wall artworks
1–7, front wall, right wall past the stairs, ending at the gate. The encoded mp4s were
removed from the repo by design; the AI keyframes remain in `keyframes/` (used by
*The Hall*) and the deterministic offline renderer remains in `tools/`:

1. `tools/prep_textures.py` — frames around each artwork, procedural marble floor, gate texture.
2. `tools/walk.py` — numpy software rasterizer: perspective-correct projection, z-buffer,
   spot lighting, planar floor reflection, fog, vignette, filmic tonemap, Catmull-Rom
   camera + gaze splines with head-bob.

Artwork → wall order used by the take:
image-9, image-7, 3.webp, image-8, 2.webp, image-3, image-1 (left) ·
image-6 (front) · image-10, image-11, image-2, image-4, image-5, 1.webp, 4.webp (right).

`VIDEO_PROMPT_PACK.md` + `PROMPT_*.md` hold the Seedance 2.5 prompt pack for regenerating
the take as AI video from the `keyframes/` references. `refrence.mp4` is the style
reference provided with the project.
