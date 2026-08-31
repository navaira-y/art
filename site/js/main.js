/* Dana Habayeb — main.js : loader video, scattered hero, traveling artwork, pinned story cards */
"use strict";
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const byTitle = t => ART.find(a => a.t === t);

/* ---------- realistic brush loader, choreographed after the reference clip ----------
   descend -> write "Art by" -> carry -> write "Dana Habayeb" -> lift.
   The curtain only lifts once the writing is done AND the hero images are decoded,
   so the hero never pops in after the loader. */
let heroImgsReady = false;
(function () {
  const loader = $("#loader");
  if (!loader) return;
  const brush = $("#ldBrush"), shadow = $("#ldShadow"), t1 = $("#ldT1"), t2 = $("#ldT2");
  const stage = $(".ld-stage");
  let finished = false;
  const finish = () => {
    if (finished) return; finished = true;
    loader.classList.add("done");
    document.body.classList.add("loaded");
  };
  setTimeout(finish, 14000);

  const imgs = $$("#scatter img");
  if (imgs.length) {
    Promise.allSettled(imgs.map(im => im.decode ? im.decode() : Promise.resolve()))
      .then(() => { heroImgsReady = true; });
  } else heroImgsReady = true;
  setTimeout(() => { heroImgsReady = true; }, 6000);

  let start = null;
  function tick(ts) {
    if (finished) return;
    if (start === null) start = ts;
    const t = (ts - start) / 1000;
    const S = stage.offsetWidth;
    const w1 = t1.offsetWidth, w2 = t2.offsetWidth;
    const a1 = (S - w1) / 2, a2 = (S - w2) / 2;
    const y1 = t1.offsetTop + t1.offsetHeight * 0.92;
    const y2 = t2.offsetTop + t2.offsetHeight * 0.92;
    /* default = lifted-away end state (held while we wait for hero images) */
    let bx = a2 + w2 + 12, by = y2 - 150, c1 = 1, c2 = 1, shO = 0, rot = 7, op = 0;
    if (t < 0.5) {                 /* descend */
      const q = ease(t / 0.5);
      bx = a1; by = y1 - 150 * (1 - q); shO = .32 * q; op = q;
    } else if (t < 1.7) {          /* write "Art by" */
      const q = (t - 0.5) / 1.2;
      c1 = q; bx = a1 + q * w1; by = y1 + Math.sin(q * 42) * 1.6; shO = .32;
    } else if (t < 2.1) {          /* carry to the name */
      const q = ease((t - 1.7) / 0.4);
      c1 = 1; bx = lerp(a1 + w1, a2, q); by = lerp(y1, y2, q) - Math.sin(q * Math.PI) * 34;
      shO = .32 - .2 * Math.sin(q * Math.PI);
    } else if (t < 4.0) {          /* write "Dana Habayeb" */
      const q = (t - 2.1) / 1.9;
      c2 = q; bx = a2 + q * w2; by = y2 + Math.sin(q * 56) * 1.8; shO = .32;
    } else if (t < 4.6) {          /* lift away */
      const q = ease((t - 4.0) / 0.6);
      c2 = 1; bx = a2 + w2 + 12 * q; by = y2 - 150 * q; shO = .32 * (1 - q); op = 1 - q;
    } else if (heroImgsReady) { finish(); return; }
    t1.style.clipPath = `inset(-30% ${(100 - c1 * 100).toFixed(1)}% -30% -5%)`;
    t2.style.clipPath = `inset(-30% ${(100 - c2 * 100).toFixed(1)}% -30% -5%)`;
    brush.style.opacity = op.toFixed(2);
    brush.style.transform = `translate(${(bx - 32).toFixed(1)}px, ${(by - 200).toFixed(1)}px) rotate(${rot}deg)`;
    shadow.style.opacity = shO.toFixed(2);
    shadow.style.transform = `translate(${(bx - 37).toFixed(1)}px, ${(by - 6).toFixed(1)}px)`;
    requestAnimationFrame(tick);
  }
  const boot = () => requestAnimationFrame(tick);
  (document.fonts && document.fonts.ready) ? document.fonts.ready.then(boot) : boot();
})();

/* ---------- nav / year ---------- */
const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 40), { passive: true });
$("#yr").textContent = new Date().getFullYear();

/* ---------- scattered-art hero (layout traced from the reference recording) ---------- */
const TRAV = byTitle("Pali Pika");
const SLOTS = [
  [1, 16, 64], [29, 8, 100], [70, 10, 104, "cap"], [94, 15, 110],
  [17.5, 26, 112],                       /* <- traveling artwork lives here in the hero */
  [37, 36, 88], [60, 31, 94], [81, 35, 88],
  [98, 48, 56], [3, 44, 26], [13, 68, 88], [0.5, 74, 40],
  [6, 96, 88], [50, 96, 88], [89, 91, 108, "cap"],
];
const scatter = $("#scatter");
let heroSlot = null;
(function buildScatter() {
  if (!scatter) return;
  const pool = ART.filter(a => a !== TRAV);
  let pi = 0;
  SLOTS.forEach((p, i) => {
    const isTrav = i === 4;
    const a = isTrav ? TRAV : pool[pi++ % pool.length];
    const f = document.createElement("figure");
    f.className = isTrav ? "slot" : "";
    f.style.setProperty("--x", p[0] + "%");
    f.style.setProperty("--y", p[1] + "%");
    f.style.setProperty("--w", p[2] + "px");
    f.style.setProperty("--d", (-i * 0.7) + "s");
    f.style.setProperty("--fd", (0.15 + i * 0.06) + "s");
    f.dataset.depth = 14 + (i % 4) * 6;
    f.innerHTML = `<img src="../${a.f}" alt="">` + (p[3] && !isTrav ? `<figcaption>— ${a.t}</figcaption>` : "");
    scatter.appendChild(f);
    if (isTrav) heroSlot = f;
  });
})();

/* ---------- second section: pinned, scroll-driven story cards ---------- */
const STORIES = [
  { a: TRAV, r: -6 },
  { a: byTitle("Van Gogh Pikachu"), r: 5 },
  { a: byTitle("There is Always Hope"), r: -4 },
  { a: byTitle("The Source"), r: 6 },
  { a: byTitle("Sheikh Pika"), r: -7 },
];
const STORY_COPY = {
  "Pali Pika": "Pikachu rests under olive trees — a pop icon sitting quietly inside a homeland memory. Painted in dusty greens and mauve for everyone who carries a land they have never stopped missing.",
  "Van Gogh Pikachu": "Her favourite hero, let loose inside a swirling Van Gogh sky. Thick acrylic, moving light — the night she paints is one you have felt before.",
  "There is Always Hope": "A balloon, a child, a promise that refuses to pop. The piece collectors ask about first — and the one that started every conversation her work still has.",
  "The Source": "Where everything comes from and where it goes back to. Layer on layer of camel and wine, painted until the canvas holds its own gravity.",
  "Sheikh Pika": "Pika visits Dubai — keffiyeh, skyline and all. A love letter to the city she grows up in, painted with a straight face and a wink.",
};
const storiesSec = $("#stories");
const stack = $("#storyStack");
const ghost = $("#ghostText");
const infoBox = $(".story-info");
const sTitle = $("#storyTitle");
const sBody = $("#storyBody");
let storySlot = null, travel = 0, activeStory = -1;
(function buildStories() {
  if (!stack) return;
  STORIES.forEach((s, i) => {
    if (i === 0) {
      storySlot = document.createElement("div");
      storySlot.className = "story-slot";
      stack.appendChild(storySlot);
      return;
    }
    const c = document.createElement("figure");
    c.className = "story-card";
    c.style.setProperty("--r", s.r + "deg");
    c.innerHTML = `<img src="../${s.a.f}" alt="${s.a.t}"><b>${s.a.t}</b>`;
    stack.appendChild(c);
  });
  sTitle.textContent = STORIES[0].a.t;
  sBody.textContent = STORY_COPY[STORIES[0].a.t];
})();

/* ---------- collection grid + hall + lightbox ---------- */
const grid = $("#grid");
ART.forEach(a => {
  const card = document.createElement("article");
  card.className = "card" + (a === TRAV ? " t-slot" : "");
  card.innerHTML = `
    <div class="ph">
      <img src="../${a.f}" alt="${a.t}" loading="lazy">
      <span class="badge ${a.s ? "" : "avail"}">${a.s ? "Collected" : "Available"}</span>
      <span class="zoom-hint">Zoom in</span>
    </div>
    <h3>${a.t}</h3>
    <div class="meta"><span>AED ${a.p.toLocaleString()}</span><span class="${a.s ? "no" : ""}">${a.s ? "Sold" : "Original"}</span></div>`;
  card.addEventListener("click", () => openLB(a));
  grid.appendChild(card);
});
const travCard = $(".card.t-slot");
const travPh = travCard ? travCard.querySelector(".ph") : null;

const hallTrack = $("#hallTrack");
HALL.forEach(h => {
  const f = document.createElement("figure");
  f.className = "hall-item";
  f.innerHTML = `<img src="../${h.f}" alt="${h.c}" loading="lazy"><figcaption>${h.c}</figcaption>`;
  hallTrack.appendChild(f);
});

const lb = $("#lightbox");
function openLB(a) {
  $("#lbImg").src = "../" + a.f;
  $("#lbTitle").textContent = a.t;
  $("#lbMeta").textContent = `Acrylic on canvas · AED ${a.p.toLocaleString()} · ${a.s ? "Collected" : "Available"}`;
  $("#lbLink").href = SITE + a.u;
  lb.hidden = false;
  requestAnimationFrame(() => lb.classList.add("open"));
}
function closeLB() {
  lb.classList.remove("open");
  setTimeout(() => { lb.hidden = true; }, 350);
}
$(".lb-close").addEventListener("click", closeLB);
lb.addEventListener("click", e => { if (e.target === lb) closeLB(); });
addEventListener("keydown", e => { if (e.key === "Escape") closeLB(); });

/* ---------- reveals ---------- */
const io = new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
}), { threshold: 0.18 });
$$(".reveal, .hall-item").forEach(el => io.observe(el));

/* ---------- master motion loop: parallax, stories pin, traveling artwork, cursor ---------- */
const traveler = $("#traveler");
let travRot = 0, travScale = 1;
const cards = scatter ? [...scatter.children] : [];
let mx = 0, my = 0, cx = 0, cy = 0;
addEventListener("mousemove", e => {
  mx = e.clientX / innerWidth - 0.5;
  my = e.clientY / innerHeight - 0.5;
}, { passive: true });
const cur = $("#cursor");
let tx = innerWidth / 2, ty = innerHeight / 2, rxv = tx, ryv = ty;
addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });

function measure() {
  travel = Math.max(0, stack.scrollWidth - innerWidth * 0.94);
}
addEventListener("resize", measure);
addEventListener("load", measure);
measure();

(function frame() {
  const vh = innerHeight;

  /* hero parallax */
  cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
  cards.forEach(c => {
    const d = +c.dataset.depth || 16;
    c.style.setProperty("--px", (cx * d) + "px");
    c.style.setProperty("--py", (cy * d) + "px");
  });

  /* stories pin */
  if (storiesSec && stack) {
    const r = storiesSec.getBoundingClientRect();
    const p = clamp01(-r.top / (storiesSec.offsetHeight - vh));
    stack.style.transform = `translateY(-50%) translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
    ghost.style.opacity = clamp01((p - 0.12) * 2.4).toFixed(2);
    const focus = innerWidth * 0.32;
    let best = 0, bd = 1e9;
    [...stack.children].forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - p * travel + c.offsetWidth / 2 - focus);
      if (d < bd) { bd = d; best = i; }
    });
    if (best !== activeStory) {
      activeStory = best;
      [...stack.children].forEach((c, i) => c.classList.toggle("active", i === best));
      const t = STORIES[best].a.t;
      sTitle.textContent = t;
      sBody.textContent = STORY_COPY[t];
      infoBox.classList.remove("swap");
      void infoBox.offsetWidth;
      infoBox.classList.add("swap");
    }
  }

  /* traveling artwork: hero slot -> story slot -> its tile in the collection */
  if (traveler && heroSlot && storySlot && travPh) {
    const r1 = heroSlot.getBoundingClientRect();
    const r2 = storySlot.getBoundingClientRect();
    const r3 = travPh.getBoundingClientRect();
    const p12 = ease(clamp01((vh - r2.top) / (vh * 0.6)));
    const p23 = ease(clamp01((vh * 1.05 - r3.top) / (vh * 0.75)));
    travRot += ((activeStory === 0 ? 0 : STORIES[0].r) - travRot) * 0.1;
    travScale += ((activeStory === 0 ? 1 : 0.9) - travScale) * 0.1;
    const x = lerp(lerp(r1.left, r2.left, p12), r3.left, p23);
    const y = lerp(lerp(r1.top, r2.top, p12), r3.top, p23);
    const w = lerp(lerp(r1.width, r2.width * travScale, p12), r3.width, p23);
    const h = lerp(lerp(r1.height, r2.height * travScale, p12), r3.height, p23);
    const rot = lerp(lerp(0, travRot, p12), 0, p23);
    const landed = p23 > 0.995;
    traveler.style.visibility = landed ? "hidden" : "visible";
    traveler.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
    traveler.style.width = w.toFixed(1) + "px";
    traveler.style.height = h.toFixed(1) + "px";
    travCard.classList.toggle("landed", landed);
  }

  /* cursor */
  rxv += (tx - rxv) * 0.18; ryv += (ty - ryv) * 0.18;
  if (cur) cur.style.transform = `translate(${rxv - 21}px, ${ryv - 21}px)`;

  requestAnimationFrame(frame);
})();
