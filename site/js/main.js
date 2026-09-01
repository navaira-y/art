/* ============================================================================
   Dana Habayeb — main.js
   One pinned stage carries the whole middle of the site:
     travelling artworks  →  beige circle  →  paint  →  iris  →  circular hall
   Everything is driven by a single smoothed scroll position, so the motion
   lags the wheel just enough to feel like weight rather than a slideshow.
   ========================================================================== */
"use strict";

/* ───────────────────────────── helpers ───────────────────────────── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smoothstep = t => t * t * (3 - 2 * t);
const pad2 = n => (n < 10 ? "0" : "") + n;

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MDIM = Object.fromEntries(MANIFEST.map(e => [e[0], { w: e[2], h: e[3] }]));
const dimOf = k => MDIM[k] || { w: 4, h: 5 };

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

/* ══════════════════════════════════════════════════════════════════
   1 · DOM CONSTRUCTION  (images stay empty until the loader has them)
   ══════════════════════════════════════════════════════════════════ */
const artKey  = a => ART_DIR + a.id + ".webp";
const thumbKey = a => ART_DIR + a.id + "-s.webp";

/* ── hero scatter ── */
const scatter = $("#scatter");
const scatterCards = SCATTER.map(([id, x, y, w, depth], i) => {
  const a = BY_ID[id];
  const f = document.createElement("figure");
  f.style.setProperty("--fd", (0.1 + i * 0.045) + "s");
  const img = document.createElement("img");
  img.alt = "";
  img.dataset.k = thumbKey(a);
  img.decoding = "async";
  f.appendChild(img);
  scatter.appendChild(f);
  const m = SCATTER_M[id] || [x, y, w];
  const tilt = [-4.5, 3.2, -2.1, 5.4, -6.2, 2.6, -3.4, 4.8, -1.6, 6.1, -5.2, 2.2, -3.8, 4.2, -2.6][i] || 0;
  return { id, el: f, depth, tilt, d: [x, y, w], m, dx: 0, dy: 0,
           rot: (i % 2 ? 1 : -1) * (5 + (i % 5) * 2), i };
});

/* ── act II · travelling cards ── */
const a2Cards = $("#a2Cards");
const chapters = CHAPTERS.map(id => BY_ID[id]);
const cardEls = chapters.map(a => {
  const d = dimOf(artKey(a));
  const fig = document.createElement("figure");
  fig.className = "a2-card";
  const img = document.createElement("img");
  img.alt = a.t;
  img.dataset.k = artKey(a);
  img.decoding = "async";
  img.style.setProperty("--ar", (d.w / d.h).toFixed(4));
  const b = document.createElement("b");
  b.textContent = a.t;
  fig.append(img, b);
  a2Cards.appendChild(fig);
  return fig;
});

/* ── the first artwork: carried out of the hero, lands as the first card ── */
const traveler = $("#traveler");
const travImg = traveler.querySelector("img");
const travCap = traveler.querySelector("b");
travImg.dataset.k = artKey(chapters[0]);
travCap.textContent = chapters[0].t;
const travSlot = scatterCards.find(c => c.id === chapters[0].id) || null;
let travOn = false;

/* ── act III · the ring ── */
const ring = $("#ring");
const plates = ART.map(a => {
  const d = dimOf(artKey(a));
  const fig = document.createElement("figure");
  fig.className = "plate";
  const img = document.createElement("img");
  img.alt = a.t;
  img.dataset.k = artKey(a);
  img.decoding = "async";
  const dim = document.createElement("span");
  dim.className = "dim";
  fig.append(img, dim);
  ring.appendChild(fig);
  return { el: fig, dim, ar: d.w / d.h, art: a };
});

/* ── the paint ── */
const paint = $("#paint");
const blots = SPLASHES.map(s => {
  const el = document.createElement("i");
  el.className = "blot";
  el.style.setProperty("--c", "var(--" + s.c + ")");
  el.dataset.k = "assets/fx/splash-" + s.s + ".webp";
  const d = dimOf(el.dataset.k);
  el.style.width = s.w + "vw";
  el.style.height = (s.w * (d.h / d.w)) + "vw";
  el.style.left = s.x + "%";
  el.style.top = s.y + "%";
  paint.appendChild(el);
  /* throw direction: in from the nearest edge */
  const cx = s.x + s.w / 2, cy = s.y + 18;
  const tx = (cx < 50 ? -1 : 1) * (10 + Math.random() * 4);
  const ty = (cy < 50 ? -1 : 1) * 7;
  return { el, s, tx, ty };
});

/* ══════════════════════════════════════════════════════════════════
   2 · LOADING SCREEN  ·  real, byte accurate progress
   ══════════════════════════════════════════════════════════════════ */
const OBJ = Object.create(null);
const loader = $("#loader");
const ldFill = $("#ldFill"), ldPct = $("#ldPct"), ldNote = $("#ldNote");
const ldType = $("#ldType"), ldCaret = $("#ldCaret");
const ldBy = $("#ldBy"), ldCaretBy = $("#ldCaretBy");

let realP = 0;          /* the truth */
let shownP = 0;         /* the eased number on screen */
let loadDone = false;
let typeDone = false;   /* both loader lines fully typed */

/* typewriter runs alongside the download, it never gates the reveal —
   but it always finishes its two lines before the loader is allowed out */
(function typewriter() {
  const T1 = "Art by", T2 = "Dana Habayeb";
  const t0 = performance.now();
  const step = 0.088, gap = 0.42;
  (function tick(now) {
    const t = (now - t0) / 1000;
    const n1 = clamp(Math.floor((t - 0.25) / step), 0, T1.length);
    const start2 = 0.25 + T1.length * step + gap;
    const n2 = clamp(Math.floor((t - start2) / 0.078), 0, T2.length);
    ldBy.textContent = T1.slice(0, n1);
    ldType.textContent = T2.slice(0, n2);
    ldCaretBy.classList.toggle("off", n1 >= T1.length || n2 > 0);
    ldCaret.classList.toggle("off", n2 < 1 || n2 >= T2.length);
    if (n1 >= T1.length && n2 >= T2.length) typeDone = true;
    if (!typeDone) requestAnimationFrame(tick);
  })(t0);
})();

(function paintLoader() {
  const step = () => {
    shownP += (realP - shownP) * 0.11;
    if (realP >= 1 && shownP > 0.9995) shownP = 1;
    const pc = Math.floor(shownP * 100);
    ldPct.textContent = pc;
    ldFill.style.width = (shownP * 100).toFixed(2) + "%";
    if (!loader.classList.contains("gone")) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
})();

async function fetchAll(onBytes) {
  const list = MANIFEST;
  const total = MANIFEST_BYTES || list.reduce((a, e) => a + e[1], 0);
  let bytes = 0;
  const bump = n => { bytes += n; onBytes(clamp01(bytes / total)); };

  let cursor = 0;
  async function worker() {
    for (;;) {
      const i = cursor++;
      if (i >= list.length) return;
      const [url, size] = list[i];
      let got = 0;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status);
        if (res.body && res.body.getReader) {
          const reader = res.body.getReader();
          const chunks = [];
          for (;;) {
            const r = await reader.read();
            if (r.done) break;
            chunks.push(r.value);
            got += r.value.length;
            bump(r.value.length);
          }
          OBJ[url] = URL.createObjectURL(new Blob(chunks));
        } else {
          OBJ[url] = URL.createObjectURL(await res.blob());
          got = size; bump(size);
        }
      } catch (e) {
        OBJ[url] = url;                       /* let the browser do it */
      }
      if (got < size) bump(size - got);
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, list.length) }, worker));
}

async function decodeAll(onStep) {
  const imgs = $$("img[data-k]");
  let n = 0;
  await Promise.all(imgs.map(async img => {
    const src = OBJ[img.dataset.k] || img.dataset.k;
    img.src = src;
    try { await img.decode(); } catch (e) { /* ignore */ }
    onStep(++n / imgs.length);
  }));
  blots.forEach(b => {
    const u = "url(" + (OBJ[b.el.dataset.k] || b.el.dataset.k) + ")";
    b.el.style.webkitMaskImage = u;
    b.el.style.maskImage = u;
  });
  const ab = "url(" + (OBJ["assets/fx/splash-a.webp"] || "assets/fx/splash-a.webp") + ")";
  document.documentElement.style.setProperty("--ab-blot", ab);
}

const FACES = [
  '400 40px "Kaushan Script"', '300 40px "Cormorant Garamond"',
  '400 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"',
  'italic 300 40px "Cormorant Garamond"', 'italic 400 40px "Cormorant Garamond"',
  '300 16px "Manrope"', '500 16px "Manrope"',
];
async function loadFonts(onStep) {
  if (!document.fonts) return onStep(1);
  let n = 0;
  await Promise.all(FACES.map(async f => {
    try { await document.fonts.load(f, "Dana Habayeb 0123456789"); } catch (e) {}
    onStep(++n / FACES.length);
  }));
  try { await document.fonts.ready; } catch (e) {}
}

(async function boot() {
  const guard = setTimeout(() => { realP = 1; reveal(); }, 45000);
  try {
    await fetchAll(p => { realP = Math.max(realP, p * 0.86); });
    ldNote.textContent = "Preparing the hall";
    await decodeAll(p => { realP = Math.max(realP, 0.86 + p * 0.10); });
    ldNote.textContent = "Setting the type";
    await loadFonts(p => { realP = Math.max(realP, 0.96 + p * 0.04); });
  } catch (e) {
    console.warn("preload fell back", e);
  }
  clearTimeout(guard);
  realP = 1;
  reveal();
})();

function reveal() {
  if (loadDone) return;
  loadDone = true;
  const wait = () => {
    if (shownP < 0.999 || !typeDone) return requestAnimationFrame(wait);
    ldNote.textContent = "Ready";
    setTimeout(() => {
      loader.classList.add("out");
      document.body.classList.remove("pre");
      document.body.classList.add("loaded");
      introT0 = performance.now();
      score();
      setTimeout(() => loader.classList.add("gone"), 900);
    }, 340);
  };
  requestAnimationFrame(wait);
}

/* ══════════════════════════════════════════════════════════════════
   3 · LAYOUT  ·  the score, written in viewport heights
   ══════════════════════════════════════════════════════════════════ */
const journey = $("#journey");
const stage = $("#stage");
const act2 = $("#act2"), a2Plate = $("#a2Plate"), a2Word = $("#a2Word"),
      a2Meta = $("#a2Meta"), a2Scrim = $("#a2Scrim"),
      a2Num = $("#a2Num"), a2Title = $("#a2Title"), a2Line = $("#a2Line");
const veil = $("#veil"), redveil = $("#redveil");
const hall = $("#hall"), echo = $("#echo"), echoImg = echo.querySelector("img");
const hallCap = $("#hallCap"), hcNum = $("#hcNum"), hcTitle = $("#hcTitle"),
      hcLine = $("#hcLine"), hcMeta = $("#hcMeta"), hallLink = $("#hallLink"),
      hallHead = $(".hall-head"), dialP = $("#dialP");
const nav = $("#nav");
const about = $("#about");
const heroCentre = $(".hero-center"), heroCue = $(".hero-cue");
const ringWrap = $(".ring-wrap"), dialEl = $(".dial");
const a2Total = $("#a2Meta .a2-idx i"), hcTotal = $(".hc-idx i");
a2Total.textContent = "/ " + pad2(CHAPTERS.length);
hcTotal.textContent = "/ " + pad2(ART.length);

let vw = 0, vh = 0, vmax = 0, mobile = false;
let CARD_STEP, U0, CARDS_LEN, CIRCLE, PAINTP, IRIS, HALL_IN, HALL_STEP, HALL_LEN, HALL_OUT, RED;
let P = {};              /* phase boundaries, in vh units */
let TOTAL = 0;
let coverR = 0;          /* radius that just covers the viewport, px */
let JT = 0, JSPAN = 1, ABT = 0;
let RING_R = 0, PERSP = 1150, RING_STEP = 30, plateBase = 0;

function score() {
  vw = innerWidth; vh = innerHeight; vmax = Math.max(vw, vh);
  mobile = vw < 760;
  const k = REDUCED ? 0.45 : (mobile ? 0.74 : 1);

  CARD_STEP = 70 * k;
  U0 = CARD_STEP * 0.35;                              /* hero release → first card lands */
  CARDS_LEN = U0 + CARD_STEP * (chapters.length - 1 + 1.15);  /* lead in + last card holds */
  CIRCLE  = 92 * k;
  PAINTP  = 155 * k;
  IRIS    = 86 * k;
  HALL_IN = 46 * k;
  HALL_STEP = 40 * k;
  HALL_LEN = HALL_STEP * (ART.length - 1);
  HALL_OUT = 30 * k;
  RED     = 78 * k;

  let at = 0;
  const seg = (n, len) => { P[n] = { a: at, b: at + len, l: len }; at += len; };
  seg("cards", CARDS_LEN);
  seg("circle", CIRCLE);
  seg("paint", PAINTP);
  seg("iris", IRIS);
  seg("hallIn", HALL_IN);
  seg("hall", HALL_LEN);
  seg("hallOut", HALL_OUT);
  seg("red", RED);
  TOTAL = at;

  journey.style.height = (TOTAL / 100 * vh + vh) + "px";
  coverR = Math.hypot(vw, vh) / 2;
  JT = journey.offsetTop;
  JSPAN = Math.max(1, journey.offsetHeight - vh);
  ABT = about.offsetTop;

  /* the works sit on a carousel: the piece in focus is nearest the camera,
     its neighbours swing away to the sides and fall back into the dark */
  for (const c of scatterCards) {
    const [x, y, w] = mobile ? c.m : c.d;
    c.el.style.setProperty("--x", x + "%");
    c.el.style.setProperty("--y", y + "%");
    c.el.style.setProperty("--w", mobile ? "clamp(52px," + w + "vw,132px)"
                                         : "clamp(58px," + w + "vw,168px)");
    c.dx = (x - 50) / 50; c.dy = (y - 50) / 50;
  }

  PERSP = mobile ? 1150 : 1500;
  RING_R = mobile ? clamp(vw * 0.94, 330, 560) : clamp(vw * 0.92, 640, 1750);
  RING_STEP = mobile ? 38 : 34;
  plateBase = (mobile ? 0.40 : 0.43) * vh;
  ringWrap.style.perspective = PERSP + "px";

  plates.forEach(p => {
    const f = clamp(Math.pow(p.art.hcm / 150, 0.30), .72, 1);
    let h = plateBase * f;
    let w = h * p.ar;
    const maxW = (mobile ? 0.72 : 0.42) * vw;
    if (w > maxW) { w = maxW; h = w / p.ar; }
    p.w = w; p.h = h;
    p.el.style.width = w + "px";
    p.el.style.height = h + "px";
    p.el.style.marginLeft = (-w / 2) + "px";
    p.el.style.marginTop = (-h / 2) + "px";
    p.rh = h; p.rw = w;                       /* focus sits at z = 0 */
  });
}

/* ══════════════════════════════════════════════════════════════════
   4 · MOTION
   ══════════════════════════════════════════════════════════════════ */
/* lateral conveyor keyframes, keyed on q = cardIndex - progress
   q = 0   the card in focus — dead centre, upright, full light
   q < 0   queued — waiting fanned off to the lower-right, dimmed
   q > 0   passed — lifting up-left, counter-rotated, dimmed, softened
   (measured frame by frame from the reference recording)                */
const KQ = [-3, -2, -1, 0, 1, 2, 3];
const KX = [ 77,  54,  31, .2, -28, -52, -76];  /* vw   */
const KY = [ 21,  17,  13, .2, -14, -30, -46];  /* vh   */
const KR = [ 24,  18,  10,  0, -10, -16, -20];  /* deg  */
const KS = [ .84, .90, .96, 1, .95, .88, .82];  /* scale */
const KO = [  0,  .9, .97, 1,  1,  .5,   0];    /* opacity */
const KB = [ .22, .34, .50, 1, .55, .30, .16];  /* brightness */
const KBL = [  3,   2,   1,  0, 1.5,   3,   5]; /* blur px */
function kf(arr, q) {
  if (q <= KQ[0]) return arr[0];
  if (q >= KQ[KQ.length - 1]) return arr[arr.length - 1];
  let i = 0; while (q > KQ[i + 1]) i++;
  const t = (q - KQ[i]) / (KQ[i + 1] - KQ[i]);
  return lerp(arr[i], arr[i + 1], smoothstep(t));
}

let uTarget = 0, u = 0, vel = 0, sVel = 0;
let mx = 0, my = 0, cx = 0, cy = 0;
let introT0 = 0;
let a2Active = -1, hallActive = -1;
let navDark = null;

addEventListener("mousemove", e => {
  mx = e.clientX / innerWidth - .5;
  my = e.clientY / innerHeight - .5;
}, { passive: true });

function setU() {
  uTarget = clamp01((scrollY - JT) / JSPAN) * TOTAL;
}

function local(name) {
  const p = P[name];
  return clamp01((u - p.a) / p.l);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  setU();
  const f = REDUCED ? 1 : 1 - Math.exp(-dt * 8.5);
  const prev = u;
  u += (uTarget - u) * f;
  vel = (u - prev) / Math.max(dt, .001) / 100;          /* vh per second-ish */
  sVel += (vel - sVel) * (1 - Math.exp(-dt * 6));

  hero(dt);
  const cCircle = local("circle");
  const cPaint = local("paint");
  const cIris = local("iris");
  actTwo(cCircle);
  flyTraveler();
  circle(cCircle);
  paintPhase(cPaint, cIris);
  iris(cIris);
  hallPhase(cIris);
  red();
  chrome();

  requestAnimationFrame(frame);
}

/* ── ACT I ── */
function hero(dt) {
  const h = clamp01(scrollY / vh);
  const e = easeIn(h);
  cx += (mx - cx) * (REDUCED ? 1 : .06);
  cy += (my - cy) * (REDUCED ? 1 : .06);

  const centre = heroCentre;
  centre.style.transform = `translate3d(0,${(-h * 22 * vh / 100).toFixed(1)}px,0) scale(${(1 - h * .1).toFixed(4)})`;
  centre.style.opacity = (1 - clamp01(h * 1.5)).toFixed(3);

  const intro = introT0 ? clamp01((performance.now() - introT0) / 1700) : 0;
  const ie = easeOut(intro);

  /* idle float: each artwork drifts on its own gentle cycle, so the hero
     is alive without the mouse — the mouse parallax still layers on top */
  const tnow = performance.now() * .001;

  for (const c of scatterCards) {
    const d = c.depth;
    const px = cx * d, py = cy * d;
    const out = e * (0.9 + Math.abs(c.dx) * .5);
    const ox = c.dx * out * vw * .42;
    const oy = c.dy * out * vh * .40 - e * vh * .06;
    const z = e * 340 * (0.5 + (c.i % 3) * .3);
    const rise = (1 - ie) * (26 + (c.i % 4) * 8);
    const sc = lerp(.86, 1, ie);
    const fl = REDUCED ? 0 : 1;
    const fx = fl * Math.sin(tnow * .55 + c.i * 1.9) * (3.5 + (c.i % 3) * 1.4);
    const fy = fl * Math.cos(tnow * .42 + c.i * 2.3) * (4.5 + (c.i % 4) * 1.7);
    const fr = fl * Math.sin(tnow * .31 + c.i * 1.15) * 1.1;
    c.el.style.transform =
      `translate(-50%,-50%) translate3d(${(px + ox + fx).toFixed(1)}px,${(py + oy + rise + fy).toFixed(1)}px,${z.toFixed(0)}px)` +
      ` rotate(${(c.tilt * ie + c.rot * e + fr).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    c.el.style.opacity = (intro * (1 - clamp01((h - .55) / .4))).toFixed(3);
  }
  heroCue.style.opacity = (intro * (1 - clamp01(h * 4))).toFixed(2);
}

/* ── ACT II · the lateral conveyor ── */
function actTwo(cCircle) {
  const covered = cCircle >= 0.999;
  if (covered) {
    if (act2.style.visibility !== "hidden") act2.style.visibility = "hidden";
    hideTraveler();
    return;
  }
  if (act2.style.visibility === "hidden") act2.style.visibility = "";

  const n = chapters.length;
  const cp = clamp((u - U0) / CARD_STEP, 0, n - 1);          /* the last one holds */
  const hold = clamp01((u - U0 - CARD_STEP * (n - 1)) / CARD_STEP);
  const flying = travelT() < 1;                             /* hero release still in flight */
  /* closing beat: the last card rises to the top of the frame and the
     paintings behind it settle up-left and fall back into the dark —
     it stays there while the section hands over to the portal            */
  const liftLast = hold * 24.3;                              /* vh, last card */
  const liftPast = hold * 10.2;                              /* vh, passed cards */

  for (let i = 0; i < n; i++) {
    const el = cardEls[i];
    let q = cp - i;
    q -= sVel * .08;
    if (q < KQ[0] || q > KQ[KQ.length - 1]) {
      if (el.style.opacity !== "0") { el.style.opacity = "0"; el.style.visibility = "hidden"; }
      continue;
    }
    el.style.visibility = "";
    const x = kf(KX, q) * vw / 100;
    let y = kf(KY, q) * vh / 100;
    let op = kf(KO, q);
    let b = kf(KB, q), bl = kf(KBL, q);
    if (i === n - 1) {
      y -= liftLast * vh / 100;                             /* final rise */
      b += hold * .10;                                      /* stays in the light */
    } else if (q > 0 && op > 0) {
      y -= liftPast * vh / 100;                             /* lingers up-left */
      b -= hold * .28; bl += hold * 1.5;
    }
    const s = kf(KS, q);
    el.style.transform =
      `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)` +
      ` rotate(${kf(KR, q).toFixed(2)}deg) scale(${s.toFixed(3)})`;
    /* while the traveler still carries the first artwork, card 1 stays
       invisible but keeps its focus transform, so the handoff is exact */
    el.style.opacity = (flying && i === 0 ? 0 : op).toFixed(3);
    el.style.filter = `brightness(${b.toFixed(3)}) blur(${bl.toFixed(2)}px)`;
    el.style.zIndex = String(60 - Math.round(Math.abs(q) * 8));
  }

  /* the oversized title drifts against the card it belongs to */
  const idx = clamp(Math.round(cp), 0, n - 1);
  const frac = cp - idx;
  a2Word.style.transform =
    `translate(-50%,-50%) translate3d(${(-frac * vw * .30).toFixed(1)}px,${(frac * -3).toFixed(1)}px,0)`;
  a2Word.style.opacity =
    (0.12 * clamp01(1 - Math.abs(frac) * 1.7) + (idx === n - 1 ? hold * .16 : 0)).toFixed(3);

  if (idx !== a2Active) {
    a2Active = idx;
    const a = chapters[idx];
    a2Word.textContent = a.t;
    a2Num.textContent = pad2(idx + 1);
    a2Title.textContent = a.t;
    a2Line.textContent = a.cap;
    a2Meta.classList.remove("swap"); void a2Meta.offsetWidth; a2Meta.classList.add("swap");
  }
  /* the room falls into shadow as the portal comes forward */
  const r = easeIn(cCircle);
  a2Plate.style.transform = `scale(${(1 - r * .05).toFixed(4)})`;
  a2Meta.style.opacity = (1 - clamp01(cCircle * 2.6)).toFixed(3);
  a2Scrim.style.opacity = r.toFixed(3);
}

/* ── the first artwork leaves the hero and lands on the conveyor ── */
function travelT() {
  /* the first print leaves its low hero slot with the very first touch of
     scroll and lands on the conveyor just as the second section arrives,
     so it is in motion (and clearly visible) from the tiniest scroll */
  const S0 = Math.min(0, JT - vh);                 /* top of the page → t = 0 */
  const S1 = JT + (U0 / 100) * vh;
  return clamp01((scrollY - S0) / Math.max(1, S1 - S0));
}
function flyTraveler() {
  const t = travelT();
  if (t <= 0 || t >= 1) { hideTraveler(t <= 0); return; }
  if (travSlot) travSlot.el.style.opacity = "0";   /* it left the collage */

  /* soft ease-out: springs into motion on the smallest scroll, glides
     down the frame and settles onto the conveyor without a jump */
  const e = 1 - (1 - t) * (1 - t);
  const r1 = travSlot ? travSlot.el.getBoundingClientRect()
                      : { left: vw / 2, top: vh * .2, width: 140, height: 180 };
  /* land on card 1's live rect — wherever the conveyor puts it, the
     handoff is exact (at u = U0 the card sits at focus, opacity 1) */
  const r2 = cardEls[0].getBoundingClientRect();
  const left = lerp(r1.left, r2.left, e);
  const top  = lerp(r1.top,  r2.top, e);
  const w    = lerp(r1.width, r2.width, e);
  const h    = lerp(r1.height, r2.height, e);
  const rot  = lerp(travSlot ? travSlot.tilt : 0, 0, e);
  traveler.style.visibility = "visible";
  traveler.style.opacity = "1";
  traveler.style.width = w.toFixed(1) + "px";
  traveler.style.height = h.toFixed(1) + "px";
  traveler.style.transform =
    `translate(${left.toFixed(1)}px,${top.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
}
function hideTraveler(backHome) {
  if (!travOn && traveler.style.visibility === "hidden") return;
  travOn = false;
  traveler.style.visibility = "hidden";
  traveler.style.opacity = "0";
  if (backHome && travSlot) travSlot.el.style.opacity = "";
}

/* ── the beige circle ── */
function circle(c) {
  const r = easeInOut(c) * coverR * 1.02;
  veil.style.clipPath = `circle(${r.toFixed(1)}px at 50% 50%)`;
}

/* ── the paint ── */
function paintPhase(pp, ir) {
  const away = easeIn(ir);
  for (const b of blots) {
    const s = clamp01((pp - b.s.o) / 0.30);
    if (s <= 0 && away <= 0) {
      if (b.el.style.opacity !== "0") b.el.style.opacity = "0";
      continue;
    }
    const e = easeOut(s);
    const spread = e * 138;
    b.el.style.clipPath = `circle(${spread.toFixed(1)}% at ${b.s.ox}% ${b.s.oy}%)`;
    const tx = b.tx * (1 - e) + b.tx * away * 2.4;
    const ty = b.ty * (1 - e) + b.ty * away * 2.4;
    const sc = lerp(.9, 1, e) * (1 + away * .12);
    b.el.style.transform =
      `translate3d(${tx.toFixed(2)}vw,${ty.toFixed(2)}vh,0) rotate(${b.s.r}deg) scale(${sc.toFixed(3)})`;
    b.el.style.opacity = (clamp01(s * 8) * (1 - clamp01(away * 1.35))).toFixed(3);
  }
}

/* ── the iris: the beige peels open onto the hall ── */
let irisOn = false;
function iris(ir) {
  if (ir <= 0) {
    if (irisOn) {
      irisOn = false;
      veil.style.webkitMaskImage = "none"; veil.style.maskImage = "none";
      hall.style.opacity = "0";
    }
    return;
  }
  irisOn = true;
  const r = easeInOut(ir) * coverR * 1.06;
  const g = `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) ${r.toFixed(1)}px, rgba(0,0,0,1) ${(r + 1.5).toFixed(1)}px)`;
  veil.style.webkitMaskImage = g; veil.style.maskImage = g;
  hall.style.opacity = "1";
}

/* ── ACT III · the circular hall ── */
function hallPhase(ir) {
  const inn = local("hallIn");
  const hp = local("hall");
  const out = local("hallOut");
  const live = ir > 0.02;
  if (!live) {
    if (ring.dataset.on === "1") { ring.dataset.on = "0"; hall.style.pointerEvents = "none"; }
    return;
  }
  ring.dataset.on = "1";
  hall.style.pointerEvents = out > .9 ? "none" : "auto";

  const entry = ir * inn;                      /* the room arrives with the iris */
  const push = (1 - easeOut(clamp01(ir * 1.1))) * 620 + (1 - easeOut(inn)) * 380 + easeIn(out) * 640;
  const gp = hp * (ART.length - 1);

  ring.style.transform =
    `translateZ(${(-push).toFixed(0)}px) rotateY(${(-sVel * 1.4).toFixed(2)}deg) rotateX(${(sVel * .35).toFixed(2)}deg)`;

  for (let i = 0; i < plates.length; i++) {
    const p = plates[i];
    const th = (i - gp) * RING_STEP;
    const a = Math.abs(th) / RING_STEP;
    if (a > 2.35) {
      if (p.el.style.opacity !== "0") { p.el.style.opacity = "0"; p.el.style.visibility = "hidden"; }
      continue;
    }
    p.el.style.visibility = "";
    p.el.style.transform =
      `translateZ(${(-RING_R).toFixed(0)}px) rotateY(${th.toFixed(2)}deg) translateZ(${RING_R.toFixed(0)}px)`;
    p.el.style.opacity = (clamp01((2.35 - a) / .85) * (1 - easeIn(out) * .9)).toFixed(3);
    p.dim.style.opacity = clamp(a * .34, 0, .76).toFixed(3);
    p.el.style.zIndex = String(40 - Math.round(a * 10));
  }

  /* the reflection under the piece in focus */
  const idx = clamp(Math.round(gp), 0, ART.length - 1);
  const frac = gp - idx;
  const fp = plates[idx];
  echo.style.width = fp.rw + "px";
  echo.style.height = (fp.rh * .34) + "px";
  echo.style.top = (0.42 * vh + fp.rh / 2 + 8) + "px";
  echo.style.opacity = (0.30 * clamp01(1 - Math.abs(frac) * 2.1) * easeOut(inn) * (1 - out)).toFixed(3);

  if (idx !== hallActive) {
    hallActive = idx;
    const a = ART[idx];
    if (echoImg.dataset.cur !== a.id) {
      echoImg.dataset.cur = a.id;
      echoImg.src = OBJ[artKey(a)] || artKey(a);
    }
    hcNum.textContent = pad2(idx + 1);
    hcTitle.textContent = a.t;
    hcLine.textContent = a.cap;
    hcMeta.textContent = `Acrylic on canvas · ${a.dim} · AED ${a.p.toLocaleString()} · ${a.sold ? "Collected" : "Available"}`;
    hallLink.href = SITE + a.u;
    hallCap.classList.remove("swap"); void hallCap.offsetWidth; hallCap.classList.add("swap");
  }

  const ui = easeOut(inn) * (1 - easeIn(out));
  hallCap.style.opacity = ui.toFixed(3);
  hallHead.style.opacity = ui.toFixed(3);
  hallLink.style.opacity = ui.toFixed(3);
  hallCap.style.transform = `translateX(-50%) translateY(${((1 - ui) * 26).toFixed(1)}px)`;
  dialP.style.strokeDashoffset = (339.29 * (1 - hp)).toFixed(1);
  dialEl.style.opacity = ui.toFixed(3);
}

/* ── the red takes over ── */
function red() {
  const r = local("red");
  redveil.style.clipPath = `circle(${(easeInOut(clamp01(r / .92)) * coverR * 1.03).toFixed(1)}px at 50% 50%)`;
}

/* ── chrome: nav colour, year ── */
function chrome() {
  nav.classList.toggle("tight", scrollY > 60);
  const inHall = u > P.iris.a + P.iris.l * .35 && u < P.red.a + P.red.l * .25;
  const inAbout = scrollY + 70 > ABT;
  const dark = inHall || inAbout;
  if (dark !== navDark) { navDark = dark; nav.classList.toggle("on-dark", dark); }
}

/* ══════════════════════════════════════════════════════════════════
   5 · CHROME + WIRING
   ══════════════════════════════════════════════════════════════════ */
$("#yr").textContent = new Date().getFullYear();

$$("[data-jump]").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  const to = a.dataset.jump;
  let y = 0;
  if (to === "top") y = 0;
  else if (to === "stories") y = JT + 6;
  else if (to === "gallery") y = JT + (P.hallIn.a + P.hallIn.l * .6) / TOTAL * JSPAN;
  else if (to === "about") y = ABT;
  scrollTo({ top: y, behavior: "smooth" });
}));

/* clicking the piece in focus opens it on danahabayeb.art */
ringWrap.addEventListener("click", () => {
  if (hallActive >= 0 && u > P.hallIn.a && u < P.hallOut.b) window.open(SITE + ART[hallActive].u, "_blank", "noopener");
});

let rt;
addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(score, 140); }, { passive: true });
addEventListener("orientationchange", () => setTimeout(score, 260));

score();
u = uTarget = 0;
requestAnimationFrame(frame);

/* small hook used by the QA harness to jump to a named beat */
window.__seek = (name, t = .5) => {
  const p = P[name];
  if (!p) return null;
  const y = JT + ((p.a + p.l * t) / TOTAL) * JSPAN;
  scrollTo(0, y);
  return y;
};
window.__beats = () => ({ P, TOTAL, JT, JSPAN });
window.__settled = () => Math.abs(uTarget - u) < 0.01;
window.__snap = () => { setU(); u = uTarget; sVel = vel = 0; };
