/* Dana Habayeb — main.js : typewriter loader, scattered hero, one-by-one story cards, traveling artwork */
"use strict";
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const byTitle = t => ART.find(a => a.t === t);

/* ---------- typewriter loader: "Art by" / "Dana Habayeb", hero images decode meanwhile ---------- */
let heroImgsReady = false;
(function () {
  const loader = $("#loader");
  if (!loader) return;
  const s1 = $("#typeL1"), s2 = $("#typeL2"), c1 = $("#caret1"), c2 = $("#caret2");
  const T1 = "Art by", T2 = "Dana Habayeb";
  let finished = false;
  const finish = () => {
    if (finished) return; finished = true;
    loader.classList.add("done");
    document.body.classList.add("loaded");
  };
  setTimeout(finish, 12000);

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
    const n1 = Math.max(0, Math.min(T1.length, Math.floor((t - 0.35) / 0.09)));
    const n2 = Math.max(0, Math.min(T2.length, Math.floor((t - 1.25) / 0.1)));
    s1.textContent = T1.slice(0, n1);
    s2.textContent = T2.slice(0, n2);
    c1.classList.toggle("off", n2 > 0);
    c2.classList.toggle("off", t < 1.15);
    if (n2 === T2.length && t > 1.25 + T2.length * 0.1 + 0.55 && heroImgsReady) { finish(); return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
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

/* ---------- second section: pinned, one-by-one cards (traced frame-by-frame) ---------- */
const STORIES = [
  { a: TRAV },
  { a: byTitle("Van Gogh Pikachu") },
  { a: byTitle("There is Always Hope") },
  { a: byTitle("The Source") },
  { a: byTitle("Sheikh Pika") },
];
const STORY_COPY = {
  "Pali Pika": "Pikachu rests under olive trees — a pop icon sitting quietly inside a homeland memory. Painted in dusty greens and mauve for everyone who carries a land they have never stopped missing.",
  "Van Gogh Pikachu": "Her favourite hero, let loose inside a swirling Van Gogh sky. Thick acrylic, moving light — the night she paints is one you have felt before.",
  "There is Always Hope": "A balloon, a child, a promise that refuses to pop. The piece collectors ask about first — and the one that started every conversation her work still has.",
  "The Source": "Where everything comes from and where it goes back to. Layer on layer of camel and wine, painted until the canvas holds its own gravity.",
  "Sheikh Pika": "Pika visits Dubai — keffiyeh, skyline and all. A love letter to the city she grows up in, painted with a straight face and a wink.",
};
/* choreography knots, keyed by d = cardIndex - progress (one card per scroll step):
   active upright at focus; next waiting tilted right; previous exiting up-left dimmed */
const K_X = [-26, -22, 0, 21, 40, 58];      /* vw */
const K_Y = [-16, -12, 0, 3, 5, 6];         /* vh */
const K_R = [-14, -12, 0, 10, 12, 13];      /* deg */
const K_S = [0.84, 0.9, 1, 0.94, 0.9, 0.88];
const K_B = [0.25, 0.4, 1, 0.55, 0.4, 0.3];
function knot(arr, d) {
  const x = Math.max(0, Math.min(arr.length - 1.001, d + 2));
  const i = Math.floor(x), f = x - i;
  return arr[i] + (arr[i + 1] - arr[i]) * f;
}
const storiesSec = $("#stories");
const stack = $("#storyStack");
const infoBox = $(".story-info");
const sTitle = $("#storyTitle");
const sBody = $("#storyBody");
let storySlot = null, activeStory = -1;
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

/* ---------- master motion loop ---------- */
const traveler = $("#traveler");
const cards = scatter ? [...scatter.children] : [];
let mx = 0, my = 0, cx = 0, cy = 0;
addEventListener("mousemove", e => {
  mx = e.clientX / innerWidth - 0.5;
  my = e.clientY / innerHeight - 0.5;
}, { passive: true });

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BG_A = hex("#0c0a09"), BG_B = hex("#6D88A4");

(function frame() {
  const vh = innerHeight, vw = innerWidth;

  /* hero parallax */
  cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
  cards.forEach(c => {
    const d = +c.dataset.depth || 16;
    c.style.setProperty("--px", (cx * d) + "px");
    c.style.setProperty("--py", (cy * d) + "px");
  });

  /* stories: one card per scroll step, background fades to #6D88A4 once placed */
  let pRaw = 0, stickyTop = 0;
  if (storiesSec && stack) {
    const r = storiesSec.getBoundingClientRect();
    const H = storiesSec.offsetHeight;
    pRaw = clamp01(-r.top / (H - vh)) * (STORIES.length - 1);
    stickyTop = Math.min(Math.max(0, r.top), r.top + H - vh);
    const mix = ease(clamp01((pRaw - 0.12) / 0.4));
    storiesSec.style.backgroundColor = `rgb(${BG_A.map((v, i) => Math.round(lerp(v, BG_B[i], mix))).join(",")})`;
    const kids = [...stack.children];
    kids.forEach((el, i) => {
      const d = i - pRaw;
      const x = knot(K_X, d) * vw / 100;
      const y = knot(K_Y, d) * vh / 100;
      el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${knot(K_R, d).toFixed(2)}deg) scale(${knot(K_S, d).toFixed(3)})`;
      el.style.filter = `brightness(${knot(K_B, d).toFixed(2)})`;
      el.style.zIndex = d < -0.5 ? 2 : (d < 0.5 ? 6 : 5 - Math.min(3, Math.floor(d)));
    });
    const idx = Math.round(pRaw);
    if (idx !== activeStory) {
      activeStory = idx;
      const t = STORIES[idx].a.t;
      sTitle.textContent = t;
      sBody.textContent = STORY_COPY[t];
      infoBox.classList.remove("swap");
      void infoBox.offsetWidth;
      infoBox.classList.add("swap");
    }
  }

  /* traveling artwork: hero slot -> first story card -> its tile in the collection */
  if (traveler && heroSlot && storySlot && travPh) {
    const r1 = heroSlot.getBoundingClientRect();
    const r3 = travPh.getBoundingClientRect();
    /* analytic rect of the (transformed) story slot */
    const sw = storySlot.offsetWidth, sh = storySlot.offsetHeight;
    const d0 = -pRaw;
    const scx = storySlot.offsetLeft + knot(K_X, d0) * vw / 100;
    const scy = stickyTop + storySlot.offsetTop + knot(K_Y, d0) * vh / 100;
    const sw2 = sw * knot(K_S, d0), sh2 = sh * knot(K_S, d0);
    const r2 = { left: scx - sw2 / 2, top: scy - sh2 / 2, width: sw2, height: sh2 };
    const p12 = ease(clamp01((vh - r2.top) / (vh * 0.6)));
    const p23 = ease(clamp01((vh * 1.05 - r3.top) / (vh * 0.75)));
    const x = lerp(lerp(r1.left, r2.left, p12), r3.left, p23);
    const y = lerp(lerp(r1.top, r2.top, p12), r3.top, p23);
    const w = lerp(lerp(r1.width, r2.width, p12), r3.width, p23);
    const h = lerp(lerp(r1.height, r2.height, p12), r3.height, p23);
    const rot = lerp(lerp(0, knot(K_R, d0), p12), 0, p23);
    const br = lerp(lerp(1, knot(K_B, d0), p12), 1, p23);
    const landed = p23 > 0.995;
    traveler.style.visibility = landed ? "hidden" : "visible";
    traveler.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
    traveler.style.width = w.toFixed(1) + "px";
    traveler.style.height = h.toFixed(1) + "px";
    traveler.style.filter = `brightness(${br.toFixed(2)})`;
    travCard.classList.toggle("landed", landed);
  }

  requestAnimationFrame(frame);
})();
