# Dana Habayeb — art that tells a story

Live site (GitHub Pages, branch `arena/01a058ba-art`, folder `/`):
**https://navaira-y.github.io/art/** — the root `index.html` redirects to `site/index.html`.

One cinematic, scroll driven page. Everything the visitor sees is real: real artworks,
real titles, real sizes, real prices, real availability, all mirrored from
`danahabayeb.art` and held in one file, `site/js/data.js`.

## Structure

```
site/
  index.html            the page
  css/style.css         design system + all layout
  js/data.js            the 15 originals, hero collage map, splash map
  js/manifest.js        generated: asset url -> byte size (drives the real loader)
  js/main.js            loader, score, motion, wiring
  assets/art/*.webp     1120px masters + 380px thumbs
  assets/fx/*.webp      paint splash mattes
  assets/fonts/*.woff2  self hosted Cormorant / Manrope / Kaushan
index.html              root redirect -> site/index.html
tools/build_assets.sh   masters -> webp + splash mattes -> manifest
tools/write_manifest.js scans site/assets -> site/js/manifest.js
```

## The experience, in order

1. **Loading screen.** Her name types out under a real progress bar with a numeric
   percentage. Progress is measured, not faked: six workers stream every asset in
   `manifest.js` and report bytes received (0 to 86%), then every artwork is decoded
   with `img.decode()` (86 to 96%), then the fonts resolve (96 to 100%). The curtain
   only lifts at 100%, so nothing pops in and nothing shifts afterwards.
2. **Hero.** The beige canvas, `#F1E9E4`, with the fifteen originals scattered as
   white framed prints around the statement *Art that tells a story.* This beige is
   the reference colour for the loader, the second section and the circle.
3. **Second section.** Same beige. The five chapter artworks travel through the frame
   one at a time on a 3D path, growing from far away, passing the camera and exiting
   past the viewer's shoulder. Nothing stacks and nothing collects; each card fully
   leaves before the next arrives, and the last one holds at the focus point.
4. **Circle transition.** Once every card has passed, the room dims and a solid beige
   circle grows from the centre until it owns the viewport. The second section stays
   pinned exactly where it is; the circle is the portal, not a scroll.
5. **Paint splashes.** Eight hand painted mattes are revealed around the edges with a
   growing `clip-path` circle, each one throwing inward and settling. Real paint
   texture, no particles, no glow.
6. **Circular gallery.** The splashes are pulled outward by an iris that opens onto a
   dark hall. Scrolling rotates a circular installation: each artwork swings in from
   the ring with perspective, depth, scale and rotation, and the focus position lands
   at z = 0 so the front piece is always pin sharp. A reflection sits under it, a dial
   tracks progress, and the caption cross fades. Pinned until all fifteen have shown.
7. **About.** A red circle opens over the hall and becomes the About section: her real
   line, *Just a kid who still thinks they can change the world*, the real bio, the
   real commission, shipping and workshop offerings.
8. **Footer.** Nothing after it.

Scroll is smoothed with an exponential follow, so the whole score is driven by one
interpolated value; every animated property is `transform`, `opacity` or `clip-path`.
Layout is measured once per resize, never per frame.

### Responsive and accessibility

Below 760px the hero collage switches to a dedicated map that keeps the middle band
clear for the headline, the travelling cards grow to 64vw, and the gallery ring tightens
its radius so neighbours frame the focus instead of leaving the centre empty. With
`prefers-reduced-motion: reduce` the score is cut to 45% of its length, entrance
animations and swap animations are disabled, and the hero collage is simply present.

## Rebuilding the assets

```bash
bash tools/build_assets.sh     # requires ImageMagick + cwebp
```

Masters live at the repo root (`image-*.png`, `*.webp`); the splash masters live in
`tools/fx-src/`. The script writes `site/assets/art`, `site/assets/fx` and regenerates
`site/js/manifest.js`. **Any change under `site/assets/` needs the manifest regenerated**
or the loader will not know about the file.

Serve the deployed layout locally from the repo root:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Artwork to file map

image-9 There is Always Hope · image-7 The Source · 3.webp From the Land ·
image-8 Do You Have No Shame · 2.webp Sheikh Pika · image-3 Monkey D. Luffy ·
image-1 Dune Buggy Bashing · image-6 The World is Watching · image-10 This is Your God ·
image-11 Van Gogh Pikachu · image-2 DXB Pika · image-4 Pali Pika ·
image-5 Mini Sheikh Pika · 1.webp Desert Companion · 4.webp Desert Dune Bashing.

## Archive

`keyframes/`, `tools/prep_textures.py`, `tools/walk.py`, `VIDEO_PROMPT_PACK.md` and
`PROMPT_*.md` are from the earlier gallery walkthrough render and are no longer used by
the page. `refrence.mp4` is the style reference supplied with the project.
