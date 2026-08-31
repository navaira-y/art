# Seedance 2.5 — 15 s, 16:9, single-take gallery walkthrough

## Settings
- duration: **15**
- aspect_ratio: **16:9**
- resolution: 720p (test) / 1080p (final)
- mode: multimodal reference (T2V + image refs) — 29 refs total (limit 30)

## Attach order (roles are labelled in the prompt)

Artworks (walls, exact hanging order):
| tag | file | role |
|-----|------|------|
| @Image1 | image-9.png  | left wall #1 |
| @Image2 | image-7.png  | left wall #2 |
| @Image3 | 3.webp       | left wall #3 |
| @Image4 | image-8.png  | left wall #4 |
| @Image5 | 2.webp       | left wall #5 |
| @Image6 | image-3.png  | left wall #6 |
| @Image7 | image-1.png  | left wall #7 |
| @Image8 | image-6.png  | front wall |
| @Image9 | image-10.png | right wall #9 |
| @Image10| image-11.png | right wall #10 |
| @Image11| image-2.png  | right wall #11 |
| @Image12| image-4.png  | right wall #12 |
| @Image13| image-5.png  | right wall #13 |
| @Image14| 1.webp       | right wall #14 |
| @Image15| 4.webp       | right wall #15 |

Keyframes (camera path, in walking order — one every ~4-5 steps):
| tag | file | path position |
|-----|------|---------------|
| @Image16| keyframes/k1_gate_entry.jpg | FIRST frame — gate entry, whole hall |
| @Image17| keyframes/m02.jpg | left: astronaut + mandala |
| @Image18| keyframes/m03.jpg | left: mandala + watermelon girl |
| @Image19| keyframes/m04.jpg | left: watermelon girl + cubist faces |
| @Image20| keyframes/m05.jpg | left: cubist faces + Dubai Pikachu |
| @Image21| keyframes/m06.jpg | left: Dubai Pikachu + Luffy |
| @Image22| keyframes/m07.jpg | left end: Luffy + desert, front ahead |
| @Image23| keyframes/k3_left_end_front.jpg | corner: front artwork + stairs |
| @Image24| keyframes/k4_turn_stairs.jpg | turning right at the staircase |
| @Image25| keyframes/m10.jpg | right: THIS-IS + blue-hat Pikachu |
| @Image26| keyframes/m11.jpg | right: blue-hat + hoodie Pikachu |
| @Image27| keyframes/m12.jpg | right: hoodie + bandana Pikachu |
| @Image28| keyframes/m13.jpg | right: bandana + thobe Pikachu |
| @Image29| keyframes/k6_end_gate.jpg | LAST frame — horse/desert + gate |

## Prompt (paste as-is)

One continuous single take, 15 seconds, 16:9, photorealistic. A fast smooth
steadicam walkthrough of a rectangular luxury art gallery at eye height — one
unbroken shot, NO cuts, NO transitions.

Follow the camera path shown by @Image16-@Image29 in that exact order: they
are frames of the same uninterrupted walk, spaced a few steps apart. Use
@Image16 as the first frame and @Image29 as the last frame. Set and style from
these frames: white walls, dark polished black marble floor with mirror
reflections, warm recessed ceiling spotlights, ornate black wrought-iron gate
at the entrance end, elegant light-stone staircase with slim balustrade at the
front-right corner.

The fifteen framed paintings on the walls are exactly @Image1-@Image15, hung
in this exact order, rendered faithfully with no warping:
0-6s: camera enters through the gate and glides fast and smooth along the
LEFT wall with the view turned hard left — about 85 percent of the gaze aimed
at the left wall, not a slight glance; @Image1-@Image7 pass by one after
another, in order.
6-8s: at the far corner the camera turns naturally toward the FRONT wall;
@Image8 hangs centered ahead.
8-15s: camera sweeps RIGHT around the staircase and keeps gliding along the
RIGHT wall without stopping; @Image9-@Image15 pass by one after another, in
order; the shot ends still moving toward the gate.

CRITICAL: all fifteen referenced paintings must appear fully, clearly and in
order — do not skip or merge any. Fast but stable motion, no stutter, no
morphing of the artworks, believable depth and reflections.
