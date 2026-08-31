# Video Generation Pack — single-take gallery walkthrough

This environment contains **no video-generation model** (media tools here are
image + speech only). This pack gives any external video generator
(Kling, Veo, Runway Gen-3/4, Sora, Hailuo…) everything needed to produce the
video in the style of `refrence.mp4`:

- `keyframes/k1_gate_entry.jpg` … `k6_end_gate.jpg` — photoreal AI keyframes,
  generated from the real 15 artworks, in the exact reference style.
- The master prompt + per-clip prompts below.
- `gallery_walkthrough.mp4` — a deterministic CG animatic that fixes the exact
  camera path, artwork order and timing (use it as the motion/animatic reference).

## Artwork manifest (exact order, as provided)

LEFT wall 1→7: `image-9.png` (astronaut), `image-7.png` (mandala), `3.webp`
(watermelon girl), `image-8.png` (cubist faces), `2.webp` (Pikachu/Dubai),
`image-3.png` (Luffy), `image-1.png` (desert).
FRONT wall: `image-6.png`.
RIGHT wall 9→15: `image-10.png` (THIS IS), `image-11.png` (blue-hat Pikachu),
`image-2.png` (hoodie Pikachu), `image-4.png` (bandana Pikachu),
`image-5.png` (thobe Pikachu), `1.webp` (white horse), `4.webp` (dunes).

## Master prompt (single continuous take, if the tool supports long clips)

> Photorealistic cinematic one-take walkthrough of a rectangular luxury art
> gallery, exactly one continuous shot, no cuts, no transitions. Camera enters
> through an ornate black wrought-iron gate and walks forward at a fast but
> smooth human pace, eye height, gentle handheld stability. LEFT wall: seven
> framed pop-art paintings (the provided artworks, in the manifest order) pass
> by one after another while the camera faces slightly left. At the end of the
> hall the camera turns naturally toward the FRONT wall with one centered
> framed artwork, then sweeps RIGHT around an elegant light-stone staircase
> with slim balustrade and continues along the RIGHT wall where the remaining
> seven framed artworks appear one by one in order. Dark polished black marble
> floor with mirror reflections, white walls, warm recessed ceiling spotlights,
> realistic frames, natural shadows, believable depth. The shot ends still
> moving, facing the entrance gate.

## Per-clip prompts (for 5–10 s clip tools; chain with first/last-frame conditioning)

1. **k1 → k2** — "Continuous walking shot entering the gallery past the open
   iron gate, gliding along the left wall; the astronaut canvas then the
   mandala painting slide past in frame. No cuts."
2. **k2 → k3** — "Same uninterrupted take continues down the left wall past the
   watermelon-girl and cubist-face paintings, staircase becoming visible at the
   far right. No cuts."
3. **k3 → k4** — "Same take reaches the front wall artwork, camera turns
   smoothly right around the stone staircase; the THIS-IS barcode canvas and
   blue-hat Pikachu come into view on the right wall. No cuts."
4. **k4 → k5** — "Same take walks along the right wall; hoodie, bandana and
   thobe Pikachu paintings pass one by one. No cuts."
5. **k5 → k6** — "Same take passes the white-horse and desert-dunes paintings
   and ends still moving toward the ornate entrance gate. No cuts."

Style suffix for every clip: *photorealistic, cinematic museum lighting,
polished reflective black marble floor, 24 fps feel, human eye height, fast
smooth steadicam walk, no cuts, no warping of the artworks.*

## Tips

- Feed each clip its start keyframe (and next keyframe as end-frame) so the
  tool keeps architecture and artworks identical between clips.
- Upload the original artwork files as style/content references if the tool
  supports multiple image inputs; the keyframes already embed them.
- Concatenate the 5 clips directly — they share identical sets, so the joins
  read as one take (no transitions needed).
