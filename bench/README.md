# OGP renderer benchmark

Measures what it actually costs to generate a 1200×630 Open Graph card **per
request** — cold start, warm latency, and output size — across every JSX-to-image
approach worth considering in 2026.

The question this exists to answer: *is there room for a new tool, or is the
gap somewhere other than the renderer?*

**[→ Full results: `results/report.md`](results/report.md)** ([raw JSON](results/results.json))

## Engines compared

| id | what it is |
| --- | --- |
| `satori-resvg` | [satori](https://github.com/vercel/satori) emits SVG → [@resvg/resvg-js](https://github.com/yisibl/resvg-js) rasterizes (native) |
| `satori-sharp` | satori → [sharp](https://sharp.pixelplumbing.com/) / libvips. The only satori path that can emit WebP or AVIF |
| `vercel-og` | [@vercel/og](https://vercel.com/docs/og-image-generation) 1.0.2 — satori + resvg compiled to WASM. PNG only |
| `takumi-native` | [takumi](https://takumi.kane.tw/) `@takumi-rs/core` — one Rust engine, JSX in, encoded bytes out, no SVG step |
| `takumi-wasm` | the same engine as WASM (`@takumi-rs/wasm`), which is what ships to Workers / Edge |
| `chromium` | headless Chromium via Playwright — the accuracy baseline |

## Running it

```bash
npm install
npm run setup   # fetches ~10 MB of fonts + the background photo
npm run bench   # ~15 min for the full matrix

# or a slice
npm run build && node dist/bench.js --engines takumi-native,vercel-og --cases photo
```

Flags: `--engines`, `--cases` (`latin`, `japanese`, `photo`), `--iterations`,
`--warmup`, `--cold-runs`. Rendered images land in `out/`, numbers in `results/`.

## How it is kept fair

- **One design, one source.** The style objects in `src/design.ts` feed both the
  JSX template (`src/card.tsx`) and the HTML one (`src/card-html.ts`), so
  Chromium cannot be rendering a different card. The design stays inside
  satori's subset — flexbox, inline styles, no grid, no pseudo-elements — so the
  faster engines are not simply being asked to do less.
- **One process per engine.** `run-one.ts` measures a single (engine, case) pair
  in a fresh process. Cold start means nothing in a process that already loaded
  five other renderers.
- **Cold start is split** into fonts-read / import / setup / first-render, plus
  total since process start, because those four move very differently.
- **Props vary every iteration.** Rendering the same string 30 times lets an
  engine's glyph cache flatter itself.
- **Fonts are per case.** The Latin cases register ~0.6 MB of Inter; the
  Japanese case registers ~9.7 MB of Inter + Noto Sans JP.
- **Every engine gets its best setup**: long-lived renderer with fonts
  pre-registered, one long-lived browser page with fonts already in cache, and
  Chromium is handed the background photo over a cached local URL rather than
  the ~290 KB base64 data URI that satori and takumi require.
- **A guard against a flattering bug.** The Chromium adapter asserts the title
  actually resolved to Inter. It caught a real one: a quoted font family closed
  the `style="…"` attribute early, and Chromium silently rendered the card in a
  serif fallback — faster, smaller, and a different image.

## What the numbers say

Headline figures, 4 vCPU cloud box, Node 22 (see the report for the full matrix):

| | cold start | warm p50 (PNG) | photo card as PNG | as WebP q80 |
| --- | ---: | ---: | ---: | ---: |
| takumi (native) | **121 ms** | **27 ms** | 981 KB | **69 KB @ 73 ms** |
| takumi (wasm) | 259 ms | 42 ms | 981 KB | 632 KB (lossless only) |
| @vercel/og | 485 ms | 75 ms | 1045 KB | *not supported* |
| satori + sharp | 545 ms | 79 ms | 1045 KB | 57 KB @ 188 ms |
| satori + resvg | 486 ms | 97 ms | 1011 KB | *not supported* |
| headless Chromium | 1247 ms | 239 ms | 825 KB | *not supported* |

**1. The rasterizer is a solved problem — don't write another one.** takumi is
2.8× faster warm and 4× faster cold than `@vercel/og`, with broader CSS support
(grid, block/inline, `calc()`, pseudo-elements) on top. Any new tool should sit
*on* it, not compete with it.

**2. Output format is worth 15×, and it is free.** The same photo card is
1045 KB as PNG and 69 KB as WebP — and the WebP is **also 1.6× faster to
produce** (73 ms vs 118 ms), because encoding photographic content into PNG is
expensive. `@vercel/og` cannot emit anything but PNG, which is exactly the
[complaint](https://github.com/vercel/next.js/discussions/60366) about cards
being too heavy for WhatsApp's 300 KB limit. This is the single largest
unclaimed win in the whole space, and it needs no new rendering technology.

**3. Cold start is dominated by module import, not by rendering.** The satori
family spends 150–270 ms importing before it does any work; takumi's native
binding spends 20 ms. On a per-request path where images are not cached, that
import cost is most of the request.

**4. Big CJK fonts cost far less than expected — my earlier guess was wrong.**
Going from 0.6 MB to 9.7 MB of registered fonts changes takumi's first render by
nothing at all (38 ms → 36 ms; font registration goes 3.6 ms → 14 ms). satori
does pay: first render 228 ms → 402 ms. So **dynamic font subsetting is not the
render-time win it looked like** — for takumi it would only reduce the bytes you
ship to an edge runtime, which is a bundle-size argument, not a latency one.

**5. Chromium's problem is its PNG encoder, not its rendering.** It screenshots
to JPEG in 34 ms — competitive with takumi — but to PNG in 239 ms. It still
loses overall on 1.2–1.4 s cold start and ~200 MB RSS, but the usual "browsers
are slow" framing is too coarse.

**6. AVIF is a build-time format, full stop.** 1.7 s for a flat card, 5.1 s with
a photo. Wonderful ratios (48 KB), unusable per request.

**7. WebP on the WASM backend is a trap.** It is lossless-only there, so the
photo card comes out at 632 KB — worse than the JPEG and 9× the native backend's
lossy WebP. An edge deployment that switches to WebP expecting the native
numbers gets almost none of the win.

### So: what is worth building

Not a renderer. The measurements point at a layer *above* takumi:

- **Format policy as a first-class feature** — default WebP, negotiate on
  `Accept`, enforce a byte budget (`maxBytes: 300_000` → drop quality until it
  fits). Worth 15× on real cards; nothing packages it today.
- **A typed template registry** — `defineTemplate({ props: schema, render })`,
  with URL encoding/decoding and signing derived from the props type. Signing is
  not optional on a public endpoint: unsigned arbitrary props is a rendering DoS.
- **One API for build time and request time**, plus an ETag/cache layer keyed on
  template version + props hash. Given a 27 ms warm render and a 121 ms cold
  one, caching policy matters more than shaving further milliseconds.
- Framework-independent. [Nuxt OG Image](https://nuxtseo.com/docs/og-image/getting-started/introduction)
  already does much of this well — and only for Nuxt.

## Limitations

Worth knowing before quoting any of this:

- **One machine** (4 vCPU shared cloud instance). Ratios should carry; absolute
  numbers will not.
- **Node only.** `takumi-wasm` under Node is a *proxy* for edge behaviour, not a
  measurement of it — real Workers cold start adds isolate boot and WASM
  compilation, and the 3.8 MB module is the thing that would hurt there.
- **Sequential renders.** No concurrency or throughput numbers. takumi's native
  binding moves rendering off the event loop into a worker pool, so the gap
  under load may be wider than these single-shot figures suggest.
- **One design.** No Tailwind (`tw`) classes, no emoji, no remote images, no
  animation, no grid — the design deliberately stays inside satori's subset, so
  takumi's extra CSS support is not exercised.
- `@vercel/og` 1.0.2's published Node ESM build does not run under plain `node`:
  it still contains an esbuild `require` shim and a bare `__dirname`, which only
  a bundler supplies. `src/engines/vercel-og.ts` provides both. That is a real
  finding about the package, not a thumb on the scale.

## Next steps

1. Re-run `takumi-wasm` on a real Cloudflare Worker and on Vercel Edge, where
   the 3.8 MB module actually has to be instantiated per isolate.
2. Measure concurrency: N parallel renders, p99 under load.
3. Prototype the format-negotiation and byte-budget layer over takumi and check
   the 15× holds across a spread of real cards.
