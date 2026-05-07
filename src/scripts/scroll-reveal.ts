import Lenis from "lenis";

// ── Smooth scroll (Lenis) ───────────────────────────────────────────────────
// Replaces the browser's native scroll with rAF-driven momentum scrolling.
// This is what makes premium portfolio sites (vasudev.live, awwwards
// winners, etc.) feel so much "softer" than typical sites. ~7KB gzipped.
//
// Disabled when prefers-reduced-motion: reduce so motion-sensitive users
// keep native scrolling behavior. Also exposed on globalThis so other
// modules (e.g. anchor-link smooth-scroll below) can request scrollTo.
declare global {
  // eslint-disable-next-line no-var
  var __lenis: Lenis | undefined;
}
const reducedMotion = globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reducedMotion) {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });
  globalThis.__lenis = lenis;
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  document.documentElement.classList.add("has-lenis");
}

// ── Scroll reveal ───────────────────────────────────────────────────────────
const targets = document.querySelectorAll<HTMLElement>(".reveal");
if (targets.length > 0 && "IntersectionObserver" in globalThis) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
  );
  for (const el of targets) io.observe(el);
} else {
  for (const el of targets) el.classList.add("is-visible");
}

// ── Hero terminal-typing ────────────────────────────────────────────────────
const typed = document.querySelector<HTMLElement>("[data-typed]");
if (typed) {
  const linesAttr = typed.dataset.typed;
  const lines = (linesAttr ?? "").split("|");
  if (reducedMotion) {
    typed.textContent = lines.join("\n");
  } else {
    typed.textContent = "";
    let li = 0;
    let ci = 0;
    const tick = () => {
      if (li >= lines.length) return;
      const line = lines[li];
      if (ci < line.length) {
        typed.textContent += line[ci];
        ci++;
        setTimeout(tick, 22 + Math.random() * 14);
      } else {
        typed.textContent += "\n";
        li++;
        ci = 0;
        setTimeout(tick, 240);
      }
    };
    tick();
  }
}

// ── Mouse spotlight ────────────────────────────────────────────────────────
const spotlights = document.querySelectorAll<HTMLElement>("[data-spotlight]");
if (!reducedMotion) {
  for (const el of spotlights) {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${mx}%`);
      el.style.setProperty("--my", `${my}%`);
    });
  }
}

// ── 3D card tilt ───────────────────────────────────────────────────────────
const tilts = document.querySelectorAll<HTMLElement>("[data-tilt]");
if (!reducedMotion) {
  const MAX = 4;
  for (const el of tilts) {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--ty", `${cx * MAX}deg`);
      el.style.setProperty("--tx", `${-cy * MAX}deg`);
    });
    el.addEventListener("mouseleave", () => {
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    });
  }
}

// ── Animated count-up ──────────────────────────────────────────────────────
const counters = document.querySelectorAll<HTMLElement>("[data-count-to]");
if (counters.length > 0 && "IntersectionObserver" in globalThis) {
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const startCount = (el: HTMLElement) => {
    const target = Number.parseInt(el.dataset.countTo || "0", 10);
    const duration = Number.parseInt(el.dataset.countDuration || "1400", 10);
    if (reducedMotion) { el.textContent = String(target); return; }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = Math.round(easeOutCubic(t) * target);
      el.textContent = String(v);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          startCount(e.target as HTMLElement);
          cio.unobserve(e.target);
        }
      }
    },
    { threshold: 0.4 },
  );
  for (const el of counters) cio.observe(el);
}

// ── Anchor-link smooth-scroll (Lenis-aware) ────────────────────────────────
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest<HTMLAnchorElement>("a[href^='#']");
  if (!link) return;
  const id = link.getAttribute("href")?.slice(1);
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const HEADER_H = 64;
  if (globalThis.__lenis) {
    globalThis.__lenis.scrollTo(el, { offset: -HEADER_H });
  } else {
    const top = el.getBoundingClientRect().top + globalThis.scrollY - HEADER_H;
    globalThis.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  }
  history.replaceState(null, "", `#${id}`);
});

// ── Custom cursor ──────────────────────────────────────────────────────────
const supportsHover = globalThis.matchMedia("(hover: hover)").matches;
if (supportsHover && !reducedMotion) {
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mx = globalThis.innerWidth / 2;
  let my = globalThis.innerHeight / 2;
  let rx = mx;
  let ry = my;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
  });

  const tick = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const SELECTOR = "a, button, [data-cursor-grow], summary, input, textarea";
  document.addEventListener("mouseover", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest(SELECTOR)) ring.classList.add("is-grow");
  });
  document.addEventListener("mouseout", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest(SELECTOR)) ring.classList.remove("is-grow");
  });
  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity = "1";
    ring.style.opacity = "1";
  });
  document.documentElement.classList.add("has-custom-cursor");
}

// ── Horizontal-scroll sections ─────────────────────────────────────────────
const horizSections = document.querySelectorAll<HTMLElement>("[data-horizontal-scroll]");
if (horizSections.length > 0 && !reducedMotion) {
  const updateAll = () => {
    for (const section of horizSections) {
      const rect = section.getBoundingClientRect();
      const sectionH = section.offsetHeight;
      const winH = globalThis.innerHeight;
      const scrolled = -rect.top;
      const range = sectionH - winH;
      const progress = Math.max(0, Math.min(1, scrolled / range));

      const track = section.querySelector<HTMLElement>("[data-track]");
      if (!track) continue;
      const distance = track.scrollWidth - globalThis.innerWidth;
      track.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;

      const dots = section.querySelectorAll<HTMLElement>("[data-progress-dot]");
      if (dots.length > 0) {
        const activeIdx = Math.round(progress * (dots.length - 1));
        dots.forEach((dot, i) => {
          dot.style.backgroundColor = i <= activeIdx ? "var(--accent)" : "";
          dot.style.width = i === activeIdx ? "32px" : "";
        });
      }
    }
  };
  if (globalThis.__lenis) {
    globalThis.__lenis.on("scroll", updateAll);
  } else {
    globalThis.addEventListener("scroll", updateAll, { passive: true });
  }
  globalThis.addEventListener("resize", updateAll);
  updateAll();
}

// ── Hero parallax ──────────────────────────────────────────────────────────
const parallaxTargets = document.querySelectorAll<HTMLElement>("[data-parallax]");
if (parallaxTargets.length > 0 && !reducedMotion) {
  const update = () => {
    const y = globalThis.scrollY;
    for (const el of parallaxTargets) {
      const speed = Number.parseFloat(el.dataset.parallax || "0.2");
      el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
    }
  };
  if (globalThis.__lenis) {
    globalThis.__lenis.on("scroll", update);
  } else {
    globalThis.addEventListener("scroll", update, { passive: true });
  }
  update();
}
