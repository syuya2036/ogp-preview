# OGP renderer benchmark

1200×630 card, same design across every engine. 30 measured renders after 5 warmups; cold start is the median of 3 fresh processes.

Environment:

- Node v22.22.2, linux/x64
- 4× Intel(R) Xeon(R) Processor @ 2.80GHz, 16 GB RAM

## Latin — flat gradient (Inter, ~0.6 MB of fonts)

### Cold start (fresh process, one image)

| engine | fonts read | import | setup | first render | total from process start |
| --- | ---: | ---: | ---: | ---: | ---: |
| satori + @resvg/resvg-js (native) | 0.7 ms | 213.1 ms | 0.9 ms | 227.6 ms | **485.8 ms** |
| satori + sharp (libvips) | 1.1 ms | 267.4 ms | 1.0 ms | 206.2 ms | **544.7 ms** |
| @vercel/og (satori + resvg-wasm) | 0.7 ms | 164.9 ms | 0.1 ms | 269.6 ms | **484.7 ms** |
| takumi @takumi-rs/core (napi) | 0.7 ms | 20.2 ms | 3.6 ms | 38.2 ms | **120.8 ms** |
| takumi @takumi-rs/wasm | 0.9 ms | 37.1 ms | 14.9 ms | 145.1 ms | **259.0 ms** |
| headless Chromium (playwright) | 0.8 ms | 581.9 ms | 362.9 ms | 263.0 ms | **1247.2 ms** |

### Warm renders

| engine | format | p50 | p90 | p99 | mean | size | peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| satori + @resvg/resvg-js (native) | png | **97.3 ms** | 104.1 ms | 110.2 ms | 97.5 ms | 130 KB | 258 MB |
| satori + sharp (libvips) | png | **79.2 ms** | 91.2 ms | 93.7 ms | 79.5 ms | 80 KB | 305 MB |
| satori + sharp (libvips) | webp <sub>quality 80</sub> | **133.5 ms** | 145.1 ms | 167.6 ms | 135.8 ms | 23 KB | 305 MB |
| satori + sharp (libvips) | avif <sub>quality 60, effort 4</sub> | **1686.8 ms** | 1792.5 ms | 1810.8 ms | 1679.3 ms | 16 KB | 305 MB |
| @vercel/og (satori + resvg-wasm) | png | **75.1 ms** | 82.9 ms | 99.1 ms | 75.6 ms | 80 KB | 184 MB |
| takumi @takumi-rs/core (napi) | png | **27.2 ms** | 29.9 ms | 32.3 ms | 27.7 ms | 52 KB | 98 MB |
| takumi @takumi-rs/core (napi) | webp <sub>quality 80 (lossy)</sub> | **34.6 ms** | 41.0 ms | 47.3 ms | 35.4 ms | 33 KB | 98 MB |
| takumi @takumi-rs/core (napi) | jpeg <sub>quality 80</sub> | **38.4 ms** | 42.3 ms | 52.9 ms | 39.2 ms | 68 KB | 98 MB |
| takumi @takumi-rs/wasm | png | **41.9 ms** | 45.9 ms | 51.0 ms | 42.2 ms | 52 KB | 141 MB |
| takumi @takumi-rs/wasm | webp <sub>lossless (wasm has no lossy WebP)</sub> | **31.5 ms** | 33.6 ms | 34.4 ms | 31.8 ms | 109 KB | 141 MB |
| takumi @takumi-rs/wasm | jpeg <sub>quality 80</sub> | **64.7 ms** | 69.1 ms | 88.6 ms | 65.9 ms | 68 KB | 141 MB |
| headless Chromium (playwright) | png | **238.6 ms** | 252.7 ms | 260.4 ms | 239.3 ms | 302 KB | 193 MB |
| headless Chromium (playwright) | jpeg <sub>quality 80</sub> | **33.8 ms** | 36.5 ms | 43.7 ms | 33.9 ms | 46 KB | 193 MB |

## Japanese — flat gradient (Inter + Noto Sans JP, ~9.7 MB of fonts)

### Cold start (fresh process, one image)

| engine | fonts read | import | setup | first render | total from process start |
| --- | ---: | ---: | ---: | ---: | ---: |
| satori + @resvg/resvg-js (native) | 8.5 ms | 198.4 ms | 0.9 ms | 402.2 ms | **661.7 ms** |
| satori + sharp (libvips) | 8.7 ms | 263.8 ms | 1.0 ms | 409.4 ms | **739.6 ms** |
| @vercel/og (satori + resvg-wasm) | 8.3 ms | 153.2 ms | 0.1 ms | 458.1 ms | **677.5 ms** |
| takumi @takumi-rs/core (napi) | 8.5 ms | 19.4 ms | 14.1 ms | 35.7 ms | **130.1 ms** |
| takumi @takumi-rs/wasm | 8.1 ms | 36.4 ms | 29.6 ms | 137.3 ms | **265.9 ms** |
| headless Chromium (playwright) | 7.2 ms | 587.6 ms | 491.1 ms | 255.0 ms | **1393.4 ms** |

### Warm renders

| engine | format | p50 | p90 | p99 | mean | size | peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| satori + @resvg/resvg-js (native) | png | **91.5 ms** | 95.2 ms | 98.2 ms | 92.0 ms | 136 KB | 326 MB |
| satori + sharp (libvips) | png | **65.1 ms** | 75.0 ms | 92.8 ms | 67.2 ms | 89 KB | 317 MB |
| satori + sharp (libvips) | webp <sub>quality 80</sub> | **115.7 ms** | 144.2 ms | 167.7 ms | 119.3 ms | 27 KB | 317 MB |
| satori + sharp (libvips) | avif <sub>quality 60, effort 4</sub> | **1674.8 ms** | 1756.4 ms | 1818.7 ms | 1681.6 ms | 18 KB | 317 MB |
| @vercel/og (satori + resvg-wasm) | png | **65.7 ms** | 71.4 ms | 89.9 ms | 67.0 ms | 89 KB | 255 MB |
| takumi @takumi-rs/core (napi) | png | **27.2 ms** | 30.7 ms | 31.3 ms | 27.8 ms | 58 KB | 117 MB |
| takumi @takumi-rs/core (napi) | webp <sub>quality 80 (lossy)</sub> | **32.3 ms** | 34.2 ms | 35.8 ms | 32.5 ms | 38 KB | 117 MB |
| takumi @takumi-rs/core (napi) | jpeg <sub>quality 80</sub> | **38.0 ms** | 51.3 ms | 58.5 ms | 39.8 ms | 71 KB | 117 MB |
| takumi @takumi-rs/wasm | png | **40.2 ms** | 42.4 ms | 43.2 ms | 40.3 ms | 58 KB | 164 MB |
| takumi @takumi-rs/wasm | webp <sub>lossless (wasm has no lossy WebP)</sub> | **31.0 ms** | 34.9 ms | 43.3 ms | 31.7 ms | 115 KB | 164 MB |
| takumi @takumi-rs/wasm | jpeg <sub>quality 80</sub> | **63.8 ms** | 66.7 ms | 67.4 ms | 63.9 ms | 71 KB | 164 MB |
| headless Chromium (playwright) | png | **242.7 ms** | 251.8 ms | 257.3 ms | 240.7 ms | 309 KB | 207 MB |
| headless Chromium (playwright) | jpeg <sub>quality 80</sub> | **33.4 ms** | 37.4 ms | 55.7 ms | 34.6 ms | 54 KB | 207 MB |

## Latin — full-bleed background photo (1200×630 JPEG behind a scrim)

### Cold start (fresh process, one image)

| engine | fonts read | import | setup | first render | total from process start |
| --- | ---: | ---: | ---: | ---: | ---: |
| satori + @resvg/resvg-js (native) | 0.7 ms | 216.1 ms | 1.1 ms | 327.5 ms | **605.7 ms** |
| satori + sharp (libvips) | 0.7 ms | 238.0 ms | 0.9 ms | 332.4 ms | **627.4 ms** |
| @vercel/og (satori + resvg-wasm) | 0.8 ms | 167.2 ms | 0.1 ms | 403.2 ms | **637.5 ms** |
| takumi @takumi-rs/core (napi) | 0.8 ms | 22.6 ms | 4.2 ms | 137.8 ms | **236.0 ms** |
| takumi @takumi-rs/wasm | 0.7 ms | 34.1 ms | 14.2 ms | 257.0 ms | **350.5 ms** |
| headless Chromium (playwright) | 0.9 ms | 577.3 ms | 368.4 ms | 421.3 ms | **1446.7 ms** |

### Warm renders

| engine | format | p50 | p90 | p99 | mean | size | peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| satori + @resvg/resvg-js (native) | png | **172.8 ms** | 181.1 ms | 212.5 ms | 173.5 ms | 1011 KB | 333 MB |
| satori + sharp (libvips) | png | **173.9 ms** | 181.0 ms | 194.5 ms | 173.6 ms | 1045 KB | 391 MB |
| satori + sharp (libvips) | webp <sub>quality 80</sub> | **187.9 ms** | 199.6 ms | 218.8 ms | 188.4 ms | 57 KB | 391 MB |
| satori + sharp (libvips) | avif <sub>quality 60, effort 4</sub> | **5138.8 ms** | 5303.9 ms | 5882.0 ms | 5173.2 ms | 48 KB | 391 MB |
| @vercel/og (satori + resvg-wasm) | png | **180.3 ms** | 200.5 ms | 213.3 ms | 182.5 ms | 1045 KB | 315 MB |
| takumi @takumi-rs/core (napi) | png | **117.7 ms** | 125.1 ms | 131.9 ms | 118.3 ms | 981 KB | 119 MB |
| takumi @takumi-rs/core (napi) | webp <sub>quality 80 (lossy)</sub> | **72.7 ms** | 77.7 ms | 79.7 ms | 72.8 ms | 69 KB | 119 MB |
| takumi @takumi-rs/core (napi) | jpeg <sub>quality 80</sub> | **72.3 ms** | 78.8 ms | 109.3 ms | 74.3 ms | 116 KB | 119 MB |
| takumi @takumi-rs/wasm | png | **133.2 ms** | 137.6 ms | 138.8 ms | 133.4 ms | 981 KB | 140 MB |
| takumi @takumi-rs/wasm | webp <sub>lossless (wasm has no lossy WebP)</sub> | **72.9 ms** | 77.8 ms | 82.7 ms | 73.4 ms | 632 KB | 140 MB |
| takumi @takumi-rs/wasm | jpeg <sub>quality 80</sub> | **99.2 ms** | 103.6 ms | 107.2 ms | 99.7 ms | 116 KB | 140 MB |
| headless Chromium (playwright) | png | **379.1 ms** | 394.3 ms | 401.0 ms | 379.1 ms | 825 KB | 192 MB |
| headless Chromium (playwright) | jpeg <sub>quality 80</sub> | **34.5 ms** | 51.8 ms | 60.1 ms | 39.9 ms | 97 KB | 192 MB |

