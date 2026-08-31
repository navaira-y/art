/* Dana Habayeb — main.js : loader video, scattered hero, traveling artwork, pinned story cards */
"use strict";
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const byTitle = t => ART.find(a => a.t === t);

/* ---------- realistic brush loader (trimmed painted clip) ---------- */
(function () {
  const loader = $("#loader"), vid = $("#loaderVid");
  if (!loader || !vid) return;
  let finished = false;
  const finish = () => {
    if (finished) return; finished = true;
    loader.classList.add("done");
    document.body.classList.add("loaded");
  };
  vid.addEventListener("ended", finish);
  vid.addEventListener("error", finish);
  try { const pr = vid.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {}
  setTimeout(finish, 12000);
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
    const focus = innerWidth * 0.45;
    let best = 0, bd = 1e9;
    [...stack.children].forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - p * travel + c.offsetWidth / 2 - focus);
      if (d < bd) { bd = d; best = i; }
    });
    if (best !== activeStory) {
      activeStory = best;
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
    const x = lerp(lerp(r1.left, r2.left, p12), r3.left, p23);
    const y = lerp(lerp(r1.top, r2.top, p12), r3.top, p23);
    const w = lerp(lerp(r1.width, r2.width, p12), r3.width, p23);
    const h = lerp(lerp(r1.height, r2.height, p12), r3.height, p23);
    const rot = lerp(lerp(0, -6, p12), 0, p23);
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
