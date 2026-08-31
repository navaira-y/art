#!/usr/bin/env python3
"""Single-take cinematic gallery walkthrough renderer (software rasterizer, numpy).

One continuous camera path: enter gate -> 7 artworks left wall -> 1 front wall ->
turn right -> 7 artworks right wall past the staircase -> end facing the gate.
"""
import os, math, time
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, "tools", "tex")

# ---------------- hall dimensions (meters) ----------------
HX = 4.0          # half width  (walls at x=+-4)
HL = 30.0         # length      (gate z=0, front wall z=30)
HH = 4.4          # height
EYE = 1.62

W, H = 960, 540
FOV_H = math.radians(74)
FX = (W / 2) / math.tan(FOV_H / 2)
FY = FX
CX, CY = W / 2, H / 2
NEAR = 0.06

# ---------------- catmull-rom ----------------
def catmull(pts, n=400):
    P = np.array(pts, np.float64)
    P = np.vstack([P[0] + (P[0] - P[1]), P, P[-1] + (P[-1] - P[-2])])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        t = np.linspace(0, 1, n, endpoint=False)[:, None]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t ** 2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return np.vstack(out + [P[-2]])

PATH = catmull([
    (0.0, EYE, 0.5), (0.0, EYE, 2.0), (-0.7, EYE, 7.0), (-0.85, EYE, 13.0),
    (-0.7, EYE, 19.0), (-0.2, EYE, 24.0), (0.4, EYE, 26.6), (1.1, EYE, 27.2),
    (2.0, EYE, 25.4), (2.3, EYE, 21.0), (2.3, EYE, 14.0), (2.3, EYE, 7.0),
    (2.3, EYE, 6.0), (2.25, EYE, 4.5)])
LOOK = catmull([
    (-1.6, 1.5, 5.0), (-2.6, 1.5, 9.0), (-2.8, 1.5, 14.0), (-2.4, 1.5, 19.0),
    (-1.2, 1.5, 24.0), (0.0, 1.55, 29.5), (0.0, 1.55, 29.5), (2.8, 1.5, 22.0),
    (3.0, 1.5, 17.0), (3.0, 1.5, 11.0), (2.9, 1.5, 6.0), (2.5, 1.5, 3.5),
    (1.0, 1.5, 0.0), (0.0, 1.5, -4.0)])

_seg = np.sqrt(((PATH[1:] - PATH[:-1]) ** 2).sum(1))
_cum = np.concatenate([[0], np.cumsum(_seg)])
TOTAL_LEN = _cum[-1]
LOOK_seg = np.sqrt(((LOOK[1:] - LOOK[:-1]) ** 2).sum(1))
LOOK_cum = np.concatenate([[0], np.cumsum(LOOK_seg)])

def path_at(dist):
    d = np.clip(dist, 0, TOTAL_LEN - 1e-6)
    i = np.searchsorted(_cum, d) - 1
    i = min(max(i, 0), len(PATH) - 2)
    f = (d - _cum[i]) / max(_seg[i], 1e-9)
    return PATH[i] * (1 - f) + PATH[i + 1] * f

def look_at_frac(fr):
    d = np.clip(fr, 0, 1) * LOOK_cum[-1]
    i = np.searchsorted(LOOK_cum, d) - 1
    i = min(max(i, 0), len(LOOK) - 2)
    f = (d - LOOK_cum[i]) / max(LOOK_seg[i], 1e-9)
    return LOOK[i] * (1 - f) + LOOK[i + 1] * f

SPEED = 1.75
FPS = 24
N_FRAMES = int(TOTAL_LEN / SPEED * FPS)

# ---------------- scene geometry ----------------
class Tri:
    __slots__ = ("v", "uv", "tex", "col", "nrm", "emit", "tag", "lights", "accents", "tid")
    def __init__(self, v, uv, tex=None, col=None, nrm=None, emit=0.0, tag=""):
        self.v = np.asarray(v, np.float64); self.uv = np.asarray(uv, np.float64)
        self.tex = tex; self.col = col; self.emit = emit; self.tag = tag
        self.nrm = nrm if nrm is not None else norm3(np.cross(v[1] - v[0], v[2] - v[0]))
        self.lights = []; self.accents = []; self.tid = -1

def norm3(a):
    a = np.asarray(a, np.float64); l = np.linalg.norm(a)
    return a / l if l > 0 else np.array([0., 1., 0.])

def quad(p0, p1, p2, p3, uv0=(0, 0), uv1=(1, 0), uv2=(1, 1), uv3=(0, 1), **kw):
    return [Tri([p0, p1, p2], [uv0, uv1, uv2], **kw), Tri([p0, p2, p3], [uv0, uv2, uv3], **kw)]

ART_DEFS = []
R = {}
def load_ratios():
    for i in range(15):
        a = np.load(os.path.join(TEX, f"art{i:02d}.npy"), mmap_mode="r")
        R[i] = a.shape[1] / a.shape[0]

LEFT_Z = [4.3, 7.7, 11.1, 14.5, 17.9, 21.3, 24.7]
LEFT_SZ = [(2.6, None), (None, 2.3), (None, 2.0), (2.2, None), (None, 2.0), (None, 2.0), (None, 1.9)]
RIGHT_Z = [20.5, 17.5, 14.5, 11.5, 8.5, 5.5, 2.5]
RIGHT_SZ = [(None, 1.9), (None, 1.8), (None, 2.0), (None, 2.0), (None, 1.8), (None, 1.8), (None, 1.8)]

def art_size(i, w, h):
    r = R[i]
    if w: return w, w / r
    return h * r, h

def build_scene():
    load_ratios()
    T = []
    wall_col = np.array([0.66, 0.64, 0.61]); ceil_col = np.array([0.42, 0.41, 0.40])
    T += quad((-HX, 0, 0), (HX, 0, 0), (HX, 0, HL), (-HX, 0, HL),
              uv0=(0, 0), uv1=(HX * 2 / 4, 0), uv2=(HX * 2 / 4, HL / 4), uv3=(0, HL / 4),
              tex="floor", nrm=(0, 1, 0), tag="floor")
    T += quad((-HX, HH, 0), (-HX, HH, HL), (HX, HH, HL), (HX, HH, 0), col=ceil_col, nrm=(0, -1, 0), tag="ceil")
    T += quad((-HX, 0, 0), (-HX, HH, 0), (-HX, HH, HL), (-HX, 0, HL), col=wall_col, nrm=(1, 0, 0), tag="wallL")
    T += quad((HX, 0, HL), (HX, HH, HL), (HX, HH, 0), (HX, 0, 0), col=wall_col, nrm=(-1, 0, 0), tag="wallR")
    T += quad((-HX, 0, HL), (HX, 0, HL), (HX, HH, HL), (-HX, HH, HL), col=wall_col, nrm=(0, 0, -1), tag="wallF")
    T += quad((HX, 0, 0), (-HX, 0, 0), (-HX, HH, 0), (HX, HH, 0), col=wall_col * 0.8, nrm=(0, 0, 1), tag="wallB")
    T += quad((-1.4, 0, 0.03), (1.4, 0, 0.03), (1.4, 3.2, 0.03), (-1.4, 3.2, 0.03), tex="gate", nrm=(0, 0, 1), tag="gate")
    bb = 0.12
    T += quad((-HX + 0.02, 0, 0), (-HX + 0.02, 0, HL), (-HX + 0.02, bb, HL), (-HX + 0.02, bb, 0), col=np.array([0.22, 0.21, 0.2]), nrm=(1, 0, 0), tag="base")
    T += quad((HX - 0.02, 0, HL), (HX - 0.02, 0, 0), (HX - 0.02, bb, 0), (HX - 0.02, bb, HL), col=np.array([0.22, 0.21, 0.2]), nrm=(-1, 0, 0), tag="base")
    T += quad((-HX, 0, HL - 0.02), (HX, 0, HL - 0.02), (HX, bb, HL - 0.02), (-HX, bb, HL - 0.02), col=np.array([0.22, 0.21, 0.2]), nrm=(0, 0, -1), tag="base")

    for i, zc in enumerate(LEFT_Z):
        w, h = art_size(i, *LEFT_SZ[i])
        x = -HX + 0.02
        p = [(x, 1.6 - h / 2, zc - w / 2), (x, 1.6 - h / 2, zc + w / 2), (x, 1.6 + h / 2, zc + w / 2), (x, 1.6 + h / 2, zc - w / 2)]
        T += quad(*p, tex=f"art{i:02d}", nrm=(1, 0, 0), tag="art")
        ART_DEFS.append(("wallL", zc, 1.6, w, h))
    w, h = art_size(7, None, 1.9)
    p = [(-w / 2, 1.6 - h / 2, HL - 0.02), (w / 2, 1.6 - h / 2, HL - 0.02), (w / 2, 1.6 + h / 2, HL - 0.02), (-w / 2, 1.6 + h / 2, HL - 0.02)]
    T += quad(*p, tex="art07", nrm=(0, 0, -1), tag="art")
    ART_DEFS.append(("wallF", 0.0, 1.6, w, h))
    for i, zc in enumerate(RIGHT_Z):
        w, h = art_size(8 + i, *RIGHT_SZ[i])
        x = HX - 0.02
        p = [(x, 1.6 - h / 2, zc + w / 2), (x, 1.6 - h / 2, zc - w / 2), (x, 1.6 + h / 2, zc - w / 2), (x, 1.6 + h / 2, zc + w / 2)]
        T += quad(*p, tex=f"art{8 + i:02d}", nrm=(-1, 0, 0), tag="art")
        ART_DEFS.append(("wallR", zc, 1.6, w, h))

    for zc in np.arange(2.0, 29.0, 3.0):
        for xc in (-2.0, 2.0):
            s = 0.2
            p = [(xc - s, HH - 0.01, zc - s), (xc + s, HH - 0.01, zc - s), (xc + s, HH - 0.01, zc + s), (xc - s, HH - 0.01, zc + s)]
            T += quad(*p, col=np.array([1., 1., 1.]), emit=3.2, nrm=(0, -1, 0), tag="spot")

    x0, x1 = 2.9, HX
    n_st, td, rs = 16, 0.28, 0.175
    for i in range(n_st):
        za, zb = 22.0 + i * td, 22.0 + (i + 1) * td
        yb = (i + 1) * rs
        T += quad((x0, yb - rs, za), (x1, yb - rs, za), (x1, yb, za), (x0, yb, za), col=np.array([0.62, 0.6, 0.58]), nrm=(0, 0, -1), tag="stair")
        T += quad((x0, yb, za), (x1, yb, za), (x1, yb, zb), (x0, yb, zb), col=np.array([0.75, 0.73, 0.7]), nrm=(0, 1, 0), tag="stair")
    ytop = n_st * rs; zend = 22.0 + n_st * td
    T += quad((x0, ytop, zend), (x1, ytop, zend), (x1, ytop, 28.6), (x0, ytop, 28.6), col=np.array([0.75, 0.73, 0.7]), nrm=(0, 1, 0), tag="stair")
    for i in range(6):
        xa, xb = x0 - i * td, x0 - (i + 1) * td
        yb = ytop + (i + 1) * rs
        T += quad((xa, yb - rs, 28.6), (xa, yb, 28.6), (xa, yb, HL), (xa, yb - rs, HL), col=np.array([0.62, 0.6, 0.58]), nrm=(-1, 0, 0), tag="stair")
        T += quad((xb, yb, 28.6), (xa, yb, 28.6), (xa, yb, HL), (xb, yb, HL), col=np.array([0.75, 0.73, 0.7]), nrm=(0, 1, 0), tag="stair")
    T += [Tri([(x0, 0, 22.0), (x0, ytop, zend), (x0, 0, zend)], [(0, 0), (1, 1), (1, 0)], col=np.array([0.42, 0.4, 0.38]), nrm=(-1, 0, 0), tag="stair")]
    T += [Tri([(x0, ytop, 28.6), (x0 - 6 * td, ytop + 6 * rs, 28.6), (x0 - 6 * td, ytop, 28.6)], [(0, 0), (1, 1), (1, 0)], col=np.array([0.45, 0.43, 0.41]), nrm=(0, 0, -1), tag="stair")]
    rail_h = 0.95
    for k in range(6):  # balustrade posts
        zp = 22.0 + k * (zend - 22.0) / 5.0
        yp = min(zp - 22.0, ytop) * (ytop / (zend - 22.0))
        T += quad((x0 - 0.02, yp, zp - 0.03), (x0 - 0.02, yp, zp + 0.03), (x0 - 0.02, yp + rail_h, zp + 0.03), (x0 - 0.02, yp + rail_h, zp - 0.03), col=np.array([0.2, 0.2, 0.22]), nrm=(-1, 0, 0), tag="rail")
    T += quad((x0 - 0.06, ytop + rail_h, 22.0), (x0 + 0.06, ytop + rail_h, 22.0), (x0 + 0.06, ytop + rail_h, zend), (x0 - 0.06, ytop + rail_h, zend), col=np.array([0.35, 0.3, 0.22]), nrm=(0, 1, 0), tag="rail")
    T += quad((x0 - 0.06, rail_h, 22.0), (x0 + 0.06, rail_h, 22.0), (x0 + 0.06, ytop + rail_h, zend), (x0 - 0.06, ytop + rail_h, zend), col=np.array([0.35, 0.3, 0.22]), nrm=(0, 1, 0), tag="rail")
    return T

LIGHTS = [(xc, HH - 0.15, float(zc)) for zc in np.arange(2.0, 29.0, 3.0) for xc in (-2.0, 2.0)]
LIGHT_COL = np.array([1.0, 0.93, 0.82], np.float32)

def prep_tri(t):
    lo, hi = t.v.min(0), t.v.max(0)
    for li, lp in enumerate(LIGHTS):
        if all(lo[k] - 7 <= lp[k] <= hi[k] + 7 for k in range(3)):
            t.lights.append(li)
    wallmap = {"wallL": "wallL", "wallR": "wallR", "wallF": "wallF"}
    if t.tag == "art":
        if t.nrm[0] > 0.5: wallmap["art"] = "wallL"
        elif t.nrm[0] < -0.5: wallmap["art"] = "wallR"
        else: wallmap["art"] = "wallF"
    if t.tag in wallmap:
        for wall, zc, yc, w, h in ART_DEFS:
            if wall == wallmap[t.tag]:
                t.accents.append((float(zc), float(yc), float(w), float(h)))
    return t

TEXC = {}
def tex_of(name):
    if name not in TEXC:
        a = np.load(os.path.join(TEX, f"{name}.npy"))
        TEXC[name] = a.astype(np.float32) / 255.0
    return TEXC[name]

def sample(tex, u, v):
    th, tw = tex.shape[:2]
    x = np.mod(u, 1.0) * (tw - 1); y = (1 - np.mod(v, 1.0)) * (th - 1)
    x0 = np.floor(x).astype(np.int32); y0 = np.floor(y).astype(np.int32)
    fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    x1 = np.minimum(x0 + 1, tw - 1); y1 = np.minimum(y0 + 1, th - 1)
    return tex[y0, x0] * (1 - fx) * (1 - fy) + tex[y0, x1] * fx * (1 - fy) + tex[y1, x0] * (1 - fx) * fy + tex[y1, x1] * fx * fy

def _draw_tri(fb, zb, zbw, idb, t, v, uv):
    vv = v - EYE_V
    xc = vv @ RIGHT_V; yc = vv @ UP_V; zc = vv @ FWD_V
    cs = np.stack([xc, yc, zc], 1)
    poly = list(range(3))
    outp = []; outuv = []
    for i in range(3):
        a, b = poly[i], poly[(i + 1) % 3]
        da, db = cs[a, 2] > NEAR, cs[b, 2] > NEAR
        if da:
            outp.append(a); outuv.append(uv[a])
        if da != db:
            f = (NEAR - cs[a, 2]) / (cs[b, 2] - cs[a, 2])
            newv = v[a] + f * (v[b] - v[a]); newuv = uv[a] + f * (uv[b] - uv[a])
            v = np.vstack([v, newv]); uv = np.vstack([uv, newuv])
            cs = np.vstack([cs, cs[a] + f * (cs[b] - cs[a])])
            outp.append(len(v) - 1); outuv.append(newuv)
    if len(outp) < 3:
        return
    nv = v[outp]; nuv = np.array(outuv)
    for k in range(1, len(outp) - 1):
        _raster(fb, zb, zbw, idb, t, nv[[0, k, k + 1]], nuv[[0, k, k + 1]])

def _raster(fb, zb, zbw, idb, t, v, uv):
    vv = v - EYE_V
    xc = vv @ RIGHT_V; yc = vv @ UP_V; zc = vv @ FWD_V
    q = 1.0 / zc
    sx = CX + FX * xc * q; sy = CY - FY * yc * q
    minx, maxx = int(max(sx.min(), 0)), int(min(sx.max(), W - 1))
    miny, maxy = int(max(sy.min(), 0)), int(min(sy.max(), H - 1))
    if maxx <= minx or maxy <= miny:
        return
    xs = np.arange(minx, maxx + 1) + 0.5; ys = np.arange(miny, maxy + 1) + 0.5
    gx, gy = np.meshgrid(xs, ys)
    x0, y0 = sx[0], sy[0]; x1, y1 = sx[1], sy[1]; x2, y2 = sx[2], sy[2]
    w0 = (y1 - y2) * (gx - x1) + (x2 - x1) * (gy - y1)
    w1 = (y2 - y0) * (gx - x2) + (x0 - x2) * (gy - y2)
    w2 = (y0 - y1) * (gx - x0) + (x1 - x0) * (gy - y0)
    area = (w0 + w1 + w2).flat[0]
    if abs(area) < 1e-9:
        return
    w0 /= area; w1 /= area; w2 /= area
    mask = (w0 >= -0.002) & (w1 >= -0.002) & (w2 >= -0.002)
    if not mask.any():
        return
    qpix = w0 * q[0] + w1 * q[1] + w2 * q[2]
    z = (1.0 / qpix).astype(np.float32)
    zwin = zbw[miny:maxy + 1, minx:maxx + 1]
    m = mask & (z < zwin)
    if not m.any():
        return
    ii = np.nonzero(m)
    flat = (ii[0] + miny) * W + (ii[1] + minx)
    zb[flat] = z[m]
    if idb is not None:
        idb[flat] = t.tid
    w0m, w1m, w2m = w0[m], w1[m], w2[m]
    qm = qpix[m]
    wp = (w0m[:, None] * q[0] * v[0] + w1m[:, None] * q[1] * v[1] + w2m[:, None] * q[2] * v[2]) / qm[:, None]
    if t.tex:
        uvp = (w0m[:, None] * q[0] * uv[0] + w1m[:, None] * q[1] * uv[1] + w2m[:, None] * q[2] * uv[2]) / qm[:, None]
        alb = sample(tex_of(t.tex), uvp[:, 0], uvp[:, 1])
    else:
        alb = np.broadcast_to(t.col, (len(w0m), 3)).astype(np.float32).copy()
    if t.emit > 0:
        fb[flat] = alb * t.emit
        return
    dif = np.broadcast_to(np.array([0.16, 0.155, 0.14], np.float32), (len(w0m), 3)).copy()
    n = t.nrm
    for li in t.lights:
        lp = LIGHT_ARR[li]
        d = lp - wp
        dist2 = (d * d).sum(1)
        att = 1.5 * np.exp(-dist2 / 20.0)
        dl = d / np.sqrt(dist2 + 1e-6)[:, None]
        ndl = np.clip(dl @ n, 0, None)
        dif += (ndl * att)[:, None] * LIGHT_COL
    if t.tag in ("wallL", "wallR", "wallF", "art"):
        axis = wp[:, 2] if abs(n[0]) > 0.5 else wp[:, 0]
        ay = wp[:, 1]
        for (zc2, yc2, w2_, h2_) in t.accents:
            g = np.exp(-((axis - zc2) ** 2) / (2 * (w2_ * 0.62) ** 2)) * np.exp(-((ay - yc2) ** 2) / (2 * (h2_ * 0.62) ** 2))
            dif += g[:, None] * 0.30 * LIGHT_COL
            if t.tag != "art":
                dz = np.maximum(np.abs(axis - zc2) - w2_ / 2, 0)
                dy = np.maximum(np.abs(ay - yc2) - h2_ / 2, 0)
                ao = np.exp(-(dz * dz + dy * dy) / (2 * 0.10 ** 2))
                dif *= (1 - 0.35 * ao)[:, None]
    if t.tag == "floor":
        dif *= 0.25
    fb[flat] = alb * dif

EYE_V = FWD_V = RIGHT_V = UP_V = None
LIGHT_ARR = np.array(LIGHTS, np.float32)

def render(tris, eye, right, up, fwd):
    global EYE_V, FWD_V, RIGHT_V, UP_V
    EYE_V = np.asarray(eye, np.float64)
    FWD_V = norm3(fwd); RIGHT_V = norm3(right); UP_V = norm3(up)
    fb = np.zeros((H * W, 3), np.float32)
    zb = np.full(H * W, np.inf, np.float32)
    zbw = zb.reshape(H, W)
    idb = np.full(H * W, -1, np.int32)
    for t in tris:
        _draw_tri(fb, zb, zbw, idb, t, t.v.copy(), t.uv.copy())
    return fb.reshape(H, W, 3), zbw, idb.reshape(H, W)

def fog(fb, zb):
    f = 1 - np.exp(-(zb / 55.0) ** 2 * 1.4)
    f = np.clip(f, 0, 0.55)
    fb *= (1 - f)[..., None]
    fb += np.array([0.012, 0.012, 0.015], np.float32) * f[..., None]

def post(c):
    cc = 1 - np.exp(-c * 1.25)
    cc = cc * np.array([1.06, 0.99, 0.88], np.float32)   # warm filmic grade
    cc = np.clip(cc, 0, 1) ** (1 / 2.2) * 255
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.sqrt(((xx - CX) / CX) ** 2 + ((yy - CY) / CY) ** 2)
    vig = 1 - 0.30 * np.clip(r - 0.55, 0, 1) ** 1.6
    cc = cc * vig[..., None]
    cc += (np.random.rand(H, W, 1) - 0.5) * 5.0          # subtle film grain
    return np.clip(cc, 0, 255).astype(np.uint8)

def frame(t):
    dist = t * SPEED
    eye = path_at(dist).copy()
    look = look_at_frac(min(dist / TOTAL_LEN, 1.0) * 0.985 + 0.005)
    eye[1] += 0.018 * math.sin(2 * math.pi * 1.9 * t)
    fwd = norm3(look - eye)
    right = norm3(np.cross((0, 1, 0), fwd))
    up = norm3(np.cross(fwd, right))
    eye = eye + right * (0.012 * math.sin(math.pi * 1.9 * t + 1.0))
    fb, zb, idb = render(SCENE, eye, right, up, fwd)
    fog(fb, zb)
    # planar reflection in floor (mirror camera across y=0, same screen mapping)
    M = np.array([1., -1., 1.])
    meye = eye * M
    mfwd = fwd * M; mright = right * M; mup = up * M
    rfb, _, _ = render([t2 for t2 in SCENE if t2.tag != "floor"], meye, mright, mup, mfwd)
    fog(rfb, np.full((H, W), 20.0, np.float32))
    rimg = Image.fromarray(np.clip(rfb * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
    ra = (np.asarray(rimg, np.float32) / 255.0) * np.array([0.82, 0.82, 0.85], np.float32)
    fmask = np.isin(idb, [t2.tid for t2 in SCENE if t2.tag == "floor"])
    ys = np.arange(H) + 0.5; xs2 = np.arange(W) + 0.5
    gx, gy = np.meshgrid(xs2, ys)
    dirx = (gx - CX) / FX; diry = (CY - gy) / FY
    dirs = dirx[..., None] * right + diry[..., None] * up + fwd
    dirs /= np.linalg.norm(dirs, axis=-1)[..., None]
    cosang = np.abs(dirs[..., 1])
    F = np.clip(0.2 + 0.55 * (1 - cosang) ** 2, 0, 0.78)
    out = fb.copy()
    out[fmask] = fb[fmask] * (1 - 0.45 * F[fmask])[..., None] + ra[fmask] * F[fmask][..., None]
    return post(out)

SCENE = None
def init():
    global SCENE
    SCENE = [prep_tri(t) for t in build_scene()]
    for i, t in enumerate(SCENE):
        t.tid = i

if __name__ == "__main__":
    import sys
    init()
    if len(sys.argv) >= 3:
        a, b = int(sys.argv[1]), int(sys.argv[2])
        outd = sys.argv[3] if len(sys.argv) > 3 else "/home/user/frames"
        os.makedirs(outd, exist_ok=True)
        for i in range(a, b):
            img = frame(i / FPS)
            Image.fromarray(img).save(f"{outd}/f_{i:04d}.jpg", quality=92)
            if i % 25 == 0:
                print(i, flush=True)
    else:
        for tt in [1.0, 8.0, 15.0, 22.0, 27.0, 31.0]:
            t0 = time.time()
            img = frame(tt)
            print(tt, round(time.time() - t0, 2), "s")
            Image.fromarray(img).save(f"/home/user/ref/test_{tt:.0f}.jpg", quality=90)
