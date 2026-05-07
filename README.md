# Tubelane web — `tubelane.in`

Marketing site for Tubelane. Static-only, terminal-aesthetic, scroll-animated.

## Stack

- **Astro 5** — static site generator. Zero JS by default, partial hydration where needed.
- **Tailwind CSS v4** — same `surface-*` + `brand-*` palette as the desktop app.
- **TypeScript (strict)**.
- **`@astrojs/sitemap`** — auto-generates `sitemap-index.xml` at build.
- **Vanilla `IntersectionObserver`** — scroll reveal (no framework runtime cost).
- **Inter** + **JetBrains Mono** — same fonts as the app, loaded via Google Fonts with preconnect.

## Quick start

```bash
cd web
npm install
npm run dev      # http://localhost:4321
npm run build    # static build → ./dist
npm run preview  # preview the production build
```

## Project layout

```
web/
├── astro.config.mjs        # site origin, sitemap integration, prefetch policy
├── public/
│   ├── favicon.svg         # SVG icon (matches the app)
│   ├── robots.txt          # allow all + sitemap pointer
│   └── og.png              # ⚠ PLACEHOLDER — replace before launch (see prompts below)
├── src/
│   ├── components/
│   │   ├── Nav.astro       # sticky terminal-style top nav
│   │   ├── Hero.astro      # type-on terminal + product wordmark + CTAs
│   │   ├── Pipeline.astro  # 6-stage orchestration cards
│   │   ├── Models.astro    # full LLM / Voice / Vision stack list
│   │   ├── HowItWorks.astro
│   │   ├── FAQ.astro       # native <details>/<summary>, FAQPage JSON-LD
│   │   ├── CTA.astro       # email capture + DM CTA
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Base.astro      # <head> with full SEO meta + structured data
│   ├── pages/
│   │   └── index.astro     # the landing page
│   ├── scripts/
│   │   └── scroll-reveal.ts # IntersectionObserver + hero typing
│   └── styles/
│       └── globals.css     # Tailwind theme + surface palette + reveal CSS
└── tsconfig.json
```

## SEO checklist

Already implemented:

- ✅ `<title>` + `<meta description>` per-page
- ✅ Canonical `<link rel="canonical">`
- ✅ OpenGraph tags (`og:type`, `og:title`, `og:description`, `og:url`, `og:image` 1200×630)
- ✅ Twitter card (`summary_large_image`)
- ✅ JSON-LD `SoftwareApplication` + `Organization` in `<head>`
- ✅ JSON-LD `FAQPage` for FAQ section (rich-result eligible)
- ✅ `sitemap-index.xml` auto-generated at build
- ✅ `robots.txt` with sitemap pointer
- ✅ Inline critical CSS (`build.inlineStylesheets: "auto"`)
- ✅ Viewport prefetching (`prefetch.defaultStrategy: "viewport"`)
- ✅ Theme colour + Apple touch icon
- ✅ Reduced-motion fallbacks for typing + reveal

Before deploy:

- [ ] Replace `public/og.png` with the generated 1200×630 hero graphic (prompt below)
- [ ] Replace `public/apple-touch-icon.png` with a 180×180 PNG
- [ ] Update Twitter handle in `Footer.astro` and `CTA.astro` (currently `@tubelane`)
- [ ] Wire the `<form>` `action=` in `CTA.astro` to your real form endpoint (Formspree / Beehiiv / Resend)
- [ ] Verify `astro.config.mjs` `site:` is `https://tubelane.in` (it is)
- [ ] Add Google Search Console verification meta or DNS TXT
- [ ] Add Plausible / Umami / Fathom analytics snippet (privacy-first; skip Google Analytics)

## Image generation prompts

Run these in **Tubelane Image Studio** (or Imagen 4 Ultra / Gemini 3 Pro Image directly). All at **16:9 aspect ratio** unless noted.

### `og.png` — OpenGraph hero (1200×630)

```
Modern launch graphic for a software product called "Tubelane".
Centred wordmark "TUBELANE" in bold white sans-serif on a deep
black-to-charcoal gradient background. Below the wordmark, a
horizontal pipeline of six small floating UI cards connected by
glowing cyan-teal lines: card icons depict (left-to-right)
script document, audio waveform, image grid, captions, play
triangle, upload arrow. Subtle dotted-grid texture in the
background. Premium tech-launch aesthetic, Apple keynote
quality. 1200x630, generous padding, no extra text.
```

Crop / resize to exactly 1200×630 before saving.

### `apple-touch-icon.png` — iOS bookmark icon (180×180)

```
Square app icon, 180x180 px. Rounded square with deep black
gradient background. Centred glowing cyan-teal orbital ring
with a white play triangle inside it. Premium minimalist
aesthetic, Apple HIG proportions. No text. No watermark.
```

### Optional: `social-card-pipeline.png` — for blog posts (1200×675)

```
Wide horizontal infographic style: six floating glass-morphism
cards arranged left-to-right against a deep navy gradient
background. Each card represents a generative AI step (script,
voice, scene plan, images, captions, upload). Cards connected
by glowing thin cyan-teal flow lines with directional arrows.
Numbered 01–06. Tech keynote aesthetic, generous padding,
1200x675, no text on the cards themselves.
```

### Optional: hero screenshot mockup

```
Dramatic 3/4 product shot of a MacBook Pro 14-inch on a deep
black surface, screen showing a dark video editor UI with
amber audio waveform, image scenes on a video timeline, and
subtitle text. Soft cyan-teal rim lighting from behind the
laptop. Cinematic depth-of-field, slight reflection on
surface. Premium product-launch photography aesthetic.
1200x900.
```

## Deployment

This site is fully static — deploy anywhere that serves files:

| Host | Why it works |
|---|---|
| **Cloudflare Pages** | Free, edge caching, unlimited bandwidth, build-from-Git |
| **Vercel** | Auto-deploys on push, edge functions if needed later |
| **Netlify** | Form handling built-in (replace Formspree action) |
| **GitHub Pages** | Free, simple, 100GB bandwidth |

For Cloudflare Pages:

1. Connect repo
2. Build command: `cd web && npm install && npm run build`
3. Build output directory: `web/dist`
4. Custom domain: `tubelane.in`

## Performance targets

The page is built to score 95+ on Lighthouse out of the box:

- Total page weight: ~50 KB (gzipped) inc. fonts
- 0 KB of framework runtime JS (no React / Vue / etc)
- Inlined critical CSS
- System-font fallback while Inter loads
- Single image (OG) loaded only when shared

Run after deploy:

```bash
npx unlighthouse --site https://tubelane.in
```

## Notes

- The hero "typing" effect runs on first scroll-into-view, not page load — feels less blocky than typing during the initial paint.
- Scroll reveal is one-shot (`unobserve` after first reveal) to avoid any work on subsequent scrolls.
- The terminal grid background uses CSS `mask-image` to fade at the edges — no SVG/raster overhead.
- All sections respect `prefers-reduced-motion`. Visitors with motion-sensitivity see the content immediately, no animation.
# tubelane-web
