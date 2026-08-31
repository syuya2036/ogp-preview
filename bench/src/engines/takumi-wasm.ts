import { fromJsx } from "@takumi-rs/helpers/jsx";
import { Renderer } from "@takumi-rs/wasm/node";
import { Card } from "../card.js";
import { HEIGHT, WIDTH, type EngineModule, type OutFormat } from "../types.js";

/** The runner only asks for `formats`, but takumi's own union excludes AVIF. */
const takumiFormat = (f: OutFormat) => {
	if (f === "avif") throw new Error("takumi cannot encode AVIF");
	return f;
};

/**
 * The same engine compiled to WebAssembly — this is what actually ships to
 * Cloudflare Workers / Vercel Edge. Importing it instantiates a ~3.8 MB module,
 * so the interesting number here is the cold one.
 *
 * WebP on the wasm backend is lossless only, so its size is not comparable with
 * the native backend's quality-80 WebP.
 */
const mod: EngineModule = {
	id: "takumi-wasm",
	label: "takumi @takumi-rs/wasm",
	formats: ["png", "webp", "jpeg"],
	formatNotes: { webp: "lossless (wasm has no lossy WebP)", jpeg: "quality 80" },
	async create(fonts) {
		const renderer = new Renderer();
		for (const f of fonts) {
			await renderer.registerFont({
				name: f.name,
				data: f.data,
				weight: f.weight,
				style: f.style,
			});
		}

		return {
			id: mod.id,
			label: mod.label,
			formats: mod.formats,
			async render(props, format) {
				const { node, css } = await fromJsx(Card(props));
				return await renderer.render(node, {
					width: WIDTH,
					height: HEIGHT,
					format: takumiFormat(format),
					quality: format === "jpeg" ? 80 : undefined,
					css,
				});
			},
		};
	},
};

export default mod;
