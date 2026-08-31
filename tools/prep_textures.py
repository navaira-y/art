#!/usr/bin/env python3
"""Prepare framed artwork textures + procedural marble/gate textures as .npy files."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "tools", "tex")
os.makedirs(OUT, exist_ok=True)

# (filename, frame style)  order = museum placement order
ARTS = [
    ("image-9.png",  "black"),   # L1 astronaut street art (landscape)
    ("image-7.png",  "black"),   # L2 mandala (tall)
    ("3.webp",       "black"),   # L3 watermelon girl
    ("image-8.png",  "gold"),    # L4 picasso faces
    ("2.webp",       "black"),   # L5 pikachu keffiyeh dubai
    ("image-3.png",  "black"),   # L6 luffy
    ("image-1.png",  "black"),   # L7 desert landscape
    ("image-6.png",  "black"),   # F1 photography piece (front wall)
    ("image-10.png", "black"),   # R1 THIS IS YOUR
    ("image-11.png", "gold"),    # R2 pikachu blue hat
    ("image-2.png",  "black"),   # R3 pikachu hoodie
    ("image-4.png",  "black"),   # R4 pikachu bandana
    ("image-5.png",  "black"),   # R5 pikachu thobe
    ("1.webp",       "gold"),    # R6 white horse
    ("4.webp",       "black"),   # R7 desert dunes
]

def add_frame(img, style):
    w, h = img.size
    m = max(6, int(0.035 * min(w, h)))          # frame border px
    inner = max(2, int(0.008 * min(w, h)))      # thin inner lip
    canvas = Image.new("RGB", (w + 2 * m, h + 2 * m))
    d = ImageDraw.Draw(canvas)
    if style == "gold":
        d.rectangle([0, 0, w + 2 * m - 1, h + 2 * m - 1], fill=(122, 92, 40))
        d.rectangle([2, 2, w + 2 * m - 3, h + 2 * m - 3], fill=(168, 130, 62))
        d.rectangle([m - inner, m - inner, w + m + inner - 1, h + m + inner - 1], fill=(60, 44, 20))
    else:
        d.rectangle([0, 0, w + 2 * m - 1, h + 2 * m - 1], fill=(24, 22, 21))
        d.rectangle([2, 2, w + 2 * m - 3, h + 2 * m - 3], fill=(46, 44, 42))
        d.rectangle([m - inner, m - inner, w + m + inner - 1, h + m + inner - 1], fill=(10, 10, 10))
    canvas.paste(img, (m, m))
    return canvas

def main():
    for i, (fn, style) in enumerate(ARTS):
        img = Image.open(os.path.join(ROOT, fn)).convert("RGB")
        framed = add_frame(img, style)
        framed.thumbnail((1024, 1024), Image.LANCZOS)
        a = np.asarray(framed, dtype=np.uint8)
        np.save(os.path.join(OUT, f"art{i:02d}.npy"), a)
        ratio = framed.size[0] / framed.size[1]
        print(f"art{i:02d} {fn} {framed.size} ratio={ratio:.4f}")

    # --- marble floor tile (procedural) ---
    rng = np.random.default_rng(7)
    S = 1024
    base = np.full((S, S, 3), 14.0, dtype=np.float32)
    # veins: blurred random walk lines
    vein = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(vein)
    for _ in range(26):
        x, y = rng.uniform(0, S), rng.uniform(0, S)
        ang = rng.uniform(0, 2 * np.pi)
        pts = [(x, y)]
        for _ in range(40):
            ang += rng.normal(0, 0.5)
            x += np.cos(ang) * 9; y += np.sin(ang) * 9
            pts.append((x, y))
        d.line(pts, fill=int(rng.uniform(18, 40)), width=int(rng.uniform(1, 3)))
    vein = vein.filter(ImageFilter.GaussianBlur(2))
    vv = np.asarray(vein, dtype=np.float32) / 255.0
    col = base + vv[..., None] * np.array([26, 25, 24], np.float32)
    # large tile grout lines every 512 px (2 m tiles)
    g = 3
    col[:g, :] *= 0.4; col[:, :g] *= 0.4
    col[S//2:S//2+g, :] *= 0.5; col[:, S//2:S//2+g] *= 0.5
    # subtle blotches
    blot = Image.fromarray((rng.random((128, 128)) * 255).astype(np.uint8)).resize((S, S)).filter(ImageFilter.GaussianBlur(30))
    bb = np.asarray(blot, np.float32) / 255.0
    col *= (0.85 + 0.3 * bb[..., None])
    np.save(os.path.join(OUT, "floor.npy"), np.clip(col, 0, 255).astype(np.uint8))

    # --- ornate gate texture ---
    W, H = 768, 1024
    gate = Image.new("RGB", (W, H), (6, 5, 5))
    d = ImageDraw.Draw(gate)
    d.rectangle([0, 0, W - 1, 70], fill=(26, 21, 15))           # lintel
    d.rectangle([0, H - 46, W - 1, H - 1], fill=(20, 17, 13))   # base
    n = 18
    for i in range(n + 1):
        x = int(i * (W - 1) / n)
        d.line([(x, 70), (x, H - 46)], fill=(34, 28, 20), width=4)
        d.line([(x + 1, 70), (x + 1, H - 46)], fill=(70, 58, 40), width=1)
    for yy in (150, 480, 810):
        d.line([(0, yy), (W, yy)], fill=(30, 25, 18), width=6)
        d.line([(0, yy + 4), (W, yy + 4)], fill=(72, 60, 42), width=1)
    for i in range(n):
        cx = int((i + 0.5) * (W - 1) / n)
        for yy in (310, 640):
            d.ellipse([cx - 22, yy - 22, cx + 22, yy + 22], outline=(66, 54, 38), width=3)
            d.ellipse([cx - 12, yy - 12, cx + 12, yy + 12], outline=(50, 41, 29), width=2)
    gate = gate.filter(ImageFilter.GaussianBlur(0.6))
    np.save(os.path.join(OUT, "gate.npy"), np.asarray(gate, dtype=np.uint8))
    print("done")

if __name__ == "__main__":
    main()
