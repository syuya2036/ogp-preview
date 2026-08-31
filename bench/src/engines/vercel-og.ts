import { createRequire } from "node:module";
import { dirname } from "node:path";
import { Card } from "../card.js";
import { HEIGHT, WIDTH, type EngineModule } from "../types.js";

/**
 * The de-facto standard: satori plus a WASM build of resvg, PNG only.
 *
 * Its published Node build (1.0.2) is an ES module that still contains an
 * esbuild `require` shim and a bare `__dirname` for harfbuzz's emscripten
 * loader — fine inside Next.js, which supplies both, but it throws under plain
 * `node`. We provide them here so the engine can be measured at all. That is
 * itself a finding, not a workaround to hide: the package is only really
 * supported inside a bundler.
 */
const require_ = createRequire(import.meta.url);
const ogRequire = createRequire(require_.resolve("@vercel/og"));
const globals = globalThis as Record<string, unknown>;
globals.require ??= require_;
// harfbuzz resolves hb.wasm as `__dirname + "/hb.wasm"`, and it is the bundle's
// only use of __dirname, so pointing it at harfbuzzjs is enough.
globals.__dirname ??= dirname(ogRequire.resolve("harfbuzzjs"));

const { ImageResponse } = await import("@vercel/og");

const mod: EngineModule = {
	id: "vercel-og",
	label: "@vercel/og (satori + resvg-wasm)",
	formats: ["png"],
	async create(fonts) {
		const ogFonts = fonts.map((f) => ({
			name: f.name,
			data: f.data,
			weight: f.weight,
			style: f.style,
		}));

		return {
			id: mod.id,
			label: mod.label,
			formats: mod.formats,
			async render(props) {
				const res = new ImageResponse(Card(props), {
					width: WIDTH,
					height: HEIGHT,
					fonts: ogFonts,
				});
				return new Uint8Array(await res.arrayBuffer());
			},
		};
	},
};

export default mod;
