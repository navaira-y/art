#!/usr/bin/env bash
# Dana Habayeb — asset pipeline.
# Turns the raw masters in the repo root into web sized webp used by site/,
# and writes site/js/manifest.js (byte sizes + intrinsic dimensions) so the
# loading screen can report real, byte accurate progress.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="site/assets/art"
mkdir -p "$OUT"

# master file -> slug (slug must match ART[].id in site/js/data.js)
PAIRS=(
  "image-9.png:there-is-always-hope"
  "image-7.png:the-source"
  "3.webp:from-the-land"
  "image-8.png:do-you-have-no-shame"
  "2.webp:sheikh-pika"
  "image-3.png:monkey-d-luffy"
  "image-1.png:dune-buggy-bashing"
  "image-6.png:the-world-is-watching"
  "image-10.png:this-is-your-god"
  "image-11.png:van-gogh-pikachu"
  "image-2.png:dxb-pika"
  "image-4.png:pali-pika"
  "image-5.png:mini-sheikh-pika"
  "1.webp:desert-companion"
  "4.webp:desert-dune-bashing"
)

for p in "${PAIRS[@]}"; do
  src="${p%%:*}"; slug="${p##*:}"
  [ -f "$src" ] || { echo "missing $src"; exit 1; }
  # large: 1120px on the long edge — enough for the gallery focus plate
  convert "$src" -auto-orient -resize '1120x1120>' -strip \
          -define webp:method=6 -quality 80 "$OUT/$slug.webp"
  # thumb: 380px — hero scatter + ring plates that are far from the camera
  convert "$src" -auto-orient -resize '380x380>' -strip \
          -define webp:method=6 -quality 78 "$OUT/$slug-s.webp"
  printf '%-24s %8s  %8s\n' "$slug" \
    "$(du -h "$OUT/$slug.webp" | cut -f1)" "$(du -h "$OUT/$slug-s.webp" | cut -f1)"
done

# paint mattes: white shape on transparent alpha, tinted in CSS via mask-image
mkdir -p site/assets/fx
for n in a b c d; do
  convert "tools/fx-src/$n.png" -colorspace Gray -negate -level 11%,92% \
    -alpha copy -channel RGB -evaluate set 100% +channel \
    -trim +repage -resize '1000x1000>' -quality 86 "site/assets/fx/splash-$n.webp"
done

node tools/write_manifest.js
echo "done"
